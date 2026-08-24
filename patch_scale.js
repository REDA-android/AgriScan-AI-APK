import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

content = content.replace(
  /y: y \+ tempChartH - \(\(v - 15\) \/ 25\) \* tempChartH,/g,
  'y: y + tempChartH - Math.max(0, Math.min(1, ((v - 15) / 25))) * tempChartH,'
);

content = content.replace(
  /x: margin \+ \(i \/ 13\) \* cardWidth,/g,
  'x: margin + (i / Math.max(1, tempMaxPts.length - 1)) * cardWidth,'
);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
