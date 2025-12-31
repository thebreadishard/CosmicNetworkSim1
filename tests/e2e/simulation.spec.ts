import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

// This test assumes the following selectors:
// - Start/Pause: #play-pause-btn
// - Hide Waves: #toggle-waves-btn
// - Hide Supernovae: #toggle-supernovae-btn
// - Stats: #active-stars, #connection-count
// - Canvas: #canvas
// - Stop: #play-pause-btn (toggles to ▶️ Start when stopped)

function parseIntFromSelector(text: string) {
  return parseInt(text.replace(/[^\d]/g, ''), 10);
}

test('galaxy simulation visual flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 1. Always click start to ensure simulation runs
  const playPauseBtn = page.locator('#play-pause-btn');
  await playPauseBtn.click();

  // 2. Klik direct op Hide supernovae
  await page.click('#toggle-supernovae-btn');
  await page.waitForTimeout(500);

  // 3. Zoom nog iets verder uit aan het begin
  const canvas = page.locator('#canvas');
  await canvas.hover();
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(1000);

  // 4. Wacht tot eerste sterren actief zijn
  await page.waitForFunction(() => {
    const el = document.getElementById('active-stars');
    return el && parseInt(el.textContent || '0', 10) > 0;
  }, null, { timeout: 10000 });
  await expect(page.locator('#active-stars')).not.toHaveText('0');


  // 5. Wacht altijd 30 seconden zodat verbindingen zichtbaar zijn in beeld
  await page.waitForTimeout(30000);

  // 6. Hide radio waves
  await page.click('#toggle-waves-btn');
  await page.waitForTimeout(1000);

  // 7. Wacht tot verbindingen blijven groeien
  const initialConnections = parseInt(await page.locator('#connection-count').textContent() || '0', 10);
  await page.waitForFunction((init) => {
    const el = document.getElementById('connection-count');
    return el && parseInt(el.textContent || '0', 10) > init;
  }, initialConnections, { timeout: 10000 });

  // 8. Zoom verder uit
  await canvas.hover();
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(1000);

  // 9. Pauzeer de simulatie vóór screenshot
  await playPauseBtn.click();
  await page.waitForTimeout(500);
  await expect(playPauseBtn).toHaveText(/Start/);

  // 10. Screenshot van multi-galaxy situatie en check op groene lijn
  const screenshotBuffer = await canvas.screenshot();
  // Voeg screenshot toe aan het Playwright rapport
  await test.info().attach('canvas-greenline-check', {
    body: screenshotBuffer,
    contentType: 'image/png',
  });
  const png = PNG.sync.read(screenshotBuffer);
  let foundGreen = false;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      // Detect "groen-dominant" pixel (door blending/opacity/antialiasing)
      if (g > 100 && g > r * 1.5 && g > b * 1.5) {
        foundGreen = true;
        break;
      }
    }
    if (foundGreen) break;
  }
  expect(foundGreen).toBeTruthy();

  // 11. Start de simulatie weer
  await playPauseBtn.click();
  await page.waitForTimeout(500);
});
