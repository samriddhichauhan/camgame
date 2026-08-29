import { useState, useEffect } from 'react';
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
import CameraPreview from '../../components/CameraPreview';
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
      <div className="fixed inset-0 w-screen h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-white select-none">
        <div className="flex flex-col items-center text-center p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl max-w-sm">
          <div className="w-12 h-12 rounded-full border-4 border-dashed border-cyan-400 animate-spin mb-4" />
          <h2 className="font-display font-black text-xl text-white uppercase mb-1">
            Getting VYBE Ready...
          </h2>
          <p className="font-sans text-xs text-slate-300 font-semibold animate-pulse">
            Loading 3D Ice Vision Models
          </p>
        </div>
      </div>
    );
  }

  if (cvStatus === 'error') {
    return (
      <div className="fixed inset-0 w-screen h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-white select-none">
        <div className="flex flex-col items-center text-center p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl max-w-sm">
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
            className="px-6 py-2.5 bg-cyan-500 text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-cyan-400"
          >
            Return to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-slate-950 text-white select-none">
      
      {/* 1. Fullscreen WebRTC Camera Viewport & 3D Ice Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <CameraPreview stream={stream} />
        <DetectedPlayerOverlay players={players} />

        {/* Arcade Interactive 3D Ice Cube & Fist Canvas */}
        <IceBreakerArenaCanvas
          players={players}
          isSolo={isSolo}
          isPlaying={gameState === 'playing' || gameState === 'countdown'}
          onCubeBreak={handleCubeBreak}
        />
      </div>

      {/* 2. Top Arcade Floating Header HUD */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              soundFx.playClickSound();
              visionEngine.stop();
              navigate('/games');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-xl text-white font-display font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span>Quit</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-slate-800 cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>

        {/* Live Center HUD Banner */}
        <div className="flex flex-col items-center">
          <div className="font-display font-black text-xl text-white uppercase tracking-wider drop-shadow-md flex items-center gap-2">
            <span>ICE BREAKER</span>
            {isSolo && <span className="text-cyan-400 text-xs font-mono font-bold">(SOLO)</span>}
          </div>
          {gameState === 'playing' && (
            <div className="flex items-center gap-2 mt-1">
              <div className="px-3 py-1 bg-slate-900/90 border border-cyan-400/40 rounded-full font-mono font-black text-sm text-cyan-300 flex items-center gap-1.5 shadow-lg">
                <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>{timeLeft}s</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Player Scores Badges */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end bg-slate-900/80 backdrop-blur-md border border-purple-500/40 px-3 py-1.5 rounded-2xl shadow-lg">
            <span className="text-[10px] font-display font-black text-purple-400 uppercase tracking-wider">{player1.name}</span>
            <span className="font-display font-black text-lg text-white">{p1Stats.score} <span className="text-xs text-slate-400">cubes</span></span>
          </div>

          {!isSolo && (
            <div className="flex flex-col items-end bg-slate-900/80 backdrop-blur-md border border-red-500/40 px-3 py-1.5 rounded-2xl shadow-lg">
              <span className="text-[10px] font-display font-black text-red-400 uppercase tracking-wider">{player2.name}</span>
              <span className="font-display font-black text-lg text-white">{p2Stats.score} <span className="text-xs text-slate-400">cubes</span></span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Safety Pause Overlay */}
      {['countdown', 'playing'].includes(gameState) && players.length < requiredPlayers && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center text-center p-8 bg-white border-[3px] border-slate-950 rounded-3xl shadow-chunky max-w-sm m-4 text-slate-900">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 border-2 border-slate-950 flex items-center justify-center text-slate-950 mb-4 shadow-chunky-sm animate-bounce">
              <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="font-display font-black text-xl text-slate-950 uppercase mb-2">
              {isSolo
                ? 'Step Into The Frame'
                : players.length === 1
                  ? 'Player 2, Step Into The Frame'
                  : 'Step Into The Frame'}
            </h3>
            <p className="font-sans text-xs text-slate-600 font-semibold leading-relaxed">
              {isSolo
                ? 'We need your hands visible in the camera frame to punch 3D ice blocks!'
                : players.length === 1
                  ? `We need ${player2.name} in the camera frame to compete!`
                  : 'We need both players fully visible in the camera frame to play!'}
            </p>
          </div>
        </div>
      )}

      {/* 4. Game Over Results Overlay */}
      <AnimatePresence>
        {gameState === 'intro' && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-30 p-4">
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
                  ? 'Punch the floating 3D ice blocks with your virtual fists! Break as many ice cubes as possible before time runs out.'
                  : 'Head-to-head 3D ice punching battle! Punch your arena ice blocks to break the highest score!'}
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
              <span className="text-cyan-300 text-sm font-display font-black tracking-widest uppercase mb-1 block">READY TO PUNCH</span>
              <span className="text-yellow-400 font-display font-black text-7xl drop-shadow-chunky animate-pulse">{countdown}</span>
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

              {/* Action Buttons: Play Again / Change Game / Home */}
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

      {showDebugOverlay && <VisionDebugOverlay requiredPlayers={requiredPlayers} showCanvas={false} />}
    </div>
  );
}
