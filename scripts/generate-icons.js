import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SVG_LOGO = `<svg width="1024" height="1024" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vortex-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF3B30" />
      <stop offset="100%" stop-color="#FF9500" />
    </linearGradient>
  </defs>
  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18Z" fill="url(#vortex-logo-grad)" opacity="0.15"/>
  <path d="M12 4C7.58 4 4 7.58 4 12C4 13.52 4.42 14.94 5.16 16.16L6.86 14.46C6.48 13.73 6.27 12.89 6.27 12C6.27 8.84 8.84 6.27 12 6.27C12.89 6.27 13.73 6.48 14.46 6.86L16.16 5.16C14.94 4.42 13.52 4 12 4Z" fill="url(#vortex-logo-grad)"/>
  <path d="M12 19.73C8.84 19.73 6.27 17.16 6.27 14C6.27 13.11 6.48 12.27 6.86 11.54L5.16 9.84C4.42 11.06 4 12.48 4 14C4 18.42 7.58 22 12 22C13.52 22 14.94 21.58 16.16 20.84L14.46 19.14C13.73 19.52 12.89 19.73 12 19.73Z" fill="url(#vortex-logo-grad)" opacity="0.8"/>
  <path d="M17.14 7.84C17.52 8.57 17.73 9.41 17.73 10.3C17.73 13.46 15.16 16.03 12 16.03C11.11 16.03 10.27 15.82 9.54 15.44L7.84 17.14C9.06 17.88 10.48 18.3 12 18.3C16.42 18.3 20 14.72 20 10.3C20 8.78 19.58 7.36 18.84 6.14L17.14 7.84Z" fill="url(#vortex-logo-grad)"/>
</svg>`;

const SIZES = [
  { folder: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { folder: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { folder: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { folder: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { folder: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 }
];

const resDir = path.resolve('android/app/src/main/res');

async function generate() {
  console.log('Generating Android app icons from Vortex logo...');
  const svgBuffer = Buffer.from(SVG_LOGO);

  for (const s of SIZES) {
    const targetDir = path.join(resDir, s.folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Foreground icon (logo placed in safe area center with transparent bg)
    const fgLogoSize = Math.round(s.foreground * 0.65);
    const fgLogoBuffer = await sharp(svgBuffer)
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
        input: fgLogoBuffer,
        top: Math.round((s.foreground - fgLogoSize) / 2),
        left: Math.round((s.foreground - fgLogoSize) / 2)
      }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    // 2. Standard Launcher icon (Dark rounded square with subtle border & glowing logo)
    const launcherLogoSize = Math.round(s.launcher * 0.72);
    const launcherLogo = await sharp(svgBuffer)
      .resize(launcherLogoSize, launcherLogoSize)
      .toBuffer();

    // Dark sleek background
    await sharp({
      create: {
        width: s.launcher,
        height: s.launcher,
        channels: 4,
        background: { r: 15, g: 17, b: 23, alpha: 1 }
      }
    })
      .composite([{
        input: launcherLogo,
        top: Math.round((s.launcher - launcherLogoSize) / 2),
        left: Math.round((s.launcher - launcherLogoSize) / 2)
      }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 3. Round Launcher icon
    const roundMaskSvg = Buffer.from(`
      <svg width="${s.launcher}" height="${s.launcher}">
        <circle cx="${s.launcher / 2}" cy="${s.launcher / 2}" r="${s.launcher / 2}" fill="#fff" />
      </svg>
    `);

    const roundBase = await sharp({
      create: {
        width: s.launcher,
        height: s.launcher,
        channels: 4,
        background: { r: 15, g: 17, b: 23, alpha: 1 }
      }
    })
      .composite([{
        input: launcherLogo,
        top: Math.round((s.launcher - launcherLogoSize) / 2),
        left: Math.round((s.launcher - launcherLogoSize) / 2)
      }])
      .png()
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

  // Also generate splash icon if needed in drawable
  const splashDir = path.join(resDir, 'drawable');
  if (fs.existsSync(splashDir)) {
    const splashLogo = await sharp(svgBuffer).resize(256, 256).toBuffer();
    await sharp(splashLogo).toFile(path.join(splashDir, 'splash.png')).catch(() => {});
  }

  console.log('Successfully generated all Android launcher icons!');
}

generate().catch(console.error);
