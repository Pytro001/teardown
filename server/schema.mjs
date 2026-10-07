// The shape Teardown asks the model for, and the rules the answer must pass.

export const PROCESSES = [
  'injection moulding', 'overmoulding', 'blow moulding', 'thermoforming', 'compression moulding',
  'stamping', 'deep drawing', 'die casting', 'sand casting', 'investment casting', 'forging',
  'extrusion', 'machining', 'cnc milling', 'turning', 'sheet metal forming', 'welding',
  'pcb assembly', 'wire drawing', 'winding', 'sewing', 'weaving', 'knitting', 'foam moulding',
  'glass forming', 'powder coating', 'anodising', 'electroplating', 'sintering',
  'heat treatment', 'laser cutting', 'printing', 'assembly', 'other'
];

export const TOOL_NAME = 'report_teardown';

export const teardownSchema = {
  type: 'object',
  required: ['object', 'summary', 'parts', 'journey'],
  properties: {
    object: { type: 'string', description: 'Short common name of the main object, for example "Over-ear headphones". Use "none" if there is no single physical product in the photo.' },
    summary: { type: 'string', description: 'One sentence, under 20 words, about what this object is mostly made of.' },
    parts: {
      type: 'array',
      minItems: 0,
      maxItems: 10,
      description: '4 to 10 main parts that are visible or clearly located in the photo. Empty only if object is "none".',
      items: {
        type: 'object',
        required: ['name', 'box', 'material', 'process', 'process_detail', 'confidence', 'fun_fact'],
        properties: {
          name: { type: 'string', description: 'Part name, 1 to 3 words, for example "Ear cushion".' },
          box: {
            type: 'object',
            description: 'Approximate bounding box of the part in the photo, normalised 0 to 1, origin top-left. For hidden internal parts, the box of where they sit inside the object.',
            required: ['x', 'y', 'w', 'h'],
            properties: {
              x: { type: 'number', description: 'left edge, 0 to 1' },
              y: { type: 'number', description: 'top edge, 0 to 1' },
              w: { type: 'number', description: 'width, 0 to 1' },
              h: { type: 'number', description: 'height, 0 to 1' }
            }
          },
          internal: { type: 'boolean', description: 'true if the part is hidden inside and its location is inferred.' },
          material: { type: 'string', description: 'Most likely material, specific, for example "ABS plastic", "Neodymium magnet (NdFeB)", "6061 aluminium".' },
          process: { type: 'string', enum: PROCESSES, description: 'Main manufacturing process.' },
          process_detail: { type: 'string', description: 'One short sentence on how this part is made, under 18 words.' },
          confidence: { type: 'number', description: 'How sure you are about the material and process, 0 to 1. Be honest; use under 0.6 for guesses.' },
          fun_fact: { type: 'string', description: 'One surprising, true fact about this part or how it is made, under 25 words.' }
        }
      }
    },
    journey: {
      type: 'array',
      minItems: 0,
      maxItems: 6,
      description: '4 to 6 steps from raw material to the buyer\'s desk. Empty only if object is "none".',
      items: {
        type: 'object',
        required: ['stage', 'title', 'detail'],
        properties: {
          stage: { type: 'string', enum: ['raw material', 'refining', 'parts', 'assembly', 'testing', 'shipping', 'desk'] },
          title: { type: 'string', description: '2 to 4 words.' },
          detail: { type: 'string', description: 'One sentence, under 20 words.' }
        }
      }
    }
  }
};

const str = (v) => typeof v === 'string' && v.trim().length > 0;
const clamp01 = (n) => Math.min(1, Math.max(0, n));

/** Returns { value, errors }. value is a cleaned copy (boxes clamped, process lower-cased). */
export function validateTeardown(input) {
  const errors = [];
  if (!input || typeof input !== 'object') return { value: null, errors: ['answer is not an object'] };
  const out = { object: input.object, summary: input.summary, parts: [], journey: [] };
  if (!str(input.object)) errors.push('object must be a non-empty string');
  if (!str(input.summary)) errors.push('summary must be a non-empty string');
  const none = str(input.object) && input.object.trim().toLowerCase() === 'none';
  const parts = Array.isArray(input.parts) ? input.parts : null;
  const journey = Array.isArray(input.journey) ? input.journey : null;
  if (!parts) errors.push('parts must be an array');
  if (!journey) errors.push('journey must be an array');
  if (none) return { value: { object: 'none', summary: out.summary || 'No single object found.', parts: [], journey: [] }, errors: [] };
  if (parts && (parts.length < 4 || parts.length > 10)) errors.push(`parts must have 4 to 10 items, got ${parts.length}`);
  if (journey && (journey.length < 4 || journey.length > 6)) errors.push(`journey must have 4 to 6 steps, got ${journey.length}`);

  (parts || []).forEach((p, i) => {
    const at = `parts[${i}]`;
    if (!p || typeof p !== 'object') { errors.push(`${at} is not an object`); return; }
    for (const k of ['name', 'material', 'process_detail', 'fun_fact']) if (!str(p[k])) errors.push(`${at}.${k} must be a non-empty string`);
    const proc = typeof p.process === 'string' ? p.process.trim().toLowerCase() : '';
    if (!PROCESSES.includes(proc)) errors.push(`${at}.process "${p.process}" is not one of the allowed processes`);
    if (typeof p.confidence !== 'number' || !(p.confidence >= 0 && p.confidence <= 1)) errors.push(`${at}.confidence must be a number from 0 to 1`);
    const b = p.box;
    if (!b || ['x', 'y', 'w', 'h'].some((k) => typeof b[k] !== 'number' || Number.isNaN(b[k]))) {
      errors.push(`${at}.box must have numeric x, y, w, h`);
    } else if (b.x > 1.05 || b.y > 1.05 || b.w > 1.05 || b.h > 1.05 || b.x < -0.05 || b.y < -0.05 || b.w <= 0 || b.h <= 0) {
      errors.push(`${at}.box must be normalised to 0..1 with positive width and height`);
    }
    if (errors.length) return;
    const x = clamp01(b.x), y = clamp01(b.y);
    out.parts.push({
      name: p.name.trim(), material: p.material.trim(), process: proc, process_detail: p.process_detail.trim(),
      fun_fact: p.fun_fact.trim(), confidence: Math.round(p.confidence * 100) / 100, internal: !!p.internal,
      box: { x, y, w: Math.min(clamp01(b.w), 1 - x), h: Math.min(clamp01(b.h), 1 - y) }
    });
  });

  (journey || []).forEach((s, i) => {
    if (!s || !str(s.title) || !str(s.detail) || !str(s.stage)) { errors.push(`journey[${i}] needs stage, title and detail`); return; }
    out.journey.push({ stage: s.stage.trim(), title: s.title.trim(), detail: s.detail.trim() });
  });

  return { value: errors.length ? null : out, errors };
}
