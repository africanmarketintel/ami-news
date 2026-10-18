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

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_ANON = process.env.SUPABASE_ANON;
if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('SUPABASE_URL and SUPABASE_ANON must be set (GitHub: Settings > Secrets and variables > Actions).');
  process.exit(1);
}
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
  const url = `${SUPABASE_URL}/rest/v1/articles?select=id,headline,standfirst,hero_image,section,published_date,placement&order=published_date.desc&limit=1000`;
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
    .replace(/<[^>]*>/g, ' ')   // drop any editor HTML so previews show plain text
    .replace(/\s+/g, ' ')
    .trim()
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


// ── Headline addresses (slugs) ─────────────────────────────────────────────
// Each article also gets a small page at the site root named after its headline,
// for example /south-africas-competition-regulator-seeks-to-revoke-a-food-merger-approval
// GitHub Pages serves <name>.html at /<name>. The page carries the preview tags,
// then loads article.html into itself so the address stays readable.
// These root pages are not committed: they are rebuilt on every run and deployed with the site.

const ROOT_DIR = path.join(__dirname, '..');

function slugify(headline) {
  let s = String(headline || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/<[^>]*>/g, ' ')
    .replace(/['‘’`]/g, '')                    // Africa's -> africas
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length > 90) {
    s = s.slice(0, 90);
    const cut = s.lastIndexOf('-');
    if (cut > 40) s = s.slice(0, cut);
  }
  return s;
}

function assignSlugs(articles) {
  // Names already used by files in the site root (index, economy, about and so on)
  const reserved = new Set();
  for (const f of fs.readdirSync(ROOT_DIR)) {
    reserved.add(f.toLowerCase());
    reserved.add(f.replace(/\.[^.]+$/, '').toLowerCase());
  }
  ['articles', 'fonts', 'docs', 'scripts', 'dealroom', 'deal-room', 'mailroom', 'recruiter', 'supabase', 'login', 'admin'].forEach(n => reserved.add(n));

  const used = new Set();
  const map = {};
  // Sorted by id so the same article always gets the same address between runs
  const sorted = articles.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  for (const a of sorted) {
    let base = slugify(a.headline) || 'article';
    let slug = base;
    if (reserved.has(slug) || used.has(slug)) {
      slug = `${base}-${String(a.id).replace(/-/g, '').slice(0, 6)}`;
    }
    used.add(slug);
    map[a.id] = slug;
  }
  return map;
}

function buildSlugPage(article, slug) {
  const title       = escape(article.headline || 'African Market Intelligence');
  const description = escape(article.standfirst || 'Intelligence across African markets. What Africa\'s deal makers read first.');
  const image       = escape(article.hero_image || DEFAULT_IMAGE);
  const section     = escape(article.section || 'AMI');
  const pageUrl     = `${SITE_BASE}/${slug}`;
  const articleUrl  = `/article.html?id=${encodeURIComponent(article.id)}`;
  const idJson      = JSON.stringify(String(article.id)).replace(/</g, '\\u003c');

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
  <meta property="og:url"         content="${pageUrl}">
  <meta property="og:locale"      content="en_GB">
  <meta property="article:section" content="${section}">

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:site"        content="@AMI_Africa">
  <meta name="twitter:title"       content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image"       content="${image}">

  <link rel="canonical" href="${pageUrl}">
  <noscript><meta http-equiv="refresh" content="0; url=${articleUrl}"></noscript>

  <style>
    body { margin: 0; background: #FAF7F0; font-family: 'Source Serif 4', Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .loading { text-align: center; color: #6B5344; }
    .logo { font-size: 1.1rem; font-weight: 700; color: #1E6B3C; letter-spacing: 0.08em; margin-bottom: 1rem; }
    p { font-size: 0.95rem; opacity: 0.7; }
  </style>
  <script>
  // Load the article page into this page so the headline address stays in the address bar.
  // If that fails, send the reader to the plain article address.
  (function () {
    var id = ${idJson};
    window.AMI_ARTICLE_ID = id;
    fetch('/article.html', { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.text(); })
      .then(function (html) {
        var inject = '<head><script>window.AMI_ARTICLE_ID=' + JSON.stringify(id) + '<\\/script>';
        if (html.indexOf('<head>') === -1) throw new Error('no head');
        html = html.replace('<head>', inject);
        document.open(); document.write(html); document.close();
      })
      .catch(function () { window.location.replace('${articleUrl}'); });
  })();
  </script>
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

  // Headline addresses: <slug>.html in the site root plus articles/slugs.json (id -> slug)
  const slugs = assignSlugs(articles);
  let slugPages = 0;
  for (const article of articles) {
    if (article.placement === 'archive') continue;   // archive-only articles keep the /articles/<id>.html page
    const slug = slugs[article.id];
    fs.writeFileSync(path.join(ROOT_DIR, `${slug}.html`), buildSlugPage(article, slug), 'utf8');
    slugPages++;
  }
  const manifest = {};
  for (const article of articles) {
    if (article.placement !== 'archive') manifest[article.id] = slugs[article.id];
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'slugs.json'), JSON.stringify(manifest), 'utf8');
  console.log(`Headline pages: ${slugPages}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
