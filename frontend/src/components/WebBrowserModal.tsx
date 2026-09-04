import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  Search,
  Download,
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { sanitizeMediaUrl } from '../hosts';

interface WebBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadUrl: (url: string) => void;
}

export default function WebBrowserModal({
  isOpen,
  onClose,
  onDownloadUrl
}: WebBrowserModalProps) {
  const [query, setQuery] = useState('');
  const [searchEngine, setSearchEngine] = useState<'google' | 'duckduckgo' | 'bing'>('google');

  if (!isOpen) return null;

  const constructTargetUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) {
      return searchEngine === 'google' 
        ? 'https://www.google.com' 
        : searchEngine === 'duckduckgo' 
          ? 'https://duckduckgo.com' 
          : 'https://www.bing.com';
    }

    // Check if input is an existing URL format
    if (/^https?:\/\//i.test(trimmed) || /^[\w-]+\.[\w.-]+(\/.*)?$/i.test(trimmed)) {
      return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }

    // Otherwise query selected search engine
    if (searchEngine === 'duckduckgo') {
      return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
    } else if (searchEngine === 'bing') {
      return `https://www.bing.com/search?q=${encodeURIComponent(trimmed)}`;
    } else {
      return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }
  };

  const handleOpenInBrowser = async () => {
    const targetUrl = constructTargetUrl(query);

    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: targetUrl,
          windowName: '_blank',
          toolbarColor: '#0c0c0e',
          presentationStyle: 'fullscreen'
        });
      } else {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(targetUrl, '_blank');
    }
  };

  const handleIngestToDownloader = () => {
    const targetUrl = constructTargetUrl(query);
    onDownloadUrl(targetUrl);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-lg"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-[#0c0c0e] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-neutral-950 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-hanken font-bold text-sm text-white">In-App Search & Web Browser</h3>
                <p className="text-[10px] font-mono text-gray-500">Search any keyword or URL to open in built-in browser</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleOpenInBrowser();
            }}
            className="p-5 sm:p-6 space-y-4"
          >
            {/* Search Engine Selector */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-gray-400">Search Engine:</label>
              <div className="flex items-center space-x-1.5 bg-neutral-900 border border-gray-800 rounded-xl p-1">
                {(['google', 'duckduckgo', 'bing'] as const).map((eng) => (
                  <button
                    key={eng}
                    type="button"
                    onClick={() => setSearchEngine(eng)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono capitalize transition-all cursor-pointer ${
                      searchEngine === eng
                        ? 'bg-cyan-600 text-white font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {eng}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 text-cyan-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search web or enter URL (e.g., rou.video, terabox, youtube)..."
                className="w-full bg-neutral-900 border border-gray-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="submit"
                className="py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer transition-all active:scale-98"
              >
                <Globe className="w-4 h-4" />
                <span>Open in Inbuilt Browser</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleIngestToDownloader}
                className="py-3 px-4 rounded-2xl bg-action-red hover:bg-action-hover text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-action-red/20 cursor-pointer transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Direct Ingest to Downloader</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
