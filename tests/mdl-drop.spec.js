const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const MDL_PATH = path.resolve(__dirname, '..', 'enforcer.mdl');

/**
 * Helper: load the page and drop enforcer.mdl, wait for model to render.
 */
async function loadModel(page) {
  await page.goto('/');
  const mdlBuffer = fs.readFileSync(MDL_PATH);

  await page.evaluate(async (mdlBase64) => {
    return new Promise((resolve) => {
      const binary = atob(mdlBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/octet-stream' });
      const file = new File([blob], 'enforcer.mdl', { type: 'application/octet-stream' });

      const dt = new DataTransfer();
      dt.items.add(file);

      document.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      }));

      // Wait for FileReader + requestAnimationFrame
      setTimeout(resolve, 1500);
    });
  }, mdlBuffer.toString('base64'));

  // Ensure app content is visible
  await expect(page.locator('#app-content')).toBeVisible();
  await expect(page.locator('#canvas-front')).toBeVisible();
}

// --- Tests ---

test('page loads with drop zone visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#drop-zone')).toBeVisible();
  await expect(page.locator('#app-content')).toBeHidden();
});

test('drop enforcer.mdl loads the model and shows canvases', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await loadModel(page);

  expect(errors).toHaveLength(0);

  // All 3 canvases visible
  await expect(page.locator('#canvas-front')).toBeVisible();
  await expect(page.locator('#canvas-side')).toBeVisible();
  await expect(page.locator('#canvas-top')).toBeVisible();

  // Drop zone hidden
  await expect(page.locator('#drop-zone')).toBeHidden();

  // Frame slider has a max > 0 (enforcer has many frames)
  const sliderMax = await page.locator('#frame-slider').getAttribute('max');
  expect(Number(sliderMax)).toBeGreaterThan(0);
});

test('clicking a canvas selects a vertex', async ({ page }) => {
  await loadModel(page);

  // Click near the center of the front canvas
  const canvas = page.locator('#canvas-front');
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });

  // Vertex info should update (no longer show "No vertex selected")
  const info = page.locator('#vertex-info');
  await expect(info).not.toHaveText(/No vertex selected/);
  await expect(info).toHaveText(/Vertex #\d+/);
});

test('generate code produces output for selected vertex', async ({ page }) => {
  await loadModel(page);

  // Click center of front canvas to select a vertex
  const canvas = page.locator('#canvas-front');
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator('#vertex-info')).toHaveText(/Vertex #\d+/);

  // Set frame range to 0-2
  await page.locator('#frame-from').fill('0');
  await page.locator('#frame-to').fill('2');

  // Click Generate
  await page.locator('#btn-generate').click();

  // Output should contain the template expanded for frames 0, 1, 2
  const output = await page.locator('#output-area').inputValue();
  expect(output).toContain('self.frame==0');
  expect(output).toContain('self.frame==1');
  expect(output).toContain('self.frame==2');

  // Should contain "return" with vector values
  expect(output).toContain('return');

  // Last block should NOT end with "else"
  expect(output.trimEnd()).not.toMatch(/else\s*$/);
});
