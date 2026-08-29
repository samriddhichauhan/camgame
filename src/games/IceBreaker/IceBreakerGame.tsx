import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw, Clock, AlertTriangle, Trophy, Sparkles, CheckCircle2, Award, Zap, Volume2, VolumeX, Home, Grid } from 'lucide-react';
import { useGameSession } from '../../context/GameSessionContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../../components/PlayfulBackgroundShapes';
import CameraPreview from '../../components/CameraPreview';
import DetectedPlayerOverlay from '../../components/DetectedPlayerOverlay';
import { visionEngine } from '../../vision/VisionEngine';
import { useVisionSystem, useVisionFrameSubscription } from '../../vision/useVisionEngine';
import VisionDebugOverlay from '../../vision/debug/VisionDebugOverlay';
import type { TrackedPlayer, BodyLandmark } from '../../vision/types/VisionTypes';
import { soundFx } from '../../utils/SoundEffects';

import type { IceBreakerStatus, IceBreakerChallenge, IceBreakerRoundState, PlayerRoundResult } from './IceBreakerGameTypes';
import { getRandomChallenges } from './IceBreakerChallenges';
import { detectIceBreakerAction } from './DetectIceBreakerAction';
import type { PlayerBaseline } from './DetectIceBreakerAction';
import { calculateIceBreakerScore } from './CalculateIceBreakerScore';
import { getPersonalBest, savePersonalBest } from '../../utils/PersonalBestStorage';

const ICE_BREAKER_ROUND_COUNT = 5;
const CHALLENGE_DURATION_SECS = 5;

export default function IceBreakerGame() {
  const navigate = useNavigate();
  const { gameMode, player1, player2 } = useGameSession();

  const isSolo = gameMode === 'SINGLE_PLAYER';
  const requiredPlayers: 1 | 2 = isSolo ? 1 : 2;

  // Shared vision engine — camera + person detection + pose + tracking all
  // live outside this component. This screen only consumes the player API.
  const { stream, starting, error, retry } = useVisionSystem(requiredPlayers, player2.name);
  const cvStatus: 'initializing' | 'working' | 'error' = error ? 'error' : starting ? 'initializing' : 'working';
  const [players, setPlayers] = useState<TrackedPlayer[]>([]);

  // Game state
  const [gameState, setGameState] = useState<IceBreakerStatus>('intro');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(0);
  
  // Shuffled round challenges
  const [roundsChallenges, setRoundsChallenges] = useState<IceBreakerChallenge[]>([]);
  const currentChallenge = roundsChallenges[currentRound - 1] || null;

  // Real-time detection feedback states
  const [p1Done, setP1Done] = useState<boolean>(false);
  const [p2Done, setP2Done] = useState<boolean>(false);
  const [p1ReactionTime, setP1ReactionTime] = useState<number | null>(null);
  const [p2ReactionTime, setP2ReactionTime] = useState<number | null>(null);

  // Standing baselines and history queues
  const [p1Baseline, setP1Baseline] = useState<PlayerBaseline | null>(null);
  const [p2Baseline, setP2Baseline] = useState<PlayerBaseline | null>(null);
  const p1HistoryRef = useRef<BodyLandmark[][]>([]);
  const p2HistoryRef = useRef<BodyLandmark[][]>([]);

  // Confirmation counters to avoid false positive triggers (require 5 consecutive matches)
  const p1ConfirmRef = useRef<number>(0);
  const p2ConfirmRef = useRef<number>(0);

  // Calibration buffers sampled during ready countdowns
  const p1CalibrationSamplesRef = useRef<BodyLandmark[][]>([]);
  const p2CalibrationSamplesRef = useRef<BodyLandmark[][]>([]);

  // Timestamps
  const challengeStartTimeRef = useRef<number>(0);

  // Aggregate results and scores
  const [roundStates, setRoundStates] = useState<IceBreakerRoundState[]>([]);
  const [scores, setScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [isNewPb, setIsNewPb] = useState<boolean>(false);

  // Consume the shared vision engine's per-frame output. Camera + person
  // detection + pose + tracking all happen outside this component.
  useVisionFrameSubscription(
    (frame) => {
      setPlayers(frame.players);

      const p1 = frame.players.find((p) => p.playerIndex === 1);
      const p2 = frame.players.find((p) => p.playerIndex === 2);

      if (gameState === 'countdown' && countdown <= 2) {
        // Accumulate standing coordinates for baseline mapping
        if (p1) p1CalibrationSamplesRef.current.push(p1.bodyLandmarks);
        if (p2) p2CalibrationSamplesRef.current.push(p2.bodyLandmarks);
      } else if (gameState === 'challenge-active' && currentChallenge && frame.players.length >= requiredPlayers) {
        // 1. Process Player 1
        if (p1 && !p1Done) {
          p1HistoryRef.current.push(p1.bodyLandmarks);
          if (p1HistoryRef.current.length > 30) p1HistoryRef.current.shift();

          const isP1ActionMatch = detectIceBreakerAction(
            currentChallenge.detectorKey,
            p1.bodyLandmarks,
            p1Baseline,
            p1HistoryRef.current
          );

          if (isP1ActionMatch) {
            p1ConfirmRef.current++;
            if (p1ConfirmRef.current >= 5) {
              setP1Done(true);
              const reaction = Math.round(performance.now() - challengeStartTimeRef.current);
              setP1ReactionTime(reaction);
            }
          } else {
            p1ConfirmRef.current = 0;
          }
        }

        // 2. Process Player 2 (multiplayer only)
        if (!isSolo && p2 && !p2Done) {
          p2HistoryRef.current.push(p2.bodyLandmarks);
          if (p2HistoryRef.current.length > 30) p2HistoryRef.current.shift();

          const isP2ActionMatch = detectIceBreakerAction(
            currentChallenge.detectorKey,
            p2.bodyLandmarks,
            p2Baseline,
            p2HistoryRef.current
          );

          if (isP2ActionMatch) {
            p2ConfirmRef.current++;
            if (p2ConfirmRef.current >= 5) {
              setP2Done(true);
              const reaction = Math.round(performance.now() - challengeStartTimeRef.current);
              setP2ReactionTime(reaction);
            }
          } else {
            p2ConfirmRef.current = 0;
          }
        }
      }
    },
    [gameState, currentChallenge, p1Baseline, p2Baseline, p1Done, p2Done, isSolo, requiredPlayers]
  );

  // Shuffle challenges at start
  useEffect(() => {
    setRoundsChallenges(getRandomChallenges(ICE_BREAKER_ROUND_COUNT));
  }, []);

  const [isMuted, setIsMuted] = useState(() => soundFx.getMuted());

  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  // Timer Tick Interval Controller
  useEffect(() => {
    if (cvStatus !== 'working' || players.length < requiredPlayers) return;

    const activeTimerStates: IceBreakerStatus[] = ['countdown', 'challenge-active'];
    if (!activeTimerStates.includes(gameState)) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleStateTransition();
          return 0;
        }
        soundFx.playCountdownBeep(prev * 120 + 360);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cvStatus, gameState, players.length, requiredPlayers]);

  // Transition to round results if player(s) complete early
  useEffect(() => {
    if (gameState === 'challenge-active') {
      if (isSolo && p1Done) {
        soundFx.playSuccessSound();
        handleCompleteRound();
      } else if (!isSolo && p1Done && p2Done) {
        soundFx.playSuccessSound();
        handleCompleteRound();
      }
    }
  }, [gameState, p1Done, p2Done, isSolo]);

  // Standing Baseline calculator helper
  const computeBaseline = (samples: BodyLandmark[][]): PlayerBaseline | null => {
    if (samples.length === 0) return null;
    let sumShoulderY = 0;
    let sumHipY = 0;
    let sumTorsoHeight = 0;
    let validCount = 0;

    samples.forEach((frame) => {
      const leftShoulder = frame.find(lm => lm.name === 'left_shoulder');
      const rightShoulder = frame.find(lm => lm.name === 'right_shoulder');
      const leftHip = frame.find(lm => lm.name === 'left_hip');
      const rightHip = frame.find(lm => lm.name === 'right_hip');

      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        const shY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipY = (leftHip.y + rightHip.y) / 2;
        sumShoulderY += shY;
        sumHipY += hipY;
        sumTorsoHeight += Math.abs(shY - hipY);
        validCount++;
      }
    });

    if (validCount === 0) return null;

    return {
      shoulderY: sumShoulderY / validCount,
      hipY: sumHipY / validCount,
      torsoHeight: sumTorsoHeight / validCount
    };
  };

  const handleStateTransition = () => {
    if (gameState === 'countdown') {
      soundFx.playGoSound();
      // Calibrate baselines at countdown end
      const baseP1 = computeBaseline(p1CalibrationSamplesRef.current);
      setP1Baseline(baseP1);
      
      if (!isSolo) {
        const baseP2 = computeBaseline(p2CalibrationSamplesRef.current);
        setP2Baseline(baseP2);
      }

      // Start Challenge phase
      setGameState('challenge-active');
      setCountdown(CHALLENGE_DURATION_SECS);
      setP1Done(false);
      setP2Done(false);
      setP1ReactionTime(null);
      setP2ReactionTime(null);
      p1ConfirmRef.current = 0;
      p2ConfirmRef.current = 0;
      p1HistoryRef.current = [];
      p2HistoryRef.current = [];
      challengeStartTimeRef.current = performance.now();
    } else if (gameState === 'challenge-active') {
      soundFx.playSuccessSound();
      // 5-second timer runout
      handleCompleteRound();
    }
  };

  const handleCompleteRound = () => {
    // Determine winner and calculate scores
    const p1Score = calculateIceBreakerScore(p1Done ? p1ReactionTime : null);
    const p2Score = isSolo ? 0 : calculateIceBreakerScore(p2Done ? p2ReactionTime : null);

    let roundWinner: 1 | 2 | 'draw' | null = null;
    if (!isSolo) {
      if (p1Done && p2Done) {
        const diff = Math.abs((p1ReactionTime || 0) - (p2ReactionTime || 0));
        // Tie tolerance of 150ms
        if (diff < 150) {
          roundWinner = 'draw';
        } else {
          roundWinner = (p1ReactionTime || 0) < (p2ReactionTime || 0) ? 1 : 2;
        }
      } else if (p1Done) {
        roundWinner = 1;
      } else if (p2Done) {
        roundWinner = 2;
      } else {
        roundWinner = 'draw';
      }
    } else {
      roundWinner = p1Done ? 1 : null;
    }

    const p1Result: PlayerRoundResult = {
      completed: p1Done,
      reactionTime: p1ReactionTime,
      score: p1Score
    };

    const p2Result: PlayerRoundResult = {
      completed: p2Done,
      reactionTime: p2ReactionTime,
      score: p2Score
    };

    const newRoundState: IceBreakerRoundState = {
      roundNumber: currentRound,
      challenge: currentChallenge!,
      player1Result: p1Result,
      player2Result: p2Result,
      winner: roundWinner
    };

    setRoundStates(prev => [...prev, newRoundState]);
    setScores(prev => ({
      p1: prev.p1 + p1Score,
      p2: prev.p2 + p2Score
    }));

    setGameState('round-result');
  };

  const handleNextRound = () => {
    soundFx.playClickSound();
    if (currentRound < ICE_BREAKER_ROUND_COUNT) {
      p1CalibrationSamplesRef.current = [];
      p2CalibrationSamplesRef.current = [];
      setCurrentRound(prev => prev + 1);
      setGameState('round-intro');
    } else {
      soundFx.playWinnerSound();
      if (isSolo) {
        const updated = savePersonalBest('ice-breaker', scores.p1);
        setIsNewPb(updated);
      }
      setGameState('game-over');
    }
  };

  const handleStartRound = () => {
    soundFx.playClickSound();
    setGameState('countdown');
    setCountdown(3);
  };

  const handleRestart = () => {
    soundFx.playClickSound();
    setScores({ p1: 0, p2: 0 });
    setRoundStates([]);
    setCurrentRound(1);
    setIsNewPb(false);
    setRoundsChallenges(getRandomChallenges(ICE_BREAKER_ROUND_COUNT));
    setGameState('intro');
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  if (cvStatus === 'initializing') {
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
            {error?.type === 'camera'
              ? 'Please allow camera access in your browser and try again.'
              : 'Something went wrong loading the computer-vision system. Please try restarting.'}
          </p>
          <button
            onClick={retry}
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

      {/* Header */}
      <div className="w-full flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
            <button
              onClick={() => {
                soundFx.playClickSound();
                visionEngine.stop();
                navigate('/games');
              }}
              className="relative flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>Quit</span>
            </button>
          </motion.div>

          <button
            onClick={handleToggleMute}
            className="p-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 hover:bg-slate-100 shadow-chunky-sm cursor-pointer"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-brand-purple" />}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="font-display font-black text-lg text-slate-950 uppercase tracking-wide">
            Ice Breaker {isSolo && <span className="text-brand-purple text-xs font-mono font-bold ml-1">(SOLO)</span>}
          </div>
          {gameState !== 'intro' && gameState !== 'game-over' && (
            <div className="px-3 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-[10px] font-mono font-black text-brand-purple uppercase">
              Round {currentRound} / {ICE_BREAKER_ROUND_COUNT}
            </div>
          )}
        </div>

        <ProgressIndicator currentStep={4} />
      </div>

      {/* Safety Pause warning overlay */}
      {['countdown', 'challenge-active'].includes(gameState) && players.length < requiredPlayers && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade">
          <div className="flex flex-col items-center text-center p-8 bg-white border-[3px] border-slate-950 rounded-3xl shadow-chunky max-w-sm m-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-yellow border-2 border-slate-950 flex items-center justify-center text-slate-950 mb-4 shadow-chunky-sm animate-bounce">
              <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="font-display font-black text-xl text-slate-950 uppercase mb-2">
              {isSolo 
                ? 'Step Into The Frame' 
                : players.length === 1 
                  ? 'Player 2, Step Into The Frame' 
                  : 'Step Into The Frame'}
            </h3>
            <p className="font-sans text-xs text-slate-500 font-semibold leading-relaxed">
              {isSolo 
                ? 'We need you visible in the camera frame to complete the physical challenges!' 
                : players.length === 1
                  ? `We need ${player2.name} in the camera frame to continue the physical challenges!`
                  : 'We need both players fully visible in the camera to continue the physical challenges!'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex flex-col items-center justify-center w-full max-w-5xl z-10 my-auto overflow-hidden">
        <AnimatePresence mode="wait">
          {/* STATE 1: Intro */}
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
                Ice Breaker {isSolo ? 'Solo' : ''}
              </h2>
              <p className="font-sans text-xs sm:text-sm text-slate-550 leading-relaxed font-semibold mb-8">
                {isSolo 
                  ? 'High-speed physical action challenges against the clock! 5 rounds of motion challenges. Score maximum points by reacting fast!'
                  : 'A high-speed physical challenge game! React to the sudden coordinates request card as fast as you can. Points are awarded based on speed and accuracy.'}
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

          {/* STATE 2: Round Intro */}
          {gameState === 'round-intro' && (
            <motion.div
              key="round-intro"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-sm w-full p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <span className="px-3 py-1 bg-brand-yellow text-slate-950 border-2 border-slate-950 text-[10px] font-mono font-black rounded-lg uppercase mb-4 shadow-chunky-sm">
                Round {currentRound} / {ICE_BREAKER_ROUND_COUNT}
              </span>
              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-3">
                Stand Ready!
              </h2>
              <p className="font-sans text-xs text-slate-500 font-semibold mb-8 px-2">
                {isSolo 
                  ? 'Make sure you are standing clearly in the camera field. We will calibrate your height during the countdown.'
                  : 'Make sure you are both standing clearly in the camera field. We will calibrate your height during the countdown.'}
              </p>

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

          {/* STATE 3: Ready Countdown */}
          {gameState === 'countdown' && (
            <motion.div
              key="countdown"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center gap-4"
            >
              <div className="text-center mb-1">
                <span className="px-3 py-1 bg-brand-purple text-white border-2 border-slate-950 font-display font-black text-xs uppercase tracking-widest rounded-full shadow-chunky-sm">
                  STAND READY
                </span>
                <h2 className="font-display font-black text-2xl uppercase tracking-wide text-slate-950 mt-3">
                  Calibrating standing baselines...
                </h2>
              </div>

              {/* Camera view screen */}
              <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                <CameraPreview stream={stream} />
                <DetectedPlayerOverlay players={players} />

                {/* Countdown Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                  <div className="text-center">
                    <span className="text-white text-[9px] font-display font-black tracking-widest uppercase mb-1 block">STARTING IN</span>
                    <span className="text-brand-yellow font-display font-black text-6xl drop-shadow-chunky">{countdown}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 4: Active Challenge */}
          {gameState === 'challenge-active' && currentChallenge && (
            <motion.div
              key="challenge"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center gap-4"
            >
              {/* Challenge header */}
              <div className="text-center max-w-sm bg-white border-2 border-slate-950 rounded-2xl px-5 py-3 shadow-chunky-sm select-none pointer-events-none">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">{currentChallenge.emoji}</span>
                  <span className="font-display font-black text-xl text-slate-950 uppercase">{currentChallenge.title}</span>
                </div>
                <p className="font-sans text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {currentChallenge.instruction}
                </p>
              </div>

              {isSolo ? (
                <div className="w-full flex flex-col items-center gap-4 max-w-md">
                  {/* Solo Central Live Camera Viewport */}
                  <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                    <CameraPreview stream={stream} />
                    <DetectedPlayerOverlay players={players} />

                    {/* Timer display */}
                    <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-700 text-brand-yellow font-display font-black text-sm px-3 py-1 rounded-full flex items-center gap-1.5 tracking-wider shadow z-20">
                      <Clock className="w-4 h-4 text-brand-yellow animate-pulse" />
                      <span>0:0{countdown}</span>
                    </div>
                  </div>

                  {/* Solo Player Status Bar */}
                  <div className="w-full flex items-center justify-between p-4 border-2 border-slate-950 bg-white rounded-2xl shadow-chunky-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-display font-black text-brand-purple uppercase tracking-wider">PLAYER</span>
                        <span className="font-display font-black text-base text-slate-800 uppercase">{player1.name}</span>
                      </div>
                    </div>

                    <div>
                      {p1Done ? (
                        <div className="flex items-center gap-2 text-green-500 animate-bounce">
                          <CheckCircle2 className="w-7 h-7 fill-green-150 stroke-[2.5]" />
                          <span className="font-display font-black text-base uppercase">{(p1ReactionTime! / 1000).toFixed(2)}s</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <div className="w-6 h-6 rounded-full border-3 border-slate-200 border-t-brand-purple animate-spin" />
                          <span className="text-xs font-mono font-bold uppercase tracking-wider">DO ACTION!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Two Player Side-by-side panel */
                <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  
                  {/* Left: Player 1 Indicator */}
                  <div className="md:col-span-1 flex flex-col items-center text-center p-4 border-2 border-slate-950 bg-white rounded-2xl shadow-chunky-sm">
                    <span className="text-[10px] font-display font-black text-brand-purple uppercase tracking-wider">Player 1</span>
                    <span className="font-display font-black text-sm text-slate-800 uppercase mt-0.5 max-w-[80px] truncate">{player1.name}</span>
                    <div className="mt-4 flex items-center justify-center">
                      {p1Done ? (
                        <div className="flex flex-col items-center text-green-500 animate-pulse">
                          <CheckCircle2 className="w-8 h-8 fill-green-150 stroke-[2.5]" />
                          <span className="font-display font-black text-xs uppercase mt-1">{(p1ReactionTime! / 1000).toFixed(2)}s</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-purple animate-spin" />
                      )}
                    </div>
                  </div>

                  {/* Center: Live Camera Feed */}
                  <div className="md:col-span-3 relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                    <CameraPreview stream={stream} />
                    <DetectedPlayerOverlay players={players} />

                    {/* Timer display */}
                    <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-700 text-brand-yellow font-display font-black text-sm px-3 py-1 rounded-full flex items-center gap-1.5 tracking-wider shadow z-20">
                      <Clock className="w-4 h-4 text-brand-yellow animate-pulse" />
                      <span>0:0{countdown}</span>
                    </div>
                  </div>

                  {/* Right: Player 2 Indicator */}
                  <div className="md:col-span-1 flex flex-col items-center text-center p-4 border-2 border-slate-950 bg-white rounded-2xl shadow-chunky-sm">
                    <span className="text-[10px] font-display font-black text-brand-coral uppercase tracking-wider">Player 2</span>
                    <span className="font-display font-black text-sm text-slate-800 uppercase mt-0.5 max-w-[80px] truncate">{player2.name}</span>
                    <div className="mt-4 flex items-center justify-center">
                      {p2Done ? (
                        <div className="flex flex-col items-center text-green-500 animate-pulse">
                          <CheckCircle2 className="w-8 h-8 fill-green-150 stroke-[2.5]" />
                          <span className="font-display font-black text-xs uppercase mt-1">{(p2ReactionTime! / 1000).toFixed(2)}s</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-coral animate-spin" />
                      )}
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* STATE 5: Round Results */}
          {gameState === 'round-result' && roundStates[currentRound - 1] && (
            <motion.div
              key="round-result"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-md w-full p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <span className="px-3 py-1 bg-brand-yellow text-slate-950 border-2 border-slate-950 text-[10px] font-mono font-black rounded-lg uppercase mb-4 shadow-chunky-sm">
                Round {currentRound} Results
              </span>

              {isSolo ? (
                <>
                  <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-2">
                    {roundStates[currentRound - 1].player1Result.completed ? 'Challenge Passed!' : 'Time Up!'}
                  </h2>

                  <div className="flex flex-col items-center my-6 bg-slate-50 p-6 border-2 border-slate-950 rounded-2xl w-full shadow-chunky-sm">
                    <span className="text-[10px] font-display font-black text-brand-purple uppercase tracking-wider">Reaction Speed</span>
                    <span className="font-display font-black text-5xl text-slate-900 mt-1">
                      {roundStates[currentRound - 1].player1Result.completed 
                        ? `${(roundStates[currentRound - 1].player1Result.reactionTime! / 1000).toFixed(2)}s` 
                        : 'MISSED'}
                    </span>
                    <span className="px-3 py-1 bg-brand-purple text-white font-mono font-black text-xs uppercase rounded-full mt-3">
                      +{roundStates[currentRound - 1].player1Result.score} points
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-2">
                    {roundStates[currentRound - 1].winner === 'draw' 
                      ? "It's a Draw!" 
                      : roundStates[currentRound - 1].winner === 1 
                        ? `${player1.name} Wins!` 
                        : `${player2.name} Wins!`}
                  </h2>

                  <div className="w-full flex justify-around items-center my-6 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                    <div>
                      <div className="text-[10px] font-display font-black text-brand-purple uppercase tracking-wider">{player1.name}</div>
                      <div className="font-display font-black text-xl text-slate-800 mt-1">
                        {roundStates[currentRound - 1].player1Result.completed 
                          ? `${(roundStates[currentRound - 1].player1Result.reactionTime! / 1000).toFixed(2)}s` 
                          : 'FAIL'}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase font-bold">
                        +{roundStates[currentRound - 1].player1Result.score} pts
                      </div>
                    </div>

                    <div className="h-8 w-[2px] bg-slate-200" />

                    <div>
                      <div className="text-[10px] font-display font-black text-brand-coral uppercase tracking-wider">{player2.name}</div>
                      <div className="font-display font-black text-xl text-slate-800 mt-1">
                        {roundStates[currentRound - 1].player2Result.completed 
                          ? `${(roundStates[currentRound - 1].player2Result.reactionTime! / 1000).toFixed(2)}s` 
                          : 'FAIL'}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase font-bold">
                        +{roundStates[currentRound - 1].player2Result.score} pts
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Details banner */}
              <div className="px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono font-black text-slate-650 uppercase mb-8">
                Challenge: {roundStates[currentRound - 1].challenge.title}
              </div>

              {/* Continue button */}
              <div className="relative group w-full max-w-[200px]">
                <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-2xl translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                <button
                  onClick={handleNextRound}
                  className="relative w-full py-4 bg-brand-purple text-white font-display font-black text-lg uppercase tracking-wider rounded-2xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
                >
                  <span>{currentRound < ICE_BREAKER_ROUND_COUNT ? 'Next Round' : 'See Results'}</span>
                  <ArrowRight className="w-5 h-5 inline-block stroke-[2.5] ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 6: Game Over */}
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

              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-2">
                Ice Breaker Complete
              </h2>
              <p className="font-display font-black text-base text-brand-purple uppercase tracking-wider mb-6">
                {player1.name}
              </p>

              {isSolo ? (
                <>
                  {/* Solo Final Score Card */}
                  <div className="w-full bg-slate-50 border-2 border-slate-950 p-5 rounded-2xl mb-6 flex flex-col items-center shadow-chunky-sm">
                    <span className="text-slate-400 font-display font-bold text-xs uppercase tracking-wider">Total Score</span>
                    <span className="font-display font-black text-6xl text-brand-purple mt-1">{scores.p1} pts</span>
                    
                    {isNewPb && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-yellow text-slate-950 border border-slate-950 text-[10px] font-mono font-black rounded-full uppercase mt-3 animate-bounce">
                        <Award className="w-3.5 h-3.5" />
                        <span>NEW PERSONAL BEST!</span>
                      </div>
                    )}

                    {getPersonalBest('ice-breaker') && !isNewPb && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-2">
                        Personal Best: {getPersonalBest('ice-breaker')?.score} pts
                      </span>
                    )}
                  </div>

                  {/* Outcome Banner */}
                  <div className="w-full px-6 py-3 border-2 border-slate-950 rounded-2xl bg-brand-yellow font-display font-black text-lg uppercase tracking-widest shadow-chunky-sm mb-8">
                    {scores.p1 >= 400 ? 'LIGHTNING REFLEXES!' : scores.p1 >= 250 ? 'GREAT SPEED & AGILITY!' : 'KEEP PRACTICING!'}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full flex flex-col gap-3 mb-8">
                    <div className="flex justify-between items-center p-3 border-2 border-slate-950 rounded-2xl bg-slate-50">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-display font-black text-brand-purple uppercase tracking-wider">Player 1</span>
                        <span className="font-display font-black text-base text-slate-800 uppercase mt-0.5">{player1.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Score</span>
                        <span className="font-display font-black text-xl text-slate-900 mt-0.5">{scores.p1} pts</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 border-2 border-slate-950 rounded-2xl bg-slate-50">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-display font-black text-brand-coral uppercase tracking-wider">Player 2</span>
                        <span className="font-display font-black text-base text-slate-800 uppercase mt-0.5">{player2.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Score</span>
                        <span className="font-display font-black text-xl text-slate-900 mt-0.5">{scores.p2} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-3 border-2 border-slate-950 rounded-2xl bg-brand-yellow font-display font-black text-xl uppercase tracking-widest shadow-chunky-sm mb-8">
                    {scores.p1 === scores.p2 
                      ? "It's a Tie!" 
                      : scores.p1 > scores.p2 
                        ? `WINNER: ${player1.name}` 
                        : `WINNER: ${player2.name}`}
                  </div>
                </>
              )}

              {/* Action Buttons: Play Again / Change Game / Home */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
                <button
                  onClick={handleRestart}
                  className="w-full py-3 bg-brand-purple text-white font-display font-black text-sm uppercase tracking-wider rounded-xl border-2 border-slate-950 shadow-chunky-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isSolo ? 'Play Again' : 'Rematch'}</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClickSound();
                    navigate('/games');
                  }}
                  className="w-full py-3 bg-white text-slate-800 font-display font-black text-sm uppercase tracking-wider rounded-xl border-2 border-slate-950 shadow-chunky-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer flex items-center justify-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  <span>Change Game</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClickSound();
                    visionEngine.stop();
                    navigate('/');
                  }}
                  className="w-full sm:w-auto p-3 bg-white text-slate-700 font-display font-black text-sm uppercase rounded-xl border-2 border-slate-950 shadow-chunky-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer flex items-center justify-center"
                  title="Home"
                >
                  <Home className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-10 opacity-0 pointer-events-none" />

      {/* Diagnostics Debug Panel (development only) */}
      {import.meta.env.DEV && <VisionDebugOverlay requiredPlayers={requiredPlayers} showCanvas={false} />}

    </div>
  );
}
