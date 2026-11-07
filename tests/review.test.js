import test from 'node:test';import assert from 'node:assert/strict';import {coachNotes} from '../server/review.js';
test('empty source is treated as early research',()=>{const r=coachNotes({});assert.match(r.headline,/0\/8/);assert.equal(r.mode,'local');});
test('complete checklist produces a cautious note',()=>{const r=coachNotes({author:'A',date:'2025-01-01',method:true,references:3,corroboration:2,bias:true,claim:'A claim',url:'https://example.com'});assert.match(r.headline,/8\/8/);assert.match(r.disclaimer,/not a fact-check/);});
test('partial checklist lists actionable gaps',()=>{const r=coachNotes({author:'A',claim:'Claim'});assert.ok(r.notes.length>0);assert.ok(r.notes.length<=5);});
import {normalizeSource,safeHttpUrl,assessSource} from '../server/review.js';
test('unsafe and malformed URLs are not treated as usable source links',()=>{
 assert.equal(safeHttpUrl('javascript:alert(1)'),'');
 assert.equal(safeHttpUrl('not a url'),'');
 assert.match(safeHttpUrl('https://example.org/path'),/^https:\/\//);
});
test('source fields are normalized and bounded',()=>{
 const s=normalizeSource({title:'x'.repeat(300),claim:'y'.repeat(2000),references:999,corroboration:-2,method:'yes',bias:true,date:'yesterday'});
 assert.equal(s.title.length,180);assert.equal(s.claim.length,1000);assert.equal(s.references,99);assert.equal(s.corroboration,0);assert.equal(s.method,false);assert.equal(s.bias,true);assert.equal(s.date,'');
});
test('unsafe URL does not pass the URL checklist',()=>{
 const result=assessSource({title:'Example',claim:'A specific claim',url:'javascript:alert(1)'});
 assert.equal(result.checks.find(x=>x.id==='url').ok,false);
});
