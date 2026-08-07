const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const find = `          className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all"
          title="Télécharger le rapport PDF"
        >
          <FileText size={20} />
        </button>`;

const replace = `          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider"
          title="Télécharger le rapport PDF"
        >
          <FileText size={16} /> Exporter PDF
        </button>`;

if (code.includes(find)) {
    code = code.replace(find, replace);
    console.log("PDF btn patched.");
} else {
    console.log("PDF btn string not found.");
}

fs.writeFileSync('src/App.tsx', code);
