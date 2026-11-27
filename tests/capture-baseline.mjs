// Captures a baseline reference screenshot of the initial view.
// Usage: node tests/capture-baseline.mjs [outputPath]
// Requires the dev server on http://localhost:3000.
import { chromium } from '@playwright/test';
import path from 'node:path';

const output = process.argv[2] ?? 'docs/baseline/initial-view.png';
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:3000');
await page.click('#play-pause-btn');
await page.waitForTimeout(10_000); // let civilizations emerge and waves propagate
await page.screenshot({ path: output });
console.log('Saved', path.resolve(output));
await browser.close();
