import { Vent, Project, Relation, UserSettings } from '../types/vent';

const DB_NAME = 'SmartVentDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

// In-memory / LocalStorage fallback cache for extreme resilience in restricted iframes
const memoryStore = {
  vents: new Map<string, Vent>(),
  projects: new Map<string, Project>(),
  relations: new Map<string, Relation>(),
  settings: null as UserSettings | null,
};

// Hydrate from localStorage if available
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const v = localStorage.getItem('smartvent_fallback_vents');
    if (v) JSON.parse(v).forEach((item: Vent) => memoryStore.vents.set(item.id, item));
    const p = localStorage.getItem('smartvent_fallback_projects');
    if (p) JSON.parse(p).forEach((item: Project) => memoryStore.projects.set(item.id, item));
    const s = localStorage.getItem('smartvent_fallback_settings');
    if (s) memoryStore.settings = JSON.parse(s);
  }
} catch (e) {
  // sandbox restrictions
}

function persistFallback() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('smartvent_fallback_vents', JSON.stringify(Array.from(memoryStore.vents.values())));
      localStorage.setItem('smartvent_fallback_projects', JSON.stringify(Array.from(memoryStore.projects.values())));
      if (memoryStore.settings) {
        localStorage.setItem('smartvent_fallback_settings', JSON.stringify(memoryStore.settings));
      }
    }
  } catch (e) {}
}

export const defaultSettings: UserSettings = {
  theme: 'dark',
  mode: 'local',
  aiProcessingPreference: 'local_only',
  smartResurfacingEnabled: true,
  duplicateDetectionEnabled: true,
  autoProjectDiscoveryEnabled: true,
  learnedPreferences: {
    tagCorrections: {},
    typeCorrections: {},
    projectAffinity: {},
    dismissedResurfacingIds: [],
    dismissedSimilarityPairs: [],
  },
};

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this environment.'));
      return;
    }

    const timer = setTimeout(() => {
      console.warn('IndexedDB initialization timed out. Using fallback storage.');
      reject(new Error('IndexedDB timeout'));
    }, 1500);

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('vents')) {
          const ventStore = db.createObjectStore('vents', { keyPath: 'id' });
          ventStore.createIndex('createdAt', 'createdAt', { unique: false });
          ventStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          ventStore.createIndex('type', 'type', { unique: false });
          ventStore.createIndex('status', 'status', { unique: false });
          ventStore.createIndex('projectId', 'projectId', { unique: false });
          ventStore.createIndex('deleted', 'deleted', { unique: false });
        }

        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('relations')) {
          const relStore = db.createObjectStore('relations', { keyPath: 'id' });
          relStore.createIndex('sourceId', 'sourceId', { unique: false });
          relStore.createIndex('targetId', 'targetId', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        clearTimeout(timer);
        resolve(request.result);
      };

      request.onerror = () => {
        clearTimeout(timer);
        reject(request.error || new Error('Failed to open SmartVent IndexedDB'));
      };

      request.onblocked = () => {
        clearTimeout(timer);
        reject(new Error('IndexedDB blocked'));
      };
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });

  return dbPromise;
}

export async function getAllVents(): Promise<Vent[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('vents', 'readonly');
      const store = tx.objectStore('vents');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        items.forEach((item: Vent) => memoryStore.vents.set(item.id, item));
        resolve(items);
      };
      request.onerror = () => {
        resolve(Array.from(memoryStore.vents.values()));
      };
    });
  } catch (err) {
    return Array.from(memoryStore.vents.values());
  }
}

export async function saveVent(vent: Vent): Promise<void> {
  memoryStore.vents.set(vent.id, vent);
  persistFallback();

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('vents', 'readwrite');
      const store = tx.objectStore('vents');
      store.put(vent);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // fallback persisted
  }
}

export async function saveVents(vents: Vent[]): Promise<void> {
  vents.forEach((v) => memoryStore.vents.set(v.id, v));
  persistFallback();

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('vents', 'readwrite');
      const store = tx.objectStore('vents');
      vents.forEach((v) => store.put(v));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // fallback persisted
  }
}

export async function getVent(id: string): Promise<Vent | undefined> {
  if (memoryStore.vents.has(id)) {
    return memoryStore.vents.get(id);
  }
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('vents', 'readonly');
      const store = tx.objectStore('vents');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(memoryStore.vents.get(id));
    });
  } catch {
    return memoryStore.vents.get(id);
  }
}

export async function softDeleteVent(id: string): Promise<void> {
  const vent = await getVent(id);
  if (!vent) return;
  vent.deleted = true;
  vent.deletedAt = Date.now();
  vent.updatedAt = Date.now();
  vent.syncState = 'pending';
  await saveVent(vent);
}

export async function restoreVent(id: string): Promise<void> {
  const vent = await getVent(id);
  if (!vent) return;
  vent.deleted = false;
  vent.deletedAt = undefined;
  vent.updatedAt = Date.now();
  vent.syncState = 'pending';
  await saveVent(vent);
}

export async function permanentDeleteVent(id: string): Promise<void> {
  memoryStore.vents.delete(id);
  persistFallback();

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('vents', 'readwrite');
      const store = tx.objectStore('vents');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        items.forEach((p: Project) => memoryStore.projects.set(p.id, p));
        resolve(items);
      };
      request.onerror = () => resolve(Array.from(memoryStore.projects.values()));
    });
  } catch {
    return Array.from(memoryStore.projects.values());
  }
}

export async function saveProject(project: Project): Promise<void> {
  memoryStore.projects.set(project.id, project);
  persistFallback();

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      store.put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

export async function deleteProject(id: string): Promise<void> {
  memoryStore.projects.delete(id);
  persistFallback();

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

export async function getAllRelations(): Promise<Relation[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('relations', 'readonly');
      const store = tx.objectStore('relations');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve(Array.from(memoryStore.relations.values()));
    });
  } catch {
    return Array.from(memoryStore.relations.values());
  }
}

export async function saveRelation(relation: Relation): Promise<void> {
  memoryStore.relations.set(relation.id, relation);
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('relations', 'readwrite');
      const store = tx.objectStore('relations');
      store.put(relation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

export async function getSettings(): Promise<UserSettings> {
  if (memoryStore.settings) return memoryStore.settings;

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get('app_settings');

      request.onsuccess = () => {
        if (request.result && request.result.value) {
          const s = { ...defaultSettings, ...request.result.value };
          memoryStore.settings = s;
          resolve(s);
        } else {
          resolve(defaultSettings);
        }
      };
      request.onerror = () => resolve(defaultSettings);
    });
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  memoryStore.settings = settings;
  persistFallback();

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key: 'app_settings', value: settings });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

export async function exportAllData() {
  const [vents, projects, relations, settings] = await Promise.all([
    getAllVents(),
    getAllProjects(),
    getAllRelations(),
    getSettings(),
  ]);

  return {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {
      vents,
      projects,
      relations,
      settings,
    },
  };
}

export async function importAllData(payload: {
  data: {
    vents?: Vent[];
    projects?: Project[];
    relations?: Relation[];
    settings?: UserSettings;
  };
}): Promise<{ ventCount: number; projectCount: number }> {
  const vents = payload.data?.vents || [];
  const projects = payload.data?.projects || [];
  const relations = payload.data?.relations || [];
  const settings = payload.data?.settings;

  vents.forEach((v) => memoryStore.vents.set(v.id, v));
  projects.forEach((p) => memoryStore.projects.set(p.id, p));
  relations.forEach((r) => memoryStore.relations.set(r.id, r));
  if (settings) memoryStore.settings = settings;
  persistFallback();

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['vents', 'projects', 'relations'], 'readwrite');
      const vStore = tx.objectStore('vents');
      const pStore = tx.objectStore('projects');
      const rStore = tx.objectStore('relations');

      vents.forEach((v) => vStore.put(v));
      projects.forEach((p) => pStore.put(p));
      relations.forEach((r) => rStore.put(r));

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    if (settings) {
      await saveSettings(settings);
    }
  } catch {}

  return { ventCount: vents.length, projectCount: projects.length };
}

export async function clearAllLocalData(): Promise<void> {
  memoryStore.vents.clear();
  memoryStore.projects.clear();
  memoryStore.relations.clear();
  memoryStore.settings = null;
  persistFallback();

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['vents', 'projects', 'relations'], 'readwrite');
      tx.objectStore('vents').clear();
      tx.objectStore('projects').clear();
      tx.objectStore('relations').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}
