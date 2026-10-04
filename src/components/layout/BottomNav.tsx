import React from 'react';
import { Sparkles, Inbox, LayoutDashboard, Folder, FileText, Settings, Plus } from 'lucide-react';
import { NavView } from './Navbar';
import { UserSettings } from '../../types/vent';

interface BottomNavProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  onOpenQuickVent: () => void;
  settings: UserSettings;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenQuickVent,
  settings,
  onOpenAuth,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 app-header border-t app-border backdrop-blur-lg px-2 py-1.5 flex items-center justify-around safe-bottom shadow-lg"
    >
      <button
        onClick={() => onNavigate('vent')}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] transition-colors cursor-pointer ${
          currentView === 'vent' ? 'app-text-main font-semibold' : 'app-text-muted hover:opacity-100'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Vent</span>
      </button>

      <button
        onClick={() => onNavigate('inbox')}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] transition-colors cursor-pointer ${
          currentView === 'inbox' ? 'app-text-main font-semibold' : 'app-text-muted hover:opacity-100'
        }`}
      >
        <Inbox className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Inbox</span>
      </button>

      {/* Prominent Center + Vent Button */}
      <button
        onClick={onOpenQuickVent}
        title="Quick Dump"
        className="flex items-center justify-center w-10 h-10 -mt-3 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shadow-md cursor-pointer transition transform active:scale-95"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>

      <button
        onClick={() => onNavigate('visuals')}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] transition-colors cursor-pointer ${
          currentView === 'visuals' ? 'text-indigo-500 font-semibold' : 'app-text-muted hover:opacity-100'
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Visuals</span>
      </button>

      <button
        onClick={() => onNavigate('projects')}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] transition-colors cursor-pointer ${
          currentView === 'projects' ? 'app-text-main font-semibold' : 'app-text-muted hover:opacity-100'
        }`}
      >
        <Folder className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Projects</span>
      </button>

      <button
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] transition-colors cursor-pointer ${
          currentView === 'settings' ? 'app-text-main font-semibold' : 'app-text-muted hover:opacity-100'
        }`}
      >
        <Settings className="w-4 h-4" />
        <span className="text-[10px] mt-0.5">Settings</span>
      </button>
    </nav>
  );
};
