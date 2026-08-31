import { motion, AnimatePresence } from 'motion/react';
import { X, Cpu, Sliders, Volume2, Database, Zap } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const updateField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop wrapper */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Modal box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-neutral-dark border border-gray-800 w-full max-w-md rounded-lg overflow-hidden subtle-glow z-10 relative flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-surface-card">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-action-red/10 flex items-center justify-center border border-action-red/20 text-action-red">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-hanken font-bold text-lg text-white">Engine Preferences</h3>
                  <p className="text-xs text-gray-400">Tweak Vortex download & extraction rules</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 px-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-white transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Speed Preset Limit */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase letter-wider flex items-center gap-1.5 font-mono">
                  <Zap className="w-3.5 h-3.5 text-action-red" />
                  Simulated Bandwidth Speed
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['MAX', 'HIGH', 'MED', 'LOW'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => updateField('simulatedSpeedCode', speed)}
                      className={`py-2 px-1 text-xs font-mono font-bold rounded border transition-all duration-200 ${
                        settings.simulatedSpeedCode === speed
                          ? 'bg-action-red border-action-red text-white shadow-sm shadow-action-red/20'
                          : 'bg-secondary-grey/30 border-gray-800 text-gray-400 hover:text-white hover:bg-secondary-grey/50'
                      }`}
                    >
                      {speed === 'MAX' ? 'Uncapped' : speed === 'HIGH' ? '12 MB/s' : speed === 'MED' ? '4 MB/s' : '1.5 MB/s'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 font-sans">
                  Controls how quickly downloads simulate in the active progress bar tracker.
                </p>
              </div>

              {/* Threat splits CPU */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-gray-300 uppercase letter-wider flex items-center gap-1.5 font-mono">
                  <Cpu className="w-3.5 h-3.5 text-action-red" />
                  Parallel Fetch Threads ({settings.defaultThreads} splits)
                </label>
                <input
                  type="range"
                  min="2"
                  max="32"
                  step="2"
                  value={settings.defaultThreads}
                  onChange={(e) => updateField('defaultThreads', Number(e.target.value))}
                  className="w-full accent-action-red cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                  <span>2 Threads (Slower)</span>
                  <span>16 (Optimal)</span>
                  <span>32 Threads (Extreme)</span>
                </div>
              </div>

              {/* MP3 Audio Sample conversion rate */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase letter-wider flex items-center gap-1.5 font-mono">
                  <Volume2 className="w-3.5 h-3.5 text-action-red" />
                  Audio Sample Conversion Rate
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[44.1, 48, 96].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => updateField('sampleRatekHz', rate)}
                      className={`py-2 text-xs font-mono rounded border transition-all duration-200 ${
                        settings.sampleRatekHz === rate
                          ? 'bg-action-red border-action-red text-white'
                          : 'bg-secondary-grey/30 border-gray-800 text-gray-400 hover:text-white hover:bg-secondary-grey/50'
                      }`}
                    >
                      {rate} kHz
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle rules */}
              <div className="space-y-4 pt-2 border-t border-gray-800 font-sans">
                {/* Auto download */}
                <label className="flex items-start cursor-pointer group">
                  <div className="relative flex items-center pt-0.5">
                    <input
                      type="checkbox"
                      checked={settings.autoDownload}
                      onChange={(e) => updateField('autoDownload', e.target.checked)}
                      className="rounded border-gray-800 text-action-red focus:ring-0 w-4 h-4 accent-action-red"
                    />
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                      Immediate Browser Delivery
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Automatically triggers web-browser save-dialog upon completion of internal Vortex container multiplexing.
                    </p>
                  </div>
                </label>

                {/* Local storage history */}
                <label className="flex items-start cursor-pointer group">
                  <div className="relative flex items-center pt-0.5">
                    <input
                      type="checkbox"
                      checked={settings.saveHistory}
                      onChange={(e) => updateField('saveHistory', e.target.checked)}
                      className="rounded border-gray-800 text-action-red focus:ring-0 w-4 h-4 accent-action-red"
                    />
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                      Maintain Archive History
                    </span>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Database className="w-3 h-3 inline text-action-red" />
                      Saves successfully downloaded links in standard client-side browser storage (localStorage).
                    </p>
                  </div>
                </label>

                {/* Custom Backend URL */}
                <div className="space-y-1.5 pt-2 border-t border-gray-800 font-sans">
                  <label className="text-xs font-semibold text-gray-300 uppercase letter-wider flex items-center gap-1.5 font-mono">
                    <Sliders className="w-3.5 h-3.5 text-action-red" />
                    Custom Python / Cloud Backend URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://vortex-backend.onrender.com"
                    value={settings.backendUrl || ''}
                    onChange={(e) => updateField('backendUrl', e.target.value)}
                    className="w-full bg-secondary-grey/40 border border-gray-800 rounded px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-action-red"
                  />
                  <p className="text-[11px] text-gray-500">
                    Leave blank to use the built-in standalone extraction engine.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-gray-800 bg-secondary-grey/25 text-right">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded text-xs font-bold font-hanken tracking-wide bg-action-red hover:bg-action-hover text-white transition-all duration-200 shadow-lg shadow-action-red/10"
              >
                APPLY PREFERENCES
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
