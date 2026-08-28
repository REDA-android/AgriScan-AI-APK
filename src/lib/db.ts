import { openDB, IDBPDatabase } from 'idb';
import { Observation, PlantAnalysis } from '../types';

const DB_NAME = 'agroscan_offline_db';
const OFFLINE_STORE = 'offline_observations';
const CACHED_OBS_STORE = 'cached_observations';
const VERSION = 2;

export interface OfflineObservationImage {
  dataUrl: string;
  storageBlob?: Blob;
  mimeType: string;
  aiBase64?: string;
}

export interface OfflineObservation {
  id: string;
  userId: string;
  metadata: any;
  fileData: string; // Miniature principale / DataUrl preview
  fileType: string;
  images?: OfflineObservationImage[]; // Toutes les photos capturées en zone blanche
  capturedAt: string;
  status: 'pending' | 'syncing' | 'error' | 'completed';
  error?: string;
  retryCount?: number;
  preliminaryAnalysis?: PlantAnalysis | null;
  syncProgress?: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function initDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db, oldVersion) {
        // Store 1 : Files d'attente des observations prises en zone blanche
        if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
          const store = db.createObjectStore(OFFLINE_STORE, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('capturedAt', 'capturedAt', { unique: false });
        }

        // Store 2 : Cache local des fiches d'analyse pour consultation hors-ligne
        if (!db.objectStoreNames.contains(CACHED_OBS_STORE)) {
          const cachedStore = db.createObjectStore(CACHED_OBS_STORE, { keyPath: 'id' });
          cachedStore.createIndex('userId', 'userId', { unique: false });
          cachedStore.createIndex('capturedAt', 'capturedAt', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

// -------------------------------------------------------------
// GESTION DE LA FILE D'ATTENTE HORS-LIGNE (Prises de vue & Diagnostics)
// -------------------------------------------------------------

export async function saveOfflineObservation(obs: OfflineObservation): Promise<string> {
  const db = await initDB();
  await db.put(OFFLINE_STORE, {
    ...obs,
    retryCount: obs.retryCount ?? 0,
    status: obs.status || 'pending',
  });
  notifyStorageChange();
  return obs.id;
}

export async function getOfflineObservations(): Promise<OfflineObservation[]> {
  try {
    const db = await initDB();
    const records = await db.getAll(OFFLINE_STORE);
    return records.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  } catch (error) {
    console.error('Erreur getOfflineObservations:', error);
    return [];
  }
}

export async function getOfflineObservationById(id: string): Promise<OfflineObservation | undefined> {
  try {
    const db = await initDB();
    return db.get(OFFLINE_STORE, id);
  } catch (error) {
    console.error(`Erreur getOfflineObservationById (${id}):`, error);
    return undefined;
  }
}

export async function deleteOfflineObservation(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(OFFLINE_STORE, id);
  notifyStorageChange();
}

export async function clearOfflineObservations(): Promise<void> {
  const db = await initDB();
  await db.clear(OFFLINE_STORE);
  notifyStorageChange();
}

export async function updateOfflineStatus(
  id: string,
  status: 'pending' | 'syncing' | 'error' | 'completed',
  error?: string,
  syncProgress?: number
): Promise<void> {
  const db = await initDB();
  const obs = await db.get(OFFLINE_STORE, id);
  if (obs) {
    obs.status = status;
    if (error !== undefined) obs.error = error;
    if (syncProgress !== undefined) obs.syncProgress = syncProgress;
    if (status === 'error') {
      obs.retryCount = (obs.retryCount || 0) + 1;
    }
    await db.put(OFFLINE_STORE, obs);
    notifyStorageChange();
  }
}

// -------------------------------------------------------------
// GESTION DU CACHE DES FICHES D'ANALYSE (Consultation en zone blanche)
// -------------------------------------------------------------

export async function cacheObservations(observations: Observation[]): Promise<void> {
  if (!observations || observations.length === 0) return;
  try {
    const db = await initDB();
    const tx = db.transaction(CACHED_OBS_STORE, 'readwrite');
    for (const obs of observations) {
      if (obs && obs.id) {
        await tx.store.put(obs);
      }
    }
    await tx.done;
  } catch (error) {
    console.warn('Erreur lors de la mise en cache locale des observations:', error);
  }
}

export async function getCachedObservations(): Promise<Observation[]> {
  try {
    const db = await initDB();
    const cached = await db.getAll(CACHED_OBS_STORE);
    return cached.sort((a, b) => {
      const dateA = new Date(a.capturedAt || 0).getTime();
      const dateB = new Date(b.capturedAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erreur getCachedObservations:', error);
    return [];
  }
}

export async function getCachedObservationById(id: string): Promise<Observation | undefined> {
  try {
    const db = await initDB();
    return db.get(CACHED_OBS_STORE, id);
  } catch (error) {
    console.error(`Erreur getCachedObservationById (${id}):`, error);
    return undefined;
  }
}

export async function saveCachedObservation(obs: Observation): Promise<void> {
  if (!obs || !obs.id) return;
  try {
    const db = await initDB();
    await db.put(CACHED_OBS_STORE, obs);
  } catch (error) {
    console.warn('Erreur saveCachedObservation:', error);
  }
}

export async function deleteCachedObservation(id: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(CACHED_OBS_STORE, id);
  } catch (error) {
    console.warn('Erreur deleteCachedObservation:', error);
  }
}

// -------------------------------------------------------------
// EVENT DISPATCHER POUR MISE À JOUR RÉACTIVE DES COMPOSANTS
// -------------------------------------------------------------
function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agroscan:offline-storage-changed'));
  }
}
