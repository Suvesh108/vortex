import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarNav, { NavView } from './components/SidebarNav';
import DesktopLayout from './layouts/DesktopLayout';
import MobileLayout from './layouts/MobileLayout';
import { useIsMobile } from './hooks/useIsMobile';
import AddTaskModal from './components/AddTaskModal';
import SettingsModal from './components/SettingsModal';

import SecretVaultModal from './components/SecretVaultModal';
import WebBrowserModal from './components/WebBrowserModal';
import Aria2RpcModal from './components/Aria2RpcModal';

import { DownloadStatus, MediaMetadata, MediaQuality, DownloadLog, DownloadHistoryItem, UserSettings, ChunkDownloadProgress } from './types';
import { extractMediaInfo, downloadMediaDirect, deleteLocalFile, startSegmentedChunkDownload, probeUrl, startFtpDownload, inspectEd2kLink } from './extractor';
import { requestAppPermissions } from './permissions';

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [addTaskInitialUrl, setAddTaskInitialUrl] = useState('');

  // Download state
  const [status, setStatus] = useState<DownloadStatus>('ready');
  const [currentDownloading, setCurrentDownloading] = useState<{
    title: string;
    progress: number;
    speed: string;
    eta: string;
    targetExtension?: string;
  } | null>(null);

  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [logs, setLogs] = useState<DownloadLog[]>([]);

  // Active Modals
  const [showBrowser, setShowBrowser] = useState(false);
  const [showSecretVault, setShowSecretVault] = useState(false);
  const [showAria2Modal, setShowAria2Modal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

  useEffect(() => {
    addLog('system', 'Vortex Downloader UI loaded.');
    requestAppPermissions().then((perm) => {
      addLog('info', `Storage: [${perm.storage}], Notifications: [${perm.notifications}]`);
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

    // Listen for downloads captured from the Inbuilt Browser
    try {
      import('./plugins/InbuiltBrowser').then(({ InbuiltBrowser }) => {
        InbuiltBrowser.addListener('onDownloadRequested', (data) => {
          if (data && data.downloadUrl) {
            setAddTaskInitialUrl(data.downloadUrl);
            setShowAddTaskModal(true);
            addLog('info', `Stream captured from Inbuilt Browser: ${data.downloadUrl.substring(0, 45)}...`);
          }
        });
      }).catch(() => {});
    } catch (_) {}
  }, []);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('vortex_settings', JSON.stringify(newSettings));
    addLog('info', 'Settings updated.');
  };

  // Trigger download from Add Task Modal
  const handleStartDownloadFromModal = async (params: {
    urls: string[];
    metadata?: MediaMetadata;
    selectedFormat?: MediaQuality;
    threads: number;
  }) => {
    const { urls, metadata, selectedFormat, threads } = params;
    if (!urls || urls.length === 0) return;

    for (const url of urls) {
      // Check magnet link
      if (url.startsWith('magnet:?') || url.endsWith('.torrent')) {
        addLog('info', `Adding magnet link to P2P Swarm: ${url.substring(0, 40)}...`);
        try {
          await fetch(`${settings.backendUrl}/api/torrent/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ magnetURI: url })
          });
        } catch (_) {}
        continue;
      }

      // Check FTP / FTPS link (FtpPack)
      if (url.startsWith('ftp://') || url.startsWith('ftps://')) {
        const title = url.split('/').pop()?.split('?')[0] || 'ftp_download';
        setStatus('downloading');
        setCurrentDownloading({
          title,
          progress: 0,
          speed: 'Connecting FTP...',
          eta: '--',
          targetExtension: title.split('.').pop() || 'bin'
        });

        try {
          addLog('info', `📡 FtpPack streaming transfer: ${url}`);
          const ftpRes = await startFtpDownload(
            url,
            settings.backendUrl,
            (prog) => {
              setCurrentDownloading({
                title,
                progress: prog.percent,
                speed: prog.speed,
                eta: prog.eta,
                targetExtension: title.split('.').pop() || 'bin'
              });
            },
            (type, msg) => addLog(type, msg)
          );

          const entry: DownloadHistoryItem = {
            id: Math.random().toString(36).substring(2, 9),
            title,
            originalUrl: url,
            thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=640&auto=format&fit=crop',
            size: 'Completed',
            resolution: 'FTP Stream',
            format: 'FTP',
            targetExtension: title.split('.').pop() || 'bin',
            directStreamUrl: ftpRes.blobUrl,
            localPath: ftpRes.blobUrl,
            timestamp: new Date().toLocaleString()
          };
          const updated = [entry, ...history];
          setHistory(updated);
          localStorage.setItem('vortex_download_history', JSON.stringify(updated));

          setStatus('completed');
          setCurrentDownloading(null);
          addLog('success', `Completed FTP transfer: ${title}`);
          continue;
        } catch (e: any) {
          addLog('error', `FtpPack error: ${e.message}`);
          setStatus('error');
          setCurrentDownloading(null);
          continue;
        }
      }

      // Check eD2k link (ED2kPack)
      if (url.startsWith('ed2k://')) {
        try {
          const ed2kRes = await inspectEd2kLink(url, settings.backendUrl);
          const fileName = ed2kRes.info?.fileName || 'ed2k_file';
          const fileSize = ed2kRes.info?.fileSize || 0;
          const hash = ed2kRes.info?.hash || '';
          addLog('info', `ED2kPack registered: ${fileName} [Hash: ${hash}]`);

          const entry: DownloadHistoryItem = {
            id: Math.random().toString(36).substring(2, 9),
            title: fileName,
            originalUrl: url,
            thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=640&auto=format&fit=crop',
            size: fileSize > 0 ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : 'P2P Swarm',
            resolution: `MD4: ${hash.substring(0, 8)}...`,
            format: 'ED2K',
            targetExtension: fileName.split('.').pop() || 'bin',
            directStreamUrl: url,
            localPath: url,
            timestamp: new Date().toLocaleString()
          };
          const updated = [entry, ...history];
          setHistory(updated);
          localStorage.setItem('vortex_download_history', JSON.stringify(updated));
          addLog('success', `ED2k task queued: ${fileName}`);
          continue;
        } catch (e: any) {
          addLog('error', `ED2k error: ${e.message}`);
          continue;
        }
      }

      // Check direct chunk file vs media stream
      const meta = metadata || await extractMediaInfo(url, settings.backendUrl).catch(() => null);
      const title = meta?.title || url.split('/').pop()?.split('?')[0] || 'Download_Task';
      const targetExt = selectedFormat?.targetExtension || meta?.targetExtension || 'mp4';
      const format = selectedFormat || meta?.formats?.[0] || {
        id: 'best',
        format: 'MP4',
        resolution: 'Best Available',
        size: 'N/A',
        bitrate: 'N/A',
        targetExtension: targetExt
      };

      setStatus('downloading');
      setCurrentDownloading({
        title,
        progress: 0,
        speed: 'Connecting...',
        eta: '--',
        targetExtension: targetExt
      });

      // Try IDM-style parallel chunk download if direct file
      const probe = await probeUrl(url, settings.backendUrl);
      if (probe.isDirectFile) {
        try {
          addLog('info', `⚡ Parallel multi-stream chunking with ${threads} pipes: ${title}`);
          const chunkRes = await startSegmentedChunkDownload(
            url,
            title,
            settings.backendUrl,
            (prog) => {
              setCurrentDownloading({
                title,
                progress: prog.percent,
                speed: prog.speed,
                eta: prog.eta,
                targetExtension: targetExt
              });
            },
            (type, msg) => addLog(type, msg)
          );

          // Save completed task to history
          const entry: DownloadHistoryItem = {
            id: Math.random().toString(36).substring(2, 9),
            title,
            originalUrl: url,
            thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640&auto=format&fit=crop',
            size: `${(probe.contentLength / (1024 * 1024)).toFixed(1)} MB`,
            resolution: 'Direct File',
            format: 'BINARY',
            targetExtension: targetExt,
            directStreamUrl: chunkRes.blobUrl,
            localPath: chunkRes.blobUrl,
            timestamp: new Date().toLocaleString()
          };
          const updated = [entry, ...history];
          setHistory(updated);
          localStorage.setItem('vortex_download_history', JSON.stringify(updated));

          setStatus('completed');
          setCurrentDownloading(null);
          addLog('success', `Completed: ${title}`);
          continue;
        } catch (e: any) {
          addLog('warning', `Chunk engine fallback to stream multiplexer: ${e.message}`);
        }
      }

      // Stream download via downloader.py
      try {
        if (!meta) throw new Error('Could not decode stream metadata');
        addLog('info', `Stream extraction thread started for: ${title}`);
        const streamRes = await downloadMediaDirect(
          meta,
          format,
          settings.backendUrl,
          (prog, spd, eta) => {
            setCurrentDownloading({
              title,
              progress: prog,
              speed: spd,
              eta,
              targetExtension: targetExt
            });
          },
          (type, msg) => addLog(type, msg)
        );

        const entry: DownloadHistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          title: meta.title,
          originalUrl: url,
          thumbnail: meta.thumbnail,
          size: format.size,
          resolution: format.resolution,
          format: format.format,
          category: meta.category,
          targetExtension: targetExt,
          directStreamUrl: streamRes.blobUrl,
          localPath: streamRes.blobUrl,
          timestamp: new Date().toLocaleString()
        };
        const updated = [entry, ...history];
        setHistory(updated);
        localStorage.setItem('vortex_download_history', JSON.stringify(updated));

        setStatus('completed');
        setCurrentDownloading(null);
        addLog('success', `Saved: ${meta.title}`);
      } catch (err: any) {
        setStatus('failed');
        setCurrentDownloading(null);
        addLog('error', `Download failed: ${err.message}`);
      }
    }
  };

  const handleRemoveHistoryItem = async (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      const cleanTitle = item.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
      const targetExt = item.targetExtension || 'mp4';
      await deleteLocalFile(`${cleanTitle}.${targetExt}`);
    }
    const filtered = history.filter(h => h.id !== id);
    setHistory(filtered);
    localStorage.setItem('vortex_download_history', JSON.stringify(filtered));
  };

  const isMobile = useIsMobile();

  const layoutProps = {
    searchQuery,
    onSearchChange: (q: string) => setSearchQuery(q),
    activeView,
    onSelectView: (view: NavView) => {
      if (view === 'settings') {
        setShowSettingsModal(true);
        return;
      }
      setActiveView(view);
    },
    onOpenNewTask: () => setShowAddTaskModal(true),
    onOpenBrowser: () => setShowBrowser(true),
    onOpenSettings: () => setShowSettingsModal(true),
    onOpenAria2Modal: () => setShowAria2Modal(true),
    onOpenSecretVault: () => setShowSecretVault(true),
    isSettingsOpen: showSettingsModal,
    history,
    currentDownloading,
    settings,
    onUpdateSettings: handleUpdateSettings,
    onRemoveHistoryItem: handleRemoveHistoryItem,
    onDownloadUrl: (url: string) => {
      setAddTaskInitialUrl(url);
      setShowAddTaskModal(true);
    }
  };

  return (
    <>
      {/* Dynamic Viewport Layout Switcher: Mobile Version vs Windows Desktop Version */}
      {isMobile ? (
        <MobileLayout {...layoutProps} />
      ) : (
        <DesktopLayout {...layoutProps} />
      )}

      {/* 4. ADD TASK MODAL (Matches Image 3) */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => {
          setShowAddTaskModal(false);
          setAddTaskInitialUrl('');
        }}
        onStartDownload={handleStartDownloadFromModal}
        backendUrl={settings.backendUrl}
        defaultThreads={settings.defaultThreads}
        initialUrl={addTaskInitialUrl}
      />

      {/* 5. AUXILIARY MODALS */}
      <Aria2RpcModal
        isOpen={showAria2Modal}
        onClose={() => setShowAria2Modal(false)}
        rpcUrl={`${settings.backendUrl || 'http://localhost:5001'}/jsonrpc`}
      />

      <SecretVaultModal
        isOpen={showSecretVault}
        onClose={() => setShowSecretVault(false)}
        allHistoryItems={history}
        onHideFromPublicHistory={(id) => handleRemoveHistoryItem(id)}
      />

      <WebBrowserModal
        isOpen={showBrowser}
        initialQuery={searchQuery}
        onClose={() => setShowBrowser(false)}
        onDownloadUrl={(url) => {
          setShowBrowser(false);
          setShowAddTaskModal(true);
        }}
      />

      {/* Floating Settings Window Modal (Matches media_1788795290025.png) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenAria2Modal={() => setShowAria2Modal(true)}
      />
    </>
  );
}
