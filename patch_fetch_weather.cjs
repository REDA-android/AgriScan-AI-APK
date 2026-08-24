const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I need to patch fetchWeather's processing of weatherData in App.tsx
// to correctly extract humidity and vapour_pressure_deficit from hourly, 
// and remove the DPV/Humidity approximation.

const oldLogic = `          // Approx DPV max daily
          const tMax = daily.temperature_2m_max[index] ?? 20;
          const es = 0.6108 * Math.exp((17.27 * tMax) / (tMax + 237.3));
          const ea = es * 0.6; // assuming 60% rh
          const dpvApprox = es - ea;
          const dustVal = dustMap[timeStr] ? Number(dustMap[timeStr].toFixed(1)) : 0;

          return {
            date: timeStr,
            tempMax: daily.temperature_2m_max[index],
            tempMin: daily.temperature_2m_min[index],
            tempAvg: daily.temperature_2m_mean[index],
            humidity: 60,
            et0: daily.et0_fao_evapotranspiration[index] || 0,
            dpv: Number(dpvApprox.toFixed(2)),`;

const newLogic = `          const dayStartIdx = index * 24;
          const hourly = weatherData.hourly;
          let dpvMax = 0;
          let rhMean = 60;
          if (hourly && hourly.vapour_pressure_deficit && hourly.relative_humidity_2m) {
             const rhSlice = hourly.relative_humidity_2m.slice(dayStartIdx, dayStartIdx + 24).filter(v => v !== null);
             const dpvSlice = hourly.vapour_pressure_deficit.slice(dayStartIdx, dayStartIdx + 24).filter(v => v !== null);
             rhMean = rhSlice.length > 0 ? rhSlice.reduce((a,b)=>a+b,0)/rhSlice.length : 60;
             dpvMax = dpvSlice.length > 0 ? Math.max(...dpvSlice) : 0;
          }
          const dustVal = dustMap[timeStr] ? Number(dustMap[timeStr].toFixed(1)) : 0;

          return {
            date: timeStr,
            tempMax: daily.temperature_2m_max[index],
            tempMin: daily.temperature_2m_min[index],
            tempAvg: daily.temperature_2m_mean[index],
            humidity: Number(rhMean.toFixed(0)),
            et0: daily.et0_fao_evapotranspiration[index] || 0,
            dpv: Number(dpvMax.toFixed(2)),`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', code);
