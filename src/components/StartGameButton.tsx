import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface StartGameButtonProps {
  onClick: () => void;
}

export default function StartGameButton({ onClick }: StartGameButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 0 30px rgba(6, 182, 212, 0.7)',
      }}
      whileTap={{ scale: 0.96 }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 260, 
        damping: 18,
        delay: 0.5
      }}
      className="group relative flex items-center justify-center gap-3 px-10 py-5 sm:px-14 sm:py-6 rounded-full font-display font-black text-xl sm:text-2xl tracking-wider uppercase text-white cursor-pointer select-none overflow-hidden focus:outline-none focus:ring-4 focus:ring-brand-cyan/60 focus:ring-offset-4 focus:ring-offset-bg-dark"
      aria-label="Start Game"
    >
      {/* Base Gradient Layer */}
      <span className="absolute inset-0 bg-gradient-to-r from-brand-violet via-brand-fuchsia to-brand-cyan transition-transform duration-500 group-hover:scale-105" />

      {/* Hover Shift Gradient Layer */}
      <span className="absolute inset-0 bg-gradient-to-r from-brand-cyan via-brand-fuchsia to-brand-violet opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Subtle Inner Glow Border */}
      <span className="absolute inset-[1px] rounded-full bg-black/10 border border-white/20 pointer-events-none" />

      {/* Content */}
      <span className="relative z-10 drop-shadow-md">Start Game</span>
      <Play className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 fill-current group-hover:translate-x-1 transition-transform duration-300 drop-shadow-md" />
    </motion.button>
  );
}
