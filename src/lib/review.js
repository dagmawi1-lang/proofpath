export const STANCES = ['supports','challenges','context'];
export const emptySource = { title:'', url:'', author:'', publisher:'', date:'', claim:'', references:0, corroboration:0, method:false, bias:false, stance:'supports', notes:'' };
const cleanText = (value, max=500) => String(value ?? '').trim().slice(0,max);
export function safeHttpUrl(value){
  const raw=cleanText(value,2048);
  if(!raw) return '';
  try { const url=new URL(raw); return ['http:','https:'].includes(url.protocol)?url.href:''; }
  catch { return ''; }
}
export function assessSource(source={}) {
  const s=normalizeSource(source);
  const checks = [
    {id:'author',label:'Author or organization is identifiable',ok:Boolean(s.author),why:'Find who created the information and check their relevant expertise.'},
    {id:'date',label:'Publication or update date is visible',ok:Boolean(s.date),why:'Check whether the information is current enough for your question.'},
    {id:'method',label:'Methods or evidence are explained',ok:Boolean(s.method),why:'Look for data, methodology, citations, or a transparent explanation.'},
    {id:'references',label:'References can be followed',ok:s.references>0,why:'Open the cited material and confirm it supports the claim.'},
    {id:'corroboration',label:'Independent sources agree',ok:s.corroboration>0,why:'Find separate sources, not pages that all repeat the same original report.'},
    {id:'bias',label:'Limitations or possible bias are considered',ok:Boolean(s.bias),why:'Consider funding, conflicts of interest, framing, and missing perspectives.'},
    {id:'claim',label:'A specific claim has been written down',ok:Boolean(s.claim),why:'Make the statement precise enough to verify or challenge.'},
    {id:'url',label:'A source link is provided',ok:Boolean(safeHttpUrl(s.url)),why:'Keep the original source available so another person can inspect it.'}
  ];
  const passed=checks.filter(x=>x.ok).length;
  return {checks,passed,total:checks.length,percent:Math.round(passed/checks.length*100),level:passed>=7?'Well documented':passed>=4?'Needs more checking':'Early research'};
}
export function coachNotes(source) {
  const a=assessSource(source);
  const missing=a.checks.filter(x=>!x.ok).map(x=>x.why);
  return {headline:`${a.level}: ${a.passed}/${a.total} research checks completed`, notes:missing.length?missing.slice(0,5):['Your checklist is complete. Re-open the original sources and verify that each citation supports the exact claim.'], disclaimer:'This is a research-process checklist, not a fact-check, source ranking, or guarantee that a claim is true.',mode:'local'};
}
export function normalizeSource(source={}) {
  return {
    title:cleanText(source.title,180), url:safeHttpUrl(source.url), author:cleanText(source.author,120),
    publisher:cleanText(source.publisher,120), date:/^\d{4}-\d{2}-\d{2}$/.test(String(source.date||''))?String(source.date):'',
    claim:cleanText(source.claim,1000), references:Math.max(0,Math.min(99,Math.floor(Number(source.references)||0))),
    corroboration:Math.max(0,Math.min(99,Math.floor(Number(source.corroboration)||0))),
    method:source.method===true, bias:source.bias===true,
    stance:STANCES.includes(source.stance)?source.stance:'supports', notes:cleanText(source.notes,2000)
  };
}

// ---- 1.3.0: checklist edits, citations, claim map, import ----

/** Applies a checklist toggle correctly: yes/no checks flip booleans, count checks set 0/1+, text checks are never overwritten. */
export function applyCheck(source, checkId, checked) {
  if (checkId === 'method' || checkId === 'bias') return { ...source, [checkId]: Boolean(checked) };
  if (checkId === 'references' || checkId === 'corroboration') {
    const current = Math.max(0, Math.floor(Number(source[checkId]) || 0));
    return { ...source, [checkId]: checked ? Math.max(1, current) : 0 };
  }
  return source; // author, date, claim, url are satisfied by filling in the field itself
}
export const TEXT_CHECKS = ['author', 'date', 'claim', 'url'];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MLA_MONTHS = ['Jan.','Feb.','Mar.','Apr.','May','June','July','Aug.','Sept.','Oct.','Nov.','Dec.'];
function parts(date) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || ''); return m ? { y: +m[1], mo: +m[2] - 1, d: +m[3] } : null; }
function sentenceCase(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

/** Simplified APA 7 / MLA 9 citation for a web source. Students should double-check against their style guide. */
export function formatCitation(source, style = 'apa', accessed = new Date().toISOString().slice(0, 10)) {
  const s = normalizeSource(source);
  const d = parts(s.date);
  const title = s.title || 'Untitled source';
  if (style === 'mla') {
    const a = parts(accessed);
    const bits = [];
    if (s.author) bits.push(`${s.author.replace(/\.$/, '')}.`);
    bits.push(`"${title.replace(/\.$/, '')}."`);
    if (s.publisher) bits.push(`${s.publisher},`);
    if (d) bits.push(`${d.d} ${MLA_MONTHS[d.mo]} ${d.y},`);
    if (s.url) bits.push(`${s.url.replace(/^https?:\/\//, '')}.`);
    if (a) bits.push(`Accessed ${a.d} ${MLA_MONTHS[a.mo]} ${a.y}.`);
    return bits.join(' ').replace(/,$/, '.');
  }
  const author = s.author || s.publisher || title;
  const when = d ? `(${d.y}, ${MONTHS[d.mo]} ${d.d})` : '(n.d.)';
  const site = s.publisher && s.publisher !== author ? ` ${s.publisher}.` : '';
  const head = author === title ? `${sentenceCase(title)}. ${when}.` : `${author.replace(/\.$/, '')}. ${when}. ${sentenceCase(title)}.`;
  return `${head}${site}${s.url ? ` ${s.url}` : ''}`.trim();
}

const claimKey = (c) => String(c || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

/** Groups sources by the claim they address and summarizes the evidence balance for each claim. */
export function claimMap(sources) {
  const groups = new Map();
  for (const src of Array.isArray(sources) ? sources : []) {
    const key = claimKey(src.claim);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { claim: String(src.claim).trim(), sources: [] });
    groups.get(key).sources.push(src);
  }
  return [...groups.values()].map((g) => {
    const count = (st) => g.sources.filter((x) => (x.stance || 'supports') === st).length;
    const avg = Math.round(g.sources.reduce((n, x) => n + assessSource(x).percent, 0) / g.sources.length);
    const supports = count('supports'), challenges = count('challenges'), context = count('context');
    const prompts = [];
    if (g.sources.length < 2) prompts.push('Only one source addresses this claim. Look for an independent second source.');
    if (challenges === 0) prompts.push('No challenging source yet. Search for critiques, limitations, or contrary findings.');
    if (avg < 50) prompts.push('Sources for this claim are lightly documented. Complete their checklists first.');
    return { ...g, supports, challenges, context, averageCompleteness: avg, prompts };
  }).sort((a, b) => b.sources.length - a.sources.length);
}

/** Parses an exported ProofPath library (array or {sources:[...]}) into normalized sources with fresh unique ids. */
export function parseLibrary(text, existingIds = [], makeId = () => Math.random().toString(36).slice(2)) {
  let data;
  try { data = JSON.parse(text); } catch { return { sources: [], error: 'That file is not valid JSON.' }; }
  const list = Array.isArray(data) ? data : Array.isArray(data?.sources) ? data.sources : null;
  if (!list) return { sources: [], error: 'Expected a ProofPath export (a list of sources).' };
  const taken = new Set(existingIds);
  const sources = list.slice(0, 500).filter((x) => x && typeof x === 'object').map((x) => {
    let id = typeof x.id === 'string' && x.id && !taken.has(x.id) ? x.id.slice(0, 80) : makeId();
    while (taken.has(id)) id = makeId();
    taken.add(id);
    return { ...normalizeSource(x), id };
  }).filter((x) => x.title && x.claim);
  return { sources, error: sources.length ? '' : 'No usable sources were found (each needs a title and a claim).' };
}
