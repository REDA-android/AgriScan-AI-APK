import fs from 'fs';

let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const replaceMiniP3 = `    doc.setFontSize(5);
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
      }`;

const newMiniP3 = `    if (p.noData) {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("donnée indisponible", mx + 2, my + 11);
    } else {
      let extVals = [];
      const histData = weather.history || [];
      if (p.key && histData.length > 0) {
         extVals = histData.map((d: any) => parseFloat(d[p.key] || 0));
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
        doc.text(histData[0].date || "", mx + 8, my + gridRowH - 2);
        doc.text(histData[histData.length - 1].date || "", mx + gridColW - 8, my + gridRowH - 2);
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
    }`;

content = content.replace(replaceMiniP3, newMiniP3);

const oldKeysP3 = `  const miniParamsP3 = [
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
  ];`;

const addKeysP3 = `  const miniParamsP3 = [
    { title: "Temp. moyenne (°C)", max: "28", min: "20", color: [37, 99, 235], key: "tempAvg" },
    { title: "Temp. max (°C)", max: "36", min: "22", color: [220, 38, 38], key: "tempMax" },
    { title: "Temp. min (°C)", max: "23", min: "18", color: [37, 99, 235], key: "tempMin" },
    { title: "Degrés-jours (DJ)", max: "19", min: "10", color: [234, 88, 12], key: "dj" },
    { title: "Humidité min / max (%)", max: "107", min: "32", color: [16, 185, 129], key: "hum", noData: true },
    { title: "ET0 (mm)", max: "7", min: "3", color: [202, 138, 4], key: "et0" },
    { title: "DPV (kPa)", max: "3", min: "1", color: [147, 51, 234], key: "dpv", noData: true },
    { title: "PAR (W/m²)", max: "156", min: "113", color: [202, 138, 4], key: "par" },
    { title: "Précipitations (mm)", max: "1", min: "0", color: [14, 116, 144], key: "rainQty" },
    { title: "Prob. pluie (%)", max: "6", min: "-1", color: [37, 99, 235], key: "rainProb", noData: true },
    { title: "Vent (km/h)", max: "21", min: "9", color: [71, 85, 105], key: "wind", noData: true },
    { title: "Poussière (µg/m³)", max: "317", min: "33", color: [180, 83, 9], key: "dust", noData: true },
    { title: "Heures de froid (h)", max: "1", min: "0", color: [37, 99, 235], noData: true },
  ];`;

content = content.replace(oldKeysP3, addKeysP3);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
