import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

export default function VYBELogo() {
  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        staggerChildren: 0.08,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 10
      }
    },
  };

  const letters = ['V', 'Y', 'B', 'E'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center space-x-2 sm:space-x-3 md:space-x-4 select-none"
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          variants={letterVariants}
          whileHover={{
            scale: 1.12,
            y: -10,
            filter: 'drop-shadow(0 0 20px rgba(217, 70, 239, 0.8))',
            transition: { type: 'spring', stiffness: 400, damping: 10 },
          }}
          className="font-display font-black text-7xl sm:text-8xl md:text-9xl tracking-tight text-gradient bg-gradient-to-br from-brand-violet via-brand-fuchsia to-brand-cyan cursor-default select-none"
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}
