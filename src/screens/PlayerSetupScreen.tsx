import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useGameSession } from '../context/GameSessionContext';
import PlayerSetupCard from '../components/PlayerSetupCard';
import ProgressIndicator from '../components/ProgressIndicator';
import PlayfulBackgroundShapes from '../components/PlayfulBackgroundShapes';

const p1Avatars = ['🦊', '🐱', '🦁', '🐻'];
const p2Avatars = ['🐸', '🐙', '🐨', '🐼'];

export default function PlayerSetupScreen() {
  const navigate = useNavigate();
  const {
    gameMode,
    player1,
    player2,
    setPlayer1Name,
    setPlayer1Avatar,
    setPlayer2Name,
    setPlayer2Avatar,
    isSessionReady,
  } = useGameSession();

  const handleContinue = () => {
    if (isSessionReady()) {
      navigate('/games');
    }
  };

  const isP1Valid = player1.name.trim().length > 0 && player1.name.length <= 16;
  const isP2Valid = player2.name.trim().length > 0 && player2.name.length <= 16;
  const canContinue = gameMode === 'SINGLE_PLAYER' ? isP1Valid : (isP1Valid && isP2Valid);

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
      
      {/* Playful Floating Background Shapes */}
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
            onClick={() => navigate('/mode')}
            className="relative flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-950 rounded-xl text-slate-800 font-display font-bold text-xs uppercase tracking-wider cursor-pointer group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-transform"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
            <span>Back</span>
          </button>
        </motion.div>

        {/* Progress Indicator Step 1 */}
        <ProgressIndicator currentStep={1} />

        {/* Invisible Spacer */}
        <div className="w-[80px] hidden sm:block pointer-events-none opacity-0" />
      </motion.div>

      {/* Title & Cards Section */}
      <div className="flex flex-col items-center gap-4 sm:gap-6 z-10 my-auto w-full max-w-4xl px-2 overflow-hidden">
        
        {/* Screen Title */}
        <motion.div
          variants={titleContainerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.h1 
            variants={textItemVariants}
            className="font-display font-black text-3xl sm:text-5xl text-slate-900 tracking-tight leading-none uppercase mb-1 sm:mb-2"
          >
            {gameMode === 'SINGLE_PLAYER' ? 'Player Setup' : "Who's Playing?"}
          </motion.h1>
          <motion.p 
            variants={textItemVariants}
            className="font-sans font-medium text-xs sm:text-base text-slate-500"
          >
            {gameMode === 'SINGLE_PLAYER' 
              ? 'Enter your name and pick your avatar to start playing.' 
              : 'Enter your names and get ready to compete.'}
          </motion.p>
        </motion.div>

        {/* Player Cards */}
        <div className="w-full flex flex-col md:flex-row justify-center items-center gap-5 sm:gap-8 max-h-[58vh] md:max-h-[none] overflow-y-auto md:overflow-y-visible px-2 py-2">
          <PlayerSetupCard
            playerNumber={1}
            name={player1.name}
            avatar={player1.avatar}
            avatars={p1Avatars}
            themeColor="purple"
            onChangeName={setPlayer1Name}
            onChangeAvatar={setPlayer1Avatar}
          />

          {gameMode === 'TWO_PLAYERS' && (
            <PlayerSetupCard
              playerNumber={2}
              name={player2.name}
              avatar={player2.avatar}
              avatars={p2Avatars}
              themeColor="coral"
              onChangeName={setPlayer2Name}
              onChangeAvatar={setPlayer2Avatar}
            />
          )}
        </div>

      </div>

      {/* Bottom Actions Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full flex flex-col items-center z-10"
      >
        {/* Continue Button */}
        <div className="relative group w-full max-w-[200px] select-none">
          <span 
            className={`absolute inset-0 w-full h-full rounded-2xl translate-x-1.5 translate-y-1.5 transition-transform ${
              canContinue 
                ? 'bg-slate-950 group-hover:translate-x-2 group-hover:translate-y-2 group-active:translate-x-0.5 group-active:translate-y-0.5' 
                : 'bg-slate-300'
            }`} 
          />
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`relative w-full flex items-center justify-center gap-2 px-6 py-4 border-2 rounded-2xl font-display font-black text-lg uppercase tracking-wider transition-all duration-100 ${
              canContinue
                ? 'bg-brand-purple border-slate-950 text-white cursor-pointer hover:-translate-y-1 active:translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-brand-purple/50'
                : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>

    </div>
  );
}
