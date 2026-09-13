import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  Download,
  Copy,
  Check,
  Package,
  Terminal,
  FileCode,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';

interface ApkExportModalProps {
  onClose: () => void;
  language?: 'fr' | 'en' | 'ar' | 'es';
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ onClose, language = 'fr' }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'quick' | 'manifest' | 'config' | 'gradle'>('quick');

  React.useEffect(() => {
    QRCode.toDataURL(window.location.origin, {
      width: 200,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    }).then(setQrDataUrl).catch(console.error);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const androidManifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ai.agriscan.app">

    <!-- Hardware & Offline Agronomic Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="AgriScan AI"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="false">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="AgriScan AI"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep linking for web / APK sync -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="agriscan.ai" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const capacitorConfigContent = `{
  "appId": "ai.agriscan.app",
  "appName": "AgriScan AI",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 1500,
      "backgroundColor": "#042f2e",
      "androidSplashResourceName": "splash",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#042f2e"
    }
  }
}`;

  const buildGradleSnippet = `// android/app/build.gradle
android {
    namespace "ai.agriscan.app"
    compileSdkVersion 34
    defaultConfig {
        applicationId "ai.agriscan.app"
        minSdkVersion 23
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}`;

  // Download complete Android Configuration Bundle as JSON/Text package
  const handleDownloadAndroidPackage = () => {
    const bundleContent = JSON.stringify(
      {
        appName: "AgriScan AI",
        packageId: "ai.agriscan.app",
        version: "1.0.0",
        buildInstructions: [
          "1. npm run build",
          "2. npx cap sync android",
          "3. npx cap open android",
          "4. In Android Studio: Build > Generate Signed Bundle / APK"
        ],
        files: {
          "AndroidManifest.xml": androidManifestContent,
          "capacitor.config.json": capacitorConfigContent,
          "build.gradle": buildGradleSnippet,
        },
      },
      null,
      2
    );

    const blob = new Blob([bundleContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agriscan-android-apk-bundle-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-[#0b120e] border border-slate-200 dark:border-emerald-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/40 dark:from-emerald-950/80 dark:via-[#0e1a14] dark:to-slate-950/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Export Android APK & Bundle
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-extrabold rounded-md border border-emerald-300 dark:border-emerald-500/30">
                  Capacitor 8
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Génération de package autonome pour smartphone ou Google Play Store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2 gap-2 text-xs overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal size={14} />
            <span>Guide Rapide</span>
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manifest'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCode size={14} />
            <span>AndroidManifest.xml</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Package size={14} />
            <span>Capacitor Config</span>
          </button>
          <button
            onClick={() => setActiveTab('gradle')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gradle'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={14} />
            <span>build.gradle</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              {/* Direct QR code test on device */}
              <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                {qrDataUrl && (
                  <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                    <img src={qrDataUrl} alt="QR Code PWA / APK" className="w-32 h-32" />
                  </div>
                )}
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-bold">
                    <QrCode size={12} /> Test Instantané sur Smartphone
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    Scannez pour installer directement la PWA ou tester l'APK
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Ouvrez l'appareil photo de votre téléphone Android ou iOS pour ouvrir l'application et l'ajouter à votre écran d'accueil avec cache hors-ligne complet.
                  </p>
                </div>
              </div>

              {/* CLI Build Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={14} className="text-emerald-400" />
                  Commandes de Compilation APK (Terminal)
                </h4>
                <div className="p-3 bg-black/60 rounded-xl border border-white/10 font-mono text-xs text-emerald-400 space-y-1 relative group">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `npm run build\nnpx cap sync android\nnpx cap open android`,
                        "cli"
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg transition-colors"
                    title="Copier les commandes"
                  >
                    {copiedSection === "cli" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                  <p className="text-slate-400"># 1. Compiler le code optimisé production</p>
                  <p className="text-emerald-300">npm run build</p>
                  <p className="text-slate-400 pt-1"># 2. Synchroniser les assets avec le projet Android</p>
                  <p className="text-emerald-300">npx cap sync android</p>
                  <p className="text-slate-400 pt-1"># 3. Ouvrir dans Android Studio pour générer l'APK</p>
                  <p className="text-emerald-300">npx cap open android</p>
                </div>
              </div>

              {/* One-click Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleDownloadAndroidPackage}
                  className="p-4 bg-gradient-to-br from-emerald-600 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-slate-950 font-black rounded-2xl shadow-lg transition-all flex items-center justify-between group active:scale-98"
                >
                  <div className="text-left">
                    <p className="text-white text-xs font-bold uppercase tracking-wider opacity-90">Package Complet</p>
                    <p className="text-slate-900 text-sm font-black mt-0.5">Télécharger Pack Source (JSON/XML)</p>
                  </div>
                  <Download size={22} className="text-slate-950 group-hover:translate-y-0.5 transition-transform" />
                </button>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Publication Store</span>
                    <h5 className="text-xs font-bold text-slate-200 mt-1">Google Play Bundle (.aab)</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">Dans Android Studio: Build &gt; Generate Signed Bundle / APK</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold mt-2">
                    <ShieldCheck size={12} /> Prêt pour Android 14+ (SDK 34)
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">android/app/src/main/AndroidManifest.xml</span>
                <button
                  onClick={() => copyToClipboard(androidManifestContent, 'manifest')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1"
                >
                  {copiedSection === 'manifest' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>Copier XML</span>
                </button>
              </div>
              <pre className="p-3 bg-black/70 rounded-xl border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-80">
                {androidManifestContent}
              </pre>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">capacitor.config.json</span>
                <button
                  onClick={() => copyToClipboard(capacitorConfigContent, 'config')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1"
                >
                  {copiedSection === 'config' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>Copier JSON</span>
                </button>
              </div>
              <pre className="p-3 bg-black/70 rounded-xl border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-80">
                {capacitorConfigContent}
              </pre>
            </div>
          )}

          {activeTab === 'gradle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">android/app/build.gradle</span>
                <button
                  onClick={() => copyToClipboard(buildGradleSnippet, 'gradle')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1"
                >
                  {copiedSection === 'gradle' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>Copier Gradle</span>
                </button>
              </div>
              <pre className="p-3 bg-black/70 rounded-xl border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-80">
                {buildGradleSnippet}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Prise en charge intégrale de l'accélération matérielle, de la caméra et du GPS hors-ligne.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
          >
            Terminer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ApkExportModal;
