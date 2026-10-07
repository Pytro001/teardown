// Quick screenshot helper for checking layout: node output/shot.mjs <name> <url> [js to run before shot] [waitMs]
import { chromium } from '/Users/pytro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const [name, url, js, wait] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
if (js) await page.evaluate(js);
await page.waitForTimeout(Number(wait || 500));
await page.screenshot({ path: `output/check/${name}.jpg`, quality: 80, fullPage: name.includes('full') });
await browser.close();
