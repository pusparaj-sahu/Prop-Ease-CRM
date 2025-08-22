import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({ 
  title, 
  children, 
  className = '', 
  actions,
  padding = 'md' 
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-slate-200 shadow-md ${paddingClasses[padding]} ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
