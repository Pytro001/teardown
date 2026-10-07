// Deterministic screen film for Teardown.
// Usage: npm run dev (in another terminal), then: node output/record.mjs [--stills-only]
// Frames are stepped through window.__film (the app clock), captured as JPEG and piped into ffmpeg.
// Example results are the cached real model outputs in web/public/samples; no model call happens while filming.
import { chromium } from '/Users/pytro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const W = 1920, H = 1080, FPS = 30;
const URL_APP = process.env.FILM_URL || 'http://localhost:5303/?film=1';
const STILLS_ONLY = process.argv.includes('--stills-only');
const OUT = 'output/teardown-screen.mp4';
mkdirSync('output/stills', { recursive: true });

// ---------- docs view (the repo shot) ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function md(src) {
  const body = src.replace(/^---[\s\S]*?---\n/, '').replace(/<!--[\s\S]*?-->/g, '');
  const out = []; let list = false, code = false;
  for (const raw of body.split('\n')) {
    const line = raw.trimEnd();
    if (line.startsWith('```')) { if (list) { out.push('</ul>'); list = false; } out.push(code ? '</pre>' : '<pre>'); code = !code; continue; }
    if (code) { out.push(esc(line)); continue; }
    const inline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    const m = line.match(/^(#{1,3}) (.*)/);
    if (m) { if (list) { out.push('</ul>'); list = false; } out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    const li = line.match(/^\s*(?:- \[[ x]\] |- |\d+\. )(.*)/);
    if (li) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(li[1])}</li>`); continue; }
    if (list) { out.push('</ul>'); list = false; }
    if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  return out.join('\n');
}
const DOCS = ['scope.md', 'prd.md', 'spec.md'].map((f) => ({ f, html: md(readFileSync(f, 'utf8')), status: (readFileSync(f, 'utf8').match(/status: (\w+)/) || [])[1] }));
const TREE = ['.claude/skills/', '  1-start', '  2-scope', '  3-prd', '  4-spec', '  5-build', '  6-ship', 'devpost/', 'server/', 'web/', 'scope.md', 'prd.md', 'spec.md', 'README.md', 'LICENSE'];
const docsHtml = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;width:${W}px;height:${H}px;background:radial-gradient(1200px 700px at 40% 20%,#15171c 0%,#07080a 70%);color:#f2f2ee;font-family:'Inter Tight',sans-serif;overflow:hidden}
.wrap{position:absolute;inset:60px 80px 150px;display:grid;grid-template-columns:360px 1fr;gap:28px}
.tree{background:#0e1013;border:1px solid #ffffff14;border-radius:22px;padding:26px 22px;font-family:'JetBrains Mono',monospace;font-size:17px;line-height:2}
.tree .repo{font-family:'Inter Tight';font-weight:600;font-size:22px;margin-bottom:10px}
.tree div{color:#8b8f97;white-space:pre}.tree .tdoc{color:#f2f2ee}.tree .tdoc.on{color:#0b0c0e;background:#ffb547;border-radius:6px;margin:0 -8px;padding:0 8px}
.tree .skill{color:#c9b38a}
.view{background:#0e1013;border:1px solid #ffffff14;border-radius:22px;overflow:hidden;display:flex;flex-direction:column}
.tabs{display:flex;gap:6px;padding:16px 18px;border-bottom:1px solid #ffffff14}
.tab{font-family:'JetBrains Mono',monospace;font-size:17px;padding:8px 16px;border-radius:10px;color:#8b8f97}
.tab.on{background:#ffffff12;color:#f2f2ee}.tab .st{font-size:12px;margin-left:10px;color:#7ee2a8}
.page{position:relative;flex:1;overflow:hidden}
.doc{position:absolute;inset:0;padding:30px 48px;opacity:0}
.doc h1{font-size:40px;letter-spacing:-.03em;margin:0 0 14px}.doc h2{font-size:26px;margin:30px 0 8px;letter-spacing:-.02em}.doc h3{font-size:20px;margin:22px 0 6px;color:#ffb547}
.doc p,.doc li{font-size:19px;line-height:1.55;color:#cfd0cc;margin:6px 0}.doc ul{padding-left:24px;margin:6px 0}
.doc code{font-family:'JetBrains Mono',monospace;font-size:16px;color:#ffb547}.doc pre{font-family:'JetBrains Mono',monospace;font-size:15px;color:#8b8f97;background:#0a0b0d;border-radius:12px;padding:14px 18px}
.caption{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);padding:14px 28px;border-radius:16px;background:rgba(7,8,10,.86);border:1px solid #ffffff24;font-size:32px;font-weight:600;letter-spacing:-.02em;white-space:nowrap}
</style></head><body>
<div class="wrap"><div class="tree"><div class="repo">teardown</div>${TREE.map((t) => `<div class="${t.endsWith('.md') && !t.startsWith('README') ? 'tdoc' : t.startsWith('  ') ? 'skill' : ''}" data-f="${t}">${t}</div>`).join('')}</div>
<div class="view"><div class="tabs">${DOCS.map((d) => `<div class="tab" data-f="${d.f}">${d.f}<span class="st">${d.status}</span></div>`).join('')}</div>
<div class="page">${DOCS.map((d) => `<article class="doc" data-f="${d.f}">${d.html}</article>`).join('')}</div></div></div>
<div class="caption" id="cap" style="opacity:0"></div>
<script>
window.__docs=(f,scroll,fade,cap,capA)=>{for(const e of document.querySelectorAll('[data-f]')){const on=e.dataset.f===f;e.classList.toggle('on',on);if(e.tagName==='ARTICLE'){e.style.opacity=on?fade:0;e.style.transform='translateY('+(-scroll)+'px)'}}
const c=document.getElementById('cap');c.textContent=cap||'';c.style.opacity=cap?capA:0;}
</script></body></html>`;

// ---------- helpers ----------
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, t) => a + (b - a) * t;
const centre = (r) => r && { x: r.x + r.w / 2, y: r.y + r.h / 2 };

const browser = await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const app = await ctx.newPage();
const docs = await ctx.newPage();
app.on('pageerror', (e) => console.log('pageerror', e.message));
await app.goto(URL_APP, { waitUntil: 'networkidle' });
await app.waitForFunction(() => window.__film?.ready);
await app.evaluate(() => document.fonts.ready);
await docs.setContent(docsHtml, { waitUntil: 'networkidle' });
const F = (fn, ...args) => app.evaluate(fn, ...args);

// ---------- the shot list (seconds) ----------
let page = app;
let cur = { x: 1500, y: 1000, show: false, down: false, downAt: -1 };
let carrying = null;
const moves = [];   // { t0, t1, to: async () => {x,y}, from? }
const scrolls = []; // { t0, t1, to: async () => y }
const events = [];  // { t, fn }
const at = (t, fn) => events.push({ t, fn });
const moveTo = (t0, t1, to) => moves.push({ t0, t1, to });
const scrollTo = (t0, t1, to) => scrolls.push({ t0, t1, to });
const tap = (t) => { at(t, () => { cur.down = true; cur.downAt = t; }); at(t + 0.25, () => { cur.down = false; }); };
const cap = (t, text) => at(t, () => F((s) => window.__film.caption(s), text));
const capOff = (t) => at(t, () => F(() => window.__film.caption(null)));
const select = (t, i) => at(t, () => F((k) => window.__film.select(k), i));
const load = (t, id, scanMs) => at(t, () => F(([a, b]) => window.__film.load(a, b), [id, scanMs]));
const dot = (i) => async () => centre(await F((k) => window.__film.dotRect(k), i));
const el = (sel) => async () => centre(await F((s) => window.__film.rect(s), sel));

// 0:00 hero
cap(0.6, 'Snap any object');
at(2.0, () => { cur.show = true; carrying = 'headphones'; });
moveTo(2.0, 4.8, async () => ({ x: 960, y: 470 }));
at(4.0, () => F(() => window.__film.over(true)));
at(5.2, () => { carrying = null; cur.show = false; });
at(5.2, () => F(() => window.__film.over(false)));
load(5.2, 'headphones', 2700);
cap(5.4, 'One photo in');
cap(8.2, 'Every part, called out on your photo');
// 0:14 tap the driver
at(13.4, () => { cur.show = true; cur.x = 1500; cur.y = 960; });
moveTo(13.4, 15.2, dot(4));
tap(15.5); select(15.5, 4);
cap(15.6, 'Tap a part: material, process, confidence');
moveTo(24.0, 25.2, dot(0));
tap(25.5); select(25.5, 0);
moveTo(30.5, 31.8, async () => centre(await F(() => window.__film.rect('.parts li:nth-child(7) .part-row'))));
tap(32.0); select(32.0, 6);
cap(32.1, 'Honest about uncertainty');
at(37.0, () => { cur.show = false; });
// 0:37 how it is made
scrollTo(37.2, 39.8, async () => F(() => document.documentElement.scrollHeight - innerHeight));
cap(39.0, 'How it is made: raw material to desk');
scrollTo(50.0, 51.8, async () => 0);
capOff(50.0);
// 0:52 speed run
at(51.6, () => { cur.show = true; cur.x = 1300; cur.y = 300; });
moveTo(51.6, 52.9, el('[data-sample=kettle]'));
tap(53.2); load(53.2, 'kettle', 1500); select(53.2, null);
cap(53.4, 'Any object');
moveTo(56.6, 58.4, dot(5));
tap(58.7); select(58.7, 5);
moveTo(62.0, 63.2, el('[data-sample=drill]'));
tap(63.5); load(63.5, 'drill', 1100); select(63.5, null);
moveTo(66.6, 68.4, dot(2));
tap(68.7); select(68.7, 2);
moveTo(71.5, 72.5, el('[data-sample=pedal]'));
tap(72.8); load(72.8, 'pedal', 900); select(72.8, null);
at(73.5, () => { cur.show = false; });
capOff(78.2);
// 1:19 the plan, in the repo
at(79.0, () => { page = docs; });
// 1:41 close
at(101.0, async () => { page = app; await F(() => { window.__film.select(null); window.__film.scrollTo(0); }); });
load(101.0, 'headphones', 300);
cap(105.0, 'Teardown. See how anything is made.');
const END = 112.0;

// docs timeline: tab switches with a slow scroll each
const docsAt = (t) => {
  const segs = [['scope.md', 79.0, 86.5], ['prd.md', 86.5, 93.5], ['spec.md', 93.5, 101.0]];
  const s = segs.find(([, a, b]) => t >= a && t < b) || segs[2];
  const local = (t - s[1]) / (s[2] - s[1]);
  const capText = t < 90 ? 'Planned first: scope, PRD and spec' : 'Written with the Devpost Learn skill pack';
  const capStart = t < 90 ? 79.6 : 90.0;
  return [s[0], ease((local - 0.2) * 1.3) * 520, Math.min(1, (t - s[1]) / 0.4), capText, Math.min(1, Math.max(0, (t - capStart) / 0.35))];
};

const STILLS = { 'teardown-01-hero.jpg': 1.5, 'teardown-02-scan.jpg': 6.6, 'teardown-03-callouts.jpg': 12.5, 'teardown-04-card.jpg': 21.0, 'teardown-05-journey.jpg': 46.0, 'teardown-06-kettle.jpg': 61.0, 'teardown-07-plan.jpg': 84.0, 'teardown-08-close.jpg': 109.0 };

// ---------- render loop ----------
const ff = STILLS_ONLY ? null : spawn('/opt/homebrew/bin/ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
events.sort((a, b) => a.t - b.t);
const total = Math.round(END * FPS);
const resolved = new Map();
let ei = 0;
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  const t = f / FPS;
  while (ei < events.length && events[ei].t <= t) await events[ei++].fn();
  // cursor moves
  for (const m of moves) {
    if (t < m.t0 || t > m.t1 + 1 / FPS) continue;
    if (!resolved.has(m)) resolved.set(m, { from: { x: cur.x, y: cur.y }, to: await m.to() });
    const r = resolved.get(m); if (!r.to) continue;
    const k = ease((t - m.t0) / (m.t1 - m.t0));
    cur.x = lerp(r.from.x, r.to.x, k); cur.y = lerp(r.from.y, r.to.y, k);
  }
  for (const s of scrolls) {
    if (t < s.t0 || t > s.t1 + 1 / FPS) continue;
    if (!resolved.has(s)) resolved.set(s, { from: await F(() => scrollY), to: await s.to() });
    const r = resolved.get(s);
    await F((y) => window.__film.scrollTo(y), lerp(r.from, r.to, ease((t - s.t0) / (s.t1 - s.t0))));
  }
  const ms = t * 1000;
  if (page === app) {
    await F(([ms, c, carry]) => {
      window.__film.setTime(ms);
      window.__film.cursor(c.show ? c.x : null, c.y, c.down);
      window.__film.drag(carry ? c.x : null, c.y, carry || '');
    }, [ms, cur, carrying]);
    await app.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  } else {
    await docs.evaluate((a) => window.__docs(...a), docsAt(t));
  }
  const still = Object.entries(STILLS).find(([, st]) => Math.round(st * FPS) === f);
  if (STILLS_ONLY && !still) continue;
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (still) writeFileSync(`output/stills/${still[0]}`, await page.screenshot({ type: 'jpeg', quality: 85 }));
  if (ff) ff.stdin.write(buf);
  if (f % 150 === 0) console.log(`frame ${f}/${total} t=${t.toFixed(1)}s ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
}
if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); console.log('wrote', OUT); }
await browser.close();
