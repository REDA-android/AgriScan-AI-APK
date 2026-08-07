const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const find = `    </motion.div>
    </div>
  );
}`;

const replace = `    </motion.div>
      <InfoModal 
        isOpen={!!infoModal} 
        onClose={() => setInfoModal(null)} 
        title={infoModal?.title || ""} 
        content={infoModal?.content || ""} 
      />
    </div>
  );
}`;

if (code.includes(find)) {
    code = code.replace(find, replace);
    console.log("Weather modal patched.");
} else {
    console.log("Weather modal string not found.");
}

fs.writeFileSync('src/App.tsx', code);
