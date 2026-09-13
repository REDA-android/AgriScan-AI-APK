export interface AudioGuideContent {
  cropName: string;
  variety?: string;
  healthStatus?: string;
  diseases?: string[];
  symptoms?: string[];
  organicTreatments?: string[];
  chemicalTreatments?: string[];
  preventions?: string[];
  generalNotes?: string;
}

export class AudioGuideService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static buildScript(content: AudioGuideContent, lang: 'fr' | 'ar' | 'en' | 'es'): string {
    const isHealthy = (content.healthStatus || '').toLowerCase().includes('sain') ||
      (content.healthStatus || '').toLowerCase().includes('healthy') ||
      (content.healthStatus || '').toLowerCase().includes('bon');

    if (lang === 'ar') {
      let script = `تقرير الفحص الزراعي لـ ${content.cropName}. `;
      if (content.variety) script += `الصنف: ${content.variety}. `;
      if (isHealthy) {
        script += `الحالة الصحية ممتازة. لم يتم رصد أي أمراض أو آفات خطيرة. `;
      } else {
        script += `تم رصد بعض المشاكل الصحية. `;
        if (content.diseases && content.diseases.length > 0) {
          script += `الأمراض أو الآفات المشخصة هي: ${content.diseases.join('، ')}. `;
        }
      }
      if (content.organicTreatments && content.organicTreatments.length > 0) {
        script += `العلاجات البيولوجية والوقائية الموصى بها: ${content.organicTreatments.slice(0, 3).join('. ')}. `;
      }
      if (content.preventions && content.preventions.length > 0) {
        script += `إجراءات الوقاية: ${content.preventions.slice(0, 2).join('. ')}. `;
      }
      return script;
    }

    if (lang === 'en') {
      let script = `AgriScan agronomic diagnosis for ${content.cropName}. `;
      if (content.variety) script += `Variety: ${content.variety}. `;
      if (isHealthy) {
        script += `Health status: Healthy. No critical pathogen detected. `;
      } else {
        script += `Health alert detected. `;
        if (content.diseases && content.diseases.length > 0) {
          script += `Diagnosed issues: ${content.diseases.join(', ')}. `;
        }
      }
      if (content.organicTreatments && content.organicTreatments.length > 0) {
        script += `Recommended organic treatments: ${content.organicTreatments.slice(0, 3).join('. ')}. `;
      }
      if (content.preventions && content.preventions.length > 0) {
        script += `Preventive field actions: ${content.preventions.slice(0, 2).join('. ')}. `;
      }
      return script;
    }

    if (lang === 'es') {
      let script = `Diagnóstico agronómico de AgriScan para ${content.cropName}. `;
      if (content.variety) script += `Variedad: ${content.variety}. `;
      if (isHealthy) {
        script += `Estado de salud: Sano. No se detectaron plagas críticas. `;
      } else {
        script += `Alerta sanitaria detectada. `;
        if (content.diseases && content.diseases.length > 0) {
          script += `Patologías identificadas: ${content.diseases.join(', ')}. `;
        }
      }
      if (content.organicTreatments && content.organicTreatments.length > 0) {
        script += `Tratamientos ecológicos recomendados: ${content.organicTreatments.slice(0, 3).join('. ')}. `;
      }
      if (content.preventions && content.preventions.length > 0) {
        script += `Medidas preventivas: ${content.preventions.slice(0, 2).join('. ')}. `;
      }
      return script;
    }

    // Default French
    let script = `Diagnostic agronomique AgriScan pour ${content.cropName}. `;
    if (content.variety) script += `Variété observée : ${content.variety}. `;
    if (isHealthy) {
      script += `État de santé global : Sain. Aucun pathogène critique identifié sur le végétal. `;
    } else {
      script += `Alerte sanitaire détectée sur la culture. `;
      if (content.diseases && content.diseases.length > 0) {
        script += `Pathologies ou ravageurs identifiés : ${content.diseases.join(', ')}. `;
      }
    }
    if (content.organicTreatments && content.organicTreatments.length > 0) {
      script += `Traitements biologiques recommandés : ${content.organicTreatments.slice(0, 3).join('. ')}. `;
    }
    if (content.chemicalTreatments && content.chemicalTreatments.length > 0) {
      script += `En cas de forte pression : ${content.chemicalTreatments.slice(0, 2).join('. ')}. `;
    }
    if (content.preventions && content.preventions.length > 0) {
      script += `Mesures préventives au champ : ${content.preventions.slice(0, 2).join('. ')}. `;
    }
    return script;
  }

  public static speak(
    text: string,
    lang: 'fr' | 'ar' | 'en' | 'es',
    rate: number = 1.0,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synth) return;

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langCodes: Record<string, string> = {
      fr: 'fr-FR',
      ar: 'ar-SA',
      en: 'en-US',
      es: 'es-ES'
    };

    utterance.lang = langCodes[lang] || 'fr-FR';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Find a matching voice if available
    const voices = this.synth.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith(lang) || v.lang.replace('_', '-').startsWith(langCodes[lang]));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error", e);
      if (onError) onError(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public static pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public static resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public static isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}
