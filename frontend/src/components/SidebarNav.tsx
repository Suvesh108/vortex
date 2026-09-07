import React from 'react';
import { motion } from 'motion/react';
import { 
  Inbox, 
  Plus, 
  Settings, 
  Shield, 
  Scissors, 
  Globe, 
  FolderOpen 
} from 'lucide-react';

export type NavView = 'tasks' | 'settings' | 'vault' | 'swarm';

interface SidebarNavProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenNewTask: () => void;
  onOpenBrowser: () => void;
  onOpenFileManager: () => void;
  onOpenTrimmer: () => void;
  onOpenSettings: () => void;
  isSettingsOpen?: boolean;
  downloadingCount?: number;
}

export default function SidebarNav({
  activeView,
  onSelectView,
  onOpenNewTask,
  onOpenBrowser,
  onOpenFileManager,
  onOpenTrimmer,
  onOpenSettings,
  isSettingsOpen = false,
  downloadingCount = 0
}: SidebarNavProps) {
  const springTransition = { type: 'spring' as const, stiffness: 400, damping: 22 };

  return (
    <aside className="w-20 bg-transparent flex-col items-center py-2.5 px-2 justify-between select-none shrink-0 z-30 flex">
        {/* Top Section Nav Items */}
        <div className="flex flex-col items-center space-y-2 w-full">
          {/* Tasks Button */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={springTransition}
            onClick={() => onSelectView('tasks')}
            className={`w-16 h-16 aspect-square shrink-0 rounded-xl flex flex-col items-center justify-center space-y-0.5 transition-colors cursor-pointer relative outline-none focus:outline-none select-none ${
              activeView === 'tasks'
                ? 'bg-[#38383c] text-[#3ea6ff] shadow-lg shadow-[#3ea6ff]/10'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {activeView === 'tasks' && (
              <motion.div 
                layoutId="navIndicator"
                transition={springTransition}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#3ea6ff] rounded-r-full shadow-sm shadow-[#3ea6ff]/80"
              />
            )}
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <polyline points="8 11 12 15 16 11" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </motion.div>
            <span className="text-[11px] font-sans font-medium tracking-tight">Tasks</span>
          </motion.button>

          {/* New Task Button */}
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.90 }}
            transition={springTransition}
            onClick={onOpenNewTask}
            className="w-16 h-16 aspect-square shrink-0 rounded-xl flex flex-col items-center justify-center space-y-0.5 text-gray-400 hover:text-[#3ea6ff] hover:bg-[#3ea6ff]/10 hover:border hover:border-[#3ea6ff]/30 transition-colors cursor-pointer outline-none focus:outline-none select-none group"
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            >
              <Plus className="w-6 h-6 stroke-[2.2] group-hover:text-[#3ea6ff] transition-colors" />
            </motion.div>
            <span className="text-[11px] font-sans font-medium tracking-tight group-hover:text-white transition-colors">New task</span>
          </motion.button>

          {/* Vault Button */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={springTransition}
            onClick={() => onSelectView('vault')}
            className={`w-16 h-16 aspect-square shrink-0 rounded-xl flex flex-col items-center justify-center space-y-0.5 transition-colors cursor-pointer relative outline-none focus:outline-none select-none ${
              activeView === 'vault'
                ? 'bg-[#38383c] text-[#3ea6ff] shadow-lg shadow-[#3ea6ff]/10'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Private Vault"
          >
            {activeView === 'vault' && (
              <motion.div 
                layoutId="navIndicator"
                transition={springTransition}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#3ea6ff] rounded-r-full shadow-sm shadow-[#3ea6ff]/80"
              />
            )}
            <motion.div
              whileHover={{ scale: 1.15, rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.3 }}
            >
              <Shield className="w-6 h-6 stroke-[2]" />
            </motion.div>
            <span className="text-[11px] font-sans tracking-tight">Vault</span>
          </motion.button>

          {/* Trimmer Button */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={springTransition}
            onClick={onOpenTrimmer}
            className="w-16 h-16 aspect-square shrink-0 rounded-xl flex flex-col items-center justify-center space-y-0.5 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 transition-colors cursor-pointer outline-none focus:outline-none select-none group"
            title="Trimmer Studio"
          >
            <motion.div
              whileHover={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 0.3 }}
            >
              <Scissors className="w-6 h-6 stroke-[2] group-hover:text-pink-400 transition-colors" />
            </motion.div>
            <span className="text-[11px] font-sans tracking-tight group-hover:text-white transition-colors">Trimmer</span>
          </motion.button>

          {/* Browser Button */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={springTransition}
            onClick={onOpenBrowser}
            className="w-16 h-16 aspect-square shrink-0 rounded-xl flex flex-col items-center justify-center space-y-0.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer outline-none focus:outline-none select-none group"
            title="Browser & Sniffer"
          >
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <Globe className="w-6 h-6 stroke-[2] group-hover:text-emerald-400 transition-colors" />
            </motion.div>
            <span className="text-[11px] font-sans tracking-tight group-hover:text-white transition-colors">Browser</span>
          </motion.button>

          {/* Storage Files Button */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={springTransition}
            onClick={onOpenFileManager}
            className="w-16 h-16 aspect-square shrink-0 rounded-xl flex flex-col items-center justify-center space-y-0.5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer outline-none focus:outline-none select-none group"
            title="Storage File Manager"
          >
            <motion.div
              whileHover={{ scale: 1.15, y: -1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <FolderOpen className="w-6 h-6 stroke-[2] group-hover:text-amber-400 transition-colors" />
            </motion.div>
            <span className="text-[11px] font-sans tracking-tight group-hover:text-white transition-colors">Files</span>
          </motion.button>
        </div>

        {/* Bottom Section: Settings */}
        <div className="w-full flex justify-center pb-1">
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={springTransition}
            onClick={onOpenSettings}
            className={`w-16 h-16 aspect-square shrink-0 rounded-xl flex flex-col items-center justify-center space-y-0.5 transition-colors cursor-pointer relative outline-none focus:outline-none select-none ${
              isSettingsOpen || activeView === 'settings'
                ? 'bg-[#38383c] text-[#3ea6ff] shadow-lg shadow-[#3ea6ff]/10'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Settings & Feature Packs"
          >
            {(isSettingsOpen || activeView === 'settings') && (
              <motion.div 
                layoutId="navIndicator"
                transition={springTransition}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#3ea6ff] rounded-r-full shadow-sm shadow-[#3ea6ff]/80"
              />
            )}
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            >
              <Settings className="w-6 h-6 stroke-[2]" />
            </motion.div>
            <span className="text-[11px] font-sans tracking-tight">Settings</span>
          </motion.button>
        </div>
      </aside>
  );
}

