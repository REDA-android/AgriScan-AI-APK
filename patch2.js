import fs from 'fs';

let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

// Replace the old rectangles and lines with smooth curves
const toReplace = `  // Shaded 10-year normals band
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y + 5, cardWidth, 14, "F");

  // Curves for Max (Red) and Min (Blue)
  const tempMaxPts = [25, 25, 25, 25, 25, 32, 30, 30, 27, 26, 25, 25, 25, 27];
  const tempMinPts = [20, 19, 19, 19, 19, 19, 20, 21, 19, 19, 19, 18, 20, 19];

  // Max line
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  for (let i = 0; i < tempMaxPts.length - 1; i++) {
    const x1 = margin + (i / 13) * cardWidth;
    const y1 = y + tempChartH - ((tempMaxPts[i] - 18) / 18) * tempChartH;
    const x2 = margin + ((i + 1) / 13) * cardWidth;
    const y2 = y + tempChartH - ((tempMaxPts[i + 1] - 18) / 18) * tempChartH;
    doc.line(x1, y1, x2, y2);
  }

  // Min line
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  for (let i = 0; i < tempMinPts.length - 1; i++) {
    const x1 = margin + (i / 13) * cardWidth;
    const y1 = y + tempChartH - ((tempMinPts[i] - 18) / 18) * tempChartH;
    const x2 = margin + ((i + 1) / 13) * cardWidth;
    const y2 = y + tempChartH - ((tempMinPts[i + 1] - 18) / 18) * tempChartH;
    doc.line(x1, y1, x2, y2);
  }`;

const replacement = `  // Curves for Max (Red) and Min (Blue)
  const tempMaxPts = [25, 25, 25, 25, 25, 32, 30, 30, 27, 26, 25, 25, 25, 27];
  const tempMinPts = [20, 19, 19, 19, 19, 19, 20, 21, 19, 19, 19, 18, 20, 19];
  
  // 10-year normals (fake data for smooth polygon)
  const normalMaxPts = [28, 28.5, 28, 28, 28.5, 28.5, 28, 27.5, 27.5, 28, 28.5, 28.5, 28, 28];
  const normalMinPts = [19, 19, 19.5, 19.5, 19, 19.5, 19.5, 20, 20, 19.5, 19.5, 19, 19.5, 19.5];

  const toXY = (val: number, i: number) => ({
    x: margin + (i / 13) * cardWidth,
    y: y + tempChartH - ((val - 18) / 18) * tempChartH
  });

  const pMax = tempMaxPts.map(toXY);
  const pMin = tempMinPts.map(toXY);
  const nMax = normalMaxPts.map(toXY);
  const nMin = normalMinPts.map(toXY);

  // Shaded 10-year normals band
  drawSmoothArea(doc, nMax, nMin, [226, 232, 240]);

  // Max line
  drawSmoothCurve(doc, pMax, [220, 38, 38], 0.8);
  
  // Min line
  drawSmoothCurve(doc, pMin, [37, 99, 235], 0.8);
`;

content = content.replace(toReplace, replacement);
fs.writeFileSync('src/services/weatherPdfService.ts', content);
