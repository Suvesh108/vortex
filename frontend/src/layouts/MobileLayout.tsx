import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MobileTopBar from '../components/MobileTopBar';
import MobileBottomNav from '../components/MobileBottomNav';
import TaskListDashboard from '../components/TaskListDashboard';
import SettingsView from '../components/SettingsView';
import { LayoutProps } from './DesktopLayout';

/**
 * Mobile Version Layout
 * Features:
 * - Clean mobile header with compact logo & responsive search
 * - Full-width scrollable viewport with bottom safe-area padding (pb-24)
 * - Fixed bottom navigation bar with elevated center "+ New Task" button
 * - Mobile-optimized dashboard with touch-friendly controls
 */
export default function MobileLayout({
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
    <div className="h-screen w-screen bg-[#1c1c1f] text-[#f0edf1] font-sans flex flex-col overflow-hidden select-none">
      {/* 1. Dedicated Mobile Top Header with Inbuilt Browser Logo */}
      <MobileTopBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeView={activeView}
        onOpenBrowser={onOpenBrowser}
      />

      {/* 2. Full-Width Scrollable Content Area */}
      <main className="flex-1 min-w-0 bg-[#222226] overflow-y-auto px-2.5 py-2.5 pb-24 shadow-inner">
        <AnimatePresence mode="wait">
          {/* TASKS DASHBOARD */}
          {activeView === 'tasks' && (
            <motion.div
              key="mobile-tasks-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="w-full mx-auto"
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
              key="mobile-settings-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="w-full mx-auto pb-4"
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
              key="mobile-vault-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="w-full mx-auto space-y-4 pt-2"
            >
              <div className="p-4 rounded-2xl bg-[#2b2b30] border border-white/[0.08] text-center space-y-3">
                <h3 className="font-hanken font-bold text-base text-white">Secret Private Vault</h3>
                <p className="text-xs text-gray-400 font-mono">Encrypted storage & hidden downloads</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenSecretVault}
                  className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs font-sans transition-colors cursor-pointer shadow-lg shadow-purple-500/20"
                >
                  Unlock Vault
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Dedicated Frosted Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeView={activeView}
        onSelectView={onSelectView}
        onOpenNewTask={onOpenNewTask}
        onOpenTrimmer={onOpenTrimmer}
        onOpenSettings={onOpenSettings}
        isSettingsOpen={isSettingsOpen}
      />
    </div>
  );
}
