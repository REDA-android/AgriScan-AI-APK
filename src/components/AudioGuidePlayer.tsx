import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Globe,
  Gauge,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { AudioGuideService, AudioGuideContent } from '../services/audioGuideService';

interface AudioGuidePlayerProps {
  content: AudioGuideContent;
  defaultLanguage?: 'fr' | 'ar' | 'en' | 'es';
  compact?: boolean;
}

export const AudioGuidePlayer: React.FC<AudioGuidePlayerProps> = ({
  content,
  defaultLanguage = 'fr',
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'ar' | 'en' | 'es'>(defaultLanguage);
  const [rate, setRate] = useState<number>(1.0);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => {
    return () => {
      AudioGuideService.stop();
    };
  }, []);

  const handlePlay = () => {
    if (isPaused) {
      AudioGuideService.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    const script = AudioGuideService.buildScript(content, language);
    AudioGuideService.speak(
      script,
      language,
      rate,
      () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
      () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      () => {
        setIsPlaying(false);
        setIsPaused(false);
      }
    );
  };

  const handlePause = () => {
    AudioGuideService.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    AudioGuideService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ] as const;

  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  if (!AudioGuideService.isSupported()) {
    return null;
  }

  // Compact version for headers or buttons
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            isPlaying
              ? 'bg-emerald-500 text-slate-950 shadow-md animate-pulse'
              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
          }`}
          title="Écouter le guide vocal du diagnostic"
        >
          {isPlaying ? <Pause size={14} /> : <Volume2 size={14} />}
          <span className="hidden sm:inline">Guide Vocal</span>
        </button>

        {isPlaying && (
          <button
            onClick={handleStop}
            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-colors"
            title="Arrêter la lecture"
          >
            <Square size={13} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/40 border border-emerald-200 text-slate-900 shadow-sm dark:bg-gradient-to-r dark:from-emerald-950/60 dark:via-[#0d1c15] dark:to-slate-950/80 dark:border-emerald-500/30 dark:text-slate-100 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
          }`}>
            <Volume2 size={18} className={isPlaying ? 'animate-bounce' : ''} />
          </div>
          <div>
            <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <span>Guide Vocal Agricole Terrain</span>
              <Sparkles size={11} className="text-amber-500" />
            </h5>
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Lecture audio du diagnostic & consignes de traitement
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="px-2.5 py-1 bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-emerald-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <span>{currentLangObj.flag}</span>
            <span>{currentLangObj.label}</span>
            <ChevronDown size={12} className="opacity-70" />
          </button>

          <AnimatePresence>
            {showLanguageDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute right-0 top-full mt-1 bg-white dark:bg-[#141d18] border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl py-1 z-30 min-w-[130px]"
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLanguageDropdown(false);
                      if (isPlaying) {
                        handleStop();
                      }
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer ${
                      language === l.code ? 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-white/5' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Audio Waveform visualization while playing */}
      {isPlaying && (
        <div className="flex items-center justify-center gap-1 h-6 py-1">
          {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 35, 85].map((h, idx) => (
            <motion.div
              key={idx}
              animate={{ height: [`${Math.max(20, h * 0.3)}%`, `${h}%`, `${Math.max(20, h * 0.3)}%`] }}
              transition={{
                repeat: Infinity,
                duration: 0.6 + (idx % 4) * 0.15,
                ease: 'easeInOut',
              }}
              className="w-1 bg-emerald-600 dark:bg-emerald-400 rounded-full"
            />
          ))}
        </div>
      )}

      {/* Playback Controls & Speed */}
      <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 dark:border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause' : isPaused ? 'Reprendre' : 'Écouter'}</span>
          </button>

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Arrêter"
            >
              <Square size={14} />
            </button>
          )}
        </div>

        {/* Speed toggle */}
        <div className="flex items-center gap-1 bg-white/90 dark:bg-black/40 p-1 rounded-xl border border-emerald-200 dark:border-white/10 shadow-2xs">
          {[0.8, 1.0, 1.2].map((s) => (
            <button
              key={s}
              onClick={() => setRate(s)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                rate === s
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AudioGuidePlayer;
