import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface OfflineScan {
  id: string;
  timestamp: number;
  imageData: string; // base64 or blob URL
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  synced: boolean;
}

interface AgriScanDB extends DBSchema {
  offline_scans: {
    key: string;
    value: OfflineScan;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'agriscan-offline-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AgriScanDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AgriScanDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AgriScanDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline_scans')) {
          const store = db.createObjectStore('offline_scans', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export const offlineStorageService = {
  /**
   * Save a scan locally when offline
   */
  async saveOfflineScan(scan: Omit<OfflineScan, 'id' | 'timestamp' | 'synced'>): Promise<OfflineScan> {
    const db = await getDB();
    const newScan: OfflineScan = {
      ...scan,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
    };
    await db.put('offline_scans', newScan);
    return newScan;
  },

  /**
   * Retrieve all pending offline scans
   */
  async getPendingScans(): Promise<OfflineScan[]> {
    const db = await getDB();
    const allScans = await db.getAll('offline_scans');
    return allScans.filter((s) => !s.synced);
  },

  /**
   * Remove a scan after successful sync to Firebase
   */
  async removeScan(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('offline_scans', id);
  },

  /**
   * Register auto-sync callback when network connection turns back online
   */
  onNetworkStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    callback(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};
