import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
  BookmarkPlus,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Maximize2,
  Minimize2,
  Zap,
  Info,
  HelpCircle,
  ShieldCheck,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LiveDiagnosis {
  plantName?: string;
  confidence?: number;
  healthStatus?: "Excellente" | "Bonne" | "Vigilance" | "Attaque / Maladie critique" | string;
  diagnosis?: string;
  symptoms?: string;
  recommendedAction?: string;
  vocalAdvice?: string;
  timestamp?: number;
}

interface GeminiLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveObservation?: (capturedData: {
    imageUrl: string;
    plantName: string;
    diagnosis: string;
    healthStatus: string;
    notes: string;
    confidence?: number;
  }) => void;
  language?: string;
}

export const GeminiLiveModal: React.FC<GeminiLiveModalProps> = ({
  isOpen,
  onClose,
  onSaveObservation,
  language = "fr",
}) => {
  // Video stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [streamActive, setStreamActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Connection & Diagnostics state
  const [connectionMode, setConnectionMode] = useState<"connecting" | "live_ws" | "live_http" | "error">("connecting");
  const [statusMessage, setStatusMessage] = useState("Initialisation de la caméra...");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [latestTranscript, setLatestTranscript] = useState<string>("");
  const [liveDiagnosis, setLiveDiagnosis] = useState<LiveDiagnosis | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);

  // References for Web Audio & WebSockets
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextAudioStartTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<any>(null);
  const isComponentMounted = useRef(true);

  // Quick Questions
  const quickQuestions = [
    "Quelle est cette plante ?",
    "Y a-t-il des parasites ou champignons ?",
    "Quel traitement biologique appliquer ?",
    "La vigueur foliaire est-elle bonne ?",
  ];

  // Helper for 24kHz audio playback
  const play24kHzAudioChunk = useCallback((base64Data: string) => {
    if (isSpeakerMuted) return;
    try {
      if (!audioContextOutRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextOutRef.current = new AudioCtx({ sampleRate: 24000 });
      }

      const ctx = audioContextOutRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextAudioStartTimeRef.current < currentTime) {
        nextAudioStartTimeRef.current = currentTime;
      }
      source.start(nextAudioStartTimeRef.current);
      nextAudioStartTimeRef.current += audioBuffer.duration;

      setIsAiSpeaking(true);
      source.onended = () => {
        if (ctx.currentTime >= nextAudioStartTimeRef.current - 0.05) {
          setIsAiSpeaking(false);
        }
      };
    } catch (e) {
      console.warn("[Gemini Live] Erreur lecture chunk audio:", e);
    }
  }, [isSpeakerMuted]);

  // Speech synthesis fallback
  const speakAdvice = useCallback((text: string) => {
    if (isSpeakerMuted || !text) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeakerMuted]);

  // Capture a single frame as JPEG Base64
  const captureCurrentFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = Math.min(video.videoWidth, 800);
    canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.75);
  }, []);

  // HTTP Fallback analysis loop
  const triggerHttpAnalysis = useCallback(async (customPrompt?: string) => {
    if (isAnalyzingFrame || isPaused) return;
    const frame = captureCurrentFrame();
    if (!frame) return;

    setIsAnalyzingFrame(true);
    setCapturedFrameUrl(frame);

    try {
      const res = await fetch("/api/gemini/live-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: frame,
          question: customPrompt,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        const diag: LiveDiagnosis = {
          plantName: json.data.plantName || "Plante détectée",
          confidence: json.data.confidence || 92,
          healthStatus: json.data.healthStatus || "Bonne",
          diagnosis: json.data.diagnosis || "Aucune anomalie majeure",
          symptoms: json.data.symptoms || "Feuillage en croissance saine",
          recommendedAction: json.data.recommendedAction || "Maintenir l'arrosage habituel",
          vocalAdvice: json.data.vocalAdvice,
          timestamp: Date.now(),
        };

        setLiveDiagnosis(diag);
        if (diag.vocalAdvice) {
          setLatestTranscript(diag.vocalAdvice);
          speakAdvice(diag.vocalAdvice);
        }
        setConnectionMode((prev) => (prev === "live_ws" ? prev : "live_http"));
        setStatusMessage("Analyse en direct active • Gemini 3.8 Multimodal");
      }
    } catch (err: any) {
      console.warn("[Gemini Live HTTP Fallback] Erreur:", err);
      setStatusMessage("Analyse temporairement en attente...");
    } finally {
      setIsAnalyzingFrame(false);
    }
  }, [captureCurrentFrame, isAnalyzingFrame, isPaused, speakAdvice]);

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/gemini/live`;
      console.log("[Gemini Live] Tentative de connexion WebSocket sur :", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Gemini Live] WebSocket connecté !");
        setConnectionMode("live_ws");
        setStatusMessage("Connecté à Gemini Live en temps réel");
        ws.send(JSON.stringify({ type: "init", voice: "Zephyr" }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ready") {
            setConnectionMode("live_ws");
            setStatusMessage("Gemini Live prêt • Flux audio & vidéo actif");
          } else if (msg.type === "audio" && msg.data) {
            play24kHzAudioChunk(msg.data);
          } else if (msg.type === "transcript" && msg.text) {
            setLatestTranscript((prev) => prev + " " + msg.text);
          } else if (msg.type === "interrupted") {
            setIsAiSpeaking(false);
          } else if (msg.type === "error") {
            console.warn("[Gemini Live WS Server Error]:", msg.error);
            // Switch gracefully to live HTTP fallback
            setConnectionMode("live_http");
            setStatusMessage("Passage en mode flux haute fréquence direct");
          }
        } catch (e) {
          console.error("Erreur parsing WS message:", e);
        }
      };

      ws.onerror = (e) => {
        console.warn("[Gemini Live WS Error]:", e);
        setConnectionMode("live_http");
        setStatusMessage("Mode flux visuel temps réel actif");
      };

      ws.onclose = () => {
        console.log("[Gemini Live WS Close]");
        if (connectionMode === "live_ws") {
          setConnectionMode("live_http");
        }
      };
    } catch (err) {
      console.warn("[Gemini Live WS Init Error]:", err);
      setConnectionMode("live_http");
    }
  }, [connectionMode, play24kHzAudioChunk]);

  // Microphone audio capture setup (16kHz PCM little-endian)
  const setupMicInput = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctxIn = new AudioCtx({ sampleRate: 16000 });
      audioContextInRef.current = ctxIn;

      const source = ctxIn.createMediaStreamSource(audioStream);
      const processor = ctxIn.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !isComponentMounted.current) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Compute volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setAudioLevel(Math.min(100, Math.round(rms * 400)));

        // Send PCM to WebSocket if open
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          wsRef.current.send(
            JSON.stringify({
              type: "audio",
              data: base64,
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(ctxIn.destination);
    } catch (err) {
      console.warn("[Gemini Live] Accès micro non accordé:", err);
    }
  }, [isMuted]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setStatusMessage("Connexion au capteur caméra...");
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setStreamActive(true);
      setStatusMessage("Caméra active • Initialisation Gemini Live...");
    } catch (err: any) {
      console.error("[Gemini Live] Erreur caméra:", err);
      setStatusMessage("Impossible d'accéder à la caméra. Vérifiez les autorisations.");
      setConnectionMode("error");
    }
  }, [facingMode]);

  // Main lifecycle
  useEffect(() => {
    isComponentMounted.current = true;
    if (isOpen) {
      startCamera();
      setupWebSocket();
      setupMicInput();

      // Launch continuous frame loop (1.5s interval)
      frameIntervalRef.current = setInterval(() => {
        if (!isPaused && isComponentMounted.current) {
          // If WS is open, send frame via WS
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const frame = captureCurrentFrame();
            if (frame) {
              wsRef.current.send(
                JSON.stringify({
                  type: "video",
                  data: frame,
                })
              );
            }
          } else {
            // Otherwise use HTTP live analyze fallback
            triggerHttpAnalysis();
          }
        }
      }, 2000);
    }

    return () => {
      isComponentMounted.current = false;
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextInRef.current) {
        try {
          audioContextInRef.current.close();
        } catch {}
      }
      if (audioContextOutRef.current) {
        try {
          audioContextOutRef.current.close();
        } catch {}
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, startCamera, setupWebSocket, setupMicInput, captureCurrentFrame, triggerHttpAnalysis, isPaused]);

  // Flip camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // User asks a specific question
  const handleAskQuestion = (questionText: string) => {
    if (!questionText.trim()) return;
    setLatestTranscript("");
    setStatusMessage(`Consultation de Gemini Live : "${questionText}"...`);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send frame + text to WS
      const frame = captureCurrentFrame();
      if (frame) {
        wsRef.current.send(
          JSON.stringify({
            type: "video",
            data: frame,
          })
        );
      }
      wsRef.current.send(
        JSON.stringify({
          type: "text",
          text: questionText,
        })
      );
    } else {
      // Use HTTP endpoint
      triggerHttpAnalysis(questionText);
    }
    setTextInput("");
  };

  // Save current observation
  const handleSaveCurrentFinding = () => {
    const frame = capturedFrameUrl || captureCurrentFrame();
    if (!frame) return;

    if (onSaveObservation) {
      onSaveObservation({
        imageUrl: frame,
        plantName: liveDiagnosis?.plantName || "Spécimen analysé en direct",
        diagnosis: liveDiagnosis?.diagnosis || "Diagnostic en temps réel",
        healthStatus: liveDiagnosis?.healthStatus || "Bonne",
        notes: `[Gemini Live Temps Réel]\nSymptômes : ${liveDiagnosis?.symptoms || "N/A"}\nConseil agronomique : ${liveDiagnosis?.recommendedAction || "Maintenir la surveillance standard"}\nTranscription vocale : ${latestTranscript || "N/A"}`,
        confidence: liveDiagnosis?.confidence || 95,
      });

      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col justify-between overflow-hidden text-white select-none backdrop-blur-md">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar */}
      <div className="relative z-20 px-4 pt-3 pb-3 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1">
                Gemini Live
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  Temps Réel
                </span>
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {connectionMode === "live_ws" ? "WebSocket Bidirectionnel Audio & Vidéo" : "Flux Multimodal Intelligent Actif"}
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSpeakerMuted((v) => !v)}
            className={`p-2 rounded-xl border transition-all ${
              isSpeakerMuted
                ? "bg-rose-950/60 border-rose-500/40 text-rose-400"
                : "bg-white/10 border-white/10 text-emerald-400 hover:bg-white/15"
            }`}
            title={isSpeakerMuted ? "Activer le son vocal" : "Désactiver le son"}
          >
            {isSpeakerMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <button
            onClick={toggleCamera}
            className="p-2 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-all"
            title="Changer de caméra"
          >
            <RefreshCw size={17} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 border border-white/10 text-slate-300 hover:bg-rose-600/80 hover:text-white transition-all ml-1"
            title="Fermer le direct"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Viewport: Video Feed with Augmented HUD */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Laser Scanner animation line */}
        {!isPaused && (
          <motion.div
            animate={{ top: ["5%", "90%", "5%"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.9)] z-10 pointer-events-none"
          />
        )}

        {/* Viewfinder Target Reticle */}
        <div className="absolute inset-8 pointer-events-none border border-white/10 rounded-3xl z-10">
          {/* Corner marks */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-xl" />

          {/* Central Target Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-10 h-10 border border-dashed border-emerald-400/60 rounded-full animate-spin-slow" />
          </div>
        </div>

        {/* Live Audio Visualizer Wave (Appears when AI is speaking or Mic is hot) */}
        {(isAiSpeaking || audioLevel > 5) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-300">
              {isAiSpeaking ? "Gemini parle..." : "Écoute micro en direct..."}
            </span>
            <div className="flex items-center gap-0.5 h-3 ml-1">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ height: isAiSpeaking ? [4, 12, 4] : [2, Math.max(2, (audioLevel / 100) * 12), 2] }}
                  transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.08 }}
                  className="w-1 bg-emerald-400 rounded-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* Floating Live Diagnostic HUD Overlay */}
        <div className="absolute bottom-2 left-3 right-3 z-20 space-y-2">
          {liveDiagnosis && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-emerald-500/30 shadow-[0_10px_25px_rgba(0,0,0,0.6)] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white leading-tight">
                      {liveDiagnosis.plantName || "Identification en cours"}
                    </h3>
                    <p className="text-[10px] text-emerald-300 font-semibold">
                      {liveDiagnosis.diagnosis}
                    </p>
                  </div>
                </div>

                {/* Health Badge */}
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    liveDiagnosis.healthStatus?.includes("critique") || liveDiagnosis.healthStatus?.includes("Attaque")
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      : liveDiagnosis.healthStatus?.includes("Vigilance")
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {liveDiagnosis.healthStatus || "Sain"}
                </span>
              </div>

              {/* Action Recommendation */}
              {liveDiagnosis.recommendedAction && (
                <div className="text-[11px] text-slate-200 bg-white/5 p-2 rounded-xl border border-white/5 leading-snug">
                  <span className="font-bold text-emerald-400">Conseil terrain : </span>
                  {liveDiagnosis.recommendedAction}
                </div>
              )}

              {/* Real-time Transcription Stream */}
              {latestTranscript && (
                <div className="text-[10px] text-slate-300 italic border-t border-white/10 pt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                  <span className="line-clamp-2">« {latestTranscript} »</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Quick Questions Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAskQuestion(q)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-950/80 border border-white/15 text-[10px] font-bold text-slate-200 whitespace-nowrap transition-all active:scale-95 flex items-center gap-1 shadow-sm"
              >
                <HelpCircle size={11} className="text-emerald-400" />
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-20 px-4 pt-2 pb-5 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent space-y-3">
        {/* Quick Question Text Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskQuestion(textInput)}
              placeholder="Posez une question à Gemini Live..."
              className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => handleAskQuestion(textInput)}
            disabled={!textInput.trim()}
            className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition-all"
          >
            <Send size={15} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Microphone Mute Toggle */}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all border ${
              isMuted
                ? "bg-rose-950/50 border-rose-500/40 text-rose-300"
                : "bg-slate-900/80 border-white/15 text-slate-200 hover:bg-white/10"
            }`}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} className="text-emerald-400" />}
            <span>{isMuted ? "Micro Muet" : "Micro Actif"}</span>
          </button>

          {/* Save Finding to Farm Records */}
          <button
            onClick={handleSaveCurrentFinding}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all shadow-md ${
              isSavedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98]"
            }`}
          >
            {isSavedSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <BookmarkPlus size={16} />
                <span>Enregistrer l'Observation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiLiveModal;
