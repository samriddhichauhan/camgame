import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, AlertCircle } from 'lucide-react';
import { useGameSession } from '../context/GameSessionContext';
import { availableGames } from '../game-data/AvailableGames';
import ProgressIndicator from '../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';
import CameraPreview from '../components/CameraPreview';
import { startCameraStream } from '../camera/StartCameraStream';
import { stopCameraStream } from '../camera/StopCameraStream';
import { getFriendlyCameraErrorMessage } from '../camera/CameraStreamError';
import type { CameraErrorType } from '../camera/CameraStreamError';

export default function CameraSetupScreen() {
  const navigate = useNavigate();
  const { player1, player2, selectedGameId, isSessionReady } = useGameSession();

  // Camera stream and lifecycle states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'waiting' | 'connecting' | 'working' | 'error'>('waiting');
  const [errorType, setErrorType] = useState<CameraErrorType | null>(null);

  // Redirection Guards
  if (!isSessionReady()) {
    return <Navigate to="/players" replace />;
  }
  if (!selectedGameId) {
    return <Navigate to="/games" replace />;
  }

  const selectedGame = availableGames.find((g) => g.id === selectedGameId);

  // Stop camera tracks cleanly
  const handleStopCamera = () => {
    stopCameraStream(stream);
    setStream(null);
    setStatus('waiting');
  };

  // Start camera stream request
  const handleStartCamera = async () => {
    setStatus('connecting');
    setErrorType(null);
    try {
      const cameraStream = await startCameraStream();
      setStream(cameraStream);
      setStatus('working');
    } catch (err: any) {
      setErrorType(err.message as CameraErrorType);
      setStatus('error');
      stopCameraStream(stream);
      setStream(null);
    }
  };

  // Lifecycle useEffect hook to automatically stop stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream(stream);
    };
  }, [stream]);

  const handleBack = () => {
    handleStopCamera();
    navigate('/games');
  };

  const handleReady = () => {
    handleStopCamera();
    navigate('/play');
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
            onClick={handleBack}
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

      {/* Main Preview Container */}
      <div className="flex flex-col items-center gap-4 sm:gap-6 z-10 my-auto w-full max-w-xl px-2 overflow-hidden">
        
        {/* Headings */}
        <motion.div
          variants={titleContainerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {selectedGame && (
            <motion.div 
              variants={textItemVariants}
              className="text-[10px] font-display font-black text-brand-purple tracking-widest uppercase mb-1"
            >
              Next Up: {selectedGame.name}
            </motion.div>
          )}
          <motion.h1 
            variants={textItemVariants}
            className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-none uppercase mb-1"
          >
            Camera Check
          </motion.h1>
          <motion.p 
            variants={textItemVariants}
            className="font-sans font-semibold text-xs sm:text-sm text-slate-500"
          >
            {status === 'working' ? 'Get yourselves in position' : 'VYBE needs your camera to turn movement into gameplay'}
          </motion.p>
        </motion.div>

        {/* Active stream or Request Panels */}
        <div className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            {status === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky flex flex-col items-center text-center animate-fade"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 border-2 border-slate-950 flex items-center justify-center mb-6 text-brand-purple shadow-chunky-sm">
                  <Camera className="w-8 h-8 stroke-[2.5]" />
                </div>
                
                <h3 className="font-display font-black text-xl text-slate-900 uppercase mb-2">
                  Enable Camera Stream
                </h3>
                
                <p className="font-sans text-xs text-slate-550 leading-relaxed mb-6 font-semibold">
                  VYBE processes your camera feed locally on your device. Video frames are never recorded or uploaded.
                </p>

                <div className="relative group w-full max-w-[180px]">
                  <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-hover:translate-x-1.5 group-hover:translate-y-1.5 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                  <button
                    onClick={handleStartCamera}
                    className="relative w-full py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-display font-black text-sm uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
                  >
                    Enable Camera
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'connecting' && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md p-10 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky flex flex-col items-center justify-center text-center aspect-[4/3]"
              >
                <div className="w-10 h-10 rounded-full border-4 border-dashed border-brand-purple animate-spin mb-4" />
                <span className="font-mono text-xs font-black uppercase tracking-widest text-slate-505 animate-pulse">
                  Connecting Camera...
                </span>
              </motion.div>
            )}

            {status === 'error' && errorType && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-coral/10 border-2 border-brand-coral flex items-center justify-center mb-6 text-brand-coral shadow-chunky-sm">
                  <AlertCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
                
                <h3 className="font-display font-black text-xl text-slate-900 uppercase mb-2">
                  Camera Unavailable
                </h3>
                
                <p className="font-sans text-xs text-slate-550 leading-relaxed mb-6 font-semibold px-2">
                  {getFriendlyCameraErrorMessage(errorType)}
                </p>

                <div className="relative group w-full max-w-[160px]">
                  <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-hover:translate-x-1.5 group-hover:translate-y-1.5 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                  <button
                    onClick={handleStartCamera}
                    className="relative w-full py-3 bg-brand-coral hover:bg-[#ff6f6f] text-white font-display font-black text-sm uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'working' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md flex flex-col items-center gap-3"
              >
                {/* Embedded Mirrored live preview component */}
                <CameraPreview stream={stream} />

                {/* Player Matchup Tagline */}
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white border-2 border-slate-950 rounded-2xl shadow-chunky-sm text-xs font-display font-black tracking-widest uppercase">
                  <span>{player1.name}</span>
                  <span className="px-2 py-0.5 rounded bg-brand-coral border border-slate-950 text-white text-[9px] scale-95">VS</span>
                  <span>{player2.name}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Bottom Button Action Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full flex flex-col items-center z-10"
      >
        {/* Ready Button */}
        <div className="relative group w-full max-w-[200px] select-none">
          <span 
            className={`absolute inset-0 w-full h-full rounded-2xl translate-x-1.5 translate-y-1.5 transition-transform ${
              status === 'working' 
                ? 'bg-slate-950 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0.5 group-active:translate-y-0.5' 
                : 'bg-slate-300'
            }`} 
          />
          <button
            onClick={handleReady}
            disabled={status !== 'working'}
            className={`relative w-full flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-2xl font-display font-black text-lg uppercase tracking-wider transition-all duration-100 ${
              status === 'working'
                ? 'bg-brand-purple border-slate-950 text-white cursor-pointer hover:-translate-y-1 active:translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/50'
                : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Ready</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>

    </div>
  );
}
