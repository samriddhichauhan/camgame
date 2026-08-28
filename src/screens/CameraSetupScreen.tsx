import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, Video } from 'lucide-react';
import { useGameSession } from '../context/GameSessionContext';
import ProgressIndicator from '../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';

export default function CameraSetupScreen() {
  const navigate = useNavigate();
  const { selectedGameId, isSessionReady } = useGameSession();

  // Navigation Guards: Redirect to appropriate step if state is missing
  if (!isSessionReady()) {
    return <Navigate to="/players" replace />;
  }
  if (!selectedGameId) {
    return <Navigate to="/games" replace />;
  }

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 140, damping: 15 }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-cream text-slate-800 p-6 sm:p-10 select-none">
      
      {/* Background Elements */}
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
            onClick={() => navigate('/games')}
            className="relative flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-xs uppercase tracking-wider cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span>Back</span>
          </button>
        </motion.div>

        {/* Progress Indicator Step 3 */}
        <ProgressIndicator currentStep={3} />

        {/* Spacer */}
        <div className="w-[80px] hidden sm:block pointer-events-none opacity-0" />
      </motion.div>

      {/* Main Placeholder Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 15 }}
        className="flex flex-col items-center justify-center text-center max-w-sm w-full p-8 sm:p-12 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky z-10 my-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-coral border-2 border-slate-950 flex items-center justify-center mb-6 shadow-chunky-sm text-white">
          <Video className="w-8 h-8 stroke-[2.5]" />
        </div>
        
        <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-3 text-slate-950 uppercase">
          Camera Setup
        </h2>
        
        <p className="font-sans text-sm sm:text-base text-slate-500 leading-relaxed mb-8">
          Position your webcam so both players are visible in the frame.
        </p>

        <div className="inline-flex px-5 py-2.5 rounded-full bg-brand-yellow border-2 border-slate-950 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-chunky-sm animate-pulse-slow">
          Coming next — Phase 3
        </div>
      </motion.div>

      {/* Spacer */}
      <div className="h-10 w-full opacity-0 pointer-events-none" />

    </div>
  );
}
