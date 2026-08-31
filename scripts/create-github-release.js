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
  const tag = 'v0.1';

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

  const releaseBody = `## 📱 VortexDownloader v0.1 - Android & Web Release

- **Android APK (Direct Install)**: \`VortexDownloader-v0.1.apk\`

✨ **Features**
- Universal Media Extraction: YouTube, TikTok, Twitter/X, Vimeo, Soundcloud and more.
- High-Bitrate 4K / 1080p Video and 320kbps MP3 Audio conversions.
- Native mobile layout built for Android touch displays with sleek dark aesthetic.
- Zero ads, zero tracking, fast multi-threaded parallel downloads.
- Real-time download progress tracking with live bitrate & ETA counter.
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
        name: 'VortexDownloader v0.1',
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

  // Upload Assets
  const apkFiles = [
    { name: 'VortexDownloader-v0.1.apk', path: 'release/VortexDownloader-v0.1.apk' },
    { name: 'vortexdownloader.apk', path: 'release/VortexDownloader-v0.1.apk' }
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
