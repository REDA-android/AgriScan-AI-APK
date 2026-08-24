import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

content = content.replace(
  /if \(\(d\.rainProb \|\| 0\) > 20 \|\| parseInt\(d\.rain \|\| "0"\) > 2\) \{/g,
  'if ((d.precipProb || d.rainProb || 0) > 20 || parseInt(d.precipQty || d.rain || "0") > 2) {'
);

// Probability pill
content = content.replace(
  /doc\.text\(String\(d\.prev\), dx \+ dayColW \/ 2, y \+ 28\.5, \{ align: "center" \}\);/g,
  'doc.text(String(d.precipProb ? d.precipProb + "%" : d.prev), dx + dayColW / 2, y + 28.5, { align: "center" });'
);

// Rain mm/amount pill
content = content.replace(
  /doc\.text\(String\(d\.rain\), dx \+ dayColW \/ 2, y \+ 32, \{ align: "center" \}\);/g,
  'doc.text(String(d.precipQty !== undefined ? d.precipQty + "mm" : d.rain), dx + dayColW / 2, y + 32, { align: "center" });'
);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
