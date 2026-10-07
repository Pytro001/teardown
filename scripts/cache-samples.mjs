// Runs the real pipeline (Bedrock Claude) on each sample photo and saves the answer next to it,
// so the examples load instantly and the demo film is repeatable.
import { readFile, writeFile } from 'node:fs/promises';
import { analyzeImage } from '../server/bedrock.mjs';
import { SAMPLES } from './samples.mjs';

const only = process.argv.slice(2);
let tin = 0, tout = 0, cost = 0;
for (const s of SAMPLES) {
  if (only.length && !only.includes(s.id)) continue;
  const b64 = (await readFile(`web/public/samples/${s.id}.jpg`)).toString('base64');
  const t0 = Date.now();
  const out = await analyzeImage(b64, 'jpeg');
  const ms = Date.now() - t0;
  const record = {
    sample: s.id,
    model: process.env.BEDROCK_CLAUDE_MODEL,
    generatedAt: new Date().toISOString(),
    note: 'Real model output, cached. Photo is AI generated.',
    usage: out.usage, attempts: out.attempts, ms,
    result: out.result
  };
  await writeFile(`web/public/samples/${s.id}.json`, JSON.stringify(record, null, 2) + '\n');
  tin += out.usage.inputTokens; tout += out.usage.outputTokens; cost += out.usage.costUsd;
  console.log(`${s.id}: ${out.result.object}, ${out.result.parts.length} parts, ${out.usage.inputTokens} in / ${out.usage.outputTokens} out tokens, $${out.usage.costUsd}, ${ms} ms, attempts ${out.attempts}`);
}
console.log(`total ${tin} in / ${tout} out tokens, $${cost.toFixed(4)}`);
