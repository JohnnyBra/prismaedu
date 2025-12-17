import React from 'react';
import { AvatarConfig } from '../types';
import { AVATAR_ITEMS } from '../constants';

interface AvatarProps {
  config?: AvatarConfig;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ config, size = 100, className = '' }) => {
  if (!config) return <div style={{ width: size, height: size }} className={`bg-gray-200 rounded-full ${className}`} />;

  const getItemSvg = (id?: string) => {
    const item = AVATAR_ITEMS.find(i => i.id === id);
    return item ? item.svg : '';
  };

  return (
    <div 
      className={`relative rounded-full overflow-hidden bg-blue-50 border-2 border-white shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Base */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.baseId) }} />
        {/* Shoes */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.shoesId) }} />
        {/* Bottom */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.bottomId) }} />
        {/* Top */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.topId) }} />
        {/* Accessory */}
        <g dangerouslySetInnerHTML={{ __html: getItemSvg(config.accessoryId) }} />
      </svg>
    </div>
  );
};

export default Avatar;