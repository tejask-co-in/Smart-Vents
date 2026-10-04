import { Vent, UserSettings } from '../../types/vent';
import { getAllVents, saveVents, saveSettings } from '../../db/indexedDB';

export type SyncStatus = 'local' | 'synced' | 'syncing' | 'offline' | 'pending' | 'conflict' | 'error';

export interface SyncConflict {
  ventId: string;
  localVersion: Vent;
  cloudVersion: Vent;
}

export class SyncEngine {
  private status: SyncStatus = 'local';
  private listeners: ((status: SyncStatus) => void)[] = [];
  private conflicts: SyncConflict[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getConflicts(): SyncConflict[] {
    return this.conflicts;
  }

  public subscribe(fn: (status: SyncStatus) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private setStatus(status: SyncStatus) {
    this.status = status;
    this.listeners.forEach((l) => l(status));
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline && this.status !== 'local') {
      this.setStatus('offline');
    }
  }

  public async triggerSync(settings: UserSettings): Promise<{ success: boolean; syncedCount: number }> {
    if (settings.mode !== 'cloud' || !settings.cloudAccount?.syncEnabled) {
      this.setStatus('local');
      return { success: true, syncedCount: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return { success: false, syncedCount: 0 };
    }

    this.setStatus('syncing');

    try {
      const allVents = await getAllVents();
      const pendingVents = allVents.filter((v) => v.syncState === 'pending' || v.syncState === 'local');

      // Attempt push to server-side sync API
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: settings.cloudAccount.email,
          vents: pendingVents,
          lastSyncTimestamp: settings.lastSyncTimestamp || 0,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        // Update local items to synced
        const updated = allVents.map((v) => {
          if (pendingVents.some((p) => p.id === v.id)) {
            return { ...v, syncState: 'synced' as const, updatedAt: Date.now() };
          }
          return v;
        });
        await saveVents(updated);

        settings.lastSyncTimestamp = Date.now();
        await saveSettings(settings);

        this.setStatus('synced');
        return { success: true, syncedCount: pendingVents.length };
      } else {
        // Fallback or server error
        this.setStatus('error');
        return { success: false, syncedCount: 0 };
      }
    } catch (err) {
      console.warn('Sync failed (likely offline/mock fallback):', err);
      // In offline or fallback mode, keep local pending
      this.setStatus('pending');
      return { success: false, syncedCount: 0 };
    }
  }

  public resolveConflict(ventId: string, choice: 'keep_local' | 'keep_cloud' | 'merge') {
    this.conflicts = this.conflicts.filter((c) => c.ventId !== ventId);
    if (this.conflicts.length === 0) {
      this.setStatus('synced');
    }
  }
}

export const syncEngine = new SyncEngine();
