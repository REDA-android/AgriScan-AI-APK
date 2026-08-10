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
  const margin = 12;
  let y = margin;

  const dateObj = obs.capturedAt ? new Date(obs.capturedAt) : new Date();
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

  const locationText = obs.siteName || "Agadir";

  // Header Bar drawing helper
  const drawHeader = () => {
    // Primary header background: AgroScan Dark Green #166534
    doc.setFillColor(22, 101, 52);
    doc.rect(0, 0, pageWidth, 20, "F");

    // Title left
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("AgroScan IA", margin, 11);

    // Subtitle left
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 252, 231); // light green
    doc.text("Rapport d'observation & diagnostic", margin, 16);

    // Location / Date right
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${locationText} · ${dateStr}`, pageWidth - margin, 13, { align: "right" });
  };

  drawHeader();
  y = 26;

  // Title Section
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const mainTitle = obs.culture ? `Observation : ${obs.culture}` : "Rapport d'Observation Agronomique";
  doc.text(mainTitle, margin, y);
  y += 6;

  // Subtitle info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const subText = `${obs.siteName || "Domaine Inconnu"}${obs.plotName ? ` · Parcelle ${obs.plotName}` : ""} · ${fullDateStr}`;
  doc.text(subText, margin, y);
  y += 10;

  // Hero Status Card
  const status = obs.diagnosis?.healthStatus || "healthy";
  let statusBg = [240, 253, 244]; // Light green fill
  let statusBorder = [187, 247, 208];
  let statusText = [22, 101, 52];
  let statusLabel = "SAIN / SANS ANOMALIE";

  if (status === "critical") {
    statusBg = [254, 242, 242];
    statusBorder = [254, 202, 202];
    statusText = [153, 27, 27];
    statusLabel = "CRITIQUE / PATHOGÈNE SÉVÈRE";
  } else if (status === "warning") {
    statusBg = [255, 251, 235];
    statusBorder = [253, 230, 138];
    statusText = [146, 64, 14];
    statusLabel = "ATTENTION / SYMPTÔMES DÉTECTÉS";
  }

  const cardWidth = pageWidth - 2 * margin;
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.setDrawColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, cardWidth, 18, 3, 3, "FD");

  doc.setTextColor(statusText[0], statusText[1], statusText[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`DIAGNOSTIC : ${statusLabel}`, margin + 5, y + 11);

  if (obs.diagnosis?.confidence) {
    const confPct = Math.round(obs.diagnosis.confidence * 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Confiance IA : ${confPct}%`, pageWidth - margin - 5, y + 11, { align: "right" });
  }

  y += 24;

  // Section: Tous les paramètres (actuel)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Tous les paramètres de l'observation", margin, y);
  y += 5;

  // Parameter grid box
  const gridY = y;
  const gridHeight = 32;
  doc.setFillColor(248, 250, 252); // #f8faf9
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, gridY, cardWidth, gridHeight, 2, 2, "FD");

  const colWidth = cardWidth / 4;
  const params = [
    { label: "Culture", val: obs.culture || "Inconnue" },
    { label: "Variété", val: obs.variete || "Non spécifiée" },
    { label: "Domaine", val: obs.siteName || "Agadir" },
    { label: "Parcelle", val: obs.plotName || "P1" },
    { label: "Maladie principale", val: obs.diagnosis?.primaryDisease || "Aucune" },
    { label: "Symptômes", val: obs.phenotypicTraits?.diseasesOrDeficiencies?.join(", ") || "Aspect normal" },
    { label: "GPS Latitude", val: obs.latitude ? obs.latitude.toFixed(4) : "Non géolocalisé" },
    { label: "GPS Longitude", val: obs.longitude ? obs.longitude.toFixed(4) : "Non géolocalisé" },
  ];

  params.forEach((p, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const px = margin + col * colWidth + 4;
    const py = gridY + 6 + row * 13;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(p.label, px, py);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    const truncatedVal = p.val.length > 20 ? p.val.substring(0, 18) + "..." : p.val;
    doc.text(truncatedVal, px, py + 4.5);
  });

  y += gridHeight + 8;

  // Alertes agronomiques Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Alertes agronomiques & statut sanitaire", margin, y);
  y += 5;

  const chipWidth = (cardWidth - 9) / 4;
  const chips = [
    { title: "SANTÉ CROP", status: status === "healthy" ? "Favorable" : status === "warning" ? "Modéré" : "Critique", level: status === "healthy" ? "good" : status === "warning" ? "warn" : "bad" },
    { title: "PRESSION PATHOGÈNE", status: obs.diagnosis?.primaryDisease ? "Élevé" : "Faible", level: obs.diagnosis?.primaryDisease ? "bad" : "good" },
    { title: "SÉVÉRITÉ ATTAQUE", status: status === "critical" ? "Élevée" : status === "warning" ? "Moyenne" : "Nulle", level: status === "critical" ? "bad" : status === "warning" ? "warn" : "good" },
    { title: "URGENCE ACTION", status: status === "critical" ? "Immédiate" : status === "warning" ? "Sous 48h" : "Aucune", level: status === "critical" ? "bad" : status === "warning" ? "warn" : "good" },
  ];

  chips.forEach((c, i) => {
    const cx = margin + i * (chipWidth + 3);
    let borderC = [187, 247, 208];
    let bgC = [240, 253, 244];
    let textC = [22, 101, 52];

    if (c.level === "bad") {
      borderC = [254, 202, 202];
      bgC = [254, 242, 242];
      textC = [153, 27, 27];
    } else if (c.level === "warn") {
      borderC = [253, 230, 138];
      bgC = [255, 251, 235];
      textC = [146, 64, 14];
    }

    doc.setFillColor(bgC[0], bgC[1], bgC[2]);
    doc.setDrawColor(borderC[0], borderC[1], borderC[2]);
    doc.roundedRect(cx, y, chipWidth, 14, 2, 2, "FD");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, cx + 3, y + 5);

    doc.setFontSize(9);
    doc.setTextColor(textC[0], textC[1], textC[2]);
    doc.text(c.status, cx + 3, y + 10.5);
  });

  y += 20;

  // Detailed Analysis Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Analyse Médicale & Description IA", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);

  const desc = obs.diagnosis?.description || "Analyse automatique effectuée. Aucun signe pathologique grave détecté lors de la capture de l'image.";
  const descLines = doc.splitTextToSize(desc, cardWidth - 8);

  const descBoxHeight = Math.max(16, descLines.length * 4.5 + 6);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, cardWidth, descBoxHeight, 2, 2, "FD");

  doc.text(descLines, margin + 4, y + 5);
  y += descBoxHeight + 8;

  // Recommandations de traitement
  if (obs.diagnosis?.treatments && obs.diagnosis.treatments.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Recommandations & Traitements Écologiques", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    obs.diagnosis.treatments.forEach((trt) => {
      const trtLines = doc.splitTextToSize(`• ${trt}`, cardWidth - 6);
      doc.text(trtLines, margin + 2, y);
      y += trtLines.length * 4.2 + 2;
    });
    y += 4;
  }

  // Notes du technicien
  if (obs.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Notes du Technicien / Agronome", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const notesLines = doc.splitTextToSize(obs.notes, cardWidth - 8);
    const notesBoxHeight = notesLines.length * 4.5 + 6;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, cardWidth, notesBoxHeight, 2, 2, "FD");

    doc.text(notesLines, margin + 4, y + 5);
    y += notesBoxHeight + 8;
  }

  // High Resolution Photos (New Page if needed or attached below)
  if (obs.images && obs.images.length > 0) {
    doc.addPage();
    drawHeader();
    let pageY = 26;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Photographies Terrain & Preuves Visuelles", margin, pageY);
    pageY += 8;

    for (let i = 0; i < obs.images.length; i++) {
      const url = obs.images[i];
      try {
        const img = await loadImage(url);
        const imgRatio = img.width / img.height;
        let finalWidth = cardWidth;
        let finalHeight = finalWidth / imgRatio;

        if (finalHeight > 130) {
          finalHeight = 130;
          finalWidth = finalHeight * imgRatio;
        }

        if (pageY + finalHeight > pageHeight - 25) {
          doc.addPage();
          drawHeader();
          pageY = 26;
        }

        const xOffset = margin + (cardWidth - finalWidth) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          doc.addImage(dataUrl, "JPEG", xOffset, pageY, finalWidth, finalHeight);
          pageY += finalHeight + 4;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Photographie #${i + 1} - Capture haute définition AgroScan`, pageWidth / 2, pageY, { align: "center" });
          pageY += 10;
        }
      } catch (e) {
        console.error("Failed to add image to PDF", e);
      }
    }
  }

  // Draw Page Footers with correct Page X / Y
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

  doc.save(`AgroScan_Rapport_Observation_${obs.id.substring(0, 8)}.pdf`);
}
