import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  AlertTriangle,
  Trophy,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Home,
  Grid
} from 'lucide-react';
import { useGameSession } from '../../context/GameSessionContext';
import DetectedPlayerOverlay from '../../components/DetectedPlayerOverlay';
import { visionEngine } from '../../vision/VisionEngine';
import { useVisionSystem, useVisionFrameSubscription } from '../../vision/useVisionEngine';
import VisionDebugOverlay from '../../vision/debug/VisionDebugOverlay';
import type { TrackedPlayer } from '../../vision/types/VisionTypes';
import { soundFx } from '../../utils/SoundEffects';
import { getPersonalBest, savePersonalBest } from '../../utils/PersonalBestStorage';

import type { IceBreakerStatus, PlayerStats } from './IceBreakerGameTypes';
import { ICE_BREAKER_ROUND_DURATION, COMBO_WINDOW_MS } from './IceBreakerConfig';
import IceBreakerArenaCanvas from './IceBreakerArenaCanvas';

export default function IceBreakerGame() {
  const navigate = useNavigate();
  const { gameMode, player1, player2 } = useGameSession();
  const isSolo = gameMode === 'SINGLE_PLAYER';
  const requiredPlayers: 1 | 2 = isSolo ? 1 : 2;

  const { isReady, stream, starting, error } = useVisionSystem(requiredPlayers, player2.name);
  const cvStatus = isReady ? 'working' : starting ? 'initializing' : error ? 'error' : 'idle';
  const showDebugOverlay = import.meta.env.DEV;

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Tracked players state
  const [players, setPlayers] = useState<TrackedPlayer[]>([]);

  // Game Lifecycle States
  const [gameState, setGameState] = useState<IceBreakerStatus>('intro');
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(ICE_BREAKER_ROUND_DURATION);

  // Player Stats (Score, Combo, Highest Combo)
  const [p1Stats, setP1Stats] = useState<PlayerStats>({ score: 0, combo: 0, highestCombo: 0, lastHitTime: 0 });
  const [p2Stats, setP2Stats] = useState<PlayerStats>({ score: 0, combo: 0, highestCombo: 0, lastHitTime: 0 });

  const [isNewPb, setIsNewPb] = useState<boolean>(false);
  const personalBest = getPersonalBest('ice-breaker');

  // Sound Mute State
  const [isMuted, setIsMuted] = useState(() => soundFx.getMuted());
  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  // Consume Vision Engine Frame Subscription
  useVisionFrameSubscription((frame) => {
    setPlayers(frame.players);
  }, []);

  // Countdown & Main 30-Second Gameplay Timer
  useEffect(() => {
    if (cvStatus !== 'working' || players.length < requiredPlayers) return;

    if (gameState === 'countdown') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            soundFx.playGoSound();
            setGameState('playing');
            setTimeLeft(ICE_BREAKER_ROUND_DURATION);
            return 0;
          }
          soundFx.playCountdownBeep(prev * 120 + 360);
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            soundFx.playWinnerSound();
            setGameState('game-over');

            if (isSolo) {
              const updated = savePersonalBest('ice-breaker', p1Stats.score);
              setIsNewPb(updated);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cvStatus, gameState, players.length, requiredPlayers, isSolo, p1Stats.score]);

  // Cube Break Callback
  const handleCubeBreak = (owner: 1 | 2) => {
    const now = performance.now();

    if (owner === 1) {
      setP1Stats((prev) => {
        const isCombo = now - prev.lastHitTime < COMBO_WINDOW_MS;
        const newCombo = isCombo ? prev.combo + 1 : 1;
        const highestCombo = Math.max(prev.highestCombo, newCombo);

        if (newCombo > 1) {
          soundFx.playComboSound(newCombo);
        }

        return {
          score: prev.score + 1,
          combo: newCombo,
          highestCombo,
          lastHitTime: now
        };
      });
    } else {
      setP2Stats((prev) => {
        const isCombo = now - prev.lastHitTime < COMBO_WINDOW_MS;
        const newCombo = isCombo ? prev.combo + 1 : 1;
        const highestCombo = Math.max(prev.highestCombo, newCombo);

        if (newCombo > 1) {
          soundFx.playComboSound(newCombo);
        }

        return {
          score: prev.score + 1,
          combo: newCombo,
          highestCombo,
          lastHitTime: now
        };
      });
    }
  };

  const handleStartGame = () => {
    soundFx.playClickSound();
    setP1Stats({ score: 0, combo: 0, highestCombo: 0, lastHitTime: 0 });
    setP2Stats({ score: 0, combo: 0, highestCombo: 0, lastHitTime: 0 });
    setGameState('countdown');
    setCountdown(3);
  };

  const handleRestart = () => {
    soundFx.playClickSound();
    setP1Stats({ score: 0, combo: 0, highestCombo: 0, lastHitTime: 0 });
    setP2Stats({ score: 0, combo: 0, highestCombo: 0, lastHitTime: 0 });
    setIsNewPb(false);
    setGameState('countdown');
    setCountdown(3);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  if (cvStatus === 'initializing') {
    return (
      <div className="fixed inset-0 w-screen h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-white select-none z-50">
        <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-3xl max-w-sm">
          <div className="w-12 h-12 rounded-full border-4 border-dashed border-cyan-400 animate-spin mb-4" />
          <h2 className="font-display font-black text-xl text-white uppercase mb-1">
            Getting VYBE Ready...
          </h2>
          <p className="font-sans text-xs text-slate-300 font-semibold animate-pulse">
            Initializing Dual-Hand Vision Engine
          </p>
        </div>
      </div>
    );
  }

  if (cvStatus === 'error') {
    return (
      <div className="fixed inset-0 w-screen h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-white select-none z-50">
        <div className="flex flex-col items-center text-center p-8 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-3xl max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-display font-black text-xl text-white uppercase mb-2">
            Vision System Offline
          </h2>
          <p className="font-sans text-xs text-slate-300 leading-relaxed font-semibold mb-6">
            {error?.type === 'camera'
              ? 'Camera permission denied or camera unavailable.'
              : 'Failed to load computer vision models.'}
          </p>
          <button
            onClick={() => {
              visionEngine.stop();
              navigate('/games');
            }}
            className="px-6 py-2.5 bg-cyan-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-cyan-300"
          >
            Return to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] bg-slate-950 p-2 sm:p-3 flex items-center justify-center overflow-hidden select-none">
      
      {/* 95–98% VIEWPORT POLISHED RECTANGULAR GAME FRAME */}
      <div className="relative w-full h-full max-w-[98vw] max-h-[96vh] rounded-3xl overflow-hidden border-[4px] border-slate-800 shadow-chunky-lg bg-slate-900 flex flex-col justify-between">
        
        {/* 1. Mirrored Camera Video Stream (Background inside Game Frame) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* 2. Interactive Canvas Layer (3D Large Ice Blocks & Both Hands Tracking) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <DetectedPlayerOverlay players={players} />

          <IceBreakerArenaCanvas
            players={players}
            isSolo={isSolo}
            isPlaying={gameState === 'playing' || gameState === 'countdown'}
            onCubeBreak={handleCubeBreak}
          />
        </div>

        {/* 3. Floating Arcade Top Score & Timer HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                soundFx.playClickSound();
                visionEngine.stop();
                navigate('/games');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-xl text-white font-display font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>Quit</span>
            </button>

            <button
              onClick={handleToggleMute}
              className="p-1.5 bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-slate-800 cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>

          {/* Center Title & Timer Banner */}
          <div className="flex flex-col items-center">
            <div className="font-display font-black text-lg text-white uppercase tracking-wider drop-shadow-md flex items-center gap-1.5">
              <span>ICE BREAKER</span>
              {isSolo && <span className="text-cyan-400 text-[10px] font-mono font-bold">(TWO-HAND DUAL)</span>}
            </div>
            {gameState === 'playing' && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="px-3 py-0.5 bg-slate-950/90 border border-cyan-400/50 rounded-full font-mono font-black text-xs text-cyan-300 flex items-center gap-1 shadow-lg">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>{timeLeft}s</span>
                </div>
              </div>
            )}
          </div>

          {/* Player Score Badges */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end bg-slate-950/80 backdrop-blur-md border border-purple-500/50 px-3 py-1 rounded-xl shadow-lg">
              <span className="text-[9px] font-display font-black text-purple-400 uppercase tracking-wider">{player1.name}</span>
              <span className="font-display font-black text-base text-white">{p1Stats.score} <span className="text-[10px] text-slate-400">cubes</span></span>
            </div>

            {!isSolo && (
              <div className="flex flex-col items-end bg-slate-950/80 backdrop-blur-md border border-red-500/50 px-3 py-1 rounded-xl shadow-lg">
                <span className="text-[9px] font-display font-black text-red-400 uppercase tracking-wider">{player2.name}</span>
                <span className="font-display font-black text-base text-white">{p2Stats.score} <span className="text-[10px] text-slate-400">cubes</span></span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Non-blocking Player Guidance Banner */}
        {['countdown', 'playing'].includes(gameState) && players.length < requiredPlayers && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-400/90 text-slate-950 border border-amber-500 px-4 py-1 rounded-full font-display font-black text-xs uppercase tracking-wider z-30 animate-pulse flex items-center gap-1.5 shadow-lg">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {isSolo ? 'Raise hands in camera frame' : `Waiting for ${player2.name}`}
            </span>
          </div>
        )}

        {/* 5. Intro & Game Over Modal Overlays */}
        <AnimatePresence>
          {gameState === 'intro' && (
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-30 p-4">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center text-center max-w-md w-full p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky text-slate-900"
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-100 border-2 border-slate-950 flex items-center justify-center text-cyan-600 mb-4 shadow-chunky-sm">
                  <Zap className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-2">
                  Ice Breaker
                </h2>
                <p className="font-sans text-xs text-slate-600 leading-relaxed font-semibold mb-6">
                  {isSolo
                    ? 'Use BOTH your LEFT and RIGHT hands simultaneously to punch large 3D ice blocks along the bottom of the frame!'
                    : 'Two-player 3D ice smash! Punch your bottom ice blocks using both hands to break the highest score!'}
                </p>

                {isSolo && personalBest && (
                  <div className="w-full py-2 px-4 bg-yellow-100 border-2 border-slate-950 rounded-2xl flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-display font-black uppercase text-slate-950">Personal Best</span>
                    </div>
                    <span className="font-mono font-black text-sm text-purple-700">{personalBest.score} cubes</span>
                  </div>
                )}

                <button
                  onClick={handleStartGame}
                  className="w-full py-3.5 bg-purple-600 text-white font-display font-black text-base uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer shadow-chunky-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
                >
                  Start Game
                </button>
              </motion.div>
            </div>
          )}

          {gameState === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div className="text-center">
                <span className="text-cyan-300 text-xs font-display font-black tracking-widest uppercase mb-1 block">PREPARE BOTH HANDS</span>
                <span className="text-yellow-400 font-display font-black text-8xl drop-shadow-chunky animate-pulse">{countdown}</span>
              </div>
            </div>
          )}

          {gameState === 'game-over' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-40 p-4">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center text-center max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white border-[3px] border-slate-950 shadow-chunky text-slate-900"
              >
                <div className="w-14 h-14 rounded-2xl bg-yellow-300 border-2 border-slate-950 flex items-center justify-center text-slate-950 mb-3 shadow-chunky-sm">
                  <Trophy className="w-7 h-7 stroke-[2.5]" />
                </div>

                <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-1">
                  Time's Up!
                </h2>

                {isSolo ? (
                  <>
                    {isNewPb && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 text-white font-display font-black text-xs uppercase rounded-full mb-3 border border-slate-950">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>New Personal Best!</span>
                      </div>
                    )}

                    <div className="w-full p-5 border-2 border-slate-950 rounded-2xl bg-slate-50 flex flex-col items-center mb-6">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Cubes Broken</span>
                      <span className="font-display font-black text-4xl text-purple-600 mb-2">{p1Stats.score}</span>
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600">
                        <span>Best Combo: <strong className="text-slate-900">x{p1Stats.highestCombo}</strong></span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full flex flex-col gap-2 mb-6">
                      <div className="flex justify-between items-center p-3 border-2 border-slate-950 rounded-2xl bg-slate-50">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-display font-black text-purple-600 uppercase tracking-wider">Player 1</span>
                          <span className="font-display font-black text-base text-slate-800 uppercase mt-0.5">{player1.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cubes Broken</span>
                          <span className="font-display font-black text-xl text-slate-900 mt-0.5">{p1Stats.score}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 border-2 border-slate-950 rounded-2xl bg-slate-50">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-display font-black text-red-500 uppercase tracking-wider">Player 2</span>
                          <span className="font-display font-black text-base text-slate-800 uppercase mt-0.5">{player2.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cubes Broken</span>
                          <span className="font-display font-black text-xl text-slate-900 mt-0.5">{p2Stats.score}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-3 border-2 border-slate-950 rounded-2xl bg-yellow-300 font-display font-black text-xl uppercase tracking-widest shadow-chunky-sm mb-8">
                      {p1Stats.score === p2Stats.score
                        ? "It's a Tie!"
                        : p1Stats.score > p2Stats.score
                          ? `WINNER: ${player1.name}`
                          : `WINNER: ${player2.name}`}
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
                  <button
                    onClick={handleRestart}
                    className="w-full py-3 bg-purple-600 text-white font-display font-black text-sm uppercase tracking-wider rounded-xl border-2 border-slate-950 shadow-chunky-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer flex items-center justify-center gap-2"
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
            </div>
          )}
        </AnimatePresence>
      </div>

      {showDebugOverlay && <VisionDebugOverlay requiredPlayers={requiredPlayers} showCanvas={false} />}
    </div>
  );
}
