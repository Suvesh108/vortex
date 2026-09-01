import { Filesystem, Directory } from '@capacitor/filesystem';
import { registerPlugin, Capacitor } from '@capacitor/core';

export const APP_VERSION = 'v0.4.1';

interface AppUpdaterPlugin {
  installApk(options: { filePath: string }): Promise<{ success: boolean; message?: string }>;
}

const AppUpdater = registerPlugin<AppUpdaterPlugin>('AppUpdater');

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  apkDownloadUrl?: string;
  releaseUrl: string;
  publishedAt: string;
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
 * Check GitHub repository releases for available updates
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
  const latestTag = data.tag_name || data.name || 'v0.3.3';
  const hasUpdate = isNewerVersion(latestTag, APP_VERSION);

  // Find APK asset
  const apkAsset = data.assets?.find((a: any) => 
    a.name.endsWith('.apk') || a.content_type === 'application/vnd.android.package-archive'
  );

  return {
    hasUpdate,
    currentVersion: APP_VERSION,
    latestVersion: latestTag,
    releaseName: data.name || latestTag,
    releaseNotes: data.body || 'Performance improvements, local yt-dlp & FFmpeg bundles, and bug fixes.',
    apkDownloadUrl: apkAsset?.browser_download_url || data.html_url,
    releaseUrl: data.html_url,
    publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString() : 'Recent'
  };
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
