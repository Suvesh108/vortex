import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Radio, ArrowDown, ArrowUp, Users, HardDrive, CheckCircle2, AlertTriangle, Trash2, Folder, File, RefreshCw } from 'lucide-react';
import { TorrentItem } from '../types';

interface TorrentDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrl?: (url: string) => void;
  backendUrl?: string;
}

export default function TorrentDownloaderModal({ isOpen, onClose, onSelectUrl, backendUrl = '' }: TorrentDownloaderModalProps) {
  const [torrents, setTorrents] = useState<TorrentItem[]>([]);
  const [inputMagnet, setInputMagnet] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeHash, setActiveHash] = useState<string | null>(null);

  const fetchTorrents = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/torrent/list`);
      if (res.ok) {
        const data = await res.json();
        setTorrents(data);
        if (data.length > 0 && !activeHash) {
          setActiveHash(data[0].infoHash);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchTorrents();
    const interval = setInterval(fetchTorrents, 1500);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleAddMagnet = async () => {
    if (!inputMagnet.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/torrent/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ magnetURI: inputMagnet.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setInputMagnet('');
        fetchTorrents();
        setActiveHash(data.infoHash);
      }
    } catch (e: any) {
      alert('Error adding magnet: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (hash: string) => {
    try {
      await fetch(`${backendUrl}/api/torrent/${hash}?deleteFiles=true`, { method: 'DELETE' });
      fetchTorrents();
      if (activeHash === hash) setActiveHash(null);
    } catch (_) {}
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024;
      i++;
    }
    return `${val.toFixed(1)} ${units[i]}`;
  };

  const activeTorrent = torrents.find(t => t.infoHash === activeHash);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl bg-surface-card border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-950/30 flex flex-col max-h-[85vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 bg-neutral-dark/80">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-hanken font-bold text-base text-white flex items-center gap-2">
                  <span>P2P BitTorrent & Magnet Swarm</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold">
                    NATIVE ENGINE
                  </span>
                </h3>
                <p className="text-[11px] font-mono text-gray-400">
                  Direct peer-to-peer decentralized downloads with selective file trees.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Magnet Input Bar */}
          <div className="p-4 border-b border-gray-800 bg-black/40 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Paste magnet:?xt=urn:btih:... or torrent hash..."
              value={inputMagnet}
              onChange={(e) => setInputMagnet(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMagnet();
              }}
              className="flex-1 bg-gray-900 border border-gray-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
            />
            <button
              onClick={handleAddMagnet}
              disabled={loading || !inputMagnet.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black px-5 py-2.5 rounded-xl text-xs font-hanken font-bold flex items-center justify-center space-x-1.5 shrink-0 transition-colors cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5" />
              )}
              <span>ADD TO SWARM</span>
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {torrents.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-gray-300">Swarm Swarm Standby</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Paste any magnet link above to stream and download files with peer telemetry.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left: Active Torrent List */}
                <div className="space-y-2 md:col-span-1 border-r border-gray-800/80 pr-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                    Active Swarms ({torrents.length})
                  </span>
                  {torrents.map((t) => {
                    const isSelected = t.infoHash === activeHash;
                    return (
                      <div
                        key={t.infoHash}
                        onClick={() => setActiveHash(t.infoHash)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/25 border-emerald-500/40 text-white'
                            : 'bg-gray-900/40 border-gray-800 hover:border-gray-700 text-gray-400'
                        }`}
                      >
                        <div className="font-hanken font-bold text-xs truncate text-white mb-1">
                          {t.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span>{t.progress}%</span>
                          <span className="text-emerald-400">{formatBytes(t.downloadSpeed)}/s</span>
                        </div>
                        <div className="w-full bg-gray-950 rounded-full h-1 mt-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Selected Swarm Details & File Tree */}
                <div className="md:col-span-2 space-y-4">
                  {activeTorrent ? (
                    <div className="space-y-4">
                      {/* Swarm Telemetry Box */}
                      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-hanken font-bold text-sm text-white truncate max-w-[280px]">
                            {activeTorrent.name}
                          </h4>
                          <button
                            onClick={() => handleRemove(activeTorrent.infoHash)}
                            className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                            title="Remove torrent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                          <div className="p-2 rounded-lg bg-black/40 border border-gray-800">
                            <span className="text-gray-500 block">Peers</span>
                            <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              {activeTorrent.numPeers} connected
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/40 border border-gray-800">
                            <span className="text-gray-500 block">Speed</span>
                            <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                              <ArrowDown className="w-3 h-3" />
                              {formatBytes(activeTorrent.downloadSpeed)}/s
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/40 border border-gray-800">
                            <span className="text-gray-500 block">Size</span>
                            <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                              <HardDrive className="w-3 h-3 text-gray-400" />
                              {formatBytes(activeTorrent.totalBytes)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-gray-400">Download Progress</span>
                            <span className="font-bold text-white">{activeTorrent.progress}%</span>
                          </div>
                          <div className="w-full bg-black/80 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                              animate={{ width: `${activeTorrent.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* File Tree List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                          Files in Payload ({activeTorrent.files.length})
                        </span>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {activeTorrent.files.map((file, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-black/30 border border-gray-800/80 flex items-center justify-between text-xs font-mono"
                            >
                              <div className="flex items-center space-x-2 min-w-0 pr-2">
                                <File className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="truncate text-gray-300">{file.name}</span>
                              </div>
                              <span className="text-gray-500 text-[10px] shrink-0 font-mono">
                                {formatBytes(file.length)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
