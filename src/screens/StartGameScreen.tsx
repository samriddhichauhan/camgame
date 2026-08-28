import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Camera, Radio } from 'lucide-react';
import VYBELogo from '../components/VYBELogo';
import StartGameButton from '../components/StartGameButton';

export default function StartGameScreen() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/players');
  };

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 1.2, ease: 'easeOut' } 
    }
  };

  const textContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 16
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-dark text-slate-100 p-6 sm:p-10 select-none">
      
      {/* 1. Ambient Background Grid & Drift */}
      <div className="absolute inset-0 game-grid-bg opacity-30 animate-grid-drift pointer-events-none" />

      {/* 2. Floating Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-brand-violet/15 rounded-full blur-[100px] sm:blur-[120px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-brand-cyan/15 rounded-full blur-[100px] sm:blur-[120px] animate-float-medium pointer-events-none" />

      {/* 3. High-Tech Camera HUD Overlay */}
      <motion.div 
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        className="absolute inset-4 sm:inset-10 border border-white/[0.03] pointer-events-none flex flex-col justify-between p-4"
      >
        {/* HUD Top Bar */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>REC [READY]</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-brand-cyan" />
            <span>CAM_01_FEED</span>
          </div>
        </div>

        {/* HUD Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-6 h-[1px] bg-white" />
          <div className="h-6 w-[1px] bg-white" />
        </div>

        {/* HUD Viewfinder Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-cyan/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-cyan/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-cyan/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-cyan/40" />

        {/* HUD Bottom Bar */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono tracking-widest text-slate-400 mt-auto">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-brand-fuchsia animate-pulse" />
            <span>SIGNAL: ACTIVE</span>
          </div>
          <span>NO CONTROLLER NEEDED</span>
        </div>
      </motion.div>

      {/* 4. Top Decorative Spacer */}
      <div className="h-10 w-full opacity-0 pointer-events-none" />

      {/* 5. Main Hero Screen Contents */}
      <motion.div 
        variants={textContainerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center text-center max-w-2xl px-4 z-10 my-auto"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-6 glow-glow">
          <VYBELogo />
        </motion.div>

        {/* Tagline 1 */}
        <motion.p 
          variants={itemVariants}
          className="font-display font-extrabold text-xs sm:text-sm tracking-[0.25em] uppercase text-brand-cyan"
        >
          Your camera is the controller.
        </motion.p>

        {/* Tagline 2 */}
        <motion.h1 
          variants={itemVariants}
          className="font-display font-black text-4xl sm:text-6xl lg:text-7xl mt-4 mb-8 tracking-tight leading-none text-slate-50"
        >
          Play. Move. <span className="text-gradient bg-gradient-to-r from-brand-fuchsia to-brand-cyan">Compete.</span>
        </motion.h1>

        {/* Start Game CTA Button */}
        <motion.div variants={itemVariants} className="flex justify-center w-full">
          <StartGameButton onClick={handleStart} />
        </motion.div>
      </motion.div>

      {/* 6. Footer Decor */}
      <div className="z-10 text-[10px] sm:text-xs tracking-widest font-mono text-slate-500 uppercase mt-auto pointer-events-none">
        VYBE Platform © 2026
      </div>

    </div>
  );
}
