import WebTorrent from 'webtorrent';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TorrentFileInfo {
  name: string;
  path: string;
  length: number;
  downloaded: number;
  progress: number;
}

export interface TorrentItem {
  infoHash: string;
  name: string;
  magnetURI: string;
  totalBytes: number;
  downloadedBytes: number;
  uploadedBytes: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  timeRemaining: number;
  status: 'metadata' | 'downloading' | 'paused' | 'completed' | 'error';
  files: TorrentFileInfo[];
  downloadPath: string;
  error?: string;
}

class TorrentManager {
  private client: any;
  private torrents: Map<string, TorrentItem> = new Map();
  private defaultDownloadDir: string;

  constructor() {
    this.defaultDownloadDir = path.resolve(__dirname, 'temp_downloads', 'torrents');
    if (!fs.existsSync(this.defaultDownloadDir)) {
      fs.mkdirSync(this.defaultDownloadDir, { recursive: true });
    }

    try {
      this.client = new WebTorrent({
        maxConns: 55,
      });

      this.client.on('error', (err: any) => {
        console.error('WebTorrent client error:', err.message || err);
      });
    } catch (e: any) {
      console.error('Failed to initialize WebTorrent client:', e.message || e);
    }
  }

  public addTorrent(torrentId: string, customPath?: string): Promise<TorrentItem> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        return reject(new Error('WebTorrent engine is not initialized'));
      }

      const downloadPath = customPath || this.defaultDownloadDir;
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }

      // Check if already added
      const existing = Array.from(this.torrents.values()).find(
        t => t.magnetURI === torrentId || t.infoHash === torrentId
      );
      if (existing) {
        return resolve(existing);
      }

      try {
        const torrent = this.client.add(torrentId, { path: downloadPath }, (t: any) => {
          const files: TorrentFileInfo[] = (t.files || []).map((f: any) => ({
            name: f.name,
            path: f.path,
            length: f.length,
            downloaded: f.downloaded || 0,
            progress: f.progress || 0
          }));

          const item: TorrentItem = {
            infoHash: t.infoHash,
            name: t.name || 'Torrent Task',
            magnetURI: t.magnetURI,
            totalBytes: t.length || 0,
            downloadedBytes: t.downloaded || 0,
            uploadedBytes: t.uploaded || 0,
            progress: Math.floor((t.progress || 0) * 100),
            downloadSpeed: t.downloadSpeed || 0,
            uploadSpeed: t.uploadSpeed || 0,
            numPeers: t.numPeers || 0,
            timeRemaining: t.timeRemaining || 0,
            status: t.done ? 'completed' : 'downloading',
            files,
            downloadPath
          };

          this.torrents.set(t.infoHash, item);
          resolve(item);
        });

        torrent.on('download', () => {
          const item = this.torrents.get(torrent.infoHash);
          if (item) {
            item.downloadedBytes = torrent.downloaded;
            item.uploadedBytes = torrent.uploaded;
            item.progress = Math.floor(torrent.progress * 100);
            item.downloadSpeed = torrent.downloadSpeed;
            item.uploadSpeed = torrent.uploadSpeed;
            item.numPeers = torrent.numPeers;
            item.timeRemaining = torrent.timeRemaining;
            item.status = torrent.done ? 'completed' : 'downloading';
            item.files = (torrent.files || []).map((f: any) => ({
              name: f.name,
              path: f.path,
              length: f.length,
              downloaded: f.downloaded || 0,
              progress: Math.floor((f.progress || 0) * 100)
            }));
          }
        });

        torrent.on('done', () => {
          const item = this.torrents.get(torrent.infoHash);
          if (item) {
            item.progress = 100;
            item.status = 'completed';
            item.downloadSpeed = 0;
          }
        });

        torrent.on('error', (err: any) => {
          const item = this.torrents.get(torrent.infoHash);
          if (item) {
            item.status = 'error';
            item.error = err.message || String(err);
          }
        });

        // Set initial placeholder while waiting for metadata
        const tempHash = torrent.infoHash || Math.random().toString(36).substring(2, 12);
        const placeholder: TorrentItem = {
          infoHash: tempHash,
          name: 'Resolving Magnet Metadata & Swarm...',
          magnetURI: torrentId,
          totalBytes: 0,
          downloadedBytes: 0,
          uploadedBytes: 0,
          progress: 0,
          downloadSpeed: 0,
          uploadSpeed: 0,
          numPeers: 0,
          timeRemaining: 0,
          status: 'metadata',
          files: [],
          downloadPath
        };
        this.torrents.set(tempHash, placeholder);

        // If metadata doesn't resolve within 15 seconds, still resolve with placeholder
        setTimeout(() => {
          const current = this.torrents.get(torrent.infoHash || tempHash);
          if (current && current.status === 'metadata') {
            resolve(current);
          }
        }, 3000);
      } catch (err: any) {
        reject(err);
      }
    });
  }

  public getTorrent(infoHash: string): TorrentItem | undefined {
    return this.torrents.get(infoHash);
  }

  public listTorrents(): TorrentItem[] {
    return Array.from(this.torrents.values());
  }

  public removeTorrent(infoHash: string, deleteFiles = false): boolean {
    const item = this.torrents.get(infoHash);
    if (!item) return false;

    if (this.client) {
      try {
        this.client.remove(infoHash, { destroyStore: deleteFiles });
      } catch (_) {}
    }

    this.torrents.delete(infoHash);
    return true;
  }
}

export const torrentManager = new TorrentManager();
