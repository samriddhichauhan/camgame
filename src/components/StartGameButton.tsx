import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface StartGameButtonProps {
  onClick: () => void;
}

export default function StartGameButton({ onClick }: StartGameButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 240, 
        damping: 16,
        delay: 0.5
      }}
      className="relative group w-full max-w-[240px] sm:max-w-[280px] select-none"
    >
      {/* 3D Bottom Plate / Cartoon Shadow */}
      <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-2xl translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform duration-100" />
      
      {/* Tactile Button Body */}
      <button
        onClick={onClick}
        className="relative w-full flex items-center justify-center gap-3 px-6 py-4.5 sm:px-10 sm:py-5 bg-brand-coral hover:bg-[#ff6f6f] border-2 border-slate-950 text-white font-display font-black text-xl sm:text-2xl tracking-wider uppercase rounded-2xl cursor-pointer group-hover:-translate-y-1 group-active:translate-y-1.5 transition-transform duration-100 focus:outline-none focus:ring-4 focus:ring-brand-purple/50 focus:ring-offset-4 focus:ring-offset-bg-cream"
        aria-label="Start Game"
      >
        <span>Start Game</span>
        <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current group-hover:translate-x-0.5 transition-transform" />
      </button>
    </motion.div>
  );
}
