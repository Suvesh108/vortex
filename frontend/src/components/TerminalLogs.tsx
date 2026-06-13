import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Terminal, Copy, CheckCircle2, ChevronRight, Ban } from 'lucide-react';
import { DownloadLog } from '../types';

interface TerminalLogsProps {
  logs: DownloadLog[];
  onClear: () => void;
  visible: boolean;
  onToggle: () => void;
}

export default function TerminalLogs({ logs, onClear, visible, onToggle }: TerminalLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const copyLogsToClipboard = () => {
    const rawText = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(rawText);
  };

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden bg-black font-mono text-[11px] leading-relaxed select-text shadow-2xl">
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary-grey/40 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-action-red animate-pulse" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">VORTEX CORE STAGE LOGS</span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={copyLogsToClipboard}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800/80 transition-all"
            title="Copy logs to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onClear}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800/80 transition-all"
            title="Clear live session logs"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onToggle}
            className="text-[10px] uppercase font-bold text-action-red hover:text-red-300 transition-colors px-1"
          >
            {visible ? '[ Collapse ]' : '[ Expand Logs ]'}
          </button>
        </div>
      </div>

      {/* Console Stream content */}
      {visible && (
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: 180 }}
          exit={{ height: 0 }}
          className="p-4 overflow-y-auto space-y-1 bg-black text-gray-300 h-44"
          ref={scrollRef}
        >
          {logs.length === 0 ? (
            <div className="text-gray-600 h-full flex flex-col justify-center items-center text-center py-4">
              <ChevronRight className="w-4 h-4 text-action-red animate-bounce mb-1" />
              <p>vortex-engine waiting for link extraction...</p>
              <p className="text-[10px]">Provide target URL in input stage above to trigger diagnostics.</p>
            </div>
          ) : (
            logs.map((log) => {
              let textClass = 'text-gray-300';
              let badge = '[SYS]';

              if (log.type === 'success') {
                textClass = 'text-green-400';
                badge = '[OK ]';
              } else if (log.type === 'error') {
                textClass = 'text-red-500 font-bold';
                badge = '[ERR]';
              } else if (log.type === 'warning') {
                textClass = 'text-yellow-500';
                badge = '[WRN]';
              } else if (log.type === 'info') {
                textClass = 'text-tertiary-blue';
                badge = '[INF]';
              }

              return (
                <div key={log.id} className="flex items-start font-mono text-left">
                  <span className="text-gray-600 mr-2 select-none">[{log.time}]</span>
                  <span className={`${textClass} shrink-0 mr-2 font-bold select-none`}>{badge}</span>
                  <span className={textClass}>{log.message}</span>
                </div>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
}
