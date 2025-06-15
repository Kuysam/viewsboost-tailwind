const fs = require('fs');
const axios = require('axios');

// ---- CONFIG ----
const UNSPLASH_ACCESS_KEY = '4QSBhU22JAECLL-wphJBiwDGiuEn9H6LdC7AA2_YRZ0'; // <--- Your key is here!
const INPUT_FILE = 'app/templates.json';            // <-- Updated path
const OUTPUT_FILE = 'app/templates_with_previews.json';  // <-- Updated path
const QUERY_BY = 'title'; // or 'category'

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
      // Use the regular image URL, or 'small' for smaller file
      return response.data.results[0].urls.small;
    }
    return null;
  } catch (error) {
    console.error('Unsplash error for', query, ':', error.response ? error.response.data : error.message);
    return null;
  }
}

async function main() {
  const templates = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  for (let i = 0; i < templates.length; i++) {
    const tpl = templates[i];
    const keyword = tpl[QUERY_BY] || tpl.title || tpl.category;
    process.stdout.write(`Searching for "${keyword}"... `);
    const imageUrl = await getUnsplashImage(keyword);
    if (imageUrl) {
      tpl.preview = imageUrl;
      console.log('✅ Found');
    } else {
      tpl.preview = '';
      console.log('❌ Not found');
    }
    // Optional: throttle to respect API rate limit (50 req/hour for demo keys)
    await new Promise(res => setTimeout(res, 1100));
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(templates, null, 2));
  console.log(`Done! Output written to ${OUTPUT_FILE}`);
}

main();
