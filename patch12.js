import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const oldCumul1 = `  doc.text("Précipitations : 2 mm", margin + 4, y + 10.5);
  doc.text("Degrés-jours : 214 DJ", margin + 65, y + 10.5);`;
  
const newCumul1 = `  const fRainTotal = forecastData.reduce((acc: number, d: any) => acc + (parseFloat(d.rainQty) || 0), 0);
  const fDjTotal = forecastData.reduce((acc: number, d: any) => acc + (parseFloat(d.dj) || 0), 0);
  doc.text(\`Précipitations : \${fRainTotal.toFixed(1)} mm\`, margin + 4, y + 10.5);
  doc.text(\`Degrés-jours : \${fDjTotal.toFixed(0)} DJ\`, margin + 65, y + 10.5);`;

const oldCumul2 = `  doc.text("Précipitations : 0 mm", margin + 4, y + 10.5);
  doc.text("Degrés-jours : 415 DJ", margin + 65, y + 10.5);`;

const newCumul2 = `  const hData = weather.history || [];
  const hRainTotal = hData.reduce((acc: number, d: any) => acc + (parseFloat(d.rainQty) || 0), 0);
  const hDjTotal = hData.reduce((acc: number, d: any) => acc + (parseFloat(d.dj) || 0), 0);
  doc.text(\`Précipitations : \${hRainTotal.toFixed(1)} mm\`, margin + 4, y + 10.5);
  doc.text(\`Degrés-jours : \${hDjTotal.toFixed(0)} DJ\`, margin + 65, y + 10.5);`;

content = content.replace(oldCumul1, newCumul1);
content = content.replace(oldCumul2, newCumul2);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
