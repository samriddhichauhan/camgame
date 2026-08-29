import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Camera } from 'lucide-react';
import VYBELogo from '../components/VYBELogo';
import StartGameButton from '../components/StartGameButton';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';
import { soundFx } from '../utils/SoundEffects';

export default function StartGameScreen() {
  const navigate = useNavigate();

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleStart = () => {
    soundFx.playClickSound();
    navigate('/mode');
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 140,
        damping: 14,
      },
    },
  };

  const previewBoxVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 14,
        delay: 0.3,
      },
    },
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-cream text-slate-800 p-6 sm:p-8 select-none">
      
      {/* Playful Floating Shapes Background */}
      <PlayfulBackgroundShapes />

      {/* Top Section: Header & Branding */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center z-10 w-full"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-2">
          <VYBELogo />
        </motion.div>

        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className="font-sans font-bold text-xs sm:text-sm tracking-[0.2em] uppercase text-slate-500 max-w-sm text-center"
        >
          Camera-powered party games where YOU are the controller
        </motion.p>
      </motion.div>

      {/* Middle Section: Stylized Camera Preview / Illustration Card */}
      <motion.div
        variants={previewBoxVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-[4/3] rounded-3xl bg-white border-[3px] border-slate-900 shadow-chunky flex flex-col items-center justify-center p-4 z-10"
      >
        {/* Viewfinder HUD Accents */}
        <div className="absolute top-4 left-4 w-5 h-5 border-t-4 border-l-4 border-slate-900 rounded-tl" />
        <div className="absolute top-4 right-4 w-5 h-5 border-t-4 border-r-4 border-slate-900 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-5 h-5 border-b-4 border-l-4 border-slate-900 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-5 h-5 border-b-4 border-r-4 border-slate-900 rounded-br" />

        {/* Blinking camera HUD tag */}
        <div className="absolute top-5 left-10 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-full text-[9px] font-mono font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-coral animate-pulse" />
          <span>PLAYER CAM</span>
        </div>

        {/* Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08]">
          <div className="w-8 h-[2px] bg-slate-900" />
          <div className="h-8 w-[2px] bg-slate-900" />
        </div>

        {/* Playful Vector Characters in Camera Viewport */}
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full p-2"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sparkles / Stars in Viewport */}
          <g className="text-brand-yellow">
            <path d="M100 60 L102 67 L109 69 L102 71 L100 78 L98 71 L91 69 L98 67 Z" fill="currentColor" opacity="0.8" />
            <path d="M300 70 L301.5 75 L307 76.5 L301.5 78 L300 83 L298.5 78 L293 76.5 L298.5 75 Z" fill="currentColor" opacity="0.8" />
            <path d="M200 45 L202.5 53 L211 55 L202.5 57 L200 65 L197.5 57 L189 55 L197.5 53 Z" fill="currentColor" className="text-brand-coral" />
          </g>

          {/* Dotted Connection/Gesture line between players */}
          <path
            d="M135 150 C 200 130, 200 130, 265 150"
            stroke="#64748b"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <circle cx="200" cy="138" r="6" fill="#4ade80" />

          {/* Player 1 (Purple Silhouette - Left) */}
          <g>
            <path
              d="M105 240 C105 210 115 170 135 170 C155 170 165 210 165 240 Z"
              fill="var(--color-brand-purple)"
              stroke="#0f172a"
              strokeWidth="3"
            />
            <path
              d="M110 190 Q90 160 95 140 Q100 120 115 145 Z"
              fill="var(--color-brand-purple)"
              stroke="#0f172a"
              strokeWidth="3"
            />
            <circle
              cx="135"
              cy="135"
              r="22"
              fill="var(--color-brand-purple)"
              stroke="#0f172a"
              strokeWidth="3"
            />
            <circle cx="127" cy="133" r="3" fill="#ffffff" />
            <circle cx="137" cy="133" r="3" fill="#ffffff" />
            <path d="M129 143 Q132 146 135 143" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Player 2 (Coral Silhouette - Right) */}
          <g>
            <path
              d="M235 240 C235 210 245 170 265 170 C285 170 295 210 295 240 Z"
              fill="var(--color-brand-coral)"
              stroke="#0f172a"
              strokeWidth="3"
            />
            <path
              d="M290 190 Q310 160 305 140 Q300 120 285 145 Z"
              fill="var(--color-brand-coral)"
              stroke="#0f172a"
              strokeWidth="3"
            />
            <circle
              cx="265"
              cy="135"
              r="22"
              fill="var(--color-brand-coral)"
              stroke="#0f172a"
              strokeWidth="3"
            />
            <circle cx="257" cy="133" r="3" fill="#ffffff" />
            <circle cx="267" cy="133" r="3" fill="#ffffff" />
            <path d="M259 143 Q262 146 265 143" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>

        {/* Small floating HUD details */}
        <div className="absolute bottom-5 text-[10px] font-display font-black text-slate-700 tracking-wider flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5" />
          <span>POSITION DETECTED</span>
        </div>
      </motion.div>

      {/* Bottom Section: Taglines, CTA Button, and Info capsule */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center w-full z-10"
      >
        {/* Core Tagline: "Play. Move. Compete." */}
        <motion.h1
          variants={itemVariants}
          className="font-display font-black text-3xl sm:text-4xl text-slate-800 tracking-tight leading-none mb-4"
        >
          Play. Move. <span className="text-brand-purple">Compete.</span>
        </motion.h1>

        {/* Primary CTA & Secondary How to Play Button */}
        <motion.div variants={itemVariants} className="mb-4 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
          <StartGameButton onClick={handleStart} />
          
          <button
            onClick={() => {
              soundFx.playClickSound();
              setShowHowToPlay(true);
            }}
            className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-950 text-slate-800 font-display font-black text-xs uppercase tracking-wider shadow-chunky-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer"
          >
            How To Play
          </button>
        </motion.div>

        {/* Games Capsule */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white border-2 border-slate-900 text-[10px] sm:text-xs font-display font-black tracking-wider uppercase shadow-chunky-sm"
        >
          <span>1 & 2 Players</span>
          <span className="w-1 h-1 rounded-full bg-white/50" />
          <span>Solo & Co-op</span>
        </motion.div>
      </motion.div>

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade">
          <div className="flex flex-col items-center text-center max-w-md w-full p-6 sm:p-8 bg-white border-[3px] border-slate-950 rounded-3xl shadow-chunky relative">
            <h2 className="font-display font-black text-2xl text-slate-950 uppercase mb-4">
              How VYBE Works
            </h2>
            
            <div className="flex flex-col gap-3.5 text-left w-full mb-6 font-sans text-xs text-slate-650">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-brand-purple text-white font-display font-black flex items-center justify-center shrink-0">1</div>
                <div>
                  <div className="font-display font-bold text-slate-900 text-sm">Camera is Your Controller</div>
                  <div className="text-slate-500 mt-0.5">Turn on your webcam. VYBE tracks your body moves locally in real-time.</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-brand-coral text-white font-display font-black flex items-center justify-center shrink-0">2</div>
                <div>
                  <div className="font-display font-bold text-slate-900 text-sm">Choose Your Mode</div>
                  <div className="text-slate-500 mt-0.5">Play Solo to beat your Personal Best, or grab a friend for 2-Player battle.</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-brand-yellow text-slate-950 font-display font-black flex items-center justify-center shrink-0">3</div>
                <div>
                  <div className="font-display font-bold text-slate-900 text-sm">Pick A Game</div>
                  <div className="text-slate-500 mt-0.5"><strong>Copy Cat:</strong> Match reference poses.<br/><strong>Ice Breaker:</strong> React quickly to motion prompts!</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClickSound();
                setShowHowToPlay(false);
              }}
              className="w-full py-3 bg-brand-purple text-white font-display font-black text-sm uppercase tracking-wider rounded-xl border-2 border-slate-950 shadow-chunky-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* Production Public Footer */}
      <footer className="w-full flex items-center justify-center gap-3 sm:gap-5 text-[10px] font-mono font-bold text-slate-500 uppercase z-10 mt-2 pb-1">
        <button onClick={() => { soundFx.playClickSound(); navigate('/privacy'); }} className="hover:text-brand-purple cursor-pointer underline">Privacy</button>
        <span>•</span>
        <button onClick={() => { soundFx.playClickSound(); navigate('/terms'); }} className="hover:text-brand-purple cursor-pointer underline">Terms</button>
        <span>•</span>
        <button onClick={() => { soundFx.playClickSound(); navigate('/about'); }} className="hover:text-brand-purple cursor-pointer underline">About</button>
        <span>•</span>
        <button onClick={() => { soundFx.playClickSound(); navigate('/contact'); }} className="hover:text-brand-purple cursor-pointer underline">Contact</button>
      </footer>

    </div>
  );
}
