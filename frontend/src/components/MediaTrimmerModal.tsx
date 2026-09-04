import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Scissors,
  Play,
  Pause,
  Save,
  FileVideo,
  FileAudio,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
  RotateCcw,
  Volume2,
  ChevronDown
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';
import { getLocalFileUrl } from '../extractor';

interface MediaTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DownloadHistoryItem | null;
  allItems?: DownloadHistoryItem[];
  onSaveTrimmed: (trimmedItem: DownloadHistoryItem) => void;
}

export default function MediaTrimmerModal({
  isOpen,
  onClose,
  item: initialItem,
  allItems = [],
  onSaveTrimmed
}: MediaTrimmerModalProps) {
  const [activeItem, setActiveItem] = useState<DownloadHistoryItem | null>(initialItem);
  const [playableUrl, setPlayableUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(60); // seconds
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [currentTime, setCurrentTime] = useState(0);
  const [convertToAudio, setConvertToAudio] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [loopPreview, setLoopPreview] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setActiveItem(initialItem);
  }, [initialItem]);

  useEffect(() => {
    if (activeItem && isOpen) {
      setStartTime(0);
      setEndTime(30);
      setCurrentTime(0);
      setIsDone(false);
      setIsProcessing(false);
      setIsPlaying(false);

      // Resolve playable local file URL or direct stream
      getLocalFileUrl(activeItem).then((resolvedUrl) => {
        setPlayableUrl(resolvedUrl || activeItem.directStreamUrl || activeItem.originalUrl);
      });
    }
  }, [activeItem, isOpen]);

  if (!isOpen || !activeItem) return null;

  const isAudioFile = activeItem.category === 'AUDIO' || /\.(m4a|mp3|wav|flac|ogg)$/i.test(activeItem.title);

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLoadedMetadata = (e: any) => {
    const d = Math.floor(e.target.duration);
    if (d && d > 0) {
      setDuration(d);
      setEndTime(Math.min(d, 30));
    }
  };

  const handleTimeUpdate = (e: any) => {
    const curr = e.target.currentTime;
    setCurrentTime(curr);

    if (curr >= endTime) {
      if (loopPreview) {
        e.target.currentTime = startTime;
        e.target.play().catch(() => {});
      } else {
        e.target.pause();
        e.target.currentTime = startTime;
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = () => {
    const mediaEl = isAudioFile ? audioRef.current : videoRef.current;
    if (mediaEl) {
      if (isPlaying) {
        mediaEl.pause();
        setIsPlaying(false);
      } else {
        if (mediaEl.currentTime < startTime || mediaEl.currentTime >= endTime) {
          mediaEl.currentTime = startTime;
        }
        mediaEl.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const seekTo = (time: number) => {
    const mediaEl = isAudioFile ? audioRef.current : videoRef.current;
    if (mediaEl) {
      mediaEl.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleExportTrim = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);

      const targetExt = convertToAudio ? 'm4a' : (activeItem.targetExtension || 'mp4');
      const trimmedItem: DownloadHistoryItem = {
        ...activeItem,
        id: Math.random().toString(36).substring(2, 9),
        title: `${activeItem.title} (Trimmed ${formatSeconds(startTime)}-${formatSeconds(endTime)})`,
        category: convertToAudio ? 'AUDIO' : activeItem.category,
        targetExtension: targetExt,
        format: convertToAudio ? 'M4A' : activeItem.format,
        size: 'Estimated ' + (Math.max(1, Math.round((endTime - startTime) * 0.3))) + ' MB',
        timestamp: new Date().toLocaleString()
      };

      onSaveTrimmed(trimmedItem);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[92vh] bg-surface-card border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800 bg-neutral-dark/95 shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-action-red/20 border border-action-red/30 flex items-center justify-center text-action-red shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-hanken font-bold text-sm sm:text-base text-white truncate">
                  Media Trimmer & Converter Studio
                </h3>
                <p className="text-[10px] font-mono text-gray-500 truncate">{activeItem.title}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 flex flex-col items-center">
            {/* Media Player Viewport */}
            <div className="relative w-full aspect-video max-h-[38vh] bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center group shadow-2xl">
              {!isAudioFile ? (
                <video
                  ref={videoRef}
                  src={playableUrl}
                  poster={activeItem.thumbnail}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  playsInline
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-neutral-900/60 p-4">
                  <div className="w-16 h-16 rounded-2xl bg-action-red/20 border border-action-red/40 flex items-center justify-center text-action-red shadow-lg">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <audio
                    ref={audioRef}
                    src={playableUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                  />
                  <div className="text-xs font-mono text-gray-300 text-center truncate max-w-xs">
                    {activeItem.title}
                  </div>
                </div>
              )}

              {/* Play Overlay */}
              <button
                onClick={togglePlay}
                className={`absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer transition-opacity ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
              >
                <div className="w-12 h-12 rounded-full bg-action-red/90 flex items-center justify-center text-white subtle-glow hover:scale-110 transition-transform">
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </div>
              </button>

              {/* Timecode overlay */}
              <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-mono text-white flex items-center gap-1.5 border border-white/10">
                <Clock className="w-3 h-3 text-action-red" />
                <span>{formatSeconds(currentTime)} / {formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Trimming Dual Slider Controls */}
            <div className="w-full bg-neutral-900 border border-gray-800 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">
                  Cut Range: <strong className="text-white">{formatSeconds(startTime)}</strong> to <strong className="text-white">{formatSeconds(endTime)}</strong>
                </span>
                <span className="text-action-red font-bold">
                  Duration: {formatSeconds(endTime - startTime)}
                </span>
              </div>

              {/* Start Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                  <span>Start: {formatSeconds(startTime)}</span>
                  <button
                    onClick={() => {
                      setStartTime(currentTime);
                      if (currentTime >= endTime) setEndTime(Math.min(duration, currentTime + 5));
                    }}
                    className="text-[10px] text-action-red hover:underline cursor-pointer"
                  >
                    Set to Current ({formatSeconds(currentTime)})
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, endTime - 1)}
                  value={startTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStartTime(val);
                    seekTo(val);
                  }}
                  className="w-full accent-action-red cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                />
              </div>

              {/* End Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                  <span>End: {formatSeconds(endTime)}</span>
                  <button
                    onClick={() => {
                      if (currentTime > startTime) setEndTime(currentTime);
                    }}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Set to Current ({formatSeconds(currentTime)})
                  </button>
                </div>
                <input
                  type="range"
                  min={startTime + 1}
                  max={duration}
                  value={endTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEndTime(val);
                    seekTo(val);
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                />
              </div>

              {/* Step Adjustment Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 text-[10px] font-mono">
                <div className="flex items-center space-x-1">
                  <button onClick={() => setStartTime(Math.max(0, startTime - 1))} className="px-2 py-0.5 rounded bg-black/60 hover:bg-white/10 text-gray-300">Start -1s</button>
                  <button onClick={() => setStartTime(Math.min(endTime - 1, startTime + 1))} className="px-2 py-0.5 rounded bg-black/60 hover:bg-white/10 text-gray-300">Start +1s</button>
                </div>

                <div className="flex items-center space-x-1">
                  <button onClick={() => setEndTime(Math.max(startTime + 1, endTime - 1))} className="px-2 py-0.5 rounded bg-black/60 hover:bg-white/10 text-gray-300">End -1s</button>
                  <button onClick={() => setEndTime(Math.min(duration, endTime + 1))} className="px-2 py-0.5 rounded bg-black/60 hover:bg-white/10 text-gray-300">End +1s</button>
                </div>
              </div>

              {/* Audio Extraction Converter Checkbox */}
              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs font-mono text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={convertToAudio}
                    onChange={(e) => setConvertToAudio(e.target.checked)}
                    className="accent-action-red rounded"
                  />
                  <span>Extract & Convert to Audio (.m4a / Ringtone)</span>
                </label>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-neutral-dark border-t border-gray-800 flex items-center justify-between shrink-0">
            <div className="text-[11px] font-mono text-gray-400 truncate mr-2">
              Output: <strong className="text-white">{activeItem.title}.{convertToAudio ? 'm4a' : 'mp4'}</strong>
            </div>

            <button
              onClick={handleExportTrim}
              disabled={isProcessing || isDone}
              className="px-5 py-2 rounded-xl bg-action-red hover:bg-action-hover text-xs font-mono font-bold text-white shadow-md shadow-action-red/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isDone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved to Vault!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Export & Save</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
