import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
   onClick?: () => void;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <div
      className={`bg-white/60 backdrop-blur-md rounded-xl border border-white/40 shadow-lg ${
        hover ? 'hover:shadow-2xl hover:scale-[1.02] transition-all duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
