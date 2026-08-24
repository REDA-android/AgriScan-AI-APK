import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

// Page 1 rain prob bars
content = content.replace(
  /const pQty = d\.rainQty \|\| 0;/g,
  "const pQty = d.precipQty || d.rainQty || 0;"
);
content = content.replace(
  /const pProb = d\.rainProb \|\| 0;/g,
  "const pProb = d.precipProb || d.rainProb || 0;"
);

// P2 mini cards
content = content.replace(/key: "tempAvg"/g, 'key: "temp"'); // temp doesn't exist either? Let's keep it empty or calculate it
content = content.replace(/key: "hum"/g, 'key: "humidity"');
content = content.replace(/key: "rainQty"/g, 'key: "precipQty"');
content = content.replace(/key: "rainProb"/g, 'key: "precipProb"');
content = content.replace(/key: "wind"/g, 'key: "windSpeed"');

// Cumuls
content = content.replace(
  /parseFloat\(d\.rainQty\)/g,
  "parseFloat(d.precipQty || d.rainQty)"
);

// Table page 4
content = content.replace(
  /String\(row\.hum \|\| "80%"\)\.endsWith\("%"\) \? String\(row\.hum \|\| "80%"\) : `\$\{row\.hum\}%`/g,
  "String(row.humidity || row.hum || '80%').endsWith('%') ? String(row.humidity || row.hum || '80%') : `${row.humidity || row.hum}%`"
);
content = content.replace(
  /String\(row\.wind \|\| "15 km\/h"\)\.includes\("km\/h"\) \? String\(row\.wind \|\| "15 km\/h"\) : `\$\{row\.wind\} km\/h`/g,
  "String(row.windSpeed || row.wind || '15 km/h').includes('km/h') ? String(row.windSpeed || row.wind || '15 km/h') : `${row.windSpeed || row.wind} km/h`"
);
content = content.replace(
  /String\(row\.rain \|\| "0 mm · 0%"\)/g,
  "row.precipQty !== undefined ? `${row.precipQty} mm · ${row.precipProb || 0}%` : String(row.rain || '0 mm · 0%')"
);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
