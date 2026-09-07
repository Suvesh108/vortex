import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView: 'tasks' | 'settings' | 'swarm' | 'vault';
}

export default function TopBar({
  searchQuery,
  onSearchChange,
  activeView
}: TopBarProps) {
  const placeholder = activeView === 'settings' ? 'Search Settings' : 'Search Tasks';

  return (
    <div className="h-[52px] bg-[#202020] flex items-center justify-between px-3 sm:px-4 select-none shrink-0 text-gray-200 border-b border-white/[0.04] gap-2">
      {/* Left: App Icon & Title with micro-interaction */}
      <motion.div 
        className="flex items-center space-x-2 shrink-0 cursor-pointer"
        whileHover={{ x: 2 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <motion.img
          src="/assets/logo.png"
          alt="Vortex Logo"
          className="w-6 h-6 rounded-lg object-cover shadow-md select-none border border-white/[0.1]"
          whileHover={{ scale: 1.15, rotate: 10 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        />
        <span className="text-xs sm:text-[13px] font-sans font-medium text-gray-200 tracking-normal group-hover:text-white transition-colors">
          <span className="hidden xs:inline sm:inline">Vortex Downloader</span>
          <span className="inline xs:hidden sm:hidden">Vortex</span>
        </span>
      </motion.div>

      {/* Center: Search Tasks Bar with focus expansion & glow */}
      <div className="flex-1 max-w-sm mx-1 sm:mx-auto">
        <motion.div 
          className="relative flex items-center"
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#2a2a2d] hover:bg-[#2f2f33] focus:bg-[#1a1a1c] border border-white/[0.08] focus:border-[#4cc2ff] focus:ring-2 focus:ring-[#4cc2ff]/20 rounded-xl px-3 py-1.5 text-xs text-gray-100 placeholder-gray-400 transition-all duration-200 outline-none h-8 sm:h-8.5 pr-8 font-sans shadow-inner"
          />
          <motion.div 
            className="absolute right-2.5 sm:right-3 pointer-events-none"
            animate={{ scale: searchQuery ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Search className="w-3.5 h-3.5 text-gray-400" />
          </motion.div>
        </motion.div>
      </div>

      {/* Right spacer to balance the centered search input on desktop */}
      <div className="hidden sm:block sm:min-w-[120px] md:min-w-[180px]" />
    </div>
  );
}
