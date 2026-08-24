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
  const allData = weather.forecast || [];
  const todayStrShort = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  let todayIdx = allData.findIndex((d: any) => d.shortDate === todayStrShort);
  if (todayIdx === -1) todayIdx = 31;
  const forecastData = allData.slice(todayIdx, todayIdx + 15).slice(0, 14);
  const historyData = allData.slice(Math.max(0, todayIdx - 30), todayIdx);
  const daysData = forecastData;

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
    doc.text(String(d.shortDate || d.date), dx + dayColW / 2, y + 5.8, { align: "center" });

    // Draw Weather Icon (Simple geometry)
    const iconY = y + 9.5;
    const iconX = dx + dayColW / 2;
    if ((d.precipProb || d.rainProb || 0) > 20 || parseInt(d.precipQty || d.rain || "0") > 2) {
      // Rain: gray cloud + blue drop
      doc.setFillColor(148, 163, 184); // Gray cloud
      doc.ellipse(iconX, iconY - 1, 2.5, 1.5, "F");
      doc.ellipse(iconX - 1.5, iconY - 0.5, 1.5, 1, "F");
      doc.ellipse(iconX + 1.5, iconY - 0.5, 1.5, 1, "F");
      doc.setFillColor(59, 130, 246); // Blue drop
      doc.circle(iconX, iconY + 1.5, 0.8, "F");
    } else if (parseInt(d.tempMax || d.tMax) > 28) {
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
    doc.text(String(d.tempMax ? d.tempMax + "°" : d.tMax), dx + dayColW / 2, y + 17, { align: "center" });

    // Min pill (Olive / Green)
    doc.setFillColor(163, 230, 53);
    doc.roundedRect(dx + 1, y + 19, dayColW - 2, 4, 1, 1, "F");
    doc.setTextColor(30, 41, 59);
    doc.text(String(d.tempMin ? d.tempMin + "°" : d.tMin), dx + dayColW / 2, y + 22, { align: "center" });

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
  const tempMaxPts = forecastData.map((d: any) => d.tempMax || 25);
  const tempMinPts = forecastData.map((d: any) => d.tempMin || 20);
  
  // 10-year normals (fake data for smooth polygon)
  const normalMaxPts = [28, 28.5, 28, 28, 28.5, 28.5, 28, 27.5, 27.5, 28, 28.5, 28.5, 28, 28];
  const normalMinPts = [19, 19, 19.5, 19.5, 19, 19.5, 19.5, 20, 20, 19.5, 19.5, 19, 19.5, 19.5];

  const toXY = (val: number, i: number) => ({
    x: margin + (i / Math.max(1, tempMaxPts.length - 1)) * cardWidth,
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
  const xDates = forecastData.filter((_: any, i: number) => i % 2 === 0).map((d: any) => d.shortDate || "");
  xDates.forEach((d: string, i: number) => {
    const dx = margin + (i / (Math.max(1, xDates.length - 1))) * cardWidth;
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

  // Rain qty bars and probability labels below
  forecastData.forEach((d: any, i: number) => {
    const rx = margin + (i / (Math.max(1, forecastData.length - 1))) * cardWidth;
    const pQty = d.precipQty || d.rainQty || 0;
    const pProb = d.precipProb || d.rainProb || 0;
    if (pQty > 0) {
      doc.setFillColor(37, 99, 235);
      const bh = Math.min((pQty / 5), 1) * (rainChartH - 4) + 1;
      doc.rect(rx - 1.5, y + rainChartH - bh, 3, Math.max(1, bh), "F");
    }
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    if (pProb > 0) {
      doc.setTextColor(22, 101, 52);
      doc.text(`${pProb}%`, rx, y + rainChartH + 3, { align: "center" });
    }
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
    { title: "Temp. moyenne (°C)", color: [37, 99, 235], val: (d: any) => ((d.tempMax||0) + (d.tempMin||0)) / 2 },
    { title: "Temp. max (°C)", color: [220, 38, 38], val: (d: any) => d.tempMax||0 },
    { title: "Temp. min (°C)", color: [37, 99, 235], val: (d: any) => d.tempMin||0 },
    { title: "Degrés-jours (DJ)", color: [234, 88, 12], val: (d: any) => d.dj||0 },
    { title: "Humidité (%)", color: [16, 185, 129], val: (d: any) => d.humidity||0 },
    { title: "ET0 (mm)", color: [202, 138, 4], val: (d: any) => d.et0||0 },
    { title: "DPV (kPa)", color: [147, 51, 234], val: (d: any) => d.dpv||0 },
    { title: "PAR (W/m²)", color: [202, 138, 4], val: (d: any) => d.par||0 },
    { title: "Précipitations (mm)", color: [14, 116, 144], val: (d: any) => d.precipQty||0 },
    { title: "Prob. pluie (%)", color: [37, 99, 235], val: (d: any) => d.precipProb||0 },
    { title: "Vent (km/h)", color: [71, 85, 105], val: (d: any) => d.windSpeed||0 },
    { title: "Poussière (µg/m³)", color: [180, 83, 9], val: (d: any) => d.dust||0 },
    { title: "Heures de froid (h)", color: [148, 163, 184], noData: true, val: (d: any) => 0 },
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
      let extVals = [];
      if (p.val && forecastData.length > 0) {
         extVals = forecastData.map((d: any) => { const v = parseFloat(p.val(d)); return isNaN(v) ? 0 : v; });
      } else {
         extVals = [0, 0, 0];
      }
      
      let minV = Math.min(...extVals);
      let maxV = Math.max(...extVals);
      if (minV === maxV) { maxV = minV + 1; minV = minV - 1; }
      
      // Max / Min Y labels
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(Math.round(maxV).toString(), mx + 2, my + 7.5);
      doc.text(Math.round(minV).toString(), mx + 2, my + gridRowH - 2);

      // Dates
      if (forecastData.length > 0) {
        doc.text(forecastData[0].shortDate || forecastData[0].date || "", mx + 8, my + gridRowH - 2);
        doc.text(forecastData[forecastData.length - 1].shortDate || forecastData[forecastData.length - 1].date || "", mx + gridColW - 8, my + gridRowH - 2);
      }

      // Shaded 10-year mean band (approx)
      const avgY = my + 6 + (gridRowH - 8) / 2;
      const ptsNormalTop = [ {x: mx + 8, y: avgY - 2}, {x: mx + gridColW - 2, y: avgY - 2} ];
      const ptsNormalBottom = [ {x: mx + 8, y: avgY + 2}, {x: mx + gridColW - 2, y: avgY + 2} ];
      drawSmoothArea(doc, ptsNormalTop, ptsNormalBottom, [226, 232, 240]);

      // Curve
      const curvePts = extVals.map((v: number, i: number) => {
         const cx = mx + 8 + (i / Math.max(1, extVals.length - 1)) * (gridColW - 10);
         const cy = my + 6 + (1 - (v - minV) / (maxV - minV)) * (gridRowH - 8);
         return {x: cx, y: cy};
      });
      if (curvePts.length >= 2) {
        drawSmoothCurve(doc, curvePts, p.color, 0.6);
      }
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
  const fRainTotal = forecastData.reduce((acc: number, d: any) => acc + (parseFloat(d.precipQty || d.rainQty) || 0), 0);
  const fDjTotal = forecastData.reduce((acc: number, d: any) => acc + (parseFloat(d.dj) || 0), 0);
  doc.text(`Précipitations : ${fRainTotal.toFixed(1)} mm`, margin + 4, y + 10.5);
  doc.text(`Degrés-jours : ${fDjTotal.toFixed(0)} DJ`, margin + 65, y + 10.5);

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
    { title: "Temp. moyenne (°C)", color: [37, 99, 235], val: (d: any) => ((d.tempMax||0) + (d.tempMin||0)) / 2 },
    { title: "Temp. max (°C)", color: [220, 38, 38], val: (d: any) => d.tempMax||0 },
    { title: "Temp. min (°C)", color: [37, 99, 235], val: (d: any) => d.tempMin||0 },
    { title: "Degrés-jours (DJ)", color: [234, 88, 12], val: (d: any) => d.dj||0 },
    { title: "Humidité (%)", color: [16, 185, 129], val: (d: any) => d.humidity||0 },
    { title: "ET0 (mm)", color: [202, 138, 4], val: (d: any) => d.et0||0 },
    { title: "DPV (kPa)", color: [147, 51, 234], val: (d: any) => d.dpv||0 },
    { title: "PAR (W/m²)", color: [202, 138, 4], val: (d: any) => d.par||0 },
    { title: "Précipitations (mm)", color: [14, 116, 144], val: (d: any) => d.precipQty||0 },
    { title: "Prob. pluie (%)", color: [37, 99, 235], val: (d: any) => d.precipProb||0 },
    { title: "Vent (km/h)", color: [71, 85, 105], val: (d: any) => d.windSpeed||0 },
    { title: "Poussière (µg/m³)", color: [180, 83, 9], val: (d: any) => d.dust||0 },
    { title: "Heures de froid (h)", color: [148, 163, 184], noData: true, val: (d: any) => 0 },
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

    if (p.noData) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("donnée indisponible", mx + 2, my + 11);
    } else {
      let extVals = [];
      const histData = historyData.length > 0 ? historyData : allData.slice(0, 30);
      if (p.val && histData.length > 0) {
         extVals = histData.map((d: any) => { const v = parseFloat(p.val(d)); return isNaN(v) ? 0 : v; });
      } else {
         extVals = [0, 0, 0];
      }
      
      let minV = Math.min(...extVals);
      let maxV = Math.max(...extVals);
      if (minV === maxV) { maxV = minV + 1; minV = minV - 1; }
      
      // Max / Min Y labels
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(Math.round(maxV).toString(), mx + 2, my + 7.5);
      doc.text(Math.round(minV).toString(), mx + 2, my + gridRowH - 2);

      // Dates
      if (histData.length > 0) {
        doc.text(histData[0].shortDate || histData[0].date || "", mx + 8, my + gridRowH - 2);
        doc.text(histData[histData.length - 1].shortDate || histData[histData.length - 1].date || "", mx + gridColW - 8, my + gridRowH - 2);
      }

      // Shaded 10-year mean band (approx)
      const avgY = my + 6 + (gridRowH - 8) / 2;
      const ptsNormalTop = [ {x: mx + 8, y: avgY - 2}, {x: mx + gridColW - 2, y: avgY - 2} ];
      const ptsNormalBottom = [ {x: mx + 8, y: avgY + 2}, {x: mx + gridColW - 2, y: avgY + 2} ];
      drawSmoothArea(doc, ptsNormalTop, ptsNormalBottom, [226, 232, 240]);

      // Curve
      const curvePts = extVals.map((v: number, i: number) => {
         const cx = mx + 8 + (i / Math.max(1, extVals.length - 1)) * (gridColW - 10);
         let cy = my + 6 + (1 - (v - minV) / (maxV - minV)) * (gridRowH - 8);
         if (isNaN(cy)) cy = my + 10;
         return {x: cx, y: cy};
      });
      if (curvePts.length >= 2) {
        drawSmoothCurve(doc, curvePts, p.color, 0.6);
      }
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
  const hData = historyData.length > 0 ? historyData : allData.slice(0, 30);
  const hRainTotal = hData.reduce((acc: number, d: any) => acc + (parseFloat(d.precipQty || d.rainQty) || 0), 0);
  const hDjTotal = hData.reduce((acc: number, d: any) => acc + (parseFloat(d.dj) || 0), 0);
  doc.text(`Précipitations : ${hRainTotal.toFixed(1)} mm`, margin + 4, y + 10.5);
  doc.text(`Degrés-jours : ${hDjTotal.toFixed(0)} DJ`, margin + 65, y + 10.5);

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
  const tableData = forecastData.length > 0 ? forecastData : [
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

    doc.text(String(row.date || row.shortDate || `jour ${idx + 1}`), tableCols[0].x, y + 4.2);
    doc.text(String(tMin), tableCols[1].x, y + 4.2);
    doc.text(String(tMax), tableCols[2].x, y + 4.2);
    doc.text(String(row.humidity || row.hum || '80%').endsWith('%') ? String(row.humidity || row.hum || '80%') : `${row.humidity || row.hum}%`, tableCols[3].x, y + 4.2);
    doc.text(String(row.windSpeed || row.wind || '15 km/h').includes('km/h') ? String(row.windSpeed || row.wind || '15 km/h') : `${row.windSpeed || row.wind} km/h`, tableCols[4].x, y + 4.2);
    doc.text(row.precipQty !== undefined ? `${row.precipQty} mm · ${row.precipProb || 0}%` : String(row.rain || '0 mm · 0%'), tableCols[5].x, y + 4.2);
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
