import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  Search,
  Download,
  Sparkles,
  ExternalLink,
  Bookmark,
  Zap,
  CheckCircle2,
  Shield,
  Layers,
  ArrowRight,
  Compass,
  Radio,
  Play
} from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { identifyHost, sanitizeMediaUrl } from '../hosts';

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
  const [inputUrl, setInputUrl] = useState('https://www.youtube.com');
  const [activeUrl, setActiveUrl] = useState('https://www.youtube.com');
  const [detectedHost, setDetectedHost] = useState<{ hostName: string; isSupported: boolean }>({
    hostName: 'YouTube',
    isSupported: true
  });
  const [searchEngine, setSearchEngine] = useState<'duckduckgo' | 'google' | 'youtube'>('duckduckgo');

  const categories = [
    {
      title: 'Popular Video Streams',
      items: [
        { name: 'YouTube', url: 'https://www.youtube.com', tag: 'Universal Stream', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
        { name: 'TikTok', url: 'https://www.tiktok.com', tag: 'Shorts & Music', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
        { name: 'Vimeo', url: 'https://vimeo.com', tag: '4K Cinema', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        { name: 'SoundCloud', url: 'https://soundcloud.com', tag: 'Lossless Audio', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
      ]
    },
    {
      title: 'Cloud & Video Hosting Platforms (v0.5.0 Suite)',
      items: [
        { name: 'TeraBox', url: 'https://teraboxapp.com', tag: 'Cloud Storage', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
        { name: 'Streamtape', url: 'https://streamtape.com', tag: 'High-Speed MP4', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
        { name: 'DoodStream', url: 'https://doodstream.com', tag: 'Fast Stream', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        { name: 'MixDrop', url: 'https://mixdrop.co', tag: 'Direct Media', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        { name: 'FileMoon', url: 'https://filemoon.sx', tag: 'HLS Master', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
        { name: 'StreamWish', url: 'https://streamwish.to', tag: 'Fast HLS', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
      ]
    },
    {
      title: 'Social & Media Portals',
      items: [
        { name: 'Twitter / X', url: 'https://x.com', tag: 'Clips & Feeds', color: 'bg-gray-700/30 text-gray-300 border-gray-600/30' },
        { name: 'Instagram', url: 'https://www.instagram.com', tag: 'Reels & Stories', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
        { name: 'Reddit', url: 'https://www.reddit.com', tag: 'Community Video', color: 'bg-orange-600/20 text-orange-400 border-orange-600/30' },
        { name: 'Pinterest', url: 'https://www.pinterest.com', tag: 'Photos & Videos', color: 'bg-red-600/20 text-red-400 border-red-600/30' }
      ]
    }
  ];

  useEffect(() => {
    if (isOpen) {
      updateAnalysis(activeUrl);
    }
  }, [isOpen, activeUrl]);

  if (!isOpen) return null;

  const updateAnalysis = (url: string) => {
    const clean = sanitizeMediaUrl(url) || url;
    setActiveUrl(clean);
    const hostInfo = identifyHost(clean);
    setDetectedHost(hostInfo);
  };

  const constructTargetUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return 'https://duckduckgo.com';

    // If input has URL structure
    if (/^https?:\/\//i.test(trimmed) || /^[\w-]+\.[\w.-]+(\/.*)?$/i.test(trimmed)) {
      return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }

    // Otherwise format as search query
    if (searchEngine === 'google') {
      return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    } else if (searchEngine === 'youtube') {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmed)}`;
    } else {
      return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
    }
  };

  const handleLaunchBrowser = async (customUrl?: string) => {
    const target = constructTargetUrl(customUrl || inputUrl);
    updateAnalysis(target);

    try {
      if (Capacitor.isNativePlatform()) {
        // Launch Chrome Custom Tab / Safari View with native cookie & JS support (zero X-Frame-Options blocks)
        await Browser.open({
          url: target,
          windowName: '_blank',
          toolbarColor: '#0c0c0e',
          presentationStyle: 'fullscreen'
        });
      } else {
        // On Web, open window or tab
        window.open(target, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      window.open(target, '_blank');
    }
  };

  const handleIngestUrl = (urlToIngest?: string) => {
    const finalUrl = constructTargetUrl(urlToIngest || inputUrl);
    onDownloadUrl(finalUrl);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-x-hidden">
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
          className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0c0e] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Top Bar */}
          <div className="p-3.5 bg-neutral-950 border-b border-gray-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-hanken font-bold text-sm text-white flex items-center gap-1.5 truncate">
                  <span>In-App Web Browser & Media Sniffer</span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-[10px] font-mono">
                    LIVE ENGINE
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-gray-500 truncate">
                  Full fidelity web browsing with zero "Webpage Not Available" errors
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search / URL Navigation Hub */}
          <div className="p-4 bg-neutral-900/90 border-b border-gray-800 space-y-3 shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleLaunchBrowser();
              }}
              className="flex flex-col sm:flex-row gap-2 w-full"
            >
              <div className="relative flex-1 min-w-0 flex items-center">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    updateAnalysis(e.target.value);
                  }}
                  placeholder="Search keywords (e.g. 'lofi hip hop') or paste URL (YouTube, TeraBox, DoodStream)..."
                  className="w-full bg-neutral-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Search Engine Selector */}
                <select
                  value={searchEngine}
                  onChange={(e) => setSearchEngine(e.target.value as any)}
                  className="bg-neutral-950 border border-gray-800 rounded-xl px-2.5 py-2 text-[11px] font-mono text-gray-300 focus:outline-none"
                >
                  <option value="duckduckgo">DuckDuckGo</option>
                  <option value="google">Google</option>
                  <option value="youtube">YouTube</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleLaunchBrowser()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all shrink-0"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Browse Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleIngestUrl()}
                  className="px-3.5 py-2 rounded-xl bg-action-red hover:bg-action-hover text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-action-red/30 cursor-pointer transition-all shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ingest Stream</span>
                </button>
              </div>
            </form>

            {/* Live Host Sniffer Badge */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-gray-400 truncate">
                  Sniffer Target: <strong className="text-white">{detectedHost.hostName}</strong>
                </span>
                {detectedHost.isSupported && (
                  <span className="px-2 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold">
                    100% Stream Extraction Ready
                  </span>
                )}
              </div>

              <span className="text-[10px] text-gray-500 hidden sm:inline">
                Tap any platform below to browse or download directly
              </span>
            </div>
          </div>

          {/* Bookmarks & Portals Explorer */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-xs font-mono font-bold tracking-wider text-gray-400 uppercase flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{cat.title}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {cat.items.map((item) => (
                    <div
                      key={item.name}
                      className="p-3 rounded-2xl bg-neutral-900/80 border border-gray-800 hover:border-cyan-500/50 hover:bg-neutral-800/60 transition-all flex flex-col justify-between space-y-2.5 group text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-hanken font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                          {item.name}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.color}`}>
                          {item.tag}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 pt-1">
                        <button
                          onClick={() => {
                            setInputUrl(item.url);
                            handleLaunchBrowser(item.url);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-black/60 hover:bg-cyan-600/30 text-gray-300 hover:text-white text-[11px] font-mono flex items-center justify-center gap-1 border border-gray-800 cursor-pointer transition-colors"
                        >
                          <Globe className="w-3 h-3 text-cyan-400" />
                          <span>Open</span>
                        </button>

                        <button
                          onClick={() => {
                            setInputUrl(item.url);
                            handleIngestUrl(item.url);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-action-red/20 hover:bg-action-red text-action-red hover:text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1 border border-action-red/30 cursor-pointer transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Ingest</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Navigation Action */}
          <div className="p-3.5 bg-neutral-950 border-t border-gray-800 flex items-center justify-between text-xs font-mono shrink-0">
            <span className="text-gray-400 truncate mr-2">
              Ready to stream from: <strong className="text-white">{inputUrl.substring(0, 45)}</strong>
            </span>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => handleLaunchBrowser()}
                className="px-4 py-2 rounded-xl bg-secondary-grey/40 hover:bg-secondary-grey text-gray-300 hover:text-white font-mono text-xs flex items-center gap-1.5 border border-gray-800 cursor-pointer transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open in In-App Browser</span>
              </button>

              <button
                onClick={() => handleIngestUrl()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-action-red to-orange-500 hover:from-action-hover hover:to-orange-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-action-red/25 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Download Media</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
