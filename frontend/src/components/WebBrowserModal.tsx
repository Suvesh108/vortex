import { useState, useRef } from 'react';
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
  Bookmark
} from 'lucide-react';

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
  const [detectedMediaUrl, setDetectedMediaUrl] = useState<string | null>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isSniffing, setIsSniffing] = useState(false);

  if (!isOpen) return null;

  const bookmarks = [
    { name: 'YouTube', url: 'https://www.youtube.com', color: 'text-red-500' },
    { name: 'TikTok', url: 'https://www.tiktok.com', color: 'text-cyan-400' },
    { name: 'Twitter / X', url: 'https://x.com', color: 'text-blue-400' },
    { name: 'Instagram', url: 'https://www.instagram.com', color: 'text-pink-500' },
    { name: 'Pinterest', url: 'https://www.pinterest.com', color: 'text-red-600' },
    { name: 'Reddit', url: 'https://www.reddit.com', color: 'text-orange-500' }
  ];

  const handleNavigate = (url: string) => {
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    setCurrentUrl(target);
    setInputUrl(target);

    // Simulate real-time stream sniffing
    setIsSniffing(true);
    setTimeout(() => {
      setIsSniffing(false);
      setDetectedMediaUrl(target);
    }, 1000);
  };

  const handleDownloadDetected = () => {
    if (detectedMediaUrl || currentUrl) {
      onDownloadUrl(detectedMediaUrl || currentUrl);
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
          className="relative w-full max-w-5xl h-[90vh] bg-surface-card border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Top Browser Bar */}
          <div className="p-3 bg-neutral-950 border-b border-gray-800 flex items-center gap-2 shrink-0">
            <div className="flex items-center space-x-1 shrink-0">
              <button 
                onClick={() => handleNavigate('https://www.google.com')}
                className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleNavigate(currentUrl)}
                className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white"
                title="Refresh"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Address Bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleNavigate(inputUrl); }}
              className="flex-1 relative flex items-center"
            >
              <Globe className="w-4 h-4 text-action-red absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter URL or search..."
                className="w-full bg-neutral-900 border border-gray-800 rounded-xl pl-9 pr-20 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-action-red"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 rounded-lg bg-action-red hover:bg-action-hover text-[11px] font-mono font-bold text-white cursor-pointer"
              >
                Go
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
                className="px-2.5 py-0.5 rounded-md bg-black/60 hover:bg-white/5 border border-gray-800 text-[11px] font-mono text-gray-300 hover:text-white shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className={bm.color}>●</span>
                <span>{bm.name}</span>
              </button>
            ))}
          </div>

          {/* Web Viewport */}
          <div className="relative flex-1 bg-black overflow-hidden">
            <iframe
              src={currentUrl}
              title="In-App Web Browser"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              className="w-full h-full border-0 bg-white"
            />

            {/* Floating 1-Tap Media Sniffer Badge */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 right-4 z-20"
            >
              <button
                onClick={handleDownloadDetected}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-action-red to-orange-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-2xl shadow-action-red/50 hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-white/20"
              >
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Download Media from Page</span>
                <Download className="w-4 h-4 fill-white" />
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
