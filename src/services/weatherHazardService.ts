export interface CropHazardProfile {
  frostOffset: number;
  heatOffset: number;
  windOffset: number;
  cryptoSensitive: boolean;
  dustSensitive: boolean;
}

export const CROP_HAZARD_PROFILES: Record<string, CropHazardProfile> = {
  myrtille: { frostOffset: -2, heatOffset: -3, windOffset: -5, cryptoSensitive: true, dustSensitive: true },
  blueberry: { frostOffset: -2, heatOffset: -3, windOffset: -5, cryptoSensitive: true, dustSensitive: true },
  fraise: { frostOffset: -2, heatOffset: -2, windOffset: -5, cryptoSensitive: true, dustSensitive: true },
  framboise: { frostOffset: -1, heatOffset: -3, windOffset: -10, cryptoSensitive: true, dustSensitive: true },
  mure: { frostOffset: -1, heatOffset: -2, windOffset: -8, cryptoSensitive: true, dustSensitive: false },
  agrumes: { frostOffset: -2, heatOffset: 0, windOffset: 0, cryptoSensitive: false, dustSensitive: true },
  citrus: { frostOffset: -2, heatOffset: 0, windOffset: 0, cryptoSensitive: false, dustSensitive: true },
  melon: { frostOffset: -3, heatOffset: -2, windOffset: -5, cryptoSensitive: true, dustSensitive: false },
  olivier: { frostOffset: -2, heatOffset: 2, windOffset: 5, cryptoSensitive: false, dustSensitive: false },
  amandier: { frostOffset: -1, heatOffset: 1, windOffset: 0, cryptoSensitive: false, dustSensitive: false },
  abricot: { frostOffset: -2, heatOffset: -1, windOffset: 0, cryptoSensitive: true, dustSensitive: false },
  peche: { frostOffset: -2, heatOffset: -1, windOffset: 0, cryptoSensitive: true, dustSensitive: false },
  prune: { frostOffset: -2, heatOffset: -1, windOffset: 0, cryptoSensitive: true, dustSensitive: false },
};

export const DEFAULT_CROP_PROFILE: CropHazardProfile = {
  frostOffset: 0,
  heatOffset: 0,
  windOffset: 0,
  cryptoSensitive: false,
  dustSensitive: false,
};

export function getCropProfile(cultureName?: string): CropHazardProfile {
  if (!cultureName) return DEFAULT_CROP_PROFILE;
  const normalized = cultureName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CROP_HAZARD_PROFILES[normalized] || DEFAULT_CROP_PROFILE;
}

export interface DayForecastData {
  date: string;
  tempMax?: number;
  tempMin?: number;
  tempAvg?: number;
  windSpeed?: number;
  precipQty?: number;
  humidity?: number;
  et0?: number;
  dust?: number;
  condition?: string;
}

export interface AgriculturalHazard {
  hazard: "frost" | "heatwave" | "wind" | "rain" | "dust" | "humidity";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  dedupeKey: string;
}

const BASE_FROST = 0;
const BASE_HEAT = 35;
const BASE_WIND = 35;
const RAIN_WARN = 30;
const RAIN_CRIT = 50;
const DUST_WARN = 100;
const DUST_CRIT = 300;
const HUMIDITY_THRESH = 80;
const TEMP_CRYPTO_THRESH = 15;

function formatDateLabel(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export function computeAgriculturalHazards(
  forecast: DayForecastData[],
  siteName: string,
  culture?: string,
  maxDays = 7
): AgriculturalHazard[] {
  if (!forecast || forecast.length === 0) return [];
  const profile = getCropProfile(culture);
  const cropLabel = culture || "cultures";
  const todayStr = new Date().toISOString().substring(0, 10);
  
  const upcoming = forecast
    .filter((d) => d.date && d.date >= todayStr)
    .slice(0, maxDays);

  if (upcoming.length === 0) return [];

  const hazards: AgriculturalHazard[] = [];

  // 1. Frost
  const frostThresh = BASE_FROST + profile.frostOffset;
  const frostDays = upcoming.filter((d) => (d.tempMin ?? 99) <= frostThresh);
  if (frostDays.length > 0) {
    const minTemp = Math.min(...frostDays.map((d) => d.tempMin ?? 99));
    const severity = minTemp <= -2 || minTemp <= 0 ? "critical" : "warning";
    const firstDay = frostDays[0];
    hazards.push({
      hazard: "frost",
      severity,
      title: `Risque de gel · ${siteName}`,
      description: `${cropLabel}: minimale prévue ${minTemp.toFixed(1)}°C (${formatDateLabel(firstDay.date)}). Prévoir bâchage/aspersion antigel et limiter les irrigations en fin de journée.`,
      startsAt: firstDay.date,
      endsAt: frostDays[frostDays.length - 1].date,
      dedupeKey: `frost|${siteName}|${culture || "all"}|${firstDay.date}`,
    });
  }

  // 2. Heatwave
  const heatThresh = BASE_HEAT + profile.heatOffset;
  const heatDays = upcoming.filter((d) => (d.tempMax ?? 0) >= heatThresh);
  if (heatDays.length > 0) {
    const maxTemp = Math.max(...heatDays.map((d) => d.tempMax ?? 0));
    const severity = maxTemp >= 42 || maxTemp >= 38 ? "critical" : "warning";
    const firstDay = heatDays[0];
    hazards.push({
      hazard: "heatwave",
      severity,
      title: `Vague de chaleur · ${siteName}`,
      description: `${cropLabel}: pic prévu ${maxTemp.toFixed(1)}°C (${formatDateLabel(firstDay.date)}). Renforcer irrigation, ombrer si possible, éviter pulvérisations en heures chaudes.`,
      startsAt: firstDay.date,
      endsAt: heatDays[heatDays.length - 1].date,
      dedupeKey: `heatwave|${siteName}|${culture || "all"}|${firstDay.date}`,
    });
  }

  // 3. High Wind
  const windThresh = BASE_WIND + profile.windOffset;
  const windDays = upcoming.filter((d) => (d.windSpeed ?? 0) >= windThresh);
  if (windDays.length > 0) {
    const maxWind = Math.max(...windDays.map((d) => d.windSpeed ?? 0));
    const severity = maxWind >= 60 ? "critical" : maxWind >= 45 ? "warning" : "info";
    const firstDay = windDays[0];
    hazards.push({
      hazard: "wind",
      severity,
      title: `Vent fort · ${siteName}`,
      description: `${cropLabel}: rafales jusqu'à ${maxWind.toFixed(0)} km/h (${formatDateLabel(firstDay.date)}). Reporter pulvérisations, sécuriser filets et bâches, surveiller la casse de branches.`,
      startsAt: firstDay.date,
      endsAt: windDays[windDays.length - 1].date,
      dedupeKey: `wind|${siteName}|${culture || "all"}|${firstDay.date}`,
    });
  }

  // 4. Heavy Rain
  const rainDays = upcoming.filter((d) => (d.precipQty ?? 0) >= RAIN_WARN);
  if (rainDays.length > 0) {
    const maxRain = Math.max(...rainDays.map((d) => d.precipQty ?? 0));
    const severity = maxRain >= RAIN_CRIT ? "critical" : "warning";
    const firstDay = rainDays[0];
    hazards.push({
      hazard: "rain",
      severity,
      title: `Pluies importantes · ${siteName}`,
      description: `${cropLabel}: cumul ${maxRain.toFixed(0)} mm prévu (${formatDateLabel(firstDay.date)}). Vérifier drainage, suspendre fertirrigation, surveiller le risque de pourriture des fruits/racines.`,
      startsAt: firstDay.date,
      endsAt: rainDays[rainDays.length - 1].date,
      dedupeKey: `rain|${siteName}|${culture || "all"}|${firstDay.date}`,
    });
  }

  // 5. Sand / Dust Storm
  const dustWarnThresh = profile.dustSensitive ? DUST_WARN * 0.7 : DUST_WARN;
  const dustCritThresh = profile.dustSensitive ? DUST_CRIT * 0.7 : DUST_CRIT;
  const dustDays = upcoming.filter((d) => (d.dust ?? 0) >= dustWarnThresh);
  if (dustDays.length > 0) {
    const maxDust = Math.max(...dustDays.map((d) => d.dust ?? 0));
    const severity = maxDust >= dustCritThresh ? "critical" : "warning";
    const firstDay = dustDays[0];
    hazards.push({
      hazard: "dust",
      severity,
      title: `Vent de sable / poussière · ${siteName}`,
      description: `${cropLabel}: PM dust prévue jusqu'à ${maxDust.toFixed(0)} µg/m³ (${formatDateLabel(firstDay.date)}). Éviter pulvérisations foliaires, rincer les feuillages exposés, masquer les ouvriers en plein champ.`,
      startsAt: firstDay.date,
      endsAt: dustDays[dustDays.length - 1].date,
      dedupeKey: `dust|${siteName}|${culture || "all"}|${firstDay.date}`,
    });
  }

  // 6. Cryptogamic Risk (High Humidity + Warm Temp)
  if (profile.cryptoSensitive) {
    const cryptoDays = upcoming.filter(
      (d) => (d.humidity ?? 0) >= HUMIDITY_THRESH && (d.tempMax ?? 0) >= TEMP_CRYPTO_THRESH
    );
    if (cryptoDays.length >= 2) {
      hazards.push({
        hazard: "humidity",
        severity: "warning",
        title: `Risque cryptogamique · ${siteName}`,
        description: `${cropLabel}: humidité ≥ ${HUMIDITY_THRESH}% sur ${cryptoDays.length} jours avec température favorable. Surveiller mildiou, botrytis, oïdium. Préparer programme préventif.`,
        startsAt: cryptoDays[0].date,
        endsAt: cryptoDays[cryptoDays.length - 1].date,
        dedupeKey: `humidity|${siteName}|${culture || "all"}|${cryptoDays[0].date}`,
      });
    }
  }

  return hazards;
}

export async function fetchDustData(lat: number, lng: number): Promise<Record<string, number>> {
  const dailyDustMap: Record<string, number> = {};
  try {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=dust&forecast_days=7&domains=cams_global&timezone=auto`
    );
    if (!res.ok) return dailyDustMap;
    const json = await res.json();
    const times: string[] = json?.hourly?.time || [];
    const dustValues: number[] = json?.hourly?.dust || [];

    const dateAccumulator: Record<string, { sum: number; count: number }> = {};
    for (let i = 0; i < times.length; i++) {
      const dateStr = times[i]?.substring(0, 10);
      const val = dustValues[i];
      if (!dateStr || typeof val !== "number" || Number.isNaN(val)) continue;
      if (!dateAccumulator[dateStr]) dateAccumulator[dateStr] = { sum: 0, count: 0 };
      dateAccumulator[dateStr].sum += val;
      dateAccumulator[dateStr].count += 1;
    }

    for (const d in dateAccumulator) {
      if (dateAccumulator[d].count > 0) {
        dailyDustMap[d] = dateAccumulator[d].sum / dateAccumulator[d].count;
      }
    }
  } catch (err) {
    console.warn("Error fetching dust data from CAMS Global:", err);
  }
  return dailyDustMap;
}
