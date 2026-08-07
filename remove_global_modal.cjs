const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const find = `      <InfoModal 
        isOpen={!!globalInfoModal} 
        onClose={() => setGlobalInfoModal(null)} 
        title={globalInfoModal?.title || ""} 
        content={globalInfoModal?.content || ""} 
      />`;

code = code.split(find).join('');

fs.writeFileSync('src/App.tsx', code);
