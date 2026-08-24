import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

// For page 2
content = content.replace(
  /extVals = forecastData\.map\(\(d: any\) => parseFloat\(d\[p\.key\] \|\| 0\)\);/g,
  'extVals = forecastData.map((d: any) => { const v = parseFloat(d[p.key]); return isNaN(v) ? 0 : v; });'
);

// For page 3
content = content.replace(
  /extVals = histData\.map\(\(d: any\) => parseFloat\(d\[p\.key\] \|\| 0\)\);/g,
  'extVals = histData.map((d: any) => { const v = parseFloat(d[p.key]); return isNaN(v) ? 0 : v; });'
);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
