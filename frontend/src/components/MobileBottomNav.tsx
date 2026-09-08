import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Settings, 
  Shield 
} from 'lucide-react';
import { NavView } from './SidebarNav';

interface MobileBottomNavProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenNewTask: () => void;
  onOpenSettings: () => void;
  isSettingsOpen?: boolean;
}

export default function MobileBottomNav({
  activeView,
  onSelectView,
  onOpenNewTask,
  onOpenSettings,
  isSettingsOpen = false
}: MobileBottomNavProps) {
  const springTransition = { type: 'spring' as const, stiffness: 400, damping: 22 };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#18181b]/95 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-around px-2 py-1 h-15 select-none shadow-2xl">
      {/* Mobile Tasks */}
      <motion.button
        whileTap={{ scale: 0.90 }}
        onClick={() => onSelectView('tasks')}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative cursor-pointer ${
          activeView === 'tasks' ? 'text-[#3ea6ff]' : 'text-gray-400 hover:text-white'
        }`}
      >
        {activeView === 'tasks' && (
          <motion.div
            layoutId="mobileNavPill"
            transition={springTransition}
            className="absolute top-0 w-8 h-0.5 bg-[#3ea6ff] rounded-full shadow-sm shadow-[#3ea6ff]"
          />
        )}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <polyline points="8 11 12 15 16 11" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        <span className="text-[10px] font-medium mt-0.5">Tasks</span>
      </motion.button>

      {/* Mobile Vault */}
      <motion.button
        whileTap={{ scale: 0.90 }}
        onClick={() => onSelectView('vault')}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative cursor-pointer ${
          activeView === 'vault' ? 'text-[#3ea6ff]' : 'text-gray-400 hover:text-white'
        }`}
      >
        {activeView === 'vault' && (
          <motion.div
            layoutId="mobileNavPill"
            transition={springTransition}
            className="absolute top-0 w-8 h-0.5 bg-[#3ea6ff] rounded-full shadow-sm shadow-[#3ea6ff]"
          />
        )}
        <Shield className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">Vault</span>
      </motion.button>

      {/* Mobile Center Elevated Hero "+ New Task" Button */}
      <div className="flex-1 flex justify-center -mt-5">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
          transition={springTransition}
          onClick={onOpenNewTask}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#3ea6ff] to-sky-400 text-black shadow-lg shadow-[#3ea6ff]/40 flex items-center justify-center border-2 border-[#18181b] cursor-pointer"
          title="New Download Task"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </motion.button>
      </div>

      {/* Mobile Settings */}
      <motion.button
        whileTap={{ scale: 0.90 }}
        onClick={onOpenSettings}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative cursor-pointer ${
          isSettingsOpen || activeView === 'settings' ? 'text-[#3ea6ff]' : 'text-gray-400 hover:text-white'
        }`}
      >
        {(isSettingsOpen || activeView === 'settings') && (
          <motion.div
            layoutId="mobileNavPill"
            transition={springTransition}
            className="absolute top-0 w-8 h-0.5 bg-[#3ea6ff] rounded-full shadow-sm shadow-[#3ea6ff]"
          />
        )}
        <Settings className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">Settings</span>
      </motion.button>
    </nav>
  );
}
