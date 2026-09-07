import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TopBar from '../components/TopBar';
import SidebarNav, { NavView } from '../components/SidebarNav';
import TaskListDashboard from '../components/TaskListDashboard';
import SettingsView from '../components/SettingsView';
import { DownloadHistoryItem, UserSettings } from '../types';

export interface LayoutProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenNewTask: () => void;
  onOpenBrowser: () => void;
  onOpenFileManager: () => void;
  onOpenTrimmer: () => void;
  onOpenSettings: () => void;
  onOpenAria2Modal: () => void;
  onOpenSecretVault: () => void;
  isSettingsOpen: boolean;
  history: DownloadHistoryItem[];
  currentDownloading: any;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onRemoveHistoryItem: (id: string) => void;
  onPlayItem: (item: DownloadHistoryItem) => void;
  onTrimItem: (item: DownloadHistoryItem) => void;
}

/**
 * Windows / Desktop Version Layout
 * Features:
 * - Top window bar with centered search bar & window spacer
 * - Left vertical navigation rail (SidebarNav)
 * - Inset rounded canvas with border-t and border-l
 * - Full-featured desktop dashboard
 */
export default function DesktopLayout({
  searchQuery,
  onSearchChange,
  activeView,
  onSelectView,
  onOpenNewTask,
  onOpenBrowser,
  onOpenFileManager,
  onOpenTrimmer,
  onOpenSettings,
  onOpenAria2Modal,
  onOpenSecretVault,
  isSettingsOpen,
  history,
  currentDownloading,
  settings,
  onUpdateSettings,
  onRemoveHistoryItem,
  onPlayItem,
  onTrimItem
}: LayoutProps) {
  return (
    <div className="h-screen w-screen bg-[#202020] text-[#f0edf1] font-sans flex flex-col overflow-hidden select-none">
      {/* 1. Windows App Header Bar */}
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeView={activeView}
      />

      {/* 2. Main Window Area: Left Navigation Rail + Inset Rounded Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-[#202020]">
        <SidebarNav
          activeView={activeView}
          onSelectView={onSelectView}
          onOpenNewTask={onOpenNewTask}
          onOpenBrowser={onOpenBrowser}
          onOpenFileManager={onOpenFileManager}
          onOpenTrimmer={onOpenTrimmer}
          onOpenSettings={onOpenSettings}
          isSettingsOpen={isSettingsOpen}
          downloadingCount={currentDownloading ? 1 : 0}
        />

        {/* Center Viewport: Inset Rounded Window Canvas */}
        <main className="flex-1 min-w-0 bg-[#272727] rounded-tl-2xl border-t border-l border-white/[0.08] overflow-y-auto px-4 py-3 shadow-inner">
          <AnimatePresence mode="wait">
            {/* TASKS DASHBOARD */}
            {activeView === 'tasks' && (
              <motion.div
                key="tasks-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-5xl mx-auto"
              >
                <TaskListDashboard
                  items={history}
                  currentDownloading={currentDownloading}
                  searchQuery={searchQuery}
                  onPlayItem={onPlayItem}
                  onTrimItem={onTrimItem}
                  onRemoveItem={onRemoveHistoryItem}
                  onOpenStorage={onOpenFileManager}
                  onStartAll={() => {}}
                  onPauseAll={() => {}}
                  onOpenNewTask={onOpenNewTask}
                  globalSpeed={currentDownloading ? currentDownloading.speed : '0.00 B/s'}
                />
              </motion.div>
            )}

            {/* SETTINGS VIEW */}
            {activeView === 'settings' && (
              <motion.div
                key="settings-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-3xl mx-auto"
              >
                <SettingsView
                  settings={settings}
                  onUpdateSettings={onUpdateSettings}
                  onOpenAria2Modal={onOpenAria2Modal}
                  searchQuery={searchQuery}
                />
              </motion.div>
            )}

            {/* SECRET VAULT VIEW */}
            {activeView === 'vault' && (
              <motion.div
                key="vault-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-4xl mx-auto space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <h2 className="font-hanken font-bold text-base text-white">Secret Private Vault</h2>
                    <p className="text-xs text-gray-400 font-mono">Encrypted storage & hidden downloads</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.06, y: -1 }}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={onOpenSecretVault}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs font-sans transition-colors cursor-pointer"
                  >
                    Unlock Vault
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
