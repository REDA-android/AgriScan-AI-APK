import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

// For Vercel Serverless compatibility, all route handlers are mounted on both "/api/..." and "/..." prefixes.
// This completely avoids having to rewrite the global req.url, ensuring 100% compatibility with local Vite environments.

app.use((req: any, res: any, next: any) => {
  res.setHeader("X-Server-Reached", "true");
  res.setHeader("X-Debug-Req-URL", req.url || "none");
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

// Test route
app.get(["/api/ping", "/ping"], (req, res) => {
  res.json({ status: "pong", time: new Date().toISOString(), url: req.url });
});

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Helper to init AI
const getAI = (apiKey?: string) => {
  let key = apiKey || process.env.GEMINI_API_KEY || "";
  if (key === "MY_GEMINI_API_KEY" || key === "MISSING_API_KEY") {
    key = "";
  }

  // Fallback if we really want to prevent a crash
  const resolvedKey = key.trim() || "AIzaSyFakeKey_NoCrashOnInstantiation";
  return new GoogleGenAI({
    apiKey: resolvedKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const handleAIError = (error: any, res: any) => {
  const message = error.message || String(error);
  const status = error.status || 500;

  if (message.includes("403") || message.includes("PERMISSION_DENIED")) {
    return res.status(403).json({
      error:
        "Clé API non autorisée (403 PERMISSION_DENIED). Vérifiez que 'Generative Language API' est activée dans la console Google Cloud et que la clé n'a pas de restrictions IP/Referer bloquantes.",
      original: message,
    });
  }

  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    status === 429
  ) {
    if (message.includes("spending cap")) {
      return res
        .status(429)
        .json({
          error: "Quota API dépassé : Le plafond de dépenses a été atteint.",
          original: message,
        });
    }
    return res
      .status(429)
      .json({
        error:
          "Limite de requêtes atteinte : Veuillez patienter une minute avant de réessayer.",
        original: message,
      });
  }

  if (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand") ||
    status === 503
  ) {
    return res.status(503).json({
      error:
        "Le modèle IA connaît actuellement une forte affluence temporaire (503). Veuillez patienter quelques secondes et réessayer.",
      retryable: true,
      original: message,
    });
  }

  res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
};

// Robust helper to call Gemini with multi-model fallback cascade for 503 / high-demand resilience
export async function callGeminiWithFallback({
  ai,
  requestedModel,
  contents,
  config,
}: {
  ai: any;
  requestedModel?: string;
  contents: any;
  config?: any;
}) {
  const primaryModel = requestedModel || "gemini-3.8-flash";
  const modelCandidates: string[] = [primaryModel];

  if (primaryModel === "gemini-3.8-flash") {
    modelCandidates.push("gemini-flash-latest", "gemini-3.6-flash");
  } else if (primaryModel === "gemini-3.6-flash") {
    modelCandidates.push("gemini-flash-latest", "gemini-3.8-flash");
  } else if (primaryModel === "gemini-flash-latest") {
    modelCandidates.push("gemini-3.8-flash", "gemini-3.6-flash");
  } else {
    modelCandidates.push("gemini-3.8-flash", "gemini-flash-latest");
  }

  // Remove duplicates while preserving order
  const modelsToTry = Array.from(new Set(modelCandidates));
  let lastError: any = null;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];
    const maxRetries = mIdx === 0 ? 2 : 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[AI] Requesting model ${currentModel} (attempt ${attempt + 1}/${maxRetries + 1})...`
        );
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = err.message || String(err);
        const status = err.status || 0;
        const is503 =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          status === 503;
        const is429 =
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          status === 429;

        if (is503 || is429) {
          console.warn(
            `[AI] Model ${currentModel} encountered ${
              is503 ? "503 High Demand" : "429 Rate Limit"
            } (attempt ${attempt + 1}/${maxRetries + 1}):`,
            msg.slice(0, 160)
          );

          if (attempt < maxRetries) {
            const delay = 1200 * Math.pow(1.5, attempt) + Math.random() * 500;
            console.log(`[AI] Retrying ${currentModel} in ${Math.round(delay)}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          } else if (mIdx < modelsToTry.length - 1) {
            const nextModel = modelsToTry[mIdx + 1];
            console.log(`[AI] Switching to fallback model: ${nextModel}...`);
            break;
          }
        } else {
          // If non-retryable error (e.g. 400 Invalid Argument or 403 Forbidden), rethrow immediately
          throw err;
        }
      }
    }
  }

  throw lastError;
}

app.post(
  ["/api/gemini/generateContent", "/gemini/generateContent"],
  async (req, res) => {
    const { model, contents, config, userKey } = req.body;

    const apiKey = userKey || process.env.GEMINI_API_KEY;
    if (
      !apiKey ||
      apiKey === "MY_GEMINI_API_KEY" ||
      apiKey === "MISSING_API_KEY"
    ) {
      return res
        .status(403)
        .json({
          error:
            "Clé API Gemini manquante. Veuillez configurer la clé dans les paramètres de l'application (Icône engrenage).",
        });
    }

    try {
      const ai = getAI(apiKey);

      const response = await callGeminiWithFallback({
        ai,
        requestedModel: model || "gemini-3.8-flash",
        contents,
        config,
      });

      res.json({
        text: response.text,
        candidates: (response as any).candidates,
      });
    } catch (error: any) {
      console.error("[AI] Error in generateContent:", error);
      handleAIError(error, res);
    }
  },
);

app.post(["/api/gemini/analyze", "/gemini/analyze"], async (req, res) => {
  const { images, userKey } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: "Aucune image fournie pour l'analyse." });
  }

  const apiKey = userKey || process.env.GEMINI_API_KEY;
  if (
    !apiKey ||
    apiKey === "MY_GEMINI_API_KEY" ||
    apiKey === "MISSING_API_KEY"
  ) {
    return res
      .status(403)
      .json({
        error:
          "Clé API Gemini manquante. Veuillez configurer la clé dans les paramètres de l'application (Icône engrenage).",
      });
  }

  try {
    const ai = getAI(apiKey);

    const cleanBase64 = (str: string) => {
      if (!str) return "";
      return str.replace(/^data:image\/\w+;base64,/, "");
    };

    const parts: any[] = images.slice(0, 6).map((img: any) => ({
      inlineData: {
        data: cleanBase64(img.base64Image),
        mimeType: img.mimeType || "image/jpeg",
      },
    }));

    parts.push({
      text: `Analyze these plant photos for agronomic purposes. 
      1. Identify the family, species, variety, and the main culture (e.g., Apple, Tomato, Wheat).
      2. Identify the dominant phenological stage according to the BBCH scale (e.g., BBCH 65).
      3. Identify any secondary phenological stages present (e.g., [BBCH 61, BBCH 63]).
      4. Count the production organs visible: flowers and fruits. Provide counts and a brief detail of their development stages.
      5. Extract phenotypic traits: color, shape, size, and health status (including diseases or deficiencies).
      6. Identify the general phenological stage name, its intensity, and quality.
      7. List main characterization traits for variety comparison.
      8. Provide a detailed technical description.`,
    });

    const response = await callGeminiWithFallback({
      ai,
      requestedModel: "gemini-3.6-flash",
      contents: [{ role: "user", parts: parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            family: { type: Type.STRING },
            species: { type: Type.STRING },
            variety: { type: Type.STRING },
            culture: {
              type: Type.STRING,
              description: "Main culture name",
            },
            bbchDominant: {
              type: Type.STRING,
              description: "Dominant BBCH stage",
            },
            bbchSecondary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Secondary BBCH stages present",
            },
            organCounts: {
              type: Type.OBJECT,
              properties: {
                flowers: { type: Type.NUMBER },
                fruits: { type: Type.NUMBER },
                details: {
                  type: Type.STRING,
                  description: "Details of counts by development stage",
                },
              },
              required: ["flowers", "fruits", "details"],
            },
            phenologicalStage: {
              type: Type.STRING,
              description: "General phenological stage name",
            },
            stageIntensity: { type: Type.STRING },
            stageQuality: { type: Type.STRING },
            characterizationTraits: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            description: { type: Type.STRING },
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

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }
    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Error in analyze:", error);
    handleAIError(error, res);
  }
});

app.post(["/api/gemini/chat", "/gemini/chat"], async (req, res) => {
  const { message, history, userKey } = req.body;

  const apiKey = userKey || process.env.GEMINI_API_KEY;
  if (
    !apiKey ||
    apiKey === "MY_GEMINI_API_KEY" ||
    apiKey === "MISSING_API_KEY"
  ) {
    return res
      .status(403)
      .json({
        error:
          "Clé API Gemini manquante. Veuillez configurer la clé dans les paramètres de l'application (Icône engrenage).",
      });
  }

  try {
    const ai = getAI(apiKey);

    const contents = (Array.isArray(history) ? history : []).map((msg: any) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text || (msg.parts && msg.parts[0]?.text) || "" }],
    }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await callGeminiWithFallback({
      ai,
      requestedModel: "gemini-3.6-flash",
      contents: contents,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("[AI] Error in chat:", error);
    handleAIError(error, res);
  }
});

// Proxy for Weather API to avoid client-side fetch errors
app.get(["/api/weather/geocode", "/weather/geocode"], async (req, res) => {
  try {
    const { name } = req.query;
    console.log(`[Weather] Geocoding: ${name}`);
    if (!name) return res.status(400).json({ error: "Name is required" });

    let data: any = null;

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name as string)}&count=1&language=fr&format=json`,
      );
      if (response.ok) {
        data = await response.json();
      }
    } catch (err: any) {
      console.error("[Weather] Open-Meteo geocode failed:", err.message);
    }

    // Fallback geocoding if Open-Meteo failed or didn't return results
    if (!data || !data.results || data.results.length === 0) {
      console.log("[Weather] Attemping fallback geocoding...");
      if (process.env.OPENWEATHERMAP_API_KEY) {
        try {
          const owmGeoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(name as string)}&limit=1&appid=${process.env.OPENWEATHERMAP_API_KEY}`;
          const owmRes = await fetch(owmGeoUrl);
          if (owmRes.ok) {
            const owmData = await owmRes.json();
            if (owmData && owmData.length > 0) {
              // Map to Open-Meteo format
              data = {
                results: [
                  {
                    latitude: owmData[0].lat,
                    longitude: owmData[0].lon,
                    name: owmData[0].name,
                    admin1: owmData[0].state || owmData[0].country,
                    country: owmData[0].country,
                  },
                ],
              };
            }
          }
        } catch (e: any) {
          console.error("[Weather] OWM geocode fallback err:", e.message);
        }
      } else if (process.env.WEATHERAPI_API_KEY && (!data || !data.results)) {
        try {
          const wapiUrl = `https://api.weatherapi.com/v1/search.json?key=${process.env.WEATHERAPI_API_KEY}&q=${encodeURIComponent(name as string)}`;
          const wapiRes = await fetch(wapiUrl);
          if (wapiRes.ok) {
            const wapiData = await wapiRes.json();
            if (wapiData && wapiData.length > 0) {
              data = {
                results: [
                  {
                    latitude: wapiData[0].lat,
                    longitude: wapiData[0].lon,
                    name: wapiData[0].name,
                    admin1: wapiData[0].region,
                    country: wapiData[0].country,
                  },
                ],
              };
            }
          }
        } catch (e: any) {
          console.error(
            "[Weather] WeatherAPI geocode fallback err:",
            e.message,
          );
        }
      }
    }

    if (!data || !data.results || data.results.length === 0) {
      return res
        .status(404)
        .json({ error: "Lieu non trouvé (toutes les API ont échoué)" });
    }

    res.json(data);
  } catch (error: any) {
    console.error("[Weather] Geocode proxy error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get(["/api/weather/forecast", "/weather/forecast"], async (req, res) => {
  try {
    const { lat, lng } = req.query;
    console.log(`[Weather] Forecast for lat=${lat}, lng=${lng}`);
    if (!lat || !lng)
      return res.status(400).json({ error: "Lat and Lng are required" });

    // 1. Open-Meteo (Gratuit, aucune clé API requise)
    let baseData: any = {};
    try {
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration,shortwave_radiation_sum,uv_index_max&past_days=31&forecast_days=16&timezone=auto`;
      const response = await fetch(openMeteoUrl);
      if (response.ok) {
        baseData = await response.json();
      } else {
        console.error("[Weather] Open-Meteo failed:", response.statusText);
      }
    } catch (e: any) {
      console.error("[Weather] Open-Meteo fetch error:", e.message);
    }

    let extraData: any = {};

    // 2. OpenWeatherMap
    if (process.env.OPENWEATHERMAP_API_KEY) {
      try {
        const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric&lang=fr`;
        const owmRes = await fetch(owmUrl);
        if (owmRes.ok) extraData.openweathermap = await owmRes.json();
      } catch (e: any) {
        console.error("Erreur OpenWeatherMap:", e.message);
      }
    }

    // 3. WeatherAPI
    if (process.env.WEATHERAPI_API_KEY) {
      try {
        const waUrl = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHERAPI_API_KEY}&q=${lat},${lng}&days=3&aqi=yes&alerts=yes&lang=fr`;
        const waRes = await fetch(waUrl);
        if (waRes.ok) extraData.weatherapi = await waRes.json();
      } catch (e: any) {
        console.error("Erreur WeatherAPI:", e.message);
      }
    }

    // 4. Visual Crossing
    if (process.env.VISUALCROSSING_API_KEY) {
      try {
        const vcUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lng}?unitGroup=metric&key=${process.env.VISUALCROSSING_API_KEY}&contentType=json&lang=fr`;
        const vcRes = await fetch(vcUrl);
        if (vcRes.ok) extraData.visualcrossing = await vcRes.json();
      } catch (e: any) {
        console.error("Erreur VisualCrossing:", e.message);
      }
    }

    // Merge extra sources along with Open-Meteo
    let usedFallback = false;
    if (!baseData || Object.keys(baseData).length === 0 || !baseData.daily) {
      console.log("[Weather] Building fallback from extra sources");
      usedFallback = true;
      baseData = {
        current: {
          temperature_2m: 20,
          wind_speed_10m: 0,
          uv_index: 0,
          relative_humidity_2m: 50,
          weather_code: 0,
        },
        daily: {
          time: [],
          temperature_2m_max: [],
          temperature_2m_min: [],
          temperature_2m_mean: [],
          precipitation_sum: [],
          precipitation_probability_max: [],
          wind_speed_10m_max: [],
          et0_fao_evapotranspiration: [],
          shortwave_radiation_sum: [],
          uv_index_max: [],
          weather_code: [],
        },
      };

      const today = new Date().toISOString().split("T")[0];

      if (extraData.visualcrossing && extraData.visualcrossing.days) {
        baseData.current.temperature_2m =
          extraData.visualcrossing.currentConditions?.temp || 20;
        baseData.current.wind_speed_10m =
          extraData.visualcrossing.currentConditions?.windspeed || 0;
        baseData.current.uv_index =
          extraData.visualcrossing.currentConditions?.uvindex || 0;
        baseData.current.relative_humidity_2m =
          extraData.visualcrossing.currentConditions?.humidity || 50;

        extraData.visualcrossing.days.forEach((day: any) => {
          baseData.daily.time.push(day.datetime);
          baseData.daily.temperature_2m_max.push(day.tempmax);
          baseData.daily.temperature_2m_min.push(day.tempmin);
          baseData.daily.temperature_2m_mean.push(day.temp);
          baseData.daily.precipitation_sum.push(day.precip);
          baseData.daily.precipitation_probability_max.push(day.precipprob);
          baseData.daily.wind_speed_10m_max.push(day.windspeed);
          baseData.daily.uv_index_max.push(day.uvindex);
          baseData.daily.weather_code.push(0);
        });
      } else if (extraData.weatherapi && extraData.weatherapi.forecast) {
        baseData.current.temperature_2m =
          extraData.weatherapi.current?.temp_c || 20;
        baseData.current.wind_speed_10m =
          extraData.weatherapi.current?.wind_kph || 0;
        baseData.current.uv_index = extraData.weatherapi.current?.uv || 0;
        baseData.current.relative_humidity_2m =
          extraData.weatherapi.current?.humidity || 50;

        extraData.weatherapi.forecast.forecastday.forEach((day: any) => {
          baseData.daily.time.push(day.date);
          baseData.daily.temperature_2m_max.push(day.day.maxtemp_c);
          baseData.daily.temperature_2m_min.push(day.day.mintemp_c);
          baseData.daily.temperature_2m_mean.push(day.day.avgtemp_c);
          baseData.daily.precipitation_sum.push(day.day.totalprecip_mm);
          baseData.daily.precipitation_probability_max.push(
            day.day.daily_chance_of_rain,
          );
          baseData.daily.wind_speed_10m_max.push(day.day.maxwind_kph);
          baseData.daily.uv_index_max.push(day.day.uv);
          baseData.daily.weather_code.push(0);
        });
      } else if (extraData.openweathermap) {
        baseData.current.temperature_2m =
          extraData.openweathermap.main?.temp || 20;
        baseData.current.wind_speed_10m =
          (extraData.openweathermap.wind?.speed || 0) * 3.6;
        baseData.current.relative_humidity_2m =
          extraData.openweathermap.main?.humidity || 50;

        baseData.daily.time.push(today);
        baseData.daily.temperature_2m_max.push(
          extraData.openweathermap.main?.temp_max || 20,
        );
        baseData.daily.temperature_2m_min.push(
          extraData.openweathermap.main?.temp_min || 20,
        );
        baseData.daily.temperature_2m_mean.push(
          extraData.openweathermap.main?.temp || 20,
        );
        baseData.daily.precipitation_sum.push(0);
        baseData.daily.precipitation_probability_max.push(0);
        baseData.daily.wind_speed_10m_max.push(baseData.current.wind_speed_10m);
        baseData.daily.uv_index_max.push(0);
        baseData.daily.weather_code.push(0);
      } else {
        console.warn("[Weather] Warning: All weather APIs failed, serving complete fallback defaults.");
        for (let i = 0; i < 5; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split("T")[0];
          baseData.daily.time.push(dateStr);
          baseData.daily.temperature_2m_max.push(20 + (i % 3));
          baseData.daily.temperature_2m_min.push(15 - (i % 2));
          baseData.daily.temperature_2m_mean.push(17);
          baseData.daily.precipitation_sum.push(0);
          baseData.daily.precipitation_probability_max.push(10);
          baseData.daily.wind_speed_10m_max.push(12);
          baseData.daily.et0_fao_evapotranspiration.push(3);
          baseData.daily.shortwave_radiation_sum.push(15);
          baseData.daily.uv_index_max.push(4);
          baseData.daily.weather_code.push(0);
        }
      }
    }

    const data = {
      ...baseData,
      extras: extraData,
      isFallback: usedFallback,
    };

    res.json(data);
  } catch (error: any) {
    console.error("[Weather] Weather proxy error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Realtime Gemini Live Multimodal Frame Analysis (Hybrid / HTTP streaming fallback)
app.post(["/api/gemini/live-analyze", "/gemini/live-analyze"], async (req, res) => {
  try {
    const { image, prompt, question, history, apiKey: userKey } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image vidéo requise pour l'analyse en temps réel" });
    }

    const ai = getAI(userKey);
    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const parts: any[] = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      },
    ];

    const systemPrompt = `Tu es AgriScan Live, expert agronome en direct. Tu analyses ce flux vidéo en temps réel pour un agriculteur ou jardinier.
Identifie immédiatement la plante, son état sanitaire, la présence éventuelle de maladies, ravageurs ou carences, et donne un conseil pratique immédiat.
Réponds STRICTEMENT sous format JSON valide avec la structure suivante :
{
  "plantName": "Nom commun (Nom latin)",
  "confidence": 95,
  "healthStatus": "Excellente" | "Bonne" | "Vigilance" | "Attaque / Maladie critique",
  "diagnosis": "Nom précis de la pathologie ou 'Plante saine'",
  "symptoms": "Description concise des symptômes visibles (1 phrase)",
  "recommendedAction": "Action de biocontrôle ou traitement immédiat (1-2 phrases)",
  "vocalAdvice": "Phrase naturelle et bienveillante d'environ 15-25 mots à prononcer à voix haute pour informer l'agriculteur."
}`;

    const userText = question || prompt || "Analyse cette culture en temps réel. Que vois-tu ?";
    parts.push({ text: `${systemPrompt}\n\nQuestion de l'utilisateur : ${userText}` });

    const result = await callGeminiWithFallback({
      ai,
      requestedModel: "gemini-3.8-flash",
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = result?.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    res.json({
      success: true,
      data: parsed,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Gemini Live Analyze] Error:", error);
    handleAIError(error, res);
  }
});

// Catch-all for API routes to prevent HTML redirection (Vite fallback)
app.use(["/api/*", "/api"], (req, res) => {
  console.warn(`[Server] 404 API Route non trouvée: ${req.method} ${req.url}`);
  res.status(404).json({
    error: "Route API non trouvée",
    method: req.method,
    path: req.url,
    hint: "Assurez-vous que l'URL commence par /api/ et correspond à un endpoint valide.",
  });
});

export default app;
