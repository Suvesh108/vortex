import { 
  IVortexHostPlugin, 
  IVortexCrawlerPlugin, 
  ResolvedStream, 
  CrawledItem, 
  CrawlContext, 
  PluginMetadata 
} from './types';
import { DirectCdnHostPlugin } from './hosts/directCdn';
import { GitHubHostPlugin } from './hosts/github';
import { HuggingFaceHostPlugin } from './hosts/huggingface';
import { MediaHostsPlugin } from './hosts/mediaHosts';
import { accountManager } from '../accounts/AccountManager';

export class PluginManager {
  private hostPlugins: IVortexHostPlugin[] = [];
  private crawlerPlugins: IVortexCrawlerPlugin[] = [];
  private defaultHostPlugin: DirectCdnHostPlugin;

  constructor() {
    this.defaultHostPlugin = new DirectCdnHostPlugin();
    this.registerBuiltinPlugins();
  }

  private registerBuiltinPlugins(): void {
    this.registerHostPlugin(new GitHubHostPlugin());
    this.registerHostPlugin(new HuggingFaceHostPlugin());
    this.registerHostPlugin(new MediaHostsPlugin());
  }

  public registerHostPlugin(plugin: IVortexHostPlugin): void {
    this.hostPlugins.unshift(plugin); // Prepend so custom plugins take precedence
  }

  public registerCrawlerPlugin(plugin: IVortexCrawlerPlugin): void {
    this.crawlerPlugins.unshift(plugin);
  }

  public getContext(): CrawlContext {
    return {
      fetch: globalThis.fetch,
      log: (msg, level = 'info') => {
        console.log(`[PluginManager] [${level.toUpperCase()}] ${msg}`);
      },
      accountManager
    };
  }

  /**
   * Resolve a target URL into a downloadable direct stream using registered plugins or Debrid
   */
  public async resolve(url: string): Promise<ResolvedStream> {
    const context = this.getContext();

    // 1. Check if Debrid can unrestrict this link directly
    try {
      const debrid = await accountManager.unrestrict(url);
      if (debrid.success && debrid.directUrl) {
        return {
          directUrl: debrid.directUrl,
          fileName: debrid.fileName || 'unrestricted_file.bin',
          fileSize: debrid.fileSize,
          engine: 'chunk'
        };
      }
    } catch (_) {}

    // 2. Query specialized host plugins
    for (const plugin of this.hostPlugins) {
      if (plugin.canHandle(url)) {
        try {
          return await plugin.resolve(url, context);
        } catch (_) {}
      }
    }

    // 3. Fallback to default Direct CDN plugin
    return this.defaultHostPlugin.resolve(url, context);
  }

  /**
   * List all currently registered plugins
   */
  public listPlugins(): PluginMetadata[] {
    const list = this.hostPlugins.map((p) => p.metadata);
    list.push(this.defaultHostPlugin.metadata);
    return list;
  }
}

export const pluginManager = new PluginManager();
