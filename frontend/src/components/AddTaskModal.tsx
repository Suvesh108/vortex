import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Folder, 
  RefreshCw, 
  Layers, 
  Download, 
  FileText, 
  UploadCloud, 
  Clock, 
  Play,
  FileVideo,
  FileAudio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MediaMetadata, MediaQuality } from '../types';
import { extractMediaInfo } from '../extractor';
import { Capacitor } from '@capacitor/core';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDownload: (params: {
    urls: string[];
    metadata?: MediaMetadata;
    selectedFormat?: MediaQuality;
    threads: number;
  }) => void;
  backendUrl?: string;
  defaultThreads?: number;
  initialUrl?: string;
}

interface DetectedPackInfo {
  name: string;
  badgeClass: string;
  type: 'http' | 'ftp' | 'github' | 'huggingface' | 'ed2k' | 'bittorrent' | 'm3u8' | 'youtube';
}

function getDetectedPack(url: string): DetectedPackInfo | null {
  const trimmed = (url || '').trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.startsWith('ed2k://')) {
    return { name: 'ED2kPack', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', type: 'ed2k' };
  }
  if (trimmed.startsWith('ftp://') || trimmed.startsWith('ftps://')) {
    return { name: 'FtpPack', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40', type: 'ftp' };
  }
  if (trimmed.includes('github.com') || trimmed.includes('raw.githubusercontent.com')) {
    return { name: 'GitHubPack', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40', type: 'github' };
  }
  if (trimmed.includes('huggingface.co') || trimmed.includes('hf.co')) {
    return { name: 'HuggingFacePack', badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', type: 'huggingface' };
  }
  if (trimmed.startsWith('magnet:?') || trimmed.endsWith('.torrent')) {
    return { name: 'BitTorrentPack', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', type: 'bittorrent' };
  }
  if (trimmed.includes('.m3u8')) {
    return { name: 'M3U8Pack', badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40', type: 'm3u8' };
  }
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return { name: 'YouTubePack', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40', type: 'youtube' };
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { name: 'HttpPack', badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40', type: 'http' };
  }
  return null;
}

export default function AddTaskModal({
  isOpen,
  onClose,
  onStartDownload,
  backendUrl = '',
  defaultThreads = 16,
  initialUrl = ''
}: AddTaskModalProps) {
  const [linksText, setLinksText] = useState(initialUrl || '');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [threads, setThreads] = useState(defaultThreads);
  const [downloadLocation, setDownloadLocation] = useState(
    Capacitor.isNativePlatform() ? 'Download/VortexDownloader' : 'Downloads/Vortex'
  );
  
  // Single link parsing state
  const [isParsing, setIsParsing] = useState(false);

  // Sync initialUrl whenever modal opens or initialUrl changes
  useEffect(() => {
    if (isOpen && initialUrl) {
      setLinksText(initialUrl);
    }
  }, [isOpen, initialUrl]);
  const [parsedMetadata, setParsedMetadata] = useState<MediaMetadata | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<MediaQuality | null>(null);

  const firstUrl = linksText.trim().split('\n')[0]?.trim() || '';
  const detectedPack = getDetectedPack(firstUrl);

  // Auto-parse single link when pasted
  useEffect(() => {
    const lines = linksText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length !== 1) {
      setParsedMetadata(null);
      setParseError(null);
      return;
    }

    const targetUrl = lines[0];
    const pack = getDetectedPack(targetUrl);

    // 1. eD2k link parsing
    if (pack?.type === 'ed2k') {
      try {
        const parts = targetUrl.substring(7).split('|');
        const fileName = decodeURIComponent(parts[2] || 'ed2k_download');
        const fileSize = parseInt(parts[3], 10) || 0;
        const hash = parts[4] || '';
        const sizeStr = fileSize > 0 ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : 'P2P Swarm';

        setParsedMetadata({
          title: fileName,
          duration: 'eD2k Network',
          creator: `Hash: ${hash.substring(0, 10)}...`,
          thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=640&auto=format&fit=crop',
          originalUrl: targetUrl,
          category: 'ARCHIVE',
          targetExtension: fileName.split('.').pop() || 'bin',
          downloadUrl: targetUrl,
          formats: [{
            id: 'ed2k-direct',
            format: 'eD2k',
            resolution: sizeStr,
            size: sizeStr,
            bitrate: 'eDonkey2000 Protocol',
            targetExtension: fileName.split('.').pop() || 'bin'
          }]
        });
        setParseError(null);
      } catch (err: any) {
        setParseError(err.message || 'Invalid eD2k URI');
      }
      return;
    }

    // 2. FTP link parsing
    if (pack?.type === 'ftp') {
      try {
        const parsed = new URL(targetUrl);
        const fileName = decodeURIComponent(parsed.pathname.split('/').pop() || 'ftp_download');
        setParsedMetadata({
          title: fileName,
          duration: 'FTP Remote File',
          creator: `Host: ${parsed.hostname}`,
          thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=640&auto=format&fit=crop',
          originalUrl: targetUrl,
          category: 'DOCUMENT',
          targetExtension: fileName.split('.').pop() || 'bin',
          downloadUrl: targetUrl,
          formats: [{
            id: 'ftp-stream',
            format: 'FTP',
            resolution: 'Direct FTP Stream',
            size: 'Remote Host',
            bitrate: 'FTP/FTPS Protocol',
            targetExtension: fileName.split('.').pop() || 'bin'
          }]
        });
        setParseError(null);
      } catch (err: any) {
        setParseError(err.message || 'Invalid FTP URL');
      }
      return;
    }

    // 3. HTTP/HTTPS universal streams & direct files
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      setIsParsing(true);
      setParseError(null);
      extractMediaInfo(targetUrl, backendUrl)
        .then((data) => {
          setParsedMetadata(data);
          if (data.formats && data.formats.length > 0) {
            setSelectedFormat(data.formats[0]);
          }
        })
        .catch((err) => {
          setParseError(err.message || 'Could not parse link');
          setParsedMetadata(null);
        })
        .finally(() => setIsParsing(false));
    } else {
      setParsedMetadata(null);
      setParseError(null);
    }
  }, [linksText, backendUrl]);

  if (!isOpen) return null;

  const handleDownloadClick = () => {
    const lines = linksText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    onStartDownload({
      urls: lines,
      metadata: parsedMetadata || undefined,
      selectedFormat: selectedFormat || undefined,
      threads
    });

    onClose();
    setLinksText('');
  };

  const handleReset = () => {
    setLinksText('');
    setParsedMetadata(null);
    setParseError(null);
    setSelectedFormat(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Dialog (Matches Image 3) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-xl bg-[#202023] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[90vh] overflow-hidden z-10 text-gray-200"
        >
          {/* Header matching Image 3 */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 className="font-hanken font-bold text-base text-white">
              Add Task
            </h3>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsBatchMode(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  isBatchMode
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/20'
                    : 'bg-[#2b2b30] hover:bg-[#34343a] text-gray-300 border-white/[0.06]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Batch Add</span>
              </motion.button>

              <motion.label 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="px-2.5 py-1 rounded-lg text-xs font-sans bg-[#2b2b30] hover:bg-[#34343a] text-gray-300 border border-white/[0.06] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Import File(s)</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setLinksText(Array.from(e.target.files).map((f: File) => f.name).join('\n'));
                    }
                  }}
                />
              </motion.label>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Input Textarea matching Image 3 */}
            <div className="space-y-1">
              <div className="relative">
                <textarea
                  rows={3}
                  value={linksText}
                  onChange={(e) => setLinksText(e.target.value)}
                  placeholder="When adding multiple download links, make sure each line contains only one link"
                  className="w-full bg-[#18181b] border border-white/[0.08] focus:border-sky-400 rounded-xl p-3 text-xs font-mono text-white placeholder-gray-500 focus:outline-none resize-none transition-all shadow-inner"
                />
                {/* Cyan focus glow bar on bottom like Image 3 */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-60 mt-0.5" />
              </div>
            </div>

            {/* Parse Results Status Bar matching Image 3 */}
            <div className="border border-white/[0.06] rounded-xl bg-[#18181b]/70 overflow-hidden">
              <div className="px-3.5 py-2 bg-[#25252a] flex items-center justify-between text-xs font-sans text-gray-300">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Parse Results</span>
                  {detectedPack && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${detectedPack.badgeClass}`}>
                      {detectedPack.name}
                    </span>
                  )}
                </div>
                {isParsing ? (
                  <span className="text-[11px] text-sky-400 flex items-center gap-1.5 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Decoding target stream...
                  </span>
                ) : parsedMetadata ? (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    Resolved
                  </span>
                ) : parseError ? (
                  <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" />
                    Standard Download
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500 font-mono">Ready</span>
                )}
              </div>

              {/* Resolved Metadata Preview Box */}
              {parsedMetadata && (
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={parsedMetadata.thumbnail}
                      alt="Thumbnail"
                      className="w-16 h-12 rounded-lg object-cover bg-black shrink-0 border border-white/[0.08]"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate font-hanken">
                        {parsedMetadata.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {parsedMetadata.creator} • {parsedMetadata.duration}
                      </p>
                    </div>
                  </div>

                  {/* Format selector chips */}
                  {parsedMetadata.formats && parsedMetadata.formats.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {parsedMetadata.formats.map((fmt) => {
                        const isSelected = selectedFormat?.id === fmt.id;
                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => setSelectedFormat(fmt)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-mono border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                                : 'bg-[#2b2b30] border-white/[0.06] text-gray-400 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{fmt.resolution}</span>
                            <span className="text-[9px] opacity-60">.{fmt.targetExtension || 'mp4'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Download Settings Section matching Image 3 */}
            <div className="border border-white/[0.08] rounded-xl bg-[#18181b]/80 p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-gray-200 font-hanken">
                Download Settings
              </h4>

              {/* Row 1: Select Download Location */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span>Select Download Location</span>
                </div>

                <div className="flex items-center space-x-2 flex-1 max-w-[280px]">
                  <input
                    type="text"
                    value={downloadLocation}
                    onChange={(e) => setDownloadLocation(e.target.value)}
                    className="flex-1 bg-[#25252a] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs font-mono text-gray-200 focus:outline-none"
                  />
                  <button className="p-1 rounded-lg bg-[#2b2b30] hover:bg-[#34343a] text-gray-400 hover:text-white transition-colors cursor-pointer">
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Pre-allocated Threads Slider matching Image 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2 text-gray-400">
                  <UploadCloud className="w-4 h-4 text-gray-400" />
                  <span>Pre-allocated Threads</span>
                </div>

                <div className="flex items-center space-x-3 flex-1 max-w-[280px]">
                  <span className="font-mono text-xs text-white font-bold w-6 text-right">
                    {threads}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={32}
                    value={threads}
                    onChange={(e) => setThreads(Number(e.target.value))}
                    className="flex-1 accent-sky-400 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer with Bouncy Spring Motion */}
          <div className="px-5 py-3.5 bg-[#1a1a1d] border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center space-x-2.5 flex-1 max-w-[280px]">
              {/* Primary Download Button */}
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={handleDownloadClick}
                disabled={!linksText.trim()}
                className="flex-1 bg-gradient-to-r from-sky-400 to-[#38bdf8] hover:from-sky-300 hover:to-[#0284c7] disabled:opacity-40 text-black font-bold py-2 rounded-xl text-xs font-sans flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-sky-500/25 cursor-pointer"
              >
                <span>Download</span>
              </motion.button>

              {/* Reset Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.90 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                onClick={handleReset}
                className="p-2 rounded-xl bg-[#25252a] hover:bg-[#2e2e35] text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/[0.06]"
                title="Reset"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Cancel Button */}
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-[#25252a] hover:bg-[#2e2e35] text-gray-300 hover:text-white text-xs font-sans transition-colors cursor-pointer border border-white/[0.06]"
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
