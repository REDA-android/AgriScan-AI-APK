import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const oldTable = `    doc.text(String(row.date || \`jour \${idx + 1}\`), tableCols[0].x, y + 4.2);
    doc.text(String(tMin), tableCols[1].x, y + 4.2);
    doc.text(String(tMax), tableCols[2].x, y + 4.2);
    doc.text(String(row.hum || "80%"), tableCols[3].x, y + 4.2);
    doc.text(String(row.wind || "15 km/h"), tableCols[4].x, y + 4.2);
    doc.text(String(row.rain || "0 mm · 0%"), tableCols[5].x, y + 4.2);
    doc.text(String(row.et0 || "4.2"), tableCols[6].x, y + 4.2);
    doc.text(String(row.dj || "12"), tableCols[7].x, y + 4.2);`;

const newTable = `    doc.text(String(row.date || \`jour \${idx + 1}\`), tableCols[0].x, y + 4.2);
    doc.text(String(tMin), tableCols[1].x, y + 4.2);
    doc.text(String(tMax), tableCols[2].x, y + 4.2);
    doc.text(String(row.hum || "80%").endsWith("%") ? String(row.hum || "80%") : \`\${row.hum}%\`, tableCols[3].x, y + 4.2);
    doc.text(String(row.wind || "15 km/h").includes("km/h") ? String(row.wind || "15 km/h") : \`\${row.wind} km/h\`, tableCols[4].x, y + 4.2);
    doc.text(String(row.rain || "0 mm · 0%"), tableCols[5].x, y + 4.2);
    doc.text(String(row.et0 || "4.2"), tableCols[6].x, y + 4.2);
    doc.text(String(row.dj || "12"), tableCols[7].x, y + 4.2);`;

content = content.replace(oldTable, newTable);

// also fix forecastData check at page 1 for the 14 days grid
const oldGrid = `  const daysData = weather.forecast14 || [
    { day: "lun", date: "10/08", tMax: "25°", tMin: "20°", rain: "0%", prev: "85%" },
    { day: "mar", date: "11/08", tMax: "25°", tMin: "19°", rain: "0%", prev: "85%" },
    { day: "mer", date: "12/08", tMax: "25°", tMin: "19°", rain: "0%", prev: "80%" },
    { day: "jeu", date: "13/08", tMax: "25°", tMin: "19°", rain: "0%", prev: "80%" },
    { day: "ven", date: "14/08", tMax: "25°", tMin: "19°", rain: "0%", prev: "80%" },
    { day: "sam", date: "15/08", tMax: "32°", tMin: "19°", rain: "0%", prev: "75%" },
    { day: "dim", date: "16/08", tMax: "30°", tMin: "20°", rain: "0%", prev: "75%" },
    { day: "lun", date: "17/08", tMax: "30°", tMin: "21°", rain: "0%", prev: "70%" },
    { day: "mar", date: "18/08", tMax: "27°", tMin: "19°", rain: "0%", prev: "70%" },
    { day: "mer", date: "19/08", tMax: "26°", tMin: "19°", rain: "4%", prev: "65%" },
    { day: "jeu", date: "20/08", tMax: "25°", tMin: "19°", rain: "4%", prev: "60%" },
    { day: "ven", date: "21/08", tMax: "25°", tMin: "18°", rain: "2%", prev: "60%" },
    { day: "sam", date: "22/08", tMax: "25°", tMin: "20°", rain: "3%", prev: "55%" },
    { day: "dim", date: "23/08", tMax: "27°", tMin: "19°", rain: "4%", prev: "50%" },
  ];`;

const newGrid = `  const daysData = forecastData.length >= 14 ? forecastData.slice(0, 14) : forecastData;`;

content = content.replace(oldGrid, newGrid);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
