export const APP_VERSION = 'v0.3';

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
  const latestTag = data.tag_name || data.name || 'v0.2';
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
