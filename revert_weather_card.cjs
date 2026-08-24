const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const \[internalWeather, setInternalWeather\] = useState\(weather\);[\s\S]*?return \(\) => { isMounted = false; };\n  }, \[weather\]\);/;
code = code.replace(regex, '');
code = code.replace(/internalWeather/g, 'weather');

fs.writeFileSync('src/App.tsx', code);
