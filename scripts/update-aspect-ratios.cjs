// update-aspect-ratios.cjs
// Script to update aspectRatio in template JSON using real JPEG image dimensions

const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size').default || require('image-size');

const TEMPLATE_JSON = 'generated-templates/all-templates-2025-07-04T21-20-42-941Z.json';
const IMAGES_DIR = '/Users/samuelappolon/Desktop/json Transformer/'; // Updated to your actual images directory
const OUTPUT_JSON = 'generated-templates/all-templates-with-real-aspect-ratios.json';

function ratioToString(w, h) {
  // Try to match common ratios
  const ratio = w / h;
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  if (Math.abs(ratio - 16/9) < 0.01) return '16:9';
  if (Math.abs(ratio - 9/16) < 0.01) return '9:16';
  if (Math.abs(ratio - 4/3) < 0.01) return '4:3';
  if (Math.abs(ratio - 3/2) < 0.01) return '3:2';
  return `${w}:${h}`;
}

const templates = JSON.parse(fs.readFileSync(TEMPLATE_JSON, 'utf8'));

let updated = 0;
templates.forEach(tpl => {
  let imgFile = tpl.imageSource || tpl.preview;
  if (!imgFile) return;
  const imgPath = path.join(IMAGES_DIR, imgFile);
  if (fs.existsSync(imgPath)) {
    try {
      const buffer = fs.readFileSync(imgPath);
      const dimensions = sizeOf(buffer);
      tpl.aspectRatio = ratioToString(dimensions.width, dimensions.height);
      updated++;
    } catch (e) {
      console.warn('Could not read image:', imgPath, e.message);
    }
  } else {
    console.warn('Image not found:', imgPath);
  }
});

fs.writeFileSync(OUTPUT_JSON, JSON.stringify(templates, null, 2));
console.log(`Updated ${updated} templates with real aspect ratios. Output: ${OUTPUT_JSON}`); 