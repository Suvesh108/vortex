import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Download, 
  Trash2, 
  Globe, 
  ExternalLink, 
  Calendar, 
  Copy, 
  Check, 
  RefreshCw, 
  Database,
  CheckCircle2,
  Play,
  Eye
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface HistoryListProps {
  history: DownloadHistoryItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onReDownload: (item: DownloadHistoryItem) => void;
  onLoadUrl?: (url: string) => void;
  onPlayItem?: (item: DownloadHistoryItem) => void;
}

export default function HistoryList({ 
  history, 
  onRemoveItem, 
  onClearAll, 
  onReDownload, 
  onLoadUrl,
  onPlayItem 
}: HistoryListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleCopyLink = (item: DownloadHistoryItem) => {
    navigator.clipboard.writeText(item.originalUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (history.length === 0) {
    return (
      <div className="bg-surface-card border border-gray-800 rounded-xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-secondary-grey/40 flex items-center justify-center mx-auto text-gray-500">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#e5e2e1]">No Local Downloads Archived</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Once you extract a media endpoint and download streams, all links and files are logged here and can be played directly inside the app.
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
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 font-mono">
            Archived Media Vault ({history.length} {history.length === 1 ? 'Item' : 'Items'})
          </h3>
        </div>
        
        {showConfirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-red-400 font-medium">Clear all?</span>
            <button
              onClick={() => {
                onClearAll();
                setShowConfirmClear(false);
              }}
              className="text-[10px] font-mono font-bold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              YES, CLEAR
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="text-[10px] font-mono text-gray-400 hover:text-white px-2 py-1 rounded bg-secondary-grey/40 cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="text-[11px] font-mono font-bold text-gray-400 hover:text-red-400 transition-colors uppercase border border-gray-800 hover:border-red-900/40 px-2.5 py-1 rounded bg-secondary-grey/20 cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
            CLEAR ALL
          </button>
        )}
      </div>

      {/* History Items Scroll list */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {history.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-card border border-gray-800 hover:border-gray-700 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all duration-200 hover:bg-[#1a1b22]"
            >
              <div className="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1">
                {/* Thumbnail Image with Play overlay */}
                <div 
                  onClick={() => onPlayItem && onPlayItem(item)}
                  className="w-20 h-14 rounded-lg overflow-hidden relative bg-black border border-gray-800 shrink-0 cursor-pointer group/thumb"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 flex items-center justify-center transition-colors">
                    <div className="w-6 h-6 rounded-full bg-action-red/90 flex items-center justify-center text-white subtle-glow group-hover/thumb:scale-110 transition-transform">
                      <Play className="w-3 h-3 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-1 left-1 bg-black/85 px-1.5 py-0.2 rounded text-[8px] font-mono text-action-red font-bold uppercase">
                    {item.category || item.format}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 
                      onClick={() => onPlayItem && onPlayItem(item)}
                      className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors cursor-pointer"
                    >
                      {item.title}
                    </h4>
                    {item.targetExtension && (
                      <span className="text-[9px] font-mono px-1 rounded bg-secondary-grey/60 text-gray-400">
                        .{item.targetExtension}
                      </span>
                    )}
                  </div>

                  {/* URL snippet */}
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                    <span className="truncate max-w-[220px] sm:max-w-xs text-gray-500">
                      {item.originalUrl}
                    </span>
                    <button
                      onClick={() => handleCopyLink(item)}
                      className="p-0.5 hover:text-white transition-colors cursor-pointer text-gray-500"
                      title="Copy original link"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-400 inline" />
                      ) : (
                        <Copy className="w-3 h-3 inline" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500 font-mono pt-0.5">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-tertiary-blue" />
                      {item.resolution}
                    </span>
                    <span>•</span>
                    <span className="text-gray-300 font-bold">{item.size}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-400" title="Extracted / Saved Timestamp">
                      <Calendar className="w-3 h-3 text-action-red" />
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/60 w-full sm:w-auto justify-end">
                {/* IN-APP DIRECT VIEWER / PLAYER BUTTON */}
                {onPlayItem && (
                  <button
                    onClick={() => onPlayItem(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all flex items-center space-x-1 text-xs font-bold font-mono cursor-pointer"
                    title="Play or view directly in app"
                  >
                    <Play className="w-3 h-3 fill-emerald-400" />
                    <span className="text-[10px] uppercase font-mono">PLAY / VIEW</span>
                  </button>
                )}

                {onLoadUrl && (
                  <button
                    onClick={() => onLoadUrl(item.originalUrl)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-action-red transition-colors flex items-center gap-1 text-xs cursor-pointer"
                    title="Load link in extraction bar"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">LOAD</span>
                  </button>
                )}
                
                <button
                  onClick={() => onReDownload(item)}
                  className="px-2 py-1 rounded-lg bg-action-red/10 border border-action-red/30 text-action-red hover:bg-action-red hover:text-white transition-all flex items-center space-x-1 text-xs font-bold cursor-pointer"
                  title="Re-download to device"
                >
                  <Download className="w-3 h-3" />
                  <span className="text-[10px] uppercase font-mono">RE-SAVE</span>
                </button>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-950/30 text-gray-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/40 cursor-pointer"
                  title="Remove this link from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* End of Vault Summary & Options */}
      <div className="pt-3 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 font-sans bg-surface-card/40 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-action-red shrink-0" />
          <span>
            Showing all <strong>{history.length}</strong> archived items stored locally.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            In-App Player Ready
          </span>
          <button
            onClick={onClearAll}
            className="text-[11px] font-mono text-gray-400 hover:text-red-400 border border-gray-800 hover:border-red-800/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
