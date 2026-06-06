const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON
)

async function generateArticlePages() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, headline, standfirst, hero_image, slug, section, published_date')
    .eq('is_published', true)

  if (error) { console.error(error); return; }

  const outputDir = './articles'
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

  for (const a of articles) {
    const slug = a.slug || a.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const ogImage = a.hero_image || 'https://ami.abta.africa/og-default.jpg'
    const ogTitle = a.headline.replace(/"/g, '&quot;')
    const ogDesc = (a.standfirst || '').replace(/"/g, '&quot;')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle} | African Market Intelligence</title>
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="African Market Intelligence">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDesc}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="https://ami.abta.africa/articles/${slug}.html">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDesc}">
  <meta name="twitter:image" content="${ogImage}">
  <!-- Load the real article page -->
  <script>
    // Pass the article ID so article.html loads it directly
    window.location.replace('/article.html?id=${a.id}');
  </script>
</head>
<body>
  <p style="font-family:sans-serif;padding:40px;text-align:center">Loading article…</p>
</body>
</html>`

    fs.writeFileSync(path.join(outputDir, `${slug}.html`), html)
    console.log(`✓ Generated: ${slug}.html`)
  }

  console.log(`\nDone — ${articles.length} files generated.`)
}

generateArticlePages()
