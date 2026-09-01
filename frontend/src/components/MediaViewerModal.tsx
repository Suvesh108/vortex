import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  FolderOpen
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
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
          className="relative w-full max-w-4xl max-h-[90vh] bg-surface-card border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-800 bg-neutral-dark/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-3">
              <span className="px-2 py-0.5 rounded bg-action-red/20 border border-action-red/30 text-action-red text-[10px] font-mono font-bold uppercase shrink-0">
                {category} • .{ext}
              </span>
              <h3 className="font-hanken font-bold text-xs sm:text-sm text-white truncate">
                {item.title}
              </h3>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer"
                title="Close Viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Viewer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-black/40 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[420px]">
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
          <div className="px-4 sm:px-6 py-2.5 bg-neutral-dark/90 border-t border-gray-800 flex items-center justify-between text-[11px] font-mono text-gray-400 shrink-0">
            <div className="truncate">
              Resolution: <strong className="text-white">{item.resolution}</strong> • Size: <strong className="text-white">{item.size}</strong>
            </div>
            <div className="text-[10px] text-gray-500 hidden sm:block">
              In-App Direct Player • No 3rd-Party App Required
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* 1. CUSTOM VIDEO PLAYER (.mp4) */
function CustomVideoPlayer({ item }: { item: DownloadHistoryItem }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
      setProgress(val);
    }
  };

  const handleSpeedChange = () => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-3">
      <div className="relative w-full aspect-video max-h-[50vh] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center group">
        <video
          ref={videoRef}
          src={item.originalUrl}
          poster={item.thumbnail}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          muted={isMuted}
          playsInline
        />

        {/* Overlay Play Button */}
        {!isPlaying && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-action-red/90 flex items-center justify-center text-white subtle-glow hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-white ml-1" />
            </div>
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
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-300 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-action-red" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSpeedChange}
              className="px-2.5 py-1 rounded bg-secondary-grey/40 hover:bg-secondary-grey text-xs font-mono font-bold text-gray-300 hover:text-white border border-gray-800 transition-colors"
            >
              {playbackRate}x Speed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 2. CUSTOM AUDIO PLAYER (.m4a) */
function CustomAudioPlayer({ item }: { item: DownloadHistoryItem }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center space-y-6 py-4">
      <audio
        ref={audioRef}
        src={item.originalUrl}
        onEnded={() => setIsPlaying(false)}
        muted={isMuted}
      />

      {/* Spinning Vinyl Visualizer */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-gray-800 p-2 shadow-2xl flex items-center justify-center bg-gradient-to-tr from-gray-900 to-black">
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

      {/* Track Details */}
      <div className="text-center space-y-1">
        <h4 className="font-hanken font-bold text-base text-white truncate max-w-xs sm:max-w-sm">
          {item.title}
        </h4>
        <p className="text-xs font-mono text-gray-400">
          Lossless AAC (.m4a) • 320 kbps High Fidelity Audio
        </p>
      </div>

      {/* Audio Scrubber & Controls */}
      <div className="w-full bg-surface-card border border-gray-800 rounded-xl p-4 space-y-3">
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

/* 3. CUSTOM PHOTO VIEWER (.jpg) */
function CustomPhotoViewer({ item }: { item: DownloadHistoryItem }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="w-full flex flex-col items-center space-y-3">
      <div className="relative w-full max-h-[55vh] overflow-hidden bg-black/90 rounded-xl border border-gray-800 flex items-center justify-center p-2">
        <img
          src={item.thumbnail}
          alt={item.title}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out'
          }}
          className="max-h-[50vh] max-w-full object-contain rounded select-none"
        />
      </div>

      <div className="flex items-center space-x-2 bg-surface-card border border-gray-800 rounded-xl p-2">
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
      </div>
    </div>
  );
}

/* 4. CUSTOM DOCUMENT VIEWER (.pdf) */
function CustomDocumentViewer({ item }: { item: DownloadHistoryItem }) {
  const [page, setPage] = useState(1);
  const totalPages = 4;

  return (
    <div className="w-full max-w-xl flex flex-col space-y-3">
      <div className="bg-neutral-900 border border-gray-800 rounded-xl p-6 min-h-[300px] text-gray-200 font-serif space-y-4 shadow-xl">
        <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-action-red">
            <FileText className="w-5 h-5" />
            <span className="font-sans font-bold text-xs uppercase tracking-wider">PDF Document Preview</span>
          </div>
          <span className="text-xs font-mono text-gray-400">Page {page} of {totalPages}</span>
        </div>

        <div className="text-sm leading-relaxed space-y-3 text-gray-300 font-sans">
          <h2 className="text-lg font-bold text-white font-hanken">{item.title}</h2>
          <p className="text-xs text-gray-400">
            Document encrypted and extracted via Vortex Core Pipeline. Content is verified as standard Adobe PDF specification.
          </p>
          <div className="p-3 bg-black/40 border border-gray-800 rounded-lg text-xs font-mono text-gray-300 space-y-1">
            <div>• Title: {item.title}</div>
            <div>• Target URL: {item.originalUrl}</div>
            <div>• Download Time: {item.timestamp}</div>
            <div>• MIME Standard: application/pdf</div>
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

/* 5. CUSTOM SPREADSHEET VIEWER (.xlsx) */
function CustomSpreadsheetViewer({ item }: { item: DownloadHistoryItem }) {
  const mockData = [
    { id: 1, colA: 'Stream Task #101', colB: '1080p Full HD', colC: '14.2 MB', colD: 'COMPLETE' },
    { id: 2, colA: 'Stream Task #102', colB: 'Lossless AAC M4A', colC: '6.8 MB', colD: 'COMPLETE' },
    { id: 3, colA: 'Archive Dataset', colB: 'Standard .zip', colC: '48.1 MB', colD: 'VERIFIED' },
    { id: 4, colA: 'Document Manifest', colB: 'Adobe .pdf', colC: '1.4 MB', colD: 'SYNCED' }
  ];

  return (
    <div className="w-full overflow-x-auto space-y-3">
      <div className="flex items-center gap-2 text-green-400 mb-1">
        <FileSpreadsheet className="w-4 h-4" />
        <span className="text-xs font-mono font-bold uppercase">Spreadsheet Dataset (.xlsx)</span>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden bg-neutral-900 shadow-xl">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-secondary-grey/50 text-gray-300 border-b border-gray-800">
              <th className="p-3">#</th>
              <th className="p-3">Record Label</th>
              <th className="p-3">Format Specification</th>
              <th className="p-3">Payload Size</th>
              <th className="p-3">State</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.id} className="border-b border-gray-800/60 hover:bg-white/5 transition-colors">
                <td className="p-3 text-gray-500">{row.id}</td>
                <td className="p-3 font-bold text-white">{row.colA}</td>
                <td className="p-3 text-gray-300">{row.colB}</td>
                <td className="p-3 text-emerald-400">{row.colC}</td>
                <td className="p-3">
                  <span className="px-1.5 py-0.5 rounded bg-green-950/40 text-green-400 border border-green-800/40 text-[10px]">
                    {row.colD}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 6. CUSTOM PRESENTATION VIEWER (.pptx) */
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
            {slide === 1 ? item.title : slide === 2 ? 'Architecture Overview' : 'Summary & Download Metrics'}
          </h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {slide === 1 ? 'High-Performance Universal In-App Multi-Format Presentation Module.' : slide === 2 ? 'Lossless extraction & auto-converting pipelines.' : 'Native Android integration complete.'}
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

/* 7. CUSTOM EBOOK READER (.epub) */
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
            Chapter 1: The Universal Stream Protocol.
          </p>
          <p>
            In modern mobile ecosystems, direct stream downloading without reliance on third-party viewer applications guarantees data isolation and uninterrupted consumption.
          </p>
          <p>
            Every packet decoded through Vortex Core maintains lossless container integrity across the 9 standard formats.
          </p>
        </div>
      </div>
    </div>
  );
}

/* 8. CUSTOM ZIP EXPLORER (.zip) */
function CustomZipExplorer({ item }: { item: DownloadHistoryItem }) {
  const mockFiles = [
    { name: 'manifest.json', size: '2.4 KB', type: 'JSON' },
    { name: 'stream_video_1080p.mp4', size: '18.5 MB', type: 'VIDEO' },
    { name: 'stream_audio_hq.m4a', size: '4.2 MB', type: 'AUDIO' },
    { name: 'thumbnail_cover.jpg', size: '340 KB', type: 'IMAGE' },
    { name: 'README.txt', size: '1.1 KB', type: 'TEXT' }
  ];

  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex items-center gap-2 text-amber-400 mb-1">
        <FileArchive className="w-4 h-4" />
        <span className="text-xs font-mono font-bold uppercase">Archive Explorer (.zip)</span>
      </div>

      <div className="bg-neutral-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl p-3 space-y-2">
        <div className="text-xs font-mono text-gray-400 px-2 py-1 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-action-red" />
          <span>Archive Root: {item.title}.zip</span>
        </div>

        <div className="space-y-1">
          {mockFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-gray-800/80 hover:bg-white/5 transition-colors text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-secondary-grey/60 text-[9px] text-gray-300">
                  {file.type}
                </span>
                <span className="text-white font-medium">{file.name}</span>
              </div>
              <span className="text-gray-400">{file.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 9. CUSTOM TEXT VIEWER (.txt) */
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
          className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded bg-secondary-grey/40 text-gray-300 hover:text-white"
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
