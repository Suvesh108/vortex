import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Network, Copy, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

interface Aria2RpcModalProps {
  isOpen: boolean;
  onClose: () => void;
  rpcUrl?: string;
}

export default function Aria2RpcModal({ isOpen, onClose, rpcUrl = 'http://localhost:5001/jsonrpc' }: Aria2RpcModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-surface-card border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden z-10 p-5 sm:p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-hanken font-bold text-base text-white flex items-center gap-1.5">
                  <span>aria2 JSON-RPC Bridge</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-[11px] font-mono text-gray-400">
                  Direct 1-click browser extension interceptor.
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Quick Info */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs font-sans text-cyan-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-white">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Browser Extension Compatibility
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Install <strong>Aria2 Explorer</strong> or any aria2 manager extension in Chrome, Edge, or Firefox. Set the RPC URL below to capture downloads directly into Vortex with zero copy-pasting!
            </p>
          </div>

          {/* Endpoint Fields */}
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">JSON-RPC Endpoint URL</span>
              <div className="flex items-center gap-2 bg-black/60 border border-gray-800 rounded-xl px-3 py-2">
                <span className="flex-1 truncate text-white">{rpcUrl}</span>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleCopy(rpcUrl, 'url')}
                  className="p-1 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  {copied === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Host & Port</span>
                <div className="flex items-center gap-1 bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-white">
                  <span>localhost:5001</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Secret Token</span>
                <div className="flex items-center gap-1 bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-gray-400">
                  <span>None (Unrestricted)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 border-t border-gray-800/80 pt-3">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Loopback-guarded RPC endpoint with automatic SSRF filtration.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
