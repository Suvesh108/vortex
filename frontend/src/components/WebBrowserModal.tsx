import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Download,
  Sparkles,
  ExternalLink,
  Bookmark,
  Zap,
  CheckCircle2,
  FileVideo,
  Layers
} from 'lucide-react';
import { identifyHost } from '../hosts';

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
  const [currentUrl, setCurrentUrl] = useState('https://www.youtube.com');
  const [inputUrl, setInputUrl] = useState('https://www.youtube.com');
  const [detectedMediaUrl, setDetectedMediaUrl] = useState<string | null>('https://www.youtube.com');
  const [isSniffing, setIsSniffing] = useState(false);
  const [detectedHostName, setDetectedHostName] = useState('YouTube');
  const [activeSearchTab, setActiveSearchTab] = useState<'browser' | 'sniffer_hub'>('browser');

  const bookmarks = [
    { name: 'YouTube', url: 'https://www.youtube.com', category: 'Video Stream', color: 'text-red-500' },
    { name: 'TeraBox', url: 'https://teraboxapp.com', category: 'Cloud Storage', color: 'text-blue-500' },
    { name: 'Streamtape', url: 'https://streamtape.com', category: 'Video Host', color: 'text-amber-500' },
    { name: 'DoodStream', url: 'https://doodstream.com', category: 'Video Host', color: 'text-emerald-500' },
    { name: 'MixDrop', url: 'https://mixdrop.co', category: 'Video Host', color: 'text-cyan-400' },
    { name: 'TikTok', url: 'https://www.tiktok.com', category: 'Short Video', color: 'text-cyan-400' },
    { name: 'Twitter / X', url: 'https://x.com', category: 'Social Media', color: 'text-blue-400' },
    { name: 'Instagram', url: 'https://www.instagram.com', category: 'Reels & Media', color: 'text-pink-500' },
    { name: 'SoundCloud', url: 'https://soundcloud.com', category: 'HQ Audio', color: 'text-orange-500' },
    { name: 'Vimeo', url: 'https://vimeo.com', category: 'HD Video', color: 'text-cyan-500' }
  ];

  useEffect(() => {
    if (isOpen) {
      handleAnalyzeUrl(currentUrl);
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleAnalyzeUrl = (url: string) => {
    const hostInfo = identifyHost(url);
    setDetectedHostName(hostInfo.hostName);
    setDetectedMediaUrl(url);
  };

  const handleNavigate = (rawInput: string) => {
    let target = rawInput.trim();
    if (!target) return;

    // Detect if input is a search query or an actual URL
    const isUrl = /^https?:\/\//i.test(target) || /^[\w-]+\.[\w.-]+/i.test(target);

    if (!isUrl) {
      // Use DuckDuckGo clean search engine
      target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
    } else if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    setCurrentUrl(target);
    setInputUrl(target);
    handleAnalyzeUrl(target);

    setIsSniffing(true);
    setTimeout(() => {
      setIsSniffing(false);
    }, 600);
  };

  const handleDownloadCurrent = () => {
    const target = detectedMediaUrl || currentUrl;
    if (target) {
      onDownloadUrl(target);
      onClose();
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
          className="relative w-full max-w-5xl h-[92vh] bg-surface-card border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Top Browser Bar */}
          <div className="p-3 bg-neutral-950 border-b border-gray-800 flex items-center gap-2 shrink-0">
            <div className="flex items-center space-x-1 shrink-0">
              <button 
                onClick={() => handleNavigate('https://duckduckgo.com')}
                className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white transition-colors"
                title="Search Home"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
              </button>
              <button 
                onClick={() => handleNavigate(currentUrl)}
                className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white transition-colors"
                title="Refresh page"
              >
                <RotateCw className={`w-4 h-4 ${isSniffing ? 'animate-spin text-action-red' : ''}`} />
              </button>
            </div>

            {/* Address / Search Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleNavigate(inputUrl); }}
              className="flex-1 relative flex items-center min-w-0"
            >
              <Search className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter URL (YouTube, TeraBox, DoodStream...) or search keywords..."
                className="w-full bg-neutral-900 border border-gray-800 rounded-xl pl-9 pr-24 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-action-red"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 rounded-lg bg-action-red hover:bg-action-hover text-[11px] font-mono font-bold text-white cursor-pointer shadow-sm transition-all"
              >
                Go / Search
              </button>
            </form>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Bookmarks Bar */}
          <div className="px-3 py-1.5 bg-neutral-900 border-b border-gray-800/80 flex items-center space-x-1.5 overflow-x-auto shrink-0">
            <Bookmark className="w-3.5 h-3.5 text-gray-500 mr-1 shrink-0" />
            {bookmarks.map((bm) => (
              <button
                key={bm.name}
                onClick={() => handleNavigate(bm.url)}
                className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-white/5 border border-gray-800 text-[11px] font-mono text-gray-300 hover:text-white shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className={bm.color}>●</span>
                <span>{bm.name}</span>
              </button>
            ))}
          </div>

          {/* Viewport Content */}
          <div className="relative flex-1 bg-neutral-950 overflow-hidden flex flex-col">
            {/* Live Media Sniffer Info Banner */}
            <div className="px-4 py-2 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900 border-b border-gray-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-gray-400 truncate">
                  Sniffer Active: <strong className="text-white">{detectedHostName}</strong> ({currentUrl.substring(0, 45)}...)
                </span>
              </div>
              <button
                onClick={handleDownloadCurrent}
                className="px-3 py-1 rounded-xl bg-action-red hover:bg-action-hover text-white text-[11px] font-bold font-mono flex items-center gap-1 shadow-sm shrink-0 cursor-pointer ml-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sniff & Ingest</span>
              </button>
            </div>

            {/* Embedded Web View */}
            <div className="relative flex-1 bg-black">
              <iframe
                src={currentUrl}
                title="In-App Web Browser"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                className="w-full h-full border-0 bg-neutral-900"
              />

              {/* Floating One-Tap Sniffer FAB */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-5 right-5 z-20"
              >
                <button
                  onClick={handleDownloadCurrent}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-action-red via-[#FF5540] to-orange-500 text-white font-mono font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl shadow-action-red/50 hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-white/20"
                >
                  <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>Download Media from Page</span>
                  <Download className="w-4 h-4 fill-white" />
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
