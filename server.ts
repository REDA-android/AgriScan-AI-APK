import http from "http";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./serverApp";
import { setupGeminiLiveWebSocket } from "./serverGeminiLive";

const PORT = 3000;

async function startServer() {
  const server = http.createServer(app);

  // Attach WebSocket server for Gemini Live Audio & Video
  setupGeminiLiveWebSocket(server);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
