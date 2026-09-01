import { useState } from 'react';
import { Settings, BookOpen, Star, Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export default function Header({ onOpenSettings, onScrollToSection }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onScrollToSection(sectionId);
    setMenuOpen(false);
  };

  return (
    <header className="w-full bg-neutral-dark border-b border-border-card h-16 flex items-center justify-between px-6 md:px-12 sticky top-0 z-40">
      <div 
        className="flex items-center space-x-2.5 cursor-pointer group"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setMenuOpen(false);
        }}
      >
        <div className="w-8 h-8 flex items-center justify-center subtle-glow group-hover:scale-105 transition-transform duration-300">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <span className="font-hanken font-extrabold text-xl tracking-tight text-[#e5e2e1] select-none">
          Vortex<span className="text-action-red font-medium">Downloader</span>
        </span>
      </div>

      <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center space-x-8">
        <button 
          onClick={() => handleNavClick('input-url-stage')} 
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-action-red opacity-80" />
          Downloader
        </button>
        <button 
          onClick={() => handleNavClick('vault')} 
          className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <Star className="w-4 h-4 text-action-red opacity-80" />
          Vault
        </button>
      </nav>

      <div className="flex items-center space-x-2">
        {/* Quick Preferences Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-white transition-all duration-200 rounded hover:bg-secondary-grey/40 shrink-0 border border-transparent hover:border-gray-800 cursor-pointer"
          title="Vortex Preferences"
          id="btn-open-settings"
        >
          <Settings className="w-5 h-5 hover:rotate-45 transition-transform duration-300" />
        </button>

        {/* Mobile menu hamburger toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-gray-400 hover:text-white transition-all duration-200 rounded hover:bg-secondary-grey/40 shrink-0 border border-transparent hover:border-gray-800 cursor-pointer md:hidden"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-neutral-dark/95 backdrop-blur-md border-b border-border-card flex flex-col p-4 space-y-2.5 md:hidden z-50 transition-all duration-200">
          <button 
            onClick={() => handleNavClick('input-url-stage')} 
            className="text-gray-300 hover:text-white hover:bg-secondary-grey/30 py-2.5 px-4 rounded transition-all duration-200 text-sm font-medium flex items-center gap-2 w-full text-left cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-action-red" />
            Downloader
          </button>
          <button 
            onClick={() => handleNavClick('vault')} 
            className="text-gray-300 hover:text-white hover:bg-secondary-grey/30 py-2.5 px-4 rounded transition-all duration-200 text-sm font-medium flex items-center gap-2 w-full text-left cursor-pointer"
          >
            <Star className="w-4 h-4 text-action-red" />
            Media Vault
          </button>
        </div>
      )}
    </header>
  );
}
