import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import StartGameScreen from './screens/StartGameScreen';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus } from 'lucide-react';
import PlayfulBackgroundShapes from './components/PlayfulBackgroundShapes';

function PlayerSetupPlaceholder() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-cream text-slate-800 p-6 sm:p-10 select-none">
      
      {/* Background Elements */}
      <PlayfulBackgroundShapes />

      {/* Back Button */}
      <div className="w-full flex justify-start z-10">
        <Link to="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
            <button className="relative flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-sm uppercase tracking-wide cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform">
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span>Back</span>
            </button>
          </motion.div>
        </Link>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 15 }}
        className="flex flex-col items-center justify-center text-center max-w-sm w-full p-8 sm:p-12 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky z-10 my-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-purple border-2 border-slate-950 flex items-center justify-center mb-6 shadow-chunky-sm text-white">
          <UserPlus className="w-8 h-8 stroke-[2.5]" />
        </div>
        
        <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight mb-3 text-slate-950 uppercase">
          Player Setup
        </h2>
        
        <p className="font-sans text-sm sm:text-base text-slate-500 leading-relaxed mb-8">
          Configure players, customize avatars, and get your cameras ready.
        </p>

        <div className="inline-flex px-5 py-2.5 rounded-full bg-brand-yellow border-2 border-slate-950 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-chunky-sm animate-pulse-slow">
          Coming in Phase 2
        </div>
      </motion.div>

      {/* Spacer */}
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
