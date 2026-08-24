import fs from 'fs';

let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const replaceMini = `    if (p.noData) {
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
    }`;

const newMini = `    if (p.noData) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("donnée indisponible", mx + 2, my + 11);
    } else {
      let extVals = [];
      if (p.key && forecastData.length > 0) {
         extVals = forecastData.map((d: any) => parseFloat(d[p.key] || 0));
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
        doc.text(forecastData[0].shortDate || "", mx + 8, my + gridRowH - 2);
        doc.text(forecastData[forecastData.length - 1].shortDate || "", mx + gridColW - 8, my + gridRowH - 2);
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
    }`;

content = content.replace(replaceMini, newMini);

const addKeys = `  const miniParamsP2 = [
    { title: "Temp. moyenne (°C)", max: "29", min: "20", color: [37, 99, 235], key: "tempAvg" },
    { title: "Temp. max (°C)", max: "36", min: "24", color: [220, 38, 38], key: "tempMax" },
    { title: "Temp. min (°C)", max: "23", min: "17", color: [37, 99, 235], key: "tempMin" },
    { title: "Degrés-jours (DJ)", max: "20", min: "11", color: [234, 88, 12], key: "dj" },
    { title: "Humidité min / max (%)", max: "109", min: "20", color: [16, 185, 129], key: "hum", noData: true },
    { title: "ET0 (mm)", max: "7", min: "3", color: [202, 138, 4], key: "et0" },
    { title: "DPV (kPa)", max: "3", min: "1", color: [147, 51, 234], key: "dpv", noData: true },
    { title: "PAR (W/m²)", max: "148", min: "90", color: [202, 138, 4], key: "par" },
    { title: "Précipitations (mm)", max: "2", min: "0", color: [14, 116, 144], key: "rainQty" },
    { title: "Prob. pluie (%)", max: "5", min: "0", color: [37, 99, 235], key: "rainProb" },
    { title: "Vent (km/h)", max: "25", min: "11", color: [71, 85, 105], key: "wind" },
    { title: "Poussière (µg/m³)", max: "111", min: "-12", color: [180, 83, 9], key: "dust", noData: true },
    { title: "Heures de froid (h)", max: "", min: "", color: [148, 163, 184], noData: true },
  ];`;

const oldKeys = `  const miniParamsP2 = [
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
  ];`;

content = content.replace(oldKeys, addKeys);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
