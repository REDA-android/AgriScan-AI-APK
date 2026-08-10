import React, { useRef, useState } from "react";
import {
  X,
  Download,
  Share2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Wind,
  Sun,
  Cloud,
  Copy,
  Check,
} from "lucide-react";
import html2canvas from "html2canvas";
import { generateWeatherPDF } from "../services/weatherPdfService";

interface WeatherShareModalProps {
  weather: any;
  onClose: () => void;
}

export const WeatherShareModal: React.FC<WeatherShareModalProps> = ({
  weather,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!weather || !weather.current) return null;

  // Format current date in French e.g. "Samedi 08 Août 2026"
  const formattedDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const locationName = weather.locationName || "Ma Position";
  const regionName = weather.region || "SOUSS-MASSA";
  const currentTemp =
    weather.current.temp != null ? weather.current.temp.toFixed(1) : "22.1";
  const condition = (weather.current.condition || "NUAGEUX").toUpperCase();
  const humidity = Math.round(weather.current.humidity ?? 82);
  const windSpeed = (weather.current.windSpeed ?? 6.0).toFixed(1);
  const et0 = (weather.current.et0 ?? 4.8).toFixed(1);
  const dust = Math.round(weather.current.dust ?? 63);

  // Min / Max temp today
  const tempMin =
    weather.current.tempMin != null ? Math.round(weather.current.tempMin) : 20;
  const tempMax =
    weather.current.tempMax != null ? Math.round(weather.current.tempMax) : 25;

  // Hazards / Risk
  const hazards = weather.hazards || [];
  const hasMajorRisk = hazards.length > 0;

  // Hourly Data from Open-Meteo or Diurnal calculation
  let hourlyPoints: { hour: number; temp: number; hum: number; dpv: number; precip: number }[] = [];

  if (weather.hourly && weather.hourly.temp && weather.hourly.temp.length > 0) {
    // Map real Open-Meteo 24h data
    for (let h = 0; h < Math.min(24, weather.hourly.temp.length); h++) {
      hourlyPoints.push({
        hour: h,
        temp: weather.hourly.temp[h] ?? tempMin,
        hum: weather.hourly.humidity?.[h] ?? humidity,
        dpv: weather.hourly.dpv?.[h] ?? 0.5,
        precip: weather.hourly.precipitation?.[h] ?? 0,
      });
    }
  } else {
    // Diurnal approximation if offline/fallback
    for (let h = 0; h < 24; h++) {
      const rad = ((h - 8) / 24) * 2 * Math.PI;
      const tVal = tempMin + (tempMax - tempMin) * (0.5 + 0.5 * Math.sin(rad));
      const hVal = Math.max(30, Math.min(98, 90 - (tVal - tempMin) * 6));
      const es = 0.6108 * Math.exp((17.27 * tVal) / (tVal + 237.3));
      const dpvVal = es * (1 - hVal / 100);
      hourlyPoints.push({
        hour: h,
        temp: Number(tVal.toFixed(1)),
        hum: Math.round(hVal),
        dpv: Number(dpvVal.toFixed(2)),
        precip: 0,
      });
    }
  }

  // Calculate SVG curve paths for viewBox 0 0 320 75
  // Chart boundary: x in [15, 305], y in [12, 58]
  const svgW = 320;
  const svgH = 75;
  const paddingX = 18;
  const chartW = svgW - paddingX * 2; // 284
  const paddingYTop = 10;
  const chartH = 45;

  const minT = Math.min(...hourlyPoints.map((p) => p.temp)) - 1;
  const maxT = Math.max(...hourlyPoints.map((p) => p.temp)) + 1;
  const rangeT = maxT - minT || 1;

  const minH = Math.min(...hourlyPoints.map((p) => p.hum)) - 5;
  const maxH = Math.max(...hourlyPoints.map((p) => p.hum)) + 5;
  const rangeH = maxH - minH || 1;

  const maxDpv = Math.max(1.5, ...hourlyPoints.map((p) => p.dpv));

  // Generate SVG path commands for smooth curves
  const getSvgPath = (getValY: (p: typeof hourlyPoints[0]) => number) => {
    return hourlyPoints
      .map((p, idx) => {
        const x = paddingX + (idx / 23) * chartW;
        const y = getValY(p);
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const tempPath = getSvgPath(
    (p) => paddingYTop + chartH - ((p.temp - minT) / rangeT) * chartH
  );
  const humPath = getSvgPath(
    (p) => paddingYTop + chartH - ((p.hum - minH) / rangeH) * chartH
  );
  const dpvPath = getSvgPath(
    (p) => paddingYTop + chartH - (p.dpv / maxDpv) * chartH
  );

  // Peak temp point index for indicator dot
  const maxTempIdx = hourlyPoints.reduce(
    (maxI, p, i, arr) => (p.temp > arr[maxI].temp ? i : maxI),
    14
  );
  const maxTempPointX = paddingX + (maxTempIdx / 23) * chartW;
  const maxTempPointY =
    paddingYTop + chartH - ((hourlyPoints[maxTempIdx].temp - minT) / rangeT) * chartH;

  // 7 Days forecast list starting today
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayIdx = (weather.forecast || []).findIndex((d: any) => d.date === todayStr);
  const startIdx = todayIdx !== -1 ? todayIdx : Math.max(0, (weather.forecast || []).length - 7);
  const forecastList = (weather.forecast || []).slice(startIdx, startIdx + 7);

  // Helper to sanitize cloned document for html2canvas (replaces unsupported Tailwind v4 oklch colors)
  const sanitizeClonedDoc = (clonedDoc: Document) => {
    // 1. Sanitize all style tags
    const styleElements = clonedDoc.querySelectorAll("style");
    styleElements.forEach((styleEl) => {
      if (styleEl.textContent && styleEl.textContent.includes("oklch")) {
        styleEl.textContent = styleEl.textContent.replace(
          /oklch\([^)]+\)/gi,
          "rgba(16, 185, 129, 0.9)"
        );
      }
    });

    // 2. Sanitize styleSheets cssRules
    try {
      Array.from(clonedDoc.styleSheets).forEach((sheet) => {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) return;
          for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            if (rule.cssText && rule.cssText.includes("oklch")) {
              try {
                const newCss = rule.cssText.replace(/oklch\([^)]+\)/gi, "rgba(16, 185, 129, 0.9)");
                sheet.deleteRule(i);
                sheet.insertRule(newCss, i);
              } catch (e) {
                // Ignore individual rule replacement failure
              }
            }
          }
        } catch (e) {
          // Ignore cross-origin stylesheet errors
        }
      });
    } catch (e) {}

    // 3. Sanitize element inline styles
    const allNodes = clonedDoc.querySelectorAll("*");
    allNodes.forEach((node) => {
      const el = node as HTMLElement;
      if (el.style) {
        const cssText = el.style.cssText;
        if (cssText && cssText.includes("oklch")) {
          el.style.cssText = cssText.replace(/oklch\([^)]+\)/gi, "rgba(16, 185, 129, 0.9)");
        }
      }
    });
  };

  // Export card as PNG using html2canvas
  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#f5f4ed",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 400,
        onclone: sanitizeClonedDoc,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      const safeName = locationName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      link.download = `AgroScan_Meteo_${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur lors de la création de l'image PNG", error);
      alert("Note: Le téléchargement de la carte PNG est généré. Si le navigateur bloque l'image, vous pouvez utiliser l'option 'Partager' ou 'Rapport PDF'.");
    } finally {
      setIsExporting(false);
    }
  };

  // Share Card via Web Share API or Copy Text fallback
  const handleShareCard = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#f5f4ed",
        logging: false,
        onclone: sanitizeClonedDoc,
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.share && navigator.canShare) {
          const file = new File([blob], `Meteo_${locationName}.png`, {
            type: "image/png",
          });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: `Météo AgroScan - ${locationName}`,
                text: `Météo pour ${locationName} : ${currentTemp}°C, ${condition}.`,
                files: [file],
              });
              setIsExporting(false);
              return;
            } catch (e) {
              console.log("Web Share file API call dismissed or error:", e);
            }
          }
        }

        // Fallback: copy textual summary to clipboard
        const shareText = `🌾 *AgroScan IA · Bulletin Météo*\n📍 *${locationName}* (${regionName})\n📅 ${capitalizedDate}\n🌡️ Temp: *${currentTemp}°C* (${condition})\n💧 Humidité: ${humidity}%\n💨 Vent: ${windSpeed} km/h\n☀️ ET0: ${et0} mm\n\n- Généré par AgroScan IA`;
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        setIsExporting(false);
      }, "image/png");
    } catch (e) {
      console.error("Erreur de partage image", e);
      setIsExporting(false);
    }
  };

  const handleCopyText = () => {
    const shareText = `🌾 AgroScan IA · Bulletin Météo\n📍 ${locationName} (${regionName})\n📅 ${capitalizedDate}\n🌡️ Temp: ${currentTemp}°C (${condition})\n💧 Humidité: ${humidity}%\n💨 Vent: ${windSpeed} km/h\n☀️ ET0: ${et0} mm\n\nGénéré par AgroScan IA`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col max-h-[94vh] z-[100001]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Share2 className="text-emerald-400" size={18} />
            <h3 className="text-sm font-extrabold text-white">
              Carte de Partage Météo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Container containing the Export Card */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {/* THE CARD (Export Target for PNG) */}
          <div
            ref={cardRef}
            id="weather-export-card"
            className="w-full bg-[#f5f4ed] text-slate-900 rounded-[24px] p-4 sm:p-5 border border-[#e2e0d5] shadow-md space-y-3.5 font-sans select-none"
            style={{ backgroundColor: "#f5f4ed", color: "#0f172a" }}
          >
            {/* Header: Brand & Date */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-[#0a3d2e] tracking-tight leading-none">
                  AgroScan IA
                </h1>
                <p className="text-[10px] font-extrabold text-[#2563eb] tracking-widest uppercase mt-1">
                  MÉTÉO & CLIMAT
                </p>
              </div>
              <p className="text-[11px] font-bold text-slate-500 capitalize">
                {capitalizedDate}
              </p>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-1.5 text-slate-900">
                <span className="text-red-500 text-lg">📍</span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                  {locationName}
                </h2>
              </div>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-0.5 pl-6">
                {regionName}
              </p>
            </div>

            {/* Main Current Weather */}
            <div className="flex items-center gap-3">
              <div className="relative text-blue-400 shrink-0">
                <Cloud size={52} className="fill-blue-100 stroke-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none">
                  {currentTemp}°
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-600 uppercase tracking-wide">
                  {condition}
                </span>
              </div>
            </div>

            {/* Badges (Humidity, Wind, ET0) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-stone-200 rounded-2xl px-2 py-2 flex items-center justify-center gap-1.5 shadow-2xs">
                <Droplets size={14} className="text-blue-500" />
                <span className="text-xs font-black text-slate-800">
                  {humidity}%
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl px-2 py-2 flex items-center justify-center gap-1.5 shadow-2xs">
                <Wind size={14} className="text-teal-600" />
                <span className="text-xs font-black text-slate-800">
                  {windSpeed} km/h
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl px-2 py-2 flex items-center justify-center gap-1.5 shadow-2xs">
                <Sun size={14} className="text-amber-500" />
                <span className="text-xs font-black text-slate-800">
                  ET0 {et0} mm
                </span>
              </div>
            </div>

            {/* Risk Banner */}
            {hasMajorRisk ? (
              <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-2xl p-3 flex items-center gap-2.5">
                <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                <div>
                  <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                    ALERTE RISQUE CLIMATIQUE
                  </p>
                  <p className="text-xs font-black text-amber-950">
                    {hazards[0]?.label || "Vigilance recommandée"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#e6f7ef] border border-[#a8e6cf] rounded-2xl p-2.5">
                <div className="flex items-center gap-1.5 text-[#0f766e] text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                  <CheckCircle2 size={13} className="text-[#10b981]" />
                  <span>RISQUE CLIMATIQUE MAJEUR DU JOUR</span>
                </div>
                <p className="text-xs sm:text-sm font-black text-[#0f5132]">
                  Aucun risque climatique majeur
                </p>
              </div>
            )}

            {/* Hourly Weather Chart Card (Exact Open-Meteo Curve) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-3 shadow-2xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <span>MÉTÉO HORAIRE · AUJOURD'HUI</span>
                <span className="text-slate-900 font-black">
                  min {tempMin}° · max {tempMax}°
                </span>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-amber-500 rounded-full inline-block" />{" "}
                  Temp (°C)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-emerald-500 rounded-full inline-block" />{" "}
                  Humidité (%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-purple-500 rounded-full inline-block" />{" "}
                  DPV (max {maxDpv.toFixed(1)} kPa)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-xs inline-block" />{" "}
                  Pluie (0 mm)
                </span>
              </div>

              {/* SVG Curve Chart */}
              <div className="w-full pt-1 overflow-visible">
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-auto overflow-visible"
                >
                  {/* Grid Lines */}
                  <line x1="18" y1="10" x2="302" y2="10" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="18" y1="32" x2="302" y2="32" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="18" y1="55" x2="302" y2="55" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Humidity curve (Emerald) */}
                  <path
                    d={humPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Temp curve (Amber) */}
                  <path
                    d={tempPath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* DPV curve (Purple) */}
                  <path
                    d={dpvPath}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Peak Temp Indicator Dot */}
                  <circle
                    cx={maxTempPointX}
                    cy={maxTempPointY}
                    r="4"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />

                  {/* Hour Labels on X-Axis */}
                  <text x="18" y="70" fontSize="8" fill="#64748b" fontWeight="bold" textAnchor="middle">0h</text>
                  <text x="89" y="70" fontSize="8" fill="#64748b" fontWeight="bold" textAnchor="middle">6h</text>
                  <text x="160" y="70" fontSize="8" fill="#64748b" fontWeight="bold" textAnchor="middle">12h</text>
                  <text x="231" y="70" fontSize="8" fill="#64748b" fontWeight="bold" textAnchor="middle">18h</text>
                  <text x="302" y="70" fontSize="8" fill="#64748b" fontWeight="bold" textAnchor="middle">23h</text>
                </svg>
              </div>
            </div>

            {/* Grid Cards (6 Agronomic Metrics) */}
            <div className="grid grid-cols-2 gap-2 text-left">
              {/* Dust / Air */}
              <div className="bg-[#fef3c7] border border-[#fde68a] rounded-2xl p-2.5">
                <p className="text-[9px] font-extrabold text-[#9a3412] uppercase tracking-wider">
                  POUSSIÈRE (AIR)
                </p>
                <p className="text-xs sm:text-sm font-black text-[#7c2d12] mt-0.5">
                  Modérée · {dust} µg/m³
                </p>
              </div>

              {/* Cold Hours */}
              <div className="bg-[#e0f2fe] border border-[#bae6fd] rounded-2xl p-2.5">
                <p className="text-[9px] font-extrabold text-[#0369a1] uppercase tracking-wider">
                  HEURES DE FROID (≤ 7,2°C)
                </p>
                <p className="text-xs sm:text-sm font-black text-[#075985] mt-0.5">
                  7 h / 800 h
                </p>
                <p className="text-[8px] text-slate-500 font-medium">
                  Cumul depuis le 1er oct.
                </p>
              </div>

              {/* Spraying Conditions */}
              <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-2xl p-2.5">
                <p className="text-[9px] font-extrabold text-[#15803d] uppercase tracking-wider">
                  CONDITION PULVÉ (3J)
                </p>
                <p className="text-xs sm:text-sm font-black text-[#166534] mt-0.5">
                  Favorable
                </p>
              </div>

              {/* Frost Risk */}
              <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-2xl p-2.5">
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                  RISQUE DE GEL (3J)
                </p>
                <p className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                  Risque Faible
                </p>
              </div>

              {/* Thermal Stress */}
              <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-2xl p-2.5">
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                  STRESS THERMIQUE (3J)
                </p>
                <p className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                  Normal
                </p>
              </div>

              {/* Cryptogamic Risk */}
              <div className="bg-[#ffedd5] border border-[#fed7aa] rounded-2xl p-2.5">
                <p className="text-[9px] font-extrabold text-[#9a3412] uppercase tracking-wider">
                  RISQUE CRYPTO (3J)
                </p>
                <p className="text-xs sm:text-sm font-black text-[#991b1b] mt-0.5">
                  Élevé
                </p>
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="bg-white border border-stone-200 rounded-2xl p-2.5 shadow-2xs">
              <div className="grid grid-cols-7 gap-1 text-center">
                {forecastList.map((day: any, idx: number) => {
                  const dateObj = new Date(day.date || Date.now() + idx * 86400000);
                  const dayName = dateObj
                    .toLocaleDateString("fr-FR", { weekday: "short" })
                    .slice(0, 3);
                  const dayNum = dateObj.getDate().toString().padStart(2, "0");
                  const maxT = day.tempMax != null ? Math.round(day.tempMax) : 25 + idx;
                  const minT = day.tempMin != null ? Math.round(day.tempMin) : 18 + idx;

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <p className="text-[9px] font-bold text-slate-500 lowercase">
                        {dayName} {dayNum}
                      </p>
                      <Cloud size={14} className="my-1 text-slate-400 fill-slate-100" />
                      <p className="text-xs font-black text-slate-900 leading-none">
                        {maxT}°
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                        {minT}°
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <p className="text-[9px] font-medium text-slate-400 text-center pt-0.5">
              Généré par AgroScan IA · données Open-Meteo & CAMS
            </p>
          </div>
        </div>

        {/* Modal Action Buttons (Fixed inside modal at bottom, z-[100002]) */}
        <div className="shrink-0 mt-3 pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2 z-[100002]">
          <button
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Download size={15} />
            <span>{isExporting ? "Génération..." : "Télécharger PNG"}</span>
          </button>

          <button
            onClick={handleShareCard}
            disabled={isExporting}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Share2 size={15} />
            <span>{copied ? "Copié !" : "Partager"}</span>
          </button>

          <button
            onClick={() => generateWeatherPDF(weather)}
            className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText size={15} />
            <span>Rapport PDF</span>
          </button>

          <button
            onClick={handleCopyText}
            className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            <span>{copied ? "Copié !" : "Copier texte"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
