function getBezierPoints(pts, tension = 0.3, numOfSegments = 16) {
  let res = [];
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
