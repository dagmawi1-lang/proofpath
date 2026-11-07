import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCheck, formatCitation, claimMap, parseLibrary, normalizeSource, assessSource } from '../server/review.js';

test('checklist toggles never corrupt text fields (regression: unchecking author left "false" text)', () => {
  const s = { title: 'T', claim: 'C', author: '' };
  assert.equal(applyCheck(s, 'author', true), s);
  assert.equal(applyCheck(s, 'author', false), s);
  assert.equal(applyCheck({ ...s, method: false }, 'method', true).method, true);
  assert.equal(applyCheck({ ...s, references: 4 }, 'references', true).references, 4);
  assert.equal(applyCheck({ ...s, references: 0 }, 'references', true).references, 1);
  assert.equal(applyCheck({ ...s, corroboration: 3 }, 'corroboration', false).corroboration, 0);
});
test('APA and MLA citations', () => {
  const src = { title: 'How urban trees reduce neighborhood heat', author: 'Sample Research Team', publisher: 'Example University', date: '2025-04-12', url: 'https://example.edu/urban-tree-study', claim: 'x' };
  assert.equal(formatCitation(src, 'apa'), 'Sample Research Team. (2025, April 12). How urban trees reduce neighborhood heat. Example University. https://example.edu/urban-tree-study');
  assert.equal(formatCitation(src, 'mla', '2026-11-07'), 'Sample Research Team. "How urban trees reduce neighborhood heat." Example University, 12 Apr. 2025, example.edu/urban-tree-study. Accessed 7 Nov. 2026.');
  assert.match(formatCitation({ title: 'no date page', claim: 'x' }, 'apa'), /^No date page\. \(n\.d\.\)\./);
});
test('claim map groups by claim and prompts for challenging evidence', () => {
  const map = claimMap([
    { title: 'A', claim: 'Trees cool cities.', stance: 'supports' },
    { title: 'B', claim: 'trees cool cities', stance: 'challenges', author: 'x', date: '2024-01-01', url: 'https://a.org', method: true },
    { title: 'C', claim: 'Bikes reduce traffic', stance: 'supports' },
  ]);
  assert.equal(map.length, 2);
  assert.equal(map[0].sources.length, 2);
  assert.equal(map[0].supports, 1); assert.equal(map[0].challenges, 1);
  assert.ok(map[1].prompts.some((p) => /independent second source/.test(p)));
  assert.ok(map[1].prompts.some((p) => /challenging source/.test(p)));
});
test('stance and notes are normalized', () => {
  assert.equal(normalizeSource({ stance: 'evil' }).stance, 'supports');
  assert.equal(normalizeSource({ stance: 'challenges' }).stance, 'challenges');
  assert.equal(normalizeSource({ notes: 'n'.repeat(3000) }).notes.length, 2000);
  assert.equal(assessSource({}).total, 8);
});
test('library import validates, normalizes, and de-duplicates ids', () => {
  let n = 0;
  const r = parseLibrary(JSON.stringify([{ id: 'a', title: 'T1', claim: 'C1', url: 'javascript:x' }, { id: 'a', title: 'T2', claim: 'C2' }, { title: 'no claim' }, 5]), ['b'], () => `gen-${++n}`);
  assert.equal(r.error, '');
  assert.equal(r.sources.length, 2);
  assert.deepEqual(r.sources.map((s) => s.id), ['a', 'gen-1']);
  assert.equal(r.sources[0].url, '');
  assert.match(parseLibrary('{oops').error, /not valid JSON/);
  assert.match(parseLibrary('{"x":1}').error, /Expected/);
  assert.equal(parseLibrary(JSON.stringify({ sources: [{ title: 'T', claim: 'C' }] })).sources.length, 1);
});
