import exifr from 'exifr';
import { Camera, Image as ImageIcon, MapPin, Upload, X, WifiOff, CheckCircle, Plus, Play, ChevronDown, ChevronUp, Sliders, Check, RefreshCw, Mic, Video, FileText, Paperclip, Volume2, Square, Link as LinkIcon, Scan, Sprout, Bug, Ruler, Scale, ClipboardCheck, FlaskConical, Lock, Unlock, ChevronRight, Edit3, Trash2, Sparkles, Clock, Send, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef, useState, useEffect, ChangeEvent } from 'react';

import { compressImage } from '../utils/imageUtils';
import { triggerHaptic } from '../utils/haptics';
import { AudioNote, MediaNote } from '../types';

export interface CaptureMetadata {
  scanType?: string;
  lat?: number;
  lng?: number;
  date?: string;
  variety: string;
  culture?: string;
  domain?: string;
  notes?: string;
  plantingDate?: string;
  breeder?: string;
  pruningDate?: string;
  harvestQuantity?: string;
  density?: string;
  fruitFirmness?: string;
  defects?: string;
  audioNotes?: AudioNote[];
  mediaNotes?: MediaNote[];
}

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  mimeType: string;
}

interface CameraViewProps {
  onCapture: (input: File[] | ProcessedImage[], metadata: CaptureMetadata) => void;
  isOnline: boolean;
  onOpenMapPicker: () => void;
  manualLocation: { lat: number; lng: number } | null;
  offlineQueueCount?: number;
  recentObservations?: any[];
  onSelectObservation?: (obs: any) => void;
  onDeleteObservation?: (id: string) => void;
  onEditObservation?: (obs: any) => void;
  isAdmin?: boolean;
  isPro?: boolean;
  proRequestStatus?: 'pending' | 'approved' | 'rejected' | null;
  proRequestMessage?: string;
  onRequestProAccess?: (message: string) => Promise<void>;
}

// Convolution-based image sharpening on a 2D canvas context
const applyFiltersToImage = (
  originalPreview: string,
  contrastVal: number,
  saturationVal: number,
  sharpnessVal: number
): Promise<{ dataUrl: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = originalPreview;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context is null"));
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply CSS Filters in canvas context for high rendering speed
      ctx.filter = `contrast(${contrastVal}%) saturate(${saturationVal}%)`;
      ctx.drawImage(img, 0, 0);

      // Programmatic 3x3 sharpening convolution if sharpness is positive
      if (sharpnessVal > 0) {
        const mix = sharpnessVal / 100;
        const width = canvas.width;
        const height = canvas.height;
        
        // Edge sharpening weights kernel
        const weights = [
          0, -1, 0,
          -1, 4 + 1 / mix, -1,
          0, -1, 0
        ];
        
        const srcData = ctx.getImageData(0, 0, width, height);
        const dstData = ctx.createImageData(width, height);
        const src = srcData.data;
        const dst = dstData.data;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dstOff = (y * width + x) * 4;
            let r = 0, g = 0, b = 0;
            
            for (let cy = 0; cy < 3; cy++) {
              for (let cx = 0; cx < 3; cx++) {
                const scy = y + cy - 1;
                const scx = x + cx - 1;
                
                if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
                  const srcOff = (scy * width + scx) * 4;
                  const wt = weights[cy * 3 + cx];
                  r += src[srcOff] * wt;
                  g += src[srcOff + 1] * wt;
                  b += src[srcOff + 2] * wt;
                }
              }
            }
            
            const normVal = 1 / (4 + 1 / mix - 4);
            dst[dstOff] = Math.min(255, Math.max(0, r * normVal));
            dst[dstOff + 1] = Math.min(255, Math.max(0, g * normVal));
            dst[dstOff + 2] = Math.min(255, Math.max(0, b * normVal));
            dst[dstOff + 3] = src[dstOff + 3]; // original alpha
          }
        }
        ctx.putImageData(dstData, 0, 0);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              dataUrl: reader.result as string,
              blob: blob
            });
          };
          reader.readAsDataURL(blob);
        } else {
          reject(new Error("Blob extraction failed"));
        }
      }, "image/jpeg", 0.85);
    };
    img.onerror = (e) => reject(e);
  });
};

export default function CameraView({ 
  onCapture, 
  isOnline, 
  onOpenMapPicker, 
  manualLocation, 
  offlineQueueCount,
  recentObservations,
  onSelectObservation,
  onDeleteObservation,
  onEditObservation,
  isAdmin = false,
  isPro = false,
  proRequestStatus = null,
  proRequestMessage = '',
  onRequestProAccess
}: CameraViewProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docPhotoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<{ file: File, preview: string, blob: Blob }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'exif' | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scanType, setScanType] = useState<string>('general');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [selectedProMode, setSelectedProMode] = useState<any>(null);
  const [proMessageInput, setProMessageInput] = useState<string>(
    proRequestMessage || "Bonjour Administrateur, je souhaite demander l'accès au Compte Pro pour débloquer l'ensemble des modes d'analyse avancés."
  );
  const [isSendingProReq, setIsSendingProReq] = useState(false);
  const [proRequestSentSuccess, setProRequestSentSuccess] = useState(false);

  useEffect(() => {
    if (proRequestMessage) {
      setProMessageInput(proRequestMessage);
    }
  }, [proRequestMessage]);

  const analysisModesList = [
    {
      id: 'general',
      title: 'Observation générale',
      protocolTitle: 'Protocole photo · Générale',
      subtitle: 'Analyse agronomique complète, tous aspects.',
      icon: Scan,
      isDev: false,
      adviceTitle: 'Conseils Prise de Vue : Vue Globale',
      bullets: [
        "Une vue d'ensemble du plant, puis un gros plan net de la zone d'intérêt.",
        "Photographier aussi le dessous des feuilles si un symptôme apparaît.",
        "Lumière du jour, sans contre-jour ni reflets : éviter le flou de bougé.",
        "Un repère d'échelle (main, règle) aide à juger la taille."
      ]
    },
    {
      id: 'phenology',
      title: 'Stades phénologiques clés',
      protocolTitle: 'Protocole photo · Stades BBCH',
      subtitle: 'Suivi du stade BBCH et des transitions.',
      icon: Sprout,
      isDev: true,
      adviceTitle: 'Conseils Prise de Vue : Organes & Stades BBCH',
      bullets: [
        "Cadrer plusieurs organes repères (bourgeons, fleurs, jeunes fruits).",
        "Prendre en photo l'apex et les nœuds phénologiques principaux.",
        "Privilégier un angle latéral montrant l'ouverture des pièces florales.",
        "Observer plusieurs arbres/plants de la parcelle pour un stade moyen."
      ]
    },
    {
      id: 'pathology',
      title: 'Observation phytosanitaire',
      protocolTitle: 'Protocole photo · Phytosanitaire',
      subtitle: 'Détection maladies, ravageurs, désordres.',
      icon: Bug,
      isDev: true,
      adviceTitle: 'Conseils Prise de Vue : Pathologies & Symptômes',
      bullets: [
        "Gros plan NET sur le symptôme (lésions, taches, chenilles, nectar).",
        "Photographier la face supérieure ET la face inférieure des feuilles.",
        "Mettre en évidence la bordure de transition entre zone saine et nécrosée.",
        "Préciser si le problème est localisé ou généralisé sur le feuillage."
      ]
    },
    {
      id: 'fruit',
      title: 'Calibre / Calibrage',
      protocolTitle: 'Protocole photo · Calibrage & Fruits',
      subtitle: 'Taille des fruits et distribution.',
      icon: Ruler,
      isDev: true,
      adviceTitle: 'Conseils Prise de Vue : Fruits & Calibre',
      bullets: [
        "Placer les fruits posés à plat à côté d'une échelle de mesure (règle ou monnaie).",
        "Éviter les ombres portées directes qui déforment le contour du fruit.",
        "Photographier sous un angle à 90° au-dessus des fruits (vue zénithale).",
        "Prendre un échantillon représentatif d'au moins 5 à 10 fruits."
      ]
    },
    {
      id: 'production',
      title: 'Estimation de production',
      protocolTitle: 'Protocole photo · Rendement & Charge',
      subtitle: 'Comptage et estimation du rendement.',
      icon: Scale,
      isDev: true,
      adviceTitle: 'Conseils Prise de Vue : Estimation Rendement',
      bullets: [
        "Cadrer l'ensemble de la charge en fruits/grappes sur la zone témoin.",
        "Conserver une distance constante par rapport au rang ou au cep.",
        "Décomposer la prise de vue sur plusieurs hauteurs de végétation.",
        "Éviter les masquages par le feuillage autant que possible."
      ]
    },
    {
      id: 'quality',
      title: 'Agréage / Scoring qualité',
      protocolTitle: 'Protocole photo · Scoring Qualité',
      subtitle: 'Notation qualité : défauts, couleur, calibre.',
      icon: ClipboardCheck,
      isDev: true,
      adviceTitle: 'Conseils Prise de Vue : Agréage',
      bullets: [
        "Détailler les défauts d'aspect (russeting, échaudage, piqûres, coloration).",
        "Prendre des photos sous un éclairage neutre et homogène.",
        "Présenter la face la plus marquée ainsi que la face opposée du fruit.",
        "Aligner les fruits pour faciliter la comparaison de couleur et régularité."
      ]
    },
    {
      id: 'rd',
      title: 'R&D / Suivi d’essais',
      protocolTitle: 'Protocole photo · Essais R&D',
      subtitle: "Suivi de modalités et comparaison d'essais.",
      icon: FlaskConical,
      isDev: true,
      adviceTitle: 'Conseils Prise de Vue : Suivi R&D',
      bullets: [
        "Cadrer côte à côte ou sous le même repère les modalités comparées.",
        "Conserver exactement le même angle et la même exposition pour chaque mesure.",
        "Prendre en référence la plaque d'identification de la modalité/micro-parcelle.",
        "Noter les dates et conditions d'application lors de la prise de vue."
      ]
    }
  ];

  // Filter & photo-tuning states
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [tempContrast, setTempContrast] = useState(100);
  const [tempSaturation, setTempSaturation] = useState(100);
  const [tempSharpness, setTempSharpness] = useState(0);
  const [isFilterApplying, setIsFilterApplying] = useState(false);

  // Form state
  const [variety, setVariety] = useState('');
  const [culture, setCulture] = useState('');
  const [domain, setDomain] = useState('');
  const [notes, setNotes] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [breeder, setBreeder] = useState('');
  const [pruningDate, setPruningDate] = useState('');
  const [harvestQuantity, setHarvestQuantity] = useState('');
  const [density, setDensity] = useState('');
  const [fruitFirmness, setFruitFirmness] = useState('');
  const [defects, setDefects] = useState('');

  // Complementary Items (Voice notes & media notes before analysis)
  const [extraAudioNote, setExtraAudioNote] = useState<AudioNote | null>(null);
  const [extraMediaFiles, setExtraMediaFiles] = useState<MediaNote[]>([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<any>(null);

  const [exifDate, setExifDate] = useState<string | undefined>(undefined);

  // Audio Recording Handlers for Scanner Note Vocale
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      audioRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const newAudioNote: AudioNote = {
            id: Date.now().toString(),
            name: `Note Vocale ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            url: reader.result as string,
            durationSeconds: recordingSeconds,
            createdAt: new Date().toISOString(),
          };
          setExtraAudioNote(newAudioNote);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      audioTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access error", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorderRef.current && isRecordingAudio) {
      audioRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    }
  };

  const handleExtraMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    Array.from(selected).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileType: 'image' | 'video' | 'audio' | 'document' = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
          ? 'audio'
          : 'document';

        const newMedia: MediaNote = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          name: file.name,
          url: reader.result as string,
          type: fileType,
          size: file.size,
          createdAt: new Date().toISOString(),
        };
        setExtraMediaFiles((prev) => [...prev, newMedia]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        let position: { coords: { latitude: number; longitude: number } };
        const { Capacitor } = await import('@capacitor/core');

        if (Capacitor.isNativePlatform()) {
          const { Geolocation } = await import('@capacitor/geolocation');
          let check = await Geolocation.checkPermissions();
          if (check.location !== 'granted') {
            check = await Geolocation.requestPermissions();
          }

          try {
            position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
          } catch (error) {
            position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
          }
        } else {
          position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Géolocalisation non supportée"));
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true,
            });
          });
        }

        // Only set GPS if we haven't already set EXIF location
        setCurrentLocation(prev => {
          if (locationSource === 'exif') return prev;
          setLocationSource('gps');
          return {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        });
      } catch (error) {
        console.warn("Geolocation error:", error);
      }
    };
    fetchLocation();

    if (offlineQueueCount !== undefined) {
      setOfflineQueue(offlineQueueCount);
    } else {
      const queue = JSON.parse(localStorage.getItem('agroscan_offline_queue') || '[]');
      setOfflineQueue(queue.length);
    }
  }, [locationSource, offlineQueueCount]);

  useEffect(() => {
    if (offlineQueueCount !== undefined) {
      setOfflineQueue(offlineQueueCount);
    }
  }, [offlineQueueCount]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setIsProcessing(true);
      
      // Extract EXIF from the first file if available
      if (files.length === 0) {
        try {
          const exifData = await exifr.parse(selectedFiles[0], { gps: true, exif: true });
          if (exifData) {
            if (exifData.latitude && exifData.longitude) {
              setCurrentLocation({ lat: exifData.latitude, lng: exifData.longitude });
              setLocationSource('exif');
            }
            if (exifData.DateTimeOriginal) {
              setExifDate(exifData.DateTimeOriginal.toISOString());
            }
          }
        } catch (exifError) {
          console.warn("No EXIF data found", exifError);
        }
      }
      
      try {
        const newFiles = [];
        // Process sequentially to avoid memory crashes on mobile
        for (const file of selectedFiles) {
          try {
            const { dataUrl, blob } = await compressImage(file, 1600, 1600, 0.85);
            newFiles.push({ file, preview: dataUrl, blob });
          } catch (compressError) {
            console.error("Compression failed for file", file.name, compressError);
            // Fallback
            const fallbackPreview = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (ev) => resolve(ev.target?.result as string);
              reader.readAsDataURL(file);
            });
            const fallbackBlob = await (await fetch(fallbackPreview)).blob();
            newFiles.push({ file, preview: fallbackPreview, blob: fallbackBlob });
          }
        }

        setFiles(prev => [...prev, ...newFiles]);
        triggerHaptic('light');
      } catch (error) {
        console.error("Error processing files:", error);
        alert("Erreur lors du traitement des images.");
      } finally {
        setIsProcessing(false);
      }
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0) {
        setLocationSource(null);
        setExifDate(undefined);
      }
      return newFiles;
    });
  };

  const handleAnalyze = async () => {
    if (files.length === 0 || !variety.trim()) return;
    
    setIsProcessing(true);
    
    const firstFile = files[0].file;
    
    let latitude = manualLocation?.lat || currentLocation?.lat;
    let longitude = manualLocation?.lng || currentLocation?.lng;
    let date = exifDate;

    const metadata: CaptureMetadata = {
      lat: latitude,
      lng: longitude,
      date,
      variety: variety.trim(),
      culture: culture.trim() || undefined,
      domain: domain.trim() || undefined,
      notes: notes.trim() || undefined,
      plantingDate: plantingDate.trim() || undefined,
      breeder: breeder.trim() || undefined,
      pruningDate: pruningDate.trim() || undefined,
      harvestQuantity: harvestQuantity.trim() || undefined,
      density: density.trim() || undefined,
      fruitFirmness: fruitFirmness.trim() || undefined,
      defects: defects.trim() || undefined,
      audioNotes: extraAudioNote ? [extraAudioNote] : [],
      mediaNotes: extraMediaFiles,
    };

    // Pass the compressed data to onCapture
    const processedImages: ProcessedImage[] = files.map(f => ({
      blob: f.blob,
      dataUrl: f.preview,
      mimeType: f.file.type
    }));
    
    onCapture(processedImages, metadata);
    setIsProcessing(false);
    setFiles([]);
    setVariety('');
    setCulture('');
    setDomain('');
    setNotes('');
    setPlantingDate('');
    setBreeder('');
    setPruningDate('');
    setHarvestQuantity('');
    setDensity('');
    setFruitFirmness('');
    setDefects('');
    setExtraAudioNote(null);
    setExtraMediaFiles([]);
    setExifDate(undefined);
    setLocationSource(null);
  };

  const activeModeObj = analysisModesList.find((m) => m.id === scanType) || analysisModesList[0];
  const ActiveIcon = activeModeObj.icon;

  if (showModeSelector) {
    return (
      <div className="space-y-4">
        {/* Top Header bar with Back button */}
        <div className="flex items-center justify-between bg-white dark:bg-[#161c18] border border-slate-200 dark:border-white/10 rounded-2xl p-3 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setShowModeSelector(false);
              triggerHaptic('light');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-200/80 dark:border-transparent"
          >
            <ChevronRight size={16} className="rotate-180 text-slate-600 dark:text-slate-400" />
            <span>Retour à l'appareil</span>
          </button>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Modes d'analyse
          </span>
        </div>

        {/* Pro Status Banner */}
        {isAdmin || isPro ? (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-bold text-emerald-950 dark:text-emerald-200">Compte Pro Actif</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400/80 hidden sm:inline">— Tous les modes d'analyse sont débloqués.</span>
            </div>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30">PRO</span>
          </div>
        ) : proRequestStatus === 'pending' ? (
          <div 
            onClick={() => {
              setSelectedProMode(analysisModesList[1]);
              setShowProModal(true);
            }}
            className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 cursor-pointer hover:border-amber-300 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
              <div>
                <p className="font-bold text-xs text-amber-950 dark:text-amber-200">Demande d'accès Pro envoyée à l'administrateur</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400/80">Cliquez ici pour consulter ou mettre à jour votre message.</p>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-600 text-white dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/30 shrink-0">EN ATTENTE</span>
          </div>
        ) : (
          <div 
            onClick={() => {
              setSelectedProMode(analysisModesList[1]);
              setShowProModal(true);
            }}
            className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 cursor-pointer hover:border-emerald-400 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-emerald-950 dark:text-emerald-300 text-xs truncate">Débloquer les modes d'analyse Pro</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">Demander l'accès Pro à l'admin pour BBCH, Calibre & Pathologies.</p>
              </div>
            </div>
            <button type="button" className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-sm transition-colors">
              Demander
            </button>
          </div>
        )}

        {/* Scan Mode cards list */}
        <div className="space-y-2.5">
          {analysisModesList.map((mode) => {
            const Icon = mode.icon;
            const isSelected = scanType === mode.id;
            const isProUser = isAdmin || isPro;
            const isLockedForUser = mode.isDev && !isProUser;

            return (
              <div
                key={mode.id}
                onClick={() => {
                  if (isLockedForUser) {
                    triggerHaptic('light');
                    setSelectedProMode(mode);
                    setShowProModal(true);
                    return;
                  }
                  setScanType(mode.id);
                  setShowModeSelector(false); // Instantly return to capture view upon selection!
                  triggerHaptic('light');
                }}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 border shadow-sm ${
                  isSelected
                    ? 'bg-emerald-50/80 dark:bg-[#161c18] border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30 shadow-md'
                    : isLockedForUser
                    ? 'bg-white dark:bg-[#161c18]/60 border-slate-200 dark:border-white/5 opacity-90 hover:border-amber-400'
                    : 'bg-white dark:bg-[#161c18]/80 border-slate-200 dark:border-white/5 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-emerald-600 text-white dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500/40'
                      : isLockedForUser
                      ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                      : 'bg-slate-100 text-emerald-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-white/5'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {mode.title}
                      </span>
                      {mode.isDev && (
                        isProUser ? (
                          <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                            <Unlock size={10} /> {isAdmin ? 'ACCÈS ADMIN' : 'ACCÈS PRO'}
                          </span>
                        ) : proRequestStatus === 'pending' ? (
                          <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                            <Clock size={10} /> DEMANDE EN ATTENTE
                          </span>
                        ) : (
                          <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 flex items-center gap-1">
                            <Lock size={10} /> ACCÈS PRO
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-tight truncate">
                      {mode.subtitle}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center pl-1">
                  {isLockedForUser ? (
                    <Lock size={16} className="text-amber-600 dark:text-amber-400" />
                  ) : (
                    <ChevronRight size={18} className={isSelected ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-600"} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Active Mode pill & Changer de type Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#161c18] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setShowModeSelector(true);
            triggerHaptic('light');
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-emerald-300/80 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-sm"
        >
          <ActiveIcon size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{activeModeObj.title}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowModeSelector(true);
            triggerHaptic('light');
          }}
          className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Changer de type</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Image Gallery / Upload Area */}
      <div className="bg-[#161c18] rounded-2xl p-4 shadow-none border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-slate-200">Photos ({files.length})</h2>
          {files.length > 0 && (
            <div className="flex gap-2">
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Camera size={16} />
                Prendre
              </button>
              <button 
                onClick={() => galleryInputRef.current?.click()}
                className="p-2 bg-[#0d120f] text-slate-400 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Upload size={16} />
                Importer
              </button>
            </div>
          )}
        </div>

        <input 
          type="file" 
          ref={cameraInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          capture="environment"
          className="hidden" 
        />
        <input 
          type="file" 
          ref={galleryInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple
          className="hidden" 
        />

        {files.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {files.map((f, i) => (
              <div 
                key={i} 
                onClick={() => {
                  setSelectedImageIndex(i);
                  // Initialize slider buffers
                  setTempContrast(100);
                  setTempSaturation(100);
                  setTempSharpness(0);
                }}
                className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                title="Cliquer pour ajuster l'image"
              >
                <img src={f.preview} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#0d120f]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase text-white bg-[#0d120f]/80 px-2 py-1 rounded-md tracking-wider flex items-center gap-1">
                    <Sliders size={10} /> Ajuster
                  </span>
                </div>
                <button 
                  aria-label="Supprimer l'image"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
            >
              <Plus size={24} />
              <span className="text-[10px] font-bold mt-1">Ajouter</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Capture Rapide Green Card */}
            <div
              onClick={() => cameraInputRef.current?.click()}
              className="relative p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-2xl cursor-pointer text-white shadow-lg transition-all border border-emerald-400/30 group overflow-hidden"
            >
              <div className="absolute top-2.5 right-2.5 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-emerald-200 border border-emerald-400/30">
                100% FIABLE
              </div>
              <div className="flex flex-col items-center text-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Camera size={26} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-wide">Capture rapide</h3>
                  <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                    GPS + date garantis · Recommandé
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-3 px-4 bg-[#0d120f] hover:bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera size={16} className="text-emerald-400" />
                <span>Caméra système <span className="text-[10px] text-slate-500 font-normal">(GPS via fallback)</span></span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3 px-4 bg-[#0d120f] hover:bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload size={16} className="text-slate-400" />
                <span>Importer depuis la galerie</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Filter Editor Modal Overlay */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#161c18] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-5 py-3 border-b flex justify-between items-center bg-[#0d120f]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  <span className="font-black text-xs text-slate-300 uppercase tracking-wider">Ajustements botaniques</span>
                </div>
                <button
                  aria-label="Fermer"
                  onClick={() => setSelectedImageIndex(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-5">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[#0d120f] border flex items-center justify-center">
                  <img
                    src={files[selectedImageIndex]?.preview}
                    alt="Tuning preview"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: `contrast(${tempContrast}%) saturate(${tempSaturation}%)`
                    }}
                  />
                  {tempSharpness > 0 && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-600/95 text-white text-[9px] font-black rounded uppercase tracking-widest">
                      Netteté +{tempSharpness}%
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Contraste</span>
                      <span className="text-emerald-400">{tempContrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={tempContrast}
                      onChange={(e) => setTempContrast(Number(e.target.value))}
                      className="slider-glass"
                      style={{ '--slider-bg': `linear-gradient(to right, #3b82f6 ${(tempContrast - 50) * (100/130)}%, rgba(255,255,255,0.1) ${(tempContrast - 50) * (100/130)}%)` } as any}
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Saturation</span>
                      <span className="text-emerald-400">{tempSaturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={tempSaturation}
                      onChange={(e) => setTempSaturation(Number(e.target.value))}
                      className="slider-glass"
                      style={{ '--slider-bg': `linear-gradient(to right, #3b82f6 ${(tempSaturation - 50) * (100/130)}%, rgba(255,255,255,0.1) ${(tempSaturation - 50) * (100/130)}%)` } as any}
                    />
                  </div>

                  {/* Sharpness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Netteté (Clarté)</span>
                      <span className="text-emerald-400">{tempSharpness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempSharpness}
                      onChange={(e) => setTempSharpness(Number(e.target.value))}
                      className="slider-glass"
                      style={{ '--slider-bg': `linear-gradient(to right, #3b82f6 ${tempSharpness}%, rgba(255,255,255,0.1) ${tempSharpness}%)` } as any}
                    />
                    <p className="text-[9px] text-slate-400">
                      Améliore la visibilité des détails morphologiques fins pour l'intelligence artificielle.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t bg-[#0d120f] flex gap-2">
                <button
                  onClick={() => setSelectedImageIndex(null)}
                  className="flex-1 py-2 text-xs font-bold bg-white/10 hover:bg-slate-300 text-slate-300 rounded-lg"
                >
                  Fermer
                </button>
                <button
                  disabled={isFilterApplying}
                  onClick={async () => {
                    if (selectedImageIndex === null) return;
                    setIsFilterApplying(true);
                    try {
                      const original = files[selectedImageIndex];
                      const result = await applyFiltersToImage(
                        original.preview,
                        tempContrast,
                        tempSaturation,
                        tempSharpness
                      );
                      
                      setFiles(prev => {
                        const copy = [...prev];
                        copy[selectedImageIndex] = {
                          file: original.file,
                          preview: result.dataUrl,
                          blob: result.blob
                        };
                        return copy;
                      });
                      
                      triggerHaptic('success');
                      setSelectedImageIndex(null);
                    } catch (err) {
                      console.error(err);
                      alert("Erreur de filtrage.");
                    } finally {
                      setIsFilterApplying(false);
                    }
                  }}
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1 shadow"
                >
                  {isFilterApplying ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={14} /> Appliquer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Metadata Form */}
      <div className="bg-[#161c18] rounded-2xl p-4 shadow-none border border-white/5 space-y-4">
        <h3 className="font-bold text-slate-200 text-sm">Informations de l'observation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Culture (Espèce principale)</label>
            <input 
              type="text" 
              value={culture}
              onChange={e => setCulture(e.target.value)}
              placeholder="Ex: Tomate, Poivron, Fraise..."
              className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nom de la variété <span className="text-red-400">*</span></label>
            <input 
              type="text" 
              value={variety}
              onChange={e => setVariety(e.target.value)}
              placeholder="Ex: Tomate Marmande..."
              className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
              required
            />
          </div>

          {/* Rattachement spatial */}
          <div className="p-3 bg-[#0d120f] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <LinkIcon size={14} className="text-emerald-400" />
              Rattachement spatial
            </div>
            <p className="text-xs text-slate-400 italic">
              Aucune parcelle ou historique à proximité immédiate.
            </p>
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-xs font-bold text-slate-200">Orpheline (Aucun rattachement)</p>
              <p className="text-[10px] text-slate-400">Enregistrer comme nouvelle observation isolée</p>
            </div>
          </div>

          {/* NOTES GÉNÉRALES */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">NOTES GÉNÉRALES</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations supplémentaires..."
              className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[70px] text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* ÉLÉMENTS COMPLÉMENTAIRES (FACULTATIF) */}
          <div className="space-y-2 pt-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ÉLÉMENTS COMPLÉMENTAIRES (FACULTATIF)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Note vocale */}
              <button
                type="button"
                onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isRecordingAudio
                    ? "bg-rose-600 border-rose-500 text-white animate-pulse"
                    : "bg-[#0d120f] border-white/10 text-slate-200 hover:bg-white/5"
                }`}
              >
                <Mic size={16} className={isRecordingAudio ? "text-white" : "text-emerald-400"} />
                {isRecordingAudio ? `Arrêter (${recordingSeconds}s)` : "Note vocale"}
              </button>

              {/* Vidéo (15s) */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="p-3 bg-[#0d120f] border border-white/10 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5 flex items-center justify-center gap-2 transition-all"
              >
                <Video size={16} className="text-purple-400" />
                Vidéo (15s)
              </button>

              {/* Photo document */}
              <button
                type="button"
                onClick={() => docPhotoInputRef.current?.click()}
                className="p-3 bg-[#0d120f] border border-white/10 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5 flex items-center justify-center gap-2 transition-all"
              >
                <FileText size={16} className="text-amber-400" />
                Photo document
              </button>

              {/* Importer un fichier */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-[#0d120f] border border-white/10 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5 flex items-center justify-center gap-2 transition-all"
              >
                <Paperclip size={16} className="text-blue-400" />
                Importer un fichier
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleExtraMediaChange}
              className="hidden"
            />
            <input
              ref={docPhotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleExtraMediaChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              multiple
              onChange={handleExtraMediaChange}
              className="hidden"
            />

            {/* Preview list of added complementary items */}
            {(extraAudioNote || extraMediaFiles.length > 0) && (
              <div className="space-y-2 pt-2">
                {extraAudioNote && (
                  <div className="p-2 bg-[#0d120f] rounded-xl border border-white/10 flex items-center gap-2">
                    <Volume2 size={15} className="text-emerald-400 flex-shrink-0" />
                    <audio controls src={extraAudioNote.url} className="flex-1 h-7 rounded" />
                    <button
                      type="button"
                      onClick={() => setExtraAudioNote(null)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {extraMediaFiles.map((m) => (
                  <div key={m.id} className="p-2 bg-[#0d120f] rounded-xl border border-white/10 flex items-center justify-between text-xs text-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={14} className="text-blue-400 flex-shrink-0" />
                      <span className="truncate">{m.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExtraMediaFiles((prev) => prev.filter((item) => item.id !== m.id))}
                      className="text-slate-400 hover:text-rose-400 ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INFORMATIONS PARCELLAIRES (FACULTATIF) */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-2.5 text-xs font-bold text-emerald-400 uppercase tracking-wider border-t border-white/5 mt-2 pt-4"
          >
            INFORMATIONS PARCELLAIRES (FACULTATIF)
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Domaine / Site de production</label>
                  <input 
                    type="text" 
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="Ex: Parcelle Nord, Serre A..."
                    className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date de plantation</label>
                    <input 
                      type="date" 
                      value={plantingDate}
                      onChange={e => setPlantingDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date de Taille</label>
                    <input 
                      type="date" 
                      value={pruningDate}
                      onChange={e => setPruningDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Obtenteur de la variété</label>
                  <input 
                    type="text" 
                    value={breeder}
                    onChange={e => setBreeder(e.target.value)}
                    placeholder="Ex: Vilmorin, Gautier..."
                    className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qté récoltée (Kg/pot)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={harvestQuantity}
                      onChange={e => setHarvestQuantity(e.target.value)}
                      placeholder="Ex: 2.5"
                      className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Densité</label>
                    <input 
                      type="text" 
                      value={density}
                      onChange={e => setDensity(e.target.value)}
                      placeholder="Ex: 3.5 pl/m²"
                      className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fermeté des fruits</label>
                  <input 
                    type="text" 
                    value={fruitFirmness}
                    onChange={e => setFruitFirmness(e.target.value)}
                    placeholder="Ex: Très ferme, molle..."
                    className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Défauts qualitatifs observés</label>
                  <textarea 
                    value={defects}
                    onChange={e => setDefects(e.target.value)}
                    placeholder="Ex: Micro-fissures, coloration hétérogène..."
                    className="w-full px-3 py-2 bg-[#0d120f] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[60px] text-slate-100"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleAnalyze}
        disabled={files.length === 0 || isProcessing || !variety.trim()}
        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer my-4"
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <Play size={18} />
            Lancer l'analyse IA
          </>
        )}
      </button>

      {/* Status Badges */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 justify-center">
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-400 text-[10px] font-bold rounded-full">
              <WifiOff size={12} />
              HORS-LIGNE
            </div>
          )}
          {(currentLocation || manualLocation) && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full">
              <MapPin size={12} />
              {manualLocation ? 'GPS MANUEL' : (locationSource === 'exif' ? 'GPS EXIF' : 'GPS ACTIF')}
            </div>
          )}
        </div>
        <button 
          onClick={onOpenMapPicker}
          className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest hover:underline flex items-center justify-center gap-1"
        >
          <MapPin size={12} />
          {manualLocation ? 'Changer la position manuelle' : 'Définir la position manuellement'}
        </button>
      </div>

      <AnimatePresence>
        {offlineQueue > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-500" size={20} />
              <span className="text-xs font-medium text-emerald-400">
                {offlineQueue} photo(s) en attente de synchro
              </span>
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Demande d'Accès Compte Pro */}
      <AnimatePresence>
        {showProModal && selectedProMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#121814] border border-emerald-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-100 space-y-5 relative overflow-hidden"
            >
              <button
                onClick={() => setShowProModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
                  <Sparkles size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 inline-block">
                    COMPTE PRO DÉDIÉ
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    Mode {selectedProMode.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Le mode <strong className="text-emerald-300">{selectedProMode.title}</strong> fait partie des fonctionnalités avancées AgroScan Pro. Envoyez un message directement à l'administrateur pour débloquer votre accès au compte Pro.
              </p>

              {/* Outils Pro inclus */}
              <div className="bg-[#1a231d] rounded-2xl p-3.5 border border-white/5 space-y-2 text-xs">
                <p className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Inclus dans votre accès Compte Pro :
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-emerald-400 shrink-0" /> Stades BBCH & Phénologie</div>
                  <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-emerald-400 shrink-0" /> Diagnostic Phytosanitaire</div>
                  <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-emerald-400 shrink-0" /> Calibrage & Distribution</div>
                  <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-emerald-400 shrink-0" /> Estimation Rendement</div>
                  <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-emerald-400 shrink-0" /> Agréage & Scoring Qualité</div>
                  <div className="flex items-center gap-1.5"><CheckCircle size={13} className="text-emerald-400 shrink-0" /> Suivis & Essais R&D</div>
                </div>
              </div>

              {/* Statut si demande déjà en attente */}
              {proRequestStatus === 'pending' && (
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <Clock size={18} className="shrink-0 mt-0.5 text-amber-400 animate-pulse" />
                  <div>
                    <p className="font-bold text-xs">Demande actuellement en attente</p>
                    <p className="text-[11px] text-amber-300/80 mt-0.5 leading-snug">
                      Votre demande a déjà été transmise à l'administrateur. Vous pouvez ajuster ou réenvoyer votre message ci-dessous si vous le souhaitez.
                    </p>
                  </div>
                </div>
              )}

              {/* Formulaire message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Message pour l'administrateur</span>
                  <span className="text-[10px] text-slate-500">Personnalisable</span>
                </label>
                <textarea
                  rows={3}
                  value={proMessageInput}
                  onChange={(e) => setProMessageInput(e.target.value)}
                  placeholder="Expliquez brièvement votre besoin..."
                  className="w-full bg-[#0d120f] border border-white/10 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (onRequestProAccess) {
                      setIsSendingProReq(true);
                      await onRequestProAccess(proMessageInput);
                      setIsSendingProReq(false);
                      setProRequestSentSuccess(true);
                      setTimeout(() => {
                        setProRequestSentSuccess(false);
                        setShowProModal(false);
                      }, 1800);
                    }
                  }}
                  disabled={isSendingProReq || proRequestSentSuccess}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSendingProReq ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : proRequestSentSuccess ? (
                    <>
                      <Check size={16} className="text-white" />
                      Demande transmise à l'admin !
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      {proRequestStatus === 'pending' ? 'Mettre à jour le message' : 'Envoyer la demande Pro'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProModal(false)}
                  className="py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

