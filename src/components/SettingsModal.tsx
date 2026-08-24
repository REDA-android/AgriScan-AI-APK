import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  X,
  Sun,
  Moon,
  Monitor,
  Globe,
  HardDrive,
  Trash2,
  Clock,
  Database,
  Check,
  Info,
} from "lucide-react";
import { LiquidCard, LiquidButton } from "./LiquidGlass";
import { OfflineObservation } from "../lib/db";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceOffline: boolean;
  onToggleForceOffline: (forced: boolean) => void;
  isNetworkOnline: boolean;
  offlineObservations: OfflineObservation[];
  isSyncing: boolean;
  onSyncAll: () => Promise<void>;
  onSyncSingle: (obs: OfflineObservation) => Promise<boolean>;
  onDeleteSingle?: (id: string) => Promise<void>;
  onClearQueue?: () => Promise<void>;
  themeMode: "light" | "dark" | "system";
  onChangeTheme: (mode: "light" | "dark" | "system") => void;
  language: "fr" | "en" | "ar";
  onChangeLanguage: (lang: "fr" | "en" | "ar") => void;
  firebaseStatus: "connected" | "offline" | "error" | "checking";
}

export function SettingsModal({
  isOpen,
  onClose,
  forceOffline,
  onToggleForceOffline,
  isNetworkOnline,
  offlineObservations,
  isSyncing,
  onSyncAll,
  onSyncSingle,
  onDeleteSingle,
  onClearQueue,
  themeMode,
  onChangeTheme,
  language,
  onChangeLanguage,
  firebaseStatus,
}: SettingsModalProps) {
  const [showQueueDetails, setShowQueueDetails] = useState(false);
  const [confirmClearQueue, setConfirmClearQueue] = useState(false);

  const pendingCount = offlineObservations.filter(
    (o) => o.status === "pending" || o.status === "error"
  ).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center p-0 sm:p-4"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {/* Backdrop */}
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            key="settings-content"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-lg max-h-[88vh] bg-[#121814] text-slate-200 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#161f19] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    {language === "fr"
                      ? "Paramètres de l'application"
                      : language === "ar"
                      ? "إعدادات التطبيق"
                      : "Application Settings"}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    {language === "fr"
                      ? "Synchronisation, mode hors-ligne & préférences"
                      : language === "ar"
                      ? "المزامنة، وضع عدم الاتصال والتفضيلات"
                      : "Sync, offline mode & preferences"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* SECTION: MODE HORS-LIGNE & SYNCHRONISATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WifiOff size={16} className="text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      {language === "fr"
                        ? "Mode Hors-ligne & Synchronisation"
                        : language === "ar"
                        ? "وضع عدم الاتصال والمزامنة"
                        : "Offline Mode & Sync"}
                    </h3>
                  </div>
                  {forceOffline && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                      {language === "fr"
                        ? "Actif"
                        : language === "ar"
                        ? "مفعّل"
                        : "Active"}
                    </span>
                  )}
                </div>

                {/* Force Offline Mode Switch Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    forceOffline
                      ? "bg-amber-950/30 border-amber-500/40 ring-1 ring-amber-500/30"
                      : "bg-[#18221b] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="force-offline-toggle"
                        className="text-sm font-bold text-white cursor-pointer flex items-center gap-2"
                      >
                        {language === "fr"
                          ? "Forcer le mode hors-ligne"
                          : language === "ar"
                          ? "فرض وضع عدم الاتصال"
                          : "Force Offline Mode"}
                        {forceOffline ? (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        ) : null}
                      </label>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {language === "fr"
                          ? "Désactive la synchronisation automatique dans le cloud. Vos nouvelles observations sont enregistrées localement et vous décidez quand les synchroniser manuellement."
                          : language === "ar"
                          ? "يوقف المزامنة التلقائية مع السحابة. يتم حفظ ملاحظاتك الجديدة محليًا وتقرر متى تتم المزامنة يدويًا."
                          : "Disables automatic cloud sync. Your new observations are saved locally and you decide when to manually sync them."}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      id="force-offline-toggle"
                      role="switch"
                      aria-checked={forceOffline}
                      onClick={() => onToggleForceOffline(!forceOffline)}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        forceOffline ? "bg-amber-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          forceOffline ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Network Status Info Row */}
                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        {language === "fr"
                          ? "Connexion réseau réelle :"
                          : language === "ar"
                          ? "الاتصال الفعلي بالشبكة:"
                          : "Actual network connection:"}
                      </span>
                      {isNetworkOnline ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {language === "fr"
                            ? "Connecté"
                            : language === "ar"
                            ? "متصل"
                            : "Online"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          {language === "fr"
                            ? "Déconnecté"
                            : language === "ar"
                            ? "غير متصل"
                            : "Offline"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <span>
                        {language === "fr"
                          ? "Mode actuel :"
                          : language === "ar"
                          ? "الوضع الحالي:"
                          : "Current mode:"}
                      </span>
                      <span
                        className={
                          forceOffline ? "text-amber-400" : "text-emerald-400"
                        }
                      >
                        {forceOffline
                          ? language === "fr"
                            ? "Manuel (Hors-ligne forcé)"
                            : language === "ar"
                            ? "يدوي (وضع عدم الاتصال)"
                            : "Manual (Forced Offline)"
                          : language === "fr"
                          ? "Automatique (En direct)"
                          : language === "ar"
                          ? "تلقائي (مباشر)"
                          : "Automatic (Live)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manual Sync Card */}
                <div className="p-4 rounded-2xl bg-[#18221b] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive size={16} className="text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200">
                        {language === "fr"
                          ? "File d'attente locale (IndexedDB)"
                          : language === "ar"
                          ? "قائمة الانتظار المحلية"
                          : "Local Offline Queue"}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        offlineObservations.length > 0
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {offlineObservations.length}{" "}
                      {language === "fr"
                        ? "observation(s)"
                        : language === "ar"
                        ? "ملاحظة"
                        : "item(s)"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {offlineObservations.length === 0
                      ? language === "fr"
                        ? "Toutes vos observations sont synchronisées avec le cloud."
                        : language === "ar"
                        ? "تمت مزامنة جميع ملاحظاتك مع السحابة."
                        : "All your observations are synced with the cloud."
                      : language === "fr"
                      ? `${offlineObservations.length} observation(s) en attente de synchronisation manuelle.`
                      : language === "ar"
                      ? `${offlineObservations.length} ملاحظة في انتظار المزامنة اليدوية.`
                      : `${offlineObservations.length} observation(s) pending manual sync.`}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={offlineObservations.length === 0 || isSyncing}
                      onClick={() => onSyncAll()}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        offlineObservations.length === 0 || isSyncing
                          ? "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 active:scale-95"
                      }`}
                    >
                      <RefreshCw
                        size={14}
                        className={isSyncing ? "animate-spin text-white" : ""}
                      />
                      <span>
                        {isSyncing
                          ? language === "fr"
                            ? "Synchronisation en cours..."
                            : language === "ar"
                            ? "جاري المزامنة..."
                            : "Syncing..."
                          : language === "fr"
                          ? "Synchroniser maintenant"
                          : language === "ar"
                          ? "مزامنة الآن"
                          : "Sync Now"}
                      </span>
                    </button>

                    {offlineObservations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowQueueDetails(!showQueueDetails)}
                        className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
                      >
                        {showQueueDetails
                          ? language === "fr"
                            ? "Masquer la liste"
                            : language === "ar"
                            ? "إخفاء القائمة"
                            : "Hide list"
                          : language === "fr"
                          ? "Voir les éléments"
                          : language === "ar"
                          ? "عرض العناصر"
                          : "View items"}
                      </button>
                    )}
                  </div>

                  {/* Offline Queue Items List */}
                  {showQueueDetails && offlineObservations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-2 border-t border-white/5 max-h-48 overflow-y-auto"
                    >
                      {offlineObservations.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#121a14] border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.fileData ? (
                              <img
                                src={item.fileData}
                                alt="Aperçu"
                                className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <Clock size={16} className="text-slate-500" />
                              </div>
                            )}
                            <div className="truncate">
                              <p className="font-bold text-slate-200 truncate">
                                {item.metadata?.culture ||
                                  item.metadata?.offlineAnalysis?.culture ||
                                  (language === "fr"
                                    ? "Observation hors-ligne"
                                    : "Offline observation")}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {item.capturedAt
                                  ? new Date(item.capturedAt).toLocaleString()
                                  : "Date inconnue"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.status === "syncing" ? (
                              <RefreshCw
                                size={14}
                                className="text-emerald-400 animate-spin"
                              />
                            ) : (
                              <button
                                type="button"
                                disabled={isSyncing || !isNetworkOnline}
                                onClick={() => onSyncSingle(item)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  !isNetworkOnline
                                    ? "text-slate-600 border-white/5 cursor-not-allowed"
                                    : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30"
                                }`}
                                title={
                                  language === "fr"
                                    ? "Synchroniser cet élément"
                                    : "Sync this item"
                                }
                              >
                                <RefreshCw size={13} />
                              </button>
                            )}

                            {onDeleteSingle && (
                              <button
                                type="button"
                                onClick={() => onDeleteSingle(item.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 bg-rose-500/10 border border-rose-500/20 transition-colors"
                                title={
                                  language === "fr"
                                    ? "Supprimer de la file"
                                    : "Remove from queue"
                                }
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* SECTION: THÈME D'AFFICHAGE */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sun size={16} className="text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {language === "fr"
                      ? "Thème d'affichage"
                      : language === "ar"
                      ? "سمة العرض"
                      : "Display Theme"}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "light" as const,
                      label:
                        language === "fr"
                          ? "Clair"
                          : language === "ar"
                          ? "فاتح"
                          : "Light",
                      icon: Sun,
                    },
                    {
                      id: "dark" as const,
                      label:
                        language === "fr"
                          ? "Sombre"
                          : language === "ar"
                          ? "داكن"
                          : "Dark",
                      icon: Moon,
                    },
                    {
                      id: "system" as const,
                      label:
                        language === "fr"
                          ? "Système"
                          : language === "ar"
                          ? "النظام"
                          : "System",
                      icon: Monitor,
                    },
                  ].map((theme) => {
                    const Icon = theme.icon;
                    const isActive = themeMode === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => onChangeTheme(theme.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          isActive
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30"
                            : "bg-[#18221b] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-xs font-bold">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: LANGUE */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {language === "fr"
                      ? "Langue de l'application"
                      : language === "ar"
                      ? "لغة التطبيق"
                      : "Language"}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "fr" as const, label: "Français" },
                    { id: "en" as const, label: "English" },
                    { id: "ar" as const, label: "العربية" },
                  ].map((lang) => {
                    const isActive = language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => onChangeLanguage(lang.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30"
                            : "bg-[#18221b] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {isActive && <Check size={14} className="text-emerald-400" />}
                        <span>{lang.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: INFORMATIONS DE CONNEXION */}
              <div className="p-3.5 rounded-2xl bg-[#141b16] border border-white/5 space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Database size={14} className="text-slate-400" />
                    <span>Firestore Database</span>
                  </span>
                  <span
                    className={`font-semibold capitalize ${
                      firebaseStatus === "connected"
                        ? "text-emerald-400"
                        : firebaseStatus === "offline"
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {firebaseStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Version PWA</span>
                  <span className="font-mono text-slate-300">2.6.4 (Offline-ready)</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#161f19] flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {language === "fr"
                  ? "Terminé"
                  : language === "ar"
                  ? "تم"
                  : "Done"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default SettingsModal;
