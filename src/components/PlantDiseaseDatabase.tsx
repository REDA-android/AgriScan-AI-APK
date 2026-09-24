import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Bug,
  Leaf,
  FlaskConical,
  Sparkles,
  Info,
  ChevronRight,
  X,
  Camera,
  ExternalLink,
  CheckCircle2,
  Share2,
  Calendar,
  Layers,
  Flame,
  Activity,
  Droplets,
  Thermometer
} from 'lucide-react';
import { PLANT_DISEASES_AND_PESTS, PlantIssue, findMatchingDiseases } from '../data/plantDiseasesData';
import { Observation } from '../types';

interface PlantDiseaseDatabaseProps {
  observations?: Observation[];
  onSelectCropForScan?: (crop: string) => void;
  onOpenObservation?: (obs: Observation) => void;
  language?: 'fr' | 'en' | 'ar';
  preSelectedIssueId?: string | null;
  onCloseDetail?: () => void;
}

export const PlantDiseaseDatabase: React.FC<PlantDiseaseDatabaseProps> = ({
  observations = [],
  onSelectCropForScan,
  onOpenObservation,
  language = 'fr',
  preSelectedIssueId = null,
  onCloseDetail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'disease' | 'pest'>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<PlantIssue | null>(() => {
    if (preSelectedIssueId) {
      return PLANT_DISEASES_AND_PESTS.find(i => i.id === preSelectedIssueId) || null;
    }
    return null;
  });
  const [activeDetailTab, setActiveDetailTab] = useState<'symptoms' | 'causes' | 'organic' | 'chemical' | 'prevention'>('symptoms');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Sync if preSelectedIssueId changes from props
  React.useEffect(() => {
    if (preSelectedIssueId) {
      const found = PLANT_DISEASES_AND_PESTS.find(i => i.id === preSelectedIssueId);
      if (found) setSelectedIssue(found);
    }
  }, [preSelectedIssueId]);

  // Unique list of affected crops from all issues
  const allCrops = useMemo(() => {
    const crops = new Set<string>();
    PLANT_DISEASES_AND_PESTS.forEach(issue => {
      issue.affectedCrops.forEach(c => crops.add(c));
    });
    return Array.from(crops).sort();
  }, []);

  // Filtered list
  const filteredIssues = useMemo(() => {
    return PLANT_DISEASES_AND_PESTS.filter(issue => {
      // Category filter
      if (selectedCategory !== 'all' && issue.category !== selectedCategory) {
        return false;
      }
      // Crop filter
      if (selectedCrop !== 'all') {
        const hasCrop = issue.affectedCrops.some(c => c.toLowerCase() === selectedCrop.toLowerCase());
        if (!hasCrop) return false;
      }
      // Severity filter
      if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          issue.name.toLowerCase().includes(q) ||
          issue.scientificName.toLowerCase().includes(q) ||
          (issue.nameEn && issue.nameEn.toLowerCase().includes(q)) ||
          (issue.nameAr && issue.nameAr.includes(q)) ||
          issue.symptoms.toLowerCase().includes(q) ||
          issue.causes.toLowerCase().includes(q) ||
          issue.keywords.some(k => k.toLowerCase().includes(q)) ||
          issue.affectedCrops.some(c => c.toLowerCase().includes(q)) ||
          issue.organicTreatments.some(t => t.toLowerCase().includes(q)) ||
          issue.chemicalTreatments.some(t => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedCrop, selectedSeverity]);

  // Find user observations related to a given issue
  const getLinkedObservations = (issue: PlantIssue) => {
    return observations.filter(obs => {
      const diseases = obs.phenotypicTraits?.diseasesOrDeficiencies || [];
      const text = [
        ...diseases,
        obs.description || '',
        obs.variety || '',
        obs.culture || ''
      ].join(' ').toLowerCase();

      return issue.keywords.some(k => text.includes(k.toLowerCase())) ||
        text.includes(issue.name.toLowerCase()) ||
        text.includes(issue.scientificName.toLowerCase());
    });
  };

  const getSeverityBadge = (severity: PlantIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertTriangle size={11} className="shrink-0" />
            {language === 'ar' ? 'حرج' : language === 'en' ? 'Critical' : 'Critique'}
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Flame size={11} className="shrink-0" />
            {language === 'ar' ? 'مرتفع' : language === 'en' ? 'High' : 'Élevé'}
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Activity size={11} className="shrink-0" />
            {language === 'ar' ? 'متوسط' : language === 'en' ? 'Moderate' : 'Modéré'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={11} className="shrink-0" />
            {language === 'ar' ? 'منخفض' : language === 'en' ? 'Low' : 'Faible'}
          </span>
        );
    }
  };

  const handleCopySummary = (issue: PlantIssue) => {
    const summary = `🌿 ${issue.name} (${issue.scientificName})\n` +
      `Cultures sensibles : ${issue.affectedCrops.join(', ')}\n\n` +
      `🔍 Symptômes :\n${issue.symptoms}\n\n` +
      `🌱 Traitements Biologiques :\n- ${issue.organicTreatments.join('\n- ')}\n\n` +
      `🧪 Traitements Chimiques :\n- ${issue.chemicalTreatments.join('\n- ')}\n\n` +
      `AgroScan AI - Base Phytosanitaire`;

    navigator.clipboard.writeText(summary);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div className="w-full space-y-6 pb-24 text-slate-100">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/60 via-[#101913] to-[#0a110d] border border-emerald-500/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              {language === 'ar' ? 'دليل الصحة النباتية المتكامل' : language === 'en' ? 'Phytosanitary Expert Database' : 'Base Experte Maladies & Ravageurs'}
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <Leaf className="text-emerald-400" size={26} />
              {language === 'ar' ? 'موسوعة الأمراض والآفات الزراعية' : language === 'en' ? 'Plant Diseases & Pests Guide' : 'Encyclopédie Phytosanitaire'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {language === 'ar'
                ? 'فهرس متكامل للأعراض المرضية، الأسباب البيئية، وتوصيات العلاج البيولوجي العضوي والكيماوي المعتمد وفق معايير الحماية المتكاملة (IPM).'
                : language === 'en'
                  ? 'Comprehensive database detailing symptoms, causes, and recommended organic and chemical treatment methods linked directly to your scan observations.'
                  : 'Fiches techniques complètes : diagnostic des symptômes, facteurs déclenchants et protocoles de traitements biologiques et conventionnels reliés à vos scans.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-black text-emerald-400">{PLANT_DISEASES_AND_PESTS.length}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Fiches Expertes</span>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10 text-center">
              <span className="block text-xl font-black text-amber-400">{allCrops.length}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Cultures</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3 bg-[#161c18]/90 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={language === 'ar' ? 'ابحث بالاسم، المرض، الأعراض أو المبيد...' : language === 'en' ? 'Search by disease, pest, symptoms or crop...' : 'Rechercher par maladie, ravageur, symptôme, culture ou traitement...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white/5 rounded-xl border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Tous ({PLANT_DISEASES_AND_PESTS.length})
          </button>
          <button
            onClick={() => setSelectedCategory('disease')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              selectedCategory === 'disease'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Leaf size={14} />
            Maladies ({PLANT_DISEASES_AND_PESTS.filter(i => i.category === 'disease').length})
          </button>
          <button
            onClick={() => setSelectedCategory('pest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              selectedCategory === 'pest'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Bug size={14} />
            Ravageurs ({PLANT_DISEASES_AND_PESTS.filter(i => i.category === 'pest').length})
          </button>

          {/* Quick Crop Selector */}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="all" className="bg-[#161c18] text-white">Toutes cultures</option>
              {allCrops.map(crop => (
                <option key={crop} value={crop} className="bg-[#161c18] text-white">
                  {crop}
                </option>
              ))}
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="all" className="bg-[#161c18] text-white">Toute sévérité</option>
              <option value="critical" className="bg-[#161c18] text-white">Critique</option>
              <option value="high" className="bg-[#161c18] text-white">Élevé</option>
              <option value="moderate" className="bg-[#161c18] text-white">Modéré</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Grid */}
      {filteredIssues.length === 0 ? (
        <div className="p-12 text-center bg-[#161c18] rounded-3xl border border-white/10 space-y-3">
          <Info className="mx-auto text-slate-500" size={36} />
          <h3 className="text-base font-black text-white">Aucun résultat trouvé</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Aucune fiche phytosanitaire ne correspond à votre recherche "{searchQuery}". Essayez un autre mot-clé ou réinitialisez les filtres.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedCrop('all');
              setSelectedSeverity('all');
            }}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map((issue) => {
            const linkedObs = getLinkedObservations(issue);
            return (
              <motion.div
                key={issue.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setSelectedIssue(issue);
                  setActiveDetailTab('symptoms');
                }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#161c18] border border-white/10 hover:border-emerald-500/40 p-4 transition-all shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header with Image Thumbnail & Badges */}
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/40">
                      <img loading="lazy"
                        src={issue.imageUrl}
                        alt={issue.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-0 right-0 p-1 bg-black/70 rounded-tl-lg text-emerald-400">
                        {issue.category === 'pest' ? <Bug size={12} /> : <Leaf size={12} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        {getSeverityBadge(issue.severity)}
                        {linkedObs.length > 0 && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[9px] font-black uppercase">
                            {linkedObs.length} scan{linkedObs.length > 1 ? 's' : ''} lié{linkedObs.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {issue.name}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 italic line-clamp-1">
                        {issue.scientificName}
                      </p>
                    </div>
                  </div>

                  {/* Affected Crops Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {issue.affectedCrops.map(crop => (
                      <span
                        key={crop}
                        className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-semibold text-slate-300"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>

                  {/* Short Symptoms Excerpt */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {issue.symptoms}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span className="flex items-center gap-1 text-[11px] group-hover:underline">
                    Consulter la fiche complète
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>Bio & Chimique</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detailed Modal / Sheet for Selected Issue */}
      <AnimatePresence>
        {selectedIssue && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-[#121814] border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="relative p-6 border-b border-white/10 bg-[#16201a] shrink-0">
                <button
                  onClick={() => {
                    setSelectedIssue(null);
                    if (onCloseDetail) onCloseDetail();
                  }}
                  className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-colors z-20"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-emerald-500/40 shadow-lg">
                    <img loading="lazy"
                      src={selectedIssue.imageUrl}
                      alt={selectedIssue.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1 pr-8">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(selectedIssue.severity)}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-slate-300 border border-white/10">
                        {selectedIssue.type}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white">
                      {selectedIssue.name}
                    </h2>
                    <p className="text-xs text-emerald-400 font-bold italic">
                      {selectedIssue.scientificName}
                      {selectedIssue.nameEn && ` • ${selectedIssue.nameEn}`}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Cultures hôtes :</span>
                      {selectedIssue.affectedCrops.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] text-slate-200 border border-white/10">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subnav Tabs inside Modal */}
                <div className="flex overflow-x-auto no-scrollbar gap-1 mt-6 p-1 bg-black/40 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setActiveDetailTab('symptoms')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                      activeDetailTab === 'symptoms'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Search size={14} /> Symptômes
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('causes')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                      activeDetailTab === 'causes'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Thermometer size={14} /> Causes & Climat
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('organic')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                      activeDetailTab === 'organic'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Leaf size={14} /> Traitement Bio
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('chemical')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                      activeDetailTab === 'chemical'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FlaskConical size={14} /> Traitement Chimique
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('prevention')}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                      activeDetailTab === 'prevention'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck size={14} /> Prévention
                  </button>
                </div>
              </div>

              {/* Modal Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
                {activeDetailTab === 'symptoms' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={15} /> Tableau Clinique & Signes Visuels
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-200">
                        {selectedIssue.symptoms}
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-2">
                      <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                        Critères d'identification rapide sur le terrain
                      </h5>
                      <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
                        <li>Vérifiez la face inférieure des feuilles pour détecter du mycélium ou des déjections.</li>
                        <li>Examinez les tiges principales pour identifier la présence de chancres ou de galeries.</li>
                        <li>Contrôlez les fruits à l'apex et sous le calice pour les piqûres ou marbrures.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'causes' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                        <Thermometer size={15} /> Facteurs Favorisants & Conditions Environnementales
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-200">
                        {selectedIssue.causes}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Facteur Hygrométrique
                        </span>
                        <p className="text-xs font-bold text-slate-200">
                          Forte humidité relative ou rosées prolongées favorisant la germination.
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Vecteurs & Transmission
                        </span>
                        <p className="text-xs font-bold text-slate-200">
                          Vent, éclaboussures de pluie, outils de taille ou insectes piqueurs.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'organic' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-2">
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <Leaf size={15} /> Protocoles Certifiés Agriculture Biologique (UAB)
                      </h4>
                      <p className="text-xs text-slate-300">
                        Solutions respectueuses de l'écosystème, de la faune auxiliaire et sans résidus chimiques de synthèse.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {selectedIssue.organicTreatments.map((treatment, idx) => (
                        <div key={idx} className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                          <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs leading-relaxed text-slate-200">{treatment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'chemical' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 space-y-2">
                      <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                        <FlaskConical size={15} /> Traitements Conventionnels & Matières Actives Homologuées
                      </h4>
                      <p className="text-xs text-slate-300">
                        À appliquer en respectant scrupuleusement les homologations locales, les équipements de protection (EPI) et les Délais Avant Récolte (DAR).
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {selectedIssue.chemicalTreatments.map((treatment, idx) => (
                        <div key={idx} className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="text-xs leading-relaxed text-slate-200">{treatment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'prevention' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 space-y-2">
                      <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={15} /> Bonnes Pratiques Culturales & Prophylaxie
                      </h4>
                      <p className="text-xs text-slate-300">
                        La prévention est le levier le plus économique et durable pour protéger vos rendements.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {selectedIssue.preventionMethods.map((method, idx) => (
                        <div key={idx} className="p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                          <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
                          <span className="text-xs leading-relaxed text-slate-200">{method}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked User Observations Section */}
                {(() => {
                  const linked = getLinkedObservations(selectedIssue);
                  if (linked.length === 0) return null;
                  return (
                    <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <Camera size={14} /> Vos observations correspondantes ({linked.length})
                        </h4>
                        <span className="text-[10px] text-slate-400">Scans détectant cette affection</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {linked.map(obs => (
                          <div
                            key={obs.id}
                            onClick={() => {
                              if (onOpenObservation) onOpenObservation(obs);
                            }}
                            className="p-2.5 bg-black/40 hover:bg-black/60 rounded-xl border border-white/10 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <img loading="lazy"
                              src={obs.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{obs.variety || obs.culture}</p>
                              <p className="text-[10px] text-slate-400">{obs.capturedAt ? new Date(obs.capturedAt).toLocaleDateString() : 'Scan'}</p>
                            </div>
                            <ExternalLink size={14} className="text-emerald-400 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-white/10 bg-[#16201a] shrink-0 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => handleCopySummary(selectedIssue)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  {copiedSuccess ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span>Fiche copiée !</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} />
                      <span>Copier la fiche diagnostic</span>
                    </>
                  )}
                </button>

                {onSelectCropForScan && selectedIssue.affectedCrops[0] && (
                  <button
                    onClick={() => {
                      onSelectCropForScan(selectedIssue.affectedCrops[0]);
                      setSelectedIssue(null);
                      if (onCloseDetail) onCloseDetail();
                    }}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center gap-2"
                  >
                    <Camera size={16} />
                    <span>Scanner pour {selectedIssue.affectedCrops[0]}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlantDiseaseDatabase;
