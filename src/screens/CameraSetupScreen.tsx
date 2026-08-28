import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, AlertCircle } from 'lucide-react';
import { useGameSession } from '../context/GameSessionContext';
import { availableGames } from '../game-data/AvailableGames';
import ProgressIndicator from '../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';
import CameraPreview from '../components/CameraPreview';
import DetectedPlayerOverlay from '../components/DetectedPlayerOverlay';
import { startCameraStream } from '../camera/StartCameraStream';
import { stopCameraStream } from '../camera/StopCameraStream';
import { getFriendlyCameraErrorMessage } from '../camera/CameraStreamError';
import type { CameraErrorType } from '../camera/CameraStreamError';

// Computer vision imports
import { initializePoseDetection } from '../computer-vision/InitializePoseDetection';
import { initializeHandDetection } from '../computer-vision/InitializeHandDetection';
import { detectBodyPose } from '../computer-vision/DetectBodyPose';
import { detectHandLandmarks } from '../computer-vision/DetectHandLandmarks';
import { detectPlayers } from '../computer-vision/DetectPlayers';
import type { DetectedPlayer } from '../computer-vision/ComputerVisionTypes';
import type { PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';

export default function CameraSetupScreen() {
  const navigate = useNavigate();
  const { player1, player2, selectedGameId, isSessionReady } = useGameSession();

  // Camera stream and UI states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'waiting' | 'connecting' | 'loading-vision' | 'working' | 'error'>('waiting');
  const [errorType, setErrorType] = useState<CameraErrorType | 'VISION_INIT_FAILED' | null>(null);

  // Vision detection state
  const [players, setPlayers] = useState<DetectedPlayer[]>([]);

  // Refs for tracking background task instances
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const loopActiveRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastLogTimeRef = useRef<number>(0);
  const lastPlayerCountRef = useRef<number>(-1);

  // Redirection Guards
  if (!isSessionReady()) {
    return <Navigate to="/players" replace />;
  }
  if (!selectedGameId) {
    return <Navigate to="/games" replace />;
  }

  const selectedGame = availableGames.find((g) => g.id === selectedGameId);

  // Stop camera stream cleanly
  const handleStopCamera = () => {
    stopCameraStream(streamRef.current);
    setStream(null);
    streamRef.current = null;
  };

  // Start camera stream & initialize MediaPipe models
  const handleStartCamera = async () => {
    setStatus('connecting');
    setErrorType(null);
    
    let activeStream: MediaStream | null = null;
    try {
      // 1. Start webcam stream
      activeStream = await startCameraStream();
      setStream(activeStream);
      streamRef.current = activeStream;
      
      // 2. Set to loading vision state
      setStatus('loading-vision');

      // 3. Load MediaPipe task models
      if (!poseLandmarkerRef.current) {
        poseLandmarkerRef.current = await initializePoseDetection();
      }
      if (!handLandmarkerRef.current) {
        handLandmarkerRef.current = await initializeHandDetection();
      }

      // 4. Everything ready! Set status to working
      setStatus('working');
    } catch (err: any) {
      console.error('Camera/Vision setup error:', err);
      // Clean up stream if open
      if (activeStream) {
        stopCameraStream(activeStream);
        setStream(null);
        streamRef.current = null;
      }
      
      // Categorize failure
      if (
        err.message === 'PERMISSION_DENIED' || 
        err.message === 'NO_CAMERA_FOUND' || 
        err.message === 'CAMERA_IN_USE' || 
        err.message === 'BROWSER_UNSUPPORTED'
      ) {
        setErrorType(err.message as CameraErrorType);
      } else {
        setErrorType('VISION_INIT_FAILED');
      }
      setStatus('error');
    }
  };

  // Real-time computer vision detection loop
  useEffect(() => {
    const updateDiagDOM = (vision: string, video: string, size: string, poses: number, playersCount: number, loop: string) => {
      const elVision = document.getElementById('diag-vision');
      const elVideo = document.getElementById('diag-video');
      const elSize = document.getElementById('diag-size');
      const elPoses = document.getElementById('diag-poses');
      const elPlayers = document.getElementById('diag-players');
      const elLoop = document.getElementById('diag-loop');

      if (elVision) elVision.innerText = vision;
      if (elVideo) {
        elVideo.innerText = video;
        elVideo.className = video === 'READY' ? 'text-green-400 font-bold' : 'text-red-400';
      }
      if (elSize) elSize.innerText = size;
      if (elPoses) elPoses.innerText = String(poses);
      if (elPlayers) elPlayers.innerText = String(playersCount);
      if (elLoop) {
        elLoop.innerText = loop;
        elLoop.className = loop === 'RUNNING' ? 'text-green-400 font-bold' : 'text-red-400';
      }
    };

    const runDetection = () => {
      const videoElement = document.getElementById('vybe-webcam-video') as HTMLVideoElement | null;
      const poseLandmarker = poseLandmarkerRef.current;
      const handLandmarker = handLandmarkerRef.current;

      const isVideoReady = videoElement && videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
      const isVisionReady = !!(poseLandmarker && handLandmarker);

      if (isVideoReady && isVisionReady && videoElement && poseLandmarker && handLandmarker) {
        const timestamp = performance.now();
        
        // 1. Detect body poses
        const poseResult = detectBodyPose(poseLandmarker, videoElement, timestamp);
        
        // 2. Detect hand landmarks
        const handResult = detectHandLandmarks(handLandmarker, videoElement, timestamp);
        
        // 3. Combine results, order players left-to-right, and match hands
        const detectedPlayers = detectPlayers(poseResult, handResult);
        
        setPlayers(detectedPlayers);

        const numPosesDetected = poseResult?.landmarks ? poseResult.landmarks.length : 0;
        const numPlayersDetected = detectedPlayers.length;

        // Update Diagnostics DOM
        updateDiagDOM(
          'READY',
          'READY',
          `${videoElement.videoWidth}x${videoElement.videoHeight}`,
          numPosesDetected,
          numPlayersDetected,
          'RUNNING'
        );

        // Throttled Console Log
        const now = performance.now();
        if (now - lastLogTimeRef.current > 2000 || numPlayersDetected !== lastPlayerCountRef.current) {
          console.log(`[CameraSetup Screen] MediaPipe raw poses: ${numPosesDetected}, players mapped: ${numPlayersDetected}`);
          lastLogTimeRef.current = now;
          lastPlayerCountRef.current = numPlayersDetected;
        }
      } else {
        const readyState = videoElement ? videoElement.readyState : 0;
        const width = videoElement ? videoElement.videoWidth : 0;
        const height = videoElement ? videoElement.videoHeight : 0;

        updateDiagDOM(
          isVisionReady ? 'READY' : (status === 'loading-vision' ? 'LOADING' : 'ERROR'),
          videoElement ? `READYSTATE ${readyState}` : 'NOT FOUND',
          `${width}x${height}`,
          0,
          0,
          loopActiveRef.current ? 'RUNNING' : 'STOPPED'
        );
      }

      if (loopActiveRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(runDetection);
      }
    };

    if (status === 'working') {
      loopActiveRef.current = true;
      animationFrameIdRef.current = requestAnimationFrame(runDetection);
    } else {
      loopActiveRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      setPlayers([]);
    }

    return () => {
      loopActiveRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [status]);

  // Clean release of models and cameras on unmount
  useEffect(() => {
    return () => {
      // Release camera tracks
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
      }
      // Release MediaPipe resources
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  const handleBack = () => {
    handleStopCamera();
    navigate('/games');
  };

  const handleReady = () => {
    handleStopCamera();
    navigate('/play');
  };

  // Determine friendly header messages based on players count
  const getVisionStatusText = () => {
    if (players.length === 0) {
      return 'No players detected';
    } else if (players.length === 1) {
      return '1 Player Detected';
    } else {
      return '2 Players Detected';
    }
  };

  const getVisionGuidanceText = () => {
    if (players.length === 0) {
      return 'Step into the camera frame';
    } else if (players.length === 1) {
      return 'We need one more player';
    } else {
      return '2 Players ready!';
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
            {status === 'working' ? getVisionStatusText() : 'Camera Check'}
          </motion.h1>
          <motion.p 
            variants={textItemVariants}
            className="font-sans font-semibold text-xs sm:text-sm text-slate-555"
          >
            {status === 'working' ? getVisionGuidanceText() : 'VYBE needs your camera to turn movement into gameplay'}
          </motion.p>
        </motion.div>

        {/* Active Stream / Models Setup */}
        <div className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            {status === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 border-2 border-slate-950 flex items-center justify-center mb-6 text-brand-purple shadow-chunky-sm">
                  <Camera className="w-8 h-8 stroke-[2.5]" />
                </div>
                
                <h3 className="font-display font-black text-xl text-slate-900 uppercase mb-2">
                  Enable Camera Stream
                </h3>
                
                <p className="font-sans text-xs text-slate-550 leading-relaxed mb-6 font-semibold">
                  VYBE processes your camera feed locally in the browser. Video frames are never recorded or uploaded to the cloud.
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
                <span className="font-mono text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">
                  Connecting Camera...
                </span>
              </motion.div>
            )}

            {status === 'loading-vision' && (
              <motion.div
                key="loading-vision"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md p-10 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky flex flex-col items-center justify-center text-center aspect-[4/3]"
              >
                <div className="w-10 h-10 rounded-full border-4 border-dashed border-brand-purple animate-spin mb-4" />
                <h3 className="font-display font-black text-lg text-slate-900 uppercase mb-2">
                  Getting VYBE Ready...
                </h3>
                <span className="font-sans text-xs font-semibold text-slate-500 animate-pulse">
                  Loading camera vision models
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
                  Vision System Offline
                </h3>
                
                <p className="font-sans text-xs text-slate-555 leading-relaxed mb-6 font-semibold px-2">
                  {errorType === 'VISION_INIT_FAILED' 
                    ? 'Something went wrong loading the computer-vision system. Please try again.' 
                    : getFriendlyCameraErrorMessage(errorType)}
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
                {/* Visual camera feed with skeleton overlay */}
                <div className="relative w-full">
                  <CameraPreview stream={stream} />
                  <DetectedPlayerOverlay players={players} />
                </div>

                {/* Player Matchup Banner */}
                <div className="flex items-center gap-3 px-5 py-2 bg-white border-2 border-slate-950 rounded-2xl shadow-chunky-sm text-xs font-display font-black tracking-widest uppercase z-10">
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
        {/* Ready Button - Enabled only when exactly 2 players are detected */}
        <div className="relative group w-full max-w-[200px] select-none">
          <span 
            className={`absolute inset-0 w-full h-full rounded-2xl translate-x-1.5 translate-y-1.5 transition-transform ${
              status === 'working' && players.length === 2
                ? 'bg-slate-950 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0.5 group-active:translate-y-0.5' 
                : 'bg-slate-300'
            }`} 
          />
          <button
            onClick={handleReady}
            disabled={status !== 'working' || players.length !== 2}
            className={`relative w-full flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-2xl font-display font-black text-lg uppercase tracking-wider transition-all duration-100 ${
              status === 'working' && players.length === 2
                ? 'bg-brand-purple border-slate-950 text-white cursor-pointer hover:-translate-y-1 active:translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/50'
                : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Ready</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>

      {/* Diagnostics Debug Panel */}
      <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white font-mono text-[9px] p-2 rounded-lg border border-slate-700 z-50 text-left pointer-events-none select-none flex flex-col gap-0.5">
        <div>VISION: <span id="diag-vision" className="text-brand-yellow font-bold">INIT</span></div>
        <div>VIDEO: <span id="diag-video" className="text-red-400">NOT READY</span></div>
        <div>SIZE: <span id="diag-size">0x0</span></div>
        <div>POSES: <span id="diag-poses">0</span></div>
        <div>PLAYERS: <span id="diag-players">0</span></div>
        <div>LOOP: <span id="diag-loop" className="text-red-400">STOPPED</span></div>
      </div>

    </div>
  );
}
