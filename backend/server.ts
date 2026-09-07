import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { SegmentedDownloader, ChunkDownloadProgress } from './chunkDownloader';
import { torrentManager } from './torrentManager';
import { FtpPack, FtpDownloadProgress } from './featurePacks/ftpPack';
import { GitHubPack } from './featurePacks/githubPack';
import { HuggingFacePack } from './featurePacks/huggingfacePack';
import { Ed2kPack } from './featurePacks/ed2kPack';
import { pluginManager } from './plugins/PluginManager';
import { accountManager } from './accounts/AccountManager';
import { ExportManager } from './exporters/ExportManager';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const pythonScript = path.join(__dirname, 'downloader.py');

// Temp directory for downloads
const TEMP_DIR = path.join(__dirname, 'temp_downloads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

interface LogItem {
  id: string;
  time: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'system';
  message: string;
}

interface Job {
  id: string;
  url: string;
  formatId: string;
  title: string;
  extension: string;
  status: 'ready' | 'downloading' | 'completed' | 'error';
  progress: number;
  speed: string;
  eta: string;
  logs: LogItem[];
  filePath: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}

const jobs: Record<string, Job> = {};

// Active segmented chunk jobs
interface ChunkJob {
  id: string;
  url: string;
  title: string;
  fileName: string;
  filePath: string;
  downloader: SegmentedDownloader;
  progress: ChunkDownloadProgress;
}
const chunkJobs: Record<string, ChunkJob> = {};
const chunkEvents = new EventEmitter();
chunkEvents.setMaxListeners(200);

// Feature Pack instances
const githubPack = new GitHubPack();
const huggingFacePack = new HuggingFacePack();
const ed2kPack = new Ed2kPack();

interface FtpJob {
  id: string;
  url: string;
  fileName: string;
  filePath: string;
  pack: FtpPack;
  progress: FtpDownloadProgress;
  status: 'downloading' | 'completed' | 'error';
  error?: string;
}
const ftpJobs: Record<string, FtpJob> = {};

/**
 * Security: Validate URL against SSRF & malicious protocols
 */
function isValidExternalUrl(rawUrl: string): boolean {
  try {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('magnet:?')) return true;
    if (trimmed.toLowerCase().startsWith('ed2k://')) return true;
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'ftp:' && parsed.protocol !== 'ftps:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function addJobLog(job: Job, type: LogItem['type'], message: string) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  job.logs.push({
    id: Math.random().toString(36).substring(2, 9),
    time: timeStr,
    type,
    message
  });
}

// Clean up downloaded files older than 1 hour periodically
setInterval(() => {
  const oneHourAgo = Date.now() - 3600 * 1000;
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (stats.mtimeMs < oneHourAgo) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}, 10 * 60 * 1000);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VortexDownloader Universal Engine v0.6.0' });
});

/**
 * 0. URL Probe - Inspect file type, range support, and size
 */
app.get('/api/probe', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || !isValidExternalUrl(targetUrl)) {
    return res.status(400).json({ error: 'Valid URL is required.' });
  }

  if (targetUrl.startsWith('magnet:?')) {
    return res.json({
      type: 'torrent',
      supportsRanges: false,
      contentLength: 0,
      contentType: 'application/x-bittorrent',
      isDirectFile: false
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const acceptRanges = response.headers.get('accept-ranges') === 'bytes';
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const isDirect = contentLength > 0 && !contentType.includes('text/html');

    res.json({
      type: isDirect ? 'direct' : 'stream',
      supportsRanges: acceptRanges,
      contentLength,
      contentType,
      isDirectFile: isDirect
    });
  } catch (err: any) {
    res.json({
      type: 'stream',
      supportsRanges: false,
      contentLength: 0,
      contentType: 'unknown',
      isDirectFile: false
    });
  }
});

/**
 * 1. GET /api/info - Fetch video / media metadata
 */
app.get('/api/info', (req, res) => {
  const videoUrl = req.query.url as string;
  if (!videoUrl || !isValidExternalUrl(videoUrl)) {
    return res.status(400).json({ error: 'Valid HTTP/HTTPS URL parameter is required.' });
  }

  const pythonProcess = spawn('python', [pythonScript, 'info', videoUrl]);

  let stdoutData = '';
  let stderrData = '';

  pythonProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Failed to extract video metadata. Please verify the URL.' });
    }

    try {
      const result = JSON.parse(stdoutData.trim());
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Internal server error while parsing metadata.' });
    }
  });
});

/**
 * 2. POST /api/download - Trigger stream extraction with optional clip slicing
 */
app.post('/api/download', (req, res) => {
  const { url, formatId, title, format, startTime, endTime } = req.body;

  if (!url || !formatId || !title || !format || !isValidExternalUrl(url)) {
    return res.status(400).json({ error: 'Valid parameters (url, formatId, title, format) required.' });
  }

  const jobId = Math.random().toString(36).substring(2, 15);
  const sanitizedTitle = String(title).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
  const extension = String(format).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10) || 'mp4';
  const fileName = `${sanitizedTitle}_${jobId}.${extension}`;
  const filePath = path.resolve(TEMP_DIR, fileName);

  if (!filePath.startsWith(path.resolve(TEMP_DIR))) {
    return res.status(400).json({ error: 'Invalid destination path.' });
  }

  const job: Job = {
    id: jobId,
    url,
    formatId,
    title: sanitizedTitle,
    extension,
    status: 'downloading',
    progress: 0,
    speed: '0.0 MB/s',
    eta: '0s',
    logs: [],
    filePath,
    startTime: startTime ? String(startTime) : undefined,
    endTime: endTime ? String(endTime) : undefined
  };

  jobs[jobId] = job;
  addJobLog(job, 'info', `Initialized extraction for job ${jobId}`);
  if (startTime || endTime) {
    addJobLog(job, 'info', `Applying pre-download clip slice: ${startTime || '0'}s -> ${endTime || 'END'}s`);
  }

  const pyArgs = [
    pythonScript,
    'download',
    url,
    String(formatId),
    filePath,
    startTime ? String(startTime) : 'none',
    endTime ? String(endTime) : 'none'
  ];

  const pythonProcess = spawn('python', pyArgs);

  pythonProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      if (cleanLine.startsWith('[PROGRESS]')) {
        const match = cleanLine.match(/\[PROGRESS\]\s+([\d.]+)%\s+\|\s+SPEED:\s+([^\s]+ [^\s]+)\s+\|\s+ETA:\s+([^\s]+)/);
        if (match) {
          job.progress = Math.floor(parseFloat(match[1]));
          job.speed = match[2];
          job.eta = match[3];
        } else if (cleanLine.includes('Stitching')) {
          job.progress = 99;
          addJobLog(job, 'success', 'Multiplex container downloading completed. Compiling streams...');
        }
      } else if (cleanLine.startsWith('[STATUS]')) {
        addJobLog(job, 'info', cleanLine.replace('[STATUS]', '').trim());
      } else if (cleanLine.startsWith('[SUCCESS]')) {
        addJobLog(job, 'success', 'Download finished.');
        job.status = 'completed';
        job.progress = 100;
      } else if (cleanLine.startsWith('[ERROR]')) {
        const errMsg = cleanLine.replace('[ERROR]', '').trim();
        addJobLog(job, 'error', errMsg);
        job.status = 'error';
        job.error = errMsg;
      } else {
        addJobLog(job, 'info', cleanLine);
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    const errLine = data.toString().trim();
    if (errLine) {
      addJobLog(job, 'warning', `Subprocess Warning: ${errLine}`);
    }
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0 && job.status !== 'completed') {
      job.status = 'error';
      job.error = job.error || `Process exited with code ${code}`;
      addJobLog(job, 'error', `Stream extraction ended with code ${code}.`);
    }
  });

  res.json({ jobId });
});

/**
 * 3. GET /api/download/progress - Polling stream extraction progress
 */
app.get('/api/download/progress', (req, res) => {
  const jobId = req.query.jobId as string;
  if (!jobId || !jobs[jobId]) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const job = jobs[jobId];
  res.json({
    status: job.status,
    progress: job.progress,
    speed: job.speed,
    eta: job.eta,
    logs: job.logs,
    error: job.error
  });
});

/**
 * 4. GET /api/download/file - File delivery endpoint
 */
app.get('/api/download/file', (req, res) => {
  const jobId = req.query.jobId as string;
  if (!jobId || !jobs[jobId]) {
    return res.status(404).send('Job not found.');
  }

  const job = jobs[jobId];
  if (job.status !== 'completed' || !fs.existsSync(job.filePath)) {
    return res.status(400).send('File is not ready or has been removed.');
  }

  const originalFilename = `${job.title}.${job.extension}`;
  res.download(job.filePath, originalFilename, (err) => {
    if (!err) {
      setTimeout(() => {
        fs.unlink(job.filePath, () => {});
      }, 5000);
    }
  });
});

/**
 * 5. POST /api/chunk-download - IDM-style Parallel Segmented HTTP Downloader
 */
app.post('/api/chunk-download', async (req, res) => {
  const { url, title, threads = 16, destinationDir } = req.body;
  if (!url || !isValidExternalUrl(url)) {
    return res.status(400).json({ error: 'Valid direct URL is required.' });
  }

  const jobId = 'chunk_' + Math.random().toString(36).substring(2, 12);
  const cleanTitle = (title || 'direct_file').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);

  // Derive extension from URL if possible
  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath) || '.bin';
  const fileName = `${cleanTitle}_${jobId}${ext}`;

  // Direct destination support: If destinationDir is provided and valid, write directly there
  let targetDir = TEMP_DIR;
  let isDirectSave = false;
  if (destinationDir && typeof destinationDir === 'string') {
    try {
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }
      targetDir = destinationDir;
      isDirectSave = true;
    } catch (_) {
      targetDir = TEMP_DIR;
    }
  }

  const filePath = path.resolve(targetDir, fileName);

  const initialProgress: ChunkDownloadProgress = {
    totalBytes: 0,
    downloadedBytes: 0,
    percent: 0,
    speed: '0.0 MB/s',
    speedBytesPerSec: 0,
    eta: '--',
    chunks: [],
    status: 'downloading'
  };

  const downloader = new SegmentedDownloader(url, filePath, threads, (p) => {
    if (chunkJobs[jobId]) {
      chunkJobs[jobId].progress = p;
      chunkEvents.emit(`progress:${jobId}`, p);
    }
  });

  chunkJobs[jobId] = {
    id: jobId,
    url,
    title: cleanTitle,
    fileName,
    filePath,
    downloader,
    progress: initialProgress
  };

  // Launch async download
  downloader.start().catch((err) => {
    if (chunkJobs[jobId]) {
      chunkJobs[jobId].progress.status = 'error';
      chunkJobs[jobId].progress.error = err.message || String(err);
      chunkEvents.emit(`progress:${jobId}`, chunkJobs[jobId].progress);
    }
  });

  res.json({
    jobId,
    fileName,
    filePath,
    isDirectSave,
    status: 'downloading'
  });
});

/**
 * 6a. GET /api/chunk-download/progress - Live telemetry for multi-thread chunks (polling)
 */
app.get('/api/chunk-download/progress', (req, res) => {
  const jobId = req.query.jobId as string;
  if (!jobId || !chunkJobs[jobId]) {
    return res.status(404).json({ error: 'Chunk job not found.' });
  }

  const job = chunkJobs[jobId];
  res.json({
    jobId: job.id,
    fileName: job.fileName,
    ...job.progress
  });
});

/**
 * 6b. GET /api/chunk-download/events/:jobId - Server-Sent Events (SSE) stream for zero-polling real-time telemetry
 */
app.get('/api/chunk-download/events/:jobId', (req, res) => {
  const { jobId } = req.params;
  if (!jobId || !chunkJobs[jobId]) {
    return res.status(404).json({ error: 'Chunk job not found.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const currentJob = chunkJobs[jobId];
  // Initial immediate push
  res.write(`data: ${JSON.stringify({ jobId, fileName: currentJob.fileName, ...currentJob.progress })}\n\n`);

  const onProgress = (p: ChunkDownloadProgress) => {
    res.write(`data: ${JSON.stringify({ jobId, fileName: currentJob.fileName, ...p })}\n\n`);
    if (p.status === 'completed' || p.status === 'error') {
      res.end();
    }
  };

  chunkEvents.on(`progress:${jobId}`, onProgress);

  req.on('close', () => {
    chunkEvents.off(`progress:${jobId}`, onProgress);
  });
});

/**
 * 7. GET /api/chunk-download/file - Download completed chunk file
 */
app.get('/api/chunk-download/file', (req, res) => {
  const jobId = req.query.jobId as string;
  if (!jobId || !chunkJobs[jobId]) {
    return res.status(404).send('Job not found.');
  }

  const job = chunkJobs[jobId];
  if (job.progress.status !== 'completed' || !fs.existsSync(job.filePath)) {
    return res.status(400).send('File is not ready or downloading.');
  }

  res.download(job.filePath, job.fileName, (err) => {
    if (!err) {
      setTimeout(() => {
        fs.unlink(job.filePath, () => {});
      }, 5000);
    }
  });
});

/**
 * 8. BitTorrent & Magnet Endpoints
 */
app.post('/api/torrent/add', async (req, res) => {
  const { magnetURI } = req.body;
  if (!magnetURI || typeof magnetURI !== 'string') {
    return res.status(400).json({ error: 'Valid magnetURI or torrent link required.' });
  }

  try {
    const item = await torrentManager.addTorrent(magnetURI);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to initialize torrent swarm' });
  }
});

app.get('/api/torrent/status', (req, res) => {
  const infoHash = req.query.infoHash as string;
  if (!infoHash) {
    return res.status(400).json({ error: 'infoHash parameter required.' });
  }

  const item = torrentManager.getTorrent(infoHash);
  if (!item) {
    return res.status(404).json({ error: 'Torrent not found.' });
  }

  res.json(item);
});

app.get('/api/torrent/list', (req, res) => {
  res.json(torrentManager.listTorrents());
});

app.delete('/api/torrent/:hash', (req, res) => {
  const hash = req.params.hash;
  const deleted = torrentManager.removeTorrent(hash, req.query.deleteFiles === 'true');
  res.json({ success: deleted });
});

/**
 * 9. Feature Packs Management & Integration Endpoints
 * All packs supported (excluding BilibiliPack per user preference)
 */
app.get('/api/packs', (req, res) => {
  res.json([
    {
      id: 'http',
      name: 'HttpPack',
      version: 'v1.0.1',
      description: '16-pipe IDM-style parallel multi-segmented chunk downloader',
      author: 'Ghost / Vortex Team',
      enabled: true,
      status: 'active'
    },
    {
      id: 'ffmpeg',
      name: 'FFmpegPack',
      version: 'v1.0.1',
      description: 'Stream demuxing, audio/video transcoding, and pre-download clip trimming',
      author: 'FFmpeg Org',
      enabled: true,
      status: 'active'
    },
    {
      id: 'bittorrent',
      name: 'BitTorrentPack',
      version: 'v1.0.1',
      description: 'WebTorrent swarm engine, DHT tracker crawler, and peer-to-peer streaming',
      author: 'WebTorrent',
      enabled: true,
      status: 'active'
    },
    {
      id: 'ed2k',
      name: 'ED2kPack',
      version: 'v1.2.1',
      description: 'eDonkey2000 URI parser, MD4 block hash verifier, and P2P gateway resolver',
      author: 'eDonkey / Ghost',
      enabled: true,
      status: 'active'
    },
    {
      id: 'ftp',
      name: 'FtpPack',
      version: 'v1.0.1',
      description: 'FTP and FTPS secure remote file streaming with real-time speed & ETA telemetry',
      author: 'basic-ftp / Vortex',
      enabled: true,
      status: 'active'
    },
    {
      id: 'github',
      name: 'GitHubPack',
      version: 'v1.0.0',
      description: 'GitHub Release binary inspector, tag resolver, and repository source downloader',
      author: 'GitHub Inc',
      enabled: true,
      status: 'active'
    },
    {
      id: 'huggingface',
      name: 'HuggingFacePack',
      version: 'v1.0.1',
      description: 'AI model weights tree inspector (.safetensors, .gguf, .onnx) and CDN resolver',
      author: 'Hugging Face',
      enabled: true,
      status: 'active'
    },
    {
      id: 'm3u8',
      name: 'M3U8Pack',
      version: 'v1.0.2',
      description: 'HLS adaptive bitrate playlist parser and segment multiplexer',
      author: 'Ghost Engine',
      enabled: true,
      status: 'active'
    },
    {
      id: 'youtube',
      name: 'YouTubePack',
      version: 'v1.1.1',
      description: 'yt-dlp stream extraction for 4K/8K, HDR, WebM/Opus, and subtitle tracks',
      author: 'yt-dlp Project',
      enabled: true,
      status: 'active'
    }
  ]);
});

// FTP Downloader endpoints
app.post('/api/ftp/download', async (req, res) => {
  const { url } = req.body;
  if (!url || (!url.startsWith('ftp://') && !url.startsWith('ftps://'))) {
    return res.status(400).json({ error: 'Valid ftp:// or ftps:// URL is required.' });
  }

  const jobId = 'ftp_' + Math.random().toString(36).substring(2, 12);
  const pack = new FtpPack();
  let info;
  try {
    info = pack.parseUrl(url);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid FTP URL structure.' });
  }

  const job: FtpJob = {
    id: jobId,
    url,
    fileName: info.fileName,
    filePath: path.join(TEMP_DIR, info.fileName),
    pack,
    progress: {
      bytesDownloaded: 0,
      totalBytes: 0,
      percent: 0,
      speed: '0.0 MB/s',
      eta: '--'
    },
    status: 'downloading'
  };

  ftpJobs[jobId] = job;

  pack
    .downloadFile(url, TEMP_DIR, (prog) => {
      if (ftpJobs[jobId]) {
        ftpJobs[jobId].progress = prog;
      }
    })
    .then((result) => {
      if (ftpJobs[jobId]) {
        ftpJobs[jobId].status = 'completed';
        ftpJobs[jobId].filePath = result.filePath;
      }
    })
    .catch((err) => {
      if (ftpJobs[jobId]) {
        ftpJobs[jobId].status = 'error';
        ftpJobs[jobId].error = err.message || String(err);
      }
    });

  res.json({ jobId, fileName: info.fileName, status: 'downloading' });
});

app.get('/api/ftp/progress', (req, res) => {
  const jobId = req.query.jobId as string;
  if (!jobId || !ftpJobs[jobId]) {
    return res.status(404).json({ error: 'FTP job not found.' });
  }
  const job = ftpJobs[jobId];
  res.json({
    jobId: job.id,
    fileName: job.fileName,
    status: job.status,
    error: job.error,
    ...job.progress
  });
});

app.get('/api/ftp/file', (req, res) => {
  const jobId = req.query.jobId as string;
  if (!jobId || !ftpJobs[jobId]) {
    return res.status(404).send('Job not found.');
  }
  const job = ftpJobs[jobId];
  if (job.status !== 'completed' || !fs.existsSync(job.filePath)) {
    return res.status(400).send('File is not ready or downloading.');
  }

  res.download(job.filePath, job.fileName, (err) => {
    if (!err) {
      setTimeout(() => {
        fs.unlink(job.filePath, () => {});
      }, 5000);
    }
  });
});

// GitHub Pack endpoints
app.post('/api/github/inspect', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL parameter required.' });

  const parsed = githubPack.parseUrl(url);
  if (!parsed.isGitHub) {
    return res.status(400).json({ error: 'Not a recognized GitHub repository or release URL.' });
  }

  if (parsed.type === 'raw' || parsed.type === 'blob' || parsed.type === 'release-direct') {
    return res.json({
      type: 'direct',
      directUrl: parsed.directUrl,
      owner: parsed.owner,
      repo: parsed.repo
    });
  }

  try {
    const release = await githubPack.inspectRelease(parsed.owner || '', parsed.repo || '', parsed.tag);
    res.json({
      type: 'release',
      owner: parsed.owner,
      repo: parsed.repo,
      release
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to inspect GitHub release assets.' });
  }
});

// Hugging Face Pack endpoints
app.post('/api/huggingface/inspect', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL parameter required.' });

  const parsed = huggingFacePack.parseUrl(url);
  if (!parsed.isHuggingFace) {
    return res.status(400).json({ error: 'Not a recognized Hugging Face model or dataset URL.' });
  }

  if (parsed.isDirectFile && parsed.directUrl) {
    return res.json({
      type: 'direct',
      directUrl: parsed.directUrl,
      modelId: parsed.modelId,
      filePath: parsed.filePath
    });
  }

  try {
    const modelInfo = await huggingFacePack.inspectModel(parsed.modelId || '', parsed.revision || 'main');
    res.json({
      type: 'model',
      modelInfo
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to inspect Hugging Face model repository.' });
  }
});

// eD2k Pack endpoints
app.post('/api/ed2k/inspect', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL parameter required.' });

  const info = ed2kPack.parseUrl(url);
  if (!info.isValid) {
    return res.status(400).json({ error: info.error || 'Invalid eD2k URI.' });
  }

  res.json({
    type: 'ed2k',
    info
  });
});

/**
 * 10. Modular Plugin Architecture Endpoints
 */
app.get('/api/plugins', (req, res) => {
  res.json({ plugins: pluginManager.listPlugins() });
});

app.post('/api/plugins/resolve', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const resolved = await pluginManager.resolve(url);
    res.json(resolved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to resolve URL' });
  }
});

/**
 * 11. Debrid & Multi-Host Keychain Endpoints
 */
app.get('/api/accounts/list', (req, res) => {
  res.json({ accounts: accountManager.listAccounts() });
});

app.post('/api/accounts/debrid', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'provider and apiKey are required' });
  }

  if (provider === 'real_debrid') {
    const verification = await accountManager.verifyRealDebrid(apiKey);
    if (!verification.success) {
      return res.status(400).json({ error: verification.error });
    }
    return res.json({ success: true, ...verification });
  }

  accountManager.setAccount({
    provider,
    apiKey,
    status: 'active'
  });
  res.json({ success: true });
});

app.delete('/api/accounts/debrid/:provider', (req, res) => {
  const { provider } = req.params;
  accountManager.removeAccount(provider);
  res.json({ success: true });
});

/**
 * 12. Anti-Lock-in Exporters (Metalink 4.0, cURL, aria2, JSON)
 */
function getExportableTasks() {
  return Object.values(chunkJobs).map((j) => ({
    url: j.url,
    fileName: j.fileName,
    fileSize: j.progress.totalBytes > 0 ? j.progress.totalBytes : undefined
  }));
}

app.get('/api/export/curl', (req, res) => {
  const tasks = getExportableTasks();
  const script = ExportManager.toCurlScript(tasks);
  res.setHeader('Content-Type', 'text/x-shellscript');
  res.setHeader('Content-Disposition', 'attachment; filename="vortex_downloads.sh"');
  res.send(script);
});

app.get('/api/export/metalink', (req, res) => {
  const tasks = getExportableTasks();
  const xml = ExportManager.toMetalink(tasks);
  res.setHeader('Content-Type', 'application/metalink4+xml');
  res.setHeader('Content-Disposition', 'attachment; filename="vortex_downloads.meta4"');
  res.send(xml);
});

app.get('/api/export/aria2', (req, res) => {
  const tasks = getExportableTasks();
  const txt = ExportManager.toAria2Input(tasks);
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="vortex_aria2.txt"');
  res.send(txt);
});

app.get('/api/export/json', (req, res) => {
  const tasks = getExportableTasks();
  const json = ExportManager.toJson(tasks);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="vortex_backup.json"');
  res.send(json);
});

/**
 * 13. aria2-Compatible JSON-RPC Endpoint (/jsonrpc and /rpc)
 * Enables browser extensions (Aria2 Explorer, etc.) to inject downloads directly!
 */
const handleAria2Rpc = async (req: express.Request, res: express.Response) => {
  const body = req.body || {};
  const method = body.method;
  const id = body.id || '1';
  const params = body.params || [];

  // Support token secret prefix in params e.g. ["token:mysecret", [url]]
  let realParams = params;
  if (Array.isArray(params) && typeof params[0] === 'string' && params[0].startsWith('token:')) {
    realParams = params.slice(1);
  }

  if (method === 'aria2.getVersion') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        version: '1.36.0',
        enabledFeatures: ['Async DNS', 'BitTorrent', 'Firefox3 Cookie', 'GZip', 'HTTPS', 'Message Digest', 'Metalink', 'XML-RPC']
      }
    });
  }

  if (method === 'aria2.addUri') {
    const uris = realParams[0];
    const targetUrl = Array.isArray(uris) ? uris[0] : uris;
    if (!targetUrl || !isValidExternalUrl(targetUrl)) {
      return res.status(400).json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Invalid URL' } });
    }

    const gid = Math.random().toString(16).substring(2, 18);

    if (targetUrl.startsWith('magnet:?')) {
      torrentManager.addTorrent(targetUrl).catch(() => {});
    } else {
      // Launch via chunkDownloader
      const cleanTitle = 'aria2_task';
      const fileName = `${cleanTitle}_${gid}.bin`;
      const filePath = path.resolve(TEMP_DIR, fileName);
      const downloader = new SegmentedDownloader(targetUrl, filePath, 12, (p) => {
        if (chunkJobs[gid]) chunkJobs[gid].progress = p;
      });
      chunkJobs[gid] = {
        id: gid,
        url: targetUrl,
        title: cleanTitle,
        fileName,
        filePath,
        downloader,
        progress: {
          totalBytes: 0,
          downloadedBytes: 0,
          percent: 0,
          speed: '0.0 MB/s',
          speedBytesPerSec: 0,
          eta: '--',
          chunks: [],
          status: 'downloading'
        }
      };
      downloader.start().catch(() => {});
    }

    return res.json({
      jsonrpc: '2.0',
      id,
      result: gid
    });
  }

  if (method === 'aria2.tellStatus') {
    const gid = realParams[0];
    const chunkJob = chunkJobs[gid];
    if (chunkJob) {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          gid,
          status: chunkJob.progress.status === 'completed' ? 'complete' : 'active',
          totalLength: String(chunkJob.progress.totalBytes),
          completedLength: String(chunkJob.progress.downloadedBytes),
          downloadSpeed: String(Math.floor(chunkJob.progress.speedBytesPerSec)),
          files: [{ path: chunkJob.filePath, length: String(chunkJob.progress.totalBytes) }]
        }
      });
    }

    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        gid,
        status: 'active',
        totalLength: '0',
        completedLength: '0',
        downloadSpeed: '0',
        files: []
      }
    });
  }

  if (method === 'aria2.tellActive') {
    const activeList = Object.values(chunkJobs)
      .filter(j => j.progress.status === 'downloading')
      .map(j => ({
        gid: j.id,
        status: 'active',
        totalLength: String(j.progress.totalBytes),
        completedLength: String(j.progress.downloadedBytes),
        downloadSpeed: String(Math.floor(j.progress.speedBytesPerSec))
      }));

    return res.json({ jsonrpc: '2.0', id, result: activeList });
  }

  // Generic fallback
  res.json({
    jsonrpc: '2.0',
    id,
    result: 'OK'
  });
};

app.post('/jsonrpc', handleAria2Rpc);
app.post('/rpc', handleAria2Rpc);
app.get('/jsonrpc', handleAria2Rpc);

// Serve frontend assets in production mode
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`⚡ Vortex Universal Super-Engine running on http://localhost:${PORT}`);
  console.log(`⚡ aria2 JSON-RPC available on http://localhost:${PORT}/jsonrpc`);
});
