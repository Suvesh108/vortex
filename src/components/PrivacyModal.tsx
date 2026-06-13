import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Database, EyeOff, Globe } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
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
            className="bg-neutral-dark border border-gray-800 w-full max-w-lg rounded-lg overflow-hidden subtle-glow z-10 relative flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-surface-card">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-action-red/10 flex items-center justify-center border border-action-red/20 text-action-red">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-hanken font-bold text-lg text-white">Privacy Policy</h3>
                  <p className="text-xs text-gray-400">Clear summary of how we manage data</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 px-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-white transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-300 font-sans leading-relaxed text-left">
              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <EyeOff className="w-3.5 h-3.5 text-action-red" />
                  1. Zero Data Collection Policy
                </h4>
                <p>
                  VortexDownloader does not require user accounts, registration, or contact details to operate. We do not track, log, or store your IP addresses or download queries on any persistent database. Your requests are completely ephemeral.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5 text-action-red" />
                  2. Temporary Download Caching
                </h4>
                <p>
                  To stream downloads to your browser, files are temporarily cached on our secure server. 
                  - **Immediate Deletion:** Cached files are deleted immediately after browser delivery is completed.
                  - **Automatic Cleanups:** Any failed, abandoned, or partially completed download jobs are automatically scrubbed from the temporary cache directory every 10 minutes (with files older than 1 hour deleted automatically).
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-action-red" />
                  3. Client-Side Browser Storage
                </h4>
                <p>
                  The Service utilizes standard client-side browser storage (`localStorage`) to remember your settings preferences (such as parallel CPU download threads and auto-download options) and maintain a list of your recent download logs. This data is stored strictly on your local device and is never transmitted to our servers. You can clear this cache at any time via the UI settings.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 text-action-red" />
                  4. Interactions with Third-Party Platforms
                </h4>
                <p>
                  This Service fetches video stream information directly from external media hosting platforms (e.g. YouTube, Vimeo) to compile and deliver files. When downloading files, your request is subject to the respective external platform's Terms of Service and Privacy Policy. VortexDownloader is not affiliated with or endorsed by these platforms.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  5. Security Measures
                </h4>
                <p>
                  All active network transmissions, metadata extraction tasks, and file download streams are encrypted end-to-end via HTTPS. We implement standard security procedures to ensure no data leaks happen during active sessions.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-secondary-grey/25 text-right">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded text-xs font-bold font-hanken tracking-wide bg-action-red hover:bg-action-hover text-white transition-all duration-200"
              >
                CLOSE PRIVACY POLICY
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
