import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';
import { soundFx } from '../utils/SoundEffects';

export default function TermsScreen() {
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
          VYBE Terms of Service
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto bg-white border-[3px] border-slate-950 rounded-3xl p-6 sm:p-10 shadow-chunky z-10 my-auto flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-coral/15 border-2 border-slate-950 flex items-center justify-center text-brand-coral shadow-chunky-sm">
            <FileText className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase text-slate-950">
              Terms of Use
            </h1>
            <p className="font-sans text-xs text-slate-500 font-semibold">
              Product Usage Rules & Safety Guidelines
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs font-sans text-slate-650 leading-relaxed font-medium">
          <h2 className="font-display font-black text-base text-slate-950 uppercase">1. Physical Safety During Gameplay</h2>
          <p>
            VYBE involves physical movement (crouching, arm gestures, hand raises, dodging). Please ensure you have a clear, well-lit, unobstructed physical space around your desk or room before playing.
          </p>

          <h2 className="font-display font-black text-base text-slate-950 uppercase">2. Camera & Browser Requirements</h2>
          <p>
            VYBE requires a modern web browser supporting WebRTC camera access, HTML5 Canvas, WebGL/GPU acceleration, and Web Audio API. Secure HTTPS connection is required for production camera permissions.
          </p>

          <h2 className="font-display font-black text-base text-slate-950 uppercase">3. Intellectual Property</h2>
          <p>
            All game modes (Copy Cat, Ice Breaker, Reaction Rush), UI assets, design tokens, sound synthesizers, and code are open source under the MIT License.
          </p>
        </div>
      </motion.div>

      <div className="w-full text-center text-xs font-mono font-bold text-slate-400 uppercase z-10 mt-6">
        VYBE © 2026 • Product Terms
      </div>
    </div>
  );
}
