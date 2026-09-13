import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";

export function setupGeminiLiveWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/api/gemini/live" });

  console.log("[Gemini Live WS] WebSocket server registered on /api/gemini/live");

  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("[Gemini Live WS] Nouveau client connecté au flux Live");

    let liveSession: any = null;
    let isConnected = false;
    let pendingVideoFrames: string[] = [];

    const getApiKey = (clientKey?: string) => {
      let key = clientKey || process.env.GEMINI_API_KEY || "";
      if (key === "MY_GEMINI_API_KEY" || key === "MISSING_API_KEY") {
        key = "";
      }
      return key.trim();
    };

    const initLiveSession = async (customApiKey?: string, voiceName: string = "Zephyr") => {
      const apiKey = getApiKey(customApiKey);
      if (!apiKey) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error: "Clé Gemini API non configurée. Veuillez renseigner votre clé dans les Paramètres.",
          })
        );
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "agriscan-gemini-live",
          },
        },
      });

      const candidateModels = [
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash-live-preview-04-09",
      ];

      let lastErr: any = null;

      for (const modelCandidate of candidateModels) {
        try {
          console.log(`[Gemini Live WS] Tentative de connexion au modèle ${modelCandidate}...`);
          const session = await ai.live.connect({
            model: modelCandidate,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: (voiceName as any) || "Zephyr",
                  },
                },
              },
              systemInstruction: {
                parts: [
                  {
                    text: `Tu es AgriScan Live, un agronome expert de terrain et pathologiste végétal d'élite opérant en direct avec la caméra et le micro d'un agriculteur.
Tu reçois en continu des images de cultures, feuilles, fruits, racines et la voix de l'utilisateur.

RÈGLES D'INTERACTION EN DIRECT :
1. Sois très réactif, naturel, chaleureux et professionnel. Parle en français direct.
2. Dès que l'utilisateur te montre une plante ou pose une question, identifie en 1 phrase percutante l'espèce, sa vigueur et son état général.
3. Si tu observes une anomalie (oïdium, mildiou, botrytis, rouille, pucerons, acariens, carence en azote ou fer, nécrose foliaire), nomme-la immédiatement avec son niveau de gravité (Bénin, Modéré, Critique).
4. Propose immédiatement une solution de biocontrôle ou traitement naturel (savon noir, purin d'ortie/prêle, cuivre raisonné, aération, régulation de l'irrigation).
5. Garde tes interventions orales concises (environ 25 à 45 mots par tour de parole) pour un dialogue fluide et dynamique sur le terrain.`,
                  },
                ],
              },
            },
            callbacks: {
              onopen: () => {
                console.log(`[Gemini Live WS] Connecté avec succès à Gemini Live (${modelCandidate})`);
                isConnected = true;
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: "ready",
                      model: modelCandidate,
                      message: "Session Gemini Live connectée",
                    })
                  );
                }
              },
              onmessage: (liveMsg: any) => {
                if (clientWs.readyState !== WebSocket.OPEN) return;

                // Transmit audio chunks
                const audioData =
                  liveMsg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                  clientWs.send(
                    JSON.stringify({
                      type: "audio",
                      data: audioData,
                    })
                  );
                }

                // Transmit any textual transcription
                const textPart = liveMsg.serverContent?.modelTurn?.parts?.find(
                  (p: any) => p.text
                );
                if (textPart?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: "transcript",
                      text: textPart.text,
                    })
                  );
                }

                if (liveMsg.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: "interrupted" }));
                }

                if (liveMsg.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: "turnComplete" }));
                }
              },
              onerror: (err: any) => {
                console.error("[Gemini Live WS] Erreur callback Live:", err);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: "error",
                      error: err?.message || "Erreur flux Gemini Live",
                    })
                  );
                }
              },
              onclose: () => {
                console.log("[Gemini Live WS] Session Gemini Live fermée.");
                isConnected = false;
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: "closed" }));
                }
              },
            },
          });

          liveSession = session;
          return;
        } catch (err: any) {
          console.warn(`[Gemini Live WS] Échec modèle ${modelCandidate}:`, err?.message);
          lastErr = err;
        }
      }

      if (!liveSession && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            error:
              lastErr?.message ||
              "Impossible d'établir la session Gemini Live. Le mode hybride HTTP reste actif.",
          })
        );
      }
    };

    clientWs.on("message", async (rawMessage: any) => {
      try {
        const payload = JSON.parse(rawMessage.toString());

        if (payload.type === "init") {
          await initLiveSession(payload.apiKey, payload.voice);
          return;
        }

        if (payload.type === "ping") {
          clientWs.send(JSON.stringify({ type: "pong", time: Date.now() }));
          return;
        }

        if (!liveSession) {
          // Auto-init if not initialized
          await initLiveSession(payload.apiKey);
        }

        if (!liveSession) return;

        // Send realtime video frame
        if (payload.type === "video" && payload.data) {
          // Normalize base64
          const base64Data = payload.data.includes(",")
            ? payload.data.split(",")[1]
            : payload.data;

          try {
            liveSession.sendRealtimeInput({
              video: {
                data: base64Data,
                mimeType: payload.mimeType || "image/jpeg",
              },
            });
          } catch (e) {
            console.warn("[Gemini Live WS] Erreur envoi frame vidéo:", e);
          }
        }

        // Send realtime audio (16kHz PCM)
        if (payload.type === "audio" && payload.data) {
          try {
            liveSession.sendRealtimeInput({
              audio: {
                data: payload.data,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          } catch (e) {
            console.warn("[Gemini Live WS] Erreur envoi chunk audio:", e);
          }
        }

        // Send user prompt/question
        if (payload.type === "text" && payload.text) {
          try {
            liveSession.sendClientContent({
              turns: [
                {
                  role: "user",
                  parts: [{ text: payload.text }],
                },
              ],
              turnComplete: true,
            });
          } catch (e) {
            console.warn("[Gemini Live WS] Erreur envoi texte:", e);
          }
        }
      } catch (parseErr) {
        console.error("[Gemini Live WS] Erreur lecture message client:", parseErr);
      }
    });

    clientWs.on("close", () => {
      console.log("[Gemini Live WS] Client déconnecté, fermeture session.");
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {}
        liveSession = null;
      }
    });

    clientWs.on("error", (err) => {
      console.error("[Gemini Live WS] Erreur socket client:", err);
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {}
        liveSession = null;
      }
    });
  });
}
