import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, User, Users, Sparkles, Zap } from 'lucide-react';
import { useGameSession } from '../context/GameSessionContext';
import type { GameMode } from '../context/GameSessionContext';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';

import { soundFx } from '../utils/SoundEffects';

export default function ModeSelectionScreen() {
  const navigate = useNavigate();
  const { setGameMode } = useGameSession();

  const handleSelectMode = (mode: GameMode) => {
    soundFx.playClickSound();
    setGameMode(mode);
    navigate('/players');
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 140, damping: 15 }
    }
  };

  const titleVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 150, damping: 15 }
    }
  };

  const cardsContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 140, damping: 14 }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-cream text-slate-800 p-4 sm:p-8 select-none">
      
      {/* Playful Floating Background Shapes */}
      <PlayfulBackgroundShapes />

      {/* Header */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="w-full flex items-center justify-between z-10"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group cursor-pointer"
        >
          <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
          <button 
            onClick={() => navigate('/')}
            className="relative flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-xs uppercase tracking-wider cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span>Back</span>
          </button>
        </motion.div>

        <div className="text-xs font-mono font-black tracking-widest text-slate-400 uppercase">
          VYBE Mode Selection
        </div>

        <div className="w-[80px] hidden sm:block pointer-events-none opacity-0" />
      </motion.div>

      {/* Main Section */}
      <div className="flex flex-col items-center gap-6 sm:gap-8 z-10 my-auto w-full max-w-4xl px-2">
        
        {/* Title Header */}
        <motion.div
          variants={titleVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <h1 className="font-display font-black text-3xl sm:text-5xl text-slate-900 tracking-tight leading-none uppercase mb-2">
            How Do You Want To Play?
          </h1>
          <p className="font-sans font-semibold text-xs sm:text-base text-slate-500 max-w-md mx-auto">
            Choose your mode and get moving with real camera vision control.
          </p>
        </motion.div>

        {/* Mode Options Cards */}
        <motion.div
          variants={cardsContainerVariants}
          initial="hidden"
          animate="visible"
          className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-2 max-w-3xl"
        >
          {/* Card 1: SINGLE PLAYER */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectMode('SINGLE_PLAYER')}
            className="relative group cursor-pointer"
          >
            {/* Chunky Shadow */}
            <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-3xl translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 group-active:translate-x-1 group-active:translate-y-1 transition-transform" />
            
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white border-[3px] border-slate-950 flex flex-col justify-between items-center text-center h-full transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-brand-purple/15 border-2 border-slate-950 flex items-center justify-center text-brand-purple mb-4 shadow-chunky-sm group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="flex flex-col items-center">
                <span className="px-3 py-1 bg-brand-purple/10 border border-brand-purple/30 text-brand-purple font-mono font-black text-[10px] uppercase rounded-full tracking-wider mb-2">
                  Solo Mode
                </span>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-950 uppercase mb-2">
                  Single Player
                </h3>
                <p className="font-sans text-xs sm:text-sm text-slate-550 font-semibold leading-relaxed mb-6">
                  Play solo against computer challenges. Test your accuracy & speed on your own terms.
                </p>
              </div>

              <div className="w-full py-3 px-4 bg-brand-purple text-white font-display font-black text-sm uppercase tracking-wider rounded-xl border-2 border-slate-950 shadow-chunky-sm flex items-center justify-center gap-2 group-hover:bg-brand-purple-dark transition-colors">
                <Sparkles className="w-4 h-4" />
                <span>Play Solo</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: TWO PLAYERS */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectMode('TWO_PLAYERS')}
            className="relative group cursor-pointer"
          >
            {/* Chunky Shadow */}
            <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-3xl translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 group-active:translate-x-1 group-active:translate-y-1 transition-transform" />
            
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white border-[3px] border-slate-950 flex flex-col justify-between items-center text-center h-full transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-brand-coral/15 border-2 border-slate-950 flex items-center justify-center text-brand-coral mb-4 shadow-chunky-sm group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="flex flex-col items-center">
                <span className="px-3 py-1 bg-brand-coral/10 border border-brand-coral/30 text-brand-coral font-mono font-black text-[10px] uppercase rounded-full tracking-wider mb-2">
                  Head-to-Head
                </span>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-950 uppercase mb-2">
                  Two Players
                </h3>
                <p className="font-sans text-xs sm:text-sm text-slate-550 font-semibold leading-relaxed mb-6">
                  Challenge a friend side-by-side in real-time motion battles. Compete for the high score!
                </p>
              </div>

              <div className="w-full py-3 px-4 bg-brand-coral text-white font-display font-black text-sm uppercase tracking-wider rounded-xl border-2 border-slate-950 shadow-chunky-sm flex items-center justify-center gap-2 group-hover:bg-[#ff5757] transition-colors">
                <Zap className="w-4 h-4" />
                <span>Play With A Friend</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>

      {/* Spacer */}
      <div className="h-4 w-full opacity-0 pointer-events-none" />

    </div>
  );
}
