import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, uploadImage } from '../firebase';
import {
  getOfflineObservations,
  deleteOfflineObservation,
  updateOfflineStatus,
  saveCachedObservation,
  OfflineObservation,
} from '../lib/db';
import { dataUrlToBlob } from '../utils/imageUtils';
import { analyzePlantImage } from './geminiService';
import { triggerHaptic } from '../utils/haptics';

export interface SyncProgressState {
  isSyncing: boolean;
  totalPending: number;
  syncedCount: number;
  currentProgress: number; // 0 à 100
  currentObsId: string | null;
  currentStepText: string;
  lastSyncTimestamp: number | null;
  lastSyncError: string | null;
}

let currentSyncState: SyncProgressState = {
  isSyncing: false,
  totalPending: 0,
  syncedCount: 0,
  currentProgress: 0,
  currentObsId: null,
  currentStepText: '',
  lastSyncTimestamp: null,
  lastSyncError: null,
};

type SyncListener = (state: SyncProgressState) => void;
const syncListeners: Set<SyncListener> = new Set();

export function subscribeToSyncProgress(listener: SyncListener): () => void {
  syncListeners.add(listener);
  listener(currentSyncState);
  return () => {
    syncListeners.delete(listener);
  };
}

function updateSyncState(partial: Partial<SyncProgressState>) {
  currentSyncState = { ...currentSyncState, ...partial };
  syncListeners.forEach((listener) => listener(currentSyncState));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('agroscan:sync-state-changed', { detail: currentSyncState })
    );
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      console.warn(`Sync attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error('Sync operation reached max retries');
}

/**
 * Synchronise l'ensemble des observations en attente stockées en IndexedDB
 * vers Firebase Storage et Firestore, puis déclenche l'analyse IA de validation.
 */
export async function syncAllOfflineObservations(
  user: User | null,
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void
): Promise<{ success: number; failed: number }> {
  if (!user) {
    console.warn('Sync impossible : Aucun utilisateur connecté.');
    return { success: 0, failed: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn('Sync impossible : Appareil hors-ligne.');
    return { success: 0, failed: 0 };
  }

  if (currentSyncState.isSyncing) {
    console.log('Synchronisation déjà en cours...');
    return { success: 0, failed: 0 };
  }

  const allOffline = await getOfflineObservations();
  const pendingItems = allOffline.filter((item) => item.status === 'pending' || item.status === 'error');

  if (pendingItems.length === 0) {
    return { success: 0, failed: 0 };
  }

  updateSyncState({
    isSyncing: true,
    totalPending: pendingItems.length,
    syncedCount: 0,
    currentProgress: 5,
    currentStepText: `Préparation de la synchronisation de ${pendingItems.length} observation(s)...`,
    lastSyncError: null,
  });

  let successCount = 0;
  let failedCount = 0;

  for (let idx = 0; idx < pendingItems.length; idx++) {
    const item = pendingItems[idx];
    const itemProgressStart = (idx / pendingItems.length) * 100;
    const itemProgressEnd = ((idx + 1) / pendingItems.length) * 100;

    try {
      updateSyncState({
        currentObsId: item.id,
        currentStepText: `Synchronisation ${idx + 1}/${pendingItems.length} : Traitement des photos...`,
        currentProgress: Math.round(itemProgressStart + 10),
      });

      await updateOfflineStatus(item.id, 'syncing', undefined, 20);

      // 1. Préparation des Blobs et Uploads vers Storage
      const storageUrls: string[] = [];
      const aiImages: { base64Image: string; mimeType: string }[] = [];

      // Si l'observation contient un tableau d'images complet
      if (item.images && item.images.length > 0) {
        for (let imgIdx = 0; imgIdx < item.images.length; imgIdx++) {
          const imgObj = item.images[imgIdx];
          const blob = imgObj.storageBlob || (await dataUrlToBlob(imgObj.dataUrl));
          const storagePath = `observations/${user.uid}/${Date.now()}_offline_${item.id}_${imgIdx}.jpg`;
          
          updateSyncState({
            currentStepText: `Synchronisation ${idx + 1}/${pendingItems.length} : Téléversement photo ${imgIdx + 1}/${item.images.length}...`,
          });

          const url = await withRetry(() => uploadImage(blob, storagePath));
          storageUrls.push(url);

          if (imgObj.aiBase64) {
            aiImages.push({
              base64Image: imgObj.aiBase64,
              mimeType: imgObj.mimeType || 'image/jpeg',
            });
          } else if (imgObj.dataUrl) {
            const base64 = imgObj.dataUrl.split(',')[1] || imgObj.dataUrl;
            aiImages.push({
              base64Image: base64,
              mimeType: imgObj.mimeType || 'image/jpeg',
            });
          }
        }
      } else if (item.fileData) {
        // Fallback sur la miniature / image unique
        const blob = await dataUrlToBlob(item.fileData);
        const storagePath = `observations/${user.uid}/${Date.now()}_offline_${item.id}.jpg`;
        const url = await withRetry(() => uploadImage(blob, storagePath));
        storageUrls.push(url);

        const base64 = item.fileData.split(',')[1] || item.fileData;
        aiImages.push({
          base64Image: base64,
          mimeType: item.fileType || 'image/jpeg',
        });
      }

      const primaryImageUrl = storageUrls[0] || 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop';
      const prelim = item.preliminaryAnalysis || (item.metadata?.offlineAnalysis as any);

      // 2. Création de l'enregistrement dans Firestore
      updateSyncState({
        currentStepText: `Synchronisation ${idx + 1}/${pendingItems.length} : Enregistrement sur Firestore...`,
        currentProgress: Math.round(itemProgressStart + 60),
      });

      const observationData = {
        userId: user.uid,
        userName: user.displayName || 'Utilisateur AgroScan',
        userEmail: user.email || '',
        domain: item.metadata?.domain || 'Général',
        location: {
          lat: item.metadata?.lat ?? 48.8566,
          lng: item.metadata?.lng ?? 2.3522,
        },
        createdAt: serverTimestamp(),
        capturedAt: item.capturedAt || new Date().toISOString(),
        imageUrl: primaryImageUrl,
        imageUrls: storageUrls,
        culture: prelim?.culture || item.metadata?.culture || 'En attente...',
        variety: prelim?.variety || item.metadata?.variety || 'En attente...',
        species: prelim?.species || item.metadata?.species || 'Inconnu',
        family: prelim?.family || item.metadata?.family || 'Inconnu',
        bbchDominant: prelim?.bbchDominant || item.metadata?.bbchDominant || '',
        bbchSecondary: prelim?.bbchSecondary || item.metadata?.bbchSecondary || [],
        organCounts: prelim?.organCounts || item.metadata?.organCounts || { flowers: 0, fruits: 0, details: '' },
        phenotypicTraits: prelim?.phenotypicTraits || item.metadata?.phenotypicTraits || {
          color: '...',
          shape: '...',
          size: '...',
          healthStatus: '...',
          diseasesOrDeficiencies: [],
        },
        description: prelim?.description || item.metadata?.description || 'Observation synchronisée depuis la zone blanche.',
        userNotes: item.metadata?.notes || item.metadata?.userNotes || '',
        status: 'completed',
        plantingDate: item.metadata?.plantingDate || null,
        breeder: item.metadata?.breeder || null,
        pruningDate: item.metadata?.pruningDate || null,
        harvestQuantity: item.metadata?.harvestQuantity || null,
        density: item.metadata?.density || null,
        fruitFirmness: item.metadata?.fruitFirmness || null,
        defects: item.metadata?.defects || null,
        audioNotes: item.metadata?.audioNotes || [],
        mediaNotes: item.metadata?.mediaNotes || [],
        isDeletedByCreator: false,
        syncedFromOffline: true,
        syncedAt: new Date().toISOString(),
      };

      const docRef = await withRetry(() => addDoc(collection(db, 'observations'), observationData));

      // 3. Mise en cache local de la fiche dans IndexedDB
      await saveCachedObservation({
        id: docRef.id,
        ...observationData,
      } as any);

      // 4. Lancement de l'analyse IA de validation en arrière-plan si des images sont disponibles
      if (aiImages.length > 0) {
        (async () => {
          try {
            console.log(`[Auto-Sync] Lancement analyse multimodale Gemini pour doc ${docRef.id}...`);
            const aiResult = await analyzePlantImage(aiImages);
            if (aiResult) {
              await updateDoc(doc(db, 'observations', docRef.id), {
                ...aiResult,
                status: 'completed',
                analyzedAt: serverTimestamp(),
              });
              await saveCachedObservation({
                id: docRef.id,
                ...observationData,
                ...aiResult,
                status: 'completed',
              } as any);
              console.log(`[Auto-Sync] Doc ${docRef.id} mis à jour avec le rapport Gemini.`);
            }
          } catch (aiErr) {
            console.warn(`[Auto-Sync] Analyse IA différée pour doc ${docRef.id}:`, aiErr);
          }
        })();
      }

      // 5. Suppression de la file d'attente hors-ligne réussie
      await deleteOfflineObservation(item.id);
      successCount++;

      updateSyncState({
        syncedCount: successCount,
        currentProgress: Math.round(itemProgressEnd),
      });
    } catch (error: any) {
      console.error(`Échec synchronisation observation ${item.id}:`, error);
      failedCount++;
      await updateOfflineStatus(item.id, 'error', error.message || String(error));
    }
  }

  const finalState: SyncProgressState = {
    isSyncing: false,
    totalPending: failedCount,
    syncedCount: successCount,
    currentProgress: 100,
    currentObsId: null,
    currentStepText: failedCount === 0
      ? `Synchronisation terminée avec succès (${successCount} transmises).`
      : `Synchronisation partielle : ${successCount} réussie(s), ${failedCount} en erreur.`,
    lastSyncTimestamp: Date.now(),
    lastSyncError: failedCount > 0 ? `${failedCount} observation(s) n'ont pas pu être synchronisées.` : null,
  };

  updateSyncState(finalState);

  if (successCount > 0) {
    triggerHaptic('success');
    if (onNotify) {
      onNotify(
        `✅ Synchronisation terminée : ${successCount} observation(s) synchronisée(s) vers Firestore !`,
        'success'
      );
    }
  } else if (failedCount > 0 && onNotify) {
    triggerHaptic('error');
    onNotify(
      `⚠️ Erreur de synchronisation : ${failedCount} observation(s) nécessitent une nouvelle tentative.`,
      'error'
    );
  }

  return { success: successCount, failed: failedCount };
}

let autoSyncInitialized = false;
let autoSyncTimeout: any = null;

/**
 * Initialise l'écouteur automatique de retour de connexion (Online Event & Periodic check)
 */
export function initializeAutoSync(getUser: () => User | null, onNotify?: (msg: string, type: any) => void) {
  if (typeof window === 'undefined' || autoSyncInitialized) return;
  autoSyncInitialized = true;

  const triggerAutoSync = () => {
    if (autoSyncTimeout) clearTimeout(autoSyncTimeout);
    autoSyncTimeout = setTimeout(async () => {
      const user = getUser();
      if (user && navigator.onLine && !currentSyncState.isSyncing) {
        const offline = await getOfflineObservations();
        const pending = offline.filter((o) => o.status === 'pending' || o.status === 'error');
        if (pending.length > 0) {
          console.log(`[Auto-Sync] Retour de connexion détecté. Synchronisation de ${pending.length} observation(s)...`);
          if (onNotify) {
            onNotify(`📡 Connexion rétablie : Synchronisation automatique de ${pending.length} fiche(s)...`, 'info');
          }
          await syncAllOfflineObservations(user, onNotify);
        }
      }
    }, 2500); // 2.5s debounce
  };

  window.addEventListener('online', triggerAutoSync);
  window.addEventListener('agroscan:offline-storage-changed', triggerAutoSync);

  // Healthcheck périodique toutes les 60 secondes si en ligne
  const interval = setInterval(() => {
    if (navigator.onLine && !currentSyncState.isSyncing) {
      triggerAutoSync();
    }
  }, 60000);

  return () => {
    window.removeEventListener('online', triggerAutoSync);
    window.removeEventListener('agroscan:offline-storage-changed', triggerAutoSync);
    clearInterval(interval);
  };
}
