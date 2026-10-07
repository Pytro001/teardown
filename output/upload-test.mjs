// End to end check of the live path: upload a file through the real file input and wait for the result.
import { chromium } from '/Users/pytro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const [file, name] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto('http://localhost:5303/', { waitUntil: 'networkidle' });
await page.setInputFiles('.dropzone input[type=file]', file);
await page.waitForTimeout(1200);
await page.screenshot({ path: `output/check/up-${name}-scan.jpg`, quality: 80 });
await page.waitForSelector('.panel-foot, .photo-msg', { timeout: 90000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: `output/check/up-${name}.jpg`, quality: 80 });
console.log(name, 'msg:', await page.locator('.photo-msg').textContent().catch(() => null), '| foot:', await page.locator('.panel-foot').textContent().catch(() => null));
await browser.close();
