import React from 'react';
import { AvatarConfig } from '../types';
import { AVATAR_ITEMS } from '../constants';

interface AvatarProps {
  config?: AvatarConfig;
  size?: number;
  className?: string;
  glowColor?: string;
  showRing?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ config, size = 100, className = '', glowColor, showRing = false }) => {
  if (!config) return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br from-surface-600 to-surface-700 border-2 border-white/10 ${className}`}
    />
  );

  const getItemSvg = (id?: string) => {
    const item = AVATAR_ITEMS.find(i => i.id === id);
    return item ? item.svg : '';
  };

  const ringStyle = showRing ? {
    boxShadow: `0 0 0 3px ${glowColor || 'rgba(99,102,241,0.4)'}, 0 0 20px ${glowColor || 'rgba(99,102,241,0.2)'}`
  } : {};

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-gradient-to-br from-primary-900/50 to-primary-800/30 border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ width: size, height: size, ...ringStyle }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.baseId) }} />
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.shoesId) }} />
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.bottomId) }} />
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.topId) }} />
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.accessoryId) }} />
      </svg>
    </div>
  );
};

export default Avatar;
