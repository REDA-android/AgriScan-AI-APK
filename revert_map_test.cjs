const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<div className="h-full bg-red-500 w-full text-white flex items-center justify-center">MAP IS HERE</div>{/* <MapView',
  '<MapView'
);

code = code.replace(
  'setSelectedObservation(marker.fullData)\n              }\n            /> */}',
  'setSelectedObservation(marker.fullData)\n              }\n            />'
);

fs.writeFileSync('src/App.tsx', code);
