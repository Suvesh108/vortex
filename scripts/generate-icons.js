import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const LOGO_PATH = path.resolve('frontend/public/assets/logo.png');

const SIZES = [
  { folder: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { folder: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { folder: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { folder: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { folder: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 }
];

const resDir = path.resolve('android/app/src/main/res');

async function generate() {
  console.log('Generating Android app icons from new Vortex logo...');
  if (!fs.existsSync(LOGO_PATH)) {
    throw new Error(`Logo file not found at ${LOGO_PATH}`);
  }

  const logoBuffer = await fs.promises.readFile(LOGO_PATH);

  for (const s of SIZES) {
    const targetDir = path.join(resDir, s.folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Foreground icon (scaled into safe area center with transparent background)
    const fgLogoSize = Math.round(s.foreground * 0.72);
    const fgLogo = await sharp(logoBuffer)
      .resize(fgLogoSize, fgLogoSize)
      .toBuffer();

    await sharp({
      create: {
        width: s.foreground,
        height: s.foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: fgLogo,
        top: Math.round((s.foreground - fgLogoSize) / 2),
        left: Math.round((s.foreground - fgLogoSize) / 2)
      }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    // 2. Standard Launcher icon
    await sharp(logoBuffer)
      .resize(s.launcher, s.launcher)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 3. Round Launcher icon
    const roundMaskSvg = Buffer.from(`
      <svg width="${s.launcher}" height="${s.launcher}">
        <circle cx="${s.launcher / 2}" cy="${s.launcher / 2}" r="${s.launcher / 2}" fill="#fff" />
      </svg>
    `);

    const roundBase = await sharp(logoBuffer)
      .resize(s.launcher, s.launcher)
      .toBuffer();

    await sharp(roundBase)
      .composite([{
        input: roundMaskSvg,
        blend: 'dest-in'
      }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    console.log(`Generated icons for ${s.folder}`);
  }

  // Also generate splash icon in drawable
  const splashDir = path.join(resDir, 'drawable');
  if (fs.existsSync(splashDir)) {
    await sharp(logoBuffer)
      .resize(256, 256)
      .png()
      .toFile(path.join(splashDir, 'splash.png'))
      .catch(() => {});
  }

  console.log('Successfully generated all Android launcher icons from new logo!');
}

generate().catch(console.error);
