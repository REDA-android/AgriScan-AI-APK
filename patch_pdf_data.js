import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const regex1 = /const forecastData = \(weather\.forecast \|\| \[\]\)\.slice\(0, 14\);/;

const replacement1 = `const allData = weather.forecast || [];
  const todayStrShort = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  let todayIdx = allData.findIndex((d: any) => d.shortDate === todayStrShort);
  if (todayIdx === -1) todayIdx = 31;
  const forecastData = allData.slice(todayIdx, todayIdx + 15).slice(0, 14);
  const historyData = allData.slice(Math.max(0, todayIdx - 30), todayIdx);`;

content = content.replace(regex1, replacement1);

// Also page 3 history:
const regex2 = /const histData = weather\.history \|\| \[\];/;
const replacement2 = `const histData = historyData.length > 0 ? historyData : allData.slice(0, 30);`;
content = content.replace(regex2, replacement2);

const regex2b = /const hData = weather\.history \|\| \[\];/;
const replacement2b = `const hData = historyData.length > 0 ? historyData : allData.slice(0, 30);`;
content = content.replace(regex2b, replacement2b);

// Also for page 4 table:
const regex3 = /const tableData = weather\.forecast \|\| \[/;
const replacement3 = `const tableData = forecastData.length > 0 ? forecastData : [`;
content = content.replace(regex3, replacement3);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
