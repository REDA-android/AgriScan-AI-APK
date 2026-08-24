const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add withRetry helper
if (!content.includes('withRetry')) {
  const retryHelper = `
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      console.warn(\`Operation failed (attempt \${attempt}/\${maxRetries}), retrying in \${delay}ms...\`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Unreachable");
}
`;
  content = content.replace('export default function App() {', retryHelper + '\nexport default function App() {');
}

// 2. Wrap uploadImage and addDoc with withRetry in syncSingleOfflineObservation
content = content.replace('const storageUrl = await uploadImage(blob, storagePath);', 'const storageUrl = await withRetry(() => uploadImage(blob, storagePath));');
content = content.replace('const docRef = await addDoc(', 'const docRef = await withRetry(() => addDoc(');
content = content.replace('collection(db, "observations"),', 'collection(db, "observations"),');
content = content.replace('observationData,\n      );', 'observationData\n      ));');

// 3. Apply rounded-3xl to the motion.div of the scan tab, or wrap everything in a rounded-3xl div.
// Wait, wrapping in rounded-3xl div is safer.
content = content.replace(
  '<main className="flex-1 overflow-y-auto p-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] scroll-smooth">',
  '<main className="flex-1 overflow-y-auto p-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] scroll-smooth">\n        <div className="rounded-3xl overflow-hidden">'
);
content = content.replace(
  '</main>',
  '</div>\n      </main>'
);

// 4. Batch edit
const bulkEditStateStr = 'const [deleteConfirmState, setDeleteConfirmState] = useState<{ isOpen: boolean; id: string | null; isBulk?: boolean }>({ isOpen: false, id: null });';
const bulkEditAddStr = `
  const [bulkEditState, setBulkEditState] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [bulkEditData, setBulkEditData] = useState<{ tags: string; lat: string; lng: string; domain: string }>({ tags: '', lat: '', lng: '', domain: '' });
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  const executeBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    setIsSavingBulk(true);
    try {
      const { writeBatch, doc } = await import("firebase/firestore");
      const batch = writeBatch(db);
      for (const selId of selectedIds) {
        const updates: any = {};
        if (bulkEditData.tags) updates.userNotes = bulkEditData.tags;
        if (bulkEditData.domain) updates.domain = bulkEditData.domain;
        if (bulkEditData.lat || bulkEditData.lng) {
          updates.location = {
            lat: parseFloat(bulkEditData.lat) || 0,
            lng: parseFloat(bulkEditData.lng) || 0,
          };
        }
        if (Object.keys(updates).length > 0) {
          batch.update(doc(db, "observations", selId), updates);
        }
      }
      await batch.commit();
      setBulkEditState({ isOpen: false });
      setSelectedIds([]);
      setIsSelectionMode(false);
      triggerHaptic("success");
      notifyUser("Mise à jour en masse réussie", "success");
    } catch (e) {
      console.error(e);
      notifyUser("Erreur lors de la mise à jour", "error");
    } finally {
      setIsSavingBulk(false);
    }
  };
`;
content = content.replace(bulkEditStateStr, bulkEditStateStr + '\\n' + bulkEditAddStr);

const bulkEditButton = `
                        <button
                          onClick={() => setBulkEditState({ isOpen: true })}
                          disabled={selectedIds.length === 0}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg flex items-center gap-1 text-xs font-bold hover:bg-blue-500/20"
                        >
                          <Edit2 size={16} />({selectedIds.length}) Éditer
                        </button>
                        <button
                          onClick={handleBulkDelete}
`;
content = content.replace('<button\n                          onClick={handleBulkDelete}', bulkEditButton);

const bulkEditModal = `
      {/* Bulk Edit Modal */}
      {bulkEditState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121814] rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Édition en masse ({selectedIds.length})</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Tags / Notes communes</label>
                <input
                  type="text"
                  value={bulkEditData.tags}
                  onChange={e => setBulkEditData({...bulkEditData, tags: e.target.value})}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
                  placeholder="Ex: #serre #traitement"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">Domaine</label>
                <input
                  type="text"
                  value={bulkEditData.domain}
                  onChange={e => setBulkEditData({...bulkEditData, domain: e.target.value})}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
                  placeholder="Ex: Arboriculture"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400">Latitude</label>
                  <input
                    type="number"
                    value={bulkEditData.lat}
                    onChange={e => setBulkEditData({...bulkEditData, lat: e.target.value})}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400">Longitude</label>
                  <input
                    type="number"
                    value={bulkEditData.lng}
                    onChange={e => setBulkEditData({...bulkEditData, lng: e.target.value})}
                    className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setBulkEditState({ isOpen: false })}
                className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={executeBulkEdit}
                disabled={isSavingBulk}
                className="flex-1 py-3 bg-emerald-500 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              >
                {isSavingBulk ? <RefreshCw size={16} className="animate-spin" /> : "Appliquer"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
`;
content = content.replace('{/* Delete Confirm Modal */}', bulkEditModal);

fs.writeFileSync('src/App.tsx', content);
