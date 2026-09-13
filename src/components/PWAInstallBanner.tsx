import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallBannerProps {
  onOpenApkModal?: () => void;
  language?: 'fr' | 'en' | 'ar' | 'es';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenApkModal, language = 'fr' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isInstalled || isDismissed) return null;

  const t = {
    fr: {
      title: "Installer AgriScan AI",
      subtitle: "Mode hors-ligne, scans instantanés & icône écran d'accueil",
      install: "Installer l'App",
      iosGuide: "Ajouter à l'écran d'accueil",
      apkExport: "Pack APK Android",
      iosStep1: "1. Appuyez sur le bouton Partager",
      iosStep2: "2. Faites défiler et sélectionnez 'Sur l'écran d'accueil'",
      close: "Fermer",
    },
    en: {
      title: "Install AgriScan AI",
      subtitle: "Offline mode, instant scans & home screen access",
      install: "Install App",
      iosGuide: "Add to Home Screen",
      apkExport: "Android APK Pack",
      iosStep1: "1. Tap the Share button in Safari",
      iosStep2: "2. Scroll down and tap 'Add to Home Screen'",
      close: "Close",
    },
    ar: {
      title: "تثبيت AgriScan AI",
      subtitle: "العمل بدون إنترنت، فحص فوري ووصول مباشر من الشاشة الرئيسية",
      install: "تثبيت التطبيق",
      iosGuide: "إضافة إلى الشاشة الرئيسية",
      apkExport: "حزمة أندرويد APK",
      iosStep1: "1. اضغط على زر المشاركة في Safari",
      iosStep2: "2. اختر 'إضافة إلى الشاشة الرئيسية'",
      close: "إغلاق",
    },
    es: {
      title: "Instalar AgriScan AI",
      subtitle: "Modo sin conexión, escaneo rápido y acceso en pantalla de inicio",
      install: "Instalar App",
      iosGuide: "Añadir a pantalla de inicio",
      apkExport: "Paquete APK Android",
      iosStep1: "1. Toca el botón Compartir en Safari",
      iosStep2: "2. Desplázate y selecciona 'Añadir a pantalla de inicio'",
      close: "Cerrar",
    }
  }[language] || {
    title: "Installer AgriScan AI",
    subtitle: "Mode hors-ligne, scans instantanés & icône écran d'accueil",
    install: "Installer l'App",
    iosGuide: "Ajouter à l'écran d'accueil",
    apkExport: "Pack APK Android",
    iosStep1: "1. Appuyez sur le bouton Partager",
    iosStep2: "2. Faites défiler et sélectionnez 'Sur l'écran d'accueil'",
    close: "Fermer",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-3 my-2 p-3 bg-gradient-to-r from-emerald-950/80 via-[#0d1a14]/90 to-slate-950/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-slate-100 z-30"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0 shadow-md border border-emerald-400/40">
            <Smartphone size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black tracking-tight text-emerald-300 truncate">
              {t.title}
            </h4>
            <p className="text-[10px] text-slate-300/80 truncate">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>{t.install}</span>
            </button>
          )}

          {isIOS && !isInstallable && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <PlusSquare size={13} />
              <span>{t.iosGuide}</span>
            </button>
          )}

          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-bold rounded-xl transition-all hidden sm:flex items-center gap-1"
              title="Assistant d'export APK Android"
            >
              <Smartphone size={13} className="text-amber-400" />
              <span>APK</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Masquer"
          >
            <X size={15} />
          </button>
        </div>
      </motion.div>

      {/* iOS Safari Installation Guide Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121915] border border-emerald-500/30 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Smartphone size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-100">
                    {t.iosGuide}
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0 mt-0.5">
                    <Share size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">{t.iosStep1}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Situé dans la barre d'outils inférieure de Safari (icône carré avec flèche vers le haut).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
                    <PlusSquare size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">{t.iosStep2}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      L'icône AgriScan AI apparaîtra sur votre écran d'accueil avec support hors-ligne plein écran.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-98"
              >
                {t.close}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PWAInstallBanner;
