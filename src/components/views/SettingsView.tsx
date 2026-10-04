import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  HardDrive,
  Cpu,
  Cloud,
  Shield,
  FileText,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Check,
  Sparkles,
} from 'lucide-react';
import { UserSettings } from '../../types/vent';
import { LegalCenter } from '../legal/LegalCenter';
import { clearAllLocalData, saveSettings } from '../../db/indexedDB';
import { ExportImportModal } from '../common/ExportImportModal';
import { syncEngine } from '../../services/sync/syncEngine';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onDataReset: () => void;
  ventCount: number;
  projectCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onDataReset,
  ventCount,
  projectCount,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'ai' | 'sync' | 'privacy' | 'legal'>('ai');
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Cloud account state form
  const [cloudEmail, setCloudEmail] = useState(settings.cloudAccount?.email || '');
  const [cloudName, setCloudName] = useState(settings.cloudAccount?.displayName || '');

  const handleToggleTheme = (theme: 'dark' | 'light' | 'system') => {
    onUpdateSettings({ ...settings, theme });
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const handleAiPreferenceChange = (preference: 'local_only' | 'local_preferred' | 'cloud_enabled') => {
    onUpdateSettings({ ...settings, aiProcessingPreference: preference });
  };

  const handleResetPersonalization = () => {
    onUpdateSettings({
      ...settings,
      learnedPreferences: {
        tagCorrections: {},
        typeCorrections: {},
        projectAffinity: {},
        dismissedResurfacingIds: [],
        dismissedSimilarityPairs: [],
      },
    });
    alert('AI personalization has been reset to defaults.');
  };

  const handleClearAllData = async () => {
    await clearAllLocalData();
    onDataReset();
    setConfirmClearData(false);
  };

  const handleSaveCloudAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudEmail.trim()) return;

    const updated: UserSettings = {
      ...settings,
      mode: 'cloud',
      cloudAccount: {
        email: cloudEmail.trim(),
        displayName: cloudName.trim() || 'Smart Vent User',
        syncEnabled: true,
      },
    };
    onUpdateSettings(updated);
    setSyncStatusMsg('Signed in to Cloud Mode. Synchronizing local archive...');
    const result = await syncEngine.triggerSync(updated);
    if (result.success) {
      setSyncStatusMsg(`Cloud Mode Active. ${result.syncedCount} items synchronized.`);
    } else {
      setSyncStatusMsg('Cloud sync queued. Will retry automatically.');
    }
  };

  const handleSignOutCloud = () => {
    const updated: UserSettings = {
      ...settings,
      mode: 'local',
      cloudAccount: undefined,
    };
    onUpdateSettings(updated);
    setSyncStatusMsg('Returned to Local Mode. All content remains safe on this device.');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="pb-4 border-b border-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-neutral-300" />
          <span>Settings & Preferences</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Configure how Smart Vent processes, stores, synchronizes, and safeguards your thoughts.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${
            activeTab === 'ai' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${
            activeTab === 'data' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-sky-400" />
          <span>Data & Storage</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${
            activeTab === 'sync' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-amber-400" />
          <span>Cloud Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${
            activeTab === 'privacy' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Privacy & Consent</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${
            activeTab === 'general' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5 text-neutral-300" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('legal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${
            activeTab === 'legal' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          <span>Legal Center</span>
        </button>
      </div>

      {/* Tab: AI Engine */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">AI Processing Mode</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Choose where your content is processed. By default, Smart Vent processes 100% on your device.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-950 cursor-pointer">
                <input
                  type="radio"
                  name="ai_pref"
                  checked={settings.aiProcessingPreference === 'local_only'}
                  onChange={() => handleAiPreferenceChange('local_only')}
                  className="mt-0.5 text-indigo-500"
                />
                <div>
                  <div className="text-xs font-medium text-white">
                    Local Only (Default & Recommended for Privacy)
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Your content is processed entirely on this device using local deterministic heuristics and NLP tokenizers. Zero network requests made for AI.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-950 cursor-pointer">
                <input
                  type="radio"
                  name="ai_pref"
                  checked={settings.aiProcessingPreference === 'local_preferred'}
                  onChange={() => handleAiPreferenceChange('local_preferred')}
                  className="mt-0.5 text-indigo-500"
                />
                <div>
                  <div className="text-xs font-medium text-white">
                    Local Preferred
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Processes on-device, only invoking external models when local heuristics are insufficient and network is active.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-950 cursor-pointer">
                <input
                  type="radio"
                  name="ai_pref"
                  checked={settings.aiProcessingPreference === 'cloud_enabled'}
                  onChange={() => handleAiPreferenceChange('cloud_enabled')}
                  className="mt-0.5 text-indigo-500"
                />
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <span>Cloud AI Enabled (Gemini API)</span>
                    <Sparkles className="w-3 h-3 text-sky-400" />
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Enables server-side Gemini 3.8 Flash for deeper semantic categorization, cross-dump question answering, and richer entity discovery. Falls back to local if offline.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Personalization & Learned Preferences */}
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Adaptive Personalization</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Smart Vent learns from your explicit tag corrections and edits over time.
                </p>
              </div>

              <button
                onClick={handleResetPersonalization}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Learned Preferences</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 font-mono">
              <div>
                Learned Tag Corrections:{' '}
                {Object.keys(settings.learnedPreferences?.tagCorrections || {}).length} rules
              </div>
              <div className="mt-1">
                Learned Classification Adjustments:{' '}
                {Object.keys(settings.learnedPreferences?.typeCorrections || {}).length} rules
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Data & Storage */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Local Storage Architecture</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                All records reside in your browser's persistent IndexedDB database.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Total Vents</span>
                <div className="text-lg font-mono font-semibold text-white mt-1 tabular-nums">
                  {ventCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Projects</span>
                <div className="text-lg font-mono font-semibold text-white mt-1 tabular-nums">
                  {projectCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Engine Status</span>
                <div className="text-xs font-semibold text-emerald-400 mt-1">
                  IndexedDB Active
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setIsExportImportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export / Backup Data</span>
              </button>

              <button
                onClick={() => setIsExportImportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup</span>
              </button>
            </div>
          </div>

          {/* Destruction zone */}
          <div className="p-4 rounded-xl bg-neutral-900 border border-rose-900/40 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-rose-300">Eradicate Local Data</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Permanently deletes all vents, projects, and attachments stored on this device.
              </p>
            </div>

            {!confirmClearData ? (
              <button
                onClick={() => setConfirmClearData(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Local Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-300">Are you sure? This cannot be undone.</span>
                <button
                  onClick={handleClearAllData}
                  className="px-3 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded font-medium"
                >
                  Yes, Erase Everything
                </button>
                <button
                  onClick={() => setConfirmClearData(false)}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Cloud Sync */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Multi-Device Synchronization</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Local Mode keeps all data strictly on this machine. Cloud Mode allows encrypted syncing across desktop, laptop, tablet, and mobile.
              </p>
            </div>

            {settings.mode === 'cloud' && settings.cloudAccount ? (
              <div className="space-y-3 p-4 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-semibold text-white">
                      Signed in as {settings.cloudAccount.displayName}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOutCloud}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Disconnect Cloud
                  </button>
                </div>
                <div className="text-xs text-neutral-400">
                  Account Email: <span className="text-white font-mono">{settings.cloudAccount.email}</span>
                </div>
                {settings.lastSyncTimestamp && (
                  <div className="text-[11px] text-neutral-400">
                    Last synchronized: {new Date(settings.lastSyncTimestamp).toLocaleString()}
                  </div>
                )}
                {syncStatusMsg && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{syncStatusMsg}</span>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveCloudAccount} className="space-y-3 max-w-md">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 uppercase">
                    Your Email (Optional Sign-In)
                  </label>
                  <input
                    type="email"
                    value={cloudEmail}
                    onChange={(e) => setCloudEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="mt-1 w-full p-2 text-xs rounded bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 uppercase">Display Name</label>
                  <input
                    type="text"
                    value={cloudName}
                    onChange={(e) => setCloudName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="mt-1 w-full p-2 text-xs rounded bg-neutral-950 border border-neutral-800 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-md transition"
                >
                  Enable Cloud Mode
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab: Privacy & Consent */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Privacy Controls & Consent Center</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                No dark patterns. You control every background feature.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Smart Resurfacing</div>
                  <div className="text-[11px] text-neutral-400">
                    Quietly surface forgotten items when contextually relevant.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smartResurfacingEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, smartResurfacingEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-500 border-neutral-700 bg-neutral-900"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Duplicate & Similarity Alerts</div>
                  <div className="text-[11px] text-neutral-400">
                    Prompt when a new dump closely resembles a past note or task.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.duplicateDetectionEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, duplicateDetectionEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-500 border-neutral-700 bg-neutral-900"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Automatic Project Discovery</div>
                  <div className="text-[11px] text-neutral-400">
                    Infer emergent projects from recurring clusters of ideas.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoProjectDiscoveryEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, autoProjectDiscoveryEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-500 border-neutral-700 bg-neutral-900"
                />
              </label>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Zero third-party advertising or analytics scripts are embedded in Smart Vent.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: General */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Appearance & Theme</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Switch between obsidian dark mode, crisp tactile light mode, or system automatic.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleTheme('dark')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                  settings.theme === 'dark'
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                Dark (Obsidian)
              </button>
              <button
                onClick={() => handleToggleTheme('light')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                  settings.theme === 'light'
                    ? 'bg-neutral-200 text-neutral-950 border-neutral-300'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => handleToggleTheme('system')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                  settings.theme === 'system'
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Legal & Compliance */}
      {activeTab === 'legal' && <LegalCenter />}

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onDataImported={() => onDataReset()}
      />
    </div>
  );
};
