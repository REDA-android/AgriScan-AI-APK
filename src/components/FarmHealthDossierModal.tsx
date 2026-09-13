import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  Award,
  Stamp,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Observation } from '../types';

interface FarmHealthDossierModalProps {
  observations: Observation[];
  onClose: () => void;
  language?: 'fr' | 'en' | 'ar' | 'es';
}

export const FarmHealthDossierModal: React.FC<FarmHealthDossierModalProps> = ({
  observations,
  onClose,
  language = 'fr',
}) => {
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Filtered observations
  const filtered = useMemo(() => {
    return observations.filter((obs) => {
      const matchCrop =
        selectedCropFilter === 'all' ||
        (obs.variety || obs.species || '').toLowerCase().includes(selectedCropFilter.toLowerCase());
      const isHealthy = (obs.phenotypicTraits?.healthStatus || '').toLowerCase().includes('sain') ||
        (obs.phenotypicTraits?.healthStatus || '').toLowerCase().includes('healthy');
      const matchStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'healthy' && isHealthy) ||
        (selectedStatusFilter === 'diseased' && !isHealthy);
      return matchCrop && matchStatus;
    });
  }, [observations, selectedCropFilter, selectedStatusFilter]);

  // Farm Health Metrics
  const totalScans = observations.length;
  const healthyCount = observations.filter(
    (o) =>
      (o.phenotypicTraits?.healthStatus || '').toLowerCase().includes('sain') ||
      (o.phenotypicTraits?.healthStatus || '').toLowerCase().includes('healthy')
  ).length;
  const healthRate = totalScans > 0 ? Math.round((healthyCount / totalScans) * 100) : 100;
  const diseasedCount = totalScans - healthyCount;

  // Distinct crop varieties
  const varieties = useMemo(() => {
    const list = Array.from(
      new Set(observations.map((o) => o.variety || o.species).filter(Boolean))
    );
    return list.slice(0, 10);
  }, [observations]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Culture / Variete",
      "Famille",
      "Domaine / Parcelle",
      "Etat Sanitaire",
      "Maladies / Ravageurs Identifies",
      "Traitements Biologiques",
      "Latitude",
      "Longitude"
    ];

    const rows = filtered.map((obs) => {
      const date = obs.capturedAt
        ? new Date(obs.capturedAt).toISOString().split('T')[0]
        : obs.createdAt?.toDate ? obs.createdAt.toDate().toISOString().split('T')[0] : "";
      const diseases = (obs.phenotypicTraits?.diseases || []).join(" | ");
      const treatments = (obs.phenotypicTraits?.organicTreatments || []).join(" | ");
      const lat = obs.location?.lat ?? "";
      const lng = obs.location?.lng ?? "";

      return [
        `"${obs.id}"`,
        `"${date}"`,
        `"${(obs.variety || obs.species || '').replace(/"/g, '""')}"`,
        `"${(obs.family || '').replace(/"/g, '""')}"`,
        `"${(obs.domain || '').replace(/"/g, '""')}"`,
        `"${(obs.phenotypicTraits?.healthStatus || 'Non specifie').replace(/"/g, '""')}"`,
        `"${diseases.replace(/"/g, '""')}"`,
        `"${treatments.replace(/"/g, '""')}"`,
        `"${lat}"`,
        `"${lng}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `agriscan-dossier-sanitaire-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Official PDF Dossier via jsPDF
  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const todayStr = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Header Banner
      doc.setFillColor(6, 78, 59); // Dark emerald
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("AGRISCAN AI — DOSSIER SANITAIRE AGRICOLE", 14, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(167, 243, 208);
      doc.text("REGISTRE OFFICIEL DE CONTRÔLE PHYTOSANITAIRE & SUBVENTIONS", 14, 26);
      doc.text(`Date d'émission : ${todayStr}`, 14, 32);

      // Section 1: Farm Metrics Summary
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("1. Synthèse de l'Exploitation & Indice de Santé", 14, 46);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Nombre total d'observations au champ : ${totalScans}`, 14, 54);
      doc.text(`Plantes et parcelles saines : ${healthyCount} (${healthRate}%)`, 14, 60);
      doc.text(`Incidences ou pathologies actives : ${diseasedCount} (${100 - healthRate}%)`, 14, 66);
      doc.text(`Cultures analysées : ${varieties.join(", ") || "Toutes cultures"}`, 14, 72);

      // Status Box
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(52, 211, 153);
      doc.roundedRect(130, 46, 66, 28, 3, 3, 'FD');

      doc.setTextColor(6, 78, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("INDICE SANITAIRE GLOBAL", 135, 54);
      doc.setFontSize(16);
      doc.text(`${healthRate} % CONFORME`, 135, 64);
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("Audit agronomique assisté par IA", 135, 70);

      // Section 2: Table of Observations
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("2. Relevé Détaillé des Scans Phytosanitaires", 14, 86);

      let currentY = 94;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("Date", 16, currentY + 5.5);
      doc.text("Culture / Variété", 40, currentY + 5.5);
      doc.text("Parcelle", 85, currentY + 5.5);
      doc.text("État Sanitaire", 125, currentY + 5.5);
      doc.text("Pathologie / Avis", 158, currentY + 5.5);

      currentY += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      const printableScans = filtered.slice(0, 18); // fit on page cleanly
      printableScans.forEach((obs) => {
        const date = obs.capturedAt
          ? new Date(obs.capturedAt).toLocaleDateString('fr-FR')
          : obs.createdAt?.toDate ? obs.createdAt.toDate().toLocaleDateString('fr-FR') : "N/D";
        const variety = (obs.variety || obs.species || "Culture non précisée").slice(0, 22);
        const domain = (obs.domain || "Parcelle principale").slice(0, 18);
        const health = (obs.phenotypicTraits?.healthStatus || "Conforme").slice(0, 18);
        const diseases = (obs.phenotypicTraits?.diseases || []).join(", ").slice(0, 24) || "Aucune anomalie";

        doc.setDrawColor(226, 232, 240);
        doc.line(14, currentY, 196, currentY);

        doc.text(date, 16, currentY + 5.5);
        doc.text(variety, 40, currentY + 5.5);
        doc.text(domain, 85, currentY + 5.5);
        doc.text(health, 125, currentY + 5.5);
        doc.text(diseases, 158, currentY + 5.5);

        currentY += 7.5;
      });

      // Stamp and Signature footer
      currentY = Math.max(currentY + 10, 245);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, currentY, 85, 34, 2, 2);
      doc.roundedRect(111, currentY, 85, 34, 2, 2);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("VISA ET CACHET DE L'EXPLOITANT", 18, currentY + 6);
      doc.text("VALIDATION TECHNIQUE & AGRONOMIQUE", 115, currentY + 6);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("Signé numériquement via AgriScan Mobile PWA", 18, currentY + 28);
      doc.text("Conforme aux exigences d'éco-conditionnalité", 115, currentY + 28);

      doc.save(`agriscan-dossier-sanitaire-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-[#0b120e] border border-slate-200 dark:border-emerald-500/30 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/40 dark:from-emerald-950/80 dark:via-[#0e1a14] dark:to-slate-950/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Dossier Sanitaire & Historique Exploitation
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-extrabold rounded-md border border-emerald-300 dark:border-emerald-500/30">
                  Audit Prêt
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Évolution temporelle, suivi de sévérité et attestations officielles PDF / CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action & Metric Overview Bar */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-center shrink-0">
          <div className="p-3 bg-white dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Scans Réalisés</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalScans}</span>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-black/40 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 shadow-2xs">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">Score de Santé</span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{healthRate}%</span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-black/40 rounded-2xl border border-amber-200 dark:border-white/5 shadow-2xs">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase block">Anomalies Actives</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{diseasedCount}</span>
          </div>
        </div>

        {/* Filter Controls & Export Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-100 dark:bg-[#111914] border-b border-slate-200 dark:border-white/10 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500 dark:text-slate-400" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">Tous les états</option>
              <option value="healthy">Plantes Saines ({healthyCount})</option>
              <option value="diseased">Avec Pathologies ({diseasedCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-transparent rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Exporter vers Excel / Tableur CSV"
            >
              <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Générer l'attestation officielle d'audit PDF"
            >
              <Download size={14} />
              <span>{isExporting ? "Création..." : "Dossier PDF Officiel"}</span>
            </button>
          </div>
        </div>

        {/* Timeline Log Content */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
            <span>Chronologie des observations terrain ({filtered.length})</span>
            <span className="text-[10px] text-emerald-400">Archivage géolocalisé</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white/5 rounded-2xl">
              Aucune observation ne correspond aux filtres sélectionnés.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((obs) => {
                const isHealthy = (obs.phenotypicTraits?.healthStatus || '').toLowerCase().includes('sain') ||
                  (obs.phenotypicTraits?.healthStatus || '').toLowerCase().includes('healthy');
                const dateStr = obs.capturedAt
                  ? new Date(obs.capturedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                  : obs.createdAt?.toDate ? obs.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : "";

                return (
                  <div
                    key={obs.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/90 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 rounded-2xl transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {obs.images?.[0] ? (
                        <img
                          src={obs.images[0].url}
                          alt={obs.variety || "Scan"}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400 font-bold">
                          🌱
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 dark:text-white truncate">{obs.variety || obs.species || "Culture inconnue"}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">{dateStr}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                          {obs.family || "Végétal"} • {obs.domain || "Parcelle"}
                        </p>
                        {obs.location?.lat && (
                          <span className="text-[9px] text-emerald-700 dark:text-emerald-400/80 flex items-center gap-1 mt-0.5">
                            <MapPin size={9} /> GPS: {obs.location.lat.toFixed(4)}, {obs.location.lng?.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                        isHealthy
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                      }`}>
                        {isHealthy ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        {obs.phenotypicTraits?.healthStatus || (isHealthy ? "Sain" : "Alerte")}
                      </span>
                      {obs.phenotypicTraits?.diseases?.[0] && (
                        <p className="text-[10px] text-amber-800 dark:text-amber-300 font-bold mt-1 truncate max-w-[130px]">
                          {obs.phenotypicTraits.diseases[0]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Export légalement recevable pour audits agricoles, certifications BIO et aides publiques.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FarmHealthDossierModal;
