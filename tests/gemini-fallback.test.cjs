const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Exercise the production Gemini model selection and Flash -> Flash-Lite fallback with a fake fetch.
const source = fs.readFileSync(path.join(__dirname, '../local-ai.js'), 'utf8');
const pick = (from, to) => source.slice(source.indexOf(from), source.indexOf(to));
const code = pick('  async function readLines(', '  async function streamOllama(') + pick('  // 키로 쓸 수 있는 모델 중', '  async function sendPrompt(');
const sse = text => `data: {"candidates":[{"content":{"parts":[{"text":"${text}"}]}}]}\n\n`;
const list = names => new Response(JSON.stringify({ models: names.map(n => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) }));
const available = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.8-pro', 'gemini-4.0-flash-preview'];
const messages = [{ role: 'system', content: 'S' }, { role: 'user', content: 'Q' }];

function load(handler) {
  const calls = [];
  const context = vm.createContext({
    TextDecoder, JSON, encodeURIComponent, Response, Date,
    geminiKey: () => 'K', modelName: () => 'gemma3:4b', setStatus: () => {},
    geminiFallbackModels: ['gemini-3.8-flash', 'gemini-3.8-flash-lite'], geminiModels: [], geminiBlockedUntil: {},
    fetch: async url => { calls.push(url); return handler(url); }
  });
  vm.runInContext(`${code}; this.streamGemini = streamGemini; this.resolveGeminiModels = resolveGeminiModels;`, context);
  return { context, calls };
}

(async () => {
  let t = load(() => list(available));
  assert.deepEqual([...await t.context.resolveGeminiModels()], ['gemini-3.8-flash', 'gemini-3.8-flash-lite']);

  t = load(url => url.includes('/models?') ? list(available) : new Response(sse('A')));
  let result = await t.context.streamGemini(messages, 0.3, () => {});
  assert.equal(result.model, 'gemini-3.8-flash');

  t = load(url => url.includes('/models?') ? list(available) : url.includes('flash-lite') ? new Response(sse('B')) : new Response('{}', { status: 429 }));
  result = await t.context.streamGemini(messages, 0.3, () => {});
  assert.equal(result.model, 'gemini-3.8-flash-lite');
  const flashCalls = () => t.calls.filter(url => /flash:stream/.test(url)).length;
  const before = flashCalls();
  await t.context.streamGemini(messages, 0.3, () => {});
  assert.equal(flashCalls(), before, 'Flash is skipped for 10 minutes after a 429');

  t = load(url => url.includes('/models?') ? list(available) : new Response('{}', { status: 429 }));
  await assert.rejects(t.context.streamGemini(messages, 0.3, () => {}), /Flash-Lite 무료 사용량 한도/);
  console.log('PASS: newest Flash/Flash-Lite picked, Flash quota falls back to Lite, both exhausted reports quota');
})().catch(error => { console.error(error); process.exit(1); });
