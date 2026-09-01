import { useState, useRef, useEffect, ChangeEvent } from 'react';
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
  Sparkles
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface MediaTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DownloadHistoryItem | null;
  onSaveTrimmed: (trimmedItem: DownloadHistoryItem) => void;
}

export default function MediaTrimmerModal({
  isOpen,
  onClose,
  item,
  onSaveTrimmed
}: MediaTrimmerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(180); // seconds
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60);
  const [currentTime, setCurrentTime] = useState(0);
  const [convertToAudio, setConvertToAudio] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item) {
      setStartTime(0);
      setEndTime(60);
      setCurrentTime(0);
      setIsDone(false);
      setIsProcessing(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      const d = Math.floor(videoRef.current.duration);
      setDuration(d);
      setEndTime(Math.min(d, 60));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      setCurrentTime(curr);
      if (curr >= endTime) {
        videoRef.current.pause();
        videoRef.current.currentTime = startTime;
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleExportTrim = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);

      const targetExt = convertToAudio ? 'm4a' : (item.targetExtension || 'mp4');
      const trimmedItem: DownloadHistoryItem = {
        ...item,
        id: Math.random().toString(36).substring(2, 9),
        title: `${item.title} (Trimmed ${formatSeconds(startTime)}-${formatSeconds(endTime)})`,
        category: convertToAudio ? 'AUDIO' : item.category,
        targetExtension: targetExt,
        format: convertToAudio ? 'M4A' : item.format,
        size: 'Estimated ' + (Math.round((endTime - startTime) * 0.25) + 1) + ' MB',
        timestamp: new Date().toLocaleString()
      };

      onSaveTrimmed(trimmedItem);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 1500);
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
              <h3 className="font-hanken font-bold text-sm sm:text-base text-white truncate">
                In-App Media Trimmer & Converter Studio
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 flex flex-col items-center justify-center">
            {/* Video / Audio Preview */}
            <div className="relative w-full aspect-video max-h-[40vh] bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center group shadow-2xl">
              <video
                ref={videoRef}
                src={item.originalUrl}
                poster={item.thumbnail}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                playsInline
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {!isPlaying && (
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-action-red/90 flex items-center justify-center text-white subtle-glow hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              )}

              {/* Timecode overlay */}
              <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white flex items-center gap-1">
                <Clock className="w-3 h-3 text-action-red" />
                <span>{formatSeconds(currentTime)} / {formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Trimming Dual Slider Controls */}
            <div className="w-full bg-neutral-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">
                  Trim Region: <strong className="text-white">{formatSeconds(startTime)}</strong> to <strong className="text-white">{formatSeconds(endTime)}</strong>
                </span>
                <span className="text-action-red font-bold">
                  Duration: {formatSeconds(endTime - startTime)}
                </span>
              </div>

              {/* Start Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                  <span>Start Cut: {formatSeconds(startTime)}</span>
                  <span>{Math.round((startTime / duration) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, endTime - 1)}
                  value={startTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStartTime(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="w-full accent-action-red cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                />
              </div>

              {/* End Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-gray-400">
                  <span>End Cut: {formatSeconds(endTime)}</span>
                  <span>{Math.round((endTime / duration) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={startTime + 1}
                  max={duration}
                  value={endTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEndTime(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                />
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
                  <span>Extract & Convert to Audio Track (.m4a / Ringtone)</span>
                </label>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-neutral-dark border-t border-gray-800 flex items-center justify-between shrink-0">
            <div className="text-[11px] font-mono text-gray-400 truncate mr-2">
              Output: <strong className="text-white">{item.title}.{convertToAudio ? 'm4a' : 'mp4'}</strong>
            </div>

            <button
              onClick={handleExportTrim}
              disabled={isProcessing || isDone}
              className="px-4 py-2 rounded-xl bg-action-red hover:bg-action-hover text-xs font-mono font-bold text-white shadow-md shadow-action-red/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isDone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
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
