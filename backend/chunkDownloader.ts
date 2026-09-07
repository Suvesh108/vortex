import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { 
  turboHttpAgent, 
  turboHttpsAgent, 
  tuneSocket, 
  probeUrlRobust, 
  STEALTH_HEADERS,
  ProbeResult 
} from './turboAgent';
import { DiskCacheWriter } from './diskCacheWriter';

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  current: number;
  total: number;
  percent: number;
  status: 'idle' | 'downloading' | 'completed' | 'error';
}

export interface ChunkDownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
  speed: string;
  speedBytesPerSec: number;
  eta: string;
  chunks: ChunkInfo[];
  status: 'downloading' | 'completed' | 'error';
  error?: string;
}

export type ProgressCallback = (progress: ChunkDownloadProgress) => void;

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '--';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${mins}m ${secs}s`;
}

interface ActiveStream {
  chunk: ChunkInfo;
  req: http.ClientRequest;
  res?: http.IncomingMessage;
  abortController: AbortController;
}

/**
 * Vortex Turbo Segmented Downloader:
 * - High-speed multi-pipe parallel HTTP ranges (1–32 connections).
 * - IDM-style Dynamic Work-Stealing (splits stragglers to eliminate tail latency).
 * - Non-blocking asynchronous DiskCacheWriter with TCP backpressure control.
 * - Persistent keep-alive connection pooling with TCP_NODELAY.
 */
export class SegmentedDownloader {
  private url: string;
  private outputPath: string;
  private threads: number;
  private onProgress?: ProgressCallback;
  private abortController: AbortController = new AbortController();
  private fd: number | null = null;
  private diskWriter: DiskCacheWriter | null = null;
  private isCancelled = false;
  private activeStreams: Map<number, ActiveStream> = new Map();
  private allChunks: ChunkInfo[] = [];
  private nextChunkIndex = 0;
  private totalBytes = 0;
  private downloadedBytes = 0;

  // Minimum remaining bytes in a chunk required to steal half of it (2 MB)
  private readonly MIN_STEAL_SIZE = 2 * 1024 * 1024;

  constructor(url: string, outputPath: string, threads = 16, onProgress?: ProgressCallback) {
    this.url = url;
    this.outputPath = outputPath;
    this.threads = Math.min(Math.max(threads, 1), 32);
    this.onProgress = onProgress;
  }

  public cancel(): void {
    this.isCancelled = true;
    this.abortController.abort();

    // Abort each active worker stream
    for (const stream of this.activeStreams.values()) {
      try {
        stream.abortController.abort();
        stream.req.destroy();
      } catch (_) {}
    }
    this.activeStreams.clear();

    if (this.fd !== null) {
      try {
        fs.closeSync(this.fd);
      } catch (_) {}
      this.fd = null;
    }
  }

  public async start(): Promise<string> {
    const headInfo: ProbeResult = await probeUrlRobust(this.url, this.abortController.signal);
    this.totalBytes = headInfo.contentLength;
    const supportsRanges = headInfo.supportsRanges && this.totalBytes > 1024 * 1024; // Multi-thread files > 1MB

    // Ensure target destination directory exists
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!supportsRanges || this.totalBytes <= 0) {
      // Fallback to high-speed single stream with keepalive agent
      return this.downloadSingleStream();
    }

    // Allocate destination file on disk (sparse preallocation)
    this.fd = fs.openSync(this.outputPath, 'w');
    try {
      fs.ftruncateSync(this.fd, this.totalBytes);
    } catch (_) {}

    // Initialize non-blocking asynchronous disk cache writer with backpressure
    this.diskWriter = new DiskCacheWriter(this.fd, {
      highWaterMark: 16 * 1024 * 1024, // 16 MB ring buffer
      lowWaterMark: 4 * 1024 * 1024,
      onPressureChange: (paused: boolean) => {
        // Regulate TCP stream backpressure across all active workers
        for (const stream of this.activeStreams.values()) {
          if (stream.res) {
            if (paused) stream.res.pause();
            else stream.res.resume();
          }
        }
      }
    });

    const threadCount = Math.min(this.threads, Math.ceil(this.totalBytes / (256 * 1024)));
    const chunkSize = Math.floor(this.totalBytes / threadCount);

    this.allChunks = [];
    for (let i = 0; i < threadCount; i++) {
      const start = i * chunkSize;
      const end = i === threadCount - 1 ? this.totalBytes - 1 : (i + 1) * chunkSize - 1;
      this.allChunks.push({
        index: i,
        start,
        end,
        current: start,
        total: end - start + 1,
        percent: 0,
        status: 'idle'
      });
    }
    this.nextChunkIndex = threadCount;

    let lastTime = Date.now();
    let lastDownloaded = 0;
    this.downloadedBytes = 0;
    let speedStr = '0.0 MB/s';
    let etaStr = '--';
    let speedBytes = 0;

    // Telemetry ticker (every 250ms)
    const interval = setInterval(() => {
      const now = Date.now();
      const timeDelta = (now - lastTime) / 1000;
      if (timeDelta > 0) {
        const bytesDelta = this.downloadedBytes - lastDownloaded;
        speedBytes = bytesDelta / timeDelta;
        speedStr = formatBytes(speedBytes);
        const remainingBytes = Math.max(0, this.totalBytes - this.downloadedBytes);
        etaStr = speedBytes > 0 ? formatEta(remainingBytes / speedBytes) : '--';
        lastDownloaded = this.downloadedBytes;
        lastTime = now;
      }

      if (this.onProgress) {
        this.onProgress({
          totalBytes: this.totalBytes,
          downloadedBytes: this.downloadedBytes,
          percent: Math.min(100, Math.floor((this.downloadedBytes / this.totalBytes) * 100)),
          speed: speedStr,
          speedBytesPerSec: speedBytes,
          eta: etaStr,
          chunks: this.allChunks.map((c) => ({ ...c })),
          status: 'downloading'
        });
      }
    }, 250);

    try {
      // Launch initial worker pool
      const workerPromises = this.allChunks.map((chunk) => this.runWorkerLoop(chunk));
      await Promise.all(workerPromises);

      // Flush in-memory disk cache before closing
      if (this.diskWriter) {
        await this.diskWriter.flush();
      }

      clearInterval(interval);

      if (this.fd !== null) {
        fs.closeSync(this.fd);
        this.fd = null;
      }

      if (this.onProgress) {
        this.onProgress({
          totalBytes: this.totalBytes,
          downloadedBytes: this.totalBytes,
          percent: 100,
          speed: '0 B/s',
          speedBytesPerSec: 0,
          eta: '0s',
          chunks: this.allChunks.map((c) => ({ ...c, status: 'completed', percent: 100 })),
          status: 'completed'
        });
      }

      return this.outputPath;
    } catch (err: any) {
      clearInterval(interval);
      if (this.fd !== null) {
        try {
          fs.closeSync(this.fd);
        } catch (_) {}
        this.fd = null;
      }
      throw err;
    }
  }

  /**
   * Worker Loop:
   * Downloads its assigned chunk. When completed, instead of going idle,
   * it searches for any straggler active chunk, steals the second half (halving algorithm),
   * and continues downloading until the entire file is 100% complete!
   */
  private async runWorkerLoop(initialChunk: ChunkInfo): Promise<void> {
    let currentChunk: ChunkInfo | null = initialChunk;

    while (currentChunk && !this.isCancelled) {
      await this.downloadSegment(currentChunk);

      // Current chunk finished: Try to steal work from stragglers
      currentChunk = this.stealWorkFromStraggler();
    }
  }

  /**
   * Dynamic Work-Stealing Algorithm (IDM & Aria2 logic):
   * Scans all active streams, identifies the segment with the largest
   * un-downloaded byte span, and splits it in half.
   */
  private stealWorkFromStraggler(): ChunkInfo | null {
    let bestTarget: ActiveStream | null = null;
    let maxRemaining = 0;

    for (const stream of this.activeStreams.values()) {
      const remaining = stream.chunk.end - stream.chunk.current;
      if (remaining > maxRemaining && remaining >= this.MIN_STEAL_SIZE) {
        maxRemaining = remaining;
        bestTarget = stream;
      }
    }

    if (!bestTarget) {
      return null; // All chunks are almost finished; no segment large enough to split
    }

    // Split remaining range in half
    const half = Math.floor(maxRemaining / 2);
    const splitPoint = bestTarget.chunk.current + half;
    const originalEnd = bestTarget.chunk.end;

    // Adjust target's end boundary
    bestTarget.chunk.end = splitPoint;
    bestTarget.chunk.total = splitPoint - bestTarget.chunk.start + 1;

    // Create newly stolen segment for the freed worker
    const newChunk: ChunkInfo = {
      index: this.nextChunkIndex++,
      start: splitPoint + 1,
      end: originalEnd,
      current: splitPoint + 1,
      total: originalEnd - (splitPoint + 1) + 1,
      percent: 0,
      status: 'idle'
    };

    this.allChunks.push(newChunk);
    return newChunk;
  }

  private async downloadSegment(chunk: ChunkInfo): Promise<void> {
    if (chunk.current > chunk.end) {
      chunk.status = 'completed';
      chunk.percent = 100;
      return;
    }

    return new Promise((resolve, reject) => {
      chunk.status = 'downloading';
      const segmentAbort = new AbortController();

      try {
        const parsed = new URL(this.url);
        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;
        const agent = isHttps ? turboHttpsAgent : turboHttpAgent;

        const req = client.request(
          this.url,
          {
            method: 'GET',
            agent,
            headers: {
              ...STEALTH_HEADERS,
              Host: parsed.host,
              Range: `bytes=${chunk.current}-${chunk.end}`
            },
            signal: segmentAbort.signal,
            highWaterMark: 1024 * 1024 // 1 MB stream buffer
          } as any,
          (res) => {
            const streamRecord: ActiveStream = {
              chunk,
              req,
              res,
              abortController: segmentAbort
            };
            this.activeStreams.set(chunk.index, streamRecord);

            let chunkOffset = chunk.current;

            res.on('data', (buffer: Buffer) => {
              if (this.isCancelled || this.fd === null) return;

              // Check if boundary was dynamically shrunk by work-stealing
              if (chunkOffset + buffer.length > chunk.end + 1) {
                const allowedLen = Math.max(0, chunk.end + 1 - chunkOffset);
                if (allowedLen > 0) {
                  const slice = buffer.subarray(0, allowedLen);
                  this.diskWriter?.write(chunkOffset, slice);
                  chunkOffset += allowedLen;
                  this.downloadedBytes += allowedLen;
                }
                // Segment boundary reached after split; stop this stream
                try {
                  req.destroy();
                } catch (_) {}
                return;
              }

              this.diskWriter?.write(chunkOffset, buffer);
              chunkOffset += buffer.length;
              chunk.current = chunkOffset;
              this.downloadedBytes += buffer.length;

              const downloadedInChunk = chunkOffset - chunk.start;
              chunk.percent = Math.min(100, Math.floor((downloadedInChunk / chunk.total) * 100));
            });

            res.on('end', () => {
              this.activeStreams.delete(chunk.index);
              chunk.status = 'completed';
              chunk.percent = 100;
              resolve();
            });

            res.on('close', () => {
              this.activeStreams.delete(chunk.index);
              if (chunk.current >= chunk.end) {
                chunk.status = 'completed';
                chunk.percent = 100;
              }
              resolve();
            });

            res.on('error', (streamErr) => {
              this.activeStreams.delete(chunk.index);
              // If aborted due to cancellation, don't throw as error
              if (this.isCancelled) {
                resolve();
                return;
              }
              chunk.status = 'error';
              reject(streamErr);
            });
          }
        );

        req.on('socket', tuneSocket);

        req.on('error', (reqErr: any) => {
          this.activeStreams.delete(chunk.index);
          if (this.isCancelled || reqErr.name === 'AbortError') {
            resolve();
            return;
          }
          chunk.status = 'error';
          reject(reqErr);
        });

        req.end();
      } catch (err: any) {
        this.activeStreams.delete(chunk.index);
        if (this.isCancelled) {
          resolve();
          return;
        }
        chunk.status = 'error';
        reject(err);
      }
    });
  }

  private async downloadSingleStream(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const parsed = new URL(this.url);
        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;
        const agent = isHttps ? turboHttpsAgent : turboHttpAgent;
        const fileStream = fs.createWriteStream(this.outputPath);

        const req = client.get(
          this.url,
          {
            agent,
            headers: {
              ...STEALTH_HEADERS,
              Host: parsed.host
            },
            signal: this.abortController.signal,
            highWaterMark: 1024 * 1024
          } as any,
          (res) => {
            const total = parseInt(res.headers['content-length'] || '0', 10);
            let downloaded = 0;
            let lastTime = Date.now();
            let lastDownloaded = 0;

            const interval = setInterval(() => {
              const now = Date.now();
              const timeDelta = (now - lastTime) / 1000;
              if (timeDelta > 0) {
                const speedBytes = (downloaded - lastDownloaded) / timeDelta;
                lastDownloaded = downloaded;
                lastTime = now;
                const remaining = total - downloaded;
                const eta = speedBytes > 0 ? formatEta(remaining / speedBytes) : '--';

                if (this.onProgress) {
                  this.onProgress({
                    totalBytes: total,
                    downloadedBytes: downloaded,
                    percent: total > 0 ? Math.min(100, Math.floor((downloaded / total) * 100)) : 50,
                    speed: formatBytes(speedBytes),
                    speedBytesPerSec: speedBytes,
                    eta,
                    chunks: [{
                      index: 0,
                      start: 0,
                      end: total,
                      current: downloaded,
                      total,
                      percent: total > 0 ? Math.min(100, Math.floor((downloaded / total) * 100)) : 50,
                      status: 'downloading'
                    }],
                    status: 'downloading'
                  });
                }
              }
            }, 250);

            res.pipe(fileStream);

            fileStream.on('finish', () => {
              clearInterval(interval);
              fileStream.close();
              if (this.onProgress) {
                this.onProgress({
                  totalBytes: total,
                  downloadedBytes: total,
                  percent: 100,
                  speed: '0 B/s',
                  speedBytesPerSec: 0,
                  eta: '0s',
                  chunks: [{
                    index: 0,
                    start: 0,
                    end: total,
                    current: total,
                    total,
                    percent: 100,
                    status: 'completed'
                  }],
                  status: 'completed'
                });
              }
              resolve(this.outputPath);
            });

            res.on('error', (err) => {
              clearInterval(interval);
              fileStream.close();
              reject(err);
            });
          }
        );

        req.on('socket', tuneSocket);
        req.on('error', (err) => {
          fileStream.close();
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
