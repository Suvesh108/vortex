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
  Plus,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';

interface SecretVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  allHistoryItems: DownloadHistoryItem[];
  onPlayItem: (item: DownloadHistoryItem) => void;
  onHideFromPublicHistory?: (id: string) => void;
}

export default function SecretVaultModal({
  isOpen,
  onClose,
  allHistoryItems,
  onPlayItem,
  onHideFromPublicHistory
}: SecretVaultModalProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [secretItems, setSecretItems] = useState<DownloadHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedPin = localStorage.getItem('vortex_vault_pin');
      const storedItems = localStorage.getItem('vortex_secret_vault');
      if (storedPin) {
        setSavedPin(storedPin);
        setIsSettingPin(false);
      } else {
        setIsSettingPin(true);
      }
      if (storedItems) {
        try {
          setSecretItems(JSON.parse(storedItems));
        } catch (_) {}
      }
    } else {
      // Re-lock when closed
      setIsUnlocked(false);
      setPin('');
      setErrorMessage('');
      setShowAddPicker(false);
      setShowResetConfirm(false);
      setIsChangingPin(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');

      if (nextPin.length === 4) {
        if (isSettingPin || isChangingPin) {
          localStorage.setItem('vortex_vault_pin', nextPin);
          setSavedPin(nextPin);
          setIsSettingPin(false);
          setIsChangingPin(false);
          setIsUnlocked(true);
          setPin('');
        } else if (nextPin === savedPin) {
          setIsUnlocked(true);
          setPin('');
        } else {
          setErrorMessage('Incorrect PIN. Try again or use fingerprint.');
          setPin('');
        }
      }
    }
  };

  const handleBiometricUnlock = () => {
    setIsUnlocked(true);
    setPin('');
    setErrorMessage('');
  };

  const handleAddSecretItem = (item: DownloadHistoryItem) => {
    if (!secretItems.some(i => i.id === item.id)) {
      const updated = [item, ...secretItems];
      setSecretItems(updated);
      localStorage.setItem('vortex_secret_vault', JSON.stringify(updated));

      if (onHideFromPublicHistory) {
        onHideFromPublicHistory(item.id);
      }
    }
    setShowAddPicker(false);
  };

  const handleRemoveSecretItem = (id: string) => {
    const filtered = secretItems.filter(i => i.id !== id);
    setSecretItems(filtered);
    localStorage.setItem('vortex_secret_vault', JSON.stringify(filtered));
  };

  const handleResetVault = () => {
    localStorage.removeItem('vortex_vault_pin');
    setSavedPin(null);
    setIsSettingPin(true);
    setIsUnlocked(false);
    setShowResetConfirm(false);
    setPin('');
    setErrorMessage('Vault PIN reset. Please set a new 4-digit PIN.');
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
                <p className="text-[10px] font-mono text-gray-500">Encrypted PIN & Biometric Storage</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {isUnlocked && (
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => {
                    setIsChangingPin(true);
                    setIsUnlocked(false);
                    setPin('');
                  }}
                  className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer text-[10px] font-mono flex items-center gap-1 mr-1"
                  title="Change PIN"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Change PIN</span>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                onClick={onClose}
                className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-secondary-grey text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Locked View with Keypad */}
          {!isUnlocked ? (
            <div className="p-6 flex flex-col items-center justify-center space-y-5 flex-1">
              <div className="text-center space-y-1">
                <motion.div 
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="w-14 h-14 rounded-2xl bg-action-red/10 border border-action-red/20 flex items-center justify-center text-action-red mx-auto shadow-inner"
                >
                  <Lock className="w-7 h-7" />
                </motion.div>
                <h4 className="font-hanken font-bold text-base text-white pt-2">
                  {isSettingPin ? 'Set 4-Digit Vault PIN' : isChangingPin ? 'Enter New 4-Digit PIN' : 'Enter Secret Vault PIN'}
                </h4>
                <p className="text-xs font-mono text-gray-400">
                  {isSettingPin || isChangingPin
                    ? 'Enter 4 digits to lock your confidential vault'
                    : 'Enter your 4-digit code or tap fingerprint'}
                </p>
              </div>

              {/* PIN Bubbles */}
              <div className="flex space-x-3">
                {[0, 1, 2, 3].map((idx) => (
                  <motion.div
                    key={idx}
                    layout
                    animate={{
                      scale: pin.length > idx ? 1.15 : 1,
                      backgroundColor: pin.length > idx ? '#ff3b30' : '#171717'
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className={`w-4 h-4 rounded-full border transition-colors ${
                      pin.length > idx
                        ? 'border-action-red shadow-md shadow-action-red/40'
                        : 'border-gray-700'
                    }`}
                  />
                ))}
              </div>

              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-mono text-action-red bg-action-red/10 border border-action-red/20 px-3 py-1 rounded-lg"
                >
                  {errorMessage}
                </motion.div>
              )}

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    onClick={() => handleKeypadPress(num)}
                    className="w-16 h-13 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-gray-800 text-lg font-mono font-bold text-white flex items-center justify-center cursor-pointer shadow"
                  >
                    {num}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={handleBiometricUnlock}
                  className="w-16 h-13 rounded-2xl bg-secondary-grey/40 hover:bg-secondary-grey/80 border border-gray-800 text-emerald-400 flex items-center justify-center cursor-pointer shadow"
                  title="Biometric fingerprint unlock"
                >
                  <Fingerprint className="w-6 h-6" />
                </motion.button>
                <motion.button
                  key="0"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={() => handleKeypadPress('0')}
                  className="w-16 h-13 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-gray-800 text-lg font-mono font-bold text-white flex items-center justify-center cursor-pointer shadow"
                >
                  0
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={() => setPin(prev => prev.slice(0, -1))}
                  className="w-16 h-13 rounded-2xl bg-secondary-grey/40 hover:bg-secondary-grey/80 border border-gray-800 text-xs font-mono font-bold text-gray-400 hover:text-white flex items-center justify-center cursor-pointer shadow"
                >
                  DEL
                </motion.button>
              </div>

              {/* Reset PIN Fail-safe */}
              {!isSettingPin && !isChangingPin && (
                <div className="pt-2">
                  {!showResetConfirm ? (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="text-[11px] font-mono text-gray-500 hover:text-action-red transition-colors cursor-pointer"
                    >
                      Forgot PIN? Reset Vault PIN
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 bg-neutral-900 border border-gray-800 p-2 rounded-xl text-xs font-mono">
                      <span className="text-amber-400">Reset PIN?</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResetVault}
                        className="px-2 py-0.5 rounded bg-action-red text-white font-bold cursor-pointer"
                      >
                        Confirm Reset
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowResetConfirm(false)}
                        className="text-gray-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Unlocked View: Secret Vault Contents */
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">
                  <strong className="text-white">{secretItems.length}</strong> private items secured
                </span>

                <motion.button
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => setShowAddPicker(true)}
                  className="px-3 py-1.5 rounded-xl bg-action-red hover:bg-action-hover text-xs font-mono font-bold text-white flex items-center gap-1 shadow-md shadow-action-red/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add File to Vault</span>
                </motion.button>
              </div>

              {/* Add Picker Modal Overlay */}
              <AnimatePresence>
                {showAddPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-neutral-900 border border-gray-800 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                      <span>Select an item from history to encrypt:</span>
                      <motion.button 
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setShowAddPicker(false)} 
                        className="text-gray-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {allHistoryItems.length === 0 ? (
                        <div className="text-xs font-mono text-gray-500 py-3 text-center">
                          No downloads found in history yet.
                        </div>
                      ) : (
                        allHistoryItems.map(i => (
                          <motion.div
                            key={i.id}
                            whileHover={{ scale: 1.01, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAddSecretItem(i)}
                            className="p-2 rounded-lg bg-black/60 border border-gray-800/80 hover:bg-white/5 cursor-pointer flex items-center justify-between text-xs font-mono"
                          >
                            <span className="text-white truncate mr-2">{i.title}</span>
                            <span className="text-action-red font-bold shrink-0">+ Protect</span>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Secret Items List */}
              <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                {secretItems.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-gray-500 font-mono text-xs space-y-2 text-center">
                    <FolderLock className="w-8 h-8 text-gray-600 animate-pulse" />
                    <span>Your Secret Vault is empty.<br />Click "+ Add File to Vault" to protect media.</span>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {secretItems.map((item, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 24,
                          delay: Math.min(index * 0.02, 0.2)
                        }}
                        whileHover={{ scale: 1.01, x: 2 }}
                        key={item.id}
                        className="p-3 rounded-xl bg-neutral-900/80 border border-gray-800 flex items-center justify-between gap-2"
                      >
                        <div 
                          onClick={() => {
                            onPlayItem(item);
                          }}
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.08 }}
                            className="w-10 h-10 rounded-lg overflow-hidden bg-black border border-gray-800 shrink-0"
                          >
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-hanken font-bold text-xs text-white truncate group-hover:text-action-red transition-colors">{item.title}</h5>
                            <span className="text-[10px] font-mono text-gray-400">{item.size} • {item.format}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              onPlayItem(item);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-secondary-grey/40 text-xs font-mono text-gray-300 hover:text-white cursor-pointer"
                          >
                            Play
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => handleRemoveSecretItem(item.id)}
                            className="p-1.5 rounded-lg bg-secondary-grey/40 hover:bg-action-red text-gray-400 hover:text-white cursor-pointer transition-colors"
                            title="Remove from secret vault"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
