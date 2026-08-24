const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const mapRegex = /<MapView\\s+markers=\\{observations\\s*\\.filter\\([^)]+\\)\\s*\\.map\\([^}]+\\}\\)\\)\\s*\\}/;

if(code.match(mapRegex)) {
  console.log("MATCH!");
}
