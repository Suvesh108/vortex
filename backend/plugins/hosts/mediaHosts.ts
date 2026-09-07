import { IVortexHostPlugin, PluginMetadata, ResolvedStream, CrawlContext } from '../types';

export class MediaHostsPlugin implements IVortexHostPlugin {
  public readonly metadata: PluginMetadata = {
    id: 'media_hosts',
    name: 'Universal Media & Cloud Stream Resolver',
    version: '1.0.0',
    author: 'Vortex Core',
    description: 'Extracts direct video streams from Doodstream, Streamtape, Mixdrop, TeraBox, VOE, etc.',
    supportedDomains: [
      'doodstream.com', 'dood.to', 'dood.watch',
      'streamtape.com', 'streamta.pe',
      'mixdrop.co', 'mixdrop.to',
      'terabox.com', '1024tera.com',
      'voe.sx', 'streamwish.com', 'filemoon.sx'
    ]
  };

  public canHandle(url: string): boolean {
    return /dood|streamtape|mixdrop|terabox|1024tera|voe\.sx|streamwish|filemoon/i.test(url);
  }

  public async resolve(url: string, context: CrawlContext): Promise<ResolvedStream> {
    // First, check if debrid can resolve this locker link
    if (context.accountManager) {
      try {
        const debridRes = await context.accountManager.unrestrict(url);
        if (debridRes.success && debridRes.directUrl) {
          return {
            directUrl: debridRes.directUrl,
            fileName: debridRes.fileName || 'stream_video.mp4',
            fileSize: debridRes.fileSize,
            engine: 'chunk'
          };
        }
      } catch (_) {}
    }

    // Fallback to yt-dlp stream pipeline for media hosts
    return {
      directUrl: url,
      fileName: 'media_stream.mp4',
      engine: 'ytdlp'
    };
  }
}
