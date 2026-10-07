// Teardown API: POST /api/teardown { image: base64 jpeg/png/webp } -> { result, usage, attempts, ms }
import http from 'node:http';
import { analyzeImage } from './bedrock.mjs';

const PORT = Number(process.env.PORT || 8303);
const MAX_BYTES = 8 * 1024 * 1024;

function send(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BYTES) { reject(Object.assign(new Error('Image too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true, model: process.env.BEDROCK_CLAUDE_MODEL || null, key: !!process.env.AWS_BEARER_TOKEN_BEDROCK });
  if (req.method === 'POST' && req.url === '/api/teardown') {
    const t0 = Date.now();
    try {
      const { image, format } = JSON.parse(await readBody(req));
      if (typeof image !== 'string' || image.length < 100) return send(res, 400, { error: 'Send { image: base64 }' });
      const fmt = ['jpeg', 'png', 'webp'].includes(format) ? format : 'jpeg';
      const out = await analyzeImage(image.replace(/^data:image\/\w+;base64,/, ''), fmt);
      const ms = Date.now() - t0;
      console.log(`[teardown] ${out.result.object} | parts ${out.result.parts.length} | in ${out.usage.inputTokens} out ${out.usage.outputTokens} tok | $${out.usage.costUsd} | ${ms} ms | attempts ${out.attempts}`);
      return send(res, 200, { ...out, ms });
    } catch (e) {
      console.error('[teardown] error', e.message);
      return send(res, e.status || 500, { error: e.message });
    }
  }
  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => console.log(`Teardown API on http://localhost:${PORT}`));
