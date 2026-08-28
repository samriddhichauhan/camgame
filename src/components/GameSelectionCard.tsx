import { motion } from 'framer-motion';
import { Check as LucideCheck } from 'lucide-react';
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
  const renderIllustration = () => {
    switch (game.id) {
      case 'copy-cat':
        return (
          <svg viewBox="0 0 160 120" className="w-full h-24" fill="none">
            {/* Mirror line */}
            <path d="M80 15 L80 105" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
            
            {/* Sparkle */}
            <path d="M80 12 L82 17 L87 18 L82 19 L80 24 L78 19 L73 18 L78 17 Z" fill="var(--color-brand-yellow)" />
            
            {/* Player 1 (Leader - Purple) */}
            <g className="text-slate-800">
              <path d="M35 100 C35 80 43 65 55 65 C67 65 75 80 75 100" fill="var(--color-brand-purple)" stroke="currentColor" strokeWidth="2" />
              <path d="M37 75 Q22 55 28 40 Q33 30 43 50" fill="var(--color-brand-purple)" stroke="currentColor" strokeWidth="2" />
              <circle cx="55" cy="40" r="13" fill="var(--color-brand-purple)" stroke="currentColor" strokeWidth="2" />
              {/* Smile */}
              <circle cx="51" cy="38" r="1.5" fill="white" />
              <circle cx="57" cy="38" r="1.5" fill="white" />
              <path d="M52 45 Q54 47 56 45" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Player 2 (Copy - Coral - Mirroring Pose) */}
            <g className="text-slate-800">
              <path d="M125 100 C125 80 117 65 105 65 C93 65 85 80 85 100" fill="var(--color-brand-coral)" stroke="currentColor" strokeWidth="2" />
              <path d="M123 75 Q138 55 132 40 Q127 30 117 50" fill="var(--color-brand-coral)" stroke="currentColor" strokeWidth="2" />
              <circle cx="105" cy="40" r="13" fill="var(--color-brand-coral)" stroke="currentColor" strokeWidth="2" />
              {/* Smile */}
              <circle cx="101" cy="38" r="1.5" fill="white" />
              <circle cx="107" cy="38" r="1.5" fill="white" />
              <path d="M102 45 Q104 47 106 45" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </svg>
        );
      case 'ice-breaker':
        return (
          <svg viewBox="0 0 160 120" className="w-full h-24 text-brand-purple" fill="none">
            {/* Viewfinder brackets */}
            <path d="M25 35 L25 25 L35 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M135 35 L135 25 L125 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M25 85 L25 95 L35 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M135 85 L135 95 L125 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            
            {/* Target Ring */}
            <circle cx="80" cy="58" r="32" stroke="#e2e8f0" strokeWidth="2" />
            <circle cx="80" cy="58" r="32" stroke="var(--color-brand-blue)" strokeWidth="2.5" strokeDasharray="8 8" className="animate-spin-slow" />
            
            {/* Pose Action - Waving Hands Up (Blue) */}
            <g className="text-slate-800">
              <path d="M60 100 C60 82 70 70 80 70 C90 70 100 82 100 100" fill="var(--color-brand-blue)" stroke="currentColor" strokeWidth="2" />
              <path d="M63 80 Q50 50 62 42 Q70 38 72 58" fill="var(--color-brand-blue)" stroke="currentColor" strokeWidth="2" />
              <path d="M97 80 Q110 50 98 42 Q90 38 88 58" fill="var(--color-brand-blue)" stroke="currentColor" strokeWidth="2" />
              <circle cx="80" cy="52" r="11" fill="var(--color-brand-blue)" stroke="currentColor" strokeWidth="2" />
              <circle cx="76" cy="50" r="1" fill="white" />
              <circle cx="84" cy="50" r="1" fill="white" />
              <path d="M77 56 Q80 58 83 56" stroke="white" strokeWidth="1" />
            </g>
          </svg>
        );
      case 'reaction-rush':
        return (
          <svg viewBox="0 0 160 120" className="w-full h-24" fill="none">
            {/* Speed lines */}
            <path d="M15 45 L35 45 M10 60 L30 60 M20 75 L40 75" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <path d="M145 45 L125 45 M150 60 L130 60 M140 75 L120 75" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />

            {/* Giant Arrow (Yellow/Orange) */}
            <path 
              d="M70 30 L105 60 L70 90 L70 72 L45 72 L45 48 L70 48 Z" 
              fill="var(--color-brand-yellow)" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinejoin="round" 
              className="animate-pulse"
            />
            
            {/* Speed Badge */}
            <g transform="translate(82, 75)" className="text-slate-800">
              <rect x="0" y="0" width="48" height="20" rx="6" fill="var(--color-brand-green)" stroke="currentColor" strokeWidth="2" />
              <text x="24" y="14" fill="currentColor" fontSize="9" fontWeight="900" fontFamily="monospace" textAnchor="middle">0.45s</text>
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
          <LucideCheck className="w-4 h-4 stroke-[3.5]" />
        </div>
      )}

      {/* Game Number & CV Type Badge */}
      <div className="flex justify-between items-center mb-3">
        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-500 uppercase">
          Game {game.gameNumber}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-brand-purple/10 border border-brand-purple/20 text-[9px] font-mono font-bold text-brand-purple uppercase tracking-wider">
          {game.detectionType}
        </span>
      </div>

      {/* Vector Illustration Container */}
      <div className="h-28 bg-slate-50 border-2 border-slate-950 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-inner">
        {renderIllustration()}
      </div>

      {/* Game Titles */}
      <h3 className="font-display font-black text-xl text-slate-900 tracking-wide uppercase mb-1">
        {game.name}
      </h3>

      {/* Tagline */}
      <p className="font-sans text-xs text-brand-coral font-extrabold uppercase tracking-wide mb-1.5">
        {game.tagline}
      </p>

      {/* Short Description */}
      <p className="font-sans text-[11px] text-slate-500 leading-relaxed font-semibold">
        {game.description.slice(0, 75)}...
      </p>
    </motion.div>
  );
}
