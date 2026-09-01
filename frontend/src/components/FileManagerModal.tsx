import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FolderOpen,
  Search,
  Trash2,
  Share2,
  CheckSquare,
  Square,
  ArrowUpDown,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  FileArchive,
  BookOpen,
  Presentation
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DownloadHistoryItem[];
  onDeleteItems: (ids: string[]) => void;
  onPlayItem: (item: DownloadHistoryItem) => void;
}

export default function FileManagerModal({
  isOpen,
  onClose,
  items,
  onDeleteItems,
  onPlayItem
}: FileManagerModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'All Files' },
    { id: 'VIDEO', label: 'Videos' },
    { id: 'AUDIO', label: 'Audio' },
    { id: 'PHOTO', label: 'Photos' },
    { id: 'DOCUMENT', label: 'Documents' },
    { id: 'ZIP', label: 'Archives' },
    { id: 'SPREADSHEET', label: 'Sheets' }
  ];

  // Filtering
  const filtered = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || (item.category || 'VIDEO').toUpperCase() === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'size') return (parseFloat(b.size) || 0) - (parseFloat(a.size) || 0);
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === sorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sorted.map(i => i.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Permanently delete ${selectedIds.length} selected files from internal storage?`)) {
      onDeleteItems(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBatchShare = () => {
    if (selectedIds.length === 0) return;
    const selectedTitles = items
      .filter(i => selectedIds.includes(i.id))
      .map(i => i.title)
      .join('\n• ');
    alert(`Exporting ${selectedIds.length} items to device share queue:\n• ${selectedTitles}`);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toUpperCase()) {
      case 'AUDIO': return <FileAudio className="w-4 h-4 text-amber-400" />;
      case 'PHOTO': return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'DOCUMENT': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'SPREADSHEET': return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'PRESENTATION': return <Presentation className="w-4 h-4 text-orange-400" />;
      case 'EBOOK': return <BookOpen className="w-4 h-4 text-pink-400" />;
      case 'ZIP': return <FileArchive className="w-4 h-4 text-yellow-400" />;
      default: return <FileVideo className="w-4 h-4 text-action-red" />;
    }
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
          className="relative w-full max-w-4xl max-h-[92vh] bg-surface-card border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800 bg-neutral-dark/95 shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-action-red/20 border border-action-red/30 flex items-center justify-center text-action-red shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <h3 className="font-hanken font-bold text-sm sm:text-base text-white truncate">
                In-App File & Storage Manager
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-secondary-grey/40 text-gray-400 text-xs font-mono">
                {items.length} items
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls Bar: Search & Sort */}
          <div className="p-3 sm:p-4 bg-neutral-900/60 border-b border-gray-800 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/80 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-action-red"
              />
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-black/80 border border-gray-800 rounded-xl px-2.5 py-1 text-xs font-mono text-gray-300">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  <option value="date" className="bg-neutral-900">Date Added</option>
                  <option value="size" className="bg-neutral-900">File Size</option>
                  <option value="name" className="bg-neutral-900">File Name</option>
                </select>
              </div>

              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-xl bg-secondary-grey/40 hover:bg-secondary-grey text-xs font-mono text-gray-300 hover:text-white border border-gray-800 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {selectedIds.length === sorted.length && sorted.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-action-red" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>{selectedIds.length === sorted.length && sorted.length > 0 ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 sm:px-4 py-2 border-b border-gray-800/80 bg-neutral-dark flex items-center space-x-1 overflow-x-auto shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono shrink-0 transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-action-red text-white font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-secondary-grey/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* File Grid / List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {sorted.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-500 font-mono text-xs space-y-2">
                <FolderOpen className="w-8 h-8 stroke-1 text-gray-600" />
                <span>No files matched your filter criteria.</span>
              </div>
            ) : (
              sorted.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-action-red/10 border-action-red/50 shadow-sm shadow-action-red/10'
                        : 'bg-neutral-900/60 border-gray-800/80 hover:bg-neutral-900'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="text-gray-400 hover:text-white cursor-pointer shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-action-red" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    {/* Thumbnail & Title */}
                    <div 
                      onClick={() => onPlayItem(item)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative w-12 h-12 rounded-lg bg-black overflow-hidden border border-gray-800 shrink-0 flex items-center justify-center">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          {getCategoryIcon(item.category)}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-hanken font-bold text-xs sm:text-sm text-white truncate hover:text-action-red transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-secondary-grey/60 text-gray-300">
                            .{item.targetExtension || 'mp4'}
                          </span>
                          <span>{item.size}</span>
                          <span>•</span>
                          <span className="truncate">{item.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Play Button */}
                    <button
                      onClick={() => onPlayItem(item)}
                      className="px-2.5 py-1 rounded-lg bg-secondary-grey/40 hover:bg-action-red text-gray-300 hover:text-white border border-gray-800 text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
                    >
                      Open
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Batch Actions Footer */}
          {selectedIds.length > 0 && (
            <div className="p-3 sm:px-6 bg-neutral-dark border-t border-gray-800 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono text-gray-300">
                <strong className="text-action-red">{selectedIds.length}</strong> files selected
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBatchShare}
                  className="px-3 py-1.5 rounded-xl bg-secondary-grey/40 hover:bg-secondary-grey text-xs font-mono font-bold text-white border border-gray-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1.5 rounded-xl bg-action-red hover:bg-action-hover text-xs font-mono font-bold text-white shadow-md shadow-action-red/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
