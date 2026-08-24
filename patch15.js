import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const regex2 = /const forecastData = \(weather\.forecast \|\| \[\]\)\.slice\(0, 14\);\n  const tempMaxPts/;
content = content.replace(regex2, "const tempMaxPts");

fs.writeFileSync('src/services/weatherPdfService.ts', content);
