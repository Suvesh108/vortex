import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Scale, FileText } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-hanken font-bold text-lg text-white">Terms of Service</h3>
                  <p className="text-xs text-gray-400">Please read our legal boundaries carefully</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 px-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-white transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Terms Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-300 font-sans leading-relaxed text-left">
              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-action-red" />
                  1. Acceptance of Terms
                </h4>
                <p>
                  By accessing and using VortexDownloader ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you are prohibited from using this Service. This website serves as a technical utility for downloading and saving media.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-action-red" />
                  2. Intellectual Property & Copyright Compliance
                </h4>
                <p>
                  VortexDownloader respect the intellectual property rights of others. 
                  <strong> You are solely responsible for all content you download using this Service.</strong> 
                  You must only download media that you own, have licensing permissions to, or that constitutes legally protected fair use in your jurisdiction. Downloading copyrighted materials (such as music, movies, or commercial broadcasts) without the express permission of the copyright owner is strictly prohibited and may violate local and international laws.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  <Scale className="w-3.5 h-3.5 text-action-red" />
                  3. Personal and Fair Use
                </h4>
                <p>
                  The Service is provided exclusively for private, non-commercial, personal archiving purposes. Any redistribution, commercial broadcast, public performance, or unauthorized hosting of materials fetched via the Service is strictly the liability of the user.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  4. Disclaimer of Warranties
                </h4>
                <p>
                  VortexDownloader is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will remain uninterrupted, error-free, or compatible with remote platform restrictions (e.g. YouTube cipher revisions) indefinitely.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  5. Limitation of Liability
                </h4>
                <p>
                  In no event shall VortexDownloader, its developers, or affiliates be liable for any direct, indirect, special, punitive, or consequential damages arising out of your use, misuse, or inability to use this Service, including any legal claims, copyright actions, or bandwidth billing charges.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                  6. DMCA and Takedown Requests
                </h4>
                <p>
                  Since this site is a tool and does not host or store any public downloads on its servers, there is no index of material to take down. Any files downloaded to our temporary server cache are deleted immediately upon browser delivery or automatically scrubbed in short cycles.
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
                I ACCEPT & UNDERSTAND
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
