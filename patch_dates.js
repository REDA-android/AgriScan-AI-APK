import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

content = content.replace(
  /doc\.text\(histData\[0\]\.date \|\| "", mx \+ 8, my \+ gridRowH - 2\);/g,
  'doc.text(histData[0].shortDate || histData[0].date || "", mx + 8, my + gridRowH - 2);'
);

content = content.replace(
  /doc\.text\(histData\[histData\.length - 1\]\.date \|\| "", mx \+ gridColW - 8, my \+ gridRowH - 2\);/g,
  'doc.text(histData[histData.length - 1].shortDate || histData[histData.length - 1].date || "", mx + gridColW - 8, my + gridRowH - 2);'
);

// page 2 mini charts
content = content.replace(
  /doc\.text\(forecastData\[0\]\.shortDate \|\| "", mx \+ 8, my \+ gridRowH - 2\);/g,
  'doc.text(forecastData[0].shortDate || forecastData[0].date || "", mx + 8, my + gridRowH - 2);'
);

content = content.replace(
  /doc\.text\(forecastData\[forecastData\.length - 1\]\.shortDate \|\| "", mx \+ gridColW - 8, my \+ gridRowH - 2\);/g,
  'doc.text(forecastData[forecastData.length - 1].shortDate || forecastData[forecastData.length - 1].date || "", mx + gridColW - 8, my + gridRowH - 2);'
);

// Table on page 4
content = content.replace(
  /doc\.text\(String\(row\.date \|\| `jour \$\{idx \+ 1\}`\), tableCols\[0\]\.x, y \+ 4\.2\);/g,
  'doc.text(String(row.date || row.shortDate || `jour ${idx + 1}`), tableCols[0].x, y + 4.2);'
);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
