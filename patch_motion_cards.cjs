const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const find = `              ) : (
                filteredObservations.map((obs) => (
                  <div
                    key={obs.id}
                    className={\`liquid-glass-card overflow-hidden transition-all duration-300 relative \${isSelectionMode && selectedIds.includes(obs.id) ? "ring-2 ring-emerald-500/50 scale-[0.98]" : "hover:scale-[1.01]"}\`}
                    onClick={() =>
                      isSelectionMode ? toggleSelection(obs.id) : undefined
                    }
                  >`;

const replace = `              ) : (
                filteredObservations.map((obs, index) => (
                  <motion.div
                    key={obs.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={\`liquid-glass-card overflow-hidden transition-all duration-300 relative \${isSelectionMode && selectedIds.includes(obs.id) ? "ring-2 ring-emerald-500/50 scale-[0.98]" : "hover:scale-[1.01]"}\`}
                    onClick={() =>
                      isSelectionMode ? toggleSelection(obs.id) : undefined
                    }
                  >`;

if (code.includes(find)) {
    code = code.replace(find, replace);
    
    // Also we need to close the tag `</motion.div>`
    // The end tag is likely `</div>` at the end of the `obs` mapping. Let's find it.
} else {
    console.log("Motion cards string not found.");
}

fs.writeFileSync('src/App.tsx', code);
