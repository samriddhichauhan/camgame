import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MessageSquare, Code2 } from 'lucide-react';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';
import { soundFx } from '../utils/SoundEffects';

export default function ContactScreen() {
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
          Contact & Support
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto bg-white border-[3px] border-slate-950 rounded-3xl p-6 sm:p-10 shadow-chunky z-10 my-auto flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-purple/15 border-2 border-slate-950 flex items-center justify-center text-brand-purple shadow-chunky-sm">
            <Mail className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase text-slate-950">
              Get in Touch
            </h1>
            <p className="font-sans text-xs text-slate-500 font-semibold">
              Feedback, Open Source & Support
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://github.com/samriddhichauhan/camgame"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-950 flex items-center gap-4 group hover:bg-slate-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-chunky-sm group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-black text-sm uppercase text-slate-950">GitHub Repository</span>
              <span className="font-mono text-xs text-slate-500">samriddhichauhan/camgame</span>
            </div>
          </a>

          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-950 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-purple text-white flex items-center justify-center shadow-chunky-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-black text-sm uppercase text-slate-950">Public Web App</span>
              <span className="font-mono text-xs text-slate-500">vybe.game (Production)</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="w-full text-center text-xs font-mono font-bold text-slate-400 uppercase z-10 mt-6">
        VYBE © 2026 • Product Contact
      </div>
    </div>
  );
}
