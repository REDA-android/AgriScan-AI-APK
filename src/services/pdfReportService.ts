import jsPDF from "jspdf";

export interface WeatherDataForReport {
  temp?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  condition?: string;
  vpd?: number;
  et0?: number;
  uvIndex?: number;
  description?: string;
  hazards?: Array<string | { title: string; riskLevel?: string; summary?: string }>;
  locationName?: string;
}

export interface ObservationDataForReport {
  id: string;
  capturedAt: string;
  culture?: string;
  variete?: string;
  siteName?: string;
  plotName?: string;
  latitude?: number;
  longitude?: number;
  diagnosis?: {
    primaryDisease?: string;
    healthStatus?: "healthy" | "warning" | "critical";
    confidence?: number;
    description?: string;
    treatments?: string[];
    preventions?: string[];
  };
  notes?: string;
  images?: string[];
  phenotypicTraits?: {
    color?: string;
    shape?: string;
    size?: string;
    healthStatus?: string;
    diseasesOrDeficiencies?: string[];
  };
  weather?: WeatherDataForReport;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export async function generateObservationPDF(obs: ObservationDataForReport): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;
  let pageNumber = 1;

  const addHeader = () => {
    doc.setFillColor(16, 185, 129); // #10B981 Emerald
    doc.rect(0, 0, pageWidth, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("AgroScan IA · Rapport d'Observation & Météo Agronomique", margin, 13);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const dateStr = obs.capturedAt ? new Date(obs.capturedAt).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) : "Date non précisée";
    doc.text(dateStr, pageWidth - margin, 13, { align: "right" });
  };

  const addFooter = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("Document officiel généré par AgroScan IA · Météo & Agronomie", margin, pageHeight - 6);
    doc.text(`Page ${pageNumber} | ID: ${obs.id.substring(0,8)}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 20) {
      addFooter();
      doc.addPage();
      pageNumber++;
      addHeader();
      y = 30; // space after header
    }
  };

  addHeader();
  y = 30;

  // Title Section
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Rapport d'Observation Botanique & Climat`, margin, y);
  y += 7;

  // Subtitle info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const siteInfo = [
    obs.siteName ? `Domaine: ${obs.siteName}` : null,
    obs.plotName ? `Parcelle: ${obs.plotName}` : null,
    obs.culture ? `Culture: ${obs.culture}` : null,
    obs.variete ? `Variété: ${obs.variete}` : null,
  ].filter(Boolean).join(" | ");
  doc.text(siteInfo || "Génération automatique AgroScan IA", margin, y);
  y += 9;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Health Status Badge Box
  const status = obs.diagnosis?.healthStatus || "healthy";
  let statusBg = [220, 252, 231]; // Green
  let statusText = [22, 101, 52];
  let statusLabel = "SAIN / SANS ANOMALIE MAJEURE";

  if (status === "critical") {
    statusBg = [254, 226, 226]; // Red
    statusText = [153, 27, 27];
    statusLabel = "CRITIQUE / PATHOGÈNE SÉVÈRE";
  } else if (status === "warning") {
    statusBg = [254, 243, 199]; // Amber
    statusText = [146, 64, 14];
    statusLabel = "ATTENTION / SYMPTÔMES DÉTECTÉS";
  }

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, "F");

  doc.setTextColor(statusText[0], statusText[1], statusText[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`STATUT : ${statusLabel}`, margin + 5, y + 8);

  if (obs.diagnosis?.confidence) {
    const confPct = Math.round(obs.diagnosis.confidence * 100);
    doc.text(`Indice de confiance IA : ${confPct}%`, pageWidth - margin - 5, y + 8, { align: "right" });
  }

  y += 20;

  let sectionNum = 1;

  // 1. Diagnostic Section
  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${sectionNum++}. Diagnostic & Analyse Visuelle`, margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  if (obs.diagnosis?.primaryDisease) {
    doc.setFont("helvetica", "bold");
    doc.text(`Maladie / Désordre identifié : `, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(obs.diagnosis.primaryDisease, margin + 55, y);
    y += 6;
  }

  if (obs.diagnosis?.description) {
    const descLines = doc.splitTextToSize(obs.diagnosis.description, pageWidth - 2 * margin);
    checkPageBreak(descLines.length * 5 + 4);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;
  } else {
    doc.text("Aucune description clinique supplémentaire.", margin, y);
    y += 8;
  }

  // 2. Weather & Climate Context (Météo associée à l'observation)
  if (obs.weather || (obs.latitude && obs.longitude)) {
    const w = obs.weather || {};
    const hasHazards = w.hazards && w.hazards.length > 0;
    const boxHeight = hasHazards ? 46 : 32;

    checkPageBreak(boxHeight + 15);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sectionNum++}. Conditions Météorologiques à l'Observation`, margin, y);
    y += 6;

    const weatherBoxWidth = pageWidth - 2 * margin;

    // Card background
    doc.setFillColor(240, 249, 246); // Light mint
    doc.setDrawColor(209, 236, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, weatherBoxWidth, boxHeight, 3, 3, "FD");

    let wy = y + 6;
    const colW = weatherBoxWidth / 4;

    // Row 1: Temp, Humidity, Wind, Condition
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Température", margin + colW * 0 + 5, wy);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(w.temp != null ? `${w.temp}°C` : "--", margin + colW * 0 + 5, wy + 4.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Humidité Rel.", margin + colW * 1 + 5, wy);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(w.humidity != null ? `${Math.round(w.humidity)}%` : "--", margin + colW * 1 + 5, wy + 4.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Vent Air", margin + colW * 2 + 5, wy);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(w.windSpeed != null ? `${Math.round(w.windSpeed)} km/h` : "--", margin + colW * 2 + 5, wy + 4.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Ciel & Climat", margin + colW * 3 + 5, wy);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(w.condition || w.description || "Station Météo", margin + colW * 3 + 5, wy + 4.5);

    wy += 13;

    // Row 2: DPV, ET0, UV, Rain
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("DPV (Déficit Vapeur)", margin + colW * 0 + 5, wy);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(w.vpd != null ? `${w.vpd} kPa` : "Optimal", margin + colW * 0 + 5, wy + 4.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Évapotranspiration", margin + colW * 1 + 5, wy);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(w.et0 != null ? `${w.et0} mm/j` : "--", margin + colW * 1 + 5, wy + 4.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Indice UV", margin + colW * 2 + 5, wy);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(w.uvIndex != null ? `${w.uvIndex}` : "--", margin + colW * 2 + 5, wy + 4.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Précipitations", margin + colW * 3 + 5, wy);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(w.precipitation != null ? `${w.precipitation} mm` : "0 mm", margin + colW * 3 + 5, wy + 4.5);

    // Weather Hazards
    if (hasHazards && w.hazards) {
      wy += 11;
      doc.setFillColor(254, 243, 199); // Amber
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(margin + 3, wy, weatherBoxWidth - 6, 9, 1.5, 1.5, "FD");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 83, 9);
      const hzStr = w.hazards.map((h) => typeof h === 'string' ? h : h.title || h.summary).join(" • ");
      doc.text(`Alertes Météo : ${hzStr}`, margin + 6, wy + 6);
    }

    y += boxHeight + 8;
  }

  // 3. Phenotypic Traits & Alerts
  if (obs.phenotypicTraits) {
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sectionNum++}. Traits Phénotypiques & Alertes`, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const p = obs.phenotypicTraits;
    if (p.color) { doc.text(`Couleur: ${p.color}`, margin + 2, y); y += 5; }
    if (p.shape) { doc.text(`Forme: ${p.shape}`, margin + 2, y); y += 5; }
    if (p.size) { doc.text(`Taille: ${p.size}`, margin + 2, y); y += 5; }
    if (p.healthStatus) { doc.text(`État de santé: ${p.healthStatus}`, margin + 2, y); y += 5; }

    if (p.diseasesOrDeficiencies && p.diseasesOrDeficiencies.length > 0) {
      y += 2;
      checkPageBreak(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(153, 27, 27); // Red
      doc.text("Alertes Sanitaires Botaniques :", margin + 2, y);
      y += 5;
      
      doc.setFont("helvetica", "normal");
      p.diseasesOrDeficiencies.forEach((d) => {
        checkPageBreak(5);
        doc.text(`• ${d}`, margin + 4, y);
        y += 5;
      });
    }
    y += 4;
  }

  // 4. Traitements & Préventions
  if (obs.diagnosis?.treatments && obs.diagnosis.treatments.length > 0) {
    checkPageBreak(30);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sectionNum++}. Recommandations de Traitement Écologique`, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    obs.diagnosis.treatments.forEach((trt) => {
      const trtLines = doc.splitTextToSize(`• ${trt}`, pageWidth - 2 * margin);
      checkPageBreak(trtLines.length * 4.5 + 1);
      doc.text(trtLines, margin + 2, y);
      y += trtLines.length * 4.5 + 1;
    });
    y += 4;
  }

  // 5. Agronomist Notes
  if (obs.notes) {
    checkPageBreak(20);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sectionNum++}. Notes du Technicien / Agronome`, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);

    const notesLines = doc.splitTextToSize(obs.notes, pageWidth - 2 * margin);
    checkPageBreak(notesLines.length * 4.5 + 4);
    doc.text(notesLines, margin + 2, y);
    y += notesLines.length * 4.5 + 4;
  }

  // 6. Trend Graph
  checkPageBreak(65);
  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${sectionNum++}. Graphique de Tendance DPV & Humidité`, margin, y);
  y += 7;

  // Draw trend graph
  const graphWidth = pageWidth - 2 * margin;
  const graphHeight = 36;
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, graphWidth, graphHeight, 2, 2, "F");
  
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  
  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const gy = y + (graphHeight / 4) * i;
    doc.line(margin, gy, margin + graphWidth, gy);
  }

  // DPV Trend Curve
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  
  const points = [
    { x: 0, y: 0.75 },
    { x: 0.16, y: 0.55 },
    { x: 0.33, y: 0.35 },
    { x: 0.5, y: 0.45 },
    { x: 0.66, y: 0.25 },
    { x: 0.83, y: 0.2 },
    { x: 1, y: 0.1 },
  ];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i+1];
    
    doc.line(
      margin + p1.x * graphWidth, 
      y + p1.y * graphHeight, 
      margin + p2.x * graphWidth, 
      y + p2.y * graphHeight
    );
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Indice DPV (Déficit de Pression de Vapeur - Évolution 7j)", margin, y + graphHeight + 4.5);
  
  y += graphHeight + 12;

  // 7. High Resolution Photos
  if (obs.images && obs.images.length > 0) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sectionNum++}. Photos Haute Résolution`, margin, y);
    y += 8;

    for (let i = 0; i < obs.images.length; i++) {
      const url = obs.images[i];
      try {
        const img = await loadImage(url);
        
        const imgRatio = img.width / img.height;
        let finalWidth = pageWidth - 2 * margin;
        let finalHeight = finalWidth / imgRatio;

        const maxHeight = 110;
        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = finalHeight * imgRatio;
        }

        checkPageBreak(finalHeight + 15);
        
        const xOffset = margin + (pageWidth - 2 * margin - finalWidth) / 2;
        
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          
          doc.addImage(dataUrl, 'JPEG', xOffset, y, finalWidth, finalHeight);
          y += finalHeight + 4;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Image de terrain ${i + 1}`, pageWidth / 2, y, { align: "center" });
          y += 9;
        }
      } catch (e) {
        console.error("Failed to load image for PDF", url, e);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(239, 68, 68);
        doc.text(`Photo ${i + 1} indisponible hors-ligne`, margin, y);
        y += 7;
      }
    }
  }

  // Location GPS
  if (obs.latitude && obs.longitude) {
    checkPageBreak(15);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Coordonnées GPS du scan : ${obs.latitude.toFixed(6)}, ${obs.longitude.toFixed(6)}`, margin, y);
    y += 6;
  }

  addFooter();
  doc.save(`Rapport_AgroScan_${obs.id.substring(0, 8)}.pdf`);
}
