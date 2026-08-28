import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw, Clock, AlertTriangle, Trophy, Sparkles } from 'lucide-react';
import { useGameSession } from '../../context/GameSessionContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../../components/PlayfulBackgroundShapes';
import CameraPreview from '../../components/CameraPreview';
import DetectedPlayerOverlay from '../../components/DetectedPlayerOverlay';
import CopyCatSkeletonCompare from './CopyCatSkeletonCompare';
import { startCameraStream } from '../../camera/StartCameraStream';
import { stopCameraStream } from '../../camera/StopCameraStream';
import { initializePoseDetection } from '../../computer-vision/InitializePoseDetection';
import { initializeHandDetection } from '../../computer-vision/InitializeHandDetection';
import { detectBodyPose } from '../../computer-vision/DetectBodyPose';
import { detectHandLandmarks } from '../../computer-vision/DetectHandLandmarks';
import { detectPlayers } from '../../computer-vision/DetectPlayers';
import type { DetectedPlayer, BodyLandmark } from '../../computer-vision/ComputerVisionTypes';
import type { PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';

import type { CopyCatStatus } from './CopyCatGameTypes';
import { calculateCopyCatScore } from './CalculateCopyCatScore';
import { averagePoseSamples } from './CaptureLeaderPose';

const ROUNDS_CONFIG: { roundNumber: number; leaderPlayerIndex: 1 | 2; copyPlayerIndex: 1 | 2 }[] = [
  { roundNumber: 1, leaderPlayerIndex: 1, copyPlayerIndex: 2 }, // P1 Leader, P2 Copy
  { roundNumber: 2, leaderPlayerIndex: 2, copyPlayerIndex: 1 }, // P2 Leader, P1 Copy
  { roundNumber: 3, leaderPlayerIndex: 1, copyPlayerIndex: 2 }  // P1 Leader, P2 Copy
];

export default function CopyCatGame() {
  const navigate = useNavigate();
  const { player1, player2 } = useGameSession();

  // Stream & CV setup states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cvStatus, setCvStatus] = useState<'initializing' | 'loading-vision' | 'working' | 'error'>('initializing');
  const [players, setPlayers] = useState<DetectedPlayer[]>([]);

  // Refs for tracking background task instances
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const loopActiveRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Game Engine state
  const [gameState, setGameState] = useState<CopyCatStatus>('intro');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(0);
  const [capturedPose, setCapturedPose] = useState<BodyLandmark[] | null>(null);
  
  // Real-time live score and smoothed match results
  const [liveScore, setLiveScore] = useState<number>(0);
  const smoothedScoreRef = useRef<number>(0);
  const [roundScores, setRoundScores] = useState<number[]>([0, 0, 0]); // Rounds 1, 2, 3

  // Landmark frames sampling arrays
  const leaderSamplesRef = useRef<BodyLandmark[][]>([]);

  // Get configuration of current round
  const currentRoundState = ROUNDS_CONFIG[currentRound - 1] || ROUNDS_CONFIG[0];
  const leaderName = currentRoundState.leaderPlayerIndex === 1 ? player1.name : player2.name;
  const copyCatName = currentRoundState.copyPlayerIndex === 1 ? player1.name : player2.name;

  // Initialize camera and MediaPipe
  const handleStartCameraAndVision = async () => {
    setCvStatus('initializing');
    let activeStream: MediaStream | null = null;
    try {
      // 1. Start camera stream
      activeStream = await startCameraStream();
      setStream(activeStream);
      streamRef.current = activeStream;

      // 2. Set to loading vision state
      setCvStatus('loading-vision');

      // 3. Load MediaPipe task models
      if (!poseLandmarkerRef.current) {
        poseLandmarkerRef.current = await initializePoseDetection();
      }
      if (!handLandmarkerRef.current) {
        handLandmarkerRef.current = await initializeHandDetection();
      }

      setCvStatus('working');
    } catch (err) {
      console.error('CopyCat vision error:', err);
      if (activeStream) {
        stopCameraStream(activeStream);
        setStream(null);
        streamRef.current = null;
      }
      setCvStatus('error');
    }
  };

  // Real-time computer vision frame detection loop
  useEffect(() => {
    const runDetection = () => {
      const videoElement = document.getElementById('vybe-webcam-video') as HTMLVideoElement | null;
      const poseLandmarker = poseLandmarkerRef.current;
      const handLandmarker = handLandmarkerRef.current;

      if (videoElement && videoElement.readyState >= 2 && poseLandmarker && handLandmarker) {
        const timestamp = performance.now();
        const poseResult = detectBodyPose(poseLandmarker, videoElement, timestamp);
        const handResult = detectHandLandmarks(handLandmarker, videoElement, timestamp);
        const detectedPlayers = detectPlayers(poseResult, handResult);
        
        setPlayers(detectedPlayers);

        // Perform real-time pose calculations depending on game state
        if (gameState === 'leader-pose') {
          // Sample landmarks during the hold phase
          const leader = detectedPlayers.find((p) => p.playerIndex === currentRoundState.leaderPlayerIndex);
          if (leader) {
            leaderSamplesRef.current.push(leader.bodyLandmarks);
          }
        } else if (gameState === 'copy-pose' && capturedPose) {
          // Compare copycat to reference pose
          const copyCat = detectedPlayers.find((p) => p.playerIndex === currentRoundState.copyPlayerIndex);
          if (copyCat) {
            const rawScore = calculateCopyCatScore(capturedPose, copyCat.bodyLandmarks);
            // Apply smoothing running average to avoid flickering scores
            smoothedScoreRef.current = 0.85 * smoothedScoreRef.current + 0.15 * rawScore;
            setLiveScore(Math.round(smoothedScoreRef.current));
          }
        }
      }

      if (loopActiveRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(runDetection);
      }
    };

    if (cvStatus === 'working') {
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
  }, [cvStatus, gameState, capturedPose, currentRoundState]);

  // Clean release on unmount
  useEffect(() => {
    handleStartCameraAndVision();

    return () => {
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
      }
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

  // Timer Tick Interval Controller
  useEffect(() => {
    if (cvStatus !== 'working' || players.length < 2) return;

    // Active timing stages
    const activeTimerStates: CopyCatStatus[] = ['leader-ready', 'leader-pose', 'copy-ready', 'copy-pose'];
    if (!activeTimerStates.includes(gameState)) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleStateTransition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cvStatus, gameState, players.length]);

  // Trigger state transitions on timer expiry
  const handleStateTransition = () => {
    if (gameState === 'leader-ready') {
      // Leader Hold phase
      setGameState('leader-pose');
      setCountdown(5);
      leaderSamplesRef.current = [];
    } else if (gameState === 'leader-pose') {
      // Compute stable leader pose
      const avgPose = averagePoseSamples(leaderSamplesRef.current);
      setCapturedPose(avgPose);
      
      // Copy Cat preparation
      setGameState('copy-ready');
      setCountdown(3);
    } else if (gameState === 'copy-ready') {
      // Copy Cat matching phase
      setGameState('copy-pose');
      setCountdown(7);
      smoothedScoreRef.current = 0;
      setLiveScore(0);
    } else if (gameState === 'copy-pose') {
      // Save round results
      const finalScore = Math.max(10, Math.min(100, liveScore));
      setRoundScores((prev) => {
        const next = [...prev];
        next[currentRound - 1] = finalScore;
        return next;
      });
      setGameState('round-result');
    }
  };

  const handleNextRound = () => {
    if (currentRound < 3) {
      setCapturedPose(null);
      setCurrentRound(prev => prev + 1);
      setGameState('round-intro');
    } else {
      setGameState('game-over');
    }
  };

  // Start round intro countdown
  const handleStartRound = () => {
    setGameState('leader-ready');
    setCountdown(3);
  };

  const handleRestart = () => {
    setRoundScores([0, 0, 0]);
    setCurrentRound(1);
    setCapturedPose(null);
    setGameState('intro');
  };

  // Game over score calculators
  const getP2Total = () => roundScores[0] + roundScores[2]; // Round 1 and Round 3

  // Averages compared for winner
  const getP2Average = () => Math.round(getP2Total() / 2);
  const getP1Average = () => roundScores[1];

  const getWinnerName = () => {
    const p1Avg = getP1Average();
    const p2Avg = getP2Average();
    if (p1Avg > p2Avg) return player1.name;
    if (p2Avg > p1Avg) return player2.name;
    return 'TIE';
  };

  const getCopyCatStatusDetails = () => {
    if (liveScore >= 90) return 'PERFECT COPY!';
    if (liveScore >= 80) return 'GREAT MATCH!';
    if (liveScore >= 60) return 'NICE TRY!';
    return 'KEEP PRACTICING!';
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  // Render CV Setup states
  if (cvStatus === 'initializing' || cvStatus === 'loading-vision') {
    return (
      <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-bg-cream text-slate-800 select-none">
        <PlayfulBackgroundShapes />
        <div className="flex flex-col items-center text-center p-8 bg-white border-[3px] border-slate-950 rounded-3xl shadow-chunky z-10 max-w-sm">
          <div className="w-12 h-12 rounded-full border-4 border-dashed border-brand-purple animate-spin mb-4" />
          <h2 className="font-display font-black text-xl text-slate-950 uppercase mb-1">
            Getting VYBE Ready...
          </h2>
          <p className="font-sans text-xs text-slate-500 font-semibold animate-pulse">
            Loading camera vision models
          </p>
        </div>
      </div>
    );
  }

  if (cvStatus === 'error') {
    return (
      <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-bg-cream text-slate-800 select-none">
        <PlayfulBackgroundShapes />
        <div className="flex flex-col items-center text-center p-8 bg-white border-[3px] border-slate-950 rounded-3xl shadow-chunky z-10 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-brand-coral/15 border-2 border-brand-coral flex items-center justify-center text-brand-coral mb-4 shadow-chunky-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-display font-black text-xl text-slate-950 uppercase mb-2">
            Vision System Offline
          </h2>
          <p className="font-sans text-xs text-slate-550 leading-relaxed font-semibold mb-6">
            Something went wrong loading the computer-vision system. Please try restarting.
          </p>
          <button
            onClick={handleStartCameraAndVision}
            className="px-6 py-2.5 bg-brand-coral text-white font-display font-black text-sm uppercase rounded-xl border-2 border-slate-950 shadow-chunky-sm"
          >
            Retry Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center bg-bg-cream text-slate-800 p-4 sm:p-6 select-none">
      <PlayfulBackgroundShapes />

      {/* Screen Header */}
      <div className="w-full flex items-center justify-between z-20">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group cursor-pointer"
        >
          <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
          <button 
            onClick={() => {
              stopCameraStream(streamRef.current);
              navigate('/games');
            }}
            className="relative flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span>Quit</span>
          </button>
        </motion.div>

        {/* HUD Game & Round Information */}
        <div className="flex flex-col items-center">
          <div className="font-display font-black text-lg text-slate-950 uppercase tracking-wide">
            Copy Cat
          </div>
          {gameState !== 'intro' && gameState !== 'game-over' && (
            <div className="px-3 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-[10px] font-mono font-black text-brand-purple uppercase">
              Round {currentRound} / 3
            </div>
          )}
        </div>

        <ProgressIndicator currentStep={4} />
      </div>

      {/* PAUSE OVERLAY: Show if players go out of frame during active countdown phases */}
      {gameState !== 'intro' && gameState !== 'round-result' && gameState !== 'game-over' && players.length < 2 && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade">
          <div className="flex flex-col items-center text-center p-8 bg-white border-[3px] border-slate-950 rounded-3xl shadow-chunky max-w-sm m-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-yellow border-2 border-slate-950 flex items-center justify-center text-slate-950 mb-4 shadow-chunky-sm animate-bounce">
              <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="font-display font-black text-xl text-slate-950 uppercase mb-2">
              Step Into The Frame
            </h3>
            <p className="font-sans text-xs text-slate-500 font-semibold leading-relaxed">
              We need both players fully visible in the camera to continue the copy matching!
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center w-full max-w-5xl z-10 my-auto overflow-hidden">
        <AnimatePresence mode="wait">
          {/* STATE 1: Intro Screen */}
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-md w-full p-8 sm:p-12 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-coral border-2 border-slate-950 flex items-center justify-center text-white mb-6 shadow-chunky-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-950 uppercase mb-2">
                Copy Cat
              </h2>
              <p className="font-sans text-xs sm:text-sm text-slate-550 leading-relaxed font-semibold mb-8">
                One player strikes a pose. The other copies it. VYBE checks coordinates to compute matching accuracy. Get ready to swap roles!
              </p>
              
              <div className="relative group w-full max-w-[200px]">
                <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-2xl translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                <button
                  onClick={() => setGameState('round-intro')}
                  className="relative w-full py-4 bg-brand-purple text-white font-display font-black text-lg uppercase tracking-wider rounded-2xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
                >
                  Let's Play
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 2: Round Intro Details */}
          {gameState === 'round-intro' && (
            <motion.div
              key="round-intro"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-md w-full p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <span className="px-3 py-1 bg-brand-purple/10 border border-brand-purple/20 text-xs font-mono font-black text-brand-purple rounded-lg uppercase mb-3">
                Round {currentRound} Setup
              </span>
              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-6">
                Swap Roles!
              </h2>

              <div className="w-full flex justify-around items-center gap-4 mb-8 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                <div>
                  <div className="text-[9px] font-mono font-black text-brand-coral uppercase tracking-wider">
                    Pose Leader
                  </div>
                  <div className="font-display font-black text-lg text-slate-800 uppercase mt-0.5">
                    {leaderName}
                  </div>
                </div>
                <div className="h-8 w-[2px] bg-slate-200" />
                <div>
                  <div className="text-[9px] font-mono font-black text-brand-purple uppercase tracking-wider">
                    Copy Cat
                  </div>
                  <div className="font-display font-black text-lg text-slate-800 uppercase mt-0.5">
                    {copyCatName}
                  </div>
                </div>
              </div>

              <div className="relative group w-full max-w-[180px]">
                <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-hover:translate-x-1.5 group-hover:translate-y-1.5 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                <button
                  onClick={handleStartRound}
                  className="relative w-full py-3 bg-brand-purple text-white font-display font-black text-base uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
                >
                  Start Round
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 3: Leader Countdowns & Pose Hold */}
          {(gameState === 'leader-ready' || gameState === 'leader-pose') && (
            <motion.div
              key="leader-flow"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center gap-4"
            >
              {/* Overlay HUD indicators */}
              <div className="flex flex-col items-center text-center">
                <span className="px-3 py-1 rounded-full bg-brand-coral text-white border-2 border-slate-950 font-display font-black text-xs uppercase tracking-widest shadow-chunky-sm mb-2">
                  LEADER: {leaderName}
                </span>
                <h2 className="font-display font-black text-2xl uppercase tracking-wide text-slate-900 leading-tight">
                  {gameState === 'leader-ready' ? 'Get ready to pose' : 'Hold your pose!'}
                </h2>
              </div>

              {/* Central Video Viewport */}
              <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                <CameraPreview stream={stream} />
                <DetectedPlayerOverlay players={players} />

                {/* Big Center Timer Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none">
                  <div className="flex flex-col items-center">
                    <span className="text-white text-[10px] font-display font-black tracking-widest uppercase mb-1 drop-shadow">
                      {gameState === 'leader-ready' ? 'PREPARE' : 'HOLD POSE'}
                    </span>
                    <span className="text-brand-yellow font-display font-black text-7xl drop-shadow-chunky">
                      {countdown}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 4: Copy Cat Countdowns & Matching */}
          {(gameState === 'copy-ready' || gameState === 'copy-pose') && (
            <motion.div
              key="copy-flow"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center gap-4"
            >
              {/* Score HUD & Roles */}
              <div className="w-full flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-full bg-brand-purple text-white border-2 border-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-chunky-sm">
                    COPY CAT: {copyCatName}
                  </span>
                </div>
                <h2 className="font-display font-black text-2xl uppercase tracking-wide text-slate-900">
                  {gameState === 'copy-ready' ? 'Get ready to copy' : 'Copy the pose!'}
                </h2>
              </div>

              {/* Side-by-Side Comparison Panels */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                
                {/* Left Panel: Reference Pose skeleton */}
                <div className="flex flex-col items-center w-full aspect-[4/3] max-h-[35vh] md:max-h-[none] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-white relative">
                  <CopyCatSkeletonCompare
                    leaderPose={capturedPose}
                    copyPose={players.find((p) => p.playerIndex === currentRoundState.copyPlayerIndex)?.bodyLandmarks || null}
                    leaderColor="#ff5757"
                    copyColor="#7c3aed"
                    leaderName="LEADER POSE"
                    copyName="YOUR SKELETON"
                  />
                </div>

                {/* Right Panel: Live Camera Feed */}
                <div className="relative w-full aspect-[4/3] max-h-[35vh] md:max-h-[none] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                  <CameraPreview stream={stream} />
                  <DetectedPlayerOverlay players={players} />

                  {/* Timer display */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-700 text-brand-yellow font-display font-black text-sm px-3 py-1 rounded-full flex items-center gap-1.5 tracking-wider shadow z-20">
                    <Clock className="w-4 h-4 text-brand-yellow animate-pulse" />
                    <span>0:0{countdown}</span>
                  </div>

                  {/* Ready countdown overlay */}
                  {gameState === 'copy-ready' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                      <div className="text-center">
                        <span className="text-white text-[9px] font-display font-black tracking-widest uppercase mb-1 block">COPYING IN</span>
                        <span className="text-brand-yellow font-display font-black text-5xl drop-shadow-chunky">{countdown}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Live matching score HUD */}
              {gameState === 'copy-pose' && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center px-6 py-2.5 bg-white border-2 border-slate-950 rounded-2xl shadow-chunky-sm mt-1"
                >
                  <span className="text-[10px] font-display font-black text-slate-400 tracking-widest uppercase">Live Match Score</span>
                  <span className="font-display font-black text-3xl text-brand-purple mt-0.5">{liveScore}%</span>
                  <span className="text-[9px] font-mono font-black text-brand-coral uppercase mt-0.5 tracking-wider">
                    {getCopyCatStatusDetails()}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STATE 5: Round Results Summary */}
          {gameState === 'round-result' && (
            <motion.div
              key="round-result"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-md w-full p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <span className="px-3 py-1 bg-brand-yellow text-slate-950 border-2 border-slate-950 text-[10px] font-mono font-black rounded-lg uppercase mb-4 shadow-chunky-sm">
                Round {currentRound} Complete
              </span>

              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-2">
                Great Copy!
              </h2>

              <div className="flex flex-col items-center my-6">
                <span className="text-slate-400 font-display font-bold text-xs uppercase tracking-wider">Match Accuracy</span>
                <span className="font-display font-black text-6xl text-brand-purple mt-1">{roundScores[currentRound - 1]}%</span>
                <span className="px-3 py-0.5 rounded bg-brand-coral/10 border border-brand-coral/20 text-[9px] font-mono font-black text-brand-coral uppercase tracking-wider mt-2">
                  {roundScores[currentRound - 1] >= 90 ? 'PERFECT COPY' : roundScores[currentRound - 1] >= 80 ? 'GREAT MATCH' : roundScores[currentRound - 1] >= 60 ? 'NICE TRY' : 'KEEP PRACTICING'}
                </span>
              </div>

              <div className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-8 flex justify-around items-center">
                <div>
                  <div className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider">Leader</div>
                  <div className="font-display font-black text-sm text-slate-800 uppercase mt-0.5">{leaderName}</div>
                </div>
                <div className="h-6 w-[2px] bg-slate-200" />
                <div>
                  <div className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-wider">Copy Cat</div>
                  <div className="font-display font-black text-sm text-slate-800 uppercase mt-0.5">{copyCatName}</div>
                </div>
              </div>

              <div className="relative group w-full max-w-[200px]">
                <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-2xl translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                <button
                  onClick={handleNextRound}
                  className="relative w-full py-4 bg-brand-purple text-white font-display font-black text-lg uppercase tracking-wider rounded-2xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
                >
                  <span>{currentRound < 3 ? 'Next Round' : 'See Results'}</span>
                  <ArrowRight className="w-5 h-5 inline-block stroke-[2.5] ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 6: Game Over Summary */}
          {gameState === 'game-over' && (
            <motion.div
              key="game-over"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-md w-full p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-yellow border-2 border-slate-950 flex items-center justify-center text-slate-950 mb-4 shadow-chunky-sm">
                <Trophy className="w-7 h-7 stroke-[2.5]" />
              </div>

              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-6">
                Copy Cat Complete
              </h2>

              {/* Leaderboard blocks */}
              <div className="w-full flex flex-col gap-3 mb-8">
                {/* Player 1 Block */}
                <div className="flex justify-between items-center p-3 border-2 border-slate-950 rounded-2xl bg-slate-50">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-display font-black text-brand-purple uppercase tracking-wider">Player 1</span>
                    <span className="font-display font-black text-base text-slate-800 uppercase mt-0.5">{player1.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Avg Accuracy</span>
                    <span className="font-display font-black text-xl text-slate-900 mt-0.5">{getP1Average()}%</span>
                  </div>
                </div>

                {/* Player 2 Block */}
                <div className="flex justify-between items-center p-3 border-2 border-slate-950 rounded-2xl bg-slate-50">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-display font-black text-brand-coral uppercase tracking-wider">Player 2</span>
                    <span className="font-display font-black text-base text-slate-800 uppercase mt-0.5">{player2.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Avg Accuracy</span>
                    <span className="font-display font-black text-xl text-slate-900 mt-0.5">{getP2Average()}%</span>
                  </div>
                </div>
              </div>

              {/* Winner Header banner */}
              <div className="px-6 py-3 border-2 border-slate-950 rounded-2xl bg-brand-yellow font-display font-black text-xl uppercase tracking-widest shadow-chunky-sm mb-8">
                {getWinnerName() === 'TIE' ? "It's a Tie!" : `WINNER: ${getWinnerName()}`}
              </div>

              {/* Restart Button */}
              <div className="relative group w-full max-w-[180px]">
                <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-hover:translate-x-1.5 group-hover:translate-y-1.5 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                <button
                  onClick={handleRestart}
                  className="relative w-full py-3 bg-brand-purple text-white font-display font-black text-base uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
                >
                  <RefreshCw className="w-4 h-4 inline-block mr-2" />
                  <span>Play Again</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer */}
      <div className="h-10 opacity-0 pointer-events-none" />

    </div>
  );
}
