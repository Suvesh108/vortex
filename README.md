<div align="center">
  <img src="frontend/public/assets/logo-og.png" alt="VortexDownloader Logo" width="100%" />
  
  <br />
  <br />

  <h1>VortexDownloader</h1>
  
  <p>
    <strong>Professional high-bitrate media extraction utility. Download videos from YouTube, Vimeo, TikTok, Soundcloud, and more with multi-threaded parallel speeds, lossless audio-video merging, and zero ads.</strong>
  </p>

  <p>
    <a href="#features">Features</a> • 
    <a href="#android-app">Android APK</a> • 
    <a href="#installation">Installation</a> • 
    <a href="#tech-stack">Tech Stack</a> • 
    <a href="#architecture">Architecture</a>
  </p>
</div>

<hr />

## 📱 Android & Desktop (v0.6.6)

VortexDownloader is an ultra-fast, universal downloading engine powered by a **Hybrid Architecture (Go Core + Python Media Extractor)** with dynamic multi-pipe streaming, real-time IDM/FDM progress telemetry, 4-tier bot-guard evasion, and a streamlined 7-section Settings control center!

- **Download APK (v0.6.6)**: [**VortexDownloader-v0.6.6.apk**](release/VortexDownloader-v0.6.6.apk)
- **Version**: `0.6.6` (Release v0.6.6)
- **Package ID**: `io.vortexdownloader.app`
- **What's New in v0.6.6**:
  - ⚙️ **Hybrid Go Core + Python Extractor**: Ultra-fast Go networking engine on port 5001 paired with a zero-overhead Python sidecar on port 5002 for rock-solid stability and throughput.
  - 🎛️ **Streamlined 7-Section Settings Architecture**: Reorganized settings from 12 fragmented sections down to 7 cohesive, powerhouse categories (Engine & Multi-Thread Core, Downloads & File Routing, Concurrency & Performance, Browser Extension & Aria2 Bridge, Appearance & Interface, System Hooks & Storage, and About & Updates).
  - 🛡️ **4-Tier Bot-Guard Bypass**: Automatic browser cookie inheritance (Edge, Chrome, Firefox, Brave), client identity rotation (Desktop/Mobile/TV), and desktop client hints to bypass Cloudflare and bot checks.
  - 📊 **Real-Time IDM/FDM Progress Telemetry**: Zero-jump live progress tracking with accurate throughput, ETA, and per-chunk visual progress.
  - 🎥 **Full Resolution Detection (720p, 1080p, 2K, 4K)**: Enabled Node.js JS runtime and removed player skip flags to ensure all supported resolutions are detected and selectable.
  - 🔔 **System Integration & Chimes**: Added real-time clipboard monitoring, desktop OS notifications, Web Audio completion chime, and post-download webhooks.
  - 🌐 **Browser Moved to Bottom Navbar Next to Add Task**: Moved the browser entry point from the top header into the bottom navigation bar right next to the elevated center `+ Add Task` button.
  - 🎨 **Symmetrical 5-Item Navigation Grid**: Clean, balanced bottom navigation (`Tasks`, `Vault`, `New Task`, `Browser`, `Settings`) with the elevated center hero button positioned at exactly 50% and direct access to the built-in browser right beside it.
  - 🔍 **Maximized Mobile Header**: Cleaned up the top header with the full-width search input for a streamlined mobile experience.
  - 🎯 **100% Mathematically Accurate Progress Bar**: Completely eliminated the 95% progress jump bug caused by indeterminate CDN content-length headers. Added automated HTTP `Range: bytes=0-1` byte-probe size discovery, fallback format size estimation, and real downloaded payload tracking with exact percentage & ETA.
  - 🐍 **Pure Python Backend Architecture**: Full migration of the backend engine to high-concurrency FastAPI/Uvicorn, removing all TypeScript backend bottlenecks.
  - 🎬 **Zero-Jitter Universal Media Engine**: 100% compliant H.264 video + standard 192k AAC audio with `+faststart` metadata for stutter-free playback across Windows Media Player, Movies & TV, and default Android gallery players.
  - ⚡ **16-Pipe Multi-Segmented Turbo Downloader**: Parallel HTTP byte-range slicing with real-time speed & ETA telemetry.
  - 📦 **All 9 Feature Packs Verified**: Complete support for HttpPack, FFmpegPack, BitTorrentPack, ED2kPack, FtpPack, GitHubPack, HuggingFacePack, M3U8Pack, and YouTubePack.
  - 📥 **Seamless Inbuilt Browser Task Ingestion**: Top-bar **"⚡ Add"** button, floating **"⚡ Add to Vortex"** FAB, long-press link sniffer, and direct wire-up into `AddTaskModal` with automatic pack detection and URL parsing.
  - 📱 **Android-Specific Update UI**: Clean Android update experience with live streaming progress and automatic APK install prompts.
  - 🌐 **Native Sandboxed Inbuilt Browser**: Isolated private browsing sandbox with zero personal Google/Gmail account leakage.
  - 🌐 **16-Host Universal Media Engine**: Dedicated scrapers, API resolvers, and stream decoders for:
    - 📦 **TeraBox** (terabox.com, teraboxapp.com, 1024tera.com, 4funbox, nephobox, etc.)
    - 💿 **DiskWala** (diskwala.com, diskwla.in)
    - 🦤 **DoodStream** (doodstream.com, dood.to, dood.so, dood.ws, dood.sh, etc.)
    - 📼 **Streamtape** (streamtape.com, streamtape.net, streamta.pe, tapecontent.net, strtape.cloud)
    - 🌙 **FileMoon** (filemoon.sx, filemoon.to, filemoon.in, filemoon.link)
    - 🛡️ **VidBunker** (vidbunker.com, vidbunker.to)
    - 💾 **ByteDisk** (bytedisk.com, bytebox)
    - 🌠 **StreamWish** (streamwish.to, swhls.com, wishfast.top, wishembed.pro)
    - 👁️ **Vidhide** (vidhide.com, vidhidepro.com, vidhideplus.com, vidhide.org)
    - 🦁 **FileLions** (filelions.com, filelions.to, filelions.site, filelions.online)
    - 💧 **MixDrop** (mixdrop.co, mixdrop.to, mixdrop.sx, mixdrop.bz, mixdrop.ch)
    - ⚡ **StreamHG** (streamhg.com)
    - 🛡️ **VidGuard** (vidguard.to, vgembed.com, vidguard.net)
    - 🌊 **Upstream** (upstream.to, upstreamcdn.co)
    - 🎭 **VOE** (voe.sx, voe-network.net, voeunblk.com)
    - 📺 **StreamSB** (streamsb.net, sbchill.com, sbfull.com, sbfast.com, sbembed.com)
  - 🔓 **Packed JS Deobfuscator Engine (`unpackJs`)**: Automatically unrolls Dean Edwards' packed javascript `eval(function(p,a,c,k,e,d)...)` blocks across hosting sites.
  - 📂 **Full In-App Suite**: PIN/Biometric Secret Vault, Web Browser with 1-Tap Sniffer, and Background MediaSession Controls.

### Building Android APK Locally
```bash
# Generate launcher icons from logo
npm run generate:icons

# Build web distribution and sync Capacitor
npm run build:apk

# Compile with Gradle
cd android && ./gradlew assembleRelease
```
The signed APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.

## ⚡ Features

- **Universal Support**: Powered by `yt-dlp`, supports extraction from over 1000+ media platforms (YouTube, Twitter, TikTok, Vimeo, Soundcloud).
- **High-Bitrate & 4K Ready**: Automatically buffers the highest available video and audio bitrates.
- **Lossless Multiplexing**: Uses `FFmpeg` to cleanly stitch and merge disparate audio and video tracks without loss of quality.
- **Multi-threaded Engine**: Parallel fetch threads ensure maximum bandwidth saturation for faster downloads.
- **Zero Ads, Zero Telemetry**: Clean, sandboxed extraction without referral bloat or trackers.
- **Sleek React Dashboard**: Modern glassmorphic interface, dark mode, terminal logs, and history caching.

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3.8+](https://www.python.org/)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/Suvesh108/vortex.git
cd vortex

# Install Node dependencies (includes frontend & backend packages)
npm install
```

### 2. Install Python Core Dependencies
Vortex requires `yt-dlp` and `static-ffmpeg` to process media correctly.
```bash
pip install yt-dlp static-ffmpeg
```

### 3. Run the Development Environment
Start both the Vite frontend and Express backend concurrently:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

## 🌐 Cloud Deployment

### Option 1: Render (Full-Stack All-in-One — Recommended)
Render runs the Docker container with the Node backend, Python 3, and FFmpeg:
1. Connect your GitHub repository to [Render](https://render.com/).
2. Create a new **Web Service** and choose **Docker** runtime (or apply Blueprint via `render.yaml`).
3. Set the Health Check Path to `/api/health`.
4. Deploy! Your app will be live with full video extraction and stitching capabilities.

### Option 2: Split Deployment (Vercel Frontend + Render Backend)
- **Frontend (Vercel)**:
  1. Import the repository into [Vercel](https://vercel.com/).
  2. Set the Environment Variable: `VITE_API_URL=https://your-backend-service.onrender.com`
  3. Deploy!
- **Backend (Render)**:
  1. Deploy as a Docker Web Service on Render using the included `Dockerfile`.

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons.
- **Backend**: Express (Node.js), TypeScript (`tsx`).
- **Extraction Engine**: Python, `yt-dlp` (Stream Extraction), `static-ffmpeg` (Multiplexing).

## 🧠 Architecture Overview

VortexDownloader uses a unique split-tier architecture:
1. **The React Client** provides an aesthetic UI for pasting links and tracking progress visually. It proxies requests via `/api` to the backend.
2. **The Express Server** acts as the command dispatcher, securely handling inbound URLs.
3. **The Python Core (`downloader.py`)** runs as an isolated subprocess. It queries metadata, selects formats, downloads parts concurrently, and instructs `FFmpeg` to stitch the final outputs into the `temp_downloads` cache before delivering them back to the user's browser.

## 📝 License
© 2026 VortexDownloader. Open-source utility. All rights reserved.
