import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const regex = /const daysData = weather\.forecast14 \|\| \[[\s\S]*?\];/;
content = content.replace(regex, "const forecastData = (weather.forecast || []).slice(0, 14);\n  const daysData = forecastData;");

fs.writeFileSync('src/services/weatherPdfService.ts', content);
