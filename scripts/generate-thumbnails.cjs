#!/usr/bin/env node
// Generate thumbnails for template manifest items without a thumbnail
// Renders layers offscreen at 240x180 using fabric (Node) and saves PNGs

/* eslint-disable no-console */
const fs = require('fs/promises');
const path = require('path');
const { fabric } = require('fabric');

const TARGET_W = 240;
const TARGET_H = 180;
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'assets', 'templates', 'manifest.json');

async function readJSON(file) {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function writeJSON(file, data) {
  const dir = path.dirname(file);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function addImageLayer(canvas, layer) {
  return new Promise((resolve) => {
    const url = String(layer?.url || '');
    if (!url) {
      console.warn('Missing image url in layer:', layer);
      return resolve();
    }
    fabric.Image.fromURL(url, (img) => {
      if (!img) {
        console.warn('Image load failed (CORS or network):', layer?.url);
        return resolve();
      }
      if (typeof layer.w === 'number' && layer.w > 0) {
        img.scaleToWidth(layer.w);
      }
      img.set({
        left: typeof layer.x === 'number' ? layer.x : 0,
        top: typeof layer.y === 'number' ? layer.y : 0,
        selectable: true,
      });
      canvas.add(img);
      canvas.requestRenderAll();
      resolve();
    }, { crossOrigin: 'anonymous' });
  });
}

async function renderThumbnail(item, layers) {
  // Source dimensions from manifest when available
  const sourceW = Number(item.width) || 1080;
  const sourceH = Number(item.height) || 1350;

  // Fallback approach: use StaticCanvas with a node-canvas backing store
  const { createCanvas } = require('canvas');
  const nodeCanvas = createCanvas(TARGET_W, TARGET_H);
  const canvas = new fabric.StaticCanvas(nodeCanvas, { backgroundColor: '#ffffff' });

  // Compute COVER transform (crop to fill entire thumbnail with no letterboxing)
  const scale = Math.max(TARGET_W / sourceW, TARGET_H / sourceH);
  const offsetX = (TARGET_W - sourceW * scale) / 2;
  const offsetY = (TARGET_H - sourceH * scale) / 2;
  canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY]);

  // Draw layers
  for (const layer of layers) {
    if (!layer || !layer.type) continue;
    if (layer.type === 'image') {
      await addImageLayer(canvas, layer);
    } else if (layer.type === 'text') {
      const txt = new fabric.IText(String(layer.text ?? ''), {
        left: typeof layer.x === 'number' ? layer.x : 0,
        top: typeof layer.y === 'number' ? layer.y : 0,
        fontSize: layer.fontSize ?? 24,
        fill: layer.fill ?? '#222',
        fontWeight: layer.fontWeight ?? 'normal',
        selectable: true,
      });
      canvas.add(txt);
    }
  }

  canvas.requestRenderAll();
  // Use data URL to avoid node-canvas API differences
  const dataUrl = canvas.toDataURL({ format: 'png' });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

async function main() {
  try {
    const manifest = await readJSON(MANIFEST_PATH);
    if (!Array.isArray(manifest)) {
      console.error('Manifest is not an array:', MANIFEST_PATH);
      process.exit(1);
    }

    let updated = false;

    for (const item of manifest) {
      try {
        const thumbName = `${item.id}-thumb.png`;
        const thumbRel = `/assets/templates/${thumbName}`;
        const thumbAbs = path.join(PUBLIC_DIR, 'assets', 'templates', thumbName);

        const hasThumbField = typeof item.thumbnail === 'string' && item.thumbnail.length > 0;
        let thumbExists = false;
        try { await fs.access(thumbAbs); thumbExists = true; } catch {}

        if (hasThumbField && thumbExists) continue; // nothing to do

        const jsonRel = String(item.jsonPath || '').replace(/^\//, '');
        if (!jsonRel) {
          console.warn('Skipping manifest item without jsonPath:', item.id);
          continue;
        }
        const jsonAbs = path.join(PUBLIC_DIR, jsonRel);
        const tpl = await readJSON(jsonAbs);
        const layers = Array.isArray(tpl?.layers) ? tpl.layers : [];
        if (layers.length === 0) {
          console.warn('No layers in template JSON, skipping thumbnail:', jsonRel);
          continue;
        }

        console.log(`Rendering thumbnail for ${item.id} ...`);
        const buffer = await renderThumbnail(item, layers);
        await fs.writeFile(thumbAbs, buffer);
        if (!hasThumbField) {
          item.thumbnail = thumbRel;
          updated = true;
        }
      } catch (e) {
        console.warn('Failed to generate thumbnail for item:', item?.id, e?.message || e);
      }
    }

    if (updated) {
      await writeJSON(MANIFEST_PATH, manifest);
      console.log('Manifest updated with new thumbnails');
    } else {
      console.log('No manifest updates needed');
    }
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    process.exit(1);
  }
}

main();


