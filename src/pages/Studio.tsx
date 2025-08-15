import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor2 from '../new-editor/pages/Editor2';

type PresetKey = '1080x1080' | '1080x1920' | '1280x720' | '1920x1080';

export default function Studio() {
  const navigate = useNavigate();

  // ===== Theme system (kept from your previous Studio, 1:1 with tiny polish) =====
  const THEMES = useMemo(
    () => [
      { id: 'polished-dark', name: 'Polished Dark', dark: true, bg: 'linear-gradient(135deg,#17171c 0%,#232438 100%)' },
      { id: 'matte-dark', name: 'Matte Dark', dark: true, bg: 'linear-gradient(135deg,#121318 0%,#1b1d26 100%)' },
      { id: 'midnight', name: 'Midnight', dark: true, bg: 'linear-gradient(135deg,#0b1020 0%,#151a2e 100%)' },
      { id: 'deep-violet', name: 'Deep Violet', dark: true, bg: 'linear-gradient(135deg,#1d1033 0%,#2a1d4a 100%)' },
      { id: 'slate', name: 'Slate', dark: true, bg: 'linear-gradient(135deg,#0f172a 0%,#1f2937 100%)' },
      { id: 'ocean-dark', name: 'Ocean Dark', dark: true, bg: 'linear-gradient(135deg,#0b132b 0%,#1c2541 100%)' },
      { id: 'soft-light', name: 'Soft Light', dark: false, bg: 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)' },
      { id: 'warm-sunrise', name: 'Warm Sunrise', dark: false, bg: 'linear-gradient(135deg,#fff7ed 0%,#fde68a 100%)' },
      { id: 'mint-fresh', name: 'Mint Fresh', dark: false, bg: 'linear-gradient(135deg,#ecfeff 0%,#d1fae5 100%)' },
      { id: 'sky-day', name: 'Sky Day', dark: false, bg: 'linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)' },
      { id: 'desert-sand', name: 'Sand', dark: false, bg: 'linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)' },
    ],
    []
  );

  const [themeId, setThemeId] = useState<string>('soft-light');
  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [THEMES, themeId]);
  const textPrimary = theme.dark ? 'text-white' : 'text-zinc-900';
  const borderSubtle = theme.dark ? 'border-white/10' : 'border-black/10';
  const chipBg = theme.dark ? 'bg-zinc-900/60' : 'bg-white';

  // ===== Editor overlay state =====
  const [editorOpen, setEditorOpen] = useState(false);
  const [initialPreset, setInitialPreset] = useState<PresetKey>('1080x1080');

  // Small UX: Esc closes editor; scroll lock body while open
  useEffect(() => {
    if (!editorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditorOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [editorOpen]);

  // ===== Actions =====
  function startBlankProject(preset: PresetKey) {
    setInitialPreset(preset);
    setEditorOpen(true);
  }

  return (
    <div className={`min-h-screen w-full ${textPrimary}`} style={{ background: theme.bg }}>
      {/* ===== Header ===== */}
      <header
        className={`sticky top-0 z-20 backdrop-blur border-b ${borderSubtle}`}
        style={{ background: theme.dark ? 'rgba(15,17,21,0.65)' : 'rgba(255,255,255,0.65)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-2xl font-extrabold text-yellow-500">ViewsBoost Studio</div>
          <div className="ml-auto flex items-center gap-2">
            <input
              className={`${chipBg} ${borderSubtle} border rounded-lg px-3 py-2 text-sm w-72 ${theme.dark ? 'text-white' : 'text-zinc-900'}`}
              placeholder="Search…"
            />
            <button
              onClick={() => startBlankProject(initialPreset)}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-red-500 text-black font-semibold"
            >
              Create
            </button>
          </div>
        </div>

        {/* Theme picker */}
        <div className="max-w-7xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 items-center">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm whitespace-nowrap border ${borderSubtle} ${themeId === t.id ? 'ring-2 ring-yellow-400' : ''}`}
                style={{ background: t.bg }}
                title={t.name}
              >
                <span className={`px-2 py-0.5 rounded ${t.dark ? 'bg-white/20 text-white' : 'bg-black/10 text-zinc-900'}`}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ===== Main content ===== */}
      <main className="w-full px-4 py-6 overflow-y-auto">
        <section className="mb-8 text-center">
          <h2 className={`text-3xl font-bold mb-4 ${textPrimary}`}>Welcome to ViewsBoost Studio</h2>
          <p className={`${theme.dark ? 'text-white/80' : 'text-zinc-700'} text-lg mb-6`}>
            Create stunning graphics, videos, and documents with our powerful canvas editor
          </p>

          {/* Quick start sizes — now wired to Editor2 presets */}
          <div className="mb-8">
            <h3 className={`text-xl font-semibold mb-3 ${textPrimary}`}>Quick start</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { key: '1080x1080' as PresetKey, label: 'Square Post\n1080×1080' },
                { key: '1080x1920' as PresetKey, label: 'Story/Shorts\n1080×1920' },
                { key: '1280x720' as PresetKey, label: 'YouTube Thumbnail\n1280×720' },
                { key: '1920x1080' as PresetKey, label: 'Banner\n1920×1080' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => startBlankProject(s.key)}
                  className={`aspect-video rounded-lg ${theme.dark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-zinc-50'} border ${borderSubtle} flex items-center justify-center p-4 transition-colors`}
                >
                  <span className={`text-sm text-center whitespace-pre ${theme.dark ? 'text-white/70' : 'text-zinc-700'}`}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className={`text-sm ${theme.dark ? 'text-white/60' : 'text-zinc-600'} mb-4`}>
              Templates and other features coming soon...
            </p>
            <button
              onClick={() => startBlankProject(initialPreset)}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-red-500 text-black font-semibold text-lg hover:shadow-lg transition-all"
            >
              Start Creating
            </button>
          </div>
        </section>
      </main>

      {/* ===== Editor overlay ===== */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur">
          <div className="h-screen w-full relative">
            {/* Pass the selected preset into Editor2 */}
            <Editor2 initialPreset={initialPreset} />
          </div>
        </div>
      )}
    </div>
  );
}
