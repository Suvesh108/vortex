export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  downloadUrl: string;
  contentType: string;
  downloadCount: number;
}

export interface GitHubReleaseInfo {
  tag: string;
  name: string;
  publishedAt: string;
  body: string;
  assets: GitHubAsset[];
  zipballUrl: string;
  tarballUrl: string;
}

export class GitHubPack {
  private userAgent = 'VortexDownloader-GitHubPack/1.0.0';

  /**
   * Check if a URL is a GitHub link and extract components
   */
  public parseUrl(urlStr: string): {
    isGitHub: boolean;
    owner?: string;
    repo?: string;
    type?: 'release' | 'release-direct' | 'repo' | 'raw' | 'blob';
    tag?: string;
    directUrl?: string;
  } {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();

      // Handle raw.githubusercontent.com
      if (host === 'raw.githubusercontent.com') {
        const parts = parsed.pathname.split('/').filter(Boolean);
        return {
          isGitHub: true,
          owner: parts[0],
          repo: parts[1],
          type: 'raw',
          directUrl: urlStr
        };
      }

      if (host !== 'github.com') {
        return { isGitHub: false };
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length < 2) {
        return { isGitHub: true, type: 'repo' };
      }

      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/, '');

      // Direct release asset: /owner/repo/releases/download/:tag/:file
      if (parts[2] === 'releases' && parts[3] === 'download' && parts[4] && parts[5]) {
        return {
          isGitHub: true,
          owner,
          repo,
          type: 'release-direct',
          tag: parts[4],
          directUrl: urlStr
        };
      }

      // Releases page: /owner/repo/releases or /releases/tag/:tag
      if (parts[2] === 'releases') {
        const tag = parts[3] === 'tag' ? parts[4] : undefined;
        return {
          isGitHub: true,
          owner,
          repo,
          type: 'release',
          tag
        };
      }

      // Blob link: /owner/repo/blob/:branch/...
      if (parts[2] === 'blob' && parts.length >= 5) {
        const branch = parts[3];
        const filePath = parts.slice(4).join('/');
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        return {
          isGitHub: true,
          owner,
          repo,
          type: 'blob',
          directUrl: rawUrl
        };
      }

      // Default repo root
      return {
        isGitHub: true,
        owner,
        repo,
        type: 'repo',
        directUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`
      };
    } catch (_) {
      return { isGitHub: false };
    }
  }

  /**
   * Query GitHub REST API for release assets
   */
  public async inspectRelease(owner: string, repo: string, tag?: string): Promise<GitHubReleaseInfo> {
    const endpoint = tag
      ? `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`
      : `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      // Fallback to default branch zip archive
      return {
        tag: 'HEAD',
        name: `${repo} (Source Code)`,
        publishedAt: new Date().toISOString(),
        body: 'Source code repository archive',
        assets: [
          {
            id: 1,
            name: `${repo}-main.zip`,
            size: 0,
            downloadUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`,
            contentType: 'application/zip',
            downloadCount: 0
          }
        ],
        zipballUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`,
        tarballUrl: `https://github.com/${owner}/${repo}/archive/refs/heads/main.tar.gz`
      };
    }

    const data: any = await res.json();
    const assets: GitHubAsset[] = (data.assets || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      size: a.size,
      downloadUrl: a.browser_download_url,
      contentType: a.content_type || 'application/octet-stream',
      downloadCount: a.download_count || 0
    }));

    // Add source code zip
    if (data.zipball_url) {
      assets.push({
        id: 999999,
        name: `${repo}-${data.tag_name || 'source'}.zip`,
        size: 0,
        downloadUrl: data.zipball_url,
        contentType: 'application/zip',
        downloadCount: 0
      });
    }

    return {
      tag: data.tag_name || 'latest',
      name: data.name || data.tag_name || repo,
      publishedAt: data.published_at || '',
      body: data.body || '',
      assets,
      zipballUrl: data.zipball_url || `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`,
      tarballUrl: data.tarball_url || `https://github.com/${owner}/${repo}/archive/refs/heads/main.tar.gz`
    };
  }
}
