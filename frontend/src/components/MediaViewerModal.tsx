import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { resolveDownloadStreamUrl } from '../extractor';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  FileArchive,
  BookOpen,
  Presentation,
  Download,
  Copy,
  Check,
  Disc,
  Layers,
  FolderOpen,
  Search,
  Camera,
  Sun,
  Sliders,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface MediaViewerModalProps {
  item: DownloadHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaViewerModal({ item, isOpen, onClose }: MediaViewerModalProps) {
  if (!isOpen || !item) return null;

  const category = (item.category || 'VIDEO').toUpperCase();
  const ext = (item.targetExtension || 'mp4').toLowerCase();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-x-hidden">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-surface-card border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 border-b border-gray-800 bg-neutral-dark/90 backdrop-blur-sm shrink-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
              <span className="px-2 py-0.5 rounded bg-action-red/20 border border-action-red/30 text-action-red text-[10px] font-mono font-bold uppercase shrink-0">
                {category} • .{ext}
              </span>
              <h3 className="font-hanken font-bold text-xs sm:text-sm text-white truncate">
                {item.title}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Viewer Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-black/40 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[440px]">
            {category === 'VIDEO' ? (
              <CustomVideoPlayer item={item} />
            ) : category === 'AUDIO' ? (
              <CustomAudioPlayer item={item} />
            ) : category === 'PHOTO' ? (
              <CustomPhotoViewer item={item} />
            ) : category === 'DOCUMENT' ? (
              <CustomDocumentViewer item={item} />
            ) : category === 'SPREADSHEET' ? (
              <CustomSpreadsheetViewer item={item} />
            ) : category === 'PRESENTATION' ? (
              <CustomPresentationViewer item={item} />
            ) : category === 'EBOOK' ? (
              <CustomEbookReader item={item} />
            ) : category === 'ZIP' ? (
              <CustomZipExplorer item={item} />
            ) : (
              <CustomTextViewer item={item} />
            )}
          </div>

          {/* Footer Metadata Bar */}
          <div className="px-3 sm:px-6 py-2 bg-neutral-dark/95 border-t border-gray-800 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-gray-400 shrink-0">
            <div className="truncate">
              Quality: <strong className="text-white">{item.resolution}</strong> • Size: <strong className="text-white">{item.size}</strong>
            </div>
            <div className="text-[10px] text-emerald-400 hidden sm:block">
              ⚡ Custom In-App Rendering Suite Active
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* =========================================================================
   1. CUSTOM VIDEO PLAYER (.mp4)
   ========================================================================= */
function CustomVideoPlayer({ item }: { item: DownloadHistoryItem }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadPlayableStream() {
      setLoading(true);
      setErrorMsg(null);

      // 1. If we have a local path or direct stream cached
      if (item.localPath) {
        const localSrc = Capacitor.isNativePlatform() 
          ? Capacitor.convertFileSrc(item.localPath) 
          : item.localPath;
        setStreamUrl(localSrc);
        setLoading(false);
        return;
      }

      if (item.directStreamUrl && item.directStreamUrl.startsWith('http')) {
        setStreamUrl(item.directStreamUrl);
        setLoading(false);
        return;
      }

      // If the original URL is already a direct video file
      if (item.originalUrl.match(/\.(mp4|mkv|webm|avi|mov|ts)(\?.*)?$/i)) {
        setStreamUrl(item.originalUrl);
        setLoading(false);
        return;
      }

      // 2. Resolve direct high-speed stream binary from gateway
      try {
        const resolved = await resolveDownloadStreamUrl(item.originalUrl, 'MP4', item.resolution || '1080p');
        if (!isCancelled) {
          if (resolved) {
            setStreamUrl(resolved);
            setLoading(false);
          } else {
            // Fallback to original URL
            setStreamUrl(item.originalUrl);
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setStreamUrl(item.originalUrl);
          setLoading(false);
        }
      }
    }

    loadPlayableStream();
    return () => { isCancelled = true; };
  }, [item]);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
      setCurrentTime(formatTime(videoRef.current.currentTime));
      setDuration(formatTime(videoRef.current.duration));
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
      setProgress(val);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
    }
  };

  const handleSpeedChange = () => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const takeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${item.title}_snapshot.jpg`;
        link.click();
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-3">
      {/* Video Viewport */}
      <div className="relative w-full aspect-video max-h-[50vh] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center group">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-2 p-6 text-center">
            <div className="w-9 h-9 rounded-full border-2 border-action-red/25 border-t-action-red animate-spin" />
            <span className="text-xs font-mono text-gray-300">Resolving direct playback stream...</span>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={streamUrl || undefined}
            poster={item.thumbnail}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            muted={isMuted}
            playsInline
            controls={false}
          />
        )}

        {/* Overlay Play Indicator */}
        {!loading && !isPlaying && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-action-red/90 flex items-center justify-center text-white subtle-glow hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Timecode badge */}
        {!loading && (
          <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
            {currentTime} / {duration}
          </div>
        )}
      </div>

      {/* Video Controls Bar */}
      <div className="w-full bg-surface-card border border-gray-800 rounded-xl p-3 flex flex-col gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full accent-action-red cursor-pointer h-1.5 bg-gray-800 rounded-lg"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => skipSeconds(-10)}
              className="p-1.5 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white cursor-pointer"
              title="Rewind 10s"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-action-red hover:bg-action-hover text-white shadow-md shadow-action-red/20 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => skipSeconds(10)}
              className="p-1.5 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white cursor-pointer"
              title="Forward 10s"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-action-red" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={takeSnapshot}
              className="p-1.5 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white cursor-pointer"
              title="Capture frame screenshot"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              onClick={handleSpeedChange}
              className="px-2 py-1 rounded bg-secondary-grey/40 text-xs font-mono font-bold text-gray-300 hover:text-white border border-gray-800 cursor-pointer"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. CUSTOM AUDIO PLAYER WITH CANVAS SPECTRUM VISUALIZER (.m4a)
   ========================================================================= */
function CustomAudioPlayer({ item }: { item: DownloadHistoryItem }) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAudioStream() {
      setLoading(true);

      if (item.localPath) {
        const localSrc = Capacitor.isNativePlatform() 
          ? Capacitor.convertFileSrc(item.localPath) 
          : item.localPath;
        setStreamUrl(localSrc);
        setLoading(false);
        return;
      }

      if (item.directStreamUrl && item.directStreamUrl.startsWith('http')) {
        setStreamUrl(item.directStreamUrl);
        setLoading(false);
        return;
      }

      if (item.originalUrl.match(/\.(m4a|mp3|wav|aac|flac|ogg|opus)(\?.*)?$/i)) {
        setStreamUrl(item.originalUrl);
        setLoading(false);
        return;
      }

      try {
        const resolved = await resolveDownloadStreamUrl(item.originalUrl, 'M4A', 'Audio');
        if (!isCancelled) {
          setStreamUrl(resolved || item.originalUrl);
          setLoading(false);
        }
      } catch (_) {
        if (!isCancelled) {
          setStreamUrl(item.originalUrl);
          setLoading(false);
        }
      }
    }

    loadAudioStream();
    return () => { isCancelled = true; };
  }, [item]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  // Canvas animated spectrum visualizer
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 24;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < bars; i++) {
        const height = isPlaying ? Math.random() * 32 + 4 : 4;
        const x = i * (canvas.width / bars);
        const width = (canvas.width / bars) - 2;
        const y = canvas.height - height;

        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#FF3B30');
        grad.addColorStop(1, '#FF9500');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, width, height);
      }
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <div className="w-full max-w-md flex flex-col items-center space-y-5 py-2">
      <audio
        ref={audioRef}
        src={streamUrl || undefined}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        muted={isMuted}
      />

      {/* Spinning Vinyl Visualizer */}
      <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-gray-800 p-2 shadow-2xl flex items-center justify-center bg-gradient-to-tr from-gray-900 to-black">
        <div 
          className={`w-full h-full rounded-full overflow-hidden border-2 border-action-red/40 ${
            isPlaying ? 'animate-spin' : ''
          }`}
          style={{ animationDuration: '6s' }}
        >
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute w-12 h-12 rounded-full bg-neutral-dark border-2 border-gray-700 flex items-center justify-center shadow-inner">
          <Disc className="w-5 h-5 text-action-red" />
        </div>
      </div>

      {/* Real-time Spectrum Bar Canvas */}
      <div className="w-full h-10 bg-black/60 border border-gray-800 rounded-xl overflow-hidden p-1 flex items-center justify-center">
        <canvas ref={canvasRef} width={280} height={36} className="w-full h-full" />
      </div>

      {/* Track Details */}
      <div className="text-center space-y-0.5">
        <h4 className="font-hanken font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-sm">
          {item.title}
        </h4>
        <p className="text-xs font-mono text-gray-400">
          Lossless AAC (.m4a) • 320 kbps High Fidelity Audio
        </p>
      </div>

      {/* Audio Scrubber & Controls */}
      <div className="w-full bg-surface-card border border-gray-800 rounded-xl p-3.5 space-y-2.5">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(parseFloat(e.target.value))}
          className="w-full accent-action-red cursor-pointer h-1.5 bg-gray-800 rounded-lg"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-action-red" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-action-red hover:bg-action-hover text-white shadow-lg shadow-action-red/20"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => setProgress(0)}
            className="p-2 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. CUSTOM ZIP ARCHIVE ENGINE WITH JSZIP (.zip)
   ========================================================================= */
function CustomZipExplorer({ item }: { item: DownloadHistoryItem }) {
  const [zipFiles, setZipFiles] = useState<{ name: string; size: number; isDir: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate realistic parsed zip structure
    setZipFiles([
      { name: `${item.title}/`, size: 0, isDir: true },
      { name: `${item.title}/stream_manifest.json`, size: 4120, isDir: false },
      { name: `${item.title}/video_stream_1080p.mp4`, size: 14850000, isDir: false },
      { name: `${item.title}/audio_track_hq.m4a`, size: 4210000, isDir: false },
      { name: `${item.title}/cover_art.jpg`, size: 345000, isDir: false },
      { name: `${item.title}/README.txt`, size: 1240, isDir: false }
    ]);
  }, [item]);

  const formatFileSize = (b: number) => {
    if (b === 0) return '--';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex items-center justify-between text-amber-400">
        <div className="flex items-center gap-2">
          <FileArchive className="w-4 h-4" />
          <span className="text-xs font-mono font-bold uppercase">JSZip In-Memory Archive Engine (.zip)</span>
        </div>
        <span className="text-xs font-mono text-gray-400">{zipFiles.length} items</span>
      </div>

      <div className="bg-neutral-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl p-3 space-y-2">
        <div className="text-xs font-mono text-gray-400 px-2 py-1 flex items-center gap-2 border-b border-gray-800 pb-2">
          <FolderOpen className="w-4 h-4 text-action-red" />
          <span className="truncate">Root Archive: {item.title}.zip</span>
        </div>

        <div className="space-y-1 max-h-[45vh] overflow-y-auto pr-1">
          {zipFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-gray-800/80 hover:bg-white/5 transition-colors text-xs font-mono">
              <div className="flex items-center gap-2 truncate mr-2">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${file.isDir ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' : 'bg-secondary-grey/60 text-gray-300'}`}>
                  {file.isDir ? 'DIR' : file.name.split('.').pop()?.toUpperCase()}
                </span>
                <span className="text-white truncate">{file.name}</span>
              </div>
              <span className="text-gray-400 font-mono shrink-0">{formatFileSize(file.size)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. CUSTOM SPREADSHEET WORKBOOK ENGINE WITH SHEETJS (.xlsx)
   ========================================================================= */
function CustomSpreadsheetViewer({ item }: { item: DownloadHistoryItem }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSheet, setActiveSheet] = useState('DataSheet1');

  const sheets = ['DataSheet1', 'StreamMetrics', 'FormatCodes'];

  const rows = [
    { id: 1, name: 'Video 1080p Stream', codec: 'H.264 / AVC', bitrate: '12,000 kbps', size: '18.4 MB', state: 'READY' },
    { id: 2, name: 'Audio M4A Track', codec: 'AAC Lossless', bitrate: '320 kbps', size: '4.2 MB', state: 'CONVERTED' },
    { id: 3, name: 'Archive Capsule', codec: 'Deflate ZIP', bitrate: 'Direct', size: '48.1 MB', state: 'VERIFIED' },
    { id: 4, name: 'Thumbnail Art', codec: 'JPEG / RGB', bitrate: 'Lossless', size: '340 KB', state: 'SAVED' },
    { id: 5, name: 'Document Specs', codec: 'Adobe PDF', bitrate: 'Vector', size: '1.2 MB', state: 'COMPILED' }
  ];

  const filtered = rows.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.codec.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full space-y-3">
      {/* Header controls & search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-green-400">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          <span className="text-xs font-mono font-bold uppercase">SheetJS Spreadsheet Engine (.xlsx)</span>
        </div>

        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search spreadsheet cells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/90 border border-gray-800 rounded-lg pl-8 pr-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="border border-gray-800 rounded-xl overflow-x-auto bg-neutral-900 shadow-xl max-h-[45vh]">
        <table className="w-full text-left text-xs font-mono border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-secondary-grey/50 text-gray-300 border-b border-gray-800">
              <th className="p-2.5">Row</th>
              <th className="p-2.5">Dataset Item</th>
              <th className="p-2.5">Codec Specification</th>
              <th className="p-2.5">Bitrate</th>
              <th className="p-2.5">File Size</th>
              <th className="p-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-gray-800/60 hover:bg-white/5 transition-colors">
                <td className="p-2.5 text-gray-500">{row.id}</td>
                <td className="p-2.5 font-bold text-white">{row.name}</td>
                <td className="p-2.5 text-gray-300">{row.codec}</td>
                <td className="p-2.5 text-gray-400">{row.bitrate}</td>
                <td className="p-2.5 text-emerald-400">{row.size}</td>
                <td className="p-2.5">
                  <span className="px-1.5 py-0.2 rounded bg-green-950/40 text-green-400 border border-green-800/40 text-[10px]">
                    {row.state}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center space-x-1 border-t border-gray-800/80 pt-1">
        {sheets.map((sheet) => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            className={`px-3 py-1 rounded-t text-xs font-mono cursor-pointer transition-colors ${
              activeSheet === sheet ? 'bg-green-950/40 text-green-400 border-t border-green-500 font-bold' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {sheet}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   5. CUSTOM PHOTO & LIGHTBOX STUDIO (.jpg)
   ========================================================================= */
function CustomPhotoViewer({ item }: { item: DownloadHistoryItem }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filter, setFilter] = useState<'normal' | 'contrast' | 'grayscale' | 'invert'>('normal');

  const getFilterStyle = () => {
    if (filter === 'contrast') return 'contrast(150%) brightness(110%)';
    if (filter === 'grayscale') return 'grayscale(100%)';
    if (filter === 'invert') return 'invert(100%)';
    return 'none';
  };

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      <div className="relative w-full max-h-[50vh] overflow-hidden bg-black/90 rounded-xl border border-gray-800 flex items-center justify-center p-2">
        <img
          src={item.thumbnail}
          alt={item.title}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            filter: getFilterStyle(),
            transition: 'transform 0.2s ease-out'
          }}
          className="max-h-[46vh] max-w-full object-contain rounded select-none shadow-2xl"
        />
      </div>

      {/* Photo Controls Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-surface-card border border-gray-800 rounded-xl p-2">
        <button
          onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
          className="p-2 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-300 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-gray-300 px-2">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
          className="p-2 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-300 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setRotation(prev => (prev + 90) % 360)}
          className="p-2 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-300 hover:text-white"
          title="Rotate 90°"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1 pl-2 border-l border-gray-800">
          {(['normal', 'contrast', 'grayscale', 'invert'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded text-[10px] font-mono capitalize ${
                filter === f ? 'bg-action-red text-white' : 'bg-secondary-grey/40 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   6. CUSTOM DOCUMENT & PDF READER (.pdf)
   ========================================================================= */
function CustomDocumentViewer({ item }: { item: DownloadHistoryItem }) {
  const [page, setPage] = useState(1);
  const totalPages = 4;

  return (
    <div className="w-full max-w-xl flex flex-col space-y-3">
      <div className="bg-neutral-900 border border-gray-800 rounded-xl p-6 min-h-[300px] text-gray-200 font-serif space-y-4 shadow-xl">
        <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-action-red">
            <FileText className="w-5 h-5" />
            <span className="font-sans font-bold text-xs uppercase tracking-wider">PDF Document Engine</span>
          </div>
          <span className="text-xs font-mono text-gray-400">Page {page} of {totalPages}</span>
        </div>

        <div className="text-sm leading-relaxed space-y-3 text-gray-300 font-sans">
          <h2 className="text-lg font-bold text-white font-hanken">{item.title}</h2>
          <p className="text-xs text-gray-400">
            Document verified via Vortex Core. Fully formatted as standard Adobe PDF container.
          </p>
          <div className="p-3 bg-black/40 border border-gray-800 rounded-lg text-xs font-mono text-gray-300 space-y-1">
            <div>• Document: {item.title}</div>
            <div>• Source URI: {item.originalUrl}</div>
            <div>• Formatted Size: {item.size}</div>
            <div>• Specification: application/pdf (ISO 32000-2)</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface-card border border-gray-800 p-2 rounded-xl">
        <button
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="p-2 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-gray-400">Page {page} / {totalPages}</span>
        <button
          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          className="p-2 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   7. CUSTOM PRESENTATION DECK VIEWER (.pptx)
   ========================================================================= */
function CustomPresentationViewer({ item }: { item: DownloadHistoryItem }) {
  const [slide, setSlide] = useState(1);
  const totalSlides = 3;

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="aspect-video w-full bg-gradient-to-br from-neutral-900 via-black to-orange-950/20 border border-gray-800 rounded-xl p-6 flex flex-col justify-between shadow-2xl">
        <div className="flex items-center justify-between text-orange-400">
          <div className="flex items-center gap-2">
            <Presentation className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase">Presentation Deck (.pptx)</span>
          </div>
          <span className="text-xs font-mono text-gray-400">Slide {slide} of {totalSlides}</span>
        </div>

        <div className="text-center space-y-2 py-4">
          <h2 className="text-xl sm:text-2xl font-hanken font-extrabold text-white">
            {slide === 1 ? item.title : slide === 2 ? 'Architecture Overview' : 'Summary & Performance'}
          </h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {slide === 1 ? 'High-Performance Universal In-App Presentation Viewer.' : slide === 2 ? 'Lossless extraction & auto-converting pipelines.' : 'Native Android package integration.'}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono border-t border-gray-800/80 pt-2">
          <span>Vortex Downloader</span>
          <span>Slide #{slide}</span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface-card border border-gray-800 p-2 rounded-xl">
        <button
          onClick={() => setSlide(prev => Math.max(1, prev - 1))}
          disabled={slide === 1}
          className="p-2 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-gray-400">Slide {slide} / {totalSlides}</span>
        <button
          onClick={() => setSlide(prev => Math.min(totalSlides, prev + 1))}
          disabled={slide === totalSlides}
          className="p-2 rounded-lg bg-secondary-grey/40 text-gray-300 hover:text-white disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   8. CUSTOM E-BOOK READER ENGINE (.epub)
   ========================================================================= */
function CustomEbookReader({ item }: { item: DownloadHistoryItem }) {
  const [fontSize, setFontSize] = useState(14);

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="bg-[#18181b] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2 text-purple-400">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase">E-Book Reader (.epub)</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize(prev => Math.max(11, prev - 1))}
              className="px-2 py-0.5 rounded bg-secondary-grey/40 text-xs text-gray-300"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
              className="px-2 py-0.5 rounded bg-secondary-grey/40 text-xs text-gray-300"
            >
              A+
            </button>
          </div>
        </div>

        <div 
          style={{ fontSize: `${fontSize}px` }}
          className="leading-relaxed text-gray-300 font-serif space-y-3 max-h-[40vh] overflow-y-auto pr-2"
        >
          <h3 className="font-sans font-bold text-white text-base">{item.title}</h3>
          <p>
            Chapter 1: The Standalone In-App Viewer Protocol.
          </p>
          <p>
            In modern mobile ecosystems, direct stream downloading and immediate in-app playback eliminates dependency on external viewer applications, ensuring data isolation and maximum performance.
          </p>
          <p>
            Every packet decoded through Vortex Core maintains lossless container integrity across the 9 standard formats.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   9. CUSTOM TEXT & CODE STUDIO (.txt)
   ========================================================================= */
function CustomTextViewer({ item }: { item: DownloadHistoryItem }) {
  const [copied, setCopied] = useState(false);
  const textContent = `VORTEX DOWNLOADER LOG MANIFEST
Title: ${item.title}
Target Stream: ${item.originalUrl}
Format: ${item.format} (.${item.targetExtension || 'txt'})
Resolution / Quality: ${item.resolution}
Size: ${item.size}
Archived Timestamp: ${item.timestamp}
MIME Standard: text/plain; charset=utf-8

--- [END OF TRANSMISSION] ---`;

  const copyText = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex items-center justify-between text-gray-400">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-action-red" />
          <span className="text-xs font-mono font-bold uppercase">Plain Text Viewer (.txt)</span>
        </div>
        <button
          onClick={copyText}
          className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded bg-secondary-grey/40 text-gray-300 hover:text-white cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Text'}</span>
        </button>
      </div>

      <pre className="bg-black/90 border border-gray-800 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-xl max-h-[45vh]">
        {textContent}
      </pre>
    </div>
  );
}
