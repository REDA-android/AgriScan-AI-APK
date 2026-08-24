import fs from 'fs';

let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

// Replace tempMaxPts and tempMinPts
const replaceTempPts = `  // Curves for Max (Red) and Min (Blue)
  const tempMaxPts = [25, 25, 25, 25, 25, 32, 30, 30, 27, 26, 25, 25, 25, 27];
  const tempMinPts = [20, 19, 19, 19, 19, 19, 20, 21, 19, 19, 19, 18, 20, 19];`;
  
const newTempPts = `  // Curves for Max (Red) and Min (Blue)
  const forecastData = (weather.forecast || []).slice(0, 14);
  const tempMaxPts = forecastData.map((d: any) => d.tempMax || 25);
  const tempMinPts = forecastData.map((d: any) => d.tempMin || 20);`;

content = content.replace(replaceTempPts, newTempPts);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
