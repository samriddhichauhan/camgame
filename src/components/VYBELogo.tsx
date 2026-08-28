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
        stiffness: 120,
        damping: 14,
        staggerChildren: 0.1,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 30, rotate: 0 },
    visible: (customIndex: number) => {
      const rotations = [-6, 4, -4, 6];
      return {
        opacity: 1,
        y: 0,
        rotate: rotations[customIndex % rotations.length],
        transition: {
          type: 'spring',
          stiffness: 150,
          damping: 12,
        },
      };
    },
  };

  const letters = [
    { char: 'V', color: 'text-brand-coral' },
    { char: 'Y', color: 'text-brand-purple' },
    { char: 'B', color: 'text-brand-blue' },
    { char: 'E', color: 'text-brand-yellow' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-3 select-none"
    >
      {letters.map((item, index) => (
        <motion.span
          key={index}
          custom={index}
          variants={letterVariants}
          whileHover={{
            scale: 1.15,
            y: -10,
            rotate: index % 2 === 0 ? -12 : 12,
            filter: 'drop-shadow(6px 6px 0px #0f172a)',
            transition: { type: 'spring', stiffness: 400, damping: 10 },
          }}
          className={`font-display font-black text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-tight ${item.color} filter drop-shadow-[5px_5px_0px_#0f172a] cursor-default select-none`}
        >
          {item.char}
        </motion.span>
      ))}
    </motion.div>
  );
}
