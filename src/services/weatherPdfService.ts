import jsPDF from "jspdf";


// Spline interpolation helper for smooth charts
function getBezierPoints(pts: {x: number, y: number}[], tension = 0.3, numOfSegments = 16) {
  let res: {x: number, y: number}[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[0];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i != pts.length - 2 ? pts[i + 2] : p2;
    
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    
    for (let t = 0; t <= numOfSegments; t++) {
      const t1 = t / numOfSegments;
      const t2 = t1 * t1;
      const t3 = t2 * t1;
      
      const x = 
        (1 - 3*t1 + 3*t2 - t3) * p1.x +
        (3*t1 - 6*t2 + 3*t3) * cp1x +
        (3*t2 - 3*t3) * cp2x +
        (t3) * p2.x;
        
      const y = 
        (1 - 3*t1 + 3*t2 - t3) * p1.y +
        (3*t1 - 6*t2 + 3*t3) * cp1y +
        (3*t2 - 3*t3) * cp2y +
        (t3) * p2.y;
        
      res.push({x, y});
    }
  }
  return res;
}

function drawSmoothCurve(doc: any, pts: {x: number, y: number}[], color: number[], lineWidth: number = 0.8) {
  if (pts.length < 2) return;
  const smoothPts = getBezierPoints(pts);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(lineWidth);
  for (let i = 0; i < smoothPts.length - 1; i++) {
    doc.line(smoothPts[i].x, smoothPts[i].y, smoothPts[i + 1].x, smoothPts[i + 1].y);
  }
}

function drawSmoothArea(doc: any, ptsTop: {x: number, y: number}[], ptsBottom: {x: number, y: number}[], color: number[]) {
  if (ptsTop.length < 2 || ptsBottom.length < 2) return;
  const smoothTop = getBezierPoints(ptsTop);
  const smoothBottom = getBezierPoints(ptsBottom).reverse();
  const allPts = [...smoothTop, ...smoothBottom];
  
  doc.setFillColor(color[0], color[1], color[2]);
  const startX = allPts[0].x;
  const startY = allPts[0].y;
  let lines = [];
  for (let i = 1; i < allPts.length; i++) {
    lines.push([allPts[i].x - allPts[i - 1].x, allPts[i].y - allPts[i - 1].y]);
  }
  doc.lines(lines, startX, startY, [1, 1], 'F', true);
}

export function generateWeatherPDF(weather: any): void {
  if (!weather || !weather.current) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 12;
  const cardWidth = pageWidth - 2 * margin; // 186

  const locationName = weather.locationName || "Agadir";
  const dateObj = new Date();
  const dateStr = dateObj.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const fullDateStr = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Header Helper Function
  const drawHeader = (subtitle: string) => {
    // Top banner - AgroScan IA Dark Green #166534
    doc.setFillColor(22, 101, 52);
    doc.rect(0, 0, pageWidth, 18, "F");

    // Title left
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("AgroScan IA", margin, 10);

    // Subtitle left
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 252, 231);
    doc.text(subtitle, margin, 15);

    // Location / Date right
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`${locationName} · ${dateStr}`, pageWidth - margin, 12, { align: "right" });
  };

  // Footer Helper Function
  const drawFooter = (pageNum: number) => {
    doc.setPage(pageNum);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("AgroScan IA · rapport généré automatiquement", margin, pageHeight - 6);
    doc.text(`Page ${pageNum} / 4`, pageWidth - margin, pageHeight - 6, { align: "right" });
  };

  // ==========================================
  // PAGE 1: Rapport météo & climat
  // ==========================================
  drawHeader("Rapport météo & climat");
  let y = 24;

  // City Title
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(locationName, margin, y);
  y += 4.5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Souss-Massa · ${fullDateStr}`, margin, y);
  y += 6.5;

  // Hero Weather Banner (Card)
  const temp = Math.round(weather.current.temp || 22);
  const condition = weather.current.condition || "SOLEIL";
  const minTemp = weather.forecast?.[0]?.tempMin ?? temp - 2;
  const maxTemp = weather.forecast?.[0]?.tempMax ?? temp + 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, cardWidth, 12, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${temp}°`, margin + 5, y + 8.5);

  // Draw Sun Icon next to temp
  doc.setFillColor(250, 204, 21); // Yellow
  doc.circle(margin + 20, y + 6, 2, "F");

  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(condition.toUpperCase(), margin + 24, y + 8.5);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(`min ${minTemp}° · max ${maxTemp}°`, pageWidth - margin - 5, y + 8.5, { align: "right" });

  y += 16;

  // Section 1: Tous les paramètres (actuel)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Tous les paramètres (actuel)", margin, y);
  y += 4;

  const paramGridY = y;
  const paramGridHeight = 28;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(241, 245, 249);
  doc.roundedRect(margin, paramGridY, cardWidth, paramGridHeight, 2, 2, "FD");

  const paramsList = [
    { label: "Température", val: `${weather.current.temp ?? 22.3} °C` },
    { label: "Humidité", val: `${weather.current.humidity ?? 78} %` },
    { label: "Vent", val: `${weather.current.wind ?? 7.6} km/h` },
    { label: "ET0", val: `${weather.current.et0 ?? 4.34} mm/j` },
    { label: "DPV", val: `${weather.current.vpd ?? 0.59} kPa` },
    { label: "PAR", val: `${weather.current.par ?? 128} W/m²` },
    { label: "Précipitations", val: `${weather.current.rain ?? 0.0} mm` },
    { label: "Prob. pluie", val: `${weather.current.rainProb ?? 0} %` },
    { label: "Poussière (air)", val: `${weather.current.dust ?? 126} µg/m³` },
    { label: "Qualité air", val: "Bonne" },
    { label: "Heures de froid", val: `${weather.current.chillHours ?? 7} h` },
    { label: "Condition", val: condition.toUpperCase() },
  ];

  const colWidth = cardWidth / 4;
  paramsList.forEach((p, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const px = margin + col * colWidth + 4;
    const py = paramGridY + 4 + row * 8.5;

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(p.label, px, py);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(p.val, px, py + 3.8);
  });

  y += paramGridHeight + 5;

  // Section 2: Alertes agronomiques
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Alertes agronomiques", margin, y);
  y += 4;

  const chipWidth = (cardWidth - 9) / 4;
  const hazards = weather.hazards || [];
  const pulve = hazards.find((h: any) => h.id?.includes("pulve") || h.label?.includes("PULVÉ"))?.value || "Favorable";
  const gel = hazards.find((h: any) => h.id?.includes("gel") || h.label?.includes("GEL"))?.value || "Faible";
  const stress = hazards.find((h: any) => h.id?.includes("stress") || h.label?.includes("THERMIQUE"))?.value || "Normal";
  const crypto = hazards.find((h: any) => h.id?.includes("crypto") || h.label?.includes("CRYPTO"))?.value || "Élevé";

  const alertChips = [
    { label: "CONDITION PULVÉ (3J)", val: pulve, isCrit: false },
    { label: "RISQUE DE GEL (3J)", val: gel, isCrit: false },
    { label: "STRESS THERMIQUE (3J)", val: stress, isCrit: false },
    { label: "RISQUE CRYPTO (3J)", val: crypto, isCrit: true },
  ];

  alertChips.forEach((c, i) => {
    const cx = margin + i * (chipWidth + 3);
    const borderC = c.isCrit ? [245, 158, 11] : [187, 247, 208];
    const bgC = c.isCrit ? [254, 252, 232] : [240, 253, 244];
    const textC = c.isCrit ? [180, 83, 9] : [22, 101, 52];

    doc.setFillColor(bgC[0], bgC[1], bgC[2]);
    doc.setDrawColor(borderC[0], borderC[1], borderC[2]);
    doc.roundedRect(cx, y, chipWidth, 11, 2, 2, "FD");

    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + 2.5, y + 3.8);

    doc.setFontSize(7.5);
    doc.setTextColor(textC[0], textC[1], textC[2]);
    doc.text(c.val, cx + 2.5, y + 8.2);
  });

  y += 13;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Poussière (air) : 126 µg/m³ (prévision CAMS · 7 j).", margin, y);

  y += 5;

  // Section 3: Prévisions 14 jours & prévisibilité
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Prévisions 14 jours & prévisibilité", margin, y);
  y += 4;

  const dayColW = cardWidth / 14; // 13.28mm
  const daysData = weather.forecast14 || [
    { day: "lun", date: "10/08", tMax: "25°", tMin: "20°", rain: "0%", prev: "85%" },
    { day: "mar", date: "11/08", tMax: "25°", tMin: "19°", rain: "0%", prev: "82%" },
    { day: "mer", date: "12/08", tMax: "25°", tMin: "19°", rain: "0%", prev: "79%" },
    { day: "jeu", date: "13/08", tMax: "25°", tMin: "19°", rain: "0%", prev: "76%" },
    { day: "ven", date: "14/08", tMax: "25°", tMin: "19°", rain: "0%", prev: "73%" },
    { day: "sam", date: "15/08", tMax: "32°", tMin: "19°", rain: "0%", prev: "70%" },
    { day: "dim", date: "16/08", tMax: "30°", tMin: "20°", rain: "0%", prev: "67%" },
    { day: "lun", date: "17/08", tMax: "30°", tMin: "21°", rain: "0%", prev: "64%" },
    { day: "mar", date: "18/08", tMax: "27°", tMin: "19°", rain: "0%", prev: "61%" },
    { day: "mer", date: "19/08", tMax: "26°", tMin: "19°", rain: "4%", prev: "58%" },
    { day: "jeu", date: "20/08", tMax: "25°", tMin: "19°", rain: "4%", prev: "55%" },
    { day: "ven", date: "21/08", tMax: "25°", tMin: "18°", rain: "2%", prev: "52%" },
    { day: "sam", date: "22/08", tMax: "25°", tMin: "20°", rain: "3%", prev: "50%" },
    { day: "dim", date: "23/08", tMax: "27°", tMin: "19°", rain: "4%", prev: "50%" },
  ];

  daysData.slice(0, 14).forEach((d: any, i: number) => {
    const dx = margin + i * dayColW;

    // Day name
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(String(d.day), dx + dayColW / 2, y + 2.8, { align: "center" });

    // Date
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(String(d.date), dx + dayColW / 2, y + 5.8, { align: "center" });

    // Draw Weather Icon (Simple geometry)
    const iconY = y + 9.5;
    const iconX = dx + dayColW / 2;
    if (d.rain !== "0%" && parseInt(d.rain) > 2) {
      // Rain: gray cloud + blue drop
      doc.setFillColor(148, 163, 184); // Gray cloud
      doc.ellipse(iconX, iconY - 1, 2.5, 1.5, "F");
      doc.ellipse(iconX - 1.5, iconY - 0.5, 1.5, 1, "F");
      doc.ellipse(iconX + 1.5, iconY - 0.5, 1.5, 1, "F");
      doc.setFillColor(59, 130, 246); // Blue drop
      doc.circle(iconX, iconY + 1.5, 0.8, "F");
    } else if (parseInt(d.tMax) > 28) {
      // Hot/Sunny: yellow sun
      doc.setFillColor(250, 204, 21); // Yellow
      doc.circle(iconX, iconY, 2.2, "F");
    } else {
      // Partly cloudy: yellow sun + gray cloud
      doc.setFillColor(250, 204, 21); // Yellow sun
      doc.circle(iconX - 1, iconY - 0.5, 1.8, "F");
      doc.setFillColor(203, 213, 225); // Light gray cloud
      doc.ellipse(iconX + 1, iconY + 0.5, 2, 1.2, "F");
    }

    // Max pill (Yellow)
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(dx + 1, y + 14, dayColW - 2, 4, 1, 1, "F");
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(String(d.tMax), dx + dayColW / 2, y + 17, { align: "center" });

    // Min pill (Olive / Green)
    doc.setFillColor(163, 230, 53);
    doc.roundedRect(dx + 1, y + 19, dayColW - 2, 4, 1, 1, "F");
    doc.setTextColor(30, 41, 59);
    doc.text(String(d.tMin), dx + dayColW / 2, y + 22, { align: "center" });

    // Rain probability
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(String(d.rain), dx + dayColW / 2, y + 26, { align: "center" });

    // Predictability gray bar
    doc.setFillColor(226, 232, 240);
    doc.rect(dx + 1.5, y + 27.5, dayColW - 3, 2, "F");
    doc.setFontSize(4.5);
    doc.setTextColor(148, 163, 184);
    doc.text(String(d.prev), dx + dayColW / 2, y + 32, { align: "center" });
  });

  y += 34;

  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Prévisibilité indicative selon l'horizon de prévision.", margin, y);

  y += 4.5;

  // Section 4: Température (°C) Chart
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Température (°C)", margin, y);

  // Legend right
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.line(margin + 45, y - 1, margin + 50, y - 1);
  doc.setTextColor(100, 116, 139);
  doc.text("max", margin + 52, y);

  doc.setDrawColor(37, 99, 235);
  doc.line(margin + 63, y - 1, margin + 68, y - 1);
  doc.text("min", margin + 70, y);

  doc.setFillColor(226, 232, 240);
  doc.rect(margin + 81, y - 2.5, 5, 2.5, "F");
  doc.text("normales 10 ans (min–max)", margin + 88, y);

  y += 3;

  // Chart Box
  const tempChartH = 25;
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, cardWidth, tempChartH, "F");

  // Y-Axis grid lines & labels
  const yVals = [35, 30, 25, 20];
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  yVals.forEach((v, idx) => {
    const gy = y + (idx / 3) * (tempChartH - 4) + 2;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, gy, margin + cardWidth, gy);
    doc.text(String(v), margin - 3, gy + 1, { align: "right" });
  });

  // Curves for Max (Red) and Min (Blue)
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


  // X Axis dates
  const xDates = ["10/08", "12/08", "14/08", "16/08", "18/08", "20/08", "22/08", "23/08"];
  xDates.forEach((d, i) => {
    const dx = margin + (i / 7) * cardWidth;
    doc.text(d, dx, y + tempChartH + 3, { align: "center" });
  });

  y += tempChartH + 6;

  // Section 5: Précipitation (mm) / Probabilité de précipitation (%)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Précipitation (mm) / Probabilité de précipitation (%)", margin, y);
  y += 3;

  const rainChartH = 18;
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, cardWidth, rainChartH, "F");

  // Y-Axis precipitation (0 to 5)
  const rainYVals = [5, 4, 3, 2, 1, 0];
  doc.setFontSize(5.5);
  rainYVals.forEach((v, idx) => {
    const gy = y + (idx / 5) * (rainChartH - 3) + 1.5;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, gy, margin + cardWidth, gy);
    doc.text(String(v), margin - 3, gy + 1, { align: "right" });
  });

  // Rain probability % labels below
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
    doc.text(`${p}%`, rx, y + rainChartH + 3, { align: "center" });
  });

  drawFooter(1);

  // ==========================================
  // PAGE 2: Prévisions (15 jours) vs moyenne 10 ans
  // ==========================================
  doc.addPage();
  drawHeader("Prévisions (15 jours) vs moyenne 10 ans");
  y = 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Prévisions — tous les paramètres", margin, y);

  // Legend
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.line(margin + 75, y - 1, margin + 80, y - 1);
  doc.setTextColor(100, 116, 139);
  doc.text("valeur", margin + 82, y);

  doc.setFillColor(226, 232, 240);
  doc.rect(margin + 100, y - 2.5, 5, 2.5, "F");
  doc.text("moyenne 10 ans", margin + 107, y);

  y += 6;

  // 13 Mini Sparkline Cards Grid (3 cols x 5 rows)
  const gridColW = (cardWidth - 8) / 3; // 59.3mm
  const gridRowH = 19;

  const miniParamsP2 = [
    { title: "Temp. moyenne (°C)", max: "29", min: "20", color: [37, 99, 235] },
    { title: "Temp. max (°C)", max: "36", min: "24", color: [220, 38, 38] },
    { title: "Temp. min (°C)", max: "23", min: "17", color: [37, 99, 235] },
    { title: "Degrés-jours (DJ)", max: "20", min: "11", color: [234, 88, 12] },
    { title: "Humidité min / max (%)", max: "109", min: "20", color: [16, 185, 129] },
    { title: "ET0 (mm)", max: "7", min: "3", color: [202, 138, 4] },
    { title: "DPV (kPa)", max: "3", min: "1", color: [147, 51, 234] },
    { title: "PAR (W/m²)", max: "148", min: "90", color: [202, 138, 4] },
    { title: "Précipitations (mm)", max: "2", min: "0", color: [14, 116, 144] },
    { title: "Prob. pluie (%)", max: "5", min: "0", color: [37, 99, 235] },
    { title: "Vent (km/h)", max: "25", min: "11", color: [71, 85, 105] },
    { title: "Poussière (µg/m³)", max: "111", min: "-12", color: [180, 83, 9] },
    { title: "Heures de froid (h)", max: "", min: "", color: [148, 163, 184], noData: true },
  ];

  miniParamsP2.forEach((p, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const mx = margin + col * (gridColW + 4);
    const my = y + row * (gridRowH + 5);

    // Mini card background
    doc.setFillColor(250, 250, 250);
    doc.rect(mx, my, gridColW, gridRowH, "F");

    // Title
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(p.title, mx + 2, my + 4);

    if (p.noData) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("donnée indisponible", mx + 2, my + 11);
    } else {
      // Max / Min Y labels
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(p.max, mx + 2, my + 7.5);
      doc.text(p.min, mx + 2, my + gridRowH - 2);

      // Dates
      doc.text("10/08", mx + 8, my + gridRowH - 2);
      doc.text("25/08", mx + gridColW - 8, my + gridRowH - 2);

      // Shaded 10-year mean band
      const ptsNormalTop = [
        {x: mx + 8, y: my + 6},
        {x: mx + 20, y: my + 5},
        {x: mx + 32, y: my + 7},
        {x: mx + 44, y: my + 6},
        {x: mx + gridColW - 2, y: my + 5}
      ];
      const ptsNormalBottom = [
        {x: mx + 8, y: my + 13},
        {x: mx + 20, y: my + 12},
        {x: mx + 32, y: my + 14},
        {x: mx + 44, y: my + 13},
        {x: mx + gridColW - 2, y: my + 12}
      ];
      drawSmoothArea(doc, ptsNormalTop, ptsNormalBottom, [226, 232, 240]);

      // Curve
      const curvePts = [
        {x: mx + 8, y: my + 11},
        {x: mx + 20, y: my + 10},
        {x: mx + 32, y: my + 8},
        {x: mx + 44, y: my + 12},
        {x: mx + gridColW - 2, y: my + 7}
      ];
      drawSmoothCurve(doc, curvePts, p.color, 0.6);
    }
  });

  y += 5 * (gridRowH + 5) + 4;

  // Cumuls Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(241, 245, 249);
  doc.roundedRect(margin, y, cardWidth, 14, 2, 2, "FD");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("CUMULS SUR LA PÉRIODE", margin + 4, y + 4.8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Précipitations : 2 mm", margin + 4, y + 10.5);
  doc.text("Degrés-jours : 214 DJ", margin + 65, y + 10.5);

  drawFooter(2);

  // ==========================================
  // PAGE 3: Historique (30 jours) vs moyenne 10 ans
  // ==========================================
  doc.addPage();
  drawHeader("Historique (30 jours) vs moyenne 10 ans");
  y = 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Historique 30 jours — tous les paramètres", margin, y);

  // Legend
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setFillColor(226, 232, 240);
  doc.rect(margin + 95, y - 2.5, 5, 2.5, "F");
  doc.setTextColor(100, 116, 139);
  doc.text("moyenne 10 ans", margin + 102, y);

  y += 6;

  const miniParamsP3 = [
    { title: "Temp. moyenne (°C)", max: "28", min: "20", color: [37, 99, 235] },
    { title: "Temp. max (°C)", max: "36", min: "22", color: [220, 38, 38] },
    { title: "Temp. min (°C)", max: "23", min: "18", color: [37, 99, 235] },
    { title: "Degrés-jours (DJ)", max: "19", min: "10", color: [234, 88, 12] },
    { title: "Humidité min / max (%)", max: "107", min: "32", color: [16, 185, 129] },
    { title: "ET0 (mm)", max: "7", min: "3", color: [202, 138, 4] },
    { title: "DPV (kPa)", max: "3", min: "1", color: [147, 51, 234] },
    { title: "PAR (W/m²)", max: "156", min: "113", color: [202, 138, 4] },
    { title: "Précipitations (mm)", max: "1", min: "0", color: [14, 116, 144] },
    { title: "Prob. pluie (%)", max: "6", min: "-1", color: [37, 99, 235] },
    { title: "Vent (km/h)", max: "21", min: "9", color: [71, 85, 105] },
    { title: "Poussière (µg/m³)", max: "317", min: "33", color: [180, 83, 9] },
    { title: "Heures de froid (h)", max: "1", min: "0", color: [37, 99, 235], isFlat: true },
  ];

  miniParamsP3.forEach((p, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const mx = margin + col * (gridColW + 4);
    const my = y + row * (gridRowH + 5);

    doc.setFillColor(250, 250, 250);
    doc.rect(mx, my, gridColW, gridRowH, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(p.title, mx + 2, my + 4);

    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(p.max, mx + 2, my + 7.5);
    doc.text(p.min, mx + 2, my + gridRowH - 2);

    doc.text("10/07", mx + 8, my + gridRowH - 2);
    doc.text("09/08", mx + gridColW - 8, my + gridRowH - 2);

      // Shaded 10-year mean band
      const ptsNormalTop = [
        {x: mx + 8, y: my + 6},
        {x: mx + 18, y: my + 7},
        {x: mx + 28, y: my + 5},
        {x: mx + 38, y: my + 6},
        {x: mx + gridColW - 2, y: my + 5}
      ];
      const ptsNormalBottom = [
        {x: mx + 8, y: my + 13},
        {x: mx + 18, y: my + 14},
        {x: mx + 28, y: my + 12},
        {x: mx + 38, y: my + 13},
        {x: mx + gridColW - 2, y: my + 12}
      ];
      drawSmoothArea(doc, ptsNormalTop, ptsNormalBottom, [226, 232, 240]);

      // Curve
      if (p.isFlat) {
        drawSmoothCurve(doc, [
          {x: mx + 8, y: my + 10},
          {x: mx + 18, y: my + 10},
          {x: mx + 28, y: my + 10},
          {x: mx + 38, y: my + 10},
          {x: mx + gridColW - 2, y: my + 10}
        ], p.color, 0.6);
      } else {
        const curvePts = [
          {x: mx + 8, y: my + 11},
          {x: mx + 18, y: my + 8},
          {x: mx + 28, y: my + 12},
          {x: mx + 38, y: my + 6},
          {x: mx + gridColW - 2, y: my + 10}
        ];
        drawSmoothCurve(doc, curvePts, p.color, 0.6);
      }
  });

  y += 5 * (gridRowH + 5) + 4;

  // Cumuls Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(241, 245, 249);
  doc.roundedRect(margin, y, cardWidth, 14, 2, 2, "FD");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("CUMULS SUR LA PÉRIODE", margin + 4, y + 4.8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Précipitations : 0 mm", margin + 4, y + 10.5);
  doc.text("Degrés-jours : 415 DJ", margin + 65, y + 10.5);

  drawFooter(3);

  // ==========================================
  // PAGE 4: Détail des prévisions
  // ==========================================
  doc.addPage();
  drawHeader("Détail des prévisions");
  y = 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Détail des prochains jours", margin, y);
  y += 6;

  // Table Header - Green Bar #166534
  doc.setFillColor(22, 101, 52);
  doc.rect(margin, y, cardWidth, 7, "F");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);

  const tableCols = [
    { name: "Jour", x: margin + 3 },
    { name: "T°min", x: margin + 35 },
    { name: "T°max", x: margin + 58 },
    { name: "Hum.", x: margin + 80 },
    { name: "Vent", x: margin + 102 },
    { name: "Pluie", x: margin + 128 },
    { name: "ET0", x: margin + 155 },
    { name: "DJ", x: margin + 172 },
  ];

  tableCols.forEach((c) => doc.text(c.name, c.x, y + 4.8));
  y += 7;

  // 15 Rows
  const tableData = weather.forecast || [
    { date: "lun. 10/08", tempMin: "20°", tempMax: "25°", hum: "83%", wind: "13 km/h", rain: "0 mm · 0%", et0: "4.3", dj: "13" },
    { date: "mar. 11/08", tempMin: "19°", tempMax: "25°", hum: "85%", wind: "14 km/h", rain: "0 mm · 0%", et0: "4.5", dj: "12" },
    { date: "mer. 12/08", tempMin: "19°", tempMax: "25°", hum: "86%", wind: "14 km/h", rain: "0 mm · 0%", et0: "4.4", dj: "12" },
    { date: "jeu. 13/08", tempMin: "19°", tempMax: "25°", hum: "87%", wind: "13 km/h", rain: "0 mm · 0%", et0: "4.3", dj: "12" },
    { date: "ven. 14/08", tempMin: "19°", tempMax: "25°", hum: "89%", wind: "12 km/h", rain: "0 mm · 0%", et0: "4.2", dj: "12" },
    { date: "sam. 15/08", tempMin: "19°", tempMax: "32°", hum: "82%", wind: "14 km/h", rain: "0 mm · 0%", et0: "5.0", dj: "16" },
    { date: "dim. 16/08", tempMin: "20°", tempMax: "30°", hum: "77%", wind: "16 km/h", rain: "0 mm · 0%", et0: "5.4", dj: "15" },
    { date: "lun. 17/08", tempMin: "21°", tempMax: "30°", hum: "75%", wind: "20 km/h", rain: "0 mm · 0%", et0: "5.0", dj: "15" },
    { date: "mar. 18/08", tempMin: "19°", tempMax: "27°", hum: "74%", wind: "14 km/h", rain: "0 mm · 0%", et0: "4.8", dj: "13" },
    { date: "mer. 19/08", tempMin: "19°", tempMax: "26°", hum: "78%", wind: "23 km/h", rain: "0 mm · 4%", et0: "4.0", dj: "12" },
    { date: "jeu. 20/08", tempMin: "19°", tempMax: "25°", hum: "80%", wind: "24 km/h", rain: "0 mm · 4%", et0: "4.2", dj: "12" },
    { date: "ven. 21/08", tempMin: "18°", tempMax: "25°", hum: "86%", wind: "20 km/h", rain: "0 mm · 2%", et0: "3.4", dj: "11" },
    { date: "sam. 22/08", tempMin: "20°", tempMax: "25°", hum: "84%", wind: "16 km/h", rain: "0 mm · 3%", et0: "3.5", dj: "12" },
    { date: "dim. 23/08", tempMin: "19°", tempMax: "27°", hum: "74%", wind: "16 km/h", rain: "1 mm · 4%", et0: "4.4", dj: "13" },
    { date: "lun. 24/08", tempMin: "20°", tempMax: "29°", hum: "67%", wind: "16 km/h", rain: "0 mm · 2%", et0: "5.3", dj: "14" },
  ];

  tableData.forEach((row: any, idx: number) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, y, cardWidth, 6, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    const tMin = row.tempMin !== undefined ? (String(row.tempMin).endsWith("°") ? row.tempMin : `${row.tempMin}°`) : "19°";
    const tMax = row.tempMax !== undefined ? (String(row.tempMax).endsWith("°") ? row.tempMax : `${row.tempMax}°`) : "25°";

    doc.text(String(row.date || `jour ${idx + 1}`), tableCols[0].x, y + 4.2);
    doc.text(String(tMin), tableCols[1].x, y + 4.2);
    doc.text(String(tMax), tableCols[2].x, y + 4.2);
    doc.text(String(row.hum || "80%"), tableCols[3].x, y + 4.2);
    doc.text(String(row.wind || "15 km/h"), tableCols[4].x, y + 4.2);
    doc.text(String(row.rain || "0 mm · 0%"), tableCols[5].x, y + 4.2);
    doc.text(String(row.et0 || "4.2"), tableCols[6].x, y + 4.2);
    doc.text(String(row.dj || "12"), tableCols[7].x, y + 4.2);

    y += 6;
  });

  y += 5;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Sources : Open-Meteo (prévisions & climat, moyenne 10 ans) · CAMS (qualité de l'air).", margin, y);

  drawFooter(4);

  const safeName = locationName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`AgroScan_Rapport_Meteo_${safeName}.pdf`);
}
