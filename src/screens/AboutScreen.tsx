import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Camera, Zap, Heart } from 'lucide-react';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';
import { soundFx } from '../utils/SoundEffects';

export default function AboutScreen() {
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
          About VYBE
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto bg-white border-[3px] border-slate-950 rounded-3xl p-6 sm:p-10 shadow-chunky z-10 my-auto flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-yellow border-2 border-slate-950 flex items-center justify-center text-slate-950 shadow-chunky-sm">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase text-slate-950">
              About VYBE
            </h1>
            <p className="font-sans text-xs text-slate-500 font-semibold">
              Your Camera is the Controller
            </p>
          </div>
        </div>

        <p className="font-sans text-sm text-slate-700 leading-relaxed font-semibold">
          VYBE is an interactive web-based motion party game that converts your standard computer webcam into a full-body game controller — with zero external sensors, zero downloads, and zero latency.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-950 flex flex-col gap-2">
            <Camera className="w-6 h-6 text-brand-purple" />
            <h3 className="font-display font-black text-sm uppercase">60 FPS Motion</h3>
            <p className="font-sans text-xs text-slate-550 font-semibold leading-relaxed">
              Powered by Google MediaPipe Tasks Vision tracking 33 3D body keypoints in real time.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-950 flex flex-col gap-2">
            <Zap className="w-6 h-6 text-brand-coral" />
            <h3 className="font-display font-black text-sm uppercase">3 Party Games</h3>
            <p className="font-sans text-xs text-slate-550 font-semibold leading-relaxed">
              Copy Cat (pose matching), Ice Breaker (gesture challenges), and Reaction Rush (speed racing).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-950 flex flex-col gap-2">
            <Heart className="w-6 h-6 text-brand-purple" />
            <h3 className="font-display font-black text-sm uppercase">Solo & 2-Player</h3>
            <p className="font-sans text-xs text-slate-550 font-semibold leading-relaxed">
              Play Single Player to beat your Personal Best or battle a friend head-to-head.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="w-full text-center text-xs font-mono font-bold text-slate-400 uppercase z-10 mt-6">
        VYBE © 2026 • Camera-Powered Party Gaming
      </div>
    </div>
  );
}
