import { registerPlugin } from '@capacitor/core';

export interface NativeProgressData {
  filename: string;
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: string;
}

export interface VortexNativePlugin {
  downloadWithManager(options: {
    url: string;
    filename?: string;
    title?: string;
    mimeType?: string;
  }): Promise<{ success: boolean; downloadId: number; filePath: string; filename: string }>;

  downloadDirectStream(options: {
    url: string;
    filename?: string;
    title?: string;
    mimeType?: string;
  }): Promise<{ success: boolean; filePath: string; filename: string; totalBytes: number }>;

  openFile(options: { filePath: string; mimeType?: string }): Promise<{ success: boolean }>;

  shareFile(options: { filePath: string; title?: string; mimeType?: string }): Promise<{ success: boolean }>;

  getInitialSharedUrl(): Promise<{ url: string }>;

  exitApp(): Promise<void>;

  addListener(
    eventName: 'nativeProgress',
    listenerFunc: (data: NativeProgressData) => void
  ): Promise<any>;
}

export const VortexNative = registerPlugin<VortexNativePlugin>('VortexNative');
