import React from 'react';
import { Sparkles } from 'lucide-react';

interface MatchScoreBadgeProps {
  score: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  showDetails = true,
  size = 'md'
}) => {
  let colorStyles = '';
  let dotColor = '';
  let label = '';
  let glowStyle = '';

  if (score >= 80) {
    colorStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
    label = 'High Confidence';
    glowStyle = 'shadow-glow-green';
  } else if (score >= 50) {
    colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
    label = 'Potential Match';
    glowStyle = 'shadow-glow-amber';
  } else {
    colorStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dotColor = 'bg-rose-400';
    label = 'Low Similarity';
    glowStyle = '';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2'
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-full border font-semibold tracking-wide transition-all ${colorStyles} ${glowStyle} ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor} ${score >= 80 ? 'animate-ping inline-block' : ''}`} />
      <Sparkles className="w-3.5 h-3.5" />
      <span>{score}% Match</span>
      {showDetails && (
        <span className="opacity-75 text-xs font-normal border-l border-current/20 pl-1.5 ml-0.5">
          {label}
        </span>
      )}
    </div>
  );
};
