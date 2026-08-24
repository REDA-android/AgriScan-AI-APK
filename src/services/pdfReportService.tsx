import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import React from "react";
import { createRoot } from "react-dom/client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Leaf, Droplets, MapPin, Activity, Thermometer, Wind } from "lucide-react";

export async function generateObservationPDF(obs: any) {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px"; // A4 width at 96 DPI
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#000000";
  document.body.appendChild(container);

  // Mock historical data for the graph
  const graphData = Array.from({ length: 7 }).map((_, i) => ({
    day: `J-${6-i}`,
    temp: 20 + Math.random() * 10,
    humidity: 40 + Math.random() * 30
  }));

  const pdfRoot = createRoot(container);
  
  const PdfLayout = () => (
    <div className="p-8 font-sans bg-white" style={{ width: '794px', minHeight: '1123px' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-emerald-500 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rapport d'Observation</h1>
          <p className="text-slate-500 text-sm mt-1">{obs.siteName} • {obs.plotName}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end text-emerald-600 mb-1">
            <Leaf size={24} className="fill-emerald-600" />
            <span className="font-bold text-xl tracking-tight">AgroScan IA</span>
          </div>
          <p className="text-xs font-mono text-slate-400">ID: {obs.id.substring(0, 8).toUpperCase()}</p>
          <p className="text-xs text-slate-400">{new Date(obs.capturedAt).toLocaleDateString("fr-FR")}</p>
        </div>
      </div>

      {/* Grid Multi-colonnes */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Info Column */}
        <div className="col-span-2 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Détails de Culture</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Leaf size={12}/> Culture</span>
                <p className="font-bold text-slate-700">{obs.culture || "Non spécifiée"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Activity size={12}/> Variété</span>
                <p className="font-bold text-slate-700">{obs.variete || "Non spécifiée"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={12}/> Latitude</span>
                <p className="font-mono text-sm text-slate-700">{obs.latitude?.toFixed(6) || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={12}/> Longitude</span>
                <p className="font-mono text-sm text-slate-700">{obs.longitude?.toFixed(6) || "N/A"}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Diagnostic IA</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              {obs.diagnosis?.description || "Aucune description disponible."}
            </p>
            {obs.diagnosis?.treatments && obs.diagnosis.treatments.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600 uppercase">Recommandations</span>
                <ul className="list-disc pl-4 text-xs text-slate-600">
                  {obs.diagnosis.treatments.map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Stickers Column */}
        <div className="space-y-3">
          <div className={`p-4 rounded-2xl border ${obs.diagnosis?.healthStatus === 'critical' ? 'bg-red-50 border-red-200' : obs.diagnosis?.healthStatus === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-1">Statut Sanitaire</span>
            <span className={`text-lg font-black uppercase ${obs.diagnosis?.healthStatus === 'critical' ? 'text-red-700' : obs.diagnosis?.healthStatus === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`}>
              {obs.diagnosis?.healthStatus === 'critical' ? 'Critique' : obs.diagnosis?.healthStatus === 'warning' ? 'Attention' : 'Sain'}
            </span>
          </div>
          
          <div className="p-4 rounded-2xl border bg-blue-50 border-blue-200">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600/60 block mb-1">Confiance IA</span>
            <span className="text-lg font-black text-blue-700">{obs.diagnosis?.confidence ? (obs.diagnosis.confidence * 100).toFixed(1) + '%' : 'N/A'}</span>
          </div>

          <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Maladie Principale</span>
            <span className="text-sm font-bold text-slate-700">{obs.diagnosis?.primaryDisease || 'Aucune'}</span>
          </div>
        </div>
      </div>

      {/* Graphes Dynamiques */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity size={14} /> Dynamique Environnementale
        </h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
              <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Température (°C)</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-bold"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Humidité (%)</div>
        </div>
      </div>

      {/* Images */}
      {obs.images && obs.images.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Preuves Visuelles</h2>
          <div className="grid grid-cols-2 gap-4">
            {obs.images.slice(0, 2).map((img: string, idx: number) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Observation" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  pdfRoot.render(<PdfLayout />);

  // Wait for images and charts to render
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.9);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`AgroScan_Rapport_${obs.id.substring(0, 8)}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
  } finally {
    pdfRoot.unmount();
    document.body.removeChild(container);
  }
}
