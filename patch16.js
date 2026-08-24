import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

// For the mini top cards, let's make sure they use shortDate instead of date
content = content.replace(
  'doc.text(String(d.date), dx + dayColW / 2, y + 5.8, { align: "center" });',
  'doc.text(String(d.shortDate || d.date), dx + dayColW / 2, y + 5.8, { align: "center" });'
);

// We need to also ensure tMax and tMin and rain and prev are there
content = content.replace(
  'doc.text(String(d.tMax), dx + dayColW / 2, y + 17, { align: "center" });',
  'doc.text(String(d.tempMax ? d.tempMax + "°" : d.tMax), dx + dayColW / 2, y + 17, { align: "center" });'
);

content = content.replace(
  'doc.text(String(d.tMin), dx + dayColW / 2, y + 22, { align: "center" });',
  'doc.text(String(d.tempMin ? d.tempMin + "°" : d.tMin), dx + dayColW / 2, y + 22, { align: "center" });'
);

content = content.replace(
  'if (d.rain !== "0%" && parseInt(d.rain) > 2) {',
  'if ((d.rainProb || 0) > 20 || parseInt(d.rain || "0") > 2) {'
);

content = content.replace(
  '} else if (parseInt(d.tMax) > 28) {',
  '} else if (parseInt(d.tempMax || d.tMax) > 28) {'
);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
