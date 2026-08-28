import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { GameDefinition } from '../game-data/AvailableGames';

interface GameSelectionCardProps {
  game: GameDefinition;
  isSelected: boolean;
  onSelect: () => void;
}

export default function GameSelectionCard({
  game,
  isSelected,
  onSelect,
}: GameSelectionCardProps) {
  // Render custom vector illustration based on game ID
  const renderIllustration = () => {
    switch (game.id) {
      case 'ice-breaker':
        return (
          <svg viewBox="0 0 160 120" className="w-full h-24 text-brand-purple" fill="none">
            {/* Viewfinder brackets */}
            <path d="M20 30 L20 20 L30 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M140 30 L140 20 L130 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 90 L20 100 L30 100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M140 90 L140 100 L130 100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            
            {/* Animated Target Circle */}
            <circle cx="80" cy="60" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-spin-slow" />
            
            {/* Pose Character */}
            <g className="text-slate-800">
              <circle cx="80" cy="45" r="8" fill="var(--color-brand-purple)" stroke="currentColor" strokeWidth="2" />
              <path d="M80 53 L80 75 M70 65 L90 57" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M72 90 L80 75 L88 90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        );
      case 'hand-battle':
        return (
          <svg viewBox="0 0 160 120" className="w-full h-24" fill="none">
            {/* Playful rock vs scissors burst illustration */}
            <path d="M80 30 L80 15 M80 90 L80 105 M35 60 L20 60 M125 60 L140 60" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
            <path d="M48 38 L38 28 M112 82 L122 92 M48 82 L38 92 M112 38 L122 28" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />

            {/* Scissors Icon (Left - Coral) */}
            <g transform="translate(18, 32) scale(0.9)" className="text-slate-800">
              <circle cx="20" cy="50" r="7" stroke="currentColor" strokeWidth="2" fill="var(--color-brand-coral)" />
              <circle cx="20" cy="30" r="7" stroke="currentColor" strokeWidth="2" fill="var(--color-brand-coral)" />
              <path d="M26 44 L52 32 M26 36 L52 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Rock Icon (Right - Blue) */}
            <g transform="translate(92, 35) scale(0.95)" className="text-slate-800">
              <rect x="15" y="25" width="28" height="28" rx="8" fill="var(--color-brand-blue)" stroke="currentColor" strokeWidth="2" />
              <circle cx="25" cy="35" r="2" fill="white" />
              <circle cx="33" cy="35" r="2" fill="white" />
              <path d="M25 43 C 27 45, 31 45, 33 43" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        );
      case 'mirror-dance':
        return (
          <svg viewBox="0 0 160 120" className="w-full h-24" fill="none">
            {/* Mirror Sparkles */}
            <path d="M80 20 L80 100" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M50 30 L53 35 L58 36 L53 37 L50 42 L47 37 L42 36 L47 35 Z" fill="var(--color-brand-yellow)" />
            <path d="M110 80 L113 85 L118 86 L113 87 L110 92 L107 87 L102 86 L107 85 Z" fill="var(--color-brand-yellow)" />

            {/* Left Dancer */}
            <g className="text-slate-800">
              <circle cx="45" cy="45" r="7" fill="var(--color-brand-purple)" stroke="currentColor" strokeWidth="2" />
              <path d="M45 52 C45 65 35 70 35 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M45 52 L58 60 M32 55 L45 58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Right Dancer (Mirrored pose) */}
            <g className="text-slate-800">
              <circle cx="115" cy="45" r="7" fill="var(--color-brand-green)" stroke="currentColor" strokeWidth="2" />
              <path d="M115 52 C115 65 125 70 125 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M115 52 L102 60 M128 55 L115 58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative w-full max-w-[280px] p-5 rounded-3xl border-[3px] bg-white cursor-pointer select-none transition-all duration-200 ${
        isSelected
          ? 'border-brand-purple shadow-chunky-purple bg-purple-50/15'
          : 'border-slate-950 shadow-chunky hover:border-slate-800'
      }`}
    >
      {/* Selection check indicator badge */}
      {isSelected && (
        <div className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full bg-brand-purple border-2 border-slate-950 flex items-center justify-center text-white shadow-chunky-sm z-10 animate-bounce">
          <Check className="w-4 h-4 stroke-[3.5]" />
        </div>
      )}

      {/* Game Number & Difficulty */}
      <div className="flex justify-between items-center mb-3">
        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-500 uppercase">
          Game {game.gameNumber}
        </span>
        <span className="text-[10px] font-display font-black text-brand-purple tracking-wider uppercase">
          Pose Cam
        </span>
      </div>

      {/* Vector Illustration Container */}
      <div className="h-28 bg-slate-50 border-2 border-slate-950 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
        {renderIllustration()}
      </div>

      {/* Game Titles */}
      <h3 className="font-display font-black text-xl text-slate-900 tracking-wide uppercase mb-1.5">
        {game.name}
      </h3>

      {/* Short Description */}
      <p className="font-sans text-xs text-slate-500 leading-relaxed font-semibold">
        {game.shortDescription}
      </p>
    </motion.div>
  );
}
