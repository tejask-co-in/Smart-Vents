import React, { useState } from 'react';
import {
  Cloud,
  ShieldCheck,
  X,
  Check,
  User,
  Mail,
  Lock,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { UserSettings } from '../../types/vent';
import { syncEngine } from '../../services/sync/syncEngine';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'USER_NOT_FOUND') {
          setErrorMsg(
            'No existing cloud account found for this email. Please switch to the "Create Account" tab above to register.'
          );
        } else {
          setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
        }
        setLoading(false);
        return;
      }

      // Success
      const updated: UserSettings = {
        ...settings,
        mode: 'cloud',
        cloudAccount: {
          email: data.user.email,
          displayName: data.user.displayName,
          syncEnabled: true,
        },
      };

      onUpdateSettings(updated);
      setStatusMsg(`Authenticated as ${data.user.displayName}. Syncing your data...`);

      // Trigger actual sync
      await syncEngine.triggerSync(updated);

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Network error connecting to sync server. You can continue offline in Local Mode.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim() || email.split('@')[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to register account.');
        setLoading(false);
        return;
      }

      const updated: UserSettings = {
        ...settings,
        mode: 'cloud',
        cloudAccount: {
          email: data.user.email,
          displayName: data.user.displayName,
          syncEnabled: true,
        },
      };

      onUpdateSettings(updated);
      setStatusMsg(`Account registered! Synced partition active for ${data.user.displayName}.`);

      await syncEngine.triggerSync(updated);

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg('Could not register account on sync server. Please try again.');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }

    const updated: UserSettings = {
      ...settings,
      mode: 'local',
      cloudAccount: undefined,
    };
    onUpdateSettings(updated);
    setStatusMsg('Signed out. Your dumps remain safe on this device in Local Mode.');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl app-card app-border p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b app-border">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-sm app-text-main">
              {settings.mode === 'cloud' && settings.cloudAccount
                ? 'Cloud Sync Account'
                : 'Authentication & Cloud Sync'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="app-text-muted hover:opacity-100 transition p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If already signed in */}
        {settings.mode === 'cloud' && settings.cloudAccount ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl app-subtle app-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 font-bold text-sm">
                  {settings.cloudAccount.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-semibold app-text-main">
                    {settings.cloudAccount.displayName}
                  </div>
                  <div className="text-[11px] app-text-muted font-mono">
                    {settings.cloudAccount.email}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t app-border flex items-center justify-between text-xs text-emerald-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Real Cloud Synchronization Active</span>
                </div>
                <span className="text-[10px] font-mono app-text-muted">Authenticated</span>
              </div>
            </div>

            <p className="text-[11px] app-text-muted leading-relaxed">
              Your vents and projects are actively synced with the server store. If you sign out, your dumps remain safely stored locally in this browser.
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs text-rose-500 hover:text-rose-400 font-medium transition cursor-pointer"
              >
                Sign Out & Switch to Local
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Real Explanation Banner */}
            <div className="p-3.5 rounded-xl app-subtle app-border text-xs space-y-2">
              <div className="flex items-start justify-between">
                <div className="font-semibold app-text-main flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Local Mode is default & 100% private</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-[10px] font-mono text-indigo-500 hover:underline flex items-center gap-0.5 cursor-pointer ml-2 shrink-0"
                >
                  <span>How it works</span>
                  {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <p className="text-[11px] app-text-muted leading-relaxed">
                Smart Vent is **Local-First**. You do not need to create an account to use it. Sign in or register only if you want to sync your thoughts across devices.
              </p>

              {showExplanation && (
                <div className="pt-2 border-t app-border text-[11px] app-text-muted space-y-1.5">
                  <p>
                    <strong className="app-text-main">Why did it take you in earlier?</strong> Because Smart Vent doesn't lock you out behind a login wall. Your device's browser IndexedDB immediately stores your data privately.
                  </p>
                  <p>
                    <strong className="app-text-main">Is this real?</strong> Yes! When you register below, the server provisions a real account and authenticates future synchronization calls with an authorization session token.
                  </p>
                </div>
              )}
            </div>

            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="flex rounded-lg app-subtle app-border p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setStatusMsg(null);
                }}
                className={`flex-1 py-1.5 font-medium rounded-md transition cursor-pointer ${
                  mode === 'signin'
                    ? 'app-card app-text-main shadow-xs font-semibold'
                    : 'app-text-muted hover:opacity-100'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setStatusMsg(null);
                }}
                className={`flex-1 py-1.5 font-medium rounded-md transition cursor-pointer ${
                  mode === 'register'
                    ? 'app-card app-text-main shadow-xs font-semibold'
                    : 'app-text-muted hover:opacity-100'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={mode === 'signin' ? handleSignIn : handleRegister} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono app-text-muted uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <Mail className="w-3.5 h-3.5 app-text-muted absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg app-input app-border focus:outline-none focus:border-indigo-500 font-sans"
                    autoFocus
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-[11px] font-mono app-text-muted uppercase tracking-wider block">
                    Your Name or Handle
                  </label>
                  <div className="relative mt-1">
                    <User className="w-3.5 h-3.5 app-text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg app-input app-border focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono app-text-muted uppercase tracking-wider block">
                  Password (min 6 characters)
                </label>
                <div className="relative mt-1">
                  <Lock className="w-3.5 h-3.5 app-text-muted absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg app-input app-border focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {statusMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{statusMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs app-text-muted hover:opacity-100 transition cursor-pointer"
                >
                  Stay in Local Mode
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 rounded-lg transition shadow-xs hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In & Sync' : 'Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
