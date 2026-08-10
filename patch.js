import fs from 'fs';

let content = fs.readFileSync('src/services/weatherPdfService.ts', 'utf8');

const helper = `
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
  // jsPDF draw lines expects an array of line segments [ [dx, dy], ... ] starting from x, y
  // But doc.path or lines is cumbersome. Let's build a path string or use doc.lines?
  // jsPDF lines takes (lines, x, y, scale, style, closed)
  const startX = allPts[0].x;
  const startY = allPts[0].y;
  let lines = [];
  for (let i = 1; i < allPts.length; i++) {
    lines.push([allPts[i].x - allPts[i - 1].x, allPts[i].y - allPts[i - 1].y]);
  }
  doc.lines(lines, startX, startY, [1, 1], 'F', true);
}
`;

content = content.replace("export async function generateWeatherPDF(obs: any) {", helper + "\nexport async function generateWeatherPDF(obs: any) {");

fs.writeFileSync('src/services/weatherPdfService.ts', content);
