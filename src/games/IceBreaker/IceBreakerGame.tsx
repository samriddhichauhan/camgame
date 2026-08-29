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
import ProgressIndicator from '../../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../../components/PlayfulBackgroundShapes';
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

  // Cube Break Callback triggered from Arena Canvas
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
          <p className="font-sans text-xs text-slate-555 leading-relaxed font-semibold mb-6">
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
            Ice Breaker {isSolo && <span className="text-brand-purple text-xs font-mono font-bold ml-1">(SOLO)</span>}
          </div>
          {gameState === 'playing' && (
            <div className="px-3 py-0.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-[10px] font-mono font-black text-brand-purple uppercase">
              Time Left: {timeLeft}s
            </div>
          )}
        </div>

        <ProgressIndicator currentStep={4} />
      </div>

      {/* Safety Pause warning overlay */}
      {['countdown', 'playing'].includes(gameState) && players.length < requiredPlayers && (
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
                ? 'We need your hands visible in the camera frame to punch and break the ice!'
                : players.length === 1
                  ? `We need ${player2.name} in the camera frame to compete in ice punching!`
                  : 'We need both players fully visible in the camera to punch and break the ice!'}
            </p>
          </div>
        </div>
      )}

      {/* Main Gameplay Viewport */}
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
              <div className="w-16 h-16 rounded-2xl bg-cyan-100 border-2 border-slate-950 flex items-center justify-center text-cyan-600 mb-4 shadow-chunky-sm">
                <Zap className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="font-display font-black text-3xl text-slate-950 uppercase mb-2">
                Ice Breaker
              </h2>
              <p className="font-sans text-xs text-slate-555 leading-relaxed font-semibold mb-6">
                {isSolo
                  ? 'Punch the floating ice cubes with your hands! Break as many ice blocks as possible before the 30-second timer expires.'
                  : 'Head-to-head ice punching battle! Each player has their own arena side — punch your ice cubes to break the highest score!'}
              </p>

              {isSolo && personalBest && (
                <div className="w-full py-2 px-4 bg-brand-yellow/20 border-2 border-slate-950 rounded-2xl flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-brand-purple" />
                    <span className="text-xs font-display font-black uppercase text-slate-950">Personal Best</span>
                  </div>
                  <span className="font-mono font-black text-sm text-brand-purple">{personalBest.score} cubes</span>
                </div>
              )}

              <div className="relative group w-full max-w-[200px]">
                <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl translate-x-1 translate-y-1 group-hover:translate-x-1.5 group-hover:translate-y-1.5 group-active:translate-x-0.5 group-active:translate-y-0.5 transition-transform" />
                <button
                  onClick={handleStartGame}
                  className="relative w-full py-3.5 bg-brand-purple text-white font-display font-black text-base uppercase tracking-wider rounded-xl border-2 border-slate-950 cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
                >
                  Start Game
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 2: Ready Countdown */}
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
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">STAND READY</span>
                <h2 className="font-display font-black text-2xl text-slate-950 uppercase">
                  Prepare your fists!
                </h2>
              </div>

              <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                <CameraPreview stream={stream} />
                <DetectedPlayerOverlay players={players} />

                <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
                  <div className="text-center">
                    <span className="text-white text-[9px] font-display font-black tracking-widest uppercase mb-1 block">ICE SPAWNING IN</span>
                    <span className="text-brand-yellow font-display font-black text-6xl drop-shadow-chunky">{countdown}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 3: Active Gameplay Arena */}
          {gameState === 'playing' && (
            <motion.div
              key="playing"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center gap-3"
            >
              {/* HUD Scores Header */}
              <div className="w-full max-w-xl flex items-center justify-between px-4 py-2 bg-white border-2 border-slate-950 rounded-2xl shadow-chunky-sm">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-display font-black text-brand-purple uppercase">{player1.name}</span>
                    <span className="font-display font-black text-xl text-slate-950">{p1Stats.score} <span className="text-xs text-slate-400">cubes</span></span>
                  </div>
                  {p1Stats.combo > 1 && (
                    <span className="px-2 py-0.5 bg-brand-yellow border border-slate-950 rounded-md font-mono font-black text-xs animate-bounce text-slate-950">
                      x{p1Stats.combo} COMBO!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-brand-yellow rounded-xl font-mono font-black text-base border border-slate-800">
                  <Clock className="w-4 h-4 text-brand-yellow animate-pulse" />
                  <span>{timeLeft}s</span>
                </div>

                {!isSolo && (
                  <div className="flex items-center gap-3">
                    {p2Stats.combo > 1 && (
                      <span className="px-2 py-0.5 bg-brand-coral border border-slate-950 rounded-md font-mono font-black text-xs animate-bounce text-white">
                        x{p2Stats.combo} COMBO!
                      </span>
                    )}
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-display font-black text-brand-coral uppercase">{player2.name}</span>
                      <span className="font-display font-black text-xl text-slate-950">{p2Stats.score} <span className="text-xs text-slate-400">cubes</span></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Arcade Canvas Viewfinder */}
              <div className="relative w-full max-w-xl aspect-[4/3] rounded-3xl overflow-hidden border-[3px] border-slate-950 shadow-chunky bg-slate-950">
                <CameraPreview stream={stream} />
                <DetectedPlayerOverlay players={players} />

                {/* Arcade Interactive Ice Cube & Fist Canvas */}
                <IceBreakerArenaCanvas
                  players={players}
                  isSolo={isSolo}
                  isPlaying={true}
                  onCubeBreak={handleCubeBreak}
                />
              </div>
            </motion.div>
          )}

          {/* STATE 4: Game Over / Results */}
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
                Time's Up!
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
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">Cubes Broken</span>
                    <span className="font-display font-black text-4xl text-brand-purple mb-2">{p1Stats.score}</span>
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
                        <span className="text-[10px] font-display font-black text-brand-purple uppercase tracking-wider">Player 1</span>
                        <span className="font-display font-black text-base text-slate-800 uppercase mt-0.5">{player1.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cubes Broken</span>
                        <span className="font-display font-black text-xl text-slate-900 mt-0.5">{p1Stats.score}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 border-2 border-slate-950 rounded-2xl bg-slate-50">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-display font-black text-brand-coral uppercase tracking-wider">Player 2</span>
                        <span className="font-display font-black text-base text-slate-800 uppercase mt-0.5">{player2.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cubes Broken</span>
                        <span className="font-display font-black text-xl text-slate-900 mt-0.5">{p2Stats.score}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-3 border-2 border-slate-950 rounded-2xl bg-brand-yellow font-display font-black text-xl uppercase tracking-widest shadow-chunky-sm mb-8">
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
