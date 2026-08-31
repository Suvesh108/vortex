import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const APP_VERSION = 'v0.3.2';

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
  const latestTag = data.tag_name || data.name || 'v0.3.2';
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
    releaseNotes: data.body || 'Performance improvements and bug fixes.',
    apkDownloadUrl: apkAsset?.browser_download_url || data.html_url,
    releaseUrl: data.html_url,
    publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString() : 'Recent'
  };
}

/**
 * Download APK inside the app and prompt package installation
 */
export async function downloadAndInstallUpdate(
  apkUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; path?: string }> {
  const progressCb = onProgress || (() => {});
  progressCb(10);

  if (Capacitor.isNativePlatform()) {
    try {
      progressCb(30);
      const downloadRes = await Filesystem.downloadFile({
        url: apkUrl,
        path: 'Download/VortexDownloader/VortexDownloader-update.apk',
        directory: Directory.ExternalStorage,
        progress: true,
        recursive: true
      });
      progressCb(90);

      const uriResult = await Filesystem.getUri({
        directory: Directory.ExternalStorage,
        path: 'Download/VortexDownloader/VortexDownloader-update.apk'
      });

      progressCb(100);

      // Trigger Android package installer via window / intent
      if (uriResult?.uri) {
        window.location.href = uriResult.uri;
      } else {
        window.open(apkUrl, '_system');
      }

      return { success: true, path: downloadRes.path };
    } catch (err) {
      console.warn('Native update download fallback:', err);
      window.open(apkUrl, '_system');
      progressCb(100);
      return { success: true };
    }
  } else {
    // Browser fallback
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'VortexDownloader-update.apk';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    progressCb(100);
    return { success: true };
  }
}
