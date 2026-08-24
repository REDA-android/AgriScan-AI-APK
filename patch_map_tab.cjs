const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{activeTab === "map" && \([\s\S]*?className="h-full flex flex-col"/,
  `{activeTab === "map" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col w-full h-full min-h-0"`
);

fs.writeFileSync('src/App.tsx', code);
