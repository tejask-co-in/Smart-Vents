import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeSwitcherProps {
  currentTheme: 'dark' | 'light' | 'system';
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div
      role="group"
      aria-label="Theme Switcher"
      className="flex items-center gap-0.5 p-0.5 rounded-lg app-card app-border text-xs shadow-xs"
    >
      <button
        type="button"
        onClick={() => onThemeChange('dark')}
        title="Dark Mode (Deep Obsidian)"
        aria-pressed={currentTheme === 'dark'}
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          currentTheme === 'dark'
            ? 'bg-neutral-800 text-neutral-100 shadow-xs font-semibold'
            : 'app-text-muted hover:opacity-100'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onThemeChange('light')}
        title="Light Mode (Crisp Paper)"
        aria-pressed={currentTheme === 'light'}
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          currentTheme === 'light'
            ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-neutral-200 dark:text-neutral-900 shadow-xs font-semibold'
            : 'app-text-muted hover:opacity-100'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onThemeChange('system')}
        title="Auto System Preference"
        aria-pressed={currentTheme === 'system'}
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          currentTheme === 'system'
            ? 'bg-indigo-600 text-white shadow-xs font-semibold'
            : 'app-text-muted hover:opacity-100'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
