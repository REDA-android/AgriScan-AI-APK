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
  const margin = 15;
  let y = margin;

  // Header Bar
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("AgroScan IA · Bulletin Météo Agronomique", margin, 13);
  
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, pageWidth - margin, 13, { align: "right" });
  y = 30;

  // Title Section
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Site : ${weather.locationName || "Inconnu"}`, margin, y);
  y += 7;

  // Subtitle info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Coordonnées : ${weather.locationLat?.toFixed(4) || 0}, ${weather.locationLng?.toFixed(4) || 0}`, margin, y);
  y += 12;

  // Current conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Conditions Actuelles", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  
  doc.text(`Température : ${weather.current.temp}°C`, margin, y);
  y += 5;
  doc.text(`État : ${weather.current.condition}`, margin, y);
  y += 5;
  doc.text(`Humidité : ${weather.current.humidity}%`, margin, y);
  y += 5;
  doc.text(`Vent : ${weather.current.wind} km/h`, margin, y);
  y += 12;

  // Hazards
  if (weather.hazards && weather.hazards.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Alertes & Risques Agronomiques (${weather.hazards.length})`, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    weather.hazards.forEach((hazard: any) => {
      // Check if we need a new page
      if (y > pageHeight - 30) {
        doc.addPage();
        y = margin + 10;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      let hazardTitle = `${hazard.label}`;
      if (hazard.value) hazardTitle += ` - ${hazard.value}`;
      doc.text(hazardTitle, margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (hazard.description) {
        const descLines = doc.splitTextToSize(hazard.description, pageWidth - 2 * margin);
        doc.text(descLines, margin, y);
        y += descLines.length * 4.5 + 2;
      }
      
      if (hazard.recommendation) {
        doc.setTextColor(22, 101, 52); // Green
        const recLines = doc.splitTextToSize(`Reco: ${hazard.recommendation}`, pageWidth - 2 * margin);
        doc.text(recLines, margin, y);
        doc.setTextColor(51, 65, 85); // Back to text color
        y += recLines.length * 4.5 + 4;
      }
    });
  }

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text("Document généré automatiquement par AgroScan IA", margin, pageHeight - 6);

  const safeName = (weather.locationName || "site").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`Meteo_AgroScan_${safeName}.pdf`);
}
