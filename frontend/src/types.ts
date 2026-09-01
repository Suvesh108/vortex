import { FileCategory } from './detector';

export type DownloadStatus = 'idle' | 'fetching' | 'ready' | 'downloading' | 'completed' | 'failed';

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
