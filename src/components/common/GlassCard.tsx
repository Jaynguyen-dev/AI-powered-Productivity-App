import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'elevated' | 'interactive' | 'glow';
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  // VisionOS Spatial Glass Base
  let baseStyles = 'rounded-[32px] transition-all duration-300 relative overflow-hidden backdrop-blur-2xl';

  if (variant === 'default') {
    baseStyles += ' bg-white/[0.04] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.05)] text-white';
  } else if (variant === 'subtle') {
    baseStyles += ' bg-white/[0.04] border border-white/5 text-white font-bold';
  } else if (variant === 'elevated') {
    baseStyles += ' bg-white/5 border-t border-white/20 border-l border-white/20 border-r border-white/10 border-b border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] text-white';
  } else if (variant === 'interactive') {
    baseStyles += ' bg-white/[0.04] hover:bg-white/5 border border-white/10 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] cursor-pointer text-white';
  } else if (variant === 'glow') {
    baseStyles += ' bg-white/5 border border-white/20 shadow-[0_0_30px_rgba(255,159,10,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] text-white';
  }

  if (variant === 'interactive') {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`${baseStyles} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </motion.div>
  );
};
