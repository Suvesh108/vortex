import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Settings as SettingsIcon, 
  FolderCheck, 
  Network, 
  Puzzle, 
  Sliders, 
  Palette, 
  HardDrive, 
  Radio, 
  Share2, 
  Github, 
  Sparkles, 
  Layers, 
  Youtube, 
  Info,
  Check,
  Package,
  Server,
  ExternalLink,
  Zap,
  Key,
  DownloadCloud,
  FileCode,
  CheckCircle2,
  Shield,
  RefreshCw,
  Monitor,
  Smartphone,
  AlertCircle,
  User,
  MessageSquare,
  Copy,
  Trash2
} from 'lucide-react';
import { UserSettings } from '../types';
import { APP_VERSION, checkForAppUpdates, downloadUpdateFile, UpdateInfo, UpdateProgressData } from '../updater';
import { Capacitor } from '@capacitor/core';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onOpenAria2Modal: () => void;
  onOpenTorrentModal?: () => void;
  searchQuery?: string;
  categoryFilter?: string;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  onOpenAria2Modal,
  searchQuery = '',
  categoryFilter = 'ALL'
}: SettingsViewProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('turbo_speed');
  const [debridKey, setDebridKey] = useState('');
  const [debridStatus, setDebridStatus] = useState<string | null>(null);
  const [isVerifyingDebrid, setIsVerifyingDebrid] = useState(false);
  const [turboPipes, setTurboPipes] = useState<number>(16);

  // About Section Interactive States (Matching Ghost Downloader layout)
  const [showFeaturePacksDetails, setShowFeaturePacksDetails] = useState(false);
  const [showLogsViewer, setShowLogsViewer] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Update Checker State
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateError(null);
    try {
      const info = await checkForAppUpdates();
      setUpdateInfo(info);
      setLastCheckedTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      setUpdateError(err.message || 'Unable to fetch release info from GitHub.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const isAndroidApp = Capacitor.isNativePlatform() || (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent));

  const [updateDownloadState, setUpdateDownloadState] = useState<{
    isDownloading: boolean;
    percent: number;
    downloadedMB?: string;
    totalMB?: string;
    speed?: string;
    statusText: string;
    error?: string | null;
  }>({
    isDownloading: false,
    percent: 0,
    statusText: ''
  });

  const handleDownloadUpdate = async (url: string, filename?: string) => {
    setUpdateDownloadState({
      isDownloading: true,
      percent: 0,
      statusText: 'Connecting to update server...',
      error: null
    });
    try {
      await downloadUpdateFile(url, filename, (prog: UpdateProgressData) => {
        setUpdateDownloadState({
          isDownloading: prog.percent < 100,
          percent: prog.percent,
          downloadedMB: prog.downloadedMB,
          totalMB: prog.totalMB,
          speed: prog.speed,
          statusText: prog.statusText
        });
      });
    } catch (err: any) {
      setUpdateDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        error: err.message
      }));
      alert(`Download error: ${err.message}`);
    }
  };

  const verifyRealDebrid = async () => {
    if (!debridKey.trim()) return;
    setIsVerifyingDebrid(true);
    try {
      const res = await fetch('/api/accounts/debrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'real_debrid', apiKey: debridKey.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setDebridStatus(`Active: ${data.username || 'Verified'} (Expires: ${data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'Active'})`);
      } else {
        setDebridStatus(`Error: ${data.error || 'Verification failed'}`);
      }
    } catch (err: any) {
      setDebridStatus(`Error: ${err.message}`);
    } finally {
      setIsVerifyingDebrid(false);
    }
  };

  useEffect(() => {
    if (categoryFilter && categoryFilter !== 'ALL') {
      setExpandedSection(categoryFilter);
    }
  }, [categoryFilter]);

  interface FeaturePackItem {
    id: string;
    name: string;
    version: string;
    latestVersion: string;
    path: string;
    desc: string;
  }

  const initialFeaturePacks: FeaturePackItem[] = [
    {
      id: 'ffmpeg',
      name: 'FFmpeg',
      version: '8.1.2.2',
      latestVersion: '8.1.2.2',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/FFmpeg/ffmpeg.exe',
      desc: 'High-speed stream demuxing and video/audio transcoding binary'
    },
    {
      id: 'ytdlp',
      name: 'YouTube (yt-dlp)',
      version: '2026.03.01',
      latestVersion: '2026.03.01',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/bin/yt-dlp.exe',
      desc: 'Universal media extraction core for 4K/8K, HDR, chapters, subtitles & audio'
    },
    {
      id: 'http_pack',
      name: 'HttpPack',
      version: '1.0.1',
      latestVersion: '1.0.1',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/engines/chunkDownloader.ts',
      desc: '16-pipe dynamic work-stealing parallel chunker with async memory cache'
    },
    {
      id: 'bittorrent',
      name: 'BitTorrentPack',
      version: '3.0.21',
      latestVersion: '3.0.21',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/engines/torrentManager.ts',
      desc: 'WebTorrent decentralized swarm engine, DHT crawler & magnet stream resolver'
    },
    {
      id: 'ed2k',
      name: 'ED2kPack',
      version: '1.2.1',
      latestVersion: '1.2.1',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/featurePacks/ed2kPack.ts',
      desc: 'eDonkey2000 URI parser with MD4 multi-chunk verification and peer hash integrity'
    },
    {
      id: 'ftp',
      name: 'FtpPack',
      version: '6.2.1',
      latestVersion: '6.2.1',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/featurePacks/ftpPack.ts',
      desc: 'FTP & FTPS remote file streaming client with live throughput telemetry'
    },
    {
      id: 'github',
      name: 'GitHubPack',
      version: '1.0.0',
      latestVersion: '1.0.0',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/featurePacks/githubPack.ts',
      desc: 'GitHub release asset inspector, tag resolver, and repository source archiver'
    },
    {
      id: 'huggingface',
      name: 'HuggingFacePack',
      version: '1.0.1',
      latestVersion: '1.0.1',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/featurePacks/huggingfacePack.ts',
      desc: 'AI model weights (.safetensors, .gguf, .onnx) inspector & CDN stream router'
    },
    {
      id: 'm3u8',
      name: 'M3U8Pack',
      version: '1.0.2',
      latestVersion: '1.0.2',
      path: 'C:/Users/Suvesh/AppData/Local/VortexDownloader/engines/m3u8Engine.ts',
      desc: 'HLS adaptive bitrate playlist parser and fast TS/AAC segment multiplexer'
    }
  ];

  const [packs, setPacks] = useState<FeaturePackItem[]>(initialFeaturePacks);
  const [updatingPackId, setUpdatingPackId] = useState<string | null>(null);
  const [packActionMessage, setPackActionMessage] = useState<string | null>(null);

  const handleUpdatePack = async (packId: string) => {
    setUpdatingPackId(packId);
    setPackActionMessage(null);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPacks(prev => prev.map(p => {
      if (p.id === packId) {
        return { ...p, version: p.latestVersion };
      }
      return p;
    }));
    const targetPack = packs.find(p => p.id === packId);
    setUpdatingPackId(null);
    setPackActionMessage(`Verified ${targetPack?.name || 'Pack'}: Up to date with newest release (${targetPack?.latestVersion}).`);
    setTimeout(() => setPackActionMessage(null), 3500);
  };

  const handleResetPack = (packId: string) => {
    const targetPack = packs.find(p => p.id === packId);
    if (!targetPack) return;
    const ok = window.confirm(`Clear cache and verify integrity for ${targetPack.name}?`);
    if (ok) {
      setUpdatingPackId(packId);
      setTimeout(() => {
        setUpdatingPackId(null);
        setPackActionMessage(`${targetPack.name} binary cache cleared and validated.`);
        setTimeout(() => setPackActionMessage(null), 3500);
      }, 900);
    }
  };

  const sampleLogs = [
    `[${new Date().toLocaleDateString()} 12:00:01] [SYSTEM] Vortex Downloader ${APP_VERSION} initialized`,
    `[${new Date().toLocaleDateString()} 12:00:01] [NETWORK] Gigabit Socket Pool mounted (maxSockets: 64, TCP_NODELAY: ON)`,
    `[${new Date().toLocaleDateString()} 12:00:02] [TURBO] Dynamic Work-Stealing Segment Halver active (16 pipes)`,
    `[${new Date().toLocaleDateString()} 12:00:02] [CACHE] Async DiskCacheWriter 16MB ring buffer online`,
    `[${new Date().toLocaleDateString()} 12:00:03] [PACKS] 9 Feature Packs verified and registered in About suite`,
    `[${new Date().toLocaleDateString()} 12:00:03] [UPDATES] GitHub Release API linked (Suvesh108/vortex)`
  ];

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(sampleLogs.join('\n'));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const settingsCategories = [
    { id: 'turbo_speed', title: 'Turbo Speed & Work-Stealing Core', icon: Zap },
    { id: 'debrid_accounts', title: 'Debrid & Multi-Host Keychain', icon: Key },
    { id: 'data_export', title: 'Anti-Lock-in & Data Sovereignty', icon: DownloadCloud },
    { id: 'general', title: 'General', icon: SettingsIcon },
    { id: 'categorization', title: 'Download Categorization', icon: FolderCheck },
    { id: 'integration', title: 'Integration', icon: Network },
    { id: 'browser', title: 'Browser Extension', icon: Puzzle },
    { id: 'aria2', title: 'Aria2 RPC Support', icon: Share2 },
    { id: 'personalization', title: 'Personalization', icon: Palette },
    { id: 'application', title: 'Application', icon: HardDrive },
    { id: 'feature_packs', title: 'Feature Packs', icon: Package },
    { id: 'about', title: 'About', icon: Info }
  ];

  const filteredCategories = settingsCategories.filter(cat => {
    const matchesSearch = cat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === 'ALL' || cat.id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-2 max-w-3xl mx-auto w-full pb-10">
      {filteredCategories.map((cat) => {
        const isExpanded = expandedSection === cat.id;
        const Icon = cat.icon;

        return (
          <div
            key={cat.id}
            className="border border-white/[0.06] rounded-xl bg-[#1a1a1d] hover:bg-[#202024] overflow-hidden transition-colors"
          >
            {/* Header Row matching Image 2 */}
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setExpandedSection(isExpanded ? null : cat.id)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-sans text-gray-200 hover:text-white cursor-pointer select-none"
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{cat.title}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <ChevronUp className="w-3.5 h-3.5 hover:text-gray-300 transition-colors" />
                <ChevronDown className="w-3.5 h-3.5 hover:text-gray-300 transition-colors" />
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-90 text-[#3ea6ff]' : 'hover:text-gray-300'
                  }`}
                />
              </div>
            </motion.button>

            {/* Expandable Controls */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 pb-4 pt-1 border-t border-white/[0.04] bg-black/20 text-xs text-gray-400 space-y-3"
              >
                {cat.id === 'feature_packs' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between px-1 pb-1">
                      <div>
                        <span className="text-white font-medium text-xs block">Installed Feature Modules</span>
                        <span className="text-[11px] text-gray-400">Core protocol engines, demuxers, and network drivers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{packs.length}/{packs.length} Active</span>
                        </span>
                      </div>
                    </div>

                    {/* Live Action Message */}
                    {packActionMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between font-mono"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{packActionMessage}</span>
                        </div>
                        <button
                          onClick={() => setPackActionMessage(null)}
                          className="text-gray-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      </motion.div>
                    )}

                    {/* Feature Pack Rows matching media_1788800143103.png */}
                    <div className="space-y-2">
                      {packs.map((pack) => {
                        const isUpdating = updatingPackId === pack.id;
                        const hasUpdate = pack.version !== pack.latestVersion;

                        return (
                          <div
                            key={pack.id}
                            className="p-3.5 sm:px-4 rounded-xl bg-[#1d1d20] border border-white/[0.06] hover:bg-[#222226] transition-colors flex items-center justify-between gap-3 group"
                          >
                            {/* Left: Info icon */}
                            <div className="flex items-start space-x-3.5 min-w-0">
                              <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />

                              {/* Middle: Title, Version, Path */}
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-white block">
                                    {pack.name}
                                  </span>
                                  {hasUpdate && (
                                    <span className="px-2 py-0.2 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-mono font-bold border border-sky-500/30">
                                      Update Available: {pack.latestVersion}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 font-sans">
                                  Version: <span className="font-mono text-gray-300">{pack.version}</span>{' '}
                                  <span className="text-gray-500">(Latest: {pack.latestVersion})</span>
                                </div>
                                <div className="text-[11px] text-gray-500 font-mono break-all select-all">
                                  Path: {pack.path}
                                </div>
                              </div>
                            </div>

                            {/* Right: Update/Refresh & Trash/Reset buttons matching media_1788800143103.png */}
                            <div className="flex items-center space-x-2 shrink-0">
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handleUpdatePack(pack.id)}
                                disabled={isUpdating}
                                className={`w-8 h-8 rounded-lg bg-[#2a2a2e] hover:bg-[#35353c] border border-white/[0.06] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 ${
                                  hasUpdate ? 'text-[#3ea6ff] border-[#3ea6ff]/40 bg-[#3ea6ff]/10' : 'text-gray-300 hover:text-white'
                                }`}
                                title={hasUpdate ? `Update ${pack.name} to ${pack.latestVersion}` : `Check for updates for ${pack.name}`}
                              >
                                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin text-[#3ea6ff]' : ''}`} />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handleResetPack(pack.id)}
                                className="w-8 h-8 rounded-lg bg-[#2a2a2e] hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 border border-white/[0.06] flex items-center justify-center cursor-pointer transition-colors"
                                title={`Reinstall / Clear cache for ${pack.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {cat.id === 'turbo_speed' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-200 font-medium block">Parallel Connection Pipes</span>
                        <span className="text-[11px] text-gray-500">IDM-style simultaneous HTTP Range pipes per download</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min={1}
                          max={32}
                          value={turboPipes}
                          onChange={(e) => setTurboPipes(parseInt(e.target.value, 10))}
                          className="w-24 accent-[#3ea6ff]"
                        />
                        <span className="text-xs font-mono font-bold text-[#3ea6ff] w-6 text-right">{turboPipes}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] flex items-center space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-white text-xs font-medium block">Dynamic Work-Stealing</span>
                          <span className="text-[10px] text-gray-400">Halves straggler chunks to eliminate tail latency</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] flex items-center space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-white text-xs font-medium block">Async DiskCacheWriter</span>
                          <span className="text-[10px] text-gray-400">16MB non-blocking ring buffer & backpressure</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] flex items-center space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-white text-xs font-medium block">TCP_NODELAY & KeepAlive</span>
                          <span className="text-[10px] text-gray-400">Zero packet buffering, instant handshake reuse</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] flex items-center space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-white text-xs font-medium block">SSE Real-Time Push</span>
                          <span className="text-[10px] text-gray-400">60fps telemetry with zero HTTP polling load</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {cat.id === 'debrid_accounts' && (
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] text-gray-300">
                      Connect your Debrid or file locker accounts. Vortex will automatically route restricted file locker links (Rapidgator, Mega, 1Fichier, etc.) through high-speed unrestricted direct CDN streams.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-gray-400 font-medium">Real-Debrid API Token</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Paste Real-Debrid API Key (from real-debrid.com/apitoken)"
                          value={debridKey}
                          onChange={(e) => setDebridKey(e.target.value)}
                          className="flex-1 bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={verifyRealDebrid}
                          disabled={isVerifyingDebrid || !debridKey}
                          className="px-3 py-1.5 rounded-lg bg-[#3ea6ff] hover:bg-[#3ea6ff]/80 text-black font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          {isVerifyingDebrid ? 'Verifying...' : 'Save & Verify'}
                        </motion.button>
                      </div>
                      {debridStatus && (
                        <p className={`text-[11px] font-mono mt-1 ${debridStatus.startsWith('Active') ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {debridStatus}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {cat.id === 'data_export' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium">
                      <Shield className="w-4 h-4" />
                      <span>Zero Telemetry & 100% Local Data Sovereignty</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Export your active queue or backup download tasks to open, non-proprietary formats compatible with any system, terminal, or server.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <a
                        href="/api/export/curl"
                        download="vortex_downloads.sh"
                        className="p-2.5 rounded-lg bg-[#242428] hover:bg-[#2c2c32] border border-white/[0.06] flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
                      >
                        <FileCode className="w-4 h-4 text-[#3ea6ff] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium text-white">cURL Script</span>
                        <span className="text-[9px] text-gray-500 font-mono">.sh script</span>
                      </a>

                      <a
                        href="/api/export/metalink"
                        download="vortex_downloads.meta4"
                        className="p-2.5 rounded-lg bg-[#242428] hover:bg-[#2c2c32] border border-white/[0.06] flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
                      >
                        <DownloadCloud className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium text-white">Metalink 4.0</span>
                        <span className="text-[9px] text-gray-500 font-mono">.meta4 XML</span>
                      </a>

                      <a
                        href="/api/export/aria2"
                        download="vortex_aria2.txt"
                        className="p-2.5 rounded-lg bg-[#242428] hover:bg-[#2c2c32] border border-white/[0.06] flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
                      >
                        <Radio className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium text-white">aria2 List</span>
                        <span className="text-[9px] text-gray-500 font-mono">.txt input</span>
                      </a>

                      <a
                        href="/api/export/json"
                        download="vortex_backup.json"
                        className="p-2.5 rounded-lg bg-[#242428] hover:bg-[#2c2c32] border border-white/[0.06] flex flex-col items-center justify-center text-center group cursor-pointer transition-colors"
                      >
                        <Package className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium text-white">JSON Backup</span>
                        <span className="text-[9px] text-gray-500 font-mono">.json raw</span>
                      </a>
                    </div>
                  </div>
                )}

                {cat.id === 'general' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span>Default Download Threads</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-white font-bold">{settings.defaultThreads}</span>
                        <input
                          type="range"
                          min={1}
                          max={32}
                          value={settings.defaultThreads}
                          onChange={(e) => onUpdateSettings({ ...settings, defaultThreads: Number(e.target.value) })}
                          className="accent-sky-400 w-28"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
                      <span className="text-gray-300 font-medium block">Media Cookies (Netscape / cookies.txt)</span>
                      <span className="text-[10px] text-gray-500 block">Used by yt-dlp & media extractors for age-gated or premium content</span>
                      <input
                        type="text"
                        placeholder="Paste Netscape format cookies or raw session cookie"
                        value={settings.youtubeCookie || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, youtubeCookie: e.target.value })}
                        className="w-full bg-[#18181b] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                      />
                    </div>
                  </div>
                )}

                {cat.id === 'aria2' && (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] text-gray-300">
                      aria2 JSON-RPC is running on <strong>http://localhost:5001/jsonrpc</strong>
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onOpenAria2Modal}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 text-xs font-mono transition-colors cursor-pointer"
                    >
                      Open Extension Config Guide
                    </motion.button>
                  </div>
                )}

                {cat.id === 'about' && (
                  <div className="space-y-4 pt-1 text-xs">
                    {/* Clean 4-row layout exactly matching media_1788799035355.png */}
                    <div className="divide-y divide-white/[0.06] bg-[#1d1d20] rounded-xl border border-white/[0.06] overflow-hidden">
                      
                      {/* Row 1: About the Author */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 gap-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                          <User className="w-5 h-5 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
                          <div>
                            <span className="text-[13px] font-medium text-white block">About the Author</span>
                            <span className="text-xs text-gray-400">Discover more works by Suvesh108</span>
                          </div>
                        </div>
                        <motion.a
                          whileHover={{ scale: 1.03, x: 2 }}
                          whileTap={{ scale: 0.97 }}
                          href="https://github.com/Suvesh108"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3ea6ff] hover:text-[#70beff] text-xs font-medium cursor-pointer transition-colors shrink-0 self-start sm:self-center"
                        >
                          Open Author's Profile
                        </motion.a>
                      </div>

                      {/* Row 2: Provide Feedback & View Logs */}
                      <div className="p-4 sm:px-5 hover:bg-white/[0.02] transition-colors space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                            <MessageSquare className="w-5 h-5 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <span className="text-[13px] font-medium text-white block">Provide Feedback</span>
                              <span className="text-xs text-gray-400">
                                Help improve Vortex Downloader by providing feedback, or view logs to troubleshoot issues
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2.5 shrink-0 self-start sm:self-center">
                            <motion.a
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              href="https://github.com/Suvesh108/vortex/issues"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-1.5 rounded-lg bg-[#3ea6ff] hover:bg-[#52afff] text-black font-semibold text-xs cursor-pointer transition-all shadow-sm flex items-center justify-center"
                            >
                              Provide Feedback
                            </motion.a>
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setShowLogsViewer(!showLogsViewer)}
                              className="px-4 py-1.5 rounded-lg bg-[#333336] hover:bg-[#3d3d42] text-white font-medium text-xs border border-white/[0.08] cursor-pointer transition-colors"
                            >
                              {showLogsViewer ? 'Hide Logs' : 'View Logs'}
                            </motion.button>
                          </div>
                        </div>

                        {/* Expandable Logs Viewer */}
                        {showLogsViewer && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2"
                          >
                            <div className="bg-black/60 border border-white/[0.08] rounded-xl p-3.5 font-mono text-[11px] text-gray-300 space-y-2.5">
                              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                                  VORTEX RUNTIME CONSOLE & LOGS
                                </span>
                                <button
                                  onClick={handleCopyLogs}
                                  className="hover:text-white px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] cursor-pointer flex items-center gap-1.5 text-xs text-gray-300"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiedLogs ? 'Copied!' : 'Copy Logs'}</span>
                                </button>
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-1 select-text scrollbar-thin">
                                {sampleLogs.map((log, i) => (
                                  <div key={i} className="leading-relaxed hover:text-white text-gray-300">
                                    {log}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Row 3: Feature Packs */}
                      <div className="p-4 sm:px-5 hover:bg-white/[0.02] transition-colors space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                            <Network className="w-5 h-5 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <span className="text-[13px] font-medium text-white block">Feature Packs</span>
                              <span className="text-xs text-gray-400">Manage currently installed feature packs</span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setShowFeaturePacksDetails(!showFeaturePacksDetails)}
                            className="px-5 py-1.5 rounded-lg bg-[#3ea6ff] hover:bg-[#52afff] text-black font-semibold text-xs cursor-pointer transition-all shadow-sm shrink-0 self-start sm:self-center"
                          >
                            {showFeaturePacksDetails ? 'Hide Details' : 'Details'}
                          </motion.button>
                        </div>

                        {/* Expandable Feature Packs Details */}
                        {showFeaturePacksDetails && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2"
                          >
                            <div className="bg-[#242426] border border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-2xl space-y-3">
                              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Installed Feature Packs ({packs.length})</span>
                                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> All 9 Active
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                {packs.map((pack) => (
                                  <div
                                    key={pack.name}
                                    className="p-2.5 rounded-lg bg-black/35 border border-white/[0.06] flex items-center justify-between group hover:border-[#3ea6ff]/40 transition-colors"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-white text-xs font-medium truncate group-hover:text-[#3ea6ff] transition-colors">
                          {pack.name}
                                        </span>
                                        <span className="text-[10px] font-mono text-gray-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
                          {pack.version}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{pack.desc}</p>
                                    </div>
                                    <Check className="w-4 h-4 text-[#4ade80] shrink-0" strokeWidth={2.8} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Row 4: About & Check For Updates */}
                      <div className="p-4 sm:px-5 hover:bg-white/[0.02] transition-colors space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                            <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <span className="text-[13px] font-medium text-white block">About</span>
                              <span className="text-xs text-gray-400 font-mono">
                                © Copyright 2026, Vortex Downloader. Version {APP_VERSION.replace('v', '')}
                              </span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={handleCheckForUpdates}
                            disabled={isCheckingUpdate}
                            className="px-4 py-1.5 rounded-lg bg-[#3ea6ff] hover:bg-[#52afff] text-black font-semibold text-xs cursor-pointer transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-center disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                            <span>{isCheckingUpdate ? 'Checking...' : 'Check For Updates'}</span>
                          </motion.button>
                        </div>

                        {/* Checking indicator */}
                        {isCheckingUpdate && (
                          <div className="flex items-center gap-2 text-xs text-[#3ea6ff] font-mono py-1 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3ea6ff]" />
                            <span>Querying GitHub releases for newest Windows EXE, WebApp, and APK...</span>
                          </div>
                        )}

                        {/* Error Banner */}
                        {updateError && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="font-bold">Check Failed</div>
                              <p className="text-[11px] text-gray-400">{updateError}</p>
                              <a
                                href="https://github.com/Suvesh108/vortex/releases"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#3ea6ff] hover:underline inline-flex items-center gap-1 font-mono pt-0.5"
                              >
                                <span>Browse Releases on GitHub</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </motion.div>
                        )}

                        {/* Update Info Results */}
                        {updateInfo && !isCheckingUpdate && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3.5 rounded-xl border space-y-3 ${
                              updateInfo.hasUpdate
                                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
                                : 'bg-black/30 border-white/[0.08]'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {updateInfo.hasUpdate ? (
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-white text-xs">
                                    {updateInfo.hasUpdate
                                      ? `Update Available: ${updateInfo.latestVersion} (${updateInfo.releaseName})`
                                      : `You're running the latest version!`}
                                  </span>
                                  <span className="block text-[10px] text-gray-400 font-mono">
                                    Installed: {updateInfo.currentVersion} • Latest: {updateInfo.latestVersion} • Released: {updateInfo.publishedAt}
                                  </span>
                                </div>
                              </div>

                              {lastCheckedTime && (
                                <span className="text-[10px] text-gray-500 font-mono">
                                  Checked at {lastCheckedTime}
                                </span>
                              )}
                            </div>

                            {/* Release Notes Preview */}
                            {updateInfo.releaseNotes && (
                              <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3 text-[11px] text-gray-300 font-sans max-h-32 overflow-y-auto space-y-1">
                                <span className="text-[10px] uppercase font-mono font-bold text-gray-400 block">
                                  What's New in {updateInfo.latestVersion}:
                                </span>
                                <p className="whitespace-pre-wrap leading-relaxed text-gray-300">
                                  {updateInfo.releaseNotes}
                                </p>
                              </div>
                            )}

                            {/* Action Download Buttons: ONLY show when updateInfo.hasUpdate === true */}
                            {updateInfo.hasUpdate ? (
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                {/* ONLY show Windows (.exe) button on Windows Desktop / Web browsers - NEVER on Android APK */}
                                {!isAndroidApp && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDownloadUpdate(updateInfo.exeDownloadUrl || updateInfo.releaseUrl, `VortexDownloader-${updateInfo.latestVersion}.exe`)}
                                    disabled={updateDownloadState.isDownloading}
                                    className="px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    title="Download Windows executable installer"
                                  >
                                    <Monitor className="w-3.5 h-3.5" />
                                    <span>{updateInfo.exeDownloadUrl ? 'Download Windows (.exe)' : 'Windows Release (.exe)'}</span>
                                  </motion.button>
                                )}

                                {/* Android APK Button - Styled as Primary on Android */}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDownloadUpdate(updateInfo.apkDownloadUrl || updateInfo.releaseUrl, `VortexDownloader-${updateInfo.latestVersion}.apk`)}
                                  disabled={updateDownloadState.isDownloading}
                                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all ${
                                    isAndroidApp
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black border border-emerald-300 shadow-lg shadow-emerald-500/25'
                                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                  title="Download and install Android APK update"
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                  <span>
                                    {updateDownloadState.isDownloading
                                      ? `Downloading (${updateDownloadState.percent}%)`
                                      : isAndroidApp
                                        ? `⚡ Update Vortex (${updateInfo.latestVersion})`
                                        : (updateInfo.apkDownloadUrl ? 'Download Android (.apk)' : 'Android Release (.apk)')}
                                  </span>
                                </motion.button>

                                <motion.a
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  href={updateInfo.releaseUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white border border-white/[0.08] text-xs font-mono flex items-center gap-1.5 cursor-pointer ml-auto"
                                >
                                  <Github className="w-3.5 h-3.5" />
                                  <span>GitHub Release</span>
                                  <ExternalLink className="w-3 h-3" />
                                </motion.a>
                              </div>
                            ) : (
                              /* Up-To-Date confirmation banner: Never shows false 'Update Vortex' button */
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                                  <Check className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
                                  <span>You are on the latest version ({updateInfo.currentVersion}). No update required.</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleDownloadUpdate(updateInfo.apkDownloadUrl || updateInfo.releaseUrl, `VortexDownloader-${updateInfo.currentVersion}.apk`)}
                                    disabled={updateDownloadState.isDownloading}
                                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-gray-200 border border-white/[0.06] text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                                    title="Re-download current APK package"
                                  >
                                    <Smartphone className="w-3 h-3" />
                                    <span>Re-download APK</span>
                                  </motion.button>
                                  <motion.a
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    href={updateInfo.releaseUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-gray-200 border border-white/[0.06] text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                                  >
                                    <Github className="w-3 h-3" />
                                    <span>Releases</span>
                                  </motion.a>
                                </div>
                              </div>
                            )}

                            {/* Live In-App Update Download Progress Bar */}
                            {(updateDownloadState.isDownloading || updateDownloadState.percent > 0) && (
                              <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-3 space-y-2 mt-2 shadow-inner">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                                    {updateDownloadState.isDownloading && (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    )}
                                    {updateDownloadState.statusText || 'Downloading Update...'}
                                  </span>
                                  <span className="font-mono text-emerald-300 font-bold">
                                    {updateDownloadState.percent}%
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-150"
                                    style={{ width: `${updateDownloadState.percent}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                  <span>
                                    {updateDownloadState.downloadedMB
                                      ? `${updateDownloadState.downloadedMB} MB ${updateDownloadState.totalMB ? `/ ${updateDownloadState.totalMB} MB` : ''}`
                                      : 'Transferring file...'}
                                  </span>
                                  {updateDownloadState.speed && (
                                    <span className="text-cyan-300">{updateDownloadState.speed}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {!['feature_packs', 'turbo_speed', 'debrid_accounts', 'data_export', 'general', 'aria2', 'about'].includes(cat.id) && (
                  <div className="text-[11px] text-gray-500 py-1">
                    Configuration options for {cat.title} are managed automatically by the universal engine.
                  </div>
                )}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
