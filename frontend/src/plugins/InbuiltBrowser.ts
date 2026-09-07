import { registerPlugin } from '@capacitor/core';

export interface InbuiltBrowserPlugin {
  open(options: { url: string }): Promise<{ downloadUrl?: string; closed?: boolean }>;
  addListener(
    eventName: 'onDownloadRequested',
    listenerFunc: (data: { downloadUrl: string }) => void
  ): Promise<any>;
}

export const InbuiltBrowser = registerPlugin<InbuiltBrowserPlugin>('InbuiltBrowser');
