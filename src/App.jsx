import React, { useMemo, useRef, useState } from 'react';
import { BookOpen, Plus, Search, Trash2, ExternalLink, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, FileText, ArrowUpRight, GraduationCap, Pencil, Copy, Upload, Network, Quote } from 'lucide-react';
import { emptySource, assessSource, coachNotes, normalizeSource, applyCheck, TEXT_CHECKS, formatCitation, claimMap, parseLibrary, STANCES } from './lib/review.js';

const starter = [
  { id: 'demo-1', title: 'How urban trees reduce neighborhood heat', url: 'https://example.edu/urban-tree-study', author: 'Sample Research Team', publisher: 'Example University (demo)', date: '2025-04-12', claim: 'Urban tree cover can reduce local heat exposure.', references: 4, corroboration: 2, method: true, bias: false, stance: 'supports', notes: '' },
  { id: 'demo-2', title: 'Limits of street trees as a heat strategy', url: 'https://example.org/tree-limits', author: 'Demo Policy Lab', publisher: 'Example Policy Review (demo)', date: '2024-09-03', claim: 'Urban tree cover can reduce local heat exposure.', references: 2, corroboration: 0, method: false, bias: true, stance: 'challenges', notes: '' },
];
const STANCE_LABEL = { supports: 'Supports', challenges: 'Challenges', context: 'Context' };
const API_BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const fresh = () => ({ ...emptySource });

function loadSources() {
  try {
    const saved = JSON.parse(localStorage.getItem('proofpath-sources'));
    if (!Array.isArray(saved)) return starter;
    return saved.filter((item) => item && typeof item === 'object').map((item, i) => ({ ...normalizeSource(item), id: String(item.id || `saved-${i}`) })).filter((s) => s.title && s.claim);
  } catch { return starter; }
}

function SourceForm({ value, onChange, onSubmit, submitLabel, onCancel }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return <form className="add-form" onSubmit={onSubmit}>
    <div className="form-title">{onCancel ? <Pencil size={17} /> : <Plus size={17} />}<b>{onCancel ? 'Edit source' : 'Add a source'}</b></div>
    <input aria-label="Source title" required maxLength={180} value={value.title} onChange={set('title')} placeholder="Source title" />
    <input aria-label="Source URL" value={value.url} onChange={set('url')} placeholder="Source URL (https://…)" />
    <input aria-label="Claim" required maxLength={1000} value={value.claim} onChange={set('claim')} placeholder="What claim are you evaluating?" />
    <div className="form-grid"><input aria-label="Author" value={value.author} onChange={set('author')} placeholder="Author" /><input aria-label="Publisher" value={value.publisher} onChange={set('publisher')} placeholder="Publisher" /></div>
    <div className="form-grid">
      <label className="mini-label">Published<input type="date" value={value.date} onChange={set('date')} /></label>
      <label className="mini-label">This source…<select value={value.stance} onChange={set('stance')}>{STANCES.map((s) => <option key={s} value={s}>{STANCE_LABEL[s]} the claim</option>)}</select></label>
    </div>
    <div className="form-grid">
      <label className="mini-label">References followed<input type="number" min="0" max="99" value={value.references} onChange={set('references')} /></label>
      <label className="mini-label">Independent sources that agree<input type="number" min="0" max="99" value={value.corroboration} onChange={set('corroboration')} /></label>
    </div>
    <div className="form-actions">{onCancel && <button type="button" className="button ghost" onClick={onCancel}>Cancel</button>}<button className="button primary" type="submit">{submitLabel} <Plus size={16} /></button></div>
  </form>;
}

export default function App() {
  const [sources, setSources] = useState(loadSources);
  const [view, setView] = useState('library');
  const [form, setForm] = useState(fresh);
  const [editing, setEditing] = useState(null);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState('');
  const [coach, setCoach] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [style, setStyle] = useState('apa');
  const [toast, setToast] = useState('');
  const importRef = useRef(null);

  const filtered = sources.filter((s) => (s.title + ' ' + s.claim + ' ' + s.publisher + ' ' + s.author).toLowerCase().includes(query.toLowerCase()));
  const selected = sources.find((s) => s.id === active) || sources[0] || null;
  const review = useMemo(() => (selected ? assessSource(selected) : null), [selected]);
  const claims = useMemo(() => claimMap(sources), [sources]);
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  function persist(next) {
    setSources(next);
    try { localStorage.setItem('proofpath-sources', JSON.stringify(next)); }
    catch { setCoach({ headline: 'Browser storage is unavailable', notes: ['Your changes are visible for this session but may not persist after closing the tab.'], disclaimer: 'Export your library to keep a backup.' }); }
  }
  function add(e) {
    e.preventDefault();
    const s = normalizeSource(form);
    if (!s.title || !s.claim) { flash('Add a title and the claim you are evaluating.'); return; }
    if (form.url && !s.url) flash('That link was not saved: only http:// and https:// links are accepted.');
    const next = [{ ...s, id: newId() }, ...sources];
    persist(next); setActive(next[0].id); setForm(fresh()); setCoach(null); setView('library');
  }
  function saveEdit(e) {
    e.preventDefault();
    const s = normalizeSource(editing);
    if (!s.title || !s.claim) { flash('A source needs a title and a claim.'); return; }
    persist(sources.map((x) => (x.id === editing.id ? { ...x, ...s } : x))); setEditing(null); setCoach(null); flash('Source updated.');
  }
  function remove(id) {
    if (!window.confirm('Delete this source from your library?')) return;
    const next = sources.filter((s) => s.id !== id); persist(next); setActive(next[0]?.id || null); setCoach(null); setEditing(null);
  }
  function toggle(checkId, checked) {
    if (TEXT_CHECKS.includes(checkId)) { setEditing({ ...selected }); return; }
    persist(sources.map((s) => (s.id === selected.id ? applyCheck(s, checkId, checked) : s)));
  }
  function updateNotes(text) { persist(sources.map((s) => (s.id === selected.id ? { ...s, notes: text.slice(0, 2000) } : s))); }
  async function runCoach() {
    if (!selected) return;
    setAiBusy(true); setCoach(null);
    try {
      const r = await fetch(`${API_BASE}/api/coach`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: selected }) });
      setCoach(r.ok ? await r.json() : coachNotes(selected));
    } catch { setCoach(coachNotes(selected)); }
    finally { setAiBusy(false); }
  }
  function download(name, text, type) { const blob = new Blob([text], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function exportData() { download('proofpath-research.json', JSON.stringify({ app: 'ProofPath', version: '1.3.0', exportedAt: new Date().toISOString(), sources }, null, 2), 'application/json'); }
  function exportBibliography() { download(`proofpath-bibliography-${style}.txt`, [...sources].map((s) => formatCitation(s, style)).sort((a, b) => a.localeCompare(b)).join('\n\n'), 'text/plain;charset=utf-8'); }
  async function importFile(file) {
    if (!file) return;
    if (file.size > 2_000_000) { flash('That file is too large to be a ProofPath library.'); return; }
    const { sources: incoming, error } = parseLibrary(await file.text(), sources.map((s) => s.id), newId);
    if (error) { flash(error); return; }
    persist([...incoming, ...sources]); flash(`Imported ${incoming.length} source${incoming.length === 1 ? '' : 's'}.`);
  }
  async function copyCitation() {
    const text = formatCitation(selected, style);
    try { await navigator.clipboard.writeText(text); flash('Citation copied.'); } catch { flash('Copy blocked by the browser. Select the citation text instead.'); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><BookOpen size={21} /></div><div><b>ProofPath</b><span>RESEARCH WITH RECEIPTS</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className={`nav ${view === 'library' ? 'active' : ''}`} aria-pressed={view === 'library'} onClick={() => setView('library')}><FileText size={17} /> Research library</button>
      <button className={`nav ${view === 'claims' ? 'active' : ''}`} aria-pressed={view === 'claims'} onClick={() => setView('claims')}><Network size={17} /> Claim map <span className="nav-count">{claims.length}</span></button>
      <div className="side-note"><ShieldCheck size={18} /><div><b>Think critically.</b><p>ProofPath helps you review the research process. It never decides whether a claim is true.</p></div></div>
      <div className="sidebar-bottom">STEM2Connect AI Hackathon<br /><span>Education track · v1.3.0</span></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div><div className="eyebrow">STUDENT RESEARCH WORKSPACE</div><h1>{view === 'claims' ? 'See both sides of every claim.' : 'Build stronger arguments.'}</h1><p>{view === 'claims' ? 'Each claim with the sources that support, challenge, or add context to it.' : 'Collect sources, inspect evidence, and see what still needs checking.'}</p></div>
        <div className="top-actions">
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ''; }} />
          <button className="button ghost" onClick={() => importRef.current?.click()}><Upload size={15} /> Import</button>
          <button className="button ghost" onClick={exportBibliography}><Quote size={15} /> Bibliography</button>
          <button className="button ghost" onClick={exportData}>Export library <ArrowUpRight size={16} /></button>
        </div>
      </header>
      <section className="stats">
        <div className="stat"><span>Saved sources</span><strong>{sources.length}</strong><small>In this browser</small></div>
        <div className="stat"><span>Claims tracked</span><strong>{claims.length}</strong><small>{claims.filter((c) => c.challenges > 0).length} with a challenging source</small></div>
        <div className="stat"><span>Research checks</span><strong>{sources.reduce((n, s) => n + assessSource(s).passed, 0)}</strong><small>of {sources.length * 8} across sources</small></div>
      </section>

      {view === 'claims' ? <section className="claim-grid">
        {claims.map((c) => <article className="panel claim-card" key={c.claim}>
          <div className="eyebrow">CLAIM</div><h2>“{c.claim}”</h2>
          <div className="balance" aria-label={`${c.supports} supporting, ${c.challenges} challenging, ${c.context} context`}>
            {c.supports > 0 && <i className="b-sup" style={{ flex: c.supports }} />}{c.challenges > 0 && <i className="b-cha" style={{ flex: c.challenges }} />}{c.context > 0 && <i className="b-ctx" style={{ flex: c.context }} />}
          </div>
          <div className="balance-legend"><span className="l-sup">{c.supports} support</span><span className="l-cha">{c.challenges} challenge</span><span className="l-ctx">{c.context} context</span><span>Avg. checklist {c.averageCompleteness}%</span></div>
          <ul className="claim-sources">{c.sources.map((s) => <li key={s.id}><button onClick={() => { setActive(s.id); setView('library'); setCoach(null); }}><span className={`stance stance-${s.stance}`}>{STANCE_LABEL[s.stance]}</span>{s.title}<small>{assessSource(s).passed}/8</small></button></li>)}</ul>
          {c.prompts.length > 0 && <div className="prompts"><b>Next research steps</b><ul>{c.prompts.map((p) => <li key={p}>{p}</li>)}</ul></div>}
        </article>)}
        {!claims.length && <div className="empty large"><Network size={32} /><h2>No claims yet.</h2><p>Add a source with the claim it addresses.</p></div>}
      </section> :

      <div className="workspace">
        <section className="panel library">
          <div className="panel-head"><div><h2>Research library</h2><p>Your sources and the claims they support.</p></div><span className="count">{sources.length} ITEMS</span></div>
          <label className="search"><Search size={16} /><input aria-label="Search sources" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sources or claims" /></label>
          <div className="source-list">{filtered.map((s) => { const a = assessSource(s); return <button key={s.id} className={'source-item ' + (selected?.id === s.id ? 'selected' : '')} onClick={() => { setActive(s.id); setCoach(null); setEditing(null); }}><div className="source-top"><span className={`stance stance-${s.stance}`}>{STANCE_LABEL[s.stance]}</span><span>{s.publisher || 'Unspecified publisher'}</span><span className="source-score">{a.passed}/8</span></div><b>{s.title}</b><p>{s.claim}</p></button>; })}{!filtered.length && <div className="empty">No matching sources. Add one to start your library.</div>}</div>
          <SourceForm value={form} onChange={setForm} onSubmit={add} submitLabel="Add to library" />
        </section>

        <section className="panel detail">{selected ? (editing && editing.id === selected.id ? <SourceForm value={editing} onChange={setEditing} onSubmit={saveEdit} submitLabel="Save changes" onCancel={() => setEditing(null)} /> : <>
          <div className="panel-head"><div><div className="eyebrow">SOURCE REVIEW · <span className={`stance stance-${selected.stance}`}>{STANCE_LABEL[selected.stance]}</span></div><h2>{selected.title}</h2><p>{selected.author || 'Author not entered'} · {selected.publisher || 'Publisher not entered'} · {selected.date || 'Date not entered'}</p></div>
            <div className="head-actions"><button className="icon-button" title="Edit source" aria-label="Edit source" onClick={() => setEditing({ ...selected })}><Pencil size={17} /></button><button className="icon-button" title="Delete source" aria-label="Delete source" onClick={() => remove(selected.id)}><Trash2 size={17} /></button></div></div>
          <div className="claim-box"><span>CLAIM TO INVESTIGATE</span><p>“{selected.claim}”</p>{selected.url && <a href={selected.url} target="_blank" rel="noreferrer">Open original source <ExternalLink size={14} /></a>}</div>
          <div className="score-row"><div className="score-ring" style={{ '--score': `${review.percent}%` }}><div><b>{review.percent}%</b><small>{review.passed}/8</small></div></div><div><b>{review.level}</b><p>Research process completeness, not a truth or credibility score.</p></div></div>
          <div className="checklist"><div className="check-head"><h3>Evidence checklist</h3><span>{review.passed} of 8 complete</span></div>
            {review.checks.map((c) => { const textCheck = TEXT_CHECKS.includes(c.id); return <label className="check" key={c.id}>
              <input type="checkbox" checked={c.ok} onChange={(e) => toggle(c.id, e.target.checked)} aria-describedby={`why-${c.id}`} />
              <span className="checkmark">{c.ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</span>
              <span><b>{c.label}</b><small id={`why-${c.id}`}>{c.why}{textCheck && !c.ok ? ' Click to fill in this field.' : ''}</small></span></label>; })}
          </div>
          <div className="citation"><div className="check-head"><h3>Citation</h3><div className="seg" role="group" aria-label="Citation style">{['apa', 'mla'].map((s) => <button key={s} className={style === s ? 'on' : ''} aria-pressed={style === s} onClick={() => setStyle(s)}>{s.toUpperCase()}</button>)}</div></div>
            <p className="cite-text">{formatCitation(selected, style)}</p><button className="button ghost" onClick={copyCitation}><Copy size={14} /> Copy citation</button><small className="cite-note">Simplified {style.toUpperCase()} format. Check italics and capitalization against your teacher's style guide.</small></div>
          <label className="notes"><b>My notes</b><textarea key={selected.id} defaultValue={selected.notes} maxLength={2000} rows={3} placeholder="Key quote, page number, how this source relates to your argument…" onBlur={(e) => updateNotes(e.target.value)} /></label>
          <div className="coach"><div className="coach-title"><div className="ai-icon"><Sparkles size={17} /></div><div><b>Research coach</b><small>Optional AI connection · local fallback available</small></div><button className="button dark" onClick={runCoach} disabled={aiBusy}>{aiBusy ? 'Reviewing…' : 'Review gaps'} <Sparkles size={15} /></button></div>
            {coach && <div className="coach-result"><b>{coach.headline}</b><ul>{coach.notes.map((n, i) => <li key={i}>{n}</li>)}</ul><small>{coach.disclaimer}</small><small className="mode">{coach.mode === 'ai' ? 'Generated by the configured AI provider.' : 'Generated by the local checklist (no AI call).'}{coach.providerNote ? ` ${coach.providerNote}` : ''}</small></div>}</div>
        </>) : <div className="empty large"><GraduationCap size={32} /><h2>Your research starts here.</h2><p>Add a source to review its evidence trail.</p></div>}</section>
      </div>}
      <footer>ProofPath is an educational research organizer. It does not verify facts, rank publishers, or replace careful source reading. Demo data is labeled.</footer>
    </main>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
