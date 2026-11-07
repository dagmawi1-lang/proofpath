import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Exercises the optional AI path against a local mock of an OpenAI-compatible provider (no real key or network needed).
function mockProvider(mode) {
  const calls = [];
  const server = http.createServer((req, res) => {
    let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
      calls.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      if (mode === 'error') { res.writeHead(500); return res.end('{}'); }
      const content = mode === 'garbage' ? 'not json' : JSON.stringify({ headline: 'H'.repeat(400), notes: ['n1', 42, 'n2', 'n3', 'n4', 'n5', 'n6'], disclaimer: 'Process coach only.' });
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ choices: [{ message: { content } }] }));
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, calls, port: server.address().port })));
}
async function startApi(port, providerPort) {
  const child = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(port), AI_API_KEY: 'test-key', AI_BASE_URL: `http://127.0.0.1:${providerPort}/v1/`, AI_MODEL: 'mock-model' }, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(`http://127.0.0.1:${port}/x`); return child; } catch { await delay(100); } }
  throw new Error('API did not start');
}
const ask = (port) => fetch(`http://127.0.0.1:${port}/api/coach`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: { title: 'T', claim: 'C', url: 'javascript:alert(1)' } }) }).then((r) => r.json());

test('AI provider success: output is bounded and request is well formed', async (t) => {
  const p = await mockProvider('ok'); const api = await startApi(8791, p.port);
  t.after(() => { api.kill(); p.server.close(); });
  const r = await ask(8791);
  assert.equal(r.mode, 'ai');
  assert.equal(r.headline.length, 180);
  assert.deepEqual(r.notes, ['n1', 'n2', 'n3', 'n4', 'n5']);
  assert.equal(p.calls[0].url, '/v1/chat/completions');
  assert.equal(p.calls[0].auth, 'Bearer test-key');
  assert.equal(p.calls[0].body.model, 'mock-model');
  assert.equal(JSON.parse(p.calls[0].body.messages[1].content).url, '', 'unsafe URL must not be forwarded');
});
for (const mode of ['garbage', 'error']) {
  test(`AI provider ${mode}: falls back to local checklist`, async (t) => {
    const p = await mockProvider(mode); const port = mode === 'error' ? 8792 : 8793; const api = await startApi(port, p.port);
    t.after(() => { api.kill(); p.server.close(); });
    const r = await ask(port);
    assert.equal(r.mode, 'local');
    assert.match(r.providerNote, /AI service unavailable/);
  });
}
