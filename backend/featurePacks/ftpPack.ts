import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';

export interface FtpDownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
  speed: string;
  eta: string;
}

export class FtpPack {
  private client: ftp.Client;
  private aborted = false;

  constructor() {
    this.client = new ftp.Client();
    this.client.ftp.verbose = false;
  }

  /**
   * Parse an FTP/FTPS URL
   */
  public parseUrl(urlStr: string): {
    host: string;
    port: number;
    user?: string;
    password?: string;
    secure: boolean;
    remotePath: string;
    fileName: string;
  } {
    const parsed = new URL(urlStr);
    const isSecure = parsed.protocol === 'ftps:';
    const remotePath = decodeURIComponent(parsed.pathname);
    const fileName = path.basename(remotePath) || 'ftp_download';

    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : (isSecure ? 990 : 21),
      user: parsed.username || 'anonymous',
      password: parsed.password || 'anonymous@vortex.org',
      secure: isSecure,
      remotePath,
      fileName
    };
  }

  /**
   * Download a file from FTP server with progress
   */
  public async downloadFile(
    urlStr: string,
    destinationDir: string,
    onProgress?: (prog: FtpDownloadProgress) => void
  ): Promise<{ filePath: string; fileName: string; size: number }> {
    const info = this.parseUrl(urlStr);
    const targetFile = path.join(destinationDir, info.fileName);

    let totalBytes = 0;
    let bytesDownloaded = 0;
    let startTime = Date.now();
    let lastTime = Date.now();
    let lastBytes = 0;

    try {
      await this.client.access({
        host: info.host,
        port: info.port,
        user: info.user,
        password: info.password,
        secure: info.secure
      });

      // Probe remote size
      try {
        totalBytes = await this.client.size(info.remotePath);
      } catch (_) {
        totalBytes = 0;
      }

      this.client.trackProgress((info) => {
        if (this.aborted) {
          this.client.close();
          return;
        }

        bytesDownloaded = info.bytes;
        const now = Date.now();
        const elapsedSec = (now - startTime) / 1000;
        const deltaSec = (now - lastTime) / 1000;

        let speedStr = '-- B/s';
        if (deltaSec >= 0.5) {
          const bps = (bytesDownloaded - lastBytes) / deltaSec;
          speedStr = this.formatSpeed(bps);
          lastTime = now;
          lastBytes = bytesDownloaded;
        }

        let etaStr = '--';
        if (totalBytes > 0 && bytesDownloaded > 0 && elapsedSec > 0) {
          const overallBps = bytesDownloaded / elapsedSec;
          const remainingBytes = totalBytes - bytesDownloaded;
          const remSec = remainingBytes / overallBps;
          etaStr = this.formatDuration(remSec);
        }

        const percent = totalBytes > 0 ? Math.min(100, Math.round((bytesDownloaded / totalBytes) * 100)) : 0;

        if (onProgress) {
          onProgress({
            bytesDownloaded,
            totalBytes,
            percent,
            speed: speedStr,
            eta: etaStr
          });
        }
      });

      // Stream file to disk
      await this.client.downloadTo(targetFile, info.remotePath);
      this.client.trackProgress(); // Reset tracking

      const stats = fs.existsSync(targetFile) ? fs.statSync(targetFile) : null;
      return {
        filePath: targetFile,
        fileName: info.fileName,
        size: stats?.size || totalBytes || bytesDownloaded
      };
    } finally {
      this.client.close();
    }
  }

  public abort(): void {
    this.aborted = true;
    this.client.close();
  }

  private formatSpeed(bps: number): string {
    if (bps >= 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(2)} MB/s`;
    if (bps >= 1024) return `${(bps / 1024).toFixed(1)} KB/s`;
    return `${Math.round(bps)} B/s`;
  }

  private formatDuration(sec: number): string {
    if (!sec || !isFinite(sec) || sec < 0) return '--';
    const s = Math.round(sec);
    const m = Math.floor(s / 60);
    const rSec = s % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const rMin = m % 60;
      return `${h}h ${rMin}m`;
    }
    return `${m}m ${rSec}s`;
  }
}
