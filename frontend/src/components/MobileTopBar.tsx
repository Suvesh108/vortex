import React from 'react';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';

interface MobileTopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView: string;
}

export default function MobileTopBar({
  searchQuery,
  onSearchChange,
  activeView
}: MobileTopBarProps) {
  const placeholder = activeView === 'settings' ? 'Search Settings...' : 'Search Downloads...';

  return (
    <header className="h-13 bg-[#1c1c1f]/95 backdrop-blur-md flex items-center justify-between px-3 select-none shrink-0 text-gray-200 border-b border-white/[0.06] gap-2 z-30">
      {/* Brand Icon & Name */}
      <motion.div 
        className="flex items-center space-x-2 shrink-0 cursor-pointer"
        whileTap={{ scale: 0.95 }}
      >
        <motion.img
          src="/assets/logo.png"
          alt="Vortex Logo"
          className="w-6 h-6 rounded-lg object-cover shadow-md select-none border border-white/[0.1]"
        />
        <span className="text-sm font-bold text-white tracking-tight font-sans">
          Vortex
        </span>
      </motion.div>

      {/* Dynamic Mobile Search Input */}
      <div className="flex-1 ml-2 flex items-center">
        <div className="relative w-full flex items-center">
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#26262a] border border-white/[0.08] focus:border-[#4cc2ff] focus:ring-1 focus:ring-[#4cc2ff]/30 rounded-xl pl-8 pr-7 py-1 text-xs text-gray-100 placeholder-gray-400 outline-none h-8 font-sans"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 p-0.5 rounded-full hover:bg-white/[0.1] text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
