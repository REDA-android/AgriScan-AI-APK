import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Database,
  CloudUpload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  Layers,
  WifiOff,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { OfflineObservation } from '../lib/db';
import { syncAllOfflineObservations } from '../services/offlineSyncService';
import { triggerHaptic } from '../utils/haptics';

interface OfflineObservationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  offlineObservations: OfflineObservation[];
  user: User | null;
  isOnline: boolean;
  onDeleteObservation: (id: string) => Promise<void>;
  onSelectObservation?: (obs: any) => void;
  t?: any;
}

export default function OfflineObservationsDrawer({
  isOpen,
  onClose,
  offlineObservations,
  user,
  isOnline,
  onDeleteObservation,
  onSelectObservation,
  t,
}: OfflineObservationsDrawerProps) {
  const [selectedItem, setSelectedItem] = useState<OfflineObservation | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    if (!isOnline) {
      triggerHaptic('error');
      alert('Vous êtes actuellement hors-ligne. La synchronisation nécessite un accès réseau.');
      return;
    }
    if (!user) {
      triggerHaptic('error');
      alert('Veuillez vous connecter pour synchroniser vos données.');
      return;
    }
    setIsSyncing(true);
    triggerHaptic('medium');
    try {
      await syncAllOfflineObservations(user);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Supprimer cette observation de la file d’attente locale ?')) {
      triggerHaptic('medium');
      await onDeleteObservation(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  Fiches Hors-Ligne (Zone Blanche)
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-300">
                    {offlineObservations.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Stockées en base locale IndexedDB · Prêtes pour la synchronisation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {offlineObservations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  Toutes les observations sont synchronisées
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Aucune fiche en attente dans la base IndexedDB locale. Dès que vous prenez des photos en zone blanche, elles apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {offlineObservations.map((obs) => {
                  const prelim = obs.preliminaryAnalysis || (obs.metadata?.offlineAnalysis as any);
                  const isSelected = selectedItem?.id === obs.id;

                  return (
                    <motion.div
                      key={obs.id}
                      layout
                      onClick={() => setSelectedItem(isSelected ? null : obs)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                          : 'bg-white/[0.04] hover:bg-white/[0.07] border-white/10'
                      }`}
                    >
                      <div className="flex gap-3.5">
                        {/* Miniature */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                          <img
                            src={obs.fileData}
                            alt="Capture hors-ligne"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/70 backdrop-blur-md">
                            {obs.status === 'syncing' ? (
                              <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                            ) : obs.status === 'error' ? (
                              <AlertCircle className="w-3 h-3 text-red-400" />
                            ) : (
                              <WifiOff className="w-3 h-3 text-amber-400" />
                            )}
                          </div>
                        </div>

                        {/* Informations */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-sm text-white truncate">
                              {prelim?.culture || obs.metadata?.culture || 'Observation de terrain'}
                            </h4>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                              Zone Blanche
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                            {prelim?.variety || obs.metadata?.variety || 'En attente d’analyse IA'}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {new Date(obs.capturedAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {obs.metadata?.domain && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {obs.metadata.domain}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action suppression */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(obs.id, e)}
                          title="Supprimer de la file d'attente"
                          className="p-2 self-start text-slate-500 hover:text-red-400 rounded-xl hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Détail accordéon si sélectionné */}
                      {isSelected && prelim && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-300 space-y-2"
                        >
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                            <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-300">
                              <Sparkles className="w-3.5 h-3.5" />
                              Diagnostic préliminaire local :
                            </div>
                            <p className="whitespace-pre-line text-[11px] leading-relaxed">
                              {prelim.description}
                            </p>
                          </div>

                          {obs.metadata?.notes && (
                            <div className="text-[11px] text-slate-400 bg-white/5 p-2 rounded-lg">
                              <span className="font-semibold text-slate-300">Notes du terrain : </span>
                              {obs.metadata.notes}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {isOnline ? (
                <span className="text-emerald-400 font-medium">● Réseau disponible</span>
              ) : (
                <span className="text-amber-400 font-medium">● Hors-ligne (Zone blanche)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
              >
                Fermer
              </button>

              {offlineObservations.length > 0 && isOnline && (
                <button
                  type="button"
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronisation...' : 'Tout synchroniser'}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
