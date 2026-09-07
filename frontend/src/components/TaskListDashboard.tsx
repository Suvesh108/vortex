import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Inbox, 
  Check, 
  Play, 
  Pause, 
  ExternalLink, 
  Folder, 
  X, 
  Scissors, 
  FileAudio, 
  FileArchive, 
  File, 
  Calendar, 
  Maximize2, 
  Gauge, 
  LayoutGrid, 
  List, 
  Tag, 
  ChevronDown,
  HardDrive,
  Sparkles
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';

export type TaskFilter = 'all' | 'downloading' | 'completed';

interface TaskListDashboardProps {
  items: DownloadHistoryItem[];
  currentDownloading?: {
    title: string;
    progress: number;
    speed: string;
    eta: string;
    targetExtension?: string;
  } | null;
  searchQuery: string;
  onPlayItem: (item: DownloadHistoryItem) => void;
  onTrimItem: (item: DownloadHistoryItem) => void;
  onRemoveItem: (id: string) => void;
  onOpenStorage: (item: DownloadHistoryItem) => void;
  onStartAll?: () => void;
  onPauseAll?: () => void;
  onOpenNewTask?: () => void;
  globalSpeed?: string;
}

export default function TaskListDashboard({
  items,
  currentDownloading,
  searchQuery,
  onPlayItem,
  onTrimItem,
  onRemoveItem,
  onOpenStorage,
  onStartAll,
  onPauseAll,
  onOpenNewTask,
  globalSpeed = '0.00 B/s'
}: TaskListDashboardProps) {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const springQuick = { type: 'spring' as const, stiffness: 450, damping: 25 };

  // Filter items by tab and search
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.originalUrl.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'completed') return true;
    if (filter === 'downloading') return false;
    return true;
  });

  // VLC Cone / File Icon Helper
  const renderFileIcon = (ext?: string) => {
    const cleanExt = (ext || 'mp4').toLowerCase().replace('.', '');
    if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(cleanExt)) {
      return (
        <motion.div 
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={springQuick}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-md shadow-orange-500/10"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L6 18H18L12 2Z" fill="#ff7900" opacity="0.9"/>
            <rect x="5" y="19" width="14" height="2.5" rx="1" fill="#f97316"/>
            <path d="M8.5 11.5H15.5L14.5 9H9.5L8.5 11.5Z" fill="#ffffff"/>
            <path d="M7 16H17L16 13.5H8L7 16Z" fill="#ffffff"/>
          </svg>
        </motion.div>
      );
    }
    if (['m4a', 'mp3', 'wav', 'flac', 'aac'].includes(cleanExt)) {
      return (
        <motion.div 
          whileHover={{ scale: 1.15, rotate: -5 }}
          transition={springQuick}
          className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-md"
        >
          <FileAudio className="w-5 h-5" />
        </motion.div>
      );
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(cleanExt)) {
      return (
        <motion.div 
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={springQuick}
          className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-md"
        >
          <FileArchive className="w-5 h-5" />
        </motion.div>
      );
    }
    return (
      <motion.div 
        whileHover={{ scale: 1.15, rotate: -5 }}
        transition={springQuick}
        className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-md"
      >
        <File className="w-5 h-5" />
      </motion.div>
    );
  };

  return (
    <div className="space-y-3 w-full">
      {/* Exact Toolbar with Spring Micro-Interactions & Mobile Responsiveness */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 px-0.5 select-none text-xs">
        {/* Left Toolbar Group with Horizontal Scrolling on Mobile */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-0.5 w-full sm:w-auto shrink-0">
          {/* Segmented Filter Pills */}
          <div className="flex items-center bg-[#202022] border border-white/[0.06] rounded-xl p-0.5 space-x-0.5 relative shrink-0">
            {/* Home / All Tab */}
            <motion.button
              whileTap={{ scale: 0.90 }}
              onClick={() => setFilter('all')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer relative z-10 ${
                filter === 'all'
                  ? 'text-black font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
              title="All Tasks"
            >
              {filter === 'all' && (
                <motion.div
                  layoutId="activeFilterBg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute inset-0 bg-[#4cc2ff] rounded-lg shadow-md shadow-[#4cc2ff]/30 z-[-1]"
                />
              )}
              <Home className="w-4 h-4 fill-current" />
            </motion.button>

            {/* Downloading Tab */}
            <motion.button
              whileTap={{ scale: 0.90 }}
              onClick={() => setFilter('downloading')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer relative z-10 ${
                filter === 'downloading'
                  ? 'text-black font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
              title="Downloading"
            >
              {filter === 'downloading' && (
                <motion.div
                  layoutId="activeFilterBg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute inset-0 bg-[#4cc2ff] rounded-lg shadow-md shadow-[#4cc2ff]/30 z-[-1]"
                />
              )}
              <Inbox className="w-4 h-4" />
            </motion.button>

            {/* Completed Tab */}
            <motion.button
              whileTap={{ scale: 0.90 }}
              onClick={() => setFilter('completed')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer relative z-10 ${
                filter === 'completed'
                  ? 'text-black font-bold'
                  : 'text-gray-300 hover:text-white'
              }`}
              title="Completed"
            >
              {filter === 'completed' && (
                <motion.div
                  layoutId="activeFilterBg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute inset-0 bg-[#4cc2ff] rounded-lg shadow-md shadow-[#4cc2ff]/30 z-[-1]"
                />
              )}
              <Check className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Start All Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={springQuick}
            onClick={onStartAll}
            className="h-8 px-2.5 sm:px-3 rounded-lg bg-[#2f2f33] hover:bg-[#38383e] border border-white/[0.06] text-xs font-sans text-gray-200 hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer shadow-md shrink-0"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-current shrink-0" />
            <span className="whitespace-nowrap">Start All</span>
          </motion.button>

          {/* Pause All Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={springQuick}
            onClick={onPauseAll}
            className="h-8 px-2.5 sm:px-3 rounded-lg bg-[#2f2f33] hover:bg-[#38383e] border border-white/[0.06] text-xs font-sans text-gray-200 hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer shadow-md shrink-0"
          >
            <Pause className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">Pause All</span>
          </motion.button>

          {/* Auxiliary Square Buttons */}
          <motion.button
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.90 }}
            transition={springQuick}
            className="w-8 h-8 rounded-lg bg-[#2f2f33] hover:bg-[#38383e] border border-white/[0.06] flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer shadow-md shrink-0"
            title="Selection Focus"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.90 }}
            transition={springQuick}
            className="w-8 h-8 rounded-lg bg-[#2f2f33] hover:bg-[#38383e] border border-white/[0.06] flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer shadow-md shrink-0"
            title="Schedule"
          >
            <Calendar className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.90 }}
            transition={springQuick}
            className="w-8 h-8 rounded-lg bg-[#2f2f33] hover:bg-[#38383e] border border-white/[0.06] flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer shadow-md shrink-0"
            title="Speed Limit"
          >
            <Gauge className="w-3.5 h-3.5" />
          </motion.button>

          {/* Speed Indicator */}
          <motion.div 
            animate={{ scale: globalSpeed !== '0.00 B/s' ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center space-x-1.5 text-xs font-sans text-gray-300 pl-1 shrink-0 whitespace-nowrap"
          >
            <Gauge className="w-3.5 h-3.5 text-[#4cc2ff] shrink-0" />
            <span className="font-mono text-[#4cc2ff] font-bold">{globalSpeed}</span>
          </motion.div>
        </div>

        {/* Right Toolbar Group */}
        <div className="flex items-center justify-end space-x-1.5 shrink-0 self-end sm:self-auto">
          {/* View Mode Dropdown Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={springQuick}
            onClick={() => setViewMode(prev => prev === 'list' ? 'card' : 'list')}
            className="h-8 px-2 rounded-lg bg-[#2f2f33] hover:bg-[#38383e] border border-white/[0.06] text-gray-300 hover:text-white transition-colors flex items-center space-x-1 cursor-pointer shadow-md"
            title="View Mode"
          >
            {viewMode === 'list' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </motion.button>

          {/* Tags Dropdown Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={springQuick}
            className="h-8 px-2 rounded-lg bg-[#2f2f33] hover:bg-[#38383e] border border-white/[0.06] text-gray-300 hover:text-white transition-colors flex items-center space-x-1 cursor-pointer shadow-md"
            title="Filter Tags"
          >
            <Tag className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* ACTIVE DOWNLOADING TASK ROW */}
      <AnimatePresence>
        {currentDownloading && (filter === 'all' || filter === 'downloading') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#1c1c20] to-[#25252b] border border-[#4cc2ff]/50 space-y-3 shadow-2xl shadow-[#4cc2ff]/10 relative overflow-hidden"
          >
            {/* Pulsing ambient background glow */}
            <div className="absolute -right-10 -top-10 w-36 h-36 bg-[#4cc2ff]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center space-x-3 min-w-0">
                {renderFileIcon(currentDownloading.targetExtension || 'mp4')}
                <div className="min-w-0">
                  <h4 className="font-hanken font-bold text-xs sm:text-sm text-white truncate flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4cc2ff] shadow-sm shadow-[#4cc2ff] animate-pulse" />
                    {currentDownloading.title}
                  </h4>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5 flex items-center gap-2">
                    <span className="text-[#4cc2ff] font-bold">{currentDownloading.speed}</span>
                    <span>•</span>
                    <span>ETA {currentDownloading.eta}</span>
                    <span>•</span>
                    <span className="text-white font-bold">{currentDownloading.progress}%</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.90 }}
                  className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-gray-200 hover:text-white transition-colors cursor-pointer shadow-md"
                  title="Pause"
                >
                  <Pause className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Progress bar with glowing fluid head */}
            <div className="w-full bg-black/70 rounded-full h-2 overflow-hidden relative shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 via-[#4cc2ff] to-cyan-300 rounded-full relative"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(3, currentDownloading.progress)}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/60 blur-[1px] rounded-full" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TASK LIST ROWS */}
      <div className="space-y-1.5">
        {filteredItems.length === 0 && !currentDownloading ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-14 sm:py-20 text-center space-y-3.5 select-none px-4"
          >
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-gray-500 mx-auto shadow-xl"
            >
              <Inbox className="w-7 h-7 text-gray-400" />
            </motion.div>
            <h4 className="text-sm font-semibold text-gray-200">No tasks currently</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Tap &quot;New Task&quot; or the <span className="text-[#3ea6ff] font-semibold">+</span> button to add downloads.
            </p>
            {onOpenNewTask && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenNewTask}
                className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#3ea6ff] to-sky-400 text-black font-semibold text-xs shadow-lg shadow-[#3ea6ff]/20 cursor-pointer"
              >
                <span>+ New Task</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 25,
                  delay: Math.min(index * 0.03, 0.3) 
                }}
                whileHover={{ scale: 1.008, y: -1 }}
                className="p-2.5 sm:p-3 rounded-xl bg-[#2b2b2e] hover:bg-[#343438] border border-white/[0.05] hover:border-[#4cc2ff]/30 hover:shadow-lg hover:shadow-black/40 transition-all flex items-center justify-between gap-2.5 sm:gap-3 group select-none"
              >
                {/* Left: Icon & 2-Line Metadata */}
                <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
                  {renderFileIcon(item.targetExtension || item.format)}

                  <div className="min-w-0 flex-1">
                    {/* Line 1: Title */}
                    <h4 className="font-hanken font-medium text-xs sm:text-[13px] text-gray-200 group-hover:text-white truncate transition-colors">
                      {item.title}
                    </h4>

                    {/* Line 2: Size + Completed at Timestamp */}
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-[10px] sm:text-[11px] font-sans text-gray-400 mt-0.5 truncate">
                      <span className="flex items-center gap-1 text-gray-400 shrink-0">
                        <HardDrive className="w-3 h-3 shrink-0" />
                        {item.size || '183.33 MB'}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400/90 font-mono truncate">Completed {item.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Icons with Bouncy Hover */}
                <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                  {/* Play Button */}
                  <motion.button
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.85 }}
                    transition={springQuick}
                    onClick={() => onPlayItem(item)}
                    className="p-1.5 sm:p-2 rounded-lg bg-[#3d3d42] hover:bg-[#4cc2ff] text-gray-300 hover:text-black transition-colors cursor-pointer shadow-sm"
                    title="Play"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </motion.button>

                  {/* Trim Studio Button - hidden on small mobile, visible on sm+ */}
                  <motion.button
                    whileHover={{ scale: 1.2, rotate: -8 }}
                    whileTap={{ scale: 0.85 }}
                    transition={springQuick}
                    onClick={() => onTrimItem(item)}
                    className="hidden sm:inline-flex p-2 rounded-lg bg-[#3d3d42] hover:bg-[#ff7900] text-gray-300 hover:text-black transition-colors cursor-pointer shadow-sm"
                    title="Trim in Studio"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                  </motion.button>

                  {/* Open URL Button - hidden on small mobile, visible on sm+ */}
                  <motion.a
                    whileHover={{ scale: 1.2, rotate: 8 }}
                    whileTap={{ scale: 0.85 }}
                    transition={springQuick}
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex p-2 rounded-lg bg-[#3d3d42] hover:bg-white text-gray-300 hover:text-black transition-colors cursor-pointer shadow-sm"
                    title="Open Source Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </motion.a>

                  {/* Reveal in Storage Folder Button */}
                  <motion.button
                    whileHover={{ scale: 1.2, rotate: -5 }}
                    whileTap={{ scale: 0.85 }}
                    transition={springQuick}
                    onClick={() => onOpenStorage(item)}
                    className="p-1.5 sm:p-2 rounded-lg bg-[#3d3d42] hover:bg-amber-400 text-gray-300 hover:text-black transition-colors cursor-pointer shadow-sm"
                    title="Show in File Manager"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </motion.button>

                  {/* Delete Task Button */}
                  <motion.button
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.85 }}
                    transition={springQuick}
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 sm:p-2 rounded-lg bg-[#3d3d42] hover:bg-red-500 text-gray-300 hover:text-white transition-colors cursor-pointer shadow-sm"
                    title="Remove from List"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
