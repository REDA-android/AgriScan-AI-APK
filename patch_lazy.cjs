const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const findImports = `import CameraView, { ProcessedImage } from "./components/CameraView";
import MapView from "./components/MapView";
import { ChatBot } from "./components/ChatBot";`;

const replaceImports = `import { lazy, Suspense } from 'react';
import type { ProcessedImage } from "./components/CameraView";

const CameraView = lazy(() => import("./components/CameraView"));
const MapView = lazy(() => import("./components/MapView"));
const ChatBot = lazy(() => import("./components/ChatBot").then(m => ({ default: m.ChatBot })));`;

if (code.includes(findImports)) {
    code = code.replace(findImports, replaceImports);
    console.log("Imports replaced");
} else {
    console.log("Imports not found");
}

fs.writeFileSync('src/App.tsx', code);
