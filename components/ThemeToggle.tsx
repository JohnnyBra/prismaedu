import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, preference, cycle } = useTheme();

  const icon = preference === 'auto'
    ? <Monitor size={18} />
    : theme === 'light'
      ? <Sun size={18} />
      : <Moon size={18} />;

  const label = preference === 'auto' ? 'Auto' : theme === 'light' ? 'Claro' : 'Oscuro';

  return (
    <button
      onClick={cycle}
      className={`p-2 rounded-xl hover:scale-105 active:scale-95 transition-transform ${className}`}
      title={`Tema: ${label}`}
      aria-label={`Cambiar tema (actual: ${label})`}
    >
      {icon}
    </button>
  );
};

export default ThemeToggle;
