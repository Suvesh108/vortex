import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function getGitToken() {
  try {
    const creds = execSync('git credential fill', { 
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf-8' 
    });
    const match = creds.match(/password=(.*)/);
    if (match) return match[1].trim();
  } catch (e) {
    console.error('Error fetching git credential:', e.message);
  }
  return process.env.GITHUB_TOKEN || '';
}

async function run() {
  const token = await getGitToken();
  if (!token) {
    console.error('No GitHub token found!');
    process.exit(1);
  }

  const owner = 'Suvesh108';
  const repo = 'vortex';
  const tag = process.argv[2] || 'v0.2';
  const versionNum = tag.replace(/^v/i, '');

  console.log(`Checking existing release for tag ${tag}...`);
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'VortexDownloader-Release-Bot',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  let release;
  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, {
    headers
  });

  const releaseBody = `## 📱 VortexDownloader ${tag} - Android APK & Desktop Release

- **Android APK (Direct Install)**: \`VortexDownloader-${tag}.apk\`

✨ **What's New in ${tag}**:
- ⚙️ **Hybrid Go Core + Python Extractor**: Ultra-fast Go networking engine on port 5001 paired with zero-overhead Python sidecar on port 5002 for high-concurrency downloads.
- 🎛️ **Streamlined 7-Section Settings Architecture**: Reorganized settings from 12 fragmented sections down to 7 clean, powerhouse categories (Engine & Multi-Thread Core, Downloads & File Routing, Concurrency & Performance, Browser Extension & Aria2 Bridge, Appearance & Interface, System Hooks & Storage, and About & Updates).
- 🛡️ **4-Tier Bot-Guard Bypass**: Automatic browser cookie inheritance (Edge, Chrome, Firefox, Brave), client identity rotation (Desktop/Mobile/TV), and desktop client hints to bypass Cloudflare and bot checks.
- 📊 **Real-Time IDM/FDM Progress Telemetry**: Zero-jump live progress tracking with accurate throughput, ETA, and per-chunk visual progress.
- 🎥 **Full Resolution Detection (720p, 1080p, 2K, 4K)**: Enabled Node.js JS runtime and removed player skip flags to ensure all supported resolutions are detected and selectable.
- 🔔 **System Integration & Chimes**: Added real-time clipboard monitoring, desktop OS notifications, Web Audio completion chime, and post-download webhooks.
- 📱 **Signed Android Release APK**: Built with optimized assets, sandboxed in-app browser, and integrated updater.
`;

  if (getRes.status === 200) {
    release = await getRes.json();
    console.log(`Found existing release: ${release.name} (id: ${release.id})`);
  } else {
    console.log(`Creating new release for ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: 'main',
        name: `VortexDownloader ${tag}`,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create release: ${createRes.status} ${err}`);
    }
    release = await createRes.json();
    console.log(`Created release id: ${release.id}`);
  }

  // Upload Single Release APK Asset
  const apkFiles = [
    { name: `VortexDownloader-${tag}.apk`, path: `release/VortexDownloader-${tag}.apk` }
  ];

  for (const apk of apkFiles) {
    const filePath = path.resolve(apk.path);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = apk.name;

    // Check if asset already exists on release
    const existingAsset = release.assets?.find(a => a.name === fileName);
    if (existingAsset) {
      console.log(`Deleting existing asset ${fileName} (${existingAsset.id})...`);
      await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers
      });
    }

    console.log(`Uploading ${fileName} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)...`);
    const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(fileName)}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': fileBuffer.length.toString()
      },
      body: fileBuffer
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error(`Failed to upload ${fileName}:`, err);
    } else {
      const asset = await uploadRes.json();
      console.log(`Successfully uploaded ${fileName} -> ${asset.browser_download_url}`);
    }
  }

  console.log(`\n🎉 Release published successfully at: ${release.html_url}`);
}

run().catch(err => {
  console.error('Release failed:', err);
  process.exit(1);
});
