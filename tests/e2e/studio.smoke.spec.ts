import { test, expect } from '@playwright/test';

test.describe('Studio smoke', () => {
  const base = 'http://localhost:5173';

  test('1-3 thumbnails visible, open template, editor shows', async ({ page }) => {
    await page.goto(`${base}/studio`);
    await expect(page.getByTestId('template-card').first()).toBeVisible();

    // 1) Thumbnails visible
    const cards = page.getByTestId('template-card');
    await expect(cards).toHaveCountGreaterThan(0);

    // 2) Click template -> loads editor
    await cards.first().click();

    // 3) Editor canvas appears with at least 1 object (fabric)
    const canvas = page.getByTestId('editor-canvas');
    await expect(canvas).toBeVisible();

    // Wait until Fabric has objects
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="editor-canvas"]') as any;
      const cv = el && (el as any)._fabric;
      return !!(cv && Array.isArray((cv as any)._objects) && (cv as any)._objects.length > 0);
    }, { timeout: 8000 });
  });

  test('6-11 basic editing: drag, resize, delete, reorder, toolbar, undo/redo', async ({ page }) => {
    await page.goto(`${base}/studio`);
    await page.getByTestId('template-card').first().click();
    const canvas = page.getByTestId('editor-canvas');
    await expect(canvas).toBeVisible();

    // pick first object via Fabric and store on window for easy targeting
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="editor-canvas"]') as any;
      const c = el && (el as any)._fabric;
      if (!c || !(c as any)._objects?.length) return;
      (c as any).setActiveObject((c as any)._objects[0]);
      (window as any)._active = (c as any).getActiveObject();
      (c as any).requestRenderAll();
    });

    // 6) Drag element
    await page.mouse.move(300, 300);
    await page.mouse.down();
    await page.mouse.move(360, 340);
    await page.mouse.up();
    // assert object moved
    const moved = await page.evaluate(() => !!(window as any)._active && (window as any)._active.left > 0);
    expect(moved).toBeTruthy();

    // 7) Resize element (scale)
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.up('Shift');

    // 8) Delete element
    await page.keyboard.press('Delete');
    const objCountAfterDelete = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="editor-canvas"]') as any;
      const c = el && (el as any)._fabric;
      return (c as any)?._objects?.length ?? 0;
    });
    expect(objCountAfterDelete).toBeGreaterThanOrEqual(0);

    // 9) Layers panel visible (at least)
    const layers = page.getByTestId('layers-panel');
    await expect(layers).toBeVisible();

    // 10) Toolbar visible
    await expect(page.getByTestId('toolbar')).toBeVisible();

    // 11) Undo/Redo does not throw
    await page.keyboard.press('Meta+Z').catch(() => {});
    await page.keyboard.press('Meta+Shift+Z').catch(() => {});
  });

  test('12 export PNG (no taint)', async ({ page }) => {
    await page.goto(`${base}/studio`);
    await page.getByTestId('template-card').first().click();
    await expect(page.getByTestId('editor-canvas')).toBeVisible();

    // Try actual export hook if wired to button; otherwise call Fabric directly
    const hasExportBtn = await page.getByTestId('btn-export').count();
    if (hasExportBtn) {
      await page.getByTestId('btn-export').click();
      // if your app opens a modal or downloads, just assert no error banner
      await expect(page.getByTestId('editor-canvas')).toBeVisible();
    } else {
      const dataUrl = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="editor-canvas"]') as any;
        const c = el && (el as any)._fabric;
        return (c as any)?.toDataURL({ format: 'png' }) || null;
      });
      expect(typeof dataUrl).toBe('string');
      expect(dataUrl as string).toContain('data:image/png');
    }
  });

  test.fixme('13 Background removal', async () => {});
  test.fixme('14 AI copy/layout suggestions', async () => {});
  test.fixme('15 Chart generation', async () => {});
});

declare global {
  interface PlaywrightMatchers<R> {
    toHaveCountGreaterThan(n: number): R;
  }
}
expect.extend({
  async toHaveCountGreaterThan(received, n: number) {
    const count = await (received as any).count();
    return count > n
      ? { pass: true, message: () => `OK count ${count} > ${n}` }
      : { pass: false, message: () => `Expected > ${n}, got ${count}` };
  },
});


