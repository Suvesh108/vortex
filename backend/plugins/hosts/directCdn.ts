import { IVortexHostPlugin, PluginMetadata, ResolvedStream, CrawlContext } from '../types';
import { probeUrlRobust } from '../../turboAgent';

export class DirectCdnHostPlugin implements IVortexHostPlugin {
  public readonly metadata: PluginMetadata = {
    id: 'direct_cdn',
    name: 'Direct CDN & Web Stream',
    version: '1.0.0',
    author: 'Vortex Core',
    description: 'Resolves direct HTTP/HTTPS downloads with high-speed multi-range probing.',
    supportedDomains: [/.*/] // Fallback for all URLs
  };

  public canHandle(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  public async resolve(url: string, context: CrawlContext): Promise<ResolvedStream> {
    const probe = await probeUrlRobust(url);

    // Extract filename from URL or suggested header
    let fileName = probe.suggestedFileName;
    if (!fileName) {
      try {
        const parsed = new URL(url);
        const base = parsed.pathname.split('/').filter(Boolean).pop();
        fileName = base ? decodeURIComponent(base) : 'downloaded_file.bin';
      } catch (_) {
        fileName = 'downloaded_file.bin';
      }
    }

    return {
      directUrl: probe.finalUrl || url,
      fileName,
      fileSize: probe.contentLength > 0 ? probe.contentLength : undefined,
      supportsRanges: probe.supportsRanges,
      engine: 'chunk'
    };
  }
}
