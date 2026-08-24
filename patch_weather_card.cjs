const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I will insert a useEffect in WeatherCard that fetches the precise daily data directly from Open-Meteo 
// if it's missing or to replace the approximation.

const replacement = `
  const [internalWeather, setInternalWeather] = useState(weather);
  
  useEffect(() => {
    let isMounted = true;
    async function fetchPreciseWeather() {
      if (!weather?.current?.temp) return;
      try {
        const lat = weather.location?.lat || 31.7917;
        const lng = weather.location?.lng || -7.0926;
        const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration,shortwave_radiation_sum,uv_index_max&hourly=relative_humidity_2m,vapour_pressure_deficit&past_days=31&forecast_days=16&timezone=auto\`;
        
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!isMounted) return;
        
        const daily = data.daily;
        const hourly = data.hourly;
        
        const forecastArray = daily.time.map((timeStr: string, index: number) => {
          // Calculate mean RH and max DPV from hourly data for this day
          const dayStartIdx = index * 24;
          const dayEndIdx = dayStartIdx + 24;
          const rhSlice = hourly.relative_humidity_2m.slice(dayStartIdx, dayEndIdx).filter((v: number) => v !== null);
          const dpvSlice = hourly.vapour_pressure_deficit.slice(dayStartIdx, dayEndIdx).filter((v: number) => v !== null);
          
          const meanRh = rhSlice.length > 0 ? rhSlice.reduce((a: number, b: number) => a + b, 0) / rhSlice.length : 60;
          const maxDpv = dpvSlice.length > 0 ? Math.max(...dpvSlice) : 0;
          
          const parApprox = daily.shortwave_radiation_sum[index]
            ? ((daily.shortwave_radiation_sum[index] * 1000000) / (24 * 3600)) * 0.45
            : 0;
            
          return {
            date: timeStr,
            tempMax: daily.temperature_2m_max[index] ?? 0,
            tempMin: daily.temperature_2m_min[index] ?? 0,
            tempAvg: daily.temperature_2m_mean[index] ?? 0,
            humidity: Number(meanRh.toFixed(0)),
            et0: daily.et0_fao_evapotranspiration[index] || 0,
            dpv: Number(maxDpv.toFixed(2)),
            par: Number(parApprox.toFixed(0)),
            precipQty: daily.precipitation_sum[index] || 0,
            precipProb: daily.precipitation_probability_max?.[index] || 0,
            windSpeed: daily.wind_speed_10m_max[index] || 0,
            uvIndexMax: daily.uv_index_max[index] || 0,
            condition: "INCONNU",
            shortDate: new Date(timeStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
            day: new Date(timeStr).toLocaleDateString("fr-FR", { weekday: "short" }),
          };
        });
        
        setInternalWeather({
          ...weather,
          forecast: forecastArray
        });
      } catch (e) {
        console.error("Failed to fetch precise weather", e);
      }
    }
    fetchPreciseWeather();
    return () => { isMounted = false; };
  }, [weather]);
`;

code = code.replace(
  '  const [subTab, setSubTab] = useState<"meteo" | "windy">("meteo");',
  '  const [subTab, setSubTab] = useState<"meteo" | "windy">("meteo");\n' + replacement
);

code = code.replace(/weather\.forecast/g, 'internalWeather.forecast');
code = code.replace(/weather\.locationName/g, 'internalWeather.locationName');

fs.writeFileSync('src/App.tsx', code);
