import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Calendar, Trash2, RefreshCw, Save, Info, CheckCircle2, AlertCircle, Clock, ChevronRight, ChevronLeft, Maximize2, Edit2, X, Share2, Download as QrDownload, FileText, MessageSquare, Send, Mic, Square, Paperclip, Volume2, Video, File, Film, Image as ImageIcon, ShieldCheck, Bug, Leaf, FlaskConical, ExternalLink, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { Observation, CommentAttachment, AudioNote, MediaNote } from '../types';
import VoiceDictationButton from './VoiceDictationButton';
import { linkObservationToDiseases, PlantIssue, findMatchingDiseases } from '../data/plantDiseasesData';

interface ObservationDetailProps {
  observation: Observation;
  onBack?: () => void;
  onClose?: () => void;
  onDelete?: (id: string) => void;
  onReset?: (id: string) => void;
  onRetry?: (id: string) => void;
  onSaveNotes?: (id: string, notes: string) => void;
  onOpenDiseaseDatabase?: (diseaseId?: string) => void;
  onDownload?: (url: string, filename: string) => void;
  isDeleting?: boolean;
  isAdmin?: boolean;
  isArabic?: boolean;
  language?: string;
  t: any;
}

const ObservationDetail: React.FC<ObservationDetailProps> = ({
  observation,
  onBack,
  onClose,
  onDelete,
  onReset,
  onRetry,
  onSaveNotes,
  onOpenDiseaseDatabase,
  onDownload,
  isDeleting,
  isAdmin,
  isArabic,
  language,
  t
}) => {
  const handleClose = onBack || onClose || (() => {});
  const handleDelete = onDelete || (() => {});
  const handleRetry = onRetry || onReset || (() => {});
  const [notes, setNotes] = React.useState(observation.userNotes || '');
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('');
  const [selectedDiseaseModal, setSelectedDiseaseModal] = React.useState<PlantIssue | null>(null);
  const [diseaseTab, setDiseaseTab] = React.useState<'symptoms' | 'organic' | 'chemical' | 'prevention'>('symptoms');
  const [comments, setComments] = React.useState<any[]>(
    Array.isArray(observation.comments) ? observation.comments : []
  );

  const linkedDiseases = React.useMemo(() => {
    return linkObservationToDiseases(observation);
  }, [observation]);
  const [newCommentText, setNewCommentText] = React.useState('');
  
  // Audio & Attachment state for comments
  const [commentAudioUrl, setCommentAudioUrl] = React.useState<string | null>(null);
  const [commentAttachments, setCommentAttachments] = React.useState<CommentAttachment[]>([]);
  const [isRecordingCommentAudio, setIsRecordingCommentAudio] = React.useState(false);
  const [commentRecordingSeconds, setCommentRecordingSeconds] = React.useState(0);
  const commentMediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const commentAudioChunksRef = React.useRef<Blob[]>([]);
  const commentTimerRef = React.useRef<any>(null);

  // General audio notes & media attachments state for observation
  const [audioNotes, setAudioNotes] = React.useState<AudioNote[]>(
    Array.isArray(observation.audioNotes) ? observation.audioNotes : []
  );
  const [mediaNotes, setMediaNotes] = React.useState<MediaNote[]>(
    Array.isArray(observation.mediaNotes) ? observation.mediaNotes : []
  );
  const [isRecordingGeneralAudio, setIsRecordingGeneralAudio] = React.useState(false);
  const [generalRecordingSeconds, setGeneralRecordingSeconds] = React.useState(0);
  const generalMediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const generalAudioChunksRef = React.useRef<Blob[]>([]);
  const generalTimerRef = React.useRef<any>(null);

  // Comment Audio Recording Handlers
  const startCommentAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      commentAudioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      commentMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          commentAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(commentAudioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setCommentAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingCommentAudio(true);
      setCommentRecordingSeconds(0);
      commentTimerRef.current = setInterval(() => {
        setCommentRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access error", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopCommentAudioRecording = () => {
    if (commentMediaRecorderRef.current && isRecordingCommentAudio) {
      commentMediaRecorderRef.current.stop();
      setIsRecordingCommentAudio(false);
      if (commentTimerRef.current) clearInterval(commentTimerRef.current);
    }
  };

  // General Audio Note Recording Handlers
  const startGeneralAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      generalAudioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      generalMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          generalAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(generalAudioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const newAudioNote: AudioNote = {
            id: Date.now().toString(),
            name: `Note Vocale ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            url: reader.result as string,
            durationSeconds: generalRecordingSeconds,
            createdAt: new Date().toISOString()
          };
          setAudioNotes((prev) => [...prev, newAudioNote]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingGeneralAudio(true);
      setGeneralRecordingSeconds(0);
      generalTimerRef.current = setInterval(() => {
        setGeneralRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access error", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopGeneralAudioRecording = () => {
    if (generalMediaRecorderRef.current && isRecordingGeneralAudio) {
      generalMediaRecorderRef.current.stop();
      setIsRecordingGeneralAudio(false);
      if (generalTimerRef.current) clearInterval(generalTimerRef.current);
    }
  };

  // Attachment File Handling
  const handleCommentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileType = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
          ? 'audio'
          : 'document';
        
        const newAttachment: CommentAttachment = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          name: file.name,
          url: reader.result as string,
          type: fileType,
          size: file.size
        };
        setCommentAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGeneralMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileType: 'image' | 'video' | 'audio' | 'document' = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
          ? 'audio'
          : 'document';

        const newMediaNote: MediaNote = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          name: file.name,
          url: reader.result as string,
          type: fileType,
          size: file.size,
          createdAt: new Date().toISOString()
        };
        setMediaNotes((prev) => [...prev, newMediaNote]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() && !commentAudioUrl && commentAttachments.length === 0) return;
    const newComment = {
      id: Date.now().toString(),
      authorName: 'Agronome / Technicien',
      text: newCommentText.trim(),
      audioUrl: commentAudioUrl || undefined,
      attachments: commentAttachments.length > 0 ? commentAttachments : undefined,
      createdAt: new Date().toISOString()
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setNewCommentText('');
    setCommentAudioUrl(null);
    setCommentAttachments([]);
  };
  const images = observation.imageUrls || [observation.imageUrl];

  React.useEffect(() => {
    // Determine sharing/linking URL for specific botanical observation
    const url = `${window.location.origin}?observationId=${observation.id}`;
    QRCode.toDataURL(url, {
      width: 250,
      margin: 2,
      color: {
        dark: '#0f172a', // elegant slate-900 line color
        light: '#ffffff'
      }
    })
      .then(u => setQrCodeDataUrl(u))
      .catch(err => console.error("Error generating QR code", err));
  }, [observation.id]);

  const handleSave = () => {
    onSaveNotes(observation.id, notes);
    setIsEditingNotes(false);
  };

  const getStatusBadge = () => {
    switch (observation.status) {
      case 'completed':
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> {t.success}</span>;
      case 'error':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> {t.error}</span>;
      case 'analyzing':
        return <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse"><Clock className="w-3 h-3" /> {t.pending}</span>;
      default:
        return <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full uppercase tracking-wider">{observation.status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#161c18]/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <button aria-label="Retour" onClick={handleClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <div className="text-center flex-grow px-4">
          <h1 className="text-lg font-black text-gray-900 truncate tracking-tight">
            {observation.variety || observation.culture || t.observationDetails}
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
            {observation.domain}
          </p>
        </div>
        <div className="flex gap-1 items-center">
          <button
            onClick={async () => {
              const { generateObservationPDF } = await import('../services/pdfReportService');
              generateObservationPDF({
                id: observation.id,
                capturedAt: observation.createdAt || new Date().toISOString(),
                culture: observation.culture,
                variete: observation.variety,
                siteName: observation.domain,
                plotName: observation.plot,
                latitude: observation.latitude,
                longitude: observation.longitude,
                diagnosis: {
                  primaryDisease: observation.analysis?.diseaseName,
                  healthStatus: observation.status === "completed" ? (observation.analysis?.severity === "CRITICAL" ? "critical" : observation.analysis?.severity === "WARNING" ? "warning" : "healthy") : "healthy",
                  confidence: observation.analysis?.confidence,
                  description: observation.analysis?.description,
                  treatments: observation.analysis?.biologicalTreatments || observation.analysis?.treatment,
                },
                notes: observation.userNotes,
                images: observation.images,
              });
            }}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1 shadow-sm hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            title="Télécharger le rapport PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Rapport PDF</span>
          </button>
          <button 
            aria-label="Supprimer l'observation"
            onClick={() => handleDelete(observation.id)}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative aspect-square bg-black overflow-hidden shadow-inner">
        <AnimatePresence mode="wait">
          <motion.img
            key={images[currentImageIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            src={images[currentImageIndex]}
            alt="Observation"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        
        {images.length > 1 && (
          <>
            <button 
              aria-label="Image précédente"
              onClick={() => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[#161c18]/20 backdrop-blur-md rounded-full text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              aria-label="Image suivante"
              onClick={() => setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-[#161c18]/20 backdrop-blur-md rounded-full text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-6 bg-[#161c18]' : 'w-1.5 bg-[#161c18]/40'}`} 
                />
              ))}
            </div>
          </>
        )}
        
        <div className="absolute top-4 right-4">
          {getStatusBadge()}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-6 relative z-10 space-y-4">
        {/* Quick Info Card */}
        <div className="bg-[#161c18] rounded-2xl shadow-xl shadow-gray-200/50 border p-5 space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.recent}</p>
                <p className="text-sm font-black text-gray-900">
                  {observation.capturedAt && !isNaN(Date.parse(observation.capturedAt))
                    ? new Date(observation.capturedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : (observation.createdAt?.toDate ? observation.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('fr-FR'))}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BBCH</p>
              <p className="text-lg font-black text-green-600">{observation.bbchDominant || '--'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.family}</p>
              <p className="text-sm font-bold text-gray-900">{observation.family || '--'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Espèce</p>
              <p className="text-sm font-bold text-gray-900">{observation.species || '--'}</p>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        {observation.status === 'completed' && (
          <div className="bg-[#161c18] rounded-2xl border shadow-none p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                {t.analysis}
              </h2>
              <button 
                aria-label="Réinitialiser"
                onClick={() => onReset(observation.id)}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  "{observation.description}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-500/10/50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Fleurs</p>
                  <p className="text-xl font-black text-blue-400">{observation.organCounts?.flowers ?? 0}</p>
                </div>
                <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Fruits</p>
                  <p className="text-xl font-black text-orange-600">{observation.organCounts?.fruits ?? 0}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Traits Phénotypiques</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Couleur', value: observation.phenotypicTraits?.color },
                    { label: 'Forme', value: observation.phenotypicTraits?.shape },
                    { label: 'Taille', value: observation.phenotypicTraits?.size },
                    { label: 'Santé', value: observation.phenotypicTraits?.healthStatus },
                  ].map((trait, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-[#161c18] border rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{trait.label}</span>
                      <span className="text-xs font-bold text-gray-900">{trait.value || 'Non spécifié'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Alerts & Linked Phytosanitary Knowledge Base */}
              {((observation.phenotypicTraits?.diseasesOrDeficiencies && observation.phenotypicTraits.diseasesOrDeficiencies.length > 0) || linkedDiseases.length > 0) && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      Alertes Sanitaires & Diagnostics
                    </h3>
                    {onOpenDiseaseDatabase && (
                      <button
                        onClick={() => onOpenDiseaseDatabase(linkedDiseases[0]?.id)}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        Base maladies
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>

                  {observation.phenotypicTraits?.diseasesOrDeficiencies && observation.phenotypicTraits.diseasesOrDeficiencies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {observation.phenotypicTraits.diseasesOrDeficiencies.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const match = findMatchingDiseases(d)[0];
                            if (match) setSelectedDiseaseModal(match);
                            else if (onOpenDiseaseDatabase) onOpenDiseaseDatabase();
                          }}
                          className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold rounded-lg border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <AlertCircle size={12} className="text-red-400 shrink-0" />
                          <span>{d}</span>
                          <ChevronRight size={12} className="text-red-400/60" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Linked Disease Expert Protocols Preview */}
                  {linkedDiseases.length > 0 && (
                    <div className="space-y-2.5 mt-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Protocoles de traitement recommandés (Base AgriScan) :
                      </p>
                      {linkedDiseases.map(disease => (
                        <div
                          key={disease.id}
                          className="p-3.5 bg-gradient-to-br from-emerald-950/40 to-black/50 rounded-xl border border-emerald-500/30 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Leaf size={14} className="text-emerald-400" />
                                <h4 className="text-xs font-black text-white">{disease.name}</h4>
                              </div>
                              <p className="text-[10px] text-emerald-400 italic">{disease.scientificName}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {disease.category === 'pest' ? 'Ravageur' : 'Maladie'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                              <span className="text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-1 mb-1">
                                <ShieldCheck size={11} /> Traitement Bio
                              </span>
                              <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                                {disease.organicTreatments[0]}
                              </p>
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                              <span className="text-[9px] font-bold text-orange-400 uppercase flex items-center gap-1 mb-1">
                                <FlaskConical size={11} /> Traitement Chimique
                              </span>
                              <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                                {disease.chemicalTreatments[0]}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedDiseaseModal(disease)}
                              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <span>Voir symptômes, causes & posologie complète</span>
                              <ChevronRight size={13} />
                            </button>
                            {onOpenDiseaseDatabase && (
                              <button
                                type="button"
                                onClick={() => onOpenDiseaseDatabase(disease.id)}
                                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                Ouvrir dans la base
                                <ExternalLink size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share & QR Code Card */}
        <div className="bg-[#161c18] rounded-2xl border shadow-none p-5 space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            Code QR de Terrain
          </h2>
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-[11px] text-gray-500 leading-normal max-w-xs">
              Scannez ce code QR pour ouvrir instantanément cette fiche botanique sur un autre appareil mobile.
            </p>
            {qrCodeDataUrl ? (
              <div className="p-2 bg-[#161c18] border border-gray-100 rounded-xl shadow-inner inline-block">
                <img loading="lazy" src={qrCodeDataUrl} alt="Code QR de l'observation" className="w-36 h-36" />
              </div>
            ) : (
              <div className="w-36 h-36 bg-gray-50 animate-pulse rounded-xl border border-dashed flex items-center justify-center text-[10px] text-gray-400">
                Génération en cours...
              </div>
            )}
            <div className="flex gap-2 w-full max-w-xs justify-center">
              <button
                onClick={() => {
                  const url = `${window.location.origin}?observationId=${observation.id}`;
                  navigator.clipboard.writeText(url)
                    .then(() => alert("Lien d'observation copié !"))
                    .catch(() => alert("Échec de la copie."));
                }}
                className="px-3 py-1.5 bg-[#0d120f] border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                Copier le lien
              </button>
              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`agroscan_qr_${observation.id}.png`}
                  className="px-3 py-1.5 bg-green-50 border border-green-100 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <QrDownload className="w-3.5 h-3.5" /> Télécharger
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Agronomist Notes & Media Attachments */}
        <div className="bg-[#161c18] rounded-2xl border border-white/10 shadow-none p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-emerald-400" />
              Notes Générales (Terrain & Agronomie)
            </h2>
            {!isEditingNotes ? (
              <button 
                onClick={() => setIsEditingNotes(true)}
                className="text-xs font-bold text-blue-400 hover:underline"
              >
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingNotes(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSave}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2">
              <div className="flex justify-end">
                <VoiceDictationButton
                  currentValue={notes}
                  onTranscript={(text) => setNotes(text)}
                  lang="fr-FR"
                />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-slate-500"
                placeholder="Saisissez vos observations terrain ici (dictée vocale disponible)..."
              />
            </div>
          ) : (
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 min-h-[80px]">
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {notes || "Aucune note texte pour le moment."}
              </p>
            </div>
          )}

          {/* Notes Vocales générales */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-emerald-400" /> Notes Vocales ({audioNotes.length})
              </span>
              {isRecordingGeneralAudio ? (
                <button
                  type="button"
                  onClick={stopGeneralAudioRecording}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse"
                >
                  <Square className="w-3 h-3 fill-current" /> Arrêter ({generalRecordingSeconds}s)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startGeneralAudioRecording}
                  className="px-3 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5" /> Enregistrer un vocal
                </button>
              )}
            </div>

            {audioNotes.length > 0 && (
              <div className="space-y-2 pt-1">
                {audioNotes.map((an) => (
                  <div key={an.id} className="p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span className="font-bold text-slate-200">{an.name}</span>
                      <span>{an.createdAt ? new Date(an.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <audio controls src={an.url} className="w-full h-8 mt-1 rounded-lg" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fichiers & Médias joints de terrain (Photos/Vidéos/PDF/Docs) */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-blue-400" /> Fichiers & Vidéos Joints ({mediaNotes.length})
              </span>
              <label className="cursor-pointer px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Joindre un fichier
                <input
                  type="file"
                  multiple
                  onChange={handleGeneralMediaFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {mediaNotes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {mediaNotes.map((mn) => (
                  <div key={mn.id} className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2.5">
                    {mn.type === 'image' && <ImageIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                    {mn.type === 'video' && <Video className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                    {mn.type === 'audio' && <Volume2 className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                    {mn.type === 'document' && <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{mn.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{mn.type}</p>
                    </div>
                    <a
                      href={mn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-[10px] bg-white/10 hover:bg-white/20 text-slate-200 rounded font-bold"
                    >
                      Voir
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comments Section with Voice & Attachments */}
        <div className="bg-[#161c18] rounded-2xl border border-white/10 shadow-none p-5 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            Commentaires & Échanges ({comments.length})
          </h2>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-white/5 rounded-xl border border-white/5">
                Aucun commentaire pour le moment. Laissez un avis, un message vocal ou un document.
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-emerald-400">{c.authorName}</span>
                    <span className="text-slate-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  {c.text && <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{c.text}</p>}
                  
                  {/* Voice note player in comment */}
                  {c.audioUrl && (
                    <div className="p-2 bg-black/30 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                        <Volume2 size={12} /> Message vocal
                      </div>
                      <audio controls src={c.audioUrl} className="w-full h-7 rounded" />
                    </div>
                  )}

                  {/* Attachments in comment */}
                  {c.attachments && c.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.attachments.map((att: CommentAttachment) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-[10px] font-bold transition-all"
                        >
                          <Paperclip size={10} /> {att.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Form to add comment, audio, or attachment */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2">
              {/* Audio / Attachment preview before submission */}
              {(commentAudioUrl || commentAttachments.length > 0 || isRecordingCommentAudio) && (
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  {isRecordingCommentAudio && (
                    <div className="flex justify-between items-center text-xs text-rose-400 font-bold animate-pulse">
                      <span className="flex items-center gap-1.5">
                        <Mic size={14} /> Enregistrement en cours... ({commentRecordingSeconds}s)
                      </span>
                      <button
                        type="button"
                        onClick={stopCommentAudioRecording}
                        className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px]"
                      >
                        Arrêter
                      </button>
                    </div>
                  )}

                  {commentAudioUrl && (
                    <div className="flex items-center gap-2">
                      <Volume2 size={14} className="text-emerald-400" />
                      <audio controls src={commentAudioUrl} className="flex-1 h-7 rounded" />
                      <button
                        type="button"
                        onClick={() => setCommentAudioUrl(null)}
                        className="text-xs text-slate-400 hover:text-rose-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {commentAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {commentAttachments.map((att) => (
                        <span key={att.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px]">
                          {att.name}
                          <button
                            type="button"
                            onClick={() => setCommentAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                            className="hover:text-rose-400 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />

                {/* Mic Record Button */}
                <button
                  type="button"
                  onClick={isRecordingCommentAudio ? stopCommentAudioRecording : startCommentAudioRecording}
                  className={`p-2 rounded-xl transition-all ${
                    isRecordingCommentAudio
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
                  }`}
                  title="Message vocal"
                >
                  <Mic size={15} />
                </button>

                {/* File Attachment Button */}
                <label className="p-2 bg-white/5 text-slate-400 hover:text-white border border-white/10 rounded-xl cursor-pointer transition-all">
                  <Paperclip size={15} />
                  <input
                    type="file"
                    multiple
                    onChange={handleCommentFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!newCommentText.trim() && !commentAudioUrl && commentAttachments.length === 0}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Technical Details Grid (Field Ops) */}
        <div className="bg-[#161c18] rounded-2xl border shadow-none p-5 space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Données Opérationnelles</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            {[
              { label: 'Date Plantation', value: observation.plantingDate },
              { label: 'Obtenteur', value: observation.breeder },
              { label: 'Date Taille', value: observation.pruningDate },
              { label: 'Quantité Récolte', value: observation.harvestQuantity },
              { label: 'Densité', value: observation.density },
              { label: 'Fermeté Fruit', value: observation.fruitFirmness },
            ].map((item, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{item.label}</p>
                <p className="text-xs font-bold text-gray-900">{item.value || '--'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Disease Expert Advisory Modal */}
        <AnimatePresence>
          {selectedDiseaseModal && (
            <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-[#121814] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
              >
                <div className="p-5 bg-[#16201a] border-b border-white/10 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img loading="lazy"
                      src={selectedDiseaseModal.imageUrl}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {selectedDiseaseModal.category === 'pest' ? 'Ravageur' : 'Pathogène'}
                      </span>
                      <h3 className="text-base font-black text-white">{selectedDiseaseModal.name}</h3>
                      <p className="text-xs text-emerald-400 italic">{selectedDiseaseModal.scientificName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDiseaseModal(null)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Sub-tabs */}
                <div className="flex bg-black/40 p-1 border-b border-white/5 text-xs font-bold">
                  <button
                    onClick={() => setDiseaseTab('symptoms')}
                    className={`flex-1 py-2 rounded-xl transition-all ${diseaseTab === 'symptoms' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    Symptômes & Causes
                  </button>
                  <button
                    onClick={() => setDiseaseTab('organic')}
                    className={`flex-1 py-2 rounded-xl transition-all ${diseaseTab === 'organic' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    Traitement Bio
                  </button>
                  <button
                    onClick={() => setDiseaseTab('chemical')}
                    className={`flex-1 py-2 rounded-xl transition-all ${diseaseTab === 'chemical' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    Traitement Chimique
                  </button>
                  <button
                    onClick={() => setDiseaseTab('prevention')}
                    className={`flex-1 py-2 rounded-xl transition-all ${diseaseTab === 'prevention' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    Prévention
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-200">
                  {diseaseTab === 'symptoms' && (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-1">Symptômes</h4>
                        <p className="text-slate-300 leading-relaxed">{selectedDiseaseModal.symptoms}</p>
                      </div>
                      <div className="p-3.5 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">Causes & Climat</h4>
                        <p className="text-slate-300 leading-relaxed">{selectedDiseaseModal.causes}</p>
                      </div>
                    </div>
                  )}

                  {diseaseTab === 'organic' && (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-300 font-bold mb-2">
                        Recommandations biologiques et biocontrôle homologuées :
                      </div>
                      {selectedDiseaseModal.organicTreatments.map((t, idx) => (
                        <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {diseaseTab === 'chemical' && (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-300 font-bold mb-2">
                        Traitements conventionnels de synthèse & précautions :
                      </div>
                      {selectedDiseaseModal.chemicalTreatments.map((t, idx) => (
                        <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5">
                          <FlaskConical size={16} className="text-orange-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {diseaseTab === 'prevention' && (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-300 font-bold mb-2">
                        Bonnes pratiques culturales prophylactiques :
                      </div>
                      {selectedDiseaseModal.preventionMethods.map((m, idx) => (
                        <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5">
                          <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{m}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#16201a] border-t border-white/10 flex justify-between items-center">
                  <button
                    onClick={() => setSelectedDiseaseModal(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-300"
                  >
                    Fermer
                  </button>
                  {onOpenDiseaseDatabase && (
                    <button
                      onClick={() => {
                        const id = selectedDiseaseModal.id;
                        setSelectedDiseaseModal(null);
                        onOpenDiseaseDatabase(id);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <span>Consulter la fiche complète</span>
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ObservationDetail;
