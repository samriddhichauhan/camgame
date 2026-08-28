import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PlayerSetupCardProps {
  playerNumber: 1 | 2;
  name: string;
  avatar: string;
  avatars: string[];
  themeColor: 'purple' | 'coral';
  onChangeName: (name: string) => void;
  onChangeAvatar: (avatar: string) => void;
}

export default function PlayerSetupCard({
  playerNumber,
  name,
  avatar,
  avatars,
  themeColor,
  onChangeName,
  onChangeAvatar,
}: PlayerSetupCardProps) {
  const isPurple = themeColor === 'purple';
  const ringColorClass = isPurple ? 'focus:ring-brand-purple/40' : 'focus:ring-brand-coral/40';
  const cardBorderClass = isPurple ? 'border-brand-purple/20' : 'border-brand-coral/20';

  const handleAvatarClick = () => {
    const currentIndex = avatars.indexOf(avatar);
    const nextIndex = (currentIndex + 1) % avatars.length;
    onChangeAvatar(avatars[nextIndex]);
  };

  // Simple validation logic
  const isNameEmpty = name.length === 0;
  const isNameInvalid = name.length > 0 && name.trim().length === 0;
  const isTooLong = name.length > 16;

  let feedbackMessage = 'Enter your name';
  let isError = false;
  if (isNameInvalid) {
    feedbackMessage = 'Please enter a name';
    isError = true;
  } else if (isTooLong) {
    feedbackMessage = 'Max 16 characters!';
    isError = true;
  } else if (!isNameEmpty) {
    feedbackMessage = 'Ready!';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 15, delay: playerNumber * 0.1 }}
      className={`relative w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-white border-3 border-slate-950 shadow-chunky flex flex-col items-center ${cardBorderClass}`}
    >
      {/* Card Header Label */}
      <div className={`mb-4 font-display font-black text-lg tracking-wider uppercase ${isPurple ? 'text-brand-purple' : 'text-brand-coral'}`}>
        Player {playerNumber}
      </div>

      {/* Avatar Display (Cycles through emojis on click) */}
      <div className="relative group mb-6">
        {/* Interactive bottom plate */}
        <span className="absolute inset-0 w-full h-full bg-slate-950 rounded-2xl translate-x-1 translate-y-1 transition-transform" />
        <button
          onClick={handleAvatarClick}
          className={`relative w-20 h-20 rounded-2xl border-2 border-slate-950 bg-slate-50 flex items-center justify-center text-4xl cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 transition-transform`}
          title="Click to change avatar!"
          aria-label={`Change Player ${playerNumber} Avatar`}
        >
          <span>{avatar}</span>
          {/* Sparkle icon indicator */}
          <span className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-brand-yellow border border-slate-950 shadow-chunky-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-3 h-3 text-slate-950" />
          </span>
        </button>
      </div>

      {/* Name Input Field */}
      <div className="w-full flex flex-col gap-2">
        <label
          htmlFor={`player-${playerNumber}-name`}
          className="font-display font-bold text-xs uppercase text-slate-500 tracking-wider"
        >
          Player Name
        </label>
        
        <input
          id={`player-${playerNumber}-name`}
          type="text"
          value={name}
          maxLength={20} // Allow typing a bit more to trigger validation
          onChange={(e) => onChangeName(e.target.value)}
          placeholder={`Enter player ${playerNumber} name`}
          className={`w-full px-4 py-3 border-2 border-slate-950 rounded-xl font-sans font-semibold text-slate-800 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-4 ${ringColorClass} transition-all`}
        />

        {/* Validation Status message */}
        <div className="flex items-center gap-1.5 mt-1">
          <span 
            className={`w-2 h-2 rounded-full ${
              isNameEmpty 
                ? 'bg-slate-300' 
                : isError 
                  ? 'bg-brand-coral animate-pulse' 
                  : 'bg-brand-green'
            }`} 
          />
          <span 
            className={`font-mono text-[10px] uppercase font-bold tracking-wider ${
              isNameEmpty 
                ? 'text-slate-400' 
                : isError 
                  ? 'text-brand-coral' 
                  : 'text-brand-green-dark'
            }`}
          >
            {feedbackMessage}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
