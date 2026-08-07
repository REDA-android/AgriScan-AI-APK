const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const find = `        </section>
      </div>
    </motion.div>
  );
}`;

const replace = `        </section>
      </div>
      <InfoModal 
        isOpen={!!infoModal} 
        onClose={() => setInfoModal(null)} 
        title={infoModal?.title || ""} 
        content={infoModal?.content || ""} 
      />
    </motion.div>
  );
}`;

if (code.includes(find)) {
    code = code.replace(find, replace);
    console.log("Obs modal patched.");
} else {
    console.log("Obs modal string not found.");
}

fs.writeFileSync('src/App.tsx', code);
