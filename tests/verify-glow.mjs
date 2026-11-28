// Verification for issue #2: galaxy glow sprite fallback.
// Captures two screenshots: default view (sprite should be hidden) and
// zoomed-out view (sprite should be visible alongside the stars).
// Usage: node tests/verify-glow.mjs
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:3000');
await page.click('#play-pause-btn');
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-results/glow-default.png' });

// Zoom far out: wheel up (negative dy) scrolls out with OrbitControls
const canvas = page.locator('#canvas');
await canvas.hover();
await page.mouse.wheel(0, 3000);
await page.mouse.wheel(0, 4000);
await page.waitForTimeout(1500);
await page.screenshot({ path: 'test-results/glow-zoomed-out.png' });

// Sanity: read the pixel stats to confirm sim still runs
const stats = await page.evaluate(() => ({
  stars: document.getElementById('star-count')?.textContent,
  active: document.getElementById('active-stars')?.textContent,
}));
console.log('Stats:', JSON.stringify(stats));
await browser.close();
