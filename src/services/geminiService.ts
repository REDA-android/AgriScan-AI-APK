import { GoogleGenAI, Type } from "@google/genai";
import { Capacitor } from "@capacitor/core";

export interface PlantAnalysis {
  family: string;
  species: string;
  variety: string;
  culture?: string;
  domain?: string;
  status?: "pending" | "completed" | "error";
  plantingDate?: string | null;
  breeder?: string | null;
  pruningDate?: string | null;
  harvestQuantity?: string | null;
  density?: string | null;
  fruitFirmness?: string | null;
  defects?: string | null;
  phenologicalStage?: string;
  bbchDominant?: string;
  bbchSecondary?: string[];
  organCounts?: {
    flowers: number;
    fruits: number;
    details: string;
  };
  stageIntensity?: string;
  stageQuality?: string;
  characterizationTraits?: string[];
  phenotypicTraits: {
    color: string;
    shape: string;
    size: string;
    healthStatus: string;
    diseasesOrDeficiencies: string[];
  };
  description: string;
  imageUrls?: string[];
  userNotes?: string;
}

export function clearAIInstance() {
  // no-op
}

const getApiUrl = () => {
  // Always prefer configured VITE_API_URL if provided
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }
  // In standard web environments, use window.location.origin
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    if (!window.location.origin.includes("capacitor://")) {
      return window.location.origin;
    }
  }
  return "";
};

export async function chatWithGemini(
  message: string,
  history: { role: "user" | "model"; text: string }[],
): Promise<string> {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  if (isOffline) {
    return "Vous êtes actuellement hors-ligne. L'assistant IA nécessite une connexion Internet pour répondre.";
  }

  const userKey =
    localStorage.getItem("user_gemini_api_key") ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    "";
  const apiUrl = getApiUrl();

  // If the user has an API key, we call Gemini directly from the client.
  // This is highly recommended for static hostings (like Vercel) where the backend is not
  // deployed or runs in serverless, avoiding proxy issues.
  const useProxy = !userKey;

  if (useProxy) {
    let lastError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const endpoint = attempt === 0 && apiUrl ? `${apiUrl}/api/gemini/chat` : `/api/gemini/chat`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history, userKey }),
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error(
            "[Chat] Unexpected response from server:",
            text.substring(0, 100),
          );
          throw new Error(
            "Le serveur de chat a renvoyé une réponse HTML au lieu de JSON. Veuillez recharger la page ou réessayer.",
          );
        }

        const data = await response.json();
        if (!response.ok) {
          if (
            data.error &&
            (data.error.includes("Clé API") ||
              data.error.includes("Quota") ||
              data.error.includes("Limite"))
          ) {
            throw new Error(data.error);
          }
          throw new Error(
            data.error || "Erreur lors de la communication de chat",
          );
        }

        return data.text || "Erreur lors de la génération de la réponse.";
      } catch (e: any) {
        lastError = e;
        if (e.message?.includes("Clé API") || e.message?.includes("Quota")) {
          throw e;
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    if (lastError) {
      if (
        userKey &&
        lastError.message &&
        (lastError.message.includes("Network") || lastError.message.includes("Failed to fetch"))
      ) {
        // Fallback to direct client mode
      } else {
        throw lastError;
      }
    }
  }

  // Mode APK - Client Direct (Nécessite la clé API)
  const ai = new GoogleGenAI({ apiKey: userKey });

  const contents = history.map((msg: any) => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.text }],
  }));
  contents.push({ role: "user", parts: [{ text: message }] });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
  });

  return response.text || "";
}

export async function analyzePlantImage(
  images: { base64Image: string; mimeType: string }[],
): Promise<any> {
  const userKey =
    localStorage.getItem("user_gemini_api_key") ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    "";
  const apiUrl = getApiUrl();

  const cleanBase64 = (str: string) => {
    if (!str) return "";
    return str.replace(/^data:image\/\w+;base64,/, "");
  };

  const cleanedImages = images.map((img) => ({
    base64Image: cleanBase64(img.base64Image),
    mimeType: img.mimeType || "image/jpeg",
  }));

  const useProxy = !userKey;

  if (useProxy) {
    let lastError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const endpoint = attempt === 0 && apiUrl ? `${apiUrl}/api/gemini/analyze` : `/api/gemini/analyze`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: cleanedImages, userKey }),
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error(
            "[Analyze] Unexpected response from server:",
            text.substring(0, 100),
          );
          throw new Error(
            "Le serveur d'analyse a renvoyé une réponse invalide (non-JSON). Veuillez recharger la page ou réessayer.",
          );
        }

        const data = await response.json();
        if (!response.ok) {
          if (
            data.error &&
            (data.error.includes("Clé API") ||
              data.error.includes("Quota") ||
              data.error.includes("Limite"))
          ) {
            throw new Error(data.error);
          }
          throw new Error(data.error || "Erreur lors de l'analyse");
        }

        return data;
      } catch (e: any) {
        lastError = e;
        if (e.message?.includes("Clé API") || e.message?.includes("Quota")) {
          throw e;
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    if (lastError) {
      if (
        userKey &&
        lastError.message &&
        (lastError.message.includes("Network") || lastError.message.includes("Failed to fetch"))
      ) {
        // Fallback to direct client below if userKey exists
      } else if (lastError.name === "TypeError" && (lastError.message?.includes("Failed to fetch") || lastError.message?.includes("NetworkError"))) {
        throw new Error("Erreur de connexion : Réseau ou serveur d'analyse IA temporairement indisponible.");
      } else {
        throw lastError;
      }
    }
  }

  // Mode APK / Client Direct Analyse
  const ai = new GoogleGenAI({ apiKey: userKey });

  const parts: any[] = cleanedImages.slice(0, 6).map((img: any) => ({
    inlineData: {
      data: img.base64Image,
      mimeType: img.mimeType || "image/jpeg",
    },
  }));

  parts.push({
    text: `Analyze these plant photos... 
    1. Identify the family, species, variety, and the main culture...
    2. Identify the dominant phenological stage...`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          family: { type: Type.STRING },
          species: { type: Type.STRING },
          variety: { type: Type.STRING },
          culture: { type: Type.STRING },
          bbchDominant: { type: Type.STRING },
          bbchSecondary: { type: Type.ARRAY, items: { type: Type.STRING } },
          organCounts: {
            type: Type.OBJECT,
            properties: {
              flowers: { type: Type.NUMBER },
              fruits: { type: Type.NUMBER },
              details: { type: Type.STRING },
            },
            required: ["flowers", "fruits", "details"],
          },
          phenologicalStage: { type: Type.STRING },
          stageIntensity: { type: Type.STRING },
          stageQuality: { type: Type.STRING },
          characterizationTraits: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          phenotypicTraits: {
            type: Type.OBJECT,
            properties: {
              color: { type: Type.STRING },
              shape: { type: Type.STRING },
              size: { type: Type.STRING },
              healthStatus: { type: Type.STRING },
              diseasesOrDeficiencies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "color",
              "shape",
              "size",
              "healthStatus",
              "diseasesOrDeficiencies",
            ],
          },
          description: { type: Type.STRING },
        },
        required: [
          "family",
          "species",
          "variety",
          "culture",
          "phenotypicTraits",
          "description",
          "phenologicalStage",
        ],
      },
    },
  });

  if (!response.text) throw new Error("Empty response from Gemini");
  return JSON.parse(response.text);
}
