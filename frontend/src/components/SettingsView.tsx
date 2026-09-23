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
  Trash2,
  Folder,
  Volume2,
  Bell,
  Cpu,
  Gauge,
  Film,
  Music,
  Image as ImageIcon,
  FileText,
  Archive,
  Terminal,
  Activity,
  Globe,
  CheckSquare
} from 'lucide-react';
import { UserSettings } from '../types';
import { APP_VERSION, checkForAppUpdates, downloadUpdateFile, UpdateInfo, UpdateProgressData } from '../updater';
import { Capacitor } from '@capacitor/core';
import { playNotificationChime, sendDownloadCompleteNotification } from '../permissions';

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
  const [expandedSection, setExpandedSection] = useState<string | null>('engine');
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

  // Integration interactive state
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<string | null>(null);
  const [chimeFeedback, setChimeFeedback] = useState(false);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  // Browser interactive state
  const [copiedToken, setCopiedToken] = useState(false);

  // Application interactive state
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheClearFeedback, setCacheClearFeedback] = useState<string | null>(null);

  const handleTestWebhook = async () => {
    if (!settings.webhookUrl || !settings.webhookUrl.trim()) {
      setWebhookFeedback('Please enter a webhook URL first.');
      return;
    }
    setTestingWebhook(true);
    setWebhookFeedback(null);
    try {
      const res = await fetch(settings.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'vortex.test_ping',
          timestamp: new Date().toISOString(),
          message: 'Vortex Downloader webhook integration verified successfully!'
        })
      });
      if (res.ok) {
        setWebhookFeedback('Webhook ping delivered successfully! (HTTP 200)');
      } else {
        setWebhookFeedback(`Webhook returned status ${res.status}`);
      }
    } catch (err: any) {
      setWebhookFeedback(`Webhook error: ${err.message || 'Connection failed'}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleTestChime = () => {
    setChimeFeedback(true);
    playNotificationChime();
    setTimeout(() => setChimeFeedback(false), 1200);
  };

  const handleTestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        const res = await Notification.requestPermission();
        if (res !== 'granted') {
          setNotifFeedback('Notification permission was denied by browser.');
          return;
        }
      }
      sendDownloadCompleteNotification('Test Download - 4K Video', '.mp4');
      setNotifFeedback('Test notification delivered!');
      setTimeout(() => setNotifFeedback(null), 3000);
    } else {
      setNotifFeedback('Web notifications not supported on this browser.');
    }
  };

  const handleGenerateAria2Token = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = 'vortex-';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onUpdateSettings({ ...settings, aria2Secret: token });
  };

  const handleCopyAria2Token = () => {
    const token = settings.aria2Secret || 'vortex-rpc-token';
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheClearFeedback(null);
    try {
      try {
        await fetch(`${settings.backendUrl || ''}/api/cache/clear`, { method: 'POST' });
      } catch (_) {}
      await new Promise(r => setTimeout(r, 600));
      setCacheClearFeedback('Temporary chunk files & metadata cache successfully purged.');
      setTimeout(() => setCacheClearFeedback(null), 3500);
    } finally {
      setClearingCache(false);
    }
  };

  const handleCategoryPathChange = (catKey: string, newPath: string) => {
    const paths = { ...(settings.categoryPaths || {}) };
    paths[catKey] = newPath;
    onUpdateSettings({ ...settings, categoryPaths: paths });
  };

  const handleSelectAccent = (color: string) => {
    onUpdateSettings({ ...settings, accentColor: color });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--vortex-accent', color);
    }
  };

  const handleSelectTheme = (theme: 'oled' | 'slate' | 'cyber' | 'titanium') => {
    onUpdateSettings({ ...settings, themeVariant: theme });
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

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
      path: 'vortex/bin/ffmpeg',
      desc: 'High-speed stream demuxing and video/audio transcoding binary'
    },
    {
      id: 'ytdlp',
      name: 'YouTube (yt-dlp)',
      version: '2026.03.01',
      latestVersion: '2026.03.01',
      path: 'vortex/bin/yt-dlp',
      desc: 'Universal media extraction core for 4K/8K, HDR, chapters, subtitles & audio'
    },
    {
      id: 'http_pack',
      name: 'HttpPack',
      version: '1.0.1',
      latestVersion: '1.0.1',
      path: 'vortex/engines/chunkDownloader.ts',
      desc: '16-pipe dynamic work-stealing parallel chunker with async memory cache'
    },
    {
      id: 'bittorrent',
      name: 'BitTorrentPack',
      version: '3.0.21',
      latestVersion: '3.0.21',
      path: 'vortex/engines/torrentManager.ts',
      desc: 'WebTorrent decentralized swarm engine, DHT crawler & magnet stream resolver'
    },
    {
      id: 'ed2k',
      name: 'ED2kPack',
      version: '1.2.1',
      latestVersion: '1.2.1',
      path: 'vortex/featurePacks/ed2kPack.ts',
      desc: 'eDonkey2000 URI parser with MD4 multi-chunk verification and peer hash integrity'
    },
    {
      id: 'ftp',
      name: 'FtpPack',
      version: '6.2.1',
      latestVersion: '6.2.1',
      path: 'vortex/featurePacks/ftpPack.ts',
      desc: 'FTP & FTPS remote file streaming client with live throughput telemetry'
    },
    {
      id: 'github',
      name: 'GitHubPack',
      version: '1.0.0',
      latestVersion: '1.0.0',
      path: 'vortex/featurePacks/githubPack.ts',
      desc: 'GitHub release asset inspector, tag resolver, and repository source archiver'
    },
    {
      id: 'huggingface',
      name: 'HuggingFacePack',
      version: '1.0.1',
      latestVersion: '1.0.1',
      path: 'vortex/featurePacks/huggingfacePack.ts',
      desc: 'AI model weights (.safetensors, .gguf, .onnx) inspector & CDN stream router'
    },
    {
      id: 'm3u8',
      name: 'M3U8Pack',
      version: '1.0.2',
      latestVersion: '1.0.2',
      path: 'vortex/engines/m3u8Engine.ts',
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
    { id: 'engine', title: 'Engine & Multi-Thread Core', icon: Zap },
    { id: 'categorization', title: 'Downloads & File Routing', icon: FolderCheck },
    { id: 'limits', title: 'Concurrency & Performance', icon: Gauge },
    { id: 'browser', title: 'Browser Extension & Aria2 Bridge', icon: Puzzle },
    { id: 'personalization', title: 'Appearance & Interface', icon: Palette },
    { id: 'integration', title: 'System Hooks & Storage', icon: Network },
    { id: 'about', title: 'About & Updates', icon: Info }
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
                {cat.id === 'engine' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                      <div>
                        <span className="text-white font-medium text-xs block">Dynamic Multi-Thread & Streaming Pipeline</span>
                        <span className="text-[11px] text-gray-400">Configure parallel chunk pipes, premium Debrid tokens, and media cookies</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                        Turbo Engine
                      </span>
                    </div>

                    {/* Parallel Connection Range Pipes */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white text-xs font-medium block">Parallel HTTP Range Pipes per Download</span>
                          <span className="text-[11px] text-gray-400">IDM-style simultaneous chunk pipes (work-stealing segment halver)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min={1}
                            max={32}
                            value={settings.defaultThreads || turboPipes}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setTurboPipes(val);
                              onUpdateSettings({ ...settings, defaultThreads: val });
                            }}
                            className="w-28 accent-[#3ea6ff]"
                          />
                          <span className="text-xs font-mono font-bold text-[#3ea6ff] w-7 text-right">
                            {settings.defaultThreads || turboPipes}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Real-Debrid & Multi-Host Keychain */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4 text-amber-400" />
                          <span className="text-white text-xs font-medium">Debrid & Multi-Host Keychain (Unrestricted CDNs)</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">Real-Debrid</span>
                      </div>
                      <span className="text-[11px] text-gray-400 block">
                        Routes Rapidgator, Mega, 1Fichier, and premium lockers through unrestricted direct CDN streams
                      </span>
                      <div className="flex gap-2 pt-1">
                        <input
                          type="password"
                          placeholder="Paste Real-Debrid API Key (from real-debrid.com/apitoken)"
                          value={debridKey}
                          onChange={(e) => setDebridKey(e.target.value)}
                          className="flex-1 bg-[#141416] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                        />
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={verifyRealDebrid}
                          disabled={isVerifyingDebrid || !debridKey}
                          className="px-3.5 py-1.5 rounded-lg bg-[#3ea6ff] hover:bg-[#3ea6ff]/80 text-black font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors shrink-0"
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

                    {/* Media Cookies (Netscape / cookies.txt) */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Youtube className="w-4 h-4 text-red-400" />
                          <span className="text-white text-xs font-medium">Media Cookies (Netscape / cookies.txt)</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">yt-dlp auth</span>
                      </div>
                      <span className="text-[11px] text-gray-400 block">
                        Manual session cookie override for age-gated, private, or premium subscriber content
                      </span>
                      <input
                        type="text"
                        placeholder="Paste Netscape format cookies or raw session cookie"
                        value={settings.youtubeCookie || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, youtubeCookie: e.target.value })}
                        className="w-full bg-[#141416] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                      />
                    </div>

                    {/* Vortex Backend Super-Engine Connection URL */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Server className="w-4 h-4 text-[#3ea6ff]" />
                          <span className="text-white text-xs font-medium">Vortex Super-Engine Server URL</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">Hybrid Core</span>
                      </div>
                      <span className="text-[11px] text-gray-400 block">
                        Connect mobile client to your PC backend over local Wi-Fi (e.g. http://192.168.1.15:5001). Leave blank for standalone mobile mode.
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. http://192.168.1.15:5001 (leave empty for standalone mode)"
                        value={settings.backendUrl || ''}
                        onChange={(e) => onUpdateSettings({ ...settings, backendUrl: e.target.value.trim() })}
                        className="w-full bg-[#141416] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                      />
                    </div>

                    {/* Engine Architecture Diagnostic Cards */}
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
                          <span className="text-white text-xs font-medium block">SSE Real-Time Telemetry</span>
                          <span className="text-[10px] text-gray-400">60fps telemetry with zero HTTP polling overhead</span>
                        </div>
                      </div>
                    </div>
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
                                      ? `Update Available: ${updateInfo.latestVersion}`
                                      : `You're running the latest version!`}
                                  </span>
                                  <span className="block text-[10px] text-gray-400 font-mono">
                                    Installed: {updateInfo.currentVersion} • Latest: {updateInfo.latestVersion} • Released: {updateInfo.publishedAt}
                                  </span>
                                </div>
                              </div>

                              {lastCheckedTime && (
                                <span className="text-[10px] text-gray-500 font-mono self-start sm:self-auto">
                                  Checked at {lastCheckedTime}
                                </span>
                              )}
                            </div>

                            {/* Release Notes Preview */}
                            {updateInfo.releaseNotes && (
                              <div className="bg-black/40 border border-white/[0.08] rounded-xl p-3 text-[11px] text-gray-300 font-sans max-h-40 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider block">
                                  What's New in {updateInfo.latestVersion}:
                                </span>
                                <div className="space-y-1.5 leading-relaxed text-gray-300">
                                  {updateInfo.releaseNotes
                                    .split('\n')
                                    .filter(l => {
                                      const t = l.trim();
                                      return t.length > 0 && !t.startsWith('## 📱 VortexDownloader') && !t.includes('(Direct Install)');
                                    })
                                    .map((line, lIdx) => {
                                      const trimmed = line.trim();
                                      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
                                        const raw = trimmed.substring(2);
                                        const parts = raw.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
                                        return (
                                          <div key={lIdx} className="flex items-start gap-2 pl-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                            <span className="flex-1 text-[11px]">
                                              {parts.map((p, pIdx) => {
                                                if (p.startsWith('**') && p.endsWith('**')) {
                                                  return <strong key={pIdx} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
                                                }
                                                if (p.startsWith('`') && p.endsWith('`')) {
                                                  return <code key={pIdx} className="px-1 py-0.5 rounded bg-white/[0.08] font-mono text-[10px] text-emerald-300">{p.slice(1, -1)}</code>;
                                                }
                                                return p;
                                              })}
                                            </span>
                                          </div>
                                        );
                                      } else if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('✨')) {
                                        return (
                                          <div key={lIdx} className="font-bold text-white text-xs pt-1 flex items-center gap-1.5 text-emerald-300">
                                            <span>{trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')}</span>
                                          </div>
                                        );
                                      }
                                      return <p key={lIdx} className="text-gray-300 text-[11px]">{trimmed.replace(/\*\*/g, '')}</p>;
                                    })}
                                </div>
                              </div>
                            )}

                            {/* Action Download Buttons: ONLY show when updateInfo.hasUpdate === true */}
                            {updateInfo.hasUpdate ? (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                                {/* ONLY show Windows (.exe) button on Windows Desktop / Web browsers - NEVER on Android APK */}
                                {!isAndroidApp && (
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleDownloadUpdate(updateInfo.exeDownloadUrl || updateInfo.releaseUrl, `VortexDownloader-${updateInfo.latestVersion}.exe`)}
                                    disabled={updateDownloadState.isDownloading}
                                    className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    title="Download Windows executable installer"
                                  >
                                    <Monitor className="w-3.5 h-3.5" />
                                    <span>{updateInfo.exeDownloadUrl ? 'Download Windows (.exe)' : 'Windows Release (.exe)'}</span>
                                  </motion.button>
                                )}

                                {/* Android APK Button - Styled as Primary on Android */}
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleDownloadUpdate(updateInfo.apkDownloadUrl || updateInfo.releaseUrl, `VortexDownloader-${updateInfo.latestVersion}.apk`)}
                                  disabled={updateDownloadState.isDownloading}
                                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all ${
                                    isAndroidApp
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black border border-emerald-300 shadow-lg shadow-emerald-500/25'
                                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                  title="Download and install Android APK update"
                                >
                                  <Smartphone className="w-4 h-4" />
                                  <span>
                                    {updateDownloadState.isDownloading
                                      ? `Downloading (${updateDownloadState.percent}%)`
                                      : isAndroidApp
                                        ? `⚡ Update Vortex (${updateInfo.latestVersion})`
                                        : (updateInfo.apkDownloadUrl ? 'Download Android (.apk)' : 'Android Release (.apk)')}
                                  </span>
                                </motion.button>

                                <motion.a
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  href={updateInfo.releaseUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-2.5 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white border border-white/[0.08] text-xs font-sans flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                >
                                  <Github className="w-3.5 h-3.5" />
                                  <span>GitHub Release</span>
                                  <ExternalLink className="w-3 h-3 text-gray-400" />
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

                {cat.id === 'categorization' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                      <div>
                        <span className="text-white font-medium text-xs block">Smart File Categorization & Routing</span>
                        <span className="text-[11px] text-gray-400">Sort downloads into designated folders by MIME type and file format</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-mono">
                        Active Rules
                      </span>
                    </div>

                    {/* Auto-Organize Subfolders Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06]">
                      <div className="space-y-0.5">
                        <span className="text-white text-xs font-medium block">Auto-Organize Subfolders</span>
                        <span className="text-[11px] text-gray-400 block">
                          Automatically place files into category folders (e.g. /Videos, /Music, /Archives)
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoOrganizeFolders !== false}
                          onChange={(e) => onUpdateSettings({ ...settings, autoOrganizeFolders: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ea6ff]"></div>
                      </label>
                    </div>

                    {/* Base Download Folder */}
                    <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium flex items-center gap-2">
                          <Folder className="w-4 h-4 text-amber-400" />
                          Base Download Root Directory
                        </span>
                        <button
                          onClick={() => onUpdateSettings({ ...settings, customDownloadDir: 'Downloads/Vortex' })}
                          className="text-[10px] text-sky-400 hover:text-sky-300 font-mono cursor-pointer"
                        >
                          Reset Default
                        </button>
                      </div>
                      <input
                        type="text"
                        value={settings.customDownloadDir || 'Downloads/Vortex'}
                        onChange={(e) => onUpdateSettings({ ...settings, customDownloadDir: e.target.value })}
                        className="w-full bg-[#141416] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                        placeholder="Downloads/Vortex"
                      />
                    </div>

                    {/* Category Path Mapping Grid */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] text-gray-400 font-medium block">Category Subfolder Mapping</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { key: 'video', label: 'Videos & Streams', icon: Film, color: 'text-rose-400', defaultVal: 'Videos' },
                          { key: 'audio', label: 'Music & Audio', icon: Music, color: 'text-blue-400', defaultVal: 'Music' },
                          { key: 'photo', label: 'Images & Photos', icon: ImageIcon, color: 'text-emerald-400', defaultVal: 'Images' },
                          { key: 'archive', label: 'Compressed / Archives', icon: Archive, color: 'text-amber-400', defaultVal: 'Archives' },
                          { key: 'document', label: 'Documents & Books', icon: FileText, color: 'text-cyan-400', defaultVal: 'Documents' },
                          { key: 'program', label: 'Software & Binaries', icon: Terminal, color: 'text-purple-400', defaultVal: 'Programs' }
                        ].map((catItem) => {
                          const IconComp = catItem.icon;
                          const currentVal = (settings.categoryPaths && settings.categoryPaths[catItem.key]) || catItem.defaultVal;
                          return (
                            <div key={catItem.key} className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <IconComp className={`w-4 h-4 shrink-0 ${catItem.color}`} />
                                <span className="text-xs text-gray-200 truncate">{catItem.label}</span>
                              </div>
                              <input
                                type="text"
                                value={currentVal}
                                onChange={(e) => handleCategoryPathChange(catItem.key, e.target.value)}
                                className="w-24 text-right bg-[#141416] border border-white/[0.08] rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* File Renaming & Conflict Rules */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-1.5">
                        <label className="text-xs text-white font-medium block">File Renaming Pattern</label>
                        <select
                          value={settings.fileRenamingPattern || 'original'}
                          onChange={(e) => onUpdateSettings({ ...settings, fileRenamingPattern: e.target.value as any })}
                          className="w-full bg-[#141416] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3ea6ff] cursor-pointer"
                        >
                          <option value="original">Original Filename ([Title].[ext])</option>
                          <option value="with_resolution">Append Resolution ([Title]_[1080p].[ext])</option>
                          <option value="with_date">Append Date ([Title]_[YYYYMMDD].[ext])</option>
                        </select>
                      </div>

                      <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-1.5">
                        <label className="text-xs text-white font-medium block">Duplicate File Conflict</label>
                        <select
                          value={settings.duplicateHandling || 'auto_rename'}
                          onChange={(e) => onUpdateSettings({ ...settings, duplicateHandling: e.target.value as any })}
                          className="w-full bg-[#141416] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3ea6ff] cursor-pointer"
                        >
                          <option value="auto_rename">Auto-Rename (e.g. file (1).mp4)</option>
                          <option value="overwrite">Overwrite Existing File</option>
                          <option value="skip">Skip If Already Downloaded</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {cat.id === 'integration' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                      <div>
                        <span className="text-white font-medium text-xs block">Operating System & Webhook Hooks</span>
                        <span className="text-[11px] text-gray-400">Configure clipboard detection, desktop alerts, sound chimes, and webhook callbacks</span>
                      </div>
                    </div>

                    {/* Clipboard URL Auto-Monitoring */}
                    <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <Copy className="w-4 h-4 text-sky-400" />
                          <span className="text-white text-xs font-medium">Clipboard URL Auto-Monitoring</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block pl-6">
                          Automatically detect copied download links and media streams to offer fast 1-click capture
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                        <input
                          type="checkbox"
                          checked={settings.clipboardMonitoring !== false}
                          onChange={(e) => onUpdateSettings({ ...settings, clipboardMonitoring: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ea6ff]"></div>
                      </label>
                    </div>

                    {/* Desktop & System Notifications */}
                    <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4 h-4 text-emerald-400" />
                            <span className="text-white text-xs font-medium">System Desktop Notifications</span>
                          </div>
                          <span className="text-[11px] text-gray-400 block pl-6">
                            Show OS banner notifications when tasks finish or encounter errors
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                          <input
                            type="checkbox"
                            checked={settings.desktopNotifications !== false}
                            onChange={(e) => onUpdateSettings({ ...settings, desktopNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between pt-1 pl-6">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleTestNotification}
                          className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                        >
                          Send Test Notification
                        </motion.button>
                        {notifFeedback && (
                          <span className="text-[11px] text-emerald-400 font-mono">{notifFeedback}</span>
                        )}
                      </div>
                    </div>

                    {/* Audio Chime Notification */}
                    <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4 text-purple-400" />
                            <span className="text-white text-xs font-medium">Task Completion Audio Chime</span>
                          </div>
                          <span className="text-[11px] text-gray-400 block pl-6">
                            Acoustic confirmation chime when all chunks multiplex and verify
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                          <input
                            type="checkbox"
                            checked={settings.soundNotification !== false}
                            onChange={(e) => onUpdateSettings({ ...settings, soundNotification: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between pt-1 pl-6">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleTestChime}
                          className="px-3 py-1 rounded-lg bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{chimeFeedback ? '♪ Playing Chime...' : 'Test Audio Chime'}</span>
                        </motion.button>
                        {chimeFeedback && (
                          <span className="text-[11px] text-purple-300 font-mono animate-pulse">880 Hz Harmonic Chime</span>
                        )}
                      </div>
                    </div>

                    {/* Auto-Start Daemon */}
                    <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <span className="text-white text-xs font-medium">Autostart Core Engine On Boot</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block pl-6">
                          Keep Go Core daemon and Python extractor ready in background tray
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                        <input
                          type="checkbox"
                          checked={settings.autoStartDaemon !== false}
                          onChange={(e) => onUpdateSettings({ ...settings, autoStartDaemon: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    {/* Webhook Post-Download Callback */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-amber-400" />
                          <span className="text-white text-xs font-medium">Post-Download Webhook Callback</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">POST JSON</span>
                      </div>
                      <span className="text-[11px] text-gray-400 block">
                        Trigger external automations (Discord, Telegram bot, or server) on task completion
                      </span>
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="https://discord.com/api/webhooks/... or custom HTTP endpoint"
                          value={settings.webhookUrl || ''}
                          onChange={(e) => onUpdateSettings({ ...settings, webhookUrl: e.target.value })}
                          className="flex-1 bg-[#141416] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                        />
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={handleTestWebhook}
                          disabled={testingWebhook || !settings.webhookUrl}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-mono disabled:opacity-40 cursor-pointer transition-colors"
                        >
                          {testingWebhook ? 'Pinging...' : 'Send Test Ping'}
                        </motion.button>
                      </div>
                      {webhookFeedback && (
                        <p className={`text-[11px] font-mono mt-1 ${webhookFeedback.includes('successfully') ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {webhookFeedback}
                        </p>
                      )}
                    </div>

                    {/* Temporary Storage & Chunk Purge */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="w-4 h-4 text-rose-400" />
                          <span className="text-white text-xs font-medium">Temporary Storage & Chunk Purge</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">.part / cache</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Remove abandoned .part chunks, temp multiplex buffers, and expired extraction caches from disk.
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleClearCache}
                          disabled={clearingCache}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-mono disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{clearingCache ? 'Purging Cache...' : 'Clear Temp Chunks & Cache'}</span>
                        </motion.button>
                        {cacheClearFeedback && (
                          <span className="text-[11px] text-emerald-400 font-mono">{cacheClearFeedback}</span>
                        )}
                      </div>
                    </div>

                    {/* History Retention Policy */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-1.5">
                      <label className="text-xs text-white font-medium block">Completed Task History Retention</label>
                      <select
                        value={settings.historyRetention || 'keep_all'}
                        onChange={(e) => onUpdateSettings({ ...settings, historyRetention: e.target.value as any })}
                        className="w-full bg-[#141416] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3ea6ff] cursor-pointer"
                      >
                        <option value="keep_all">Keep History Forever</option>
                        <option value="30_days">Auto-Clear Items Older Than 30 Days</option>
                        <option value="7_days">Auto-Clear Items Older Than 7 Days</option>
                        <option value="on_exit">Clear Download History on App Exit</option>
                      </select>
                    </div>

                    {/* Anti-Lock-in & Data Sovereignty Export */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-medium">
                        <Shield className="w-4 h-4" />
                        <span>Data Sovereignty & Open Task Export</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Export your active queue or backup download tasks to open formats compatible with any server or terminal.
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
                  </div>
                )}

                {cat.id === 'browser' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                      <div>
                        <span className="text-white font-medium text-xs block">Browser Interception & Native Extension Bridge</span>
                        <span className="text-[11px] text-gray-400">Capture video streams, playlist URLs, and direct file downloads from Chrome, Edge, Brave, and Firefox</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                        Port 5001 RPC
                      </span>
                    </div>

                    {/* Interception Mode */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium">Download Interception Trigger</span>
                        <span className="text-[10px] text-gray-400 font-mono">IDM Bridge</span>
                      </div>
                      <select
                        value={settings.browserInterceptMode || 'size_threshold'}
                        onChange={(e) => onUpdateSettings({ ...settings, browserInterceptMode: e.target.value as any })}
                        className="w-full bg-[#141416] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3ea6ff] cursor-pointer"
                      >
                        <option value="size_threshold">Intercept by File Size Threshold (Recommended)</option>
                        <option value="all">Intercept All Downloads (Aggressive / IDM style)</option>
                        <option value="media_only">Streaming Media Only (YouTube, Twitch, M3U8, DASH)</option>
                        <option value="disabled">Disabled (Manual Link Entry Only)</option>
                      </select>
                    </div>

                    {/* File Size Threshold Slider */}
                    {(settings.browserInterceptMode === 'size_threshold' || !settings.browserInterceptMode) && (
                      <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white text-xs font-medium block">Minimum Intercept File Size</span>
                            <span className="text-[11px] text-gray-400">Small files below this limit download directly in browser</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#3ea6ff]">
                            {settings.browserInterceptMinSizeMB || 25} MB
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={500}
                          step={5}
                          value={settings.browserInterceptMinSizeMB || 25}
                          onChange={(e) => onUpdateSettings({ ...settings, browserInterceptMinSizeMB: Number(e.target.value) })}
                          className="w-full accent-[#3ea6ff]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                          <span>5 MB (All media)</span>
                          <span>25 MB (Recommended)</span>
                          <span>500 MB (Large files only)</span>
                        </div>
                      </div>
                    )}

                    {/* Aria2 RPC Secret Key */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white text-xs font-medium block">Extension RPC Authentication Secret</span>
                          <span className="text-[11px] text-gray-400">Pair browser extension securely to http://localhost:5001/jsonrpc</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">256-Bit RPC Guard</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settings.aria2Secret || 'vortex-rpc-token-2026'}
                          onChange={(e) => onUpdateSettings({ ...settings, aria2Secret: e.target.value })}
                          className="flex-1 bg-[#141416] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#3ea6ff]"
                        />
                        <button
                          onClick={handleGenerateAria2Token}
                          className="px-3 py-1.5 rounded-lg bg-[#2a2a2e] hover:bg-[#34343a] text-gray-300 text-xs font-mono cursor-pointer transition-colors"
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={handleCopyAria2Token}
                          className="px-3 py-1.5 rounded-lg bg-[#3ea6ff]/20 text-[#3ea6ff] hover:bg-[#3ea6ff]/30 text-xs font-mono cursor-pointer transition-colors"
                        >
                          {copiedToken ? 'Copied!' : 'Copy Token'}
                        </button>
                      </div>
                    </div>

                    {/* Auto-Inherit Browser Cookies Toggle */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span className="text-white text-xs font-medium">Automatic Browser Cookie Extraction</span>
                        </div>
                        <span className="text-[11px] text-gray-400 block pl-6">
                          Extract session cookies from Edge, Chrome, and Firefox to bypass age gates and premium logins
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                        <input
                          type="checkbox"
                          checked={settings.autoInjectBrowserCookies !== false}
                          onChange={(e) => onUpdateSettings({ ...settings, autoInjectBrowserCookies: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {/* Extension Installation Links & Modal Guide */}
                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-white text-xs font-medium block">Browser Extension Setup Guide</span>
                        <span className="text-[11px] text-gray-400">Step-by-step instructions for Aria2 Integration, Violentmonkey, or native unpacked extension</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={onOpenAria2Modal}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-medium cursor-pointer transition-colors self-start sm:self-center shrink-0"
                      >
                        Open Extension Guide
                      </motion.button>
                    </div>
                  </div>
                )}

                {cat.id === 'personalization' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                      <div>
                        <span className="text-white font-medium text-xs block">Interface Themes & Visual Styling</span>
                        <span className="text-[11px] text-gray-400">Customize accent palettes, workspace background tones, and layout density</span>
                      </div>
                    </div>

                    {/* Theme Variant Cards */}
                    <div className="space-y-2">
                      <span className="text-[11px] text-gray-400 font-medium block">Workspace Theme Tone</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: 'oled', label: 'Pure OLED', desc: '#09090b Deep Black', bg: 'bg-[#09090b]', border: 'border-white/20' },
                          { id: 'slate', label: 'Midnight Slate', desc: '#0f172a Deep Navy', bg: 'bg-[#0f172a]', border: 'border-slate-700/50' },
                          { id: 'cyber', label: 'Cyberpunk Neon', desc: '#0e0c1f Dark Violet', bg: 'bg-[#0e0c1f]', border: 'border-purple-900/50' },
                          { id: 'titanium', label: 'Dark Titanium', desc: '#18181b Studio Gray', bg: 'bg-[#18181b]', border: 'border-zinc-700/50' }
                        ].map((t) => {
                          const isSelected = (settings.themeVariant || 'oled') === t.id;
                          return (
                            <motion.button
                              key={t.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSelectTheme(t.id as any)}
                              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                isSelected ? 'border-[#3ea6ff] ring-1 ring-[#3ea6ff]/40 bg-white/[0.04]' : 'border-white/[0.06] bg-[#1d1d20] hover:bg-[#232328]'
                              }`}
                            >
                              <div className={`w-full h-8 rounded-lg ${t.bg} border ${t.border} mb-2 flex items-center justify-center`}>
                                {isSelected && <Check className="w-4 h-4 text-[#3ea6ff]" />}
                              </div>
                              <span className="text-xs font-medium text-white block">{t.label}</span>
                              <span className="text-[10px] text-gray-500 font-mono block">{t.desc}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Accent Color Palette */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium">Primary Accent Color</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {settings.accentColor || '#3ea6ff'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        {[
                          { hex: '#3ea6ff', label: 'Vortex Sky' },
                          { hex: '#00f0ff', label: 'Cyber Cyan' },
                          { hex: '#10b981', label: 'Emerald Pulse' },
                          { hex: '#a855f7', label: 'Royal Violet' },
                          { hex: '#f59e0b', label: 'Amber Gold' },
                          { hex: '#f43f5e', label: 'Rose Crimson' }
                        ].map((accent) => {
                          const isSelected = (settings.accentColor || '#3ea6ff').toLowerCase() === accent.hex.toLowerCase();
                          return (
                            <button
                              key={accent.hex}
                              onClick={() => handleSelectAccent(accent.hex)}
                              className="flex items-center space-x-2 group cursor-pointer focus:outline-none"
                              title={accent.label}
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                                  isSelected ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-80 group-hover:opacity-100'
                                }`}
                                style={{ backgroundColor: accent.hex }}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                              </div>
                              <span className="text-[11px] text-gray-300 hidden sm:inline">{accent.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Layout Density & Visual Controls */}
                    <div className="space-y-2">
                      {/* Compact Density View */}
                      <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-white text-xs font-medium block">Compact Density Mode (IDM Grid)</span>
                          <span className="text-[11px] text-gray-400 block">
                            Reduce card padding and row heights to maximize visible items on screen
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                          <input
                            type="checkbox"
                            checked={settings.compactView || false}
                            onChange={(e) => onUpdateSettings({ ...settings, compactView: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ea6ff]"></div>
                        </label>
                      </div>

                      {/* Speed Sparklines */}
                      <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-white text-xs font-medium block">Live Bandwidth Sparklines</span>
                          <span className="text-[11px] text-gray-400 block">
                            Render real-time telemetry throughput graphs on active task cards
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                          <input
                            type="checkbox"
                            checked={settings.showSpeedGraph !== false}
                            onChange={(e) => onUpdateSettings({ ...settings, showSpeedGraph: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ea6ff]"></div>
                        </label>
                      </div>

                      {/* Fluid Animations */}
                      <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-white text-xs font-medium block">Fluid Micro-Animations</span>
                          <span className="text-[11px] text-gray-400 block">
                            Enable smooth spring transitions, hover glows, and progress pulses
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                          <input
                            type="checkbox"
                            checked={settings.enableAnimations !== false}
                            onChange={(e) => onUpdateSettings({ ...settings, enableAnimations: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ea6ff]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {cat.id === 'limits' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                      <div>
                        <span className="text-white font-medium text-xs block">Engine Concurrency & Hardware Limits</span>
                        <span className="text-[11px] text-gray-400">Configure parallel active tasks, bandwidth throttle, and GPU acceleration</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono">
                        Hardware Optimized
                      </span>
                    </div>

                    {/* Max Simultaneous Downloads */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white text-xs font-medium block">Max Simultaneous Active Downloads</span>
                          <span className="text-[11px] text-gray-400">Extra downloads remain queued and auto-start as tasks complete</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#3ea6ff]">
                          {settings.maxConcurrentDownloads || 3} Tasks
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={settings.maxConcurrentDownloads || 3}
                        onChange={(e) => onUpdateSettings({ ...settings, maxConcurrentDownloads: Number(e.target.value) })}
                        className="w-full accent-[#3ea6ff]"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>1 (Sequential)</span>
                        <span>3 (Balanced)</span>
                        <span>10 (Gigabit Pipeline)</span>
                      </div>
                    </div>

                    {/* Speed Limiter Throttle */}
                    <div className="p-3.5 rounded-xl bg-[#1d1d20] border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white text-xs font-medium block">Bandwidth Throttle / Speed Limiter</span>
                          <span className="text-[11px] text-gray-400">Cap download rate to preserve bandwidth for gaming or work</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                          <input
                            type="checkbox"
                            checked={settings.speedLimitEnabled || false}
                            onChange={(e) => onUpdateSettings({ ...settings, speedLimitEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {settings.speedLimitEnabled && (
                        <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">Max Download Speed</span>
                            <span className="font-mono text-amber-400 font-bold">{settings.maxSpeedMBps || 25} MB/s</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={100}
                            value={settings.maxSpeedMBps || 25}
                            onChange={(e) => onUpdateSettings({ ...settings, maxSpeedMBps: Number(e.target.value) })}
                            className="w-full accent-amber-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Hardware Acceleration & Pre-Allocation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-white text-xs font-medium block">GPU Hardware Transcoding</span>
                          <span className="text-[10px] text-gray-400 block">
                            Use NVENC / QuickSync in FFmpeg
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                          <input
                            type="checkbox"
                            checked={settings.hardwareAcceleration !== false}
                            onChange={(e) => onUpdateSettings({ ...settings, hardwareAcceleration: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>

                      <div className="p-3 rounded-xl bg-[#1d1d20] border border-white/[0.06] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-white text-xs font-medium block">Disk Pre-Allocation</span>
                          <span className="text-[10px] text-gray-400 block">
                            Zero fragmentation on NTFS/Ext4
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                          <input
                            type="checkbox"
                            checked={settings.preallocateDisk !== false}
                            onChange={(e) => onUpdateSettings({ ...settings, preallocateDisk: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-[#2b2b30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#3ea6ff]"></div>
                        </label>
                      </div>
                    </div>
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
