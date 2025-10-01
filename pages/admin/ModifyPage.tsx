import React, { useEffect, useState } from 'react';
import AdminRoute from '../../components/AdminRoute';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

type BannerConfig = {
  visible: boolean;
  text: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  linkUrl: string;
  openInNewTab: boolean;
  public?: boolean;
};

const DEFAULT: BannerConfig = {
  visible: true,
  text: 'Stand with Palestine',
  imageUrl: '',
  bgColor: 'transparent',
  textColor: '#ffe7e6',
  linkUrl: '',
  openInNewTab: true,
  public: true,
};

const STORAGE_KEY = 'nafs_admin_banner_config_v1';

const ModifyPage: React.FC = () => {
  const [cfg, setCfg] = useState<BannerConfig>(DEFAULT);
  const [previewHover, setPreviewHover] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCfg(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load banner config', e);
    }
  }, []);

  const save = () => {
    try {
      // Save to localStorage for quick prototyping
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      // Also persist to Firestore under admin/bannerConfig
      db.collection('admin').doc('bannerConfig').set({ ...cfg, updatedAt: new Date() });
      alert('Banner configuration saved to Firestore and localStorage.');
    } catch (e) {
      console.error('Failed to save banner config', e);
      alert('Failed to save configuration. Check console for details.');
    }
  };

  const reset = () => {
    setCfg(DEFAULT);
    localStorage.removeItem(STORAGE_KEY);
  };
  return (
    <AdminRoute>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Modify Top Banner</h1>
          <Link to="/admin" className="text-sm text-sky-400">Back to Admin</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: form */}
          <div>
            <label className="block mb-2 font-semibold">Visible</label>
            <input type="checkbox" checked={cfg.visible} onChange={(e) => setCfg({ ...cfg, visible: e.target.checked })} />

            <label className="block mt-4 mb-2 font-semibold">Text</label>
            <input className="w-full p-2 rounded bg-slate-800" value={cfg.text} onChange={(e) => setCfg({ ...cfg, text: e.target.value })} />

            <label className="block mt-4 mb-2 font-semibold">Image URL (optional)</label>
            <input className="w-full p-2 rounded bg-slate-800" value={cfg.imageUrl} onChange={(e) => setCfg({ ...cfg, imageUrl: e.target.value })} placeholder="https://..." />

            <label className="block mt-4 mb-2 font-semibold">Or upload image (will be saved as base64)</label>
            <input type="file" accept="image/*" className="w-full p-2 rounded bg-slate-800" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 1024 * 1024 * 2) { // 2MB limit warning
                if (!confirm('Image is larger than 2MB and may be too big to store as base64 in Firestore. Continue?')) return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string | ArrayBuffer | null;
                if (typeof result === 'string') {
                  setCfg({ ...cfg, imageUrl: result });
                }
              };
              reader.readAsDataURL(file);
            }} />

            <label className="block mt-4 mb-2 font-semibold">Background Color</label>
            <input className="w-full p-2 rounded bg-slate-800" value={cfg.bgColor} onChange={(e) => setCfg({ ...cfg, bgColor: e.target.value })} placeholder="transparent or #123456" />

            <label className="block mt-4 mb-2 font-semibold">Text Color</label>
            <input className="w-full p-2 rounded bg-slate-800" value={cfg.textColor} onChange={(e) => setCfg({ ...cfg, textColor: e.target.value })} placeholder="#ffe7e6" />

            <label className="block mt-4 mb-2 font-semibold">Link URL (optional)</label>
            <input className="w-full p-2 rounded bg-slate-800" value={cfg.linkUrl} onChange={(e) => setCfg({ ...cfg, linkUrl: e.target.value })} placeholder="https://..." />
            <div className="mt-2">
              <label className="mr-2">Open in new tab</label>
              <input type="checkbox" checked={cfg.openInNewTab} onChange={(e) => setCfg({ ...cfg, openInNewTab: e.target.checked })} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={save} className="px-4 py-2 bg-sky-600 rounded text-white">Save</button>
              <button onClick={reset} className="px-4 py-2 bg-gray-600 rounded text-white">Reset</button>
            </div>
            <div className="mt-4">
              <label className="mr-2">Make banner public (visible to all users)</label>
              <input type="checkbox" checked={!!cfg.public} onChange={(e) => setCfg({ ...cfg, public: e.target.checked })} />
            </div>
          </div>

          {/* Right: preview */}
          <div>
            <h2 className="font-semibold mb-2">Preview</h2>
            <div
              onMouseEnter={() => setPreviewHover(true)}
              onMouseLeave={() => setPreviewHover(false)}
              style={{
                display: cfg.visible ? 'flex' : 'none',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: cfg.bgColor || 'transparent',
                color: cfg.textColor || '#fff',
                boxShadow: previewHover ? '0 6px 18px rgba(0,0,0,0.35)' : '0 2px 6px rgba(0,0,0,0.2)',
                transition: 'box-shadow 180ms ease, transform 180ms ease',
                transform: previewHover ? 'translateY(-3px)' : 'none',
              }}
            >
              {cfg.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cfg.imageUrl} alt="banner" style={{ width: 52, height: 32, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <svg width={44} height={28} viewBox="0 0 60 36" style={{ borderRadius: 4 }}>
                  <defs><clipPath id="pvclip"><rect width="60" height="36" rx="2" ry="2"/></clipPath></defs>
                  <g clipPath="url(#pvclip)">
                    <rect width="60" height="12" y="0" fill="#000" />
                    <rect width="60" height="12" y="12" fill="#fff" />
                    <rect width="60" height="12" y="24" fill="#007a3d" />
                    <polygon points="0,0 24,18 0,36" fill="#ce1126" />
                  </g>
                </svg>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {cfg.linkUrl ? (
                  <a href={cfg.linkUrl} target={cfg.openInNewTab ? '_blank' : '_self'} rel="noreferrer" style={{ color: cfg.textColor, fontWeight: 700 }}>{cfg.text}</a>
                ) : (
                  <div style={{ color: cfg.textColor, fontWeight: 700 }}>{cfg.text}</div>
                )}
                <div style={{ fontSize: 12, opacity: 0.8 }}>{cfg.visible ? 'Visible' : 'Hidden'}</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-300">
              Changes are saved to localStorage and Firestore. Storing large base64 images in Firestore is not ideal — consider using Firebase Storage and saving a URL instead for production.
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
};

export default ModifyPage;
