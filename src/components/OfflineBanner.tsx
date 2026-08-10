import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount?: number;
  onSyncNow?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  pendingCount = 0,
  onSyncNow,
}) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors shadow-md ${
        !isOnline
          ? 'bg-amber-500 text-slate-950 dark:bg-amber-600 dark:text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff size={16} className="animate-pulse shrink-0" />
            <span>Mode Hors-Ligne — Vos scans seront enregistrés localement.</span>
          </>
        ) : (
          <>
            <RefreshCw size={16} className="animate-spin shrink-0" />
            <span>
              Connexion rétablie — {pendingCount} scan(s) en attente de synchronisation.
            </span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && onSyncNow && (
        <button
          onClick={onSyncNow}
          className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
        >
          Synchroniser
        </button>
      )}
    </div>
  );
};

export default OfflineBanner;
