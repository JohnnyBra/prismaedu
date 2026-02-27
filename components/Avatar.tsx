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

// Default humanoid body outline (visible when no base is equipped)
const DEFAULT_BODY = `
  <circle cx="50" cy="22" r="16" fill="#CBD5E1"/>
  <rect x="46" y="36" width="8" height="8" rx="2" fill="#CBD5E1"/>
  <ellipse cx="50" cy="56" rx="20" ry="14" fill="#CBD5E1"/>
  <ellipse cx="24" cy="54" rx="6" ry="12" fill="#CBD5E1"/>
  <ellipse cx="76" cy="54" rx="6" ry="12" fill="#CBD5E1"/>
  <rect x="36" y="68" width="12" height="22" rx="4" fill="#CBD5E1"/>
  <rect x="52" y="68" width="12" height="22" rx="4" fill="#CBD5E1"/>
`;

// Default face (eyes + smile) drawn on top of base
const DEFAULT_FACE = `
  <circle cx="43" cy="20" r="2.5" fill="#1E293B"/>
  <circle cx="57" cy="20" r="2.5" fill="#1E293B"/>
  <circle cx="44" cy="19" r="0.8" fill="#FFF"/>
  <circle cx="58" cy="19" r="0.8" fill="#FFF"/>
  <path d="M44 27 Q50 32 56 27" fill="none" stroke="#1E293B" stroke-width="1.5" stroke-linecap="round"/>
`;

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

  const isRobot = config.baseId === 'base_3';
  const isAlien = config.baseId === 'base_5';

  const ringStyle = showRing ? {
    boxShadow: `0 0 0 3px ${glowColor || 'rgba(99,102,241,0.4)'}, 0 0 20px ${glowColor || 'rgba(99,102,241,0.2)'}`
  } : {};

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-gradient-to-br from-primary-900/50 to-primary-800/30 border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ width: size, height: size, ...ringStyle }}
    >
      <svg viewBox="-5 -10 110 115" className="w-full h-full">
        {/* Layer 0: Default body silhouette (fallback if no base) */}
        {!config.baseId && <g dangerouslySetInnerHTML={{ __html: DEFAULT_BODY }} />}
        {/* Layer 1: Base (skin/body) */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.baseId) }} />
        {/* Face (eyes + smile) — skip for robot/alien which have their own */}
        {!isRobot && !isAlien && <g dangerouslySetInnerHTML={{ __html: DEFAULT_FACE }} />}
        {/* Layer 2: Shoes */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.shoesId) }} />
        {/* Layer 3: Bottom */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.bottomId) }} />
        {/* Layer 4: Top */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.topId) }} />
        {/* Layer 5: Hair */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.hairId) }} />
        {/* Layer 6: Accessory (on top) */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.accessoryId) }} />
      </svg>
    </div>
  );
};

export default Avatar;
