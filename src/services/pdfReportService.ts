import jsPDF from "jspdf";

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
    doc.setFillColor(60, 140, 87); // #3C8C57 Green
    doc.rect(0, 0, pageWidth, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("AgroScan IA · Rapport d'Observation Agronomique", margin, 13);

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
    doc.text("Document généré automatiquement par AgroScan IA", margin, pageHeight - 6);
    doc.text(`Page ${pageNumber} | Rapport ID: ${obs.id.substring(0,8)}`, pageWidth - margin, pageHeight - 6, { align: "right" });
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
  doc.text(`Rapport d'Observation`, margin, y);
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
  doc.text(siteInfo || "Génération automatique AgroScan", margin, y);
  y += 10;

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

  // Diagnostic Section
  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Diagnostic & Analyse Visuelle", margin, y);
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

  // Phenotypic Traits & Alerts
  if (obs.phenotypicTraits) {
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Traits Phénotypiques & Alertes", margin, y);
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
      doc.text("Alertes Sanitaires :", margin + 2, y);
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

  let sectionNum = 3;

  // Traitements & Préventions
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

  // Agronomist Notes
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

  // Trend Graph (Simulated)
  checkPageBreak(80);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${sectionNum++}. Graphique de Tendance Environnementale`, margin, y);
  y += 8;

  // Draw a simulated trend graph with jsPDF lines
  const graphWidth = pageWidth - 2 * margin;
  const graphHeight = 40;
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, graphWidth, graphHeight, 2, 2, "F");
  
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.2);
  
  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const gy = y + (graphHeight / 4) * i;
    doc.line(margin, gy, margin + graphWidth, gy);
  }

  // DPV Trend Data (Mocked recent trend)
  doc.setDrawColor(16, 185, 129); // Emerald 500
  doc.setLineWidth(1);
  
  const points = [
    { x: 0, y: 0.8 },
    { x: 0.16, y: 0.6 },
    { x: 0.33, y: 0.4 },
    { x: 0.5, y: 0.5 },
    { x: 0.66, y: 0.3 },
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
  doc.text("Évolution DPV (Déficit de Pression de Vapeur) - 7 derniers jours", margin, y + graphHeight + 5);
  
  y += graphHeight + 15;

  // High Resolution Photos
  if (obs.images && obs.images.length > 0) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sectionNum++}. Photos Haute Résolution`, margin, y);
    y += 8;

    for (let i = 0; i < obs.images.length; i++) {
      const url = obs.images[i];
      try {
        const img = await loadImage(url);
        
        // Calculate aspect ratio
        const imgRatio = img.width / img.height;
        let finalWidth = pageWidth - 2 * margin;
        let finalHeight = finalWidth / imgRatio;

        // If it's too tall, constrain by height instead
        const maxHeight = 120;
        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = finalHeight * imgRatio;
        }

        checkPageBreak(finalHeight + 15);
        
        // Center the image
        const xOffset = margin + (pageWidth - 2 * margin - finalWidth) / 2;
        
        // Create an empty canvas to get base64
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          
          doc.addImage(dataUrl, 'JPEG', xOffset, y, finalWidth, finalHeight);
          y += finalHeight + 5;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Image ${i + 1}`, pageWidth / 2, y, { align: "center" });
          y += 10;
        }
      } catch (e) {
        console.error("Failed to load image for PDF", url, e);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(239, 68, 68);
        doc.text(`Impossible de charger l'image ${i + 1}`, margin, y);
        y += 8;
      }
    }
  }

  // Location GPS
  if (obs.latitude && obs.longitude) {
    checkPageBreak(20);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Coordonnées GPS : ${obs.latitude.toFixed(6)}, ${obs.longitude.toFixed(6)}`, margin, y);
    y += 6;
  }

  addFooter();
  doc.save(`Rapport_AgroScan_${obs.id.substring(0, 8)}.pdf`);
}
