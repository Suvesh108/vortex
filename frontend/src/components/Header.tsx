import { Zap, Database, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: 'downloader' | 'vault';
  onSelectTab: (tab: 'downloader' | 'vault') => void;
  onOpenSettings: () => void;
  vaultCount: number;
}

export default function Header({ activeTab, onSelectTab, onOpenSettings, vaultCount }: HeaderProps) {
  const handleTabClick = (tab: 'downloader' | 'vault') => {
    onSelectTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="w-full max-w-full bg-neutral-dark/95 backdrop-blur-md border-b border-gray-800/80 h-16 flex items-center justify-between px-2.5 sm:px-6 md:px-10 sticky top-0 z-40 overflow-x-hidden">
      {/* Brand logo & title */}
      <div 
        className="flex items-center space-x-2 cursor-pointer group shrink-0 min-w-0 mr-2"
        onClick={() => handleTabClick('downloader')}
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center subtle-glow group-hover:scale-105 transition-transform duration-300 shrink-0">
          <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="vortex-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3B30" />
                <stop offset="100%" stopColor="#FF9500" />
              </linearGradient>
            </defs>
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18Z" fill="url(#vortex-logo-grad)" opacity="0.15"/>
            <path d="M12 4C7.58 4 4 7.58 4 12C4 13.52 4.42 14.94 5.16 16.16L6.86 14.46C6.48 13.73 6.27 12.89 6.27 12C6.27 8.84 8.84 6.27 12 6.27C12.89 6.27 13.73 6.48 14.46 6.86L16.16 5.16C14.94 4.42 13.52 4 12 4Z" fill="url(#vortex-logo-grad)"/>
            <path d="M12 19.73C8.84 19.73 6.27 17.16 6.27 14C6.27 13.11 6.48 12.27 6.86 11.54L5.16 9.84C4.42 11.06 4 12.48 4 14C4 18.42 7.58 22 12 22C13.52 22 14.94 21.58 16.16 20.84L14.46 19.14C13.73 19.52 12.89 19.73 12 19.73Z" fill="url(#vortex-logo-grad)" opacity="0.8"/>
            <path d="M17.14 7.84C17.52 8.57 17.73 9.41 17.73 10.3C17.73 13.46 15.16 16.03 12 16.03C11.11 16.03 10.27 15.82 9.54 15.44L7.84 17.14C9.06 17.88 10.48 18.3 12 18.3C16.42 18.3 20 14.72 20 10.3C20 8.78 19.58 7.36 18.84 6.14L17.14 7.84Z" fill="url(#vortex-logo-grad)"/>
          </svg>
        </div>
        <span className="font-hanken font-extrabold text-base sm:text-lg tracking-tight text-[#e5e2e1] select-none truncate">
          Vortex<span className="text-action-red font-medium hidden xs:inline">Downloader</span>
        </span>
      </div>

      {/* Right Controls: Tabs + Settings Button */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Navigation Switch Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-secondary-grey/30 border border-gray-800 rounded-full p-0.5 sm:p-1">
          <button 
            onClick={() => handleTabClick('downloader')} 
            className={`px-2.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              activeTab === 'downloader'
                ? 'bg-action-red text-white shadow-sm shadow-action-red/30'
                : 'text-gray-400 hover:text-white hover:bg-secondary-grey/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Downloader</span>
          </button>

          <button 
            onClick={() => handleTabClick('vault')} 
            className={`px-2.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              activeTab === 'vault'
                ? 'bg-action-red text-white shadow-sm shadow-action-red/30'
                : 'text-gray-400 hover:text-white hover:bg-secondary-grey/40'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Vault</span>
            {vaultCount > 0 && (
              <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 text-[9px] sm:text-[10px] rounded-full bg-white/20 text-white font-mono">
                {vaultCount}
              </span>
            )}
          </button>
        </nav>

        {/* Compact Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-secondary-grey/30 hover:bg-secondary-grey/60 border border-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="Settings & Preferences"
        >
          <Settings className="w-4 h-4 hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>
    </header>
  );
}
