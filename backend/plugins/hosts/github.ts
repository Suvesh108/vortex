import { IVortexHostPlugin, PluginMetadata, ResolvedStream, CrawlContext } from '../types';

export class GitHubHostPlugin implements IVortexHostPlugin {
  public readonly metadata: PluginMetadata = {
    id: 'github_host',
    name: 'GitHub Releases & Assets',
    version: '1.0.0',
    author: 'Vortex Core',
    description: 'Inspects and accelerates GitHub release assets and source archives.',
    supportedDomains: ['github.com', 'raw.githubusercontent.com', 'objects.githubusercontent.com']
  };

  public canHandle(url: string): boolean {
    return /github\.com|githubusercontent\.com/i.test(url);
  }

  public async resolve(url: string, context: CrawlContext): Promise<ResolvedStream> {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const fileName = parts.pop() || 'github_asset.bin';

      return {
        directUrl: url,
        fileName: decodeURIComponent(fileName),
        engine: 'chunk'
      };
    } catch (_) {
      return {
        directUrl: url,
        fileName: 'github_asset.bin',
        engine: 'chunk'
      };
    }
  }
}
