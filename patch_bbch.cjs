const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const bbchFind = `              <Info size={12} className="text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-3 bg-[#0d120f] border border-white/10 shadow-xl rounded-xl z-50 pointer-events-none text-none normal-case tracking-normal">
                <p className="text-[10px] text-slate-300 leading-relaxed font-normal">
                  <strong className="text-emerald-400 block mb-1 uppercase tracking-widest">Échelle BBCH</strong>
                  Système codé pour identifier les stades de développement phénologique des plantes (de la germination à la sénescence).
                </p>
              </div>`;

const bbchReplace = `              <Info size={16} className="text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); setInfoModal({ title: "Échelle BBCH", content: "Système codé pour identifier les stades de développement phénologique des plantes (de la germination à la sénescence)." }); }} />`;

if (code.includes(bbchFind)) {
    code = code.replace(bbchFind, bbchReplace);
    console.log("BBCH replaced.");
} else {
    console.log("BBCH string not found.");
}

const dpvFind = `              <Info size={16} className="text-slate-400 hover:text-emerald-400 cursor-pointer" />
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block w-64 p-3 bg-[#0d120f] border border-white/10 shadow-xl rounded-xl z-50 pointer-events-none normal-case tracking-normal">
                <p className="text-[10px] text-slate-300 leading-relaxed font-normal">
                  <strong className="text-emerald-400 block mb-1 uppercase tracking-widest">Déficit de Pression de Vapeur (DPV)</strong>
                  Mesure la différence entre la quantité d'humidité dans l'air et la quantité maximale que l'air peut retenir à une température donnée. Un DPV optimal favorise la transpiration et l'absorption des nutriments.
                </p>
              </div>`;

const dpvReplace = `              <Info size={16} className="text-slate-400 hover:text-emerald-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); setGlobalInfoModal({ title: "Déficit de Pression de Vapeur (DPV)", content: "Mesure la différence entre la quantité d'humidité dans l'air et la quantité maximale que l'air peut retenir à une température donnée. Un DPV optimal favorise la transpiration et l'absorption des nutriments." }); }} />`;

if (code.includes(dpvFind)) {
    code = code.replace(dpvFind, dpvReplace);
    console.log("DPV replaced.");
} else {
    console.log("DPV string not found.");
}

fs.writeFileSync('src/App.tsx', code);
