import { motion } from 'framer-motion';

export default function PlayfulBackgroundShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Large Warm Yellow Blob Top-Right */}
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          x: [0, 10, 0],
        }}
        transition={{ 
          duration: 9, 
          ease: 'easeInOut', 
          repeat: Infinity 
        }}
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-yellow/30 blur-2xl"
      />

      {/* 2. Soft Purple Blob Bottom-Left */}
      <motion.div
        animate={{ 
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ 
          duration: 11, 
          ease: 'easeInOut', 
          repeat: Infinity 
        }}
        className="absolute -bottom-28 -left-28 w-[450px] h-[450px] rounded-full bg-brand-purple/20 blur-3xl"
      />

      {/* 3. Blue Soft Floating Shape Middle-Left */}
      <motion.div
        animate={{ 
          y: [0, -25, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          duration: 8, 
          ease: 'easeInOut', 
          repeat: Infinity 
        }}
        className="absolute top-1/3 -left-12 w-64 h-64 rounded-full bg-brand-blue/20 blur-2xl"
      />

      {/* 4. Playful Sparkle Star Top-Left */}
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 15, ease: 'linear', repeat: Infinity },
          scale: { duration: 3, ease: 'easeInOut', repeat: Infinity }
        }}
        className="absolute top-[15%] left-[10%] w-10 h-10 text-brand-purple/40"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
        </svg>
      </motion.div>

      {/* 5. Playful Ring/Donut Shape Bottom-Right */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: -45,
        }}
        transition={{ 
          duration: 7, 
          ease: 'easeInOut', 
          repeat: Infinity 
        }}
        className="absolute bottom-[12%] right-[12%] w-16 h-16 border-[6px] border-brand-coral/25 rounded-full"
      />

      {/* 6. Friendly Cartoon Star Bottom-Left */}
      <motion.div
        animate={{ 
          rotate: -360,
          scale: [1, 0.9, 1]
        }}
        transition={{ 
          rotate: { duration: 20, ease: 'linear', repeat: Infinity },
          scale: { duration: 4, ease: 'easeInOut', repeat: Infinity }
        }}
        className="absolute bottom-[20%] left-[8%] w-12 h-12 text-brand-yellow/50"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z" />
        </svg>
      </motion.div>

      {/* 7. Cute Tiny Dot Accent Mid-Right */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ 
          duration: 3, 
          ease: 'easeInOut', 
          repeat: Infinity 
        }}
        className="absolute top-[40%] right-[15%] w-4 h-4 rounded-full bg-brand-green/45"
      />

      {/* 8. Bouncy Circle Top Center */}
      <motion.div
        animate={{ 
          y: [0, 15, 0],
        }}
        transition={{ 
          duration: 5, 
          ease: 'easeInOut', 
          repeat: Infinity 
        }}
        className="absolute top-[8%] left-[45%] w-8 h-8 rounded-full border-4 border-brand-blue/30"
      />
    </div>
  );
}
