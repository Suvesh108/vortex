import React from 'react';
import { motion } from 'motion/react';
import { Zap, Database, Settings, Globe, FolderOpen, Shield, Radio, Network } from 'lucide-react';

interface HeaderProps {
  activeTab: 'downloader' | 'vault';
  onSelectTab: (tab: 'downloader' | 'vault') => void;
  onOpenSettings: () => void;
  onOpenBrowser: () => void;
  onOpenFileManager: () => void;
  onOpenSecretVault: () => void;
  onOpenTorrent?: () => void;
  onOpenAria2?: () => void;
  vaultCount: number;
}

export default function Header({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenBrowser,
  onOpenFileManager,
  onOpenSecretVault,
  onOpenTorrent,
  onOpenAria2,
  vaultCount
}: HeaderProps) {
  return (
    <header className="w-full bg-[#0A0A0B]/85 backdrop-blur-xl border-b border-white/[0.07] h-16 flex items-center justify-between px-3 sm:px-6 md:px-8 sticky top-0 z-40">
      {/* Brand Logo & Title with Hover Micro-motion */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
        onClick={() => {
          onSelectTab('downloader');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <img
          src="/assets/logo.png"
          alt="Vortex Logo"
          className="w-8 h-8 rounded-xl object-cover shadow-lg shadow-sky-500/25"
        />
        <div className="flex flex-col">
          <span className="font-hanken font-extrabold text-base tracking-tight text-white leading-none">
            VORTEX<span className="text-sky-400 font-light">CORE</span>
          </span>
          <span className="text-[9px] font-mono text-gray-400 tracking-widest uppercase mt-0.5">
            UNIVERSAL ENGINE
          </span>
        </div>
      </motion.div>

      {/* Center Tabs with Framer Motion layoutId */}
      <nav className="flex items-center bg-black/50 border border-white/[0.08] rounded-full p-1 relative">
        <button
          onClick={() => {
            onSelectTab('downloader');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 z-10 ${
            activeTab === 'downloader' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === 'downloader' && (
            <motion.div
              layoutId="header-tab-pill"
              className="absolute inset-0 bg-[#FF1A35] rounded-full shadow-lg shadow-red-500/30 -z-10"
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            />
          )}
          <Zap className="w-3.5 h-3.5" />
          <span>Downloader</span>
        </button>

        <button
          onClick={() => {
            onSelectTab('vault');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 z-10 ${
            activeTab === 'vault' ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === 'vault' && (
            <motion.div
              layoutId="header-tab-pill"
              className="absolute inset-0 bg-[#FF1A35] rounded-full shadow-lg shadow-red-500/30 -z-10"
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            />
          )}
          <Database className="w-3.5 h-3.5" />
          <span>Vault</span>
          {vaultCount > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-white/20 text-white font-mono">
              {vaultCount}
            </span>
          )}
        </button>
      </nav>

      {/* Right Quick Action Icons with Spring Physics */}
      <div className="flex items-center space-x-1 sm:space-x-1.5">
        {/* P2P Torrent Swarm */}
        {onOpenTorrent && (
          <motion.button
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenTorrent}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 border border-white/[0.08] hover:border-emerald-500/40 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center justify-center relative"
            title="P2P Torrent & Magnet Swarm"
          >
            <Radio className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </motion.button>
        )}

        {/* aria2 JSON-RPC */}
        {onOpenAria2 && (
          <motion.button
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenAria2}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-cyan-500/20 border border-white/[0.08] hover:border-cyan-500/40 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer flex items-center justify-center relative"
            title="aria2 JSON-RPC Extension Bridge"
          >
            <Network className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </motion.button>
        )}

        {/* In-App Browser */}
        <motion.button
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenBrowser}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-sky-500/20 border border-white/[0.08] hover:border-sky-500/40 text-gray-400 hover:text-sky-400 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
          title="Browser & 1-Tap Sniffer"
        >
          <Globe className="w-4 h-4" />
        </motion.button>

        {/* File Manager */}
        <motion.button
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenFileManager}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-amber-500/20 border border-white/[0.08] hover:border-amber-500/40 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
          title="Storage File Manager"
        >
          <FolderOpen className="w-4 h-4" />
        </motion.button>

        {/* Secret Vault */}
        <motion.button
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSecretVault}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 border border-white/[0.08] hover:border-emerald-500/40 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center justify-center"
          title="Secret Private Vault"
        >
          <Shield className="w-4 h-4" />
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </motion.button>
      </div>
    </header>
  );
}
