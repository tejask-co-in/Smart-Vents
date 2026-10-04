import React from 'react';
import { Search, Plus, ShieldCheck, Cloud, LayoutDashboard, User, Download } from 'lucide-react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { ThemeSwitcher } from './ThemeSwitcher';
import { UserSettings } from '../../types/vent';

export type NavView = 'vent' | 'inbox' | 'projects' | 'files' | 'insights' | 'visuals' | 'archive' | 'settings' | 'search';

interface NavbarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  onOpenQuickVent: () => void;
  settings: UserSettings;
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
  onOpenAuth: () => void;
  onOpenExport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenQuickVent,
  settings,
  onThemeChange,
  onOpenAuth,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 border-b app-header backdrop-blur-md app-border">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => onNavigate('vent')}
          className="text-base font-semibold tracking-tight app-text-main hover:opacity-80 transition-opacity cursor-pointer"
        >
          Smart Vent
        </button>

        {/* Mode Indicator */}
        <div
          title={
            settings.mode === 'cloud'
              ? 'Cloud Mode Active: Synced securely'
              : 'Local Mode Active: 100% on this device'
          }
          className="hidden sm:flex items-center gap-1.5 text-[11px] app-text-muted font-mono"
        >
          <span>·</span>
          {settings.mode === 'cloud' ? (
            <span className="flex items-center gap-1 text-sky-500">
              <Cloud className="w-3 h-3" />
              <span>Cloud Synced</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500">
              <ShieldCheck className="w-3 h-3" />
              <span>Local Device</span>
            </span>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation Links (Desktop) */}
      <nav className="hidden md:flex items-center gap-5 text-sm font-medium app-text-muted">
        <button
          onClick={() => onNavigate('vent')}
          className={`transition-colors cursor-pointer ${
            currentView === 'vent'
              ? 'app-text-main underline underline-offset-8 decoration-neutral-400'
              : 'hover:opacity-100'
          }`}
        >
          Vent
        </button>
        <button
          onClick={() => onNavigate('inbox')}
          className={`transition-colors cursor-pointer ${
            currentView === 'inbox'
              ? 'app-text-main underline underline-offset-8 decoration-neutral-400'
              : 'hover:opacity-100'
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => onNavigate('visuals')}
          className={`flex items-center gap-1 transition-colors cursor-pointer ${
            currentView === 'visuals'
              ? 'text-indigo-500 font-semibold underline underline-offset-8 decoration-indigo-500'
              : 'hover:text-indigo-400'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Visuals</span>
        </button>
        <button
          onClick={() => onNavigate('projects')}
          className={`transition-colors cursor-pointer ${
            currentView === 'projects'
              ? 'app-text-main underline underline-offset-8 decoration-neutral-400'
              : 'hover:opacity-100'
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => onNavigate('files')}
          className={`transition-colors cursor-pointer ${
            currentView === 'files'
              ? 'app-text-main underline underline-offset-8 decoration-neutral-400'
              : 'hover:opacity-100'
          }`}
        >
          Files
        </button>
        <button
          onClick={() => onNavigate('insights')}
          className={`transition-colors cursor-pointer ${
            currentView === 'insights'
              ? 'app-text-main underline underline-offset-8 decoration-neutral-400'
              : 'hover:opacity-100'
          }`}
        >
          Insights
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className={`transition-colors cursor-pointer ${
            currentView === 'settings'
              ? 'app-text-main underline underline-offset-8 decoration-neutral-400'
              : 'hover:opacity-100'
          }`}
        >
          Settings
        </button>
      </nav>

      {/* Zone 3: Actions + Theme Switcher + Auth */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeSwitcher
          currentTheme={settings.theme}
          onThemeChange={onThemeChange}
        />

        {/* Sign In / Account Button */}
        <button
          type="button"
          onClick={onOpenAuth}
          title={
            settings.mode === 'cloud' && settings.cloudAccount
              ? `Signed in as ${settings.cloudAccount.displayName}`
              : 'Sign in to sync across devices'
          }
          className="flex items-center gap-1.5 px-2 py-1 text-xs app-card app-card-hover rounded-md transition cursor-pointer"
        >
          {settings.mode === 'cloud' && settings.cloudAccount ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="max-w-[70px] sm:max-w-[100px] truncate font-medium app-text-main">
                {settings.cloudAccount.displayName}
              </span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 app-text-muted" />
              <span className="hidden sm:inline app-text-main">Sign In</span>
            </>
          )}
        </button>

        <PWAInstallPrompt />

        {onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            title="Export Data & Backup (Markdown, JSON, CSV, PDF)"
            className="flex items-center gap-1.5 px-2 py-1 text-xs app-card app-card-hover rounded-md transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline app-text-main">Export</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('search')}
          title="Search or natural command (Cmd+K)"
          className="flex items-center gap-1.5 px-2 py-1 text-xs app-text-muted app-card app-card-hover rounded-md transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden lg:inline text-[10px] font-mono app-subtle px-1 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Clean Desktop + Vent Button (Hidden on mobile to avoid clutter since mobile has bottom Nav) */}
        <button
          onClick={onOpenQuickVent}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all shadow-sm cursor-pointer bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:opacity-90"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Vent</span>
        </button>
      </div>
    </header>
  );
};
