import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Download, 
  Compass, 
  RefreshCw, 
  CheckCircle2, 
  FileVideo, 
  FileAudio, 
  Clock, 
  ArrowLeft,
  Database,
  Zap,
  Activity,
  Check
} from 'lucide-react';

import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import TermsModal from './components/TermsModal';
import PrivacyModal from './components/PrivacyModal';
import TerminalLogs from './components/TerminalLogs';
import HistoryList from './components/HistoryList';
import { SAMPLE_PRESETS } from './data';
import { DownloadStatus, MediaMetadata, MediaQuality, DownloadLog, DownloadHistoryItem, UserSettings } from './types';
import { extractMediaInfo, downloadMediaDirect } from './extractor';
import { requestAppPermissions, sendDownloadCompleteNotification } from './permissions';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [activeTab, setActiveTab] = useState<'downloader' | 'vault'>('downloader');
  const [inputUrl, setInputUrl] = useState('');
  const [status, setStatus] = useState<DownloadStatus>('ready');
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  
  const [selectedFormat, setSelectedFormat] = useState<MediaQuality>({
    id: '',
    format: 'MP4',
    resolution: '1080p',
    size: 'N/A',
    bitrate: 'N/A'
  });

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [simulatedSpeed, setSimulatedSpeed] = useState('0.0 MB/s');
  const [simulatedEta, setSimulatedEta] = useState('--');

  const [logs, setLogs] = useState<DownloadLog[]>([]);
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
    saveHistory: true,
    backendUrl: ''
  });

  const addLog = (type: DownloadLog['type'], message: string) => {
    const newLog: DownloadLog = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev.slice(-100), newLog]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    addLog('system', 'Vortex Downloader initialized. Ready for ingestion.');
    requestAppPermissions().then((status) => {
      addLog('info', `Device permissions check: Storage [${status.storage}], Notifications [${status.notifications}]`);
    });

    const savedHistory = localStorage.getItem('vortex_download_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (_) {}
    }

    const savedSettings = localStorage.getItem('vortex_settings');
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } catch (_) {}
    }
  }, []);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('vortex_settings', JSON.stringify(newSettings));
    addLog('info', 'User configuration updated.');
  };

  const triggerExtraction = async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      addLog('warning', 'Empty URL input stage.');
      return;
    }

    setStatus('fetching');
    setMetadata(null);
    setDownloadProgress(0);
    addLog('info', `Target ingest: ${targetUrl}`);

    try {
      const data = await extractMediaInfo(targetUrl, settings.backendUrl, (type, msg) => addLog(type, msg));
      setMetadata(data);
      if (data.formats && data.formats.length > 0) {
        setSelectedFormat(data.formats[0]);
      }
      setStatus('ready');
      addLog('success', `Metadata decoded: "${data.title}"`);
    } catch (err: any) {
      setStatus('failed');
      addLog('error', `Extraction failure: ${err.message || 'Stream not accessible'}`);
    }
  };

  const triggerDownloadSimulation = async () => {
    if (!metadata || !selectedFormat) return;

    setStatus('downloading');
    setDownloadProgress(0);
    addLog('info', `Beginning direct binary stream for [${selectedFormat.format} - ${selectedFormat.resolution}]...`);

    try {
      await downloadMediaDirect(
        metadata,
        selectedFormat,
        settings.backendUrl,
        (progress, speed, eta) => {
          setDownloadProgress(progress);
          setSimulatedSpeed(speed);
          setSimulatedEta(eta);
        },
        (type, msg) => addLog(type, msg)
      );

      setStatus('completed');
      setDownloadProgress(100);
      setSimulatedSpeed('0.0 MB/s');
      setSimulatedEta('0s');

      if (settings.saveHistory) {
        const historyEntry: DownloadHistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          title: metadata.title,
          originalUrl: metadata.originalUrl,
          thumbnail: metadata.thumbnail,
          size: selectedFormat.size,
          resolution: selectedFormat.resolution,
          format: selectedFormat.format,
          timestamp: new Date().toLocaleString()
        };
        const updated = [historyEntry, ...history];
        setHistory(updated);
        localStorage.setItem('vortex_download_history', JSON.stringify(updated));
      }

      addLog('success', `File processing finished: ${metadata.title}.${selectedFormat.format.toLowerCase()}`);
    } catch (err: any) {
      setStatus('failed');
      addLog('error', `Download error: ${err.message || 'Stream pipeline failed'}`);
    }
  };

  const triggerFileSave = (title: string, format: string, size: string, resolution: string) => {
    addLog('success', `Exported "${title}.${format.toLowerCase()}" to disk.`);
    alert(`File saved to device storage: Download/VortexDownloader/${title}.${format.toLowerCase()}`);
  };

  const handleReDownload = (item: DownloadHistoryItem) => {
    setInputUrl(item.originalUrl);
    setActiveTab('downloader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerExtraction(item.originalUrl);
  };

  const handleRemoveHistoryItem = (id: string) => {
    const filtered = history.filter(h => h.id !== id);
    setHistory(filtered);
    localStorage.setItem('vortex_download_history', JSON.stringify(filtered));
    addLog('warning', `Removed item from archive.`);
  };

  const handleClearAllHistory = () => {
    if (confirm("Permanently wipe local download history logs?")) {
      setHistory([]);
      localStorage.removeItem('vortex_download_history');
      addLog('warning', `Cleared archived media vault.`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-dark text-[#e5e2e1] font-sans flex flex-col relative antialiased selection:bg-action-red selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-gradient-to-b from-action-red/5 to-transparent blur-3xl pointer-events-none select-none -z-10" />

      {/* Header component with tab switching */}
      <Header 
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setShowSettings(true)}
        vaultCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[800px] w-full mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 overflow-x-hidden">
        
        {/* ================= PAGE 1: DOWNLOADER ================= */}
        {activeTab === 'downloader' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero Branding */}
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center space-x-1.5 bg-secondary-grey/40 border border-gray-800/80 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-action-red animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest font-mono text-gray-400 uppercase">
                  Vortex Core Engine Active
                </span>
              </div>

              <h1 className="font-hanken font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-white leading-tight">
                Speed. Precision. <span className="text-action-red bg-gradient-to-r from-action-red via-[#FF5540] to-orange-500 bg-clip-text text-transparent">Universal.</span>
              </h1>

              <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed font-sans px-2">
                High-speed universal stream extraction & direct file downloading with zero compromises.
              </p>
            </div>

            {/* Ingestion Stage Card */}
            <section className="bg-surface-card border border-gray-800/80 p-4 sm:p-6 md:p-8 rounded-xl space-y-6 subtle-glow w-full max-w-full overflow-hidden">
              
              <div className="space-y-3">
                <label className="block text-[11px] font-mono font-bold tracking-widest text-[#ebbbb4]/80 uppercase">
                  Universal Stream & File Ingestion
                </label>
                
                {/* Input form */}
                <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Paste URL (YouTube, TikTok, Twitter, MP4, ZIP, etc.)..."
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') triggerExtraction(inputUrl);
                      }}
                      className="w-full bg-black/90 text-xs sm:text-sm font-sans text-white border border-gray-800 focus:border-action-red/60 focus:ring-1 focus:ring-action-red/30 focus:outline-none rounded-lg px-3.5 py-3 h-12 transition-all"
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
                    className="bg-action-red hover:bg-action-hover active:scale-98 text-white px-6 h-12 text-xs font-extrabold tracking-widest font-hanken rounded-lg transition-all flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-action-red/20 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
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

                {/* Sample Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-gray-500 mr-1">Presets:</span>
                  {SAMPLE_PRESETS.slice(0, 3).map((preset) => (
                    <button
                      key={preset.url}
                      onClick={() => {
                        setInputUrl(preset.url);
                        triggerExtraction(preset.url);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors"
                    >
                      {preset.title.length > 18 ? preset.title.substring(0, 15) + '...' : preset.title}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-800/80" />

              {/* Metadata Card & Controls */}
              <div className="min-h-[120px] flex flex-col justify-center">
                {status === 'fetching' ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-9 h-9 rounded-full border-2 border-action-red/25 border-t-action-red animate-spin mx-auto" />
                    <p className="text-xs font-mono text-gray-400 animate-pulse">
                      Decoding stream manifest via native multi-engine pipeline...
                    </p>
                  </div>
                ) : metadata ? (
                  <div className="space-y-5">
                    
                    {/* Media Preview Box */}
                    <div className="border border-gray-800/80 rounded-xl p-3.5 sm:p-4 bg-gradient-to-r from-black/80 to-[#121212] flex flex-col sm:flex-row items-center gap-4 w-full overflow-hidden">
                      
                      {/* Cover Thumbnail */}
                      <div className="relative w-full sm:w-[160px] aspect-video sm:h-24 rounded-lg overflow-hidden shadow-lg border border-gray-800 shrink-0 bg-neutral-dark">
                        <img 
                          src={metadata.thumbnail} 
                          alt="Thumbnail" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-action-red/90 flex items-center justify-center text-white subtle-glow">
                            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 bg-black/85 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold text-white flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-action-red" />
                          {metadata.duration}
                        </div>
                      </div>

                      {/* Details & Formats */}
                      <div className="flex-1 min-w-0 space-y-3 text-left w-full">
                        <div>
                          <h3 className="font-hanken font-bold text-sm sm:text-base text-white leading-snug line-clamp-2">
                            {metadata.title}
                          </h3>
                          <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mt-1 truncate">
                            {metadata.creator} • {metadata.duration}
                          </p>
                        </div>

                        {/* Format Chips */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                            Select Quality Format:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {metadata.formats.map((fmt) => {
                              const isSelected = selectedFormat.id === fmt.id;
                              return (
                                <button
                                  key={fmt.id}
                                  onClick={() => {
                                    if (status !== 'downloading') {
                                      setSelectedFormat(fmt);
                                      addLog('info', `Selected format: ${fmt.format} ${fmt.resolution}`);
                                    }
                                  }}
                                  disabled={status === 'downloading'}
                                  className={`text-[10px] sm:text-[11px] font-mono p-2 rounded-lg transition-all flex items-center justify-between gap-1 border cursor-pointer ${
                                    isSelected
                                      ? 'bg-action-red/20 border-action-red text-white font-bold'
                                      : 'bg-secondary-grey/30 border-gray-800 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    {fmt.format === 'MP3' || fmt.format === 'M4A' ? (
                                      <FileAudio className="w-3.5 h-3.5 text-action-red shrink-0" />
                                    ) : (
                                      <FileVideo className="w-3.5 h-3.5 text-action-red shrink-0" />
                                    )}
                                    <span className="truncate">{fmt.resolution}</span>
                                  </div>
                                  <span className="text-[9px] opacity-60 font-mono shrink-0">{fmt.format}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LIVE DOWNLOAD PROGRESS DISPLAY */}
                    {status === 'downloading' && (
                      <div className="bg-black/60 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-3 text-left animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-action-red animate-ping" />
                            <span className="font-mono text-xs text-white font-bold uppercase">
                              Downloading Stream Binary...
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 font-mono text-xs text-gray-400">
                            <span>Speed: <strong className="text-white">{simulatedSpeed}</strong></span>
                            <span>ETA: <strong className="text-white">{simulatedEta}</strong></span>
                            <span className="px-2 py-0.5 rounded bg-action-red/20 text-action-red font-bold text-xs">
                              {downloadProgress}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-gray-900 border border-gray-800 rounded-full h-3.5 overflow-hidden p-0.5">
                          <div 
                            className="bg-gradient-to-r from-action-red via-[#FF5540] to-orange-500 h-full rounded-full transition-all duration-200 relative shadow-sm"
                            style={{ width: `${Math.max(5, downloadProgress)}%` }}
                          >
                            <div className="absolute inset-0 bg-white/25 animate-pulse" />
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-500 font-mono">
                          Directly streaming full binary payload into device storage.
                        </p>
                      </div>
                    )}

                    {/* Completed State Card */}
                    {status === 'completed' && (
                      <div className="bg-green-950/20 border border-green-900/40 rounded-xl p-4 sm:p-5 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/15 text-green-500 flex items-center justify-center shrink-0 border border-green-500/30">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">Download Completed Successfully!</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Saved to <strong>Internal Storage &gt; Download &gt; VortexDownloader</strong>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-end">
                          <button
                            onClick={() => triggerFileSave(metadata.title, selectedFormat.format, selectedFormat.size, selectedFormat.resolution)}
                            className="bg-green-500 hover:bg-green-600 text-black px-4 py-2.5 rounded-lg text-xs font-bold font-hanken transition-colors cursor-pointer"
                          >
                            Save Again
                          </button>
                          <button
                            onClick={() => {
                              setStatus('ready');
                              setDownloadProgress(0);
                            }}
                            className="bg-secondary-grey/40 hover:bg-secondary-grey text-gray-300 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border border-gray-800 cursor-pointer"
                          >
                            New Download
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ready state Download Action Trigger */}
                    {status === 'ready' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={triggerDownloadSimulation}
                          className="w-full sm:w-auto bg-action-red hover:bg-action-hover text-white py-3.5 px-8 rounded-lg text-xs font-extrabold tracking-wider font-hanken transition-all flex items-center justify-center space-x-2 shadow-lg shadow-action-red/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>START DOWNLOAD ({selectedFormat.format} • {selectedFormat.resolution})</span>
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  // Idle Standby State
                  <div className="py-6 text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-secondary-grey/30 text-gray-500 border border-gray-800 flex items-center justify-center mx-auto">
                      <Compass className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-300">Ingestion Standby</h4>
                      <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-0.5 leading-relaxed">
                        Paste any video, audio, or direct file URL above to begin extraction.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status indicator footer */}
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1 border-t border-gray-800/60">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    status === 'fetching' ? 'bg-amber-500 animate-pulse' :
                    status === 'downloading' ? 'bg-action-red animate-ping' :
                    status === 'completed' ? 'bg-green-500' : 'bg-action-red animate-pulse'
                  }`} />
                  <span className="text-gray-400 capitalize">
                    {status === 'fetching' ? 'Resolving stream...' :
                     status === 'downloading' ? 'Downloading...' :
                     status === 'completed' ? 'Extraction completed' :
                     'Standby Ready'}
                  </span>
                </div>
                
                <span className="text-gray-400 font-mono">
                  Engine: <strong>Native Multi-Tool</strong>
                </span>
              </div>
            </section>

            {/* Live Terminal Logs */}
            <section className="space-y-3">
              <TerminalLogs 
                logs={logs}
                onClear={handleClearLogs}
                visible={logsVisible}
                onToggle={() => setLogsVisible(prev => !prev)}
              />
            </section>
          </div>
        )}

        {/* ================= PAGE 2: SEPARATE ARCHIVED MEDIA VAULT ================= */}
        {activeTab === 'vault' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Vault Page Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-action-red" />
                  <h2 className="font-hanken font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                    Archived Media Vault
                  </h2>
                </div>
                <p className="text-xs text-gray-400">
                  Review, reload, copy, and manage your complete history of downloaded links.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('downloader')}
                className="px-3.5 py-2 bg-secondary-grey/40 hover:bg-secondary-grey text-gray-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border border-gray-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            {/* History List Component */}
            <HistoryList 
              history={history}
              onRemoveItem={handleRemoveHistoryItem}
              onClearAll={handleClearAllHistory}
              onReDownload={handleReDownload}
              onLoadUrl={(url) => {
                setInputUrl(url);
                setActiveTab('downloader');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerExtraction(url);
              }}
            />
          </div>
        )}

      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Modals */}
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}
