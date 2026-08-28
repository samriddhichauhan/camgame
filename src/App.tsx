import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import StartGameScreen from './screens/StartGameScreen';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';

function PlayerSetupPlaceholder() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-dark text-slate-100 p-6 sm:p-10 select-none">
      
      {/* Ambient Backgrounds */}
      <div className="absolute inset-0 game-grid-bg opacity-30 animate-grid-drift pointer-events-none" />
      <div className="absolute top-1/4 -right-1/4 w-[400px] h-[400px] bg-brand-fuchsia/15 rounded-full blur-[100px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-brand-cyan/15 rounded-full blur-[100px] animate-float-medium pointer-events-none" />

      {/* Back Button */}
      <div className="w-full flex justify-start z-10">
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-sm font-semibold tracking-wider uppercase transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
        </Link>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 15 }}
        className="flex flex-col items-center justify-center text-center max-w-md p-8 sm:p-12 rounded-3xl bg-panel-dark/60 border border-white/5 backdrop-blur-xl z-10 shadow-2xl my-auto glow-glow"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-violet to-brand-fuchsia flex items-center justify-center mb-6 shadow-lg shadow-brand-violet/35">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-3 text-slate-50 uppercase">
          Player Setup
        </h2>
        
        <p className="font-sans text-sm sm:text-base text-slate-400 leading-relaxed mb-8">
          Configure players, customize avatars, and get your cameras ready.
        </p>

        <div className="inline-flex px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-mono text-xs font-bold uppercase tracking-wider animate-pulse-slow">
          Coming in Phase 2
        </div>
      </motion.div>

      {/* Footer Spacer */}
      <div className="h-10 w-full opacity-0 pointer-events-none" />

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartGameScreen />} />
        <Route path="/players" element={<PlayerSetupPlaceholder />} />
      </Routes>
    </BrowserRouter>
  );
}
