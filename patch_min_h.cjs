const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<main className="flex-1 overflow-y-auto p-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] scroll-smooth flex flex-col">',
  '<main className="flex-1 overflow-y-auto p-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] scroll-smooth flex flex-col min-h-0">'
);

code = code.replace(
  '<div className="rounded-3xl overflow-hidden flex-1 flex flex-col">',
  '<div className="rounded-3xl overflow-hidden flex-1 flex flex-col min-h-0 relative">'
);

fs.writeFileSync('src/App.tsx', code);
