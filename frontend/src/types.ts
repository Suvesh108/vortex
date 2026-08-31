export type DownloadStatus = 'idle' | 'fetching' | 'ready' | 'downloading' | 'completed' | 'failed';

export interface MediaQuality {
  id: string;
  format: 'MP4' | 'MP3' | 'MKV' | 'M4A';
  resolution: string;
  size: string;
  bitrate: string;
  directUrl?: string;
}

export interface MediaMetadata {
  title: string;
  duration: string;
  creator: string;
  thumbnail: string;
  originalUrl: string;
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
  timestamp: string;
}

export interface UserSettings {
  simulatedSpeedCode: 'MAX' | 'HIGH' | 'MED' | 'LOW';
  defaultThreads: number;
  sampleRatekHz: number;
  autoDownload: boolean;
  saveHistory: boolean;
  backendUrl?: string;
}
