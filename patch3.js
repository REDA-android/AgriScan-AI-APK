import fs from 'fs';
let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const replacement1 = `      // Shaded 10-year mean band
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
      drawSmoothCurve(doc, curvePts, p.color, 0.6);`;

const toReplace1 = `      // Shaded 10-year mean band
      doc.setFillColor(226, 232, 240);
      doc.rect(mx + 8, my + 6, gridColW - 10, 7, "F");

      // Curve
      doc.setDrawColor(p.color[0], p.color[1], p.color[2]);
      doc.setLineWidth(0.6);
      doc.line(mx + 8, my + 11, mx + 20, my + 10);
      doc.line(mx + 20, my + 10, mx + 32, my + 8);
      doc.line(mx + 32, my + 8, mx + 44, my + 12);
      doc.line(mx + 44, my + 12, mx + gridColW - 2, my + 7);`;

const replacement2 = `      // Shaded 10-year mean band
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
      const curvePts = [
        {x: mx + 8, y: my + 11},
        {x: mx + 18, y: my + 8},
        {x: mx + 28, y: my + 12},
        {x: mx + 38, y: my + 6},
        {x: mx + gridColW - 2, y: my + 10}
      ];
      drawSmoothCurve(doc, curvePts, p.color, 0.6);`;

const toReplace2 = `      // Shaded 10-year mean band
      doc.setFillColor(226, 232, 240);
      doc.rect(mx + 8, my + 6, gridColW - 10, 7, "F");

      // Curve
      doc.setDrawColor(p.color[0], p.color[1], p.color[2]);
      doc.setLineWidth(0.6);
      doc.line(mx + 8, my + 11, mx + 18, my + 8);
      doc.line(mx + 18, my + 8, mx + 28, my + 12);
      doc.line(mx + 28, my + 12, mx + 38, my + 6);
      doc.line(mx + 38, my + 6, mx + gridColW - 2, my + 10);`;

content = content.replace(toReplace1, replacement1);
content = content.replace(toReplace2, replacement2);

fs.writeFileSync('src/services/weatherPdfService.ts', content);
