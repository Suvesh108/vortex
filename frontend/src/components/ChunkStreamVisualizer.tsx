import React from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, Clock, Layers, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { ChunkDownloadProgress } from '../types';

interface ChunkStreamVisualizerProps {
  progress: ChunkDownloadProgress;
  fileName: string;
}

export default function ChunkStreamVisualizer({ progress, fileName }: ChunkStreamVisualizerProps) {
  const formatSize = (bytes: number) => {
    if (bytes <= 0) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="bg-[#18181b]/95 border border-[#3ea6ff]/40 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xl shadow-[#3ea6ff]/10 backdrop-blur-2xl relative overflow-hidden"
    >
      {/* Dynamic scanning neon beam across top edge */}
      <motion.div 
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="absolute top-0 left-0 right-0 h-[2.5px] w-1/3 bg-gradient-to-r from-transparent via-[#3ea6ff] to-transparent shadow-lg shadow-[#3ea6ff]"
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center space-x-3 min-w-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-xl bg-[#3ea6ff]/15 border border-[#3ea6ff]/40 flex items-center justify-center text-[#3ea6ff] shrink-0 shadow-md shadow-[#3ea6ff]/20"
          >
            <Activity className="w-4 h-4" />
          </motion.div>
          <div className="min-w-0">
            <h4 className="font-hanken font-bold text-sm text-white truncate flex items-center gap-2">
              <span>{fileName}</span>
              <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-[#3ea6ff]/20 text-[#3ea6ff] border border-[#3ea6ff]/30 tracking-wider">
                TURBO IDM CORE
              </span>
            </h4>
            <p className="text-[10px] font-mono text-gray-400 flex items-center gap-2 mt-0.5">
              <span>{formatSize(progress.downloadedBytes)} / {formatSize(progress.totalBytes)}</span>
              <span>•</span>
              <span className="text-[#3ea6ff] flex items-center gap-1 font-bold">
                <Layers className="w-3 h-3" />
                {progress.chunks.length} Parallel Work-Stealing Pipes
              </span>
            </p>
          </div>
        </div>

        {/* Telemetry Pills with bouncy hover */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.div 
            whileHover={{ scale: 1.05, y: -1 }}
            className="bg-[#242428] border border-white/[0.08] px-3 py-1 rounded-xl text-right shadow-sm"
          >
            <div className="text-[9px] font-mono text-gray-500 uppercase font-semibold">Speed</div>
            <div className="text-xs font-mono font-extrabold text-[#3ea6ff] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#3ea6ff] animate-bounce" />
              {progress.speed}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -1 }}
            className="bg-[#242428] border border-white/[0.08] px-3 py-1 rounded-xl text-right shadow-sm"
          >
            <div className="text-[9px] font-mono text-gray-500 uppercase font-semibold">ETA</div>
            <div className="text-xs font-mono font-extrabold text-white flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              {progress.eta}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -1 }}
            className="bg-[#3ea6ff]/15 border border-[#3ea6ff]/40 px-3.5 py-1 rounded-xl text-right shadow-md shadow-[#3ea6ff]/20"
          >
            <div className="text-[9px] font-mono text-[#3ea6ff] uppercase font-bold">Total</div>
            <div className="text-sm font-mono font-extrabold text-white">
              {progress.percent}%
            </div>
          </motion.div>
        </div>
      </div>

      {/* Aggregate Global Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-black/80 border border-white/[0.08] rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-500 via-[#3ea6ff] to-emerald-400 rounded-full relative"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(2, progress.percent)}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="absolute inset-0 bg-white/25 animate-pulse" />
          </motion.div>
        </div>
      </div>

      {/* Segmented Thread / Chunk Matrix */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span className="uppercase tracking-wider font-bold flex items-center gap-1.5 text-gray-300">
            <Cpu className="w-3 h-3 text-[#3ea6ff]" />
            Dynamic Work-Stealing Multi-Pipe Grid
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Async Ring Buffer (16MB Disk Cache)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {progress.chunks.map((chunk, idx) => {
            const isFinished = chunk.percent >= 100;
            return (
              <motion.div
                key={chunk.index}
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.02, type: 'spring', stiffness: 400 }}
                whileHover={{ scale: 1.04, y: -1 }}
                className={`p-2.5 rounded-xl border transition-all cursor-default select-none ${
                  isFinished
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-950/40'
                    : 'bg-[#202024] border-white/[0.08] hover:border-[#3ea6ff]/40 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isFinished ? 'bg-emerald-400' : 'bg-[#3ea6ff] animate-ping'}`} />
                    Pipe #{chunk.index + 1}
                  </span>
                  <span className="font-bold">{chunk.percent}%</span>
                </div>
                <div className="w-full bg-black/80 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isFinished
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-r from-[#3ea6ff] to-sky-300'
                    }`}
                    animate={{ width: `${chunk.percent}%` }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
