import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  CloudUpload,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { OfflineObservation } from '../lib/db';
import {
  SyncProgressState,
  subscribeToSyncProgress,
  syncAllOfflineObservations,
} from '../services/offlineSyncService';
import { triggerHaptic } from '../utils/haptics';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  user: User | null;
  offlineObservations: OfflineObservation[];
  onOpenOfflineDrawer?: () => void;
  t?: any;
}

export default function OfflineSyncBanner({
  isOnline,
  user,
  offlineObservations,
  onOpenOfflineDrawer,
  t,
}: OfflineSyncBannerProps) {
  const [syncState, setSyncState] = useState<SyncProgressState>({
    isSyncing: false,
    totalPending: 0,
    syncedCount: 0,
    currentProgress: 0,
    currentObsId: null,
    currentStepText: '',
    lastSyncTimestamp: null,
    lastSyncError: null,
  });

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSyncProgress((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const pendingCount = offlineObservations.filter(
    (o) => o.status === 'pending' || o.status === 'error' || o.status === 'syncing'
  ).length;

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOnline) {
      triggerHaptic('error');
      alert('Impossible de synchroniser : Vous êtes actuellement hors-ligne (zone blanche).');
      return;
    }
    if (!user) {
      triggerHaptic('error');
      alert('Veuillez vous connecter pour synchroniser vos données avec Firestore.');
      return;
    }
    triggerHaptic('medium');
    await syncAllOfflineObservations(user);
  };

  // Ne rien afficher si on est en ligne et qu'il n'y a aucune observation en attente ni synchronisation en cours
  if (isOnline && pendingCount === 0 && !syncState.isSyncing && !syncState.lastSyncError) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full mb-4"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-lg ${
          !isOnline
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-100 shadow-amber-950/20'
            : syncState.isSyncing
            ? 'bg-sky-950/40 border-sky-500/40 text-sky-100 shadow-sky-950/20'
            : syncState.lastSyncError
            ? 'bg-red-950/40 border-red-500/40 text-red-100 shadow-red-950/20'
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-emerald-950/20'
        }`}
      >
        {/* Lueur d'ambiance */}
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-white pointer-events-none" />

        <div className="p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Colonne gauche : État et badges */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-2.5 rounded-xl flex-shrink-0 ${
                  !isOnline
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : syncState.isSyncing
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-spin'
                    : syncState.lastSyncError
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {!isOnline ? (
                  <WifiOff className="w-5 h-5" />
                ) : syncState.isSyncing ? (
                  <RefreshCw className="w-5 h-5" />
                ) : syncState.lastSyncError ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CloudUpload className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-white tracking-wide">
                    {!isOnline
                      ? 'Mode Zone Blanche (Hors-Ligne)'
                      : syncState.isSyncing
                      ? 'Synchronisation Firestore en cours...'
                      : 'File d’attente Hors-Ligne'}
                  </h4>

                  {pendingCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-white/15 border border-white/20 text-white shadow-sm">
                      <Database className="w-3 h-3 text-amber-400" />
                      {pendingCount} en attente
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
                  {!isOnline
                    ? 'Prises de vue & diagnostics préliminaires actifs en cache local (IndexedDB).'
                    : syncState.isSyncing
                    ? syncState.currentStepText || 'Envoi des photos et analyse multimodale...'
                    : `${pendingCount} fiche(s) prête(s) pour la synchronisation automatique vers le Cloud.`}
                </p>
              </div>
            </div>

            {/* Colonne droite : Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
              {onOpenOfflineDrawer && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenOfflineDrawer}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Voir fiches</span>
                </button>
              )}

              {isOnline && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncState.isSyncing}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-md hover:shadow-emerald-500/25 border border-emerald-400/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {syncState.isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Barre de progression pendant la synchronisation */}
          {syncState.isSyncing && (
            <div className="mt-3 pt-2.5 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-medium text-white/90 mb-1.5">
                <span>{syncState.currentStepText}</span>
                <span className="font-bold">{syncState.currentProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-400 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.max(5, syncState.currentProgress)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
