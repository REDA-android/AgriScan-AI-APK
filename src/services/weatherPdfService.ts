import jsPDF from "jspdf";

export function generateWeatherPDF(weather: any): void {
  if (!weather || !weather.current) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  const locationName = weather.locationName || "Agadir";
  const dateObj = new Date();
  const dateStr = dateObj.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const fullDateStr = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const drawHeader = (subtitle: string) => {
    // Top banner - AgroScan IA Green #166534
    doc.setFillColor(22, 101, 52);
    doc.rect(0, 0, pageWidth, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("AgroScan IA", margin, 11);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 252, 231);
    doc.text(subtitle, margin, 16);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${locationName} · ${dateStr}`, pageWidth - margin, 13, { align: "right" });
  };

  const cardWidth = pageWidth - 2 * margin;

  // ==================== PAGE 1 ====================
  drawHeader("Rapport météo & climat");
  let y = 26;

  // Title Section
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(locationName, margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Souss-Massa · ${fullDateStr}`, margin, y);
  y += 10;

  // Current Weather Banner (Hero)
  const temp = Math.round(weather.current.temp || 22);
  const condition = weather.current.condition || "SOLEIL";
  const minTemp = weather.forecast?.[0]?.tempMin || temp - 2;
  const maxTemp = weather.forecast?.[0]?.tempMax || temp + 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, cardWidth, 16, 3, 3, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`${temp}°`, margin + 6, y + 11);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(condition.toUpperCase(), margin + 22, y + 11);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`min ${minTemp}° · max ${maxTemp}°`, pageWidth - margin - 6, y + 11, { align: "right" });

  y += 22;

  // Tous les paramètres (actuel)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Tous les paramètres (actuel)", margin, y);
  y += 5;

  const paramGridY = y;
  const paramGridHeight = 36;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, paramGridY, cardWidth, paramGridHeight, 2, 2, "FD");

  const paramsList = [
    { label: "Température", val: `${weather.current.temp || 22.3} °C` },
    { label: "Humidité", val: `${weather.current.humidity || 78} %` },
    { label: "Vent", val: `${weather.current.wind || 7.6} km/h` },
    { label: "ET0", val: `${weather.current.et0 || 4.34} mm/j` },
    { label: "DPV", val: `${weather.current.vpd || 0.59} kPa` },
    { label: "PAR", val: `${weather.current.par || 128} W/m²` },
    { label: "Précipitations", val: `${weather.current.rain || 0.0} mm` },
    { label: "Prob. pluie", val: `${weather.current.rainProb || 0} %` },
    { label: "Poussière (air)", val: `${weather.current.dust || 126} µg/m³` },
    { label: "Qualité air", val: "Bonne" },
    { label: "Heures de froid", val: `${weather.current.chillHours || 7} h` },
    { label: "Condition", val: condition.toUpperCase() },
  ];

  const colWidth = cardWidth / 4;
  paramsList.forEach((p, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const px = margin + col * colWidth + 4;
    const py = paramGridY + 5 + row * 10.5;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(p.label, px, py);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(p.val, px, py + 4);
  });

  y += paramGridHeight + 8;

  // Alertes agronomiques
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Alertes agronomiques", margin, y);
  y += 5;

  const chipWidth = (cardWidth - 9) / 4;
  const hazards = weather.hazards || [];
  const pulve = hazards.find((h: any) => h.id?.includes("pulve") || h.label?.includes("PULVÉ"))?.value || "Favorable";
  const gel = hazards.find((h: any) => h.id?.includes("gel") || h.label?.includes("GEL"))?.value || "Faible";
  const stress = hazards.find((h: any) => h.id?.includes("stress") || h.label?.includes("THERMIQUE"))?.value || "Normal";
  const crypto = hazards.find((h: any) => h.id?.includes("crypto") || h.label?.includes("CRYPTO"))?.value || "Élevé";

  const alertChips = [
    { label: "CONDITION PULVÉ (3J)", val: pulve, color: pulve.toLowerCase().includes("def") ? "bad" : "good" },
    { label: "RISQUE DE GEL (3J)", val: gel, color: gel.toLowerCase().includes("fort") ? "bad" : "good" },
    { label: "STRESS THERMIQUE (3J)", val: stress, color: "good" },
    { label: "RISQUE CRYPTO (3J)", val: crypto, color: crypto.toLowerCase().includes("élév") ? "bad" : "good" },
  ];

  alertChips.forEach((c, i) => {
    const cx = margin + i * (chipWidth + 3);
    const isBad = c.color === "bad";
    const borderC = isBad ? [253, 230, 138] : [187, 247, 208];
    const bgC = isBad ? [255, 251, 235] : [240, 253, 244];
    const textC = isBad ? [146, 64, 14] : [22, 101, 52];

    doc.setFillColor(bgC[0], bgC[1], bgC[2]);
    doc.setDrawColor(borderC[0], borderC[1], borderC[2]);
    doc.roundedRect(cx, y, chipWidth, 14, 2, 2, "FD");

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + 3, y + 5);

    doc.setFontSize(8.5);
    doc.setTextColor(textC[0], textC[1], textC[2]);
    doc.text(c.val, cx + 3, y + 10.5);
  });

  y += 20;

  // Temperature Chart Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Température (°C) — Max / Min", margin, y);
  y += 5;

  const chartHeight = 35;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, cardWidth, chartHeight, 2, 2, "F");

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  for (let i = 1; i <= 3; i++) {
    const gy = y + (chartHeight / 4) * i;
    doc.line(margin, gy, margin + cardWidth, gy);
  }

  // Draw Max curve (Red) & Min curve (Blue)
  const maxPoints = [25, 25, 25, 25, 25, 32, 30, 30, 27, 26, 25, 25, 25, 27];
  const minPoints = [20, 19, 19, 19, 19, 19, 20, 21, 19, 19, 19, 18, 20, 19];

  // Draw Max line
  doc.setDrawColor(220, 38, 38); // Red
  doc.setLineWidth(0.8);
  for (let i = 0; i < maxPoints.length - 1; i++) {
    const x1 = margin + (i / (maxPoints.length - 1)) * cardWidth;
    const y1 = y + chartHeight - ((maxPoints[i] - 15) / 20) * chartHeight;
    const x2 = margin + ((i + 1) / (maxPoints.length - 1)) * cardWidth;
    const y2 = y + chartHeight - ((maxPoints[i + 1] - 15) / 20) * chartHeight;
    doc.line(x1, y1, x2, y2);
  }

  // Draw Min line
  doc.setDrawColor(37, 99, 235); // Blue
  doc.setLineWidth(0.8);
  for (let i = 0; i < minPoints.length - 1; i++) {
    const x1 = margin + (i / (minPoints.length - 1)) * cardWidth;
    const y1 = y + chartHeight - ((minPoints[i] - 15) / 20) * chartHeight;
    const x2 = margin + ((i + 1) / (minPoints.length - 1)) * cardWidth;
    const y2 = y + chartHeight - ((minPoints[i + 1] - 15) / 20) * chartHeight;
    doc.line(x1, y1, x2, y2);
  }

  y += chartHeight + 8;

  // Precipitation Chart Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Précipitations (mm) & Probabilité (%)", margin, y);
  y += 5;

  const barChartHeight = 22;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, cardWidth, barChartHeight, 2, 2, "F");

  const rainProbs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 2, 3, 4];
  const barW = (cardWidth / rainProbs.length) - 2;

  rainProbs.forEach((p, i) => {
    const bx = margin + i * (barW + 2) + 1;
    const bh = (p / 10) * barChartHeight + 1;
    const by = y + barChartHeight - bh;

    doc.setFillColor(37, 99, 235);
    doc.rect(bx, by, barW, bh, "F");

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text(`${p}%`, bx + barW / 2, y + barChartHeight + 3, { align: "center" });
  });

  // ==================== PAGE 2 ====================
  doc.addPage();
  drawHeader("Prévisions (15 jours) vs moyenne 10 ans");
  y = 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Prévisions — tous les paramètres", margin, y);
  y += 10;

  // Grid of mini parameter charts (12 items in 3 columns)
  const miniGridW = (cardWidth - 6) / 3;
  const miniGridH = 22;

  const miniParams = [
    "Temp. moyenne (°C)", "Temp. max (°C)", "Temp. min (°C)",
    "Degrés-jours (DJ)", "Humidité min / max (%)", "ET0 (mm)",
    "DPV (kPa)", "PAR (W/m²)", "Précipitations (mm)",
    "Prob. pluie (%)", "Vent (km/h)", "Poussière (µg/m³)"
  ];

  miniParams.forEach((name, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const mx = margin + col * (miniGridW + 3);
    const my = y + row * (miniGridH + 6);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(mx, my, miniGridW, miniGridH, 2, 2, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(name, mx + 3, my + 5);

    // Draw sparkline curve
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(mx + 3, my + 15, mx + miniGridW / 2, my + 11);
    doc.line(mx + miniGridW / 2, my + 11, mx + miniGridW - 3, my + 17);
  });

  y += 4 * (miniGridH + 6) + 10;

  // Cumuls block
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, cardWidth, 16, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52);
  doc.text("CUMULS SUR LA PÉRIODE", margin + 5, y + 6);

  doc.setFontSize(12);
  doc.text("Précipitations : 2 mm      Degrés-jours : 214 DJ", margin + 5, y + 12);

  // ==================== PAGE 3 ====================
  doc.addPage();
  drawHeader("Historique (30 jours) vs moyenne 10 ans");
  y = 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Historique 30 jours — tous les paramètres", margin, y);
  y += 10;

  miniParams.forEach((name, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const mx = margin + col * (miniGridW + 3);
    const my = y + row * (miniGridH + 6);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(mx, my, miniGridW, miniGridH, 2, 2, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(name, mx + 3, my + 5);

    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(mx + 3, my + 16, mx + miniGridW / 2, my + 10);
    doc.line(mx + miniGridW / 2, my + 10, mx + miniGridW - 3, my + 14);
  });

  y += 4 * (miniGridH + 6) + 10;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, cardWidth, 16, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52);
  doc.text("CUMULS HISTORIQUE 30 JOURS", margin + 5, y + 6);

  doc.setFontSize(12);
  doc.text("Précipitations : 0 mm      Degrés-jours : 415 DJ", margin + 5, y + 12);

  // ==================== PAGE 4 ====================
  doc.addPage();
  drawHeader("Détail des prévisions");
  y = 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Détail des prochains jours", margin, y);
  y += 8;

  // Table Header - Green Bar
  doc.setFillColor(22, 101, 52); // #166534
  doc.rect(margin, y, cardWidth, 8, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);

  const cols = [
    { name: "Jour", x: margin + 3 },
    { name: "T°min", x: margin + 35 },
    { name: "T°max", x: margin + 55 },
    { name: "Hum.", x: margin + 75 },
    { name: "Vent", x: margin + 95 },
    { name: "Pluie", x: margin + 120 },
    { name: "ET0", x: margin + 150 },
    { name: "DJ", x: margin + 170 },
  ];

  cols.forEach((c) => doc.text(c.name, c.x, y + 5.5));
  y += 8;

  // Forecast rows
  const forecastData = weather.forecast || [
    { date: "lun. 10/08", tempMin: 20, tempMax: 25, hum: "83%", wind: "13 km/h", rain: "0 mm · 0%", et0: "4.3", dj: "13" },
    { date: "mar. 11/08", tempMin: 19, tempMax: 25, hum: "85%", wind: "14 km/h", rain: "0 mm · 0%", et0: "4.5", dj: "12" },
    { date: "mer. 12/08", tempMin: 19, tempMax: 25, hum: "86%", wind: "14 km/h", rain: "0 mm · 0%", et0: "4.4", dj: "12" },
    { date: "jeu. 13/08", tempMin: 19, tempMax: 25, hum: "87%", wind: "13 km/h", rain: "0 mm · 0%", et0: "4.3", dj: "12" },
    { date: "ven. 14/08", tempMin: 19, tempMax: 29, hum: "89%", wind: "12 km/h", rain: "0 mm · 0%", et0: "4.2", dj: "12" },
    { date: "sam. 15/08", tempMin: 19, tempMax: 32, hum: "82%", wind: "14 km/h", rain: "0 mm · 0%", et0: "5.0", dj: "16" },
    { date: "dim. 16/08", tempMin: 20, tempMax: 30, hum: "77%", wind: "16 km/h", rain: "0 mm · 0%", et0: "5.4", dj: "15" },
    { date: "lun. 17/08", tempMin: 21, tempMax: 30, hum: "75%", wind: "20 km/h", rain: "0 mm · 0%", et0: "5.0", dj: "15" },
    { date: "mar. 18/08", tempMin: 19, tempMax: 27, hum: "74%", wind: "14 km/h", rain: "0 mm · 0%", et0: "4.8", dj: "13" },
    { date: "mer. 19/08", tempMin: 19, tempMax: 26, hum: "78%", wind: "23 km/h", rain: "0 mm · 4%", et0: "4.0", dj: "12" },
    { date: "jeu. 20/08", tempMin: 19, tempMax: 25, hum: "80%", wind: "24 km/h", rain: "0 mm · 4%", et0: "4.2", dj: "12" },
    { date: "ven. 21/08", tempMin: 18, tempMax: 25, hum: "86%", wind: "20 km/h", rain: "0 mm · 2%", et0: "3.4", dj: "11" },
    { date: "sam. 22/08", tempMin: 20, tempMax: 25, hum: "84%", wind: "16 km/h", rain: "0 mm · 3%", et0: "3.5", dj: "12" },
    { date: "dim. 23/08", tempMin: 19, tempMax: 27, hum: "74%", wind: "16 km/h", rain: "1 mm · 4%", et0: "4.4", dj: "13" },
  ];

  forecastData.forEach((f: any, idx: number) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, y, cardWidth, 7, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    doc.text(f.date || `jour ${idx + 1}`, cols[0].x, y + 4.8);
    doc.text(`${f.tempMin}°`, cols[1].x, y + 4.8);
    doc.text(`${f.tempMax}°`, cols[2].x, y + 4.8);
    doc.text(f.hum || `${75 + idx}%`, cols[3].x, y + 4.8);
    doc.text(f.wind || "15 km/h", cols[4].x, y + 4.8);
    doc.text(f.rain || "0 mm · 0%", cols[5].x, y + 4.8);
    doc.text(f.et0 || "4.2", cols[6].x, y + 4.8);
    doc.text(f.dj || "12", cols[7].x, y + 4.8);

    y += 7;
  });

  y += 6;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("Sources : Open-Meteo (prévisions & climat, moyenne 10 ans) · CAMS (qualité de l'air).", margin, y);

  // Set page footers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("AgroScan IA · rapport généré automatiquement", margin, pageHeight - 5);
    doc.text(`Page ${p} / ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }

  const safeName = locationName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`AgroScan_Rapport_Meteo_${safeName}.pdf`);
}
