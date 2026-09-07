import { FileCategory } from './detector';

export type DownloadStatus = 'idle' | 'fetching' | 'ready' | 'downloading' | 'completed' | 'failed';
export type ProtocolMode = 'auto' | 'stream' | 'chunk' | 'torrent';

export interface MediaQuality {
  id: string;
  format: string; // 'MP4', 'M4A', 'ZIP', 'JPG', 'PDF', 'XLSX', 'PPTX', 'EPUB', 'TXT'
  resolution: string;
  size: string;
  bitrate: string;
  directUrl?: string;
  targetExtension?: string;
}

export interface MediaMetadata {
  title: string;
  duration: string;
  creator: string;
  thumbnail: string;
  originalUrl: string;
  category?: FileCategory;
  targetExtension?: string;
  formats: MediaQuality[];
  downloadUrl?: string;
}

export interface DownloadLog {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  message: string;
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  originalUrl: string;
  thumbnail: string;
  size: string;
  resolution: string;
  format: string;
  category?: FileCategory;
  targetExtension?: string;
  timestamp: string;
  directStreamUrl?: string;
  localPath?: string;
}

export interface UserSettings {
  simulatedSpeedCode: 'MAX' | 'HIGH' | 'MED' | 'LOW';
  defaultThreads: number;
  sampleRatekHz: number;
  autoDownload: boolean;
  saveHistory: boolean;
  backendUrl?: string;
  youtubeCookie?: string;
}

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
