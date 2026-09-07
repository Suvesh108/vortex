import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  Search,
  Download,
  ExternalLink,
  Zap,
  ArrowRight,
  Compass
} from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { sanitizeMediaUrl } from '../hosts';

interface WebBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadUrl: (url: string) => void;
  initialQuery?: string;
}

export default function WebBrowserModal({
  isOpen,
  onClose,
  onDownloadUrl,
  initialQuery = ''
}: WebBrowserModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchEngine, setSearchEngine] = useState<'google' | 'duckduckgo' | 'bing'>('google');

  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const quickPortals = [
    { name: 'Google', url: 'https://www.google.com', badge: 'Search' },
    { name: 'YouTube', url: 'https://www.youtube.com', badge: 'Media' },
    { name: 'TeraBox', url: 'https://www.terabox.com', badge: 'Cloud' },
    { name: 'rou.video', url: 'https://rou.video', badge: 'Aggregator' },
    { name: 'DiskWala', url: 'https://diskwala.com', badge: 'Storage' },
    { name: 'DoodStream', url: 'https://doodstream.com', badge: 'Stream' }
  ];

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

  const handleOpenInBrowser = async (customUrl?: string) => {
    const targetUrl = customUrl || constructTargetUrl(query);

    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: targetUrl,
          windowName: '_blank',
          toolbarColor: '#121214',
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

            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </motion.button>
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
                {(['google', 'duckduckgo', 'bing'] as const).map((eng) => {
                  const isSelected = searchEngine === eng;
                  return (
                    <motion.button
                      key={eng}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchEngine(eng)}
                      className="relative px-3 py-1 rounded-lg text-[11px] font-mono capitalize transition-colors cursor-pointer text-gray-400 hover:text-white"
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="browserEnginePill"
                          className="absolute inset-0 bg-cyan-600 rounded-lg shadow"
                          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                        />
                      )}
                      <span className={`relative z-10 ${isSelected ? 'text-white font-bold' : ''}`}>
                        {eng}
                      </span>
                    </motion.button>
                  );
                })}
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

            {/* Quick Portals & Media Hubs */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[11px] font-mono text-gray-400 block">Quick Portals:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickPortals.map((portal) => (
                  <motion.button
                    key={portal.name}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setQuery(portal.url);
                      handleOpenInBrowser(portal.url);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-gray-800 hover:border-cyan-500/50 text-[11px] font-mono text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{portal.name}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-white/[0.06] rounded text-cyan-400">
                      {portal.badge}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                type="submit"
                className="py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Open in Inbuilt Browser</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                type="button"
                onClick={handleIngestToDownloader}
                className="py-3 px-4 rounded-2xl bg-action-red hover:bg-action-hover text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-action-red/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Direct Ingest to Downloader</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
