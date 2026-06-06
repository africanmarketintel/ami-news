/**
 * generate-og-pages.js
 *
 * Fetches all published articles from Supabase and writes a static
 * /articles/<id>.html file for each one. Each file has pre-baked Open Graph
 * meta tags so social media link previews work correctly, then immediately
 * redirects humans to the full article page at /article.html?id=<id>.
 *
 * Run locally:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON=your_key node scripts/generate-og-pages.js
 *
 * Runs automatically via .github/workflows/generate-og-pages.yml
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://ucpjwyghwxjalkfvmbro.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON || 'sb_publishable_7cI4RoxyLr88DhwDWRC1vg_DSpczsHt';
const SITE_BASE     = 'https://ami.abta.africa';
const OUTPUT_DIR    = path.join(__dirname, '..', 'articles');
const DEFAULT_IMAGE = `${SITE_BASE}/og-default.jpg`;

// ── Fetch helpers ─────────────────────────────────────────────────────────────

function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchArticles() {
  const url = `${SUPABASE_URL}/rest/v1/articles?select=id,slug,headline,standfirst,hero_image,section,published_date,placement&order=published_date.desc.nullslast`;
  const headers = {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
  };
  const rows = await fetchJson(url, headers);
  if (!Array.isArray(rows)) throw new Error('Unexpected response: ' + JSON.stringify(rows).slice(0, 200));
  return rows;
}

// ── HTML template ─────────────────────────────────────────────────────────────

function escape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildPage(article) {
  const title       = escape(article.headline || 'African Market Intelligence');
  const description = escape(article.standfirst || 'Intelligence across African markets. What Africa\'s deal makers read first.');
  const image       = escape(article.hero_image || DEFAULT_IMAGE);
  const articleUrl  = `${SITE_BASE}/article.html?id=${article.id}`;
  const canonicalUrl = `${SITE_BASE}/articles/${article.id}.html`;
  const section     = escape(article.section || 'AMI');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | African Market Intelligence</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="article">
  <meta property="og:site_name"   content="African Market Intelligence">
  <meta property="og:title"       content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image"       content="${image}">
  <meta property="og:url"         content="${canonicalUrl}">
  <meta property="og:locale"      content="en_GB">
  <meta property="article:section" content="${section}">

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:site"        content="@AMI_Africa">
  <meta name="twitter:title"       content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image"       content="${image}">

  <!-- Canonical -->
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Redirect humans to the full article page immediately -->
  <script>window.location.replace("${articleUrl}");</script>
  <noscript><meta http-equiv="refresh" content="0; url=${articleUrl}"></noscript>

  <style>
    body { margin: 0; background: #FAF7F0; font-family: 'Spectral', Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .loading { text-align: center; color: #6B5344; }
    .logo { font-size: 1.1rem; font-weight: 700; color: #1E6B3C; letter-spacing: 0.08em; margin-bottom: 1rem; }
    p { font-size: 0.95rem; opacity: 0.7; }
  </style>
</head>
<body>
  <div class="loading">
    <div class="logo">AMI</div>
    <p>Loading article…</p>
  </div>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching articles from Supabase…');
  const articles = await fetchArticles();

  // Skip archive-only articles
  const published = articles.filter(a => a.placement !== 'archive');
  console.log(`Found ${articles.length} articles total, ${published.length} non-archive`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let created = 0;
  let updated = 0;

  for (const article of articles) {
    const filePath = path.join(OUTPUT_DIR, `${article.id}.html`);
    const html     = buildPage(article);
    const existed  = fs.existsSync(filePath);

    fs.writeFileSync(filePath, html, 'utf8');
    existed ? updated++ : created++;
  }

  console.log(`Done. Created: ${created}  Updated: ${updated}  Total: ${articles.length}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
