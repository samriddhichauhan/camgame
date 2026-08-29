import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertTriangle,
  Trophy,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Home,
  Grid,
  Hand,
  UserCheck,
  ArrowDown
} from 'lucide-react';
import { useGameSession } from '../../context/GameSessionContext';
import ProgressIndicator from '../../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../../components/PlayfulBackgroundShapes';
import CameraPreview from '../../components/CameraPreview';
import DetectedPlayerOverlay from '../../components/DetectedPlayerOverlay';
import { visionEngine } from '../../vision/VisionEngine';
import { useVisionSystem, useVisionFrameSubscription } from '../../vision/useVisionEngine';
import VisionDebugOverlay from '../../vision/debug/VisionDebugOverlay';
import type { BodyLandmark, TrackedPlayer } from '../../vision/types/VisionTypes';
import { soundFx } from '../../utils/SoundEffects';
import { getPersonalBest, savePersonalBest } from '../../utils/PersonalBestStorage';

import type {
  ReactionRushStatus,
  ReactionPrompt,
  PlayerBaseline,
  ReactionRushRoundState,
  PlayerRoundResult
} from './ReactionRushGameTypes';
import { getRandomReactionPrompts } from './ReactionRushPrompts';
import { detectReactionRushAction } from './DetectReactionRushAction';
import { calculateReactionRushScore } from './CalculateReactionRushScore';

const REACTION_RUSH_ROUND_COUNT = 5;
const PROMPT_DURATION_SECS = 3;

export default function ReactionRushGame() {
  const navigate = useNavigate();
  const { gameMode, player1, player2 } = useGameSession();
  const isSolo = gameMode === 'SINGLE_PLAYER';
  const requiredPlayers: 1 | 2 = isSolo ? 1 : 2;

  const { isReady, stream, starting, error } = useVisionSystem(requiredPlayers, player2.name);
  const cvStatus = isReady ? 'working' : starting ? 'initializing' : error ? 'error' : 'idle';
  const showDebugOverlay = import.meta.env.DEV;

  // Tracked players state
  const [players, setPlayers] = useState<TrackedPlayer[]>([]);

  // Game Lifecycle States
  const [gameState, setGameState] = useState<ReactionRushStatus>('intro');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(3);

  // Reaction Prompts
  const [prompts, setPrompts] = useState<ReactionPrompt[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<ReactionPrompt | null>(null);

  // Baselines for standing calibration
  const [p1Baseline, setP1Baseline] = useState<PlayerBaseline | null>(null);
  const [p2Baseline, setP2Baseline] = useState<PlayerBaseline | null>(null);
  const p1CalibrationSamplesRef = useRef<BodyLandmark[][]>([]);
  const p2CalibrationSamplesRef = useRef<BodyLandmark[][]>([]);

  // Per-round Completion Tracking
  const [p1Done, setP1Done] = useState(false);
  const [p2Done, setP2Done] = useState(false);
  const [p1ReactionTime, setP1ReactionTime] = useState<number | null>(null);
  const [p2ReactionTime, setP2ReactionTime] = useState<number | null>(null);
  const p1ConfirmRef = useRef(0);
  const p2ConfirmRef = useRef(0);
  const p1HistoryRef = useRef<BodyLandmark[][]>([]);
  const p2HistoryRef = useRef<BodyLandmark[][]>([]);
  const promptStartTimeRef = useRef<number>(0);

  // Scores & Round History
  const [scores, setScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [roundStates, setRoundStates] = useState<ReactionRushRoundState[]>([]);
  const [isNewPb, setIsNewPb] = useState<boolean>(false);
  const personalBest = getPersonalBest('reaction-rush');

  // Sound Mute State
  const [isMuted, setIsMuted] = useState(() => soundFx.getMuted());
  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  // Initialize prompts on mount
  useEffect(() => {
    setPrompts(getRandomReactionPrompts(REACTION_RUSH_ROUND_COUNT));
  }, []);

  // Sync current prompt
  useEffect(() => {
    if (prompts.length > 0 && currentRound <= prompts.length) {
      setCurrentPrompt(prompts[currentRound - 1]);
    }
  }, [prompts, currentRound]);

  // Frame Processing Loop via Vision System Subscription
  useVisionFrameSubscription((frame) => {
    setPlayers(frame.players);
    if (cvStatus !== 'working') return;

    const p1 = frame.players.find((p) => p.playerIndex === 1);
    const p2 = frame.players.find((p) => p.playerIndex === 2);

    // Calibration phase during countdown
    if (gameState === 'countdown') {
      if (p1 && p1.bodyLandmarks) {
        p1CalibrationSamplesRef.current.push(p1.bodyLandmarks);
      }
      if (!isSolo && p2 && p2.bodyLandmarks) {
        p2CalibrationSamplesRef.current.push(p2.bodyLandmarks);
      }
    }

    // Active Challenge phase: Real-time action detection
    if (gameState === 'challenge-active' && currentPrompt) {
      // 1. Process Player 1
      if (p1 && !p1Done) {
        p1HistoryRef.current.push(p1.bodyLandmarks);
        if (p1HistoryRef.current.length > 30) p1HistoryRef.current.shift();

        const isP1Match = detectReactionRushAction(
          currentPrompt.detectorKey,
          p1.bodyLandmarks,
          p1Baseline,
          p1HistoryRef.current
        );

        if (isP1Match) {
          p1ConfirmRef.current++;
          if (p1ConfirmRef.current >= 3) {
            setP1Done(true);
            const reaction = Math.round(performance.now() - promptStartTimeRef.current);
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

        const isP2Match = detectReactionRushAction(
          currentPrompt.detectorKey,
          p2.bodyLandmarks,
          p2Baseline,
          p2HistoryRef.current
        );

        if (isP2Match) {
          p2ConfirmRef.current++;
          if (p2ConfirmRef.current >= 3) {
            setP2Done(true);
            const reaction = Math.round(performance.now() - promptStartTimeRef.current);
            setP2ReactionTime(reaction);
          }
        } else {
          p2ConfirmRef.current = 0;
        }
      }
    }
  }, [cvStatus, gameState, currentPrompt, p1Done, p2Done, p1Baseline, p2Baseline, isSolo]);

  // Timer Tick Interval Controller
  useEffect(() => {
    if (cvStatus !== 'working' || players.length < requiredPlayers) return;

    const activeTimerStates: ReactionRushStatus[] = ['countdown', 'challenge-active'];
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

  // Early completion trigger when player(s) react before time expires
  useEffect(() => {
    if (gameState === 'challenge-active') {
      if (isSolo && p1Done) {
        soundFx.playSuccessSound();
        handleCompleteRound();
      } else if (!isSolo && (p1Done || p2Done)) {
        // In multiplayer, the first player to react completes the round!
        soundFx.playSuccessSound();
        handleCompleteRound();
      }
    }
  }, [gameState, p1Done, p2Done, isSolo]);

  // Helper to compute standing baseline
  const computeBaseline = (samples: BodyLandmark[][]): PlayerBaseline | null => {
    if (samples.length === 0) return null;
    let sumShoulderY = 0;
    let sumHipY = 0;
    let sumTorsoHeight = 0;
    let sumCenterX = 0;
    let validCount = 0;

    samples.forEach((frame) => {
      const leftShoulder = frame.find((lm) => lm.name === 'left_shoulder');
      const rightShoulder = frame.find((lm) => lm.name === 'right_shoulder');
      const leftHip = frame.find((lm) => lm.name === 'left_hip');
      const rightHip = frame.find((lm) => lm.name === 'right_hip');

      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        const shY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipY = (leftHip.y + rightHip.y) / 2;
        const cx = (leftShoulder.x + rightShoulder.x) / 2;
        sumShoulderY += shY;
        sumHipY += hipY;
        sumTorsoHeight += Math.abs(shY - hipY);
        sumCenterX += cx;
        validCount++;
      }
    });

    if (validCount === 0) return null;

    return {
      shoulderY: sumShoulderY / validCount,
      hipY: sumHipY / validCount,
      torsoHeight: sumTorsoHeight / validCount,
      centerX: sumCenterX / validCount
    };
  };

  const handleStateTransition = () => {
    if (gameState === 'countdown') {
      soundFx.playGoSound();
      const baseP1 = computeBaseline(p1CalibrationSamplesRef.current);
      setP1Baseline(baseP1);

      if (!isSolo) {
        const baseP2 = computeBaseline(p2CalibrationSamplesRef.current);
        setP2Baseline(baseP2);
      }

      setGameState('challenge-active');
      setCountdown(PROMPT_DURATION_SECS);
      setP1Done(false);
      setP2Done(false);
      setP1ReactionTime(null);
      setP2ReactionTime(null);
      p1ConfirmRef.current = 0;
      p2ConfirmRef.current = 0;
      p1HistoryRef.current = [];
      p2HistoryRef.current = [];
      promptStartTimeRef.current = performance.now();
    } else if (gameState === 'challenge-active') {
      soundFx.playSuccessSound();
      handleCompleteRound();
    }
  };

  const handleCompleteRound = () => {
    const p1ScoreRes = calculateReactionRushScore(p1Done ? p1ReactionTime : null);
    const p2ScoreRes = isSolo ? { score: 0, ratingText: 'N/A', badgeColor: '' } : calculateReactionRushScore(p2Done ? p2ReactionTime : null);

    let roundWinner: 1 | 2 | 'draw' | null = null;
    if (!isSolo) {
      if (p1Done && p2Done) {
        const diff = Math.abs((p1ReactionTime || 0) - (p2ReactionTime || 0));
        if (diff < 100) {
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
      reactionTimeMs: p1ReactionTime,
      score: p1ScoreRes.score,
      ratingText: p1ScoreRes.ratingText
    };

    const p2Result: PlayerRoundResult = {
      completed: p2Done,
      reactionTimeMs: p2ReactionTime,
      score: p2ScoreRes.score,
      ratingText: p2ScoreRes.ratingText
    };

    const newRoundState: ReactionRushRoundState = {
      roundNumber: currentRound,
      prompt: currentPrompt!,
      player1Result: p1Result,
      player2Result: p2Result,
      winner: roundWinner
    };

    setRoundStates((prev) => [...prev, newRoundState]);
    setScores((prev) => ({
      p1: prev.p1 + p1Result.score,
      p2: prev.p2 + p2Result.score
    }));

    setGameState('round-result');
  };

  const handleNextRound = () => {
    soundFx.playClickSound();
    if (currentRound < REACTION_RUSH_ROUND_COUNT) {
      p1CalibrationSamplesRef.current = [];
      p2CalibrationSamplesRef.current = [];
      setCurrentRound((prev) => prev + 1);
      setGameState('round-intro');
    } else {
      soundFx.playWinnerSound();
      if (isSolo) {
        const updated = savePersonalBest('reaction-rush', scores.p1);
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
    setPrompts(getRandomReactionPrompts(REACTION_RUSH_ROUND_COUNT));
    setGameState('intro');
  };

  // Icon Helper
  const renderPromptIcon = (iconName: string) => {
    switch (iconName) {
      case 'Hand':
        return <Hand className="w-10 h-10 stroke-[2.5]" />;
      case 'Sparkles':
        return <Sparkles className="w-10 h-10 stroke-[2.5]" />;
      case 'UserCheck':
        return <UserCheck className="w-10 h-10 stroke-[2.5]" />;
      case 'ArrowDown':
        return <ArrowDown className="w-10 h-10 stroke-[2.5]" />;
      case 'ArrowLeft':
        return <ArrowLeft className="w-10 h-10 stroke-[2.5]" />;
      case 'ArrowRight':
        return <ArrowRight className="w-10 h-10 stroke-[2.5]" />;
      default:
        return <Zap className="w-10 h-10 stroke-[2.5]" />;
    }
  };

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
              ? 'Camera permission denied or camera unavailable.'
              : 'Failed to load computer vision models.'}
          </p>
          <button
            onClick={() => {
              visionEngine.stop();
              navigate('/games');
            }}
            className="px-6 py-2.5 bg-slate-950 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer hover:bg-slate-800"
          >
            Return to Games
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
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-brand-purple" />}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="font-display font-black text-lg text-slate-950 uppercase tracking-wide">
            Reaction Rush {isSolo && <span className="text-brand-purple text-xs font-mono font-bold ml-1">(SOLO)</span>}
          </div>
          {gameState !== 'intro' && gameState !== 'game-over' && (
            <div className="px-3 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-[10px] font-mono font-black text-brand-purple uppercase">
              Round {currentRound} / {REACTION_RUSH_ROUND_COUNT}
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
                ? 'We need you visible in the camera frame to track your rapid reaction movements!'
                : players.length === 1
                  ? `We need ${player2.name} in the camera frame to compete in reaction speed!`
                  : 'We need both players fully visible in the camera to compete in reaction speed!'}
            </p>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
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
              className="flex flex-col items-center text-center max-w-md w-full p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-purple/15 border-2 border-slate-950 flex items-center justify-center text-brand-purple mb-4 shadow-chunky-sm">
                <Zap className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-2">
                Reaction Rush
              </h2>
              <p className="font-sans text-xs text-slate-550 leading-relaxed font-semibold mb-6">
                {isSolo
                  ? 'React as fast as lightning! When the prompt appears, execute the requested motion gesture immediately.'
                  : 'A head-to-head reaction speed race! Both players receive the prompt — the FIRST to execute correctly wins the round!'}
              </p>

              {isSolo && personalBest && (
                <div className="w-full py-2 px-4 bg-brand-yellow/20 border-2 border-slate-950 rounded-2xl flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-brand-purple" />
                    <span className="text-xs font-display font-black uppercase text-slate-950">Personal Best</span>
                  </div>
                  <span className="font-mono font-black text-sm text-brand-purple">{personalBest.score} pts</span>
                </div>
              )}

              <div className="relative group w-full max-w-[200px]">
                <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-hover:translate-x-1.5 group-hover:translate-y-1.5 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                <button
                  onClick={() => {
                    soundFx.playClickSound();
                    setGameState('round-intro');
                  }}
                  className="relative w-full py-3.5 bg-brand-purple text-white font-display font-black text-base uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
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
                Round {currentRound} / {REACTION_RUSH_ROUND_COUNT}
              </span>
              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-3">
                Stand Ready!
              </h2>
              <p className="font-sans text-xs text-slate-500 font-semibold mb-8 px-2">
                {isSolo
                  ? 'Keep your eyes on the screen! Be ready to react the instant the prompt appears.'
                  : 'Both players stand ready in frame! Fast hands win the points.'}
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
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">GET SET</span>
                <h2 className="font-display font-black text-2xl text-slate-950 uppercase">
                  Calibrating vision...
                </h2>
              </div>

              <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                <CameraPreview stream={stream} />
                <DetectedPlayerOverlay players={players} />

                <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                  <div className="text-center">
                    <span className="text-white text-[9px] font-display font-black tracking-widest uppercase mb-1 block">ACTION PROMPT IN</span>
                    <span className="text-brand-yellow font-display font-black text-6xl drop-shadow-chunky">{countdown}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 4: Active Prompt / Challenge */}
          {gameState === 'challenge-active' && currentPrompt && (
            <motion.div
              key="challenge"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center gap-4"
            >
              {/* Action Banner */}
              <div className="w-full max-w-md p-4 bg-brand-yellow border-[3px] border-slate-950 rounded-2xl shadow-chunky text-center flex flex-col items-center gap-1 animate-pulse-slow">
                <div className="flex items-center gap-2 text-slate-950">
                  {renderPromptIcon(currentPrompt.iconName)}
                  <h3 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
                    {currentPrompt.promptText}
                  </h3>
                </div>
                <p className="font-sans text-xs font-bold text-slate-800">
                  {currentPrompt.instruction}
                </p>
              </div>

              {/* Viewfinder Feed & Timer Header */}
              <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                <CameraPreview stream={stream} />
                <DetectedPlayerOverlay players={players} />

                {/* Top Floating Timer */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-950/80 border border-white/20 rounded-full backdrop-blur-md flex items-center gap-2 text-brand-yellow font-mono font-black text-sm">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>00:0{countdown}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 5: Round Result */}
          {gameState === 'round-result' && roundStates.length > 0 && (
            <motion.div
              key="round-result"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <span className="px-3 py-1 bg-brand-purple/10 border border-brand-purple/30 text-brand-purple font-mono font-black text-[10px] uppercase rounded-full mb-3">
                Round {currentRound} Results
              </span>

              <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-950 uppercase mb-4">
                {isSolo
                  ? roundStates[currentRound - 1]?.player1Result.ratingText
                  : roundStates[currentRound - 1]?.winner === 'draw'
                    ? 'Dead Heat Tie!'
                    : roundStates[currentRound - 1]?.winner === 1
                      ? `${player1.name} Reacted First!`
                      : `${player2.name} Reacted First!`}
              </h2>

              {/* Detailed Breakdown */}
              <div className="w-full flex flex-col gap-3 mb-6">
                <div className="p-4 border-2 border-slate-950 rounded-2xl bg-slate-50 flex items-center justify-between">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-display font-black text-brand-purple uppercase">{player1.name}</span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {roundStates[currentRound - 1]?.player1Result.reactionTimeMs
                        ? `${roundStates[currentRound - 1].player1Result.reactionTimeMs} ms`
                        : 'No response'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-lg text-slate-950">
                      +{roundStates[currentRound - 1]?.player1Result.score} pts
                    </span>
                  </div>
                </div>

                {!isSolo && (
                  <div className="p-4 border-2 border-slate-950 rounded-2xl bg-slate-50 flex items-center justify-between">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-display font-black text-brand-coral uppercase">{player2.name}</span>
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {roundStates[currentRound - 1]?.player2Result.reactionTimeMs
                          ? `${roundStates[currentRound - 1].player2Result.reactionTimeMs} ms`
                          : 'No response'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-lg text-slate-950">
                        +{roundStates[currentRound - 1]?.player2Result.score} pts
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative group w-full max-w-[180px]">
                <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-hover:translate-x-1.5 group-hover:translate-y-1.5 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                <button
                  onClick={handleNextRound}
                  className="relative w-full py-3 bg-brand-purple text-white font-display font-black text-base uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform flex items-center justify-center gap-2"
                >
                  <span>{currentRound < REACTION_RUSH_ROUND_COUNT ? 'Next Round' : 'See Results'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 6: Game Over / Final Results */}
          {gameState === 'game-over' && (
            <motion.div
              key="game-over"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-yellow border-2 border-slate-950 flex items-center justify-center text-slate-950 mb-3 shadow-chunky-sm">
                <Trophy className="w-7 h-7 stroke-[2.5]" />
              </div>

              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-1">
                Game Over!
              </h2>

              {isSolo ? (
                <>
                  {isNewPb && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-purple text-white font-display font-black text-xs uppercase rounded-full mb-3 border border-slate-950">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>New Personal Best!</span>
                    </div>
                  )}

                  <div className="w-full p-5 border-2 border-slate-950 rounded-2xl bg-slate-50 flex flex-col items-center mb-6">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Final Reaction Score</span>
                    <span className="font-display font-black text-4xl text-brand-purple">{scores.p1} pts</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full flex flex-col gap-2 mb-6">
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

      {showDebugOverlay && <VisionDebugOverlay requiredPlayers={requiredPlayers} showCanvas={false} />}
    </div>
  );
}
