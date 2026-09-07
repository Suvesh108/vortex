import { Filesystem, Directory } from '@capacitor/filesystem';
import { registerPlugin, Capacitor } from '@capacitor/core';

export const APP_VERSION = 'v0.5.7';

interface AppUpdaterPlugin {
  installApk(options: { filePath: string }): Promise<{ success: boolean; message?: string }>;
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

export interface ReleaseAsset {
  name: string;
  size: number;
  downloadUrl: string;
  type: 'exe' | 'apk' | 'zip' | 'other';
}

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  apkDownloadUrl?: string;
  exeDownloadUrl?: string;
  zipDownloadUrl?: string;
  releaseUrl: string;
  publishedAt: string;
  assets: ReleaseAsset[];
}

function parseSemver(v: string): number[] {
  const clean = v.replace(/^v/i, '').trim();
  return clean.split('.').map(p => parseInt(p, 10) || 0);
}

function isNewerVersion(latest: string, current: string): boolean {
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parseSemver(latest);
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parseSemver(current);

  if (lMajor > cMajor) return true;
  if (lMajor === cMajor && lMinor > cMinor) return true;
  if (lMajor === cMajor && lMinor === cMinor && lPatch > cPatch) return true;
  return false;
}

/**
 * Check GitHub repository releases for available updates (EXE, APK, ZIP)
 */
export async function checkForAppUpdates(): Promise<UpdateInfo> {
  const repoOwner = 'Suvesh108';
  const repoName = 'vortex';

  const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`, {
    headers: {
      'Accept': 'application/vnd.github+json'
    }
  });

  if (!res.ok) {
    throw new Error(`Could not fetch release information (HTTP ${res.status})`);
  }

  const data = await res.json();
  const latestTag = data.tag_name || data.name || 'v0.5.4';
  const hasUpdate = isNewerVersion(latestTag, APP_VERSION);

  // Extract all assets
  const rawAssets = Array.isArray(data.assets) ? data.assets : [];
  const assets: ReleaseAsset[] = rawAssets.map((a: any) => {
    const nameLower = (a.name || '').toLowerCase();
    let type: ReleaseAsset['type'] = 'other';
    if (nameLower.endsWith('.exe') || nameLower.endsWith('.msi')) type = 'exe';
    else if (nameLower.endsWith('.apk') || a.content_type === 'application/vnd.android.package-archive') type = 'apk';
    else if (nameLower.endsWith('.zip')) type = 'zip';

    return {
      name: a.name || 'Release Asset',
      size: a.size || 0,
      downloadUrl: a.browser_download_url,
      type
    };
  });

  // Find specific platform assets
  const apkAsset = assets.find(a => a.type === 'apk');
  const exeAsset = assets.find(a => a.type === 'exe');
  const zipAsset = assets.find(a => a.type === 'zip');

  return {
    hasUpdate,
    currentVersion: APP_VERSION,
    latestVersion: latestTag,
    releaseName: data.name || latestTag,
    releaseNotes: data.body || 'Performance improvements, IDM multi-segmented chunker, and bug fixes.',
    apkDownloadUrl: apkAsset?.downloadUrl,
    exeDownloadUrl: exeAsset?.downloadUrl,
    zipDownloadUrl: zipAsset?.downloadUrl,
    releaseUrl: data.html_url || `https://github.com/${repoOwner}/${repoName}/releases/latest`,
    publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString() : 'Recent',
    assets
  };
}

/**
 * Universal downloader for Windows EXE, Web Archives, and Android APK
 */
export async function downloadUpdateFile(url: string, filename?: string): Promise<{ success: boolean; path?: string }> {
  if (Capacitor.isNativePlatform() && (url.endsWith('.apk') || filename?.endsWith('.apk'))) {
    return downloadAndInstallUpdate(url);
  }

  // Browser / Windows Desktop fallback
  const link = document.createElement('a');
  link.href = url;
  if (filename) link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return { success: true };
}

/**
 * Completely internal APK download and native Android package installation prompt
 */
export async function downloadAndInstallUpdate(
  apkUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; path?: string }> {
  const progressCb = onProgress || (() => {});
  progressCb(10);

  if (Capacitor.isNativePlatform()) {
    try {
      progressCb(25);
      
      const subPath = 'Download/VortexDownloader/VortexDownloader-latest.apk';
      const downloadRes = await Filesystem.downloadFile({
        url: apkUrl,
        path: subPath,
        directory: Directory.ExternalStorage,
        progress: true,
        recursive: true
      });
      
      progressCb(85);

      const uriResult = await Filesystem.getUri({
        directory: Directory.ExternalStorage,
        path: subPath
      });

      progressCb(95);

      const targetPath = uriResult.uri || downloadRes.path || '';

      // Trigger custom native AppUpdaterPlugin to launch Package Installer internally
      try {
        await AppUpdater.installApk({ filePath: targetPath });
      } catch (pluginErr) {
        console.warn('Custom plugin installer fallback:', pluginErr);
        window.location.href = targetPath;
      }

      progressCb(100);
      return { success: true, path: targetPath };
    } catch (err: any) {
      console.warn('Native update download error:', err);
      // Fallback
      window.open(apkUrl, '_system');
      progressCb(100);
      return { success: true };
    }
  } else {
    // Browser fallback
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'VortexDownloader-latest.apk';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    progressCb(100);
    return { success: true };
  }
}
