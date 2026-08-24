import fs from 'fs';

let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const replaceXDates = `  // X Axis dates
  const xDates = ["10/08", "12/08", "14/08", "16/08", "18/08", "20/08", "22/08", "23/08"];
  xDates.forEach((d, i) => {
    const dx = margin + (i / 7) * cardWidth;
    doc.text(d, dx, y + tempChartH + 3, { align: "center" });
  });`;

const newXDates = `  // X Axis dates
  const xDates = forecastData.filter((_: any, i: number) => i % 2 === 0).map((d: any) => d.shortDate || "");
  xDates.forEach((d: string, i: number) => {
    const dx = margin + (i / (Math.max(1, xDates.length - 1))) * cardWidth;
    doc.text(d, dx, y + tempChartH + 3, { align: "center" });
  });`;

content = content.replace(replaceXDates, newXDates);

const replaceRain = `  // Rain probability % labels below
  const rainProbs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 2, 3, 4];
  rainProbs.forEach((p, i) => {
    const rx = margin + (i / 13) * cardWidth;
    if (p > 0) {
      doc.setFillColor(37, 99, 235);
      const bh = (p / 5) * (rainChartH - 4) + 1;
      doc.rect(rx - 1.5, y + rainChartH - bh, 3, bh, "F");
    }
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text(\`\${p}%\`, rx, y + rainChartH + 3, { align: "center" });
  });`;

const newRain = `  // Rain qty bars and probability labels below
  forecastData.forEach((d: any, i: number) => {
    const rx = margin + (i / (Math.max(1, forecastData.length - 1))) * cardWidth;
    const pQty = d.rainQty || 0;
    const pProb = d.rainProb || 0;
    if (pQty > 0) {
      doc.setFillColor(37, 99, 235);
      const bh = Math.min((pQty / 5), 1) * (rainChartH - 4) + 1;
      doc.rect(rx - 1.5, y + rainChartH - bh, 3, Math.max(1, bh), "F");
    }
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    if (pProb > 0) {
      doc.setTextColor(22, 101, 52);
      doc.text(\`\${pProb}%\`, rx, y + rainChartH + 3, { align: "center" });
    }
  });`;

content = content.replace(replaceRain, newRain);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
