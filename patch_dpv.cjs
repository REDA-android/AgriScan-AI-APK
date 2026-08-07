const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const find = `setGlobalInfoModal({ title: "Déficit de Pression de Vapeur (DPV)",`;
const replace = `setInfoModal({ title: "Déficit de Pression de Vapeur (DPV)",`;

if (code.includes(find)) {
    code = code.replace(find, replace);
    console.log("DPV patched.");
} else {
    console.log("DPV string not found.");
}

fs.writeFileSync('src/App.tsx', code);
