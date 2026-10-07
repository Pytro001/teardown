// Generates the five sample product photos. These are AI generated images, used only as examples.
// Provider order: Together FLUX.1 schnell (TOGETHER_API_KEY), then Azure AI Foundry gpt-image-2
// (FOUNDRY_ENDPOINT + FOUNDRY_API_KEY). Set IMAGE_PROVIDER=together|foundry to force one.
import { writeFile } from 'node:fs/promises';
import { SAMPLES } from './samples.mjs';

const only = process.argv.slice(2);
const forced = process.env.IMAGE_PROVIDER;

async function together(prompt) {
  const res = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.FLUX_MODEL || 'black-forest-labs/FLUX.1-schnell', prompt, width: 1344, height: 896, steps: 4, n: 1, seed: 7, response_format: 'b64_json' })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`together ${res.status} ${json.error?.message || ''}`);
  return Buffer.from(json.data[0].b64_json, 'base64');
}

async function foundry(prompt) {
  const dep = process.env.FOUNDRY_IMAGE_DEPLOYMENT || 'gpt-image-2';
  const url = `${process.env.FOUNDRY_ENDPOINT}/openai/deployments/${dep}/images/generations?api-version=2025-04-01-preview`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': process.env.FOUNDRY_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, n: 1, size: '1536x1024', quality: 'medium', output_format: 'jpeg' }),
    signal: AbortSignal.timeout(240_000)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`foundry ${res.status} ${json.error?.message || ''}`);
  return Buffer.from(json.data[0].b64_json, 'base64');
}

const providers = [];
if ((!forced || forced === 'together') && process.env.TOGETHER_API_KEY) providers.push(['together', together]);
if ((!forced || forced === 'foundry') && process.env.FOUNDRY_API_KEY && process.env.FOUNDRY_ENDPOINT) providers.push(['foundry', foundry]);
if (!providers.length) { console.error('No image provider key set'); process.exit(1); }

await Promise.all(SAMPLES.filter((s) => !only.length || only.includes(s.id)).map(async (s) => {
  for (const [name, fn] of providers) {
    try {
      const buf = await fn(s.prompt);
      await writeFile(`web/public/samples/${s.id}.src.jpg`, buf);
      console.log('saved', s.id, 'via', name, buf.length, 'bytes');
      return;
    } catch (e) { console.error(s.id, e.message); }
  }
}));
