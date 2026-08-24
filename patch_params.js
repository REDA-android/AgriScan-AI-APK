import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const newParamsP2 = `  const miniParamsP2 = [
    { title: "Temp. moyenne (°C)", color: [37, 99, 235], val: (d: any) => ((d.tempMax||0) + (d.tempMin||0)) / 2 },
    { title: "Temp. max (°C)", color: [220, 38, 38], val: (d: any) => d.tempMax||0 },
    { title: "Temp. min (°C)", color: [37, 99, 235], val: (d: any) => d.tempMin||0 },
    { title: "Degrés-jours (DJ)", color: [234, 88, 12], val: (d: any) => d.dj||0 },
    { title: "Humidité (%)", color: [16, 185, 129], val: (d: any) => d.humidity||0 },
    { title: "ET0 (mm)", color: [202, 138, 4], val: (d: any) => d.et0||0 },
    { title: "DPV (kPa)", color: [147, 51, 234], val: (d: any) => d.dpv||0 },
    { title: "PAR (W/m²)", color: [202, 138, 4], val: (d: any) => d.par||0 },
    { title: "Précipitations (mm)", color: [14, 116, 144], val: (d: any) => d.precipQty||0 },
    { title: "Prob. pluie (%)", color: [37, 99, 235], val: (d: any) => d.precipProb||0 },
    { title: "Vent (km/h)", color: [71, 85, 105], val: (d: any) => d.windSpeed||0 },
    { title: "Poussière (µg/m³)", color: [180, 83, 9], val: (d: any) => d.dust||0 },
    { title: "Heures de froid (h)", color: [148, 163, 184], noData: true, val: (d: any) => 0 },
  ];`;

content = content.replace(/const miniParamsP2 = \[[\s\S]*?\];/, newParamsP2);

const newParamsP3 = `  const miniParamsP3 = [
    { title: "Temp. moyenne (°C)", color: [37, 99, 235], val: (d: any) => ((d.tempMax||0) + (d.tempMin||0)) / 2 },
    { title: "Temp. max (°C)", color: [220, 38, 38], val: (d: any) => d.tempMax||0 },
    { title: "Temp. min (°C)", color: [37, 99, 235], val: (d: any) => d.tempMin||0 },
    { title: "Degrés-jours (DJ)", color: [234, 88, 12], val: (d: any) => d.dj||0 },
    { title: "Humidité (%)", color: [16, 185, 129], val: (d: any) => d.humidity||0 },
    { title: "ET0 (mm)", color: [202, 138, 4], val: (d: any) => d.et0||0 },
    { title: "DPV (kPa)", color: [147, 51, 234], val: (d: any) => d.dpv||0 },
    { title: "PAR (W/m²)", color: [202, 138, 4], val: (d: any) => d.par||0 },
    { title: "Précipitations (mm)", color: [14, 116, 144], val: (d: any) => d.precipQty||0 },
    { title: "Prob. pluie (%)", color: [37, 99, 235], val: (d: any) => d.precipProb||0 },
    { title: "Vent (km/h)", color: [71, 85, 105], val: (d: any) => d.windSpeed||0 },
    { title: "Poussière (µg/m³)", color: [180, 83, 9], val: (d: any) => d.dust||0 },
    { title: "Heures de froid (h)", color: [148, 163, 184], noData: true, val: (d: any) => 0 },
  ];`;

content = content.replace(/const miniParamsP3 = \[[\s\S]*?\];/, newParamsP3);

const regexValsP2 = /extVals = forecastData\.map\(\(d: any\) => \{ const v = parseFloat\(d\[p\.key\]\); return isNaN\(v\) \? 0 : v; \}\);/;
content = content.replace(regexValsP2, 'extVals = forecastData.map((d: any) => { const v = parseFloat(p.val(d)); return isNaN(v) ? 0 : v; });');

const regexValsP3 = /extVals = histData\.map\(\(d: any\) => \{ const v = parseFloat\(d\[p\.key\]\); return isNaN\(v\) \? 0 : v; \}\);/;
content = content.replace(regexValsP3, 'extVals = histData.map((d: any) => { const v = parseFloat(p.val(d)); return isNaN(v) ? 0 : v; });');

// also replace the if (p.key && histData.length > 0) checks
content = content.replace(/if \(p\.key && forecastData\.length > 0\)/g, 'if (p.val && forecastData.length > 0)');
content = content.replace(/if \(p\.key && histData\.length > 0\)/g, 'if (p.val && histData.length > 0)');

fs.writeFileSync('src/services/weatherPdfService.ts', content);
