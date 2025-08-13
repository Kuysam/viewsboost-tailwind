// app/scripts/addPreviews.cjs

const fs = require('fs');
const axios = require('axios');

// ---- CONFIG ----
// Read from environment; do not hardcode keys
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || '';
if (!UNSPLASH_ACCESS_KEY) {
  console.error('Missing UNSPLASH_ACCESS_KEY. Set UNSPLASH_ACCESS_KEY in your environment or .env');
  process.exit(1);
}
const INPUT_FILE = 'app/templates.json';            // <-- Updated path
const OUTPUT_FILE = 'app/templates_with_previews.json';  // <-- Updated path
const QUERY_BY = 'title'; // or 'category'

// --- Developer Note ---
// BATCH_END controls how many templates are processed per run.
// Unsplash free tier allows 50 requests per hour. Set BATCH_END = 50 for max batch.
// Adjust BATCH_START/BATCH_END as needed to process your full template set in multiple runs.
const BATCH_START = 0;        // Set start index, e.g. 0
const BATCH_END = 50;         // Set end index, e.g. 50 (max 50/hr on demo key)

// ---- FUNCTIONS ----

async function getUnsplashImage(query) {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query,
        per_page: 1,
        orientation: 'landscape'
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    if (
      response.data &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      return response.data.results[0].urls.small;
    }
    return null;
  } catch (error) {
    // Add better error reporting
    console.error(`Unsplash error for "${query}":`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  const templates = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  let found = 0, notFound = 0;

  for (let i = BATCH_START; i < Math.min(BATCH_END, templates.length); i++) {
    const tpl = templates[i];
    const keyword = tpl[QUERY_BY] || tpl.title || tpl.category;

    // Skip if preview already exists (to resume safely)
    if (tpl.preview && tpl.preview.startsWith('http')) {
      console.log(`Skipping "${keyword}": already has preview.`);
      continue;
    }

    process.stdout.write(`Searching for "${keyword}"... `);
    const imageUrl = await getUnsplashImage(keyword);
    if (imageUrl) {
      tpl.preview = imageUrl;
      found++;
      console.log('✅ Found');
    } else {
      tpl.preview = '';
      notFound++;
      console.log('❌ Not found');
    }
    // Optional: throttle to respect API rate limit (50 req/hour for demo keys)
    await new Promise(res => setTimeout(res, 1100));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(templates, null, 2));
  console.log(`Done! Output written to ${OUTPUT_FILE}`);
  console.log(`Total: ${found} found, ${notFound} not found, skipped: ${templates.length - (BATCH_END - BATCH_START)}`);
}

main();
