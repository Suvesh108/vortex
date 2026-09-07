export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  supportedDomains: (string | RegExp)[];
  requiresAuth?: boolean;
}

export interface CrawledItem {
  url: string;
  title: string;
  size?: number;
  extension?: string;
  packageName?: string;
  thumbnail?: string;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface CrawlContext {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
  accountManager: any;
}

export interface ResolvedStream {
  directUrl: string;
  fileName: string;
  fileSize?: number;
  headers?: Record<string, string>;
  supportsRanges?: boolean;
  engine: 'chunk' | 'ytdlp' | 'torrent' | 'ftp';
}

export interface IVortexCrawlerPlugin {
  readonly metadata: PluginMetadata;
  canHandle(url: string): boolean;
  crawl(url: string, context: CrawlContext): Promise<CrawledItem[]>;
}

export interface IVortexHostPlugin {
  readonly metadata: PluginMetadata;
  canHandle(url: string): boolean;
  resolve(url: string, context: CrawlContext): Promise<ResolvedStream>;
}
