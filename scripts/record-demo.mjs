import { chromium } from '@playwright/test';
import { mkdir, rename } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';

await mkdir('artifacts/raw-video', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader', '--enable-webgl'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1160 }, recordVideo: { dir: 'artifacts/raw-video', size: { width: 1440, height: 1160 } } });
const page = await context.newPage();
await page.goto('http://127.0.0.1:5173');
await page.locator('.town-label').filter({ hasText: 'Your home' }).waitFor();
await page.evaluate(() => {
  const caption = document.createElement('div'); caption.id = 'demo-caption';
  caption.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:1000;background:#294b39f5;color:#fffef5;padding:14px 26px;border-radius:10px;box-shadow:0 4px 24px #23382722;font:500 16px Manrope,sans-serif;text-align:center;width:max-content;max-width:90%;pointer-events:none';
  document.body.appendChild(caption);
});
const started = Date.now();
const caption = text => page.evaluate(text => { document.getElementById('demo-caption').textContent = text; }, text);
const at = async seconds => { const remaining = started + seconds * 1000 - Date.now(); if (remaining > 0) await page.waitForTimeout(remaining); };
const pick = async name => { await page.getByRole('button', { name: new RegExp(name) }).click(); await page.getByRole('button', { name: 'Make this choice' }).click(); };
const next = () => page.getByRole('button', { name: /Continue to|See my year in review/ }).click();
const decision = async name => { await pick(name); await next(); };

await caption('Meet Maya. She’s 19, and money choices are hard to picture.');
await at(4); await pick('Give future you');
await caption('An emergency fund becomes a shield around your home.');
await at(10); await page.screenshot({ path: 'artifacts/life-ledger-shield.png', fullPage: true }); await next();
await pick('Put it on the card'); await caption('Credit keeps cash available. Interest drains future income.');
await at(16); await next(); await pick('A little savings, a little credit');
await caption('A $900 repair. Your shield absorbs $400 of the cost.');
await at(22); await next(); await pick('Back one big idea');
await caption('Invest $900 in one sector. Watch the money find its way.');
await at(28); await next(); await caption('Technology falls 35%. One storm hits a concentrated portfolio hard.');
await at(33); await decision('Give your plan more time');
await page.getByRole('button', { name: 'Try a different story' }).click();
await caption('Replay the same year. Change just one investment decision.');
await decision('Give future you'); await decision('Put it on the card'); await decision('A little savings, a little credit');
await pick('Give your money three homes');
await caption('Three streams. Three sectors. The same $900, spread out.');
await at(46); await next();
await caption('All three sectors fall, but the diversified portfolio falls less in this scenario.');
await at(50); await decision('Give your plan more time');
await page.getByRole('button', { name: 'Compare your paths' }).click();
await caption('Same year. Same market. Two different outcomes.');
await at(55);
// Native dialogs render in the top layer; place the recording caption inside it for the closing shot.
await page.evaluate(() => { const el = document.getElementById('demo-caption'); const dialog = document.querySelector('dialog'); if (dialog && el) { el.style.position = 'static'; el.style.transform = 'none'; el.style.width = '100%'; el.style.maxWidth = 'none'; el.style.marginTop = '20px'; dialog.appendChild(el); } });
await caption('Life Ledger makes the consequences of money decisions visible.');
await at(61);
const video = page.video(); await context.close(); await browser.close();
const source = await video.path();
const encoder = path.join(homedir(), 'Library/Caches/ms-playwright/ffmpeg-1011/ffmpeg-mac');
const output = 'artifacts/life-ledger-demo.webm';
// Trim the initial load and guarantee a one-minute deliverable.
const result = spawnSync(encoder, ['-y', '-sseof', '-60', '-i', source, '-t', '60', '-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-threads', '4', '-b:v', '2200k', output], { encoding: 'utf8' });
if (result.status !== 0) { await rename(source, output); console.warn('Saved untrimmed capture; encoder output:', result.stderr); }
console.log(`Recorded ${output}`);
