import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings as SettingsIcon, 
  Search, 
  RotateCcw
} from 'lucide-react';
import { UserSettings } from '../types';
import SettingsView from './SettingsView';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onOpenAria2Modal: () => void;
  onOpenTorrentModal?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenAria2Modal
}: SettingsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop (Matches Image floating window) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Floating Modal Window Shell (Matches media_1788795290025.png) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-3xl bg-[#202023] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[88vh] overflow-hidden z-10 text-gray-200"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.06] bg-[#1d1d20] shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#3ea6ff]/15 border border-[#3ea6ff]/30 flex items-center justify-center text-[#3ea6ff] shrink-0">
                <SettingsIcon className="w-4 h-4" />
              </div>
              <h3 className="font-hanken font-bold text-sm sm:text-base text-white truncate">
                Settings & Preferences
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 text-xs font-mono">
                12 categories
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white border border-white/[0.06] transition-colors cursor-pointer shrink-0"
              title="Close Settings (Esc)"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Controls Bar: Search & Quick Reset matching screenshot */}
          <div className="p-3 sm:p-4 bg-[#18181b]/80 border-b border-white/[0.06] flex items-center gap-2.5 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search settings, feature packs, or options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#121214] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs font-sans text-white focus:outline-none focus:border-[#3ea6ff] transition-colors placeholder-gray-500"
              />
            </div>

            {searchTerm && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSearchTerm('')}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-mono text-gray-300 hover:text-white border border-white/[0.06] flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </motion.button>
            )}
          </div>

          {/* Scrollable Content Body - All Settings */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <SettingsView
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onOpenAria2Modal={onOpenAria2Modal}
              searchQuery={searchTerm}
            />
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
