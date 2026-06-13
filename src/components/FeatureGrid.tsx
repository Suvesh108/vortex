import { Clipboard, SlidersHorizontal, ArrowDownCircle, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export default function FeatureGrid() {
  return (
    <section className="space-y-16">
      {/* 3 Step Interactive Workflow Guideline */}
      <div id="guide" className="scroll-mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Step 01 */}
          <div className="space-y-4 group">
            <div className="flex items-baseline space-x-3">
              <span className="font-hanken font-extrabold text-6xl text-gray-800/40 select-none group-hover:text-action-red/30 transition-colors duration-300">
                01
              </span>
              <h3 className="font-hanken font-bold text-xl text-[#e5e2e1] group-hover:text-white transition-colors">
                Paste
              </h3>
            </div>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              Copy the URL of the media content you wish to archive and paste it into the secure Vortex input stage above. Fits URLs from any major platform automatically.
            </p>
          </div>

          {/* Step 02 */}
          <div className="space-y-4 group">
            <div className="flex items-baseline space-x-3">
              <span className="font-hanken font-extrabold text-6xl text-gray-800/40 select-none group-hover:text-tertiary-blue/30 transition-colors duration-300">
                02
              </span>
              <h3 className="font-hanken font-bold text-xl text-[#e5e2e1] group-hover:text-white transition-colors">
                Choose
              </h3>
            </div>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              Select your preferred resolution or format preset. Our background multi-thread scanner catalogs and buffers the highest available bitrates for clear quality.
            </p>
          </div>

          {/* Step 03 */}
          <div className="space-y-4 group">
            <div className="flex items-baseline space-x-3">
              <span className="font-hanken font-extrabold text-6xl text-gray-800/40 select-none group-hover:text-amber-500/30 transition-colors duration-300">
                03
              </span>
              <h3 className="font-hanken font-bold text-xl text-[#e5e2e1] group-hover:text-white transition-colors">
                Download
              </h3>
            </div>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              Hit download and experience lightning-fast multiplexing directly to your computer. File delivery triggers instantly to preserve deep-bitrate file architectures.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Features Spotlight */}
      <div id="features" className="border-t border-gray-800 pt-16 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
          <span className="text-[10px] font-mono font-extrabold text-action-red bg-action-red/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Vortex Engine Technologies
          </span>
          <h2 className="font-hanken font-extrabold text-2xl md:text-3xl text-white tracking-tight">
            High-Octane Core Architecture
          </h2>
          <p className="text-xs text-gray-400 font-sans">
            Designed for professional researchers, media editors, and creators who demand precision and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-surface-card border border-gray-800/60 p-6 rounded-lg space-y-4 hover:border-gray-800 transition-all duration-200">
            <div className="w-10 h-10 rounded bg-action-red/10 flex items-center justify-center text-action-red">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-hanken font-bold text-md text-[#e5e2e1]">Multiplex Direct Engine</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Separates audio and video video tracks to fetch them simultaneously across parallel TCP tunnels, multiplexing them back on-the-fly to secure maximum speed.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-card border border-gray-800/60 p-6 rounded-lg space-y-4 hover:border-gray-800 transition-all duration-200">
            <div className="w-10 h-10 rounded bg-tertiary-blue/10 flex items-center justify-center text-tertiary-blue">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-hanken font-bold text-md text-[#e5e2e1]">Sandbox Extraction Safety</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              All remote stream crawls run within our sandboxed architecture, scrubbing tracker payloads, referral ads, and analytics telemetry to keep your storage safe.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-card border border-gray-800/60 p-6 rounded-lg space-y-4 hover:border-gray-800 transition-all duration-200">
            <div className="w-10 h-10 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h4 className="font-hanken font-bold text-md text-[#e5e2e1]">Lossless Metadata Tagging</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Injects premium covert tagging (Artist title, High definition original thumbnails, catalog IDs) directly into the file metadata tags automatically.
            </p>
          </div>
        </div>
      </div>


    </section>
  );
}
