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
}

export function generateObservationPDF(obs: ObservationDataForReport): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Header Bar
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

  y = 28;

  // Title Section
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Rapport #${obs.id.substring(0, 8)}`, margin, y);
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
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;
  } else {
    doc.text("Aucune description clinique supplémentaire.", margin, y);
    y += 8;
  }

  // Traitements & Préventions
  if (obs.diagnosis?.treatments && obs.diagnosis.treatments.length > 0) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Recommandations de Traitement Écologique", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    obs.diagnosis.treatments.forEach((trt) => {
      const trtLines = doc.splitTextToSize(`• ${trt}`, pageWidth - 2 * margin);
      doc.text(trtLines, margin + 2, y);
      y += trtLines.length * 4.5 + 1;
    });
    y += 4;
  }

  // Agronomist Notes
  if (obs.notes) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("3. Notes du Technicien / Agronome", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);

    const notesLines = doc.splitTextToSize(obs.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin + 2, y);
    y += notesLines.length * 4.5 + 4;
  }

  // Location GPS
  if (obs.latitude && obs.longitude) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Coordonnées GPS : ${obs.latitude.toFixed(6)}, ${obs.longitude.toFixed(6)}`, margin, y);
    y += 6;
  }

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text("Document généré automatiquement par AgroScan IA · Application d'Analyse Agronomique Terrain", margin, pageHeight - 6);
  doc.text(`Rapport ID: ${obs.id}`, pageWidth - margin, pageHeight - 6, { align: "right" });

  doc.save(`Rapport_AgroScan_${obs.id.substring(0, 8)}.pdf`);
}
