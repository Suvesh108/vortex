import { motion, AnimatePresence } from 'motion/react';
import { History, Download, Trash2, Globe, ExternalLink, Calendar } from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface HistoryListProps {
  history: DownloadHistoryItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onReDownload: (item: DownloadHistoryItem) => void;
}

export default function HistoryList({ history, onRemoveItem, onClearAll, onReDownload }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="bg-surface-card border border-gray-800 rounded-lg p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-secondary-grey/40 flex items-center justify-center mx-auto text-gray-500">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#e5e2e1]">No Local Downloads Archived</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Once you extract a media endpoint and select high quality bitrates, successful outputs will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top action header info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-action-red" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Archived Library Logs ({history.length})</h3>
        </div>
        <button
          onClick={onClearAll}
          className="text-[11px] font-mono font-bold text-gray-500 hover:text-red-400 transition-colors uppercase border border-gray-800 hover:border-red-900/40 px-2 py-1 rounded bg-secondary-grey/10"
        >
          CLEAR ARCHIVE
        </button>
      </div>

      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {history.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-card border border-gray-800 hover:border-gray-800 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-colors duration-200 hover:bg-[#201f1f]"
            >
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                {/* Thumbnail Image */}
                <div className="w-20 h-12 rounded overflow-hidden relative bg-black border border-gray-800 shrink-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-action-red font-bold">
                    {item.format}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-tertiary-blue" />
                      {item.resolution}
                    </span>
                    <span>•</span>
                    <span className="text-gray-400 font-bold">{item.size}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5" title="Downloaded date">
                      <Calendar className="w-3 h-3 text-action-red" />
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <a
                  href={item.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                  title="Visit original video flow"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => onReDownload(item)}
                  className="p-1.5 rounded bg-action-red/10 border border-action-red/20 text-action-red hover:bg-action-red hover:text-white transition-all duration-200 flex items-center space-x-1.5 text-xs font-bold"
                  title="Re-save to computer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px] uppercase font-mono">RE-SAVE</span>
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 rounded hover:bg-red-950/20 text-gray-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/40"
                  title="Remove from history log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
