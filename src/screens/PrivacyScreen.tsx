import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Camera, Lock, EyeOff } from 'lucide-react';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';
import { soundFx } from '../utils/SoundEffects';

export default function PrivacyScreen() {
  const navigate = useNavigate();

  return (
    <div className="relative w-screen min-h-screen overflow-y-auto bg-bg-cream text-slate-800 p-4 sm:p-8 select-none flex flex-col justify-between">
      <PlayfulBackgroundShapes />

      {/* Header */}
      <div className="w-full flex items-center justify-between z-10 max-w-4xl mx-auto mb-6">
        <button
          onClick={() => {
            soundFx.playClickSound();
            navigate('/');
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-xs uppercase tracking-wider cursor-pointer hover:-translate-y-0.5 shadow-chunky-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
          <span>Home</span>
        </button>

        <div className="text-xs font-mono font-black tracking-widest text-slate-400 uppercase">
          VYBE Privacy Architecture
        </div>
      </div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto bg-white border-[3px] border-slate-950 rounded-3xl p-6 sm:p-10 shadow-chunky z-10 my-auto flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-purple/15 border-2 border-slate-950 flex items-center justify-center text-brand-purple shadow-chunky-sm">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase text-slate-950">
              Privacy Policy & Security
            </h1>
            <p className="font-sans text-xs text-slate-500 font-semibold">
              100% Local Browser-Based Processing • Zero Server Frame Uploads
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-950 flex flex-col gap-2">
            <Camera className="w-6 h-6 text-brand-purple" />
            <h3 className="font-display font-black text-sm uppercase">Local Camera Stream</h3>
            <p className="font-sans text-xs text-slate-550 font-semibold leading-relaxed">
              Your video frames are decoded inside your browser instance and never leave your device.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-950 flex flex-col gap-2">
            <Lock className="w-6 h-6 text-brand-coral" />
            <h3 className="font-display font-black text-sm uppercase">No Cloud Storage</h3>
            <p className="font-sans text-xs text-slate-550 font-semibold leading-relaxed">
              We do not record, store, or transmit video feeds or body images to remote cloud servers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-950 flex flex-col gap-2">
            <EyeOff className="w-6 h-6 text-brand-yellow" />
            <h3 className="font-display font-black text-sm uppercase">No Facial Recognition</h3>
            <p className="font-sans text-xs text-slate-550 font-semibold leading-relaxed">
              VYBE tracks anonymous 3D body joints (wrists, elbows, shoulders) strictly for game motion matching.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs font-sans text-slate-650 leading-relaxed font-medium border-t border-slate-200 pt-6">
          <h2 className="font-display font-black text-lg text-slate-950 uppercase">Data Collection & Storage</h2>
          <p>
            VYBE uses standard browser <code>localStorage</code> solely to save your local Personal Best (PB) high scores. No personal identifiers, tracking cookies, or advertising IDs are collected.
          </p>
          <p>
            Camera access permissions are managed directly by your web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari) and can be revoked at any time via your browser address bar settings.
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="w-full text-center text-xs font-mono font-bold text-slate-400 uppercase z-10 mt-6">
        VYBE © 2026 • Privacy-First Camera Games
      </div>
    </div>
  );
}
