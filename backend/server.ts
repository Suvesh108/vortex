import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_CMD = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');

app.use(cors());
app.use(express.json());

// Temp directory for downloads
const TEMP_DIR = path.join(__dirname, 'temp_downloads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// In-memory store for jobs
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
}

const jobs: Record<string, Job> = {};

// Helper to add logs to a job
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
          fs.unlink(filePath, () => {
            console.log(`Deleted expired temp download file: ${file}`);
          });
        }
      });
    });
  });
}, 10 * 60 * 1000); // every 10 mins

// 1. GET /api/info - Fetch video metadata
app.get('/api/info', (req, res) => {
  const videoUrl = req.query.url as string;
  if (!videoUrl) {
    return res.status(400).json({ error: 'URL parameter is required.' });
  }

  console.log(`Fetching info for URL: ${videoUrl}`);

  const pythonProcess = spawn(PYTHON_CMD, ['downloader.py', 'info', videoUrl]);

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
      console.error(`Python info process exited with code ${code}. Stderr: ${stderrData}`);
      return res.status(500).json({ error: 'Failed to extract video metadata. Please verify the URL.' });
    }

    try {
      const result = JSON.parse(stdoutData.trim());
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      res.json(result);
    } catch (e) {
      console.error('Failed to parse JSON from python script:', stdoutData);
      res.status(500).json({ error: 'Internal server error while parsing metadata.' });
    }
  });
});

// 2. POST /api/download - Trigger download
app.post('/api/download', (req, res) => {
  const { url, formatId, title, format } = req.body;

  if (!url || !formatId || !title || !format) {
    return res.status(400).json({ error: 'Missing required parameters (url, formatId, title, format).' });
  }

  const jobId = Math.random().toString(36).substring(2, 15);
  // Sanitize title for file name
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const extension = format.toLowerCase();
  const fileName = `${sanitizedTitle}_${jobId}.${extension}`;
  const filePath = path.join(TEMP_DIR, fileName);

  const job: Job = {
    id: jobId,
    url,
    formatId,
    title,
    extension,
    status: 'downloading',
    progress: 0,
    speed: '0.0 MB/s',
    eta: '0s',
    logs: [],
    filePath
  };

  jobs[jobId] = job;
  addJobLog(job, 'info', `Spawning content extraction thread for job ID: ${jobId}`);
  addJobLog(job, 'info', `Allocating destination block: ${fileName}`);

  console.log(`Starting download job: ${jobId} for URL: ${url}`);

  // Spawn python script in download mode
  const pythonProcess = spawn(PYTHON_CMD, ['downloader.py', 'download', url, formatId, filePath]);

  pythonProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      if (cleanLine.startsWith('[PROGRESS]')) {
        // Format: [PROGRESS] 45.2% | SPEED: 12.4 MB/s | ETA: 15s
        const match = cleanLine.match(/\[PROGRESS\]\s+([\d.]+)%\s+\|\s+SPEED:\s+([^\s]+ [^\s]+)\s+\|\s+ETA:\s+([^\s]+)/);
        if (match) {
          job.progress = Math.floor(parseFloat(match[1]));
          job.speed = match[2];
          job.eta = match[3];
        } else if (cleanLine.includes('Stitching')) {
          job.progress = 99;
          addJobLog(job, 'success', 'Multiplex container downloading completed. Compiling and stitching audio/video tracks...');
        }
      } else if (cleanLine.startsWith('[STATUS]')) {
        addJobLog(job, 'info', cleanLine.replace('[STATUS]', '').trim());
      } else if (cleanLine.startsWith('[SUCCESS]')) {
        addJobLog(job, 'success', 'Lossless tag injection completed successfully!');
        addJobLog(job, 'success', `Deliverable saved in cache folder.`);
        job.status = 'completed';
        job.progress = 100;
      } else if (cleanLine.startsWith('[ERROR]')) {
        const errMsg = cleanLine.replace('[ERROR]', '').trim();
        addJobLog(job, 'error', errMsg);
        job.status = 'error';
        job.error = errMsg;
      } else {
        // Generic log from subprocess stdout
        addJobLog(job, 'info', cleanLine);
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    const errLine = data.toString().trim();
    if (errLine) {
      console.error(`Download Subprocess Stderr: ${errLine}`);
      addJobLog(job, 'warning', `Subprocess Warning: ${errLine}`);
    }
  });

  pythonProcess.on('close', (code) => {
    console.log(`Download process for job ${jobId} exited with code ${code}`);
    if (code !== 0 && job.status !== 'completed') {
      job.status = 'error';
      job.error = job.error || `Process exited with code ${code}`;
      addJobLog(job, 'error', `Stream extraction aborted abnormally with code ${code}.`);
    }
  });

  res.json({ jobId });
});

// 3. GET /api/download/progress - Polling endpoint
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

// 4. GET /api/download/file - File delivery endpoint
app.get('/api/download/file', (req, res) => {
  const jobId = req.query.jobId as string;
  if (!jobId || !jobs[jobId]) {
    return res.status(404).send('Job not found.');
  }

  const job = jobs[jobId];
  if (job.status !== 'completed' || !fs.existsSync(job.filePath)) {
    return res.status(400).send('File is not ready or has been removed.');
  }

  const originalFilename = `${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.${job.extension}`;
  console.log(`Delivering file ${job.filePath} as ${originalFilename}`);

  res.download(job.filePath, originalFilename, (err) => {
    if (err) {
      console.error('Error delivering file:', err);
    } else {
      // Clean up file after successful download (wait 5s to ensure stream is fully closed)
      setTimeout(() => {
        fs.unlink(job.filePath, () => {
          console.log(`Cleaned up temporary download file: ${job.filePath}`);
        });
      }, 5000);
    }
  });
});

// Serve frontend assets in production mode
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Vortex backend server running on http://localhost:${PORT}`);
});
