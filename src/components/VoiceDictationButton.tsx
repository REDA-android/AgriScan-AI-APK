import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  lang?: string; // e.g. 'fr-FR', 'ar-MA', 'en-US'
  className?: string;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  currentValue = '',
  lang = 'fr-FR',
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("La dictée vocale n'est pas supportée sur ce navigateur. Veuillez utiliser Chrome ou Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        setInterimText(currentInterim);

        if (finalTranscript) {
          const updatedValue = currentValue ? `${currentValue.trim()} ${finalTranscript.trim()}` : finalTranscript.trim();
          onTranscript(updatedValue);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
      setIsListening(false);
      setInterimText('');
    }
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? "Arrêter la dictée vocale" : "Dicter vocalement la note"}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
          isListening
            ? "bg-rose-600 text-white animate-pulse ring-2 ring-rose-400/50"
            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
        } ${className}`}
      >
        {isListening ? (
          <>
            <MicOff size={14} className="text-white" />
            <span>En écoute...</span>
          </>
        ) : (
          <>
            <Mic size={14} />
            <span>Dicter</span>
          </>
        )}
      </button>

      {isListening && interimText && (
        <span className="text-[11px] text-amber-500 dark:text-amber-400 italic font-medium animate-pulse truncate max-w-[150px]">
          "{interimText}"
        </span>
      )}
    </div>
  );
};

export default VoiceDictationButton;
