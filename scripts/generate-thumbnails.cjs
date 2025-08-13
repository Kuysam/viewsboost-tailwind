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
// Use the seeded manifest under public/templates
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'templates', 'manifest.json');
const FORCE = process.argv.includes('--force');

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

async function renderThumbnailFromLayers(item, layers) {
  const sourceW = Number(item.width) || 1080;
  const sourceH = Number(item.height) || 1350;
  const { createCanvas } = require('canvas');
  const nodeCanvas = createCanvas(TARGET_W, TARGET_H);
  const canvas = new fabric.StaticCanvas(nodeCanvas, { backgroundColor: '#ffffff' });
  const scale = Math.max(TARGET_W / sourceW, TARGET_H / sourceH);
  const offsetX = (TARGET_W - sourceW * scale) / 2;
  const offsetY = (TARGET_H - sourceH * scale) / 2;
  canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY]);
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
  const dataUrl = canvas.toDataURL({ format: 'png' });
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return Buffer.from(base64, 'base64');
}

async function renderThumbnailFromFabricJSON(tpl) {
  const sourceW = Number(tpl?.width) || 1080;
  const sourceH = Number(tpl?.height) || 1080;
  // Try fabric first; fall back to manual node-canvas draw if fabric node binding isn't available
  try {
    const { createCanvas } = require('canvas');
    const nodeCanvas = createCanvas(TARGET_W, TARGET_H);
    const canvas = new fabric.StaticCanvas(nodeCanvas, { backgroundColor: '#ffffff' });
    const scale = Math.min(TARGET_W / sourceW, TARGET_H / sourceH);
    const offsetX = (TARGET_W - sourceW * scale) / 2;
    const offsetY = (TARGET_H - sourceH * scale) / 2;
    canvas.setDimensions({ width: TARGET_W, height: TARGET_H });
    canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY]);
    await new Promise((resolve) => canvas.loadFromJSON(tpl, resolve));
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: 'png' });
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(base64, 'base64');
  } catch (e) {
    // Manual rasterization using node-canvas
    const { createCanvas } = require('canvas');
    const cnv = createCanvas(TARGET_W, TARGET_H);
    const ctx = cnv.getContext('2d');
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, TARGET_W, TARGET_H);
    const scale = Math.min(TARGET_W / sourceW, TARGET_H / sourceH);
    const offsetX = (TARGET_W - sourceW * scale) / 2;
    const offsetY = (TARGET_H - sourceH * scale) / 2;
    const drawRect = (o) => {
      const x = (o.left || 0) * scale + offsetX;
      const y = (o.top || 0) * scale + offsetY;
      const w = (o.width || 0) * scale;
      const h = (o.height || 0) * scale;
      if (o.fill && typeof o.fill === 'string') {
        ctx.fillStyle = o.fill;
      } else if (o.fill && typeof o.fill === 'object' && o.fill.type === 'linear' && o.fill.coords && Array.isArray(o.fill.colorStops)) {
        const g = ctx.createLinearGradient(
          (o.fill.coords.x1 || 0) * scale + offsetX,
          (o.fill.coords.y1 || 0) * scale + offsetY,
          (o.fill.coords.x2 || sourceW) * scale + offsetX,
          (o.fill.coords.y2 || sourceH) * scale + offsetY
        );
        for (const stop of o.fill.colorStops) {
          g.addColorStop(Number(stop.offset) || 0, stop.color || '#ccc');
        }
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = '#e5e7eb';
      }
      const rx = (o.rx || 0) * scale, ry = (o.ry || 0) * scale;
      if (rx || ry) {
        ctx.beginPath();
        // simple rounded rect
        const r = Math.max(rx, ry);
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
    };
    const drawCircle = (o) => {
      const x = (o.left || 0) * scale + offsetX;
      const y = (o.top || 0) * scale + offsetY;
      const r = (o.radius || 0) * scale;
      ctx.beginPath();
      ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = typeof o.fill === 'string' ? o.fill : '#ddd';
      ctx.fill();
    };
    const drawText = (o) => {
      const x = (o.left || 0) * scale + offsetX;
      const y = (o.top || 0) * scale + offsetY + (o.fontSize || 24) * scale;
      const size = Math.max(10, Math.round((o.fontSize || 24) * scale));
      ctx.fillStyle = o.fill || '#111827';
      ctx.font = `${o.fontWeight || 600} ${size}px ${o.fontFamily || 'Arial'}`;
      const text = String(o.text || '').split('\n');
      let dy = 0;
      for (const line of text) {
        ctx.fillText(line, x, y + dy);
        dy += size * (o.lineHeight || 1.2);
      }
    };
    const objects = Array.isArray(tpl?.objects) ? tpl.objects : [];
    for (const o of objects) {
      if (!o || !o.type) continue;
      if (o.type === 'rect') drawRect(o);
      else if (o.type === 'circle') drawCircle(o);
      else if (o.type === 'textbox' || o.type === 'text') drawText(o);
      // ignore paths/complex for speed
    }
    return cnv.toBuffer('image/png');
  }
}

async function main() {
  try {
    const manifest = await readJSON(MANIFEST_PATH);
    if (!Array.isArray(manifest)) {
      console.error('Manifest is not an array:', MANIFEST_PATH);
      process.exit(1);
    }

    let updated = false;
    let renderedCount = 0;

    for (const item of manifest) {
      try {
        // Determine thumbnail target. Prefer manifest.previewPath if it points into /templates/library/thumbs
        const defaultThumbName = `${item.id}.png`;
        const defaultThumbRel = `/templates/library/thumbs/${defaultThumbName}`;
        const manifestThumbRel = String(item.previewPath || '');
        const thumbRel = manifestThumbRel && manifestThumbRel.startsWith('/templates/library/thumbs/')
          ? manifestThumbRel
          : defaultThumbRel;
        const thumbAbs = path.join(PUBLIC_DIR, thumbRel.replace(/^\//, ''));

        const hasThumbField = typeof item.previewPath === 'string' && item.previewPath.length > 0;
        let thumbExists = false;
        try { await fs.access(thumbAbs); thumbExists = true; } catch {}

        if (hasThumbField && thumbExists && !FORCE) continue; // nothing to do when not forcing

        // Registry now uses templatePath; decode URL components for FS path
        const jsonRelEnc = String(item.templatePath || item.path || '').replace(/^\//, '');
        const jsonRel = decodeURIComponent(jsonRelEnc);
        if (!jsonRel) {
          console.warn('Skipping manifest item without path:', item.id);
          continue;
        }
        const jsonAbs = path.join(PUBLIC_DIR, jsonRel);
        const tpl = await readJSON(jsonAbs);
        const hasLayers = Array.isArray(tpl?.layers);
        const hasObjects = Array.isArray(tpl?.objects);
        if (!hasLayers && !hasObjects) {
          console.warn('Unknown template format (no layers/objects), skipping:', jsonRel);
          continue;
        }

        console.log(`Rendering thumbnail for ${item.id} (${hasLayers ? 'layers' : 'fabric'})...`);
        let buffer = hasLayers
          ? await renderThumbnailFromLayers(item, tpl.layers)
          : await renderThumbnailFromFabricJSON(tpl);

        // If likely a video template, overlay a play glyph for clarity
        try {
          const str = `${item.name || ''} ${item.category || ''}`.toLowerCase();
          if (/short|reel|video|tiktok|story/.test(str)) {
            const sharpLib = require('sharp');
            const overlay = Buffer.from(
              '<svg width="240" height="180" viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">\n' +
              ' <circle cx="120" cy="90" r="26" fill="rgba(0,0,0,0.55)"/>\n' +
              ' <polygon points="112,76 112,104 134,90" fill="#ffffff"/>\n' +
              '</svg>'
            );
            buffer = await sharpLib(buffer).composite([{ input: overlay }]).png().toBuffer();
          }
        } catch {}
        await fs.mkdir(path.dirname(thumbAbs), { recursive: true });
        await fs.writeFile(thumbAbs, buffer);
        renderedCount++;
        if (!hasThumbField) {
          item.previewPath = thumbRel;
          updated = true;
        }
      } catch (e) {
        console.warn('Failed to generate thumbnail for item:', item?.id, e?.message || e);
      }
    }

    if (updated) {
      await writeJSON(MANIFEST_PATH, manifest);
      console.log('Manifest updated with new thumbnails');
    }
    console.log(`Rendered ${renderedCount} thumbnail(s)${FORCE ? ' (forced)' : ''}`);
  } catch (err) {
    console.error('Thumbnail generation failed:', err);
    process.exit(1);
  }
}

main();


