import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CloudRain,
  Wind,
  Sun,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Download,
  Info,
  ChevronRight,
  Sprout,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { WeatherData } from '../types';

interface SmartWeatherCalendarProps {
  weather?: WeatherData | null;
  language?: 'fr' | 'en' | 'ar' | 'es';
  isLightMode?: boolean;
  onAddReminder?: (cropName: string, eventName: string, date: string) => void;
}

interface CropCycle {
  id: string;
  name: string;
  category: 'fruits' | 'cereals' | 'vegetables';
  icon: string;
  sowingMonths: number[]; // 1-12
  floweringMonths: number[];
  harvestMonths: number[];
  optimalTemp: string;
  waterNeeds: 'low' | 'medium' | 'high';
  sprayingAdvisory: string;
  nextCriticalDate: string;
  nextMilestone: string;
}

const CROP_CYCLES: CropCycle[] = [
  {
    id: 'olive',
    name: "Olivier (Picholine / Arbequina)",
    category: 'fruits',
    icon: "🫒",
    sowingMonths: [3, 4, 10, 11],
    floweringMonths: [4, 5],
    harvestMonths: [10, 11, 12, 1],
    optimalTemp: "18 - 28°C",
    waterNeeds: 'low',
    sprayingAdvisory: "Traiter contre la mouche de l'olive (Bactrocera) et l'œil de paon avant les pluies d'automne.",
    nextCriticalDate: "15 Octobre",
    nextMilestone: "Début de véraison & récolte olives de table"
  },
  {
    id: 'wheat',
    name: "Blé dur & Blé tendre",
    category: 'cereals',
    icon: "🌾",
    sowingMonths: [10, 11, 12],
    floweringMonths: [3, 4],
    harvestMonths: [5, 6, 7],
    optimalTemp: "15 - 22°C",
    waterNeeds: 'medium',
    sprayingAdvisory: "Surveiller la rouille brune et septoriose si humidité > 80%. Désherbage de post-levée.",
    nextCriticalDate: "1er Novembre",
    nextMilestone: "Période optimale de semis d'automne"
  },
  {
    id: 'tomato',
    name: "Tomate plein champ & abris",
    category: 'vegetables',
    icon: "🍅",
    sowingMonths: [2, 3, 7, 8],
    floweringMonths: [4, 5, 9, 10],
    harvestMonths: [5, 6, 7, 8, 10, 11],
    optimalTemp: "20 - 27°C",
    waterNeeds: 'high',
    sprayingAdvisory: "Alerte Mildiou si pluie imminente. Traitement préventif cuivreux conseillé.",
    nextCriticalDate: "10 Octobre",
    nextMilestone: "Pic de récolte sous abri & taille d'entretien"
  },
  {
    id: 'citrus',
    name: "Agrumes (Orangers / Citronniers)",
    category: 'fruits',
    icon: "🍊",
    sowingMonths: [3, 4],
    floweringMonths: [3, 4, 5],
    harvestMonths: [11, 12, 1, 2, 3],
    optimalTemp: "22 - 30°C",
    waterNeeds: 'medium',
    sprayingAdvisory: "Contrôle des pucerons et cochenilles lors des jeunes pousses.",
    nextCriticalDate: "20 Novembre",
    nextMilestone: "Démarrage récolte Navel et clémentines"
  },
  {
    id: 'dates',
    name: "Palmier Dattier (Medjool / Deglet)",
    category: 'fruits',
    icon: "🌴",
    sowingMonths: [3, 4],
    floweringMonths: [3, 4],
    harvestMonths: [9, 10, 11],
    optimalTemp: "28 - 38°C",
    waterNeeds: 'low',
    sprayingAdvisory: "Protection des régimes contre la pyrale des dattes et ensachage avant maturation.",
    nextCriticalDate: "25 Septembre",
    nextMilestone: "Pose des filets de protection & récolte"
  },
  {
    id: 'potato',
    name: "Pomme de terre (Primeur & Saison)",
    category: 'vegetables',
    icon: "🥔",
    sowingMonths: [1, 2, 8, 9],
    floweringMonths: [3, 4, 10],
    harvestMonths: [4, 5, 11, 12],
    optimalTemp: "15 - 20°C",
    waterNeeds: 'medium',
    sprayingAdvisory: "Surveiller mildiou (Phytophthora) et doryphore. Buttage régulier.",
    nextCriticalDate: "5 Novembre",
    nextMilestone: "Récolte d'arrière-saison & stockage"
  }
];

export const SmartWeatherCalendar: React.FC<SmartWeatherCalendarProps> = ({
  weather,
  language = 'fr',
  isLightMode,
  onAddReminder
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'spray' | 'calendar'>('spray');
  const [selectedCrop, setSelectedCrop] = useState<CropCycle>(CROP_CYCLES[0]);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1; // 1-12

  // Download ICS Calendar event
  const handleExportICS = (crop: CropCycle) => {
    const title = `AgriScan AI : ${crop.name} - ${crop.nextMilestone}`;
    const description = `${crop.sprayingAdvisory}\nTempérature optimale: ${crop.optimalTemp}\nBesoin en eau: ${crop.waterNeeds}`;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AgriScan AI//FR",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@agriscan.ai`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(startDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agriscan-${crop.id}-rappel.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setReminderToast(`Rappel calendrier téléchargé pour ${crop.name}`);
    setTimeout(() => setReminderToast(null), 3000);

    if (onAddReminder) {
      onAddReminder(crop.name, crop.nextMilestone, crop.nextCriticalDate);
    }
  };

  // Spraying conditions calculation
  const windSpeed = weather?.windSpeed ?? 12; // km/h
  const rainProb = weather?.precipitation ?? 10; // %
  const uvIndex = weather?.uvIndex ?? 6;
  const humidity = weather?.humidity ?? 65;

  const isSprayingOptimal = windSpeed < 19 && rainProb < 30;
  const isSprayingMarginal = (windSpeed >= 19 && windSpeed <= 25) || (rainProb >= 30 && rainProb <= 50);

  // 7-day mock / real forecast derived
  const forecast7Days = [
    { day: "Aujourd'hui", temp: Math.round(weather?.temperature || 24), rain: rainProb, wind: windSpeed, condition: "Partiellement couvert", sprayOk: isSprayingOptimal },
    { day: "Demain", temp: Math.round((weather?.temperature || 24) + 1), rain: 15, wind: 14, condition: "Ensoleillé", sprayOk: true },
    { day: "J+2", temp: Math.round((weather?.temperature || 24) - 1), rain: 45, wind: 22, condition: "Risque averses", sprayOk: false },
    { day: "J+3", temp: Math.round((weather?.temperature || 24) - 2), rain: 60, wind: 26, condition: "Pluie modérée", sprayOk: false },
    { day: "J+4", temp: Math.round(weather?.temperature || 24), rain: 20, wind: 12, condition: "Éclaircies", sprayOk: true },
    { day: "J+5", temp: Math.round((weather?.temperature || 24) + 2), rain: 5, wind: 9, condition: "Idéal pulvérisation", sprayOk: true },
    { day: "J+6", temp: Math.round((weather?.temperature || 24) + 1), rain: 10, wind: 11, condition: "Clair", sprayOk: true },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs">
        <button
          onClick={() => setActiveSubTab('spray')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'spray'
              ? 'bg-white dark:bg-emerald-500 text-emerald-800 dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wind size={15} />
          <span>Créneau Pulvérisation 7 Jours</span>
        </button>
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'calendar'
              ? 'bg-white dark:bg-emerald-500 text-emerald-800 dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar size={15} />
          <span>Calendrier Semis & Récoltes</span>
        </button>
      </div>

      {reminderToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span>{reminderToast}</span>
        </motion.div>
      )}

      {/* SUBTAB 1: SPRAYING & 7-DAY AGRI-METEO */}
      {activeSubTab === 'spray' && (
        <div className="space-y-4">
          {/* Main Spraying Advisory Gauge Card */}
          <div className={`p-5 rounded-3xl border shadow-sm transition-all ${
            isSprayingOptimal
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/40 border-emerald-200 text-slate-900 dark:bg-gradient-to-br dark:from-emerald-950/80 dark:to-[#0d1c15] dark:border-emerald-500/40 dark:text-white'
              : isSprayingMarginal
              ? 'bg-gradient-to-br from-amber-50 via-yellow-50/60 to-amber-100/40 border-amber-200 text-slate-900 dark:bg-gradient-to-br dark:from-amber-950/70 dark:to-[#1c180e] dark:border-amber-500/40 dark:text-white'
              : 'bg-gradient-to-br from-rose-50 via-red-50/60 to-rose-100/40 border-rose-200 text-slate-900 dark:bg-gradient-to-br dark:from-red-950/70 dark:to-[#1c0e0e] dark:border-red-500/40 dark:text-white'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isSprayingOptimal
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                    : isSprayingMarginal
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                    : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40'
                }`}>
                  {isSprayingOptimal ? (
                    <>
                      <CheckCircle2 size={12} /> Conditions Optimales de Traitement
                    </>
                  ) : isSprayingMarginal ? (
                    <>
                      <AlertTriangle size={12} /> Traitement Sous Réserve
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={12} /> Dérive Forte / Pluie : Déconseillé
                    </>
                  )}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                  {isSprayingOptimal
                    ? "Fenêtre de pulvérisation ouverte"
                    : isSprayingMarginal
                    ? "Vent modéré : surveiller l'évaporation"
                    : "Suspension des traitements recommandée"}
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300/80 mt-1 max-w-md leading-relaxed">
                  {isSprayingOptimal
                    ? `Vent à ${windSpeed} km/h (< 19 km/h) et risque de lessivage à ${rainProb}%. Excellente adhérence foliaire.`
                    : isSprayingMarginal
                    ? `Vent à ${windSpeed} km/h : utiliser des buses antidérive et traiter tôt le matin.`
                    : `Vent excessif (${windSpeed} km/h > 19 km/h) ou risque de pluie (${rainProb}%) entraînant dérive et lessivage du produit.`}
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-white/90 dark:bg-white/10 flex flex-col items-center justify-center shrink-0 border border-emerald-200 dark:border-white/10 shadow-xs">
                <Wind size={22} className={isSprayingOptimal ? "text-emerald-600 dark:text-emerald-400" : isSprayingMarginal ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"} />
                <span className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5">{windSpeed} km/h</span>
              </div>
            </div>

            {/* Quick Agro Weather Indicators */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-emerald-200/60 dark:border-white/10 text-center">
              <div className="p-2.5 bg-white/90 dark:bg-white/5 rounded-xl border border-emerald-100 dark:border-transparent shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                  <CloudRain size={12} className="text-blue-500 dark:text-blue-400" /> Lessivage
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{rainProb}%</p>
              </div>

              <div className="p-2.5 bg-white/90 dark:bg-white/5 rounded-xl border border-emerald-100 dark:border-transparent shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                  <Droplets size={12} className="text-teal-600 dark:text-teal-400" /> Humidité Fol.
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{humidity}%</p>
              </div>

              <div className="p-2.5 bg-white/90 dark:bg-white/5 rounded-xl border border-emerald-100 dark:border-transparent shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                  <Sun size={12} className="text-amber-500 dark:text-amber-400" /> Indice UV
                </div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{uvIndex} / 11</p>
              </div>
            </div>
          </div>

          {/* 7-Day Agricultural Forecast Matrix */}
          <div className="p-4 bg-white dark:bg-[#121915] rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Prévisions 7 Jours & Pulvérisation</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold">Agronomie de précision</span>
            </h4>

            <div className="space-y-2">
              {forecast7Days.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 dark:border-transparent transition-colors text-xs"
                >
                  <div className="w-24">
                    <span className="font-bold text-slate-900 dark:text-slate-200 block">{item.day}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">{item.condition}</span>
                  </div>

                  <div className="flex items-center gap-4 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Temp</span>
                      <span className="font-black text-slate-900 dark:text-slate-100">{item.temp}°C</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Pluie</span>
                      <span className="font-black text-blue-600 dark:text-blue-400">{item.rain}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Vent</span>
                      <span className="font-black text-slate-700 dark:text-slate-300">{item.wind} km/h</span>
                    </div>
                  </div>

                  <div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 ${
                      item.sprayOk
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                        : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
                    }`}>
                      {item.sprayOk ? 'Optimal' : 'Éviter'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: HARVEST & SOWING CALENDAR */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-4">
          {/* Crop Chips Selection */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CROP_CYCLES.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCrop.id === crop.id
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm scale-[1.02]'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:border-white/10'
                }`}
              >
                <span>{crop.icon}</span>
                <span>{crop.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Selected Crop Lifecycle Card */}
          <div className="p-5 bg-white border border-slate-200 shadow-sm dark:bg-gradient-to-br dark:from-[#131d17] dark:to-[#0c1410] dark:border-emerald-500/30 rounded-3xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCrop.icon}</span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedCrop.name}</h3>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                      Température idéale : {selectedCrop.optimalTemp} • Eau : {selectedCrop.waterNeeds === 'high' ? 'Élevé' : selectedCrop.waterNeeds === 'medium' ? 'Modéré' : 'Sobre'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExportICS(selectedCrop)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                title="Ajouter au calendrier Google / Apple"
              >
                <Bell size={13} />
                <span>Rappel ICS</span>
              </button>
            </div>

            {/* Next Critical Milestone Banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Prochaine Échéance ({selectedCrop.nextCriticalDate})</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">{selectedCrop.nextMilestone}</span>
                </div>
              </div>
            </div>

            {/* 12-Month Phenological Heatmap */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <span>Cycle Phénologique Annuel</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Mois actuel : {currentMonth}</span>
              </div>

              <div className="grid grid-cols-12 gap-1 text-center">
                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, idx) => {
                  const mNum = idx + 1;
                  const isSow = selectedCrop.sowingMonths.includes(mNum);
                  const isFlower = selectedCrop.floweringMonths.includes(mNum);
                  const isHarvest = selectedCrop.harvestMonths.includes(mNum);
                  const isCurrent = currentMonth === mNum;

                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isCurrent ? 'ring-2 ring-emerald-600 dark:ring-emerald-400 shadow-xs' : ''
                      } ${
                        isHarvest
                          ? 'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-500/30 dark:text-amber-300 dark:border-transparent font-black'
                          : isFlower
                          ? 'bg-purple-100 text-purple-900 border border-purple-200 dark:bg-purple-500/30 dark:text-purple-300 dark:border-transparent font-bold'
                          : isSow
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/30 dark:text-emerald-300 dark:border-transparent font-bold'
                          : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{m}</span>
                      <span className="text-[8px] mt-0.5">
                        {isHarvest ? '🌾' : isFlower ? '🌸' : isSow ? '🌱' : '•'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">🌱 Semis</span>
                <span className="flex items-center gap-1">🌸 Floraison</span>
                <span className="flex items-center gap-1">🌾 Récolte</span>
              </div>
            </div>

            {/* Treatment & Field Advisory */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 text-slate-800 dark:bg-white/5 dark:border-white/5 dark:text-slate-300 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Conseil Phytosanitaire & Protection :
              </span>
              <p className="leading-relaxed">
                {selectedCrop.sprayingAdvisory}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartWeatherCalendar;
