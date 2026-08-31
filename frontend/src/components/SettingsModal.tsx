import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Cpu, 
  Sliders, 
  Volume2, 
  Database, 
  Zap, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  Bell, 
  FolderCheck,
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { UserSettings } from '../types';
import { checkForAppUpdates, UpdateInfo, APP_VERSION } from '../updater';
import { requestAppPermissions, AppPermissionStatus } from '../permissions';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [permissionStatus, setPermissionStatus] = useState<AppPermissionStatus>({
    storage: 'prompt',
    notifications: 'prompt'
  });
  const [requestingPerms, setRequestingPerms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check permissions status when opened
      requestAppPermissions().then(setPermissionStatus).catch(() => {});
    }
  }, [isOpen]);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateError(null);
    try {
      const info = await checkForAppUpdates();
      setUpdateInfo(info);
    } catch (e: any) {
      setUpdateError(e.message || 'Failed to check for updates.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleRequestPermissions = async () => {
    setRequestingPerms(true);
    try {
      const status = await requestAppPermissions();
      setPermissionStatus(status);
    } finally {
      setRequestingPerms(false);
    }
  };

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
            className="bg-neutral-dark border border-gray-800 w-full max-w-lg rounded-lg overflow-hidden subtle-glow z-10 relative flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-surface-card">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-action-red/10 flex items-center justify-center border border-action-red/20 text-action-red">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-hanken font-bold text-lg text-white">App Preferences & Updates</h3>
                  <p className="text-xs text-gray-400">Manage Vortex engine, permissions & version</p>
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
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              
              {/* 1. App Updates Section */}
              <div className="bg-secondary-grey/20 border border-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-action-red" />
                    <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                      Vortex Downloader Version
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-action-red/20 text-action-red border border-action-red/30">
                    {APP_VERSION}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400">
                    Check for official releases & APK updates on GitHub.
                  </p>
                  <button
                    type="button"
                    onClick={handleCheckUpdate}
                    disabled={checkingUpdate}
                    className="px-3 py-1.5 bg-secondary-grey/50 hover:bg-secondary-grey border border-gray-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin text-action-red' : ''}`} />
                    {checkingUpdate ? 'Checking...' : 'Check for Updates'}
                  </button>
                </div>

                {/* Update Result Alert */}
                {updateInfo && (
                  <div className={`mt-2 p-3 rounded text-xs border ${
                    updateInfo.hasUpdate 
                      ? 'bg-action-red/10 border-action-red/30 text-gray-200' 
                      : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  }`}>
                    {updateInfo.hasUpdate ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-white">
                            <AlertCircle className="w-4 h-4 text-action-red" />
                            New Update Available: {updateInfo.latestVersion}
                          </div>
                          <span className="text-[10px] text-gray-400">{updateInfo.publishedAt}</span>
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-2">
                          {updateInfo.releaseNotes}
                        </p>
                        <div className="pt-1 flex gap-2">
                          <a
                            href={updateInfo.apkDownloadUrl || updateInfo.releaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-action-red hover:bg-action-hover text-white rounded font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download APK ({updateInfo.latestVersion})
                          </a>
                          <a
                            href={updateInfo.releaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-secondary-grey/60 hover:bg-secondary-grey text-gray-300 rounded text-xs flex items-center gap-1 transition-all"
                          >
                            Release Notes <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>You are running the latest version of Vortex Downloader (<strong>{APP_VERSION}</strong>).</span>
                      </div>
                    )}
                  </div>
                )}

                {updateError && (
                  <div className="p-2.5 bg-red-950/30 border border-red-800/40 rounded text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}
              </div>

              {/* 2. Android App Permissions Section (Storage & Notifications) */}
              <div className="bg-secondary-grey/20 border border-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-action-red" />
                    <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                      Android Device Permissions
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestPermissions}
                    disabled={requestingPerms}
                    className="px-2.5 py-1 bg-action-red/10 hover:bg-action-red/20 text-action-red border border-action-red/30 rounded text-xs font-medium transition-colors cursor-pointer"
                  >
                    {requestingPerms ? 'Requesting...' : 'Request Permissions'}
                  </button>
                </div>

                <div className="space-y-2 pt-1 font-sans">
                  {/* Storage permission status */}
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-dark/60 border border-gray-800/80">
                    <div className="flex items-center gap-2.5">
                      <FolderCheck className="w-4 h-4 text-action-red" />
                      <div>
                        <p className="text-xs font-medium text-white">Local Device Storage</p>
                        <p className="text-[11px] text-gray-500">Save extracted 4K/1080p video & MP3 audio to phone storage</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                      permissionStatus.storage === 'granted'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                        : 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                    }`}>
                      {permissionStatus.storage === 'granted' ? 'Allowed' : 'Required for Download'}
                    </span>
                  </div>

                  {/* Notification permission status */}
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-dark/60 border border-gray-800/80">
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-action-red" />
                      <div>
                        <p className="text-xs font-medium text-white">Push Notifications</p>
                        <p className="text-[11px] text-gray-500">Alert and notify when media download & multiplexing finishes</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                      permissionStatus.notifications === 'granted'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                        : 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                    }`}>
                      {permissionStatus.notifications === 'granted' ? 'Allowed' : 'Optional'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Speed Preset Limit */}
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
                  Controls bandwidth allocation in the active progress tracker.
                </p>
              </div>

              {/* 4. Threat splits CPU */}
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

              {/* 5. MP3 Audio Sample conversion rate */}
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

              {/* 6. Toggle rules */}
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
                      Immediate Device Delivery
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Automatically saves media to local storage upon extraction completion.
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
                      Maintain Local Archive History
                    </span>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Database className="w-3 h-3 inline text-action-red" />
                      Saves successfully downloaded links in local device storage.
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
                className="px-5 py-2 rounded text-xs font-bold font-hanken tracking-wide bg-action-red hover:bg-action-hover text-white transition-all duration-200 shadow-lg shadow-action-red/10 cursor-pointer"
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
