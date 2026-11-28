// Verification for issue #12: saved settings must apply on Reset.
// 1. activationChance 0.02 via modal, Save, Reset, start -> active
//    civilizations must explode (default is a few dozen after 5 s).
// 2. galaxyGlowPixelThreshold must persist to localStorage.
// Exits non-zero on failure. Requires the dev server on localhost:3000.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('dialog', d => d.accept());
await page.goto('http://localhost:3000');
await page.waitForTimeout(1000);

let failed = false;
try {
  // Open settings modal, change two settings, save
  await page.click('#settings-btn');
  await page.fill('#set-activationChance', '0.02');
  await page.fill('#set-galaxyGlowPixelThreshold', '0');
  await page.click('#settings-save-btn');
  await page.waitForTimeout(500);

  // Reset: saved settings must now be the source
  await page.click('#reset-btn');
  await page.waitForTimeout(1000);
  await page.click('#play-pause-btn');
  await page.waitForTimeout(5000);

  const active = parseInt(await page.locator('#active-stars').textContent(), 10);
  console.log('Active civs after 5s with activationChance=0.02:', active);
  if (!(active > 500)) {
    throw new Error(`Expected >500 active civilizations with activationChance=0.02 (default 0.0005 gives a few dozen); got ${active}. Saved settings were not applied on Reset.`);
  }

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cosmicNetworkSimSettings') || '{}'));
  if (stored.galaxyGlowPixelThreshold !== 0) {
    throw new Error(`Expected galaxyGlowPixelThreshold=0 in localStorage, got ${JSON.stringify(stored.galaxyGlowPixelThreshold)}`);
  }
  console.log('PASS: saved settings applied on Reset and persisted');
} catch (e) {
  console.error('FAIL:', e.message);
  failed = true;
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
