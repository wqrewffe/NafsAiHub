import React, { useEffect, useState } from 'react';
import AdminRoute from '../../components/AdminRoute';
import { db } from '../../firebase/config';
import { doc, collection, getDocs, setDoc } from 'firebase/firestore';
import { tools as staticTools } from '../../tools';
import { Tool } from '../../types';

interface ToolDoc {
  id: string;
  name?: string;
  unlockCost?: number | null;
  category?: string;
}

const DEFAULT_COST = 1000;

const ChangeProductPricePage: React.FC = () => {
  const [tools, setTools] = useState<ToolDoc[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Load Firestore tool docs
        const snapshot = await getDocs(collection(db, 'tools'));
        const firestoreMap: Record<string, any> = {};
        snapshot.docs.forEach(d => firestoreMap[d.id] = d.data());

        // Merge static tools list with firestore docs to ensure all tools show up
        const merged = staticTools.map((t: Tool) => {
          const fd = firestoreMap[t.id] || {};
          return {
            id: t.id,
            name: t.name,
            category: t.category,
            unlockCost: fd.hasOwnProperty('unlockCost') ? (fd.unlockCost as number | null) : null
          } as ToolDoc;
        });

        if (mounted) setTools(merged);
      } catch (e) {
        console.error('Failed to load tools for admin price change', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (id: string, val: string) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, unlockCost: val === '' ? null : Number(val) } : t));
  };

  const saveTool = async (t: ToolDoc) => {
    try {
      setSavingId(t.id);
      const toolRef = doc(db, 'tools', t.id);
      const payload: any = {};
      if (t.unlockCost === null || t.unlockCost === undefined) {
        // set null so the UI can treat empty as default; using merge preserves other fields
        payload.unlockCost = null;
      } else {
        payload.unlockCost = Number(t.unlockCost || 0);
      }
      await setDoc(toolRef, payload, { merge: true });
      alert('Saved');
    } catch (e) {
      console.error('Failed to save tool unlock cost', e);
      alert('Save failed: ' + (e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  // Apply filters
  const lcSearch = search.trim().toLowerCase();
  const filteredTools = tools.filter(t => {
    if (categoryFilter !== 'All' && (t.category || 'Uncategorized') !== categoryFilter) return false;
    if (!lcSearch) return true;
    const hay = `${t.name || ''} ${t.id} ${t.category || ''}`.toLowerCase();
    return hay.includes(lcSearch);
  });

  // Group by category
  const grouped: Record<string, ToolDoc[]> = {};
  filteredTools.forEach(t => {
    const cat = t.category || 'Uncategorized';
    grouped[cat] = grouped[cat] || [];
    grouped[cat].push(t);
  });

  const categories = Array.from(new Set(tools.map(t => t.category || 'Uncategorized'))).sort();

  return (
    <AdminRoute>
      <div className="container mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Change tool unlock points</h2>
        <p className="mb-4 text-sm text-slate-400">Set how many points are needed to unlock each tool. Leave empty to use the default ({DEFAULT_COST} points).</p>

        <div className="flex gap-3 mb-4 items-center">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or id..." className="px-3 py-2 border rounded w-72" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border rounded">
            <option value="All">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {Object.keys(grouped).map(cat => (
          <div key={cat} className="mb-6">
            <h3 className="text-lg font-medium mb-3">{cat}</h3>
            <div className="grid grid-cols-1 gap-3">
              {grouped[cat].map(t => (
                <div key={t.id} className="flex items-center justify-between bg-panel p-3 rounded">
                  <div>
                    <div className="font-medium">{t.name || t.id}</div>
                    <div className="text-xs text-slate-400">{t.id}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" min={0} value={t.unlockCost ?? ''} onChange={e => handleChange(t.id, e.target.value)} className="px-3 py-2 border rounded w-40 bg-background" placeholder={`default (${DEFAULT_COST})`} />
                    <button className="btn" onClick={() => saveTool(t)} disabled={savingId === t.id}>{savingId === t.id ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminRoute>
  );
};

export default ChangeProductPricePage;
