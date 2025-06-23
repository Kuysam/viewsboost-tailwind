import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  blur?: 'sm' | 'md' | 'lg';
  opacity?: 'low' | 'medium' | 'high';
}

export default function GlassCard({ 
  children, 
  className = '', 
  hover = true,
  blur = 'md',
  opacity = 'medium' 
}: GlassCardProps) {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md', 
    lg: 'backdrop-blur-lg'
  };

  const opacityClasses = {
    low: 'bg-white/5 border-white/10',
    medium: 'bg-white/10 border-white/20',
    high: 'bg-white/20 border-white/30'
  };

  return (
    <motion.div
      className={`
        ${blurClasses[blur]}
        ${opacityClasses[opacity]}
        border rounded-xl shadow-2xl
        ${hover ? 'hover:bg-white/15 hover:border-white/30' : ''}
        transition-all duration-300
        ${className}
      `}
      whileHover={hover ? { 
        scale: 1.02,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}