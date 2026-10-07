// Small checks for the answer validator. Run: npm test
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { validateTeardown } from '../server/schema.mjs';

const part = (o = {}) => ({ name: 'Cup', box: { x: 0.1, y: 0.2, w: 0.3, h: 0.3 }, material: 'ABS plastic', process: 'injection moulding', process_detail: 'Moulded in two halves.', confidence: 0.8, fun_fact: 'A fact.', ...o });
const step = { stage: 'parts', title: 'Make parts', detail: 'Parts are made.' };
const good = { object: 'Thing', summary: 'Mostly plastic.', parts: [part(), part(), part(), part()], journey: [step, step, step, step] };
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('valid answer passes', () => assert.equal(validateTeardown(good).errors.length, 0));
t('too few parts fails', () => assert.ok(validateTeardown({ ...good, parts: [part()] }).errors.some((e) => e.includes('4 to 10'))));
t('unknown process fails', () => assert.ok(validateTeardown({ ...good, parts: [part({ process: 'magic' }), part(), part(), part()] }).errors.length));
t('confidence out of range fails', () => assert.ok(validateTeardown({ ...good, parts: [part({ confidence: 3 }), part(), part(), part()] }).errors.length));
t('box out of range fails', () => assert.ok(validateTeardown({ ...good, parts: [part({ box: { x: 2, y: 0, w: 0.1, h: 0.1 } }), part(), part(), part()] }).errors.length));
t('box overflow is clamped', () => { const v = validateTeardown({ ...good, parts: [part({ box: { x: 0.9, y: 0.9, w: 0.3, h: 0.3 } }), part(), part(), part()] }).value; assert.ok(Math.abs(v.parts[0].box.w - 0.1) < 1e-9); });
t('process is lower-cased', () => assert.equal(validateTeardown({ ...good, parts: [part({ process: 'Stamping' }), part(), part(), part()] }).value.parts[0].process, 'stamping'));
t('"none" object is allowed with empty lists', () => { const r = validateTeardown({ object: 'none', summary: 'No object.', parts: [], journey: [] }); assert.equal(r.errors.length, 0); assert.equal(r.value.object, 'none'); });
t('short journey fails', () => assert.ok(validateTeardown({ ...good, journey: [step] }).errors.length));

// every cached sample result must pass too
const dir = 'web/public/samples';
for (const f of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(await readFile(`${dir}/${f}`, 'utf8'));
  t(`sample ${f} passes`, () => assert.deepEqual(validateTeardown(data.result).errors, []));
}
console.log(`${n} checks passed`);
