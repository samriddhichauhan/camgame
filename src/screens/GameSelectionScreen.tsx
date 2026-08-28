import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useGameSession } from '../context/GameSessionContext';
import { availableGames } from '../game-data/AvailableGames';
import GameSelectionCard from '../components/GameSelectionCard';
import ProgressIndicator from '../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';

export default function GameSelectionScreen() {
  const navigate = useNavigate();
  const {
    player1,
    player2,
    selectedGameId,
    setSelectedGameId,
    isSessionReady,
  } = useGameSession();

  // Navigation Guard: Redirect to /players if names are missing
  if (!isSessionReady()) {
    return <Navigate to="/players" replace />;
  }

  const selectedGame = availableGames.find((g) => g.id === selectedGameId);

  const handleContinue = () => {
    if (selectedGameId) {
      navigate('/camera');
    }
  };

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 140, damping: 15 }
    }
  };

  const titleContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const textItemVariants: Variants = {
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
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-cream text-slate-800 p-4 sm:p-8 select-none">
      
      {/* Background Shapes */}
      <PlayfulBackgroundShapes />

      {/* Top Header Section */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        className="w-full flex items-center justify-between z-10"
      >
        {/* Back Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group cursor-pointer"
        >
          <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
          <button 
            onClick={() => navigate('/players')}
            className="relative flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-xs uppercase tracking-wider cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span>Back</span>
          </button>
        </motion.div>

        {/* Progress Indicator Step 2 */}
        <ProgressIndicator currentStep={2} />

        {/* Spacer */}
        <div className="w-[80px] hidden sm:block pointer-events-none opacity-0" />
      </motion.div>

      {/* Main Section */}
      <div className="flex flex-col items-center gap-4 sm:gap-6 z-10 my-auto w-full max-w-5xl px-2 overflow-hidden">
        
        {/* Page Title & Matchup */}
        <motion.div
          variants={titleContainerVariants}
          initial="hidden"
          animate="visible"
          className="text-center flex flex-col items-center"
        >
          {/* Matchup Header Banner */}
          <motion.div 
            variants={textItemVariants}
            className="inline-flex items-center gap-3 px-5 py-2 mb-2 bg-white border-2 border-slate-950 rounded-2xl shadow-chunky-sm text-xs sm:text-sm font-display font-black tracking-widest uppercase"
          >
            <span className="text-slate-700">{player1.name}</span>
            <span className="px-2 py-0.5 rounded bg-brand-coral border border-slate-950 text-white text-[9px] sm:text-[10px] scale-95">VS</span>
            <span className="text-slate-700">{player2.name}</span>
          </motion.div>

          <motion.h1 
            variants={textItemVariants}
            className="font-display font-black text-3xl sm:text-5xl text-slate-900 tracking-tight leading-none uppercase mb-1"
          >
            Choose your game
          </motion.h1>
          <motion.p 
            variants={textItemVariants}
            className="font-sans font-medium text-xs sm:text-sm text-slate-500"
          >
            Pick your challenge.
          </motion.p>
        </motion.div>

        {/* Game cards (Stack on mobile, Row on desktop) */}
        <motion.div
          variants={cardsContainerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col md:flex-row justify-center items-center gap-5 sm:gap-6 max-h-[50vh] md:max-h-[none] overflow-y-auto md:overflow-y-visible px-2 py-2"
        >
          {availableGames.map((game) => (
            <GameSelectionCard
              key={game.id}
              game={game}
              isSelected={selectedGameId === game.id}
              onSelect={() => setSelectedGameId(game.id)}
            />
          ))}
        </motion.div>

        {/* Selected Game Info Panel */}
        <div className="h-20 flex items-center justify-center w-full max-w-md mt-1">
          <AnimatePresence mode="wait">
            {selectedGame ? (
              <motion.div
                key={selectedGame.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-full p-4 bg-white border-2 border-slate-950 rounded-2xl shadow-chunky-sm flex justify-between items-center text-left"
              >
                <div>
                  <h4 className="font-display font-black text-sm uppercase text-slate-900 leading-tight">
                    {selectedGame.name}
                  </h4>
                  <p className="font-sans font-semibold text-[11px] text-slate-500 mt-0.5">
                    {selectedGame.focus}-based challenge
                  </p>
                </div>
                <div className="flex flex-col items-end border-l-2 border-slate-200 pl-4">
                  <span className="text-[9px] font-display font-bold uppercase text-slate-400 tracking-wider">
                    Focus Mode
                  </span>
                  <span className="text-[10px] font-mono font-black text-brand-purple uppercase mt-0.5">
                    {selectedGame.detectionType}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="font-sans font-semibold text-xs text-slate-500 italic text-center"
              >
                Select a game above to see details.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Bottom Button Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full flex flex-col items-center z-10"
      >
        {/* Continue Button */}
        <div className="relative group w-full max-w-[200px] select-none">
          <span 
            className={`absolute inset-0 w-full h-full rounded-2xl translate-x-1.5 translate-y-1.5 transition-transform ${
              selectedGameId 
                ? 'bg-slate-950 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0.5 group-active:translate-y-0.5' 
                : 'bg-slate-300'
            }`} 
          />
          <button
            onClick={handleContinue}
            disabled={!selectedGameId}
            className={`relative w-full flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-2xl font-display font-black text-lg uppercase tracking-wider transition-all duration-100 ${
              selectedGameId
                ? 'bg-brand-purple border-slate-950 text-white cursor-pointer hover:-translate-y-1 active:translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/50'
                : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>

    </div>
  );
}
