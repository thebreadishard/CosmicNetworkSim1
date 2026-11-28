// Verification for issue #12: saved settings must apply on Reset.
// Scenario: set activationChance=0.002 (default 0.0005) and
// galaxyGlowPixelThreshold=0 in the modal, Save, Reset ->
// civilizations activate much faster, and zoomed out shows no glow sprite.
// Usage: node tests/verify-settings.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('dialog', d => d.accept());
await page.goto('http://localhost:3000');
await page.waitForTimeout(1000);

// Open settings modal, change two settings, save
await page.click('#settings-btn');
await page.fill('#set-activationChance', '0.002');
await page.fill('#set-galaxyGlowPixelThreshold', '0');
await page.click('#settings-save-btn');
await page.waitForTimeout(500);

// Reset: saved settings must now be the source
await page.click('#reset-btn');
await page.waitForTimeout(1000);
await page.click('#play-pause-btn');
await page.waitForTimeout(5000);
const active = await page.locator('#active-stars').textContent();
console.log('Active civs after 5s with activationChance=0.002 (expect hundreds):', active);

// Zoom far out; with threshold 0 no glow sprite may appear
const canvas = page.locator('#canvas');
await canvas.hover();
await page.mouse.wheel(0, 3000);
await page.mouse.wheel(0, 4000);
await page.waitForTimeout(1500);
await page.click('#play-pause-btn');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/settings-threshold0-zoomed-out.png' });
console.log('Saved test-results/settings-threshold0-zoomed-out.png');
await browser.close();
