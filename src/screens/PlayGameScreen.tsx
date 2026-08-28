import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { useGameSession } from '../context/GameSessionContext';
import { availableGames } from '../game-data/AvailableGames';
import ProgressIndicator from '../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';
import CopyCatGame from '../games/CopyCat/CopyCatGame';

export default function PlayGameScreen() {
  const navigate = useNavigate();
  const { player1, player2, selectedGameId, isSessionReady } = useGameSession();

  // Route protection redirects
  if (!isSessionReady()) {
    return <Navigate to="/players" replace />;
  }
  if (!selectedGameId) {
    return <Navigate to="/games" replace />;
  }

  // Route directly to Copy Cat game component if active
  if (selectedGameId === 'copy-cat') {
    return <CopyCatGame />;
  }

  const selectedGame = availableGames.find((g) => g.id === selectedGameId);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-cream text-slate-800 p-6 sm:p-10 select-none">
      
      {/* Background Shapes */}
      <PlayfulBackgroundShapes />

      {/* Header */}
      <div className="w-full flex items-center justify-between z-10">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group cursor-pointer"
        >
          <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
          <button 
            onClick={() => navigate('/camera')}
            className="relative flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-xs uppercase tracking-wider cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span>Back</span>
          </button>
        </motion.div>

        {/* Step 4: Play */}
        <ProgressIndicator currentStep={4} />

        <div className="w-[80px] hidden sm:block pointer-events-none opacity-0" />
      </div>

      {/* Main placeholder card for non-CopyCat games */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 15 }}
        className="flex flex-col items-center justify-center text-center max-w-md w-full p-8 sm:p-12 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky z-10 my-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-purple border-2 border-slate-950 flex items-center justify-center mb-6 shadow-chunky-sm text-white">
          <Gamepad2 className="w-8 h-8 stroke-[2.5]" />
        </div>
        
        {/* Matchup Title */}
        <div className="text-slate-500 font-display font-black text-xs sm:text-sm tracking-wider uppercase mb-1">
          {player1.name} <span className="text-brand-coral">VS</span> {player2.name}
        </div>

        <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-3 text-slate-950 uppercase">
          {selectedGame?.name}
        </h2>
        
        <p className="font-sans text-sm sm:text-base text-slate-555 leading-relaxed mb-8 font-semibold">
          {selectedGame?.tagline}
        </p>

        <div className="inline-flex px-5 py-2.5 rounded-full bg-brand-yellow border-2 border-slate-950 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-chunky-sm animate-pulse-slow">
          Gameplay Coming Next
        </div>
      </motion.div>

      {/* Spacer */}
      <div className="h-10 w-full opacity-0 pointer-events-none" />

    </div>
  );
}
