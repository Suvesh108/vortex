import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Download, 
  Compass, 
  HelpCircle, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  FileVideo,
  FileAudio,
  PlusCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import TermsModal from './components/TermsModal';
import PrivacyModal from './components/PrivacyModal';
import TerminalLogs from './components/TerminalLogs';
import HistoryList from './components/HistoryList';
import FeatureGrid from './components/FeatureGrid';
import { SAMPLE_PRESETS, extractUrlMetadata, EXTRACTION_STEPS_LOGS } from './data';
import { DownloadStatus, MediaMetadata, MediaQuality, DownloadLog, DownloadHistoryItem, UserSettings } from './types';

// In local dev, the Vite proxy forwards /api → localhost:5000 (no base URL needed).
// In production (Vercel build), VITE_BACKEND_URL must be set to the Render backend URL.
// Hardcoding the Render URL as a final safety net so the app always works.
const RENDER_BACKEND = 'https://vortex-601m.onrender.com';
const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || RENDER_BACKEND).replace(/\/$/, '');

export default function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [status, setStatus] = useState<DownloadStatus>('ready'); // Start as 'ready' to show standby empty state
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  
  const [selectedFormat, setSelectedFormat] = useState<MediaQuality>({
    id: '',
    format: 'MP4',
    resolution: '',
    size: '',
    bitrate: ''
  });
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [simulatedSpeed, setSimulatedSpeed] = useState('0.0 MB/s');
  const [simulatedEta, setSimulatedEta] = useState('0s');
  
  const [logs, setLogs] = useState<DownloadLog[]>([
    { id: '1', time: '10:21:19', type: 'system', message: 'Vortex Downloader Core CLI initialized.' },
    { id: '2', time: '10:21:20', type: 'success', message: 'Ready for secure workflow links or local media extraction.' }
  ]);
  const [logsVisible, setLogsVisible] = useState(true);
  
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    simulatedSpeedCode: 'MAX',
    defaultThreads: 16,
    sampleRatekHz: 48,
    autoDownload: true,
    saveHistory: true
  });

  const [completedJobId, setCompletedJobId] = useState<string | null>(null);

  // Load history & preferences from localStorage on start
  useEffect(() => {
    const savedHistory = localStorage.getItem('vortex_download_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }

    const savedSettings = localStorage.getItem('vortex_user_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse user settings", e);
      }
    }
  }, []);

  // Sync settings helper
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('vortex_user_settings', JSON.stringify(newSettings));
    
    addLog('info', `Engine preferences adjusted: CPU Threads: ${newSettings.defaultThreads}, Speed: ${newSettings.simulatedSpeedCode}`);
  };

  const addLog = (type: DownloadLog['type'], message: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLog: DownloadLog = {
      id: Math.random().toString(36).substring(2, 9),
      time: timeStr,
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // extraction cycle
  const triggerExtraction = (urlToExtract: string) => {
    if (!urlToExtract.trim()) {
      addLog('error', 'Inbound URL paste is empty. Supply valid target endpoint.');
      return;
    }

    setStatus('fetching');
    setMetadata(null);
    setLogs([]);
    addLog('info', `Parsing connection gateway: ${urlToExtract}`);

    fetch(`${API_BASE_URL}/api/info?url=${encodeURIComponent(urlToExtract)}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Extraction failed') });
        }
        return res.json();
      })
      .then(data => {
        setMetadata(data);
        setSelectedFormat(data.formats[0]);
        setStatus('ready');
        addLog('success', `Vortex extraction sequence complete! Content state is READY.`);
        addLog('success', `Found ${data.formats.length} adaptive layout quality targets.`);
      })
      .catch(err => {
        setStatus('ready');
        addLog('error', `Extraction sequence aborted: ${err.message}`);
      });
  };

  // Preset quick click
  const handleLoadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setInputUrl(preset.url);
    triggerExtraction(preset.url);
  };

  // Real Download trigger
  const triggerDownloadSimulation = () => {
    if (!metadata || !selectedFormat) return;

    setStatus('downloading');
    setDownloadProgress(0);
    setSimulatedSpeed('0.0 MB/s');
    setSimulatedEta('Calculating...');
    setLogs([]);
    setCompletedJobId(null);

    addLog('info', `Requesting stream encapsulation matching target: [${selectedFormat.format} - ${selectedFormat.resolution}]`);

    fetch(`${API_BASE_URL}/api/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: metadata.originalUrl,
        formatId: selectedFormat.id,
        title: metadata.title,
        format: selectedFormat.format
      })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => { throw new Error(err.error || 'Failed to start download') });
      }
      return res.json();
    })
    .then(({ jobId }) => {
      const pollInterval = setInterval(() => {
        fetch(`${API_BASE_URL}/api/download/progress?jobId=${jobId}`)
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              clearInterval(pollInterval);
              setStatus('ready');
              addLog('error', `Download aborted: ${data.error}`);
              return;
            }

            if (data.logs) {
              setLogs(data.logs);
            }

            setDownloadProgress(data.progress);
            setSimulatedSpeed(data.speed);
            setSimulatedEta(data.eta);

            if (data.status === 'completed') {
              clearInterval(pollInterval);
              setStatus('completed');
              setCompletedJobId(jobId);
              
              if (settings.saveHistory) {
                const nowStr = new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const newHistoryItem: DownloadHistoryItem = {
                  id: jobId,
                  title: metadata.title,
                  originalUrl: metadata.originalUrl,
                  thumbnail: metadata.thumbnail,
                  size: selectedFormat.size,
                  resolution: selectedFormat.resolution,
                  format: selectedFormat.format,
                  timestamp: nowStr
                };

                setHistory(prev => [newHistoryItem, ...prev.filter(h => h.originalUrl !== metadata.originalUrl)]);
              }

              if (settings.autoDownload) {
                const link = document.createElement('a');
                link.href = `${API_BASE_URL}/api/download/file?jobId=${jobId}`;
                link.setAttribute('download', '');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            } else if (data.status === 'error') {
              clearInterval(pollInterval);
              setStatus('ready');
            }
          })
          .catch(err => {
            console.error('Error polling progress:', err);
          });
      }, 1000);
    })
    .catch(err => {
      setStatus('ready');
      addLog('error', `Could not initialize download task: ${err.message}`);
    });
  };

  // Deliver downloaded file from Express server
  const triggerFileSave = (title: string, format: string, size: string, resolution: string) => {
    if (completedJobId) {
      window.location.href = `/api/download/file?jobId=${completedJobId}`;
      addLog('success', `Triggered browser file download delivery.`);
    } else {
      addLog('error', `Active download session ID not found. Save to disk aborted.`);
    }
  };

  // Re-download from list
  const handleReDownload = (item: DownloadHistoryItem) => {
    // Search default preset or construct raw info
    const simulatedMeta: MediaMetadata = {
      title: item.title,
      duration: '04:12', // estimated
      creator: 'Archived Clip',
      thumbnail: item.thumbnail,
      originalUrl: item.originalUrl,
      formats: [
        { id: 'custom-id', format: item.format as any, resolution: item.resolution, size: item.size, bitrate: 'hq' }
      ]
    };
    
    setMetadata(simulatedMeta);
    setSelectedFormat(simulatedMeta.formats[0]);
    setInputUrl(item.originalUrl);
    setStatus('ready');
    
    addLog('info', `Restored archive preset: ${item.title}`);
  };

  const handleRemoveHistoryItem = (id: string) => {
    const filtered = history.filter(h => h.id !== id);
    setHistory(filtered);
    localStorage.setItem('vortex_download_history', JSON.stringify(filtered));
    addLog('warning', `Deleted logs matching signature ID [${id}]`);
  };

  const handleClearAllHistory = () => {
    if (confirm("Permanently wipe local download history logs?")) {
      setHistory([]);
      localStorage.removeItem('vortex_download_history');
      addLog('warning', `Wiped entire historical library cache.`);
    }
  };

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-dark text-[#e5e2e1] font-sans flex flex-col relative antialiased selection:bg-action-red selection:text-white">
      {/* Glow highlight blur accents decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[350px] bg-gradient-to-b from-action-red/5 to-transparent blur-3xl pointer-events-none select-none -z-10" />

      {/* Header component */}
      <Header 
        onOpenSettings={() => setShowSettings(true)}
        onScrollToSection={handleScrollToSection}
      />

      {/* Main Interactive Stage body */}
      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 md:px-6 py-12 md:py-16 space-y-16">
        
        {/* Core Hero Branding Title */}
        <div className="text-center space-y-5">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-1.5 bg-secondary-grey/40 border border-gray-800/80 rounded-full px-3.5 py-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-action-red animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest font-mono text-gray-400 uppercase">
              Vortex Engine Node Active
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="font-hanken font-extrabold text-4xl md:text-5xl tracking-tight text-white leading-tight"
          >
            Speed. Precision. <span className="text-action-red bg-gradient-to-r from-action-red via-[#FF5540] to-orange-500 bg-clip-text text-transparent">Universal.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-sm md:text-base text-gray-400 max-w-xl mx-auto leading-relaxed font-sans"
          >
            Professional content extraction tool for creators and power users. High-bitrate downloads with zero compromises.
          </motion.p>
        </div>

        {/* Input Stage and Extraction Box (The Stage) */}
        <section className="bg-surface-card border border-gray-800/60 p-6 md:p-8 rounded-lg space-y-6 relative subtle-glow overflow-hidden">
          
          <div className="space-y-4">
            <label className="block text-[11px] font-mono font-bold tracking-widest text-[#ebbbb4]/80 uppercase">
              Secure Stream Ingestion Gate
            </label>
            
            {/* Form paste link wrapper */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Paste URL (YouTube, Vimeo, TikTok, Soundcloud, Twitter...)"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') triggerExtraction(inputUrl);
                  }}
                  className="w-full bg-black/90 text-sm font-sans text-white border border-gray-800 focus:border-action-red/60 focus:ring-1 focus:ring-action-red/30 focus:outline-none rounded px-4 py-3 h-12 transition-all duration-200"
                  id="input-url-stage"
                />
                {inputUrl && (
                  <button
                    onClick={() => setInputUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-gray-800"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <button
                onClick={() => triggerExtraction(inputUrl)}
                disabled={status === 'fetching'}
                className="bg-action-red hover:bg-action-hover active:scale-98 text-white px-8 h-12 text-xs font-extrabold tracking-widest font-hanken rounded transition-all duration-200 flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-action-red/20 disabled:opacity-50 disabled:cursor-wait"
                id="btn-fetch-stage"
              >
                {status === 'fetching' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>EXTRACTING</span>
                  </>
                ) : (
                  <span>FETCH</span>
                )}
              </button>
            </div>


          </div>

          <hr className="border-gray-800/80 my-4" />

          {/* Metadata Extracted card & Control center (Only visible if metadata exists) */}
          <div className="min-h-[140px] flex flex-col justify-center">
            {status === 'fetching' ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-10 h-10 rounded-full border-2 border-action-red/25 border-t-action-red animate-spin mx-auto" />
                <p className="text-xs font-mono text-gray-400 animate-pulse">Running advanced stream decryption protocol on distant master catalog...</p>
              </div>
            ) : metadata ? (
              <div className="space-y-6">
                
                {/* Main Media Preview panel matches mockup layout perfectly */}
                <div className="border border-gray-800/80 rounded-lg p-4 bg-gradient-to-r from-black/80 to-[#121212] flex flex-col md:flex-row items-center gap-5">
                  
                  {/* Thumbnail stage with overlay play feedback */}
                  <div className="relative w-full md:w-[190px] aspect-video md:h-28 rounded overflow-hidden shadow-lg border border-gray-800 group shrink-0 bg-neutral-dark">
                    <img 
                      src={metadata.thumbnail} 
                      alt="Extracted Stream Target Cover" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors duration-300">
                      <div className="w-10 h-10 rounded-full bg-action-red/90 flex items-center justify-center text-white subtle-glow group-hover:scale-110 transition-transform duration-200">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/85 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight text-white flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-action-red" />
                      {metadata.duration}
                    </div>
                  </div>

                  {/* Title and stats layout from mockup */}
                  <div className="flex-1 min-w-0 space-y-3.5 text-left w-full">
                    <div>
                      <h3 className="font-hanken font-extrabold text-lg text-white leading-snug tracking-tight">
                        {metadata.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-500 uppercase font-mono tracking-widest mt-1">
                        <span>DURATION: {metadata.duration}</span>
                        <span>•</span>
                        <span>CREATOR: {metadata.creator}</span>
                      </div>
                    </div>

                    {/* Quality Formats Chips list */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                        Available Multiplex Presets:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {metadata.formats.map((fmt) => {
                          const isSelected = selectedFormat.id === fmt.id;
                          return (
                            <button
                              key={fmt.id}
                              onClick={() => {
                                if (status !== 'downloading') {
                                  setSelectedFormat(fmt);
                                  addLog('info', `Target format selected: ${fmt.format} ${fmt.resolution} (${fmt.size})`);
                                }
                              }}
                              disabled={status === 'downloading'}
                              className={`text-[11px] font-mono px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none disabled:opacity-50 ${
                                isSelected
                                  ? 'bg-secondary-grey/90 border border-white text-white font-bold shadow-sm'
                                  : 'bg-[#1C1B1B] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
                              }`}
                            >
                              {fmt.format === 'MP4' || fmt.format === 'MKV' ? (
                                <FileVideo className="w-3 h-3 text-action-red" />
                              ) : (
                                <FileAudio className="w-3 h-3 text-tertiary-blue" />
                              )}
                              <span>{fmt.format} {fmt.resolution}</span>
                              <span className="opacity-60">{fmt.size}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar controller */}
                {status === 'downloading' && (
                  <div className="bg-black/40 border border-gray-800/80 rounded-lg p-5 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-action-red animate-ping" />
                        <span className="font-mono text-gray-300 font-bold uppercase">Downloading stream packets...</span>
                      </div>
                      <div className="flex items-center space-x-4 font-mono text-[11px] text-gray-400">
                        <span>Speed: <strong className="text-white font-semibold">{simulatedSpeed}</strong></span>
                        <span>ETA: <strong className="text-white font-semibold">{simulatedEta}</strong></span>
                        <span>Progress: <strong className="text-action-red font-bold">{downloadProgress}%</strong></span>
                      </div>
                    </div>
                    {/* Linear Progress container */}
                    <div className="w-full bg-gray-900 border border-gray-800 rounded-full h-3 overflow-hidden p-0.5">
                      <div 
                        className="bg-gradient-to-r from-action-red to-[#FF5540] h-full rounded-full transition-all duration-150 relative"
                        style={{ width: `${downloadProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Download complete state dialog card */}
                {status === 'completed' && (
                  <div className="bg-green-950/20 border border-green-900/40 rounded-lg p-5 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/15 text-green-500 flex items-center justify-center shrink-0 border border-green-500/30">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Stream Packets Decayed & Stitching Finalized!</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          The high-bitrate {selectedFormat.format} capsule was compiled. {settings.autoDownload ? 'The saved file has been supplied directly.' : 'Click "Save to Disk" below.'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => triggerFileSave(metadata.title, selectedFormat.format, selectedFormat.size, selectedFormat.resolution)}
                        className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded text-xs font-bold font-hanken transition-colors"
                      >
                        Save to Disk
                      </button>
                      <button
                        onClick={() => {
                          setStatus('ready');
                          setDownloadProgress(0);
                        }}
                        className="bg-transparent border border-gray-800 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded text-xs font-bold transition-all"
                      >
                        Parse Another
                      </button>
                    </div>
                  </div>
                )}

                {/* Simple direct trigger panel when Ready */}
                {status === 'ready' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-end">
                    <button
                      onClick={triggerDownloadSimulation}
                      className="bg-action-red hover:bg-action-hover text-white py-3.5 px-10 rounded text-xs font-extrabold tracking-wider font-hanken transition-all duration-200 flex items-center justify-center space-x-2.5 shadow-lg shadow-action-red/10 cursor-pointer text-center"
                    >
                      <Download className="w-4 h-4 fill-transparent" />
                      <span>DOWNLOAD {selectedFormat.format} WORKFLOW ({selectedFormat.resolution})</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              // Idle Prompt stage empty state
              <div className="py-8 text-center space-y-3.5">
                <div className="w-12 h-12 rounded-full bg-[#1C1B1B] text-gray-500 border border-gray-800 flex items-center justify-center mx-auto">
                  <Compass className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-300">Vortex Downloader Ingestion Standby</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Insert or select a demonstration stream preset to activate multiplex extraction, telemetry analysis, and direct downloading.
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-800/80 my-4" />

          {/* Engine Status Dot Indicator matching the footer in screenshot */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
            <div className="flex items-center space-x-2 select-none">
              <span className={`w-2 h-2 rounded-full ${
                status === 'fetching' ? 'bg-amber-500 animate-pulse' :
                status === 'downloading' ? 'bg-action-red animate-ping' :
                status === 'completed' ? 'bg-green-500' : 'bg-action-red animate-pulse'
              }`} />
              <span className="text-gray-400 capitalize">
                {status === 'fetching' ? 'Multiplex decoding manifest...' :
                 status === 'downloading' ? 'Ingesting heavy packet blocks...' :
                 status === 'completed' ? 'Extraction transaction completed' :
                 'Ready for processing'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Bitrate Filter: <strong>Off</strong></span>
              <span>•</span>
              <span>Default Threads: <strong>{settings.defaultThreads} splits</strong></span>
            </div>
          </div>
        </section>

        {/* Live Debug Terminals logs stream widget block */}
        <section className="space-y-3">
          <TerminalLogs 
            logs={logs}
            onClear={handleClearLogs}
            visible={logsVisible}
            onToggle={() => setLogsVisible(prev => !prev)}
          />
        </section>

        {/* Feature grid information matching screenshot */}
        <FeatureGrid />

        {/* Archive Historical Library Persistent Tracker log history */}
        <section className="border-t border-gray-800 pt-16 space-y-6">
          <div className="space-y-1 text-left">
            <h2 className="font-hanken font-extrabold text-xl text-white tracking-tight">Archived Media Vault</h2>
            <p className="text-xs text-gray-500">
              Review and retrieve previously saved multiplex flows cached inside your secure client session.
            </p>
          </div>
          
          <HistoryList 
            history={history}
            onRemoveItem={handleRemoveHistoryItem}
            onClearAll={handleClearAllHistory}
            onReDownload={handleReDownload}
          />
        </section>

      </main>

      {/* Settings Modal Component controls */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Terms of Service Modal */}
      <TermsModal 
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyModal 
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />

      {/* Premium Dark footer matching mockup format exactly */}
      <footer className="w-full bg-black border-t border-gray-900 py-8 px-6 md:px-12 text-xs text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4 font-mono select-none mt-auto">
        <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-center md:text-left">
          <span className="font-bold font-hanken text-gray-400 text-sm">
            Vortex<span className="text-action-red font-light">Downloader</span>
          </span>
          <span className="hidden md:inline text-gray-800">|</span>
          <span>© {new Date().getFullYear()} VortexDownloader. All rights reserved.</span>
        </div>

        <div className="flex items-center space-x-6 text-gray-500">
          <button 
            onClick={() => setShowTerms(true)}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            Terms of Service
          </button>
          <button 
            onClick={() => setShowPrivacy(true)}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            Privacy Policy
          </button>
        </div>
      </footer>
    </div>
  );
}
