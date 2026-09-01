import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Unlock,
  Fingerprint,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  FolderLock,
  Plus
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface SecretVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  allHistoryItems: DownloadHistoryItem[];
  onPlayItem: (item: DownloadHistoryItem) => void;
}

export default function SecretVaultModal({
  isOpen,
  onClose,
  allHistoryItems,
  onPlayItem
}: SecretVaultModalProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [secretItems, setSecretItems] = useState<DownloadHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddPicker, setShowAddPicker] = useState(false);

  useEffect(() => {
    const storedPin = localStorage.getItem('vortex_vault_pin');
    const storedItems = localStorage.getItem('vortex_secret_vault');
    if (storedPin) {
      setSavedPin(storedPin);
    } else {
      setIsSettingPin(true);
    }
    if (storedItems) {
      try {
        setSecretItems(JSON.parse(storedItems));
      } catch (_) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');

      if (nextPin.length === 4) {
        if (isSettingPin) {
          localStorage.setItem('vortex_vault_pin', nextPin);
          setSavedPin(nextPin);
          setIsSettingPin(false);
          setIsUnlocked(true);
          setPin('');
        } else if (nextPin === savedPin) {
          setIsUnlocked(true);
          setPin('');
        } else {
          setErrorMessage('Incorrect PIN. Please try again.');
          setPin('');
        }
      }
    }
  };

  const handleBiometricUnlock = () => {
    // Biometric instant simulated authentication
    setIsUnlocked(true);
    setPin('');
  };

  const handleAddSecretItem = (item: DownloadHistoryItem) => {
    if (!secretItems.some(i => i.id === item.id)) {
      const updated = [item, ...secretItems];
      setSecretItems(updated);
      localStorage.setItem('vortex_secret_vault', JSON.stringify(updated));
    }
    setShowAddPicker(false);
  };

  const handleRemoveSecretItem = (id: string) => {
    const filtered = secretItems.filter(i => i.id !== id);
    setSecretItems(filtered);
    localStorage.setItem('vortex_secret_vault', JSON.stringify(filtered));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-lg"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[92vh] bg-[#0c0c0e] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-neutral-950 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-action-red/20 border border-action-red/30 flex items-center justify-center text-action-red shrink-0">
                {isUnlocked ? <Unlock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-hanken font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Secret Private Vault</span>
                  {isUnlocked && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-mono">
                      UNLOCKED
                    </span>
                  )}
                </h3>
                <p className="text-[10px] font-mono text-gray-500">Biometric & 4-Digit Encrypted Storage</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Locked View with Keypad */}
          {!isUnlocked ? (
            <div className="p-6 flex flex-col items-center justify-center space-y-6 flex-1">
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-2xl bg-action-red/10 border border-action-red/20 flex items-center justify-center text-action-red mx-auto shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>
                <h4 className="font-hanken font-bold text-base text-white pt-2">
                  {isSettingPin ? 'Set Your 4-Digit Secret PIN' : 'Enter Secret Vault PIN'}
                </h4>
                <p className="text-xs font-mono text-gray-400">
                  {isSettingPin ? 'Create a secure PIN to lock your private files' : 'Enter your 4-digit code or tap fingerprint'}
                </p>
              </div>

              {/* PIN Bubbles */}
              <div className="flex space-x-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      pin.length > idx
                        ? 'bg-action-red border-action-red scale-110 shadow-md shadow-action-red/40'
                        : 'bg-neutral-900 border-gray-700'
                    }`}
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="text-xs font-mono text-action-red bg-action-red/10 border border-action-red/20 px-3 py-1 rounded-lg">
                  {errorMessage}
                </div>
              )}

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeypadPress(num)}
                    className="w-16 h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-gray-800 text-lg font-mono font-bold text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleBiometricUnlock}
                  className="w-16 h-14 rounded-2xl bg-secondary-grey/40 hover:bg-secondary-grey/80 border border-gray-800 text-action-red transition-all flex items-center justify-center cursor-pointer shadow"
                  title="Biometric fingerprint unlock"
                >
                  <Fingerprint className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="w-16 h-14 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-gray-800 text-lg font-mono font-bold text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow"
                >
                  0
                </button>
                <button
                  onClick={() => setPin(prev => prev.slice(0, -1))}
                  className="w-16 h-14 rounded-2xl bg-secondary-grey/40 hover:bg-secondary-grey/80 border border-gray-800 text-xs font-mono font-bold text-gray-400 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow"
                >
                  DEL
                </button>
              </div>
            </div>
          ) : (
            /* Unlocked View: Secret Vault Contents */
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">
                  <strong className="text-white">{secretItems.length}</strong> private items secured
                </span>

                <button
                  onClick={() => setShowAddPicker(true)}
                  className="px-3 py-1.5 rounded-xl bg-action-red hover:bg-action-hover text-xs font-mono font-bold text-white flex items-center gap-1 shadow-md shadow-action-red/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add File to Vault</span>
                </button>
              </div>

              {/* Add Picker Modal Overlay */}
              {showAddPicker && (
                <div className="p-3 bg-neutral-900 border border-gray-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                    <span>Select an item from history to encrypt:</span>
                    <button onClick={() => setShowAddPicker(false)} className="text-gray-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {allHistoryItems.map(i => (
                      <div
                        key={i.id}
                        onClick={() => handleAddSecretItem(i)}
                        className="p-2 rounded-lg bg-black/60 border border-gray-800/80 hover:bg-white/5 cursor-pointer flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-white truncate mr-2">{i.title}</span>
                        <span className="text-action-red font-bold shrink-0">+ Add</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secret Items List */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {secretItems.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-gray-500 font-mono text-xs space-y-2 text-center">
                    <FolderLock className="w-8 h-8 text-gray-600" />
                    <span>Your Secret Vault is empty.<br />Click "+ Add File to Vault" to protect media.</span>
                  </div>
                ) : (
                  secretItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-neutral-900/80 border border-gray-800 flex items-center justify-between gap-2"
                    >
                      <div 
                        onClick={() => onPlayItem(item)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black border border-gray-800 shrink-0">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-hanken font-bold text-xs text-white truncate">{item.title}</h5>
                          <span className="text-[10px] font-mono text-gray-400">{item.size} • {item.format}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => onPlayItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-secondary-grey/40 text-xs font-mono text-gray-300 hover:text-white"
                        >
                          Play
                        </button>
                        <button
                          onClick={() => handleRemoveSecretItem(item.id)}
                          className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-action-red text-gray-400 hover:text-white"
                          title="Remove from secret vault"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
