/* ═══════════════════════════════════════════════════════════════════════════
   AMI editorial layout
   Structure follows the FT-style mockup (15 Oct 2026). Colours, fonts and
   content are AMI's own.

   What it does
   - Home and section pages: three-column lead, "Latest" band, text-led lists,
     section blocks on the home page, right-hand column on section pages.
   - Article pages: advert side panel, related-story card between paragraphs.
   - All three: a labelled advert banner above the header.

   What it does not touch: articles, editorial placements (hero, side1, side2,
   card), search, pagination, the admin editor, the paywall or the free-article
   gate. It replaces how the page draws the lead and the list, nothing more.

   To go back to the earlier layout: delete the <script src="layout.js"> line
   from the page. Nothing else needs to change.

   Adverts: slots show "Advertising space" until a creative is supplied. Set
   window.AMI_ADS before this script loads, for example
     window.AMI_ADS = { band:{img:'ads/band.jpg',href:'https://…',alt:'…'},
                        mpu:{…}, tall:{…} };
   Every slot is labelled "Advertisement" and keeps its height so the page does
   not move when an advert loads.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.AMI_LAYOUT === false) return;

  var doc = document;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || doc).querySelectorAll(s)); }

  var isListing = !!$('#heroGrid');
  var isArticle = !!$('#articleFull');
  if (!isListing && !isArticle) return;

  var ADS = window.AMI_ADS || {};
  var SECTION_PAGES = {
    'Markets': 'markets.html', 'Politics': 'politics.html', 'Economy': 'economy.html',
    'Energy': 'energy.html', 'Technology': 'technology.html', 'Opinion': 'opinion.html',
    'Deals': 'deals.html', 'West Africa': 'west-africa.html', 'East Africa': 'east-africa.html',
    'Central Africa': 'central-africa.html', 'North Africa': 'north-africa.html',
    'Southern Africa': 'southern-africa.html'
  };

  /* ── Styles ─────────────────────────────────────────────────────────── */
  var CSS = [
    'body.ami-lay{--lay-serif:"Playfair Display",Georgia,serif;--lay-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}',

    /* adverts */
    '.ami-adband{background:var(--header-bg,#F0EAD9);border-bottom:1px solid var(--divider,#D4C4A0);padding:8px 16px 10px;box-sizing:border-box}',
    '.ami-adwrap{display:flex;flex-direction:column;align-items:center;margin:0 auto;max-width:100%}',
    '.ami-ad__lab{font:600 10px/1 var(--lay-sans,sans-serif);letter-spacing:.08em;text-transform:uppercase;color:var(--text-soft,#6B5344);margin:0 0 4px;align-self:flex-start}',
    '.ami-ad{box-sizing:border-box;display:flex;align-items:center;justify-content:center;max-width:100%;overflow:hidden;text-align:center;',
    '  background:repeating-linear-gradient(45deg,var(--bg,#FAF7F0),var(--bg,#FAF7F0) 8px,var(--header-bg,#F0EAD9) 8px,var(--header-bg,#F0EAD9) 16px);',
    '  border:1px dashed var(--border,#D4C4A0);color:var(--text-soft,#6B5344);font:500 12px/1.3 "DM Mono",monospace}',
    '.ami-ad--filled{background:none;border:0}',
    '.ami-ad img{display:block;max-width:100%;height:auto}',
    '.ami-ad--band{width:970px;height:120px}',
    '.ami-ad--mpu{width:300px;height:250px}',
    '.ami-ad--tall{width:300px;height:600px}',
    '@media(max-width:768px){.ami-ad--band{height:100px}}',

    /* shared type */
    '.lay-kick{font:500 11px/1 "DM Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--terra,#B85C38);margin:0 0 6px}',
    '.lay-meta{font:500 11px/1.4 "DM Mono",monospace;letter-spacing:.04em;color:var(--text-soft,#6B5344);margin:6px 0 0}',
    '.lay-tag{display:inline-block;font:500 10px/1 "DM Mono",monospace;letter-spacing:.08em;text-transform:uppercase;background:var(--nav-bg,#0A1A10);color:#fff;padding:3px 6px;margin-left:8px;vertical-align:middle}',
    '.lay-sf{font:400 16px/1.5 "Spectral",Georgia,serif;color:var(--text-soft,#6B5344);margin:0}',
    '.ami-lay a.lay-a{color:var(--text,#1A1208);text-decoration:none}',
    '.ami-lay a.lay-a:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}',
    '.ami-lay a.lay-a:focus-visible{outline:3px solid var(--gold,#C9A84C);outline-offset:3px}',
    '.lay-imglink{display:block}',
    '.lay-img{display:block;width:100%;object-fit:cover;background:var(--header-bg,#F0EAD9)}',
    '.lay-img-ph{background:var(--header-bg,#F0EAD9);width:100%}',

    /* page frame */
    '.ami-lay .hero-grid{display:block;background:none;border:0;margin:0 0 8px;gap:0}',
    '.ami-lay .markets-strip{display:none}',
    '.ami-lay--home .main-wrapper{display:block}',
    '.ami-lay--home .main-wrapper>aside{display:none}',
    '.ami-lay .main-wrapper>aside .sidebar-widget{display:none}',

    /* band heading (Latest News header restyled) */
    '.ami-lay .section-header{position:relative;display:block;text-align:center;border-top:5px dotted var(--divider,#D4C4A0);padding-top:12px;margin:28px 0 18px}',
    '.ami-lay .section-header .section-line{display:none}',
    '.ami-lay .section-header .section-title{font:500 12px/1 "DM Mono",monospace;letter-spacing:.16em;text-transform:uppercase;margin:0}',
    '.ami-lay .section-header .view-more{position:absolute;right:0;top:12px}',
    '.ami-lay--section .section-header{display:none}',

    /* three-column lead (home) */
    '.lay-lead{display:grid;grid-template-columns:4fr 5fr 3fr;gap:0}',
    '.lay-lead>div{padding:0 20px;border-left:1px solid var(--divider,#D4C4A0);min-width:0}',
    '.lay-lead>div:first-child{padding-left:0;border-left:0}',
    '.lay-lead>div:last-child{padding-right:0}',
    '.lay-h1{font:700 clamp(28px,2.7vw,38px)/1.1 var(--lay-serif);margin:0 0 12px}',
    '.lay-lead .lay-sf{margin:0 0 4px}',
    '.lay-sub{margin-top:24px;border-left:2px solid var(--divider,#D4C4A0);padding-left:12px}',
    '.lay-sub h3{font:700 16px/1.3 var(--lay-serif);margin:0 0 12px}',
    '.lay-cap{background:var(--header-bg,#F0EAD9);padding:14px 16px 18px;text-align:center}',
    '.lay-cap h2{font:700 22px/1.2 var(--lay-serif);margin:4px 0 0}',
    '.lay-rail__h{font:500 11px/1 "DM Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--terra,#B85C38);margin:0 0 12px}',
    '.lay-rail .lay-it{padding:0 0 14px;margin:0 0 14px;border-bottom:1px solid var(--divider,#D4C4A0)}',
    '.lay-rail .lay-it h2{font:700 19px/1.25 var(--lay-serif);margin:4px 0}',
    '.lay-rail .lay-it .lay-sf{font-size:14px;line-height:1.4}',
    '.lay-lead>div>.newsletter-widget{margin:28px 0 0}',
    '.lay-rail .ami-adwrap{margin-top:8px}',

    /* four-across cards + list */
    '.lay-c4{display:grid;grid-template-columns:repeat(4,1fr);gap:0}',
    '.lay-c4>div{padding:0 14px;border-left:1px solid var(--divider,#D4C4A0);min-width:0}',
    '.lay-c4>div:first-child{padding-left:0;border-left:0}',
    '.lay-c4>div:last-child{padding-right:0}',
    '.lay-c4 h3{font:700 19px/1.25 var(--lay-serif);margin:10px 0 0}',
    '.lay-list{display:grid;grid-template-columns:repeat(2,1fr);gap:0 28px;margin-top:22px;border-top:1px solid var(--divider,#D4C4A0);padding-top:18px}',
    '.lay-list--one{grid-template-columns:1fr;margin-top:0;border-top:0;padding-top:0}',
    '.lay-li{padding:0 0 14px;margin:0 0 14px;border-bottom:1px solid var(--divider,#D4C4A0);min-width:0}',
    '.lay-li h3{font:700 22px/1.2 var(--lay-serif);margin:0 0 6px}',
    '.lay-li .lay-sf{font-size:16px}',

    /* section page header and lead */
    '.lay-sechead{border-bottom:1px solid var(--divider,#D4C4A0);padding:0 0 12px;margin:0 0 18px}',
    '.lay-sechead h1{font:700 clamp(32px,4vw,44px)/1.1 var(--lay-serif);margin:0 0 4px}',
    '.lay-sechead p{font:500 12px/1.4 "DM Mono",monospace;color:var(--text-soft,#6B5344);margin:0;letter-spacing:.04em}',
    '.lay-first{padding:0 0 16px;margin:0 0 16px;border-bottom:1px solid var(--divider,#D4C4A0)}',
    '.lay-first h2{font:700 clamp(26px,3vw,34px)/1.12 var(--lay-serif);margin:0 0 8px}',
    '.lay-first .lay-img,.lay-first .lay-img-ph{margin-bottom:12px}',

    /* section blocks on the home page */
    '.lay-blk{margin-top:8px}',
    '.lay-blk__top{display:grid;grid-template-columns:5fr 4fr;gap:20px;align-items:start}',
    '.lay-blk h3.lay-blk__h{font:700 24px/1.15 var(--lay-serif);margin:0 0 8px}',
    '.lay-blk__more{display:flex;justify-content:space-between;align-items:baseline;margin-top:6px}',
    '.lay-blk__more a{font:500 11px/1 "DM Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--green,#1E6B3C)}',
    '.lay-sub3{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:16px}',
    '.lay-sub3>div{padding:0 14px 12px;border-left:1px solid var(--divider,#D4C4A0)}',
    '.lay-sub3>div:first-child{padding-left:0;border-left:0}',
    '.lay-sub3 h4{font:700 16px/1.3 var(--lay-serif);margin:0 0 4px}',

    /* section page right-hand column */
    '.ami-lay--section .main-wrapper>aside{display:block}',
    '.lay-links h3{font:500 11px/1 "DM Mono",monospace;letter-spacing:.1em;text-transform:uppercase;border-top:2px solid var(--nav-bg,#0A1A10);padding-top:8px;margin:0 0 8px}',
    '.lay-links a{display:block;font:500 14px/1.3 var(--lay-sans);padding:6px 0;color:var(--text,#1A1208);text-decoration:none;border-bottom:1px solid var(--divider,#D4C4A0)}',
    '.lay-links a:hover{text-decoration:underline}',
    '.lay-links{margin:0 0 20px}',

    '@media(max-width:900px){',
    '  .lay-lead,.lay-c4,.lay-sub3,.lay-blk__top,.lay-list{grid-template-columns:1fr}',
    '  .lay-lead>div,.lay-c4>div,.lay-sub3>div{border-left:0;padding-left:0;padding-right:0}',
    '  .lay-lead>div+div{margin-top:24px;padding-top:20px;border-top:1px solid var(--divider,#D4C4A0)}',
    '  .lay-c4>div{margin-bottom:20px}',
    '}',

    /* article page */
    // The wrapper takes over the page gutter. article.html works the gutter out
    // as a percentage of the parent, which inside this grid would be the column
    // and not the window. So from 1201px the wrapper is centred at 1280px, the
    // same as the header, and the article column keeps only its own 96px for the
    // share rail.
    '.ami-art-wrap{display:grid;grid-template-columns:minmax(0,1fr) 300px;column-gap:24px;align-items:start}',
    // article.html has a rule for 1200px and below that centres the column, but
    // a later rule in the same file cancels it, which left a 120px left margin
    // on tablets and phones. This one comes after both.
    '@media(max-width:1200px){.article-full{max-width:760px;margin:0 auto;padding:40px 24px 80px}}',
    '@media(min-width:1201px){.ami-art-wrap{max-width:1280px;margin:0 auto;padding:0 24px;box-sizing:border-box}',
    '.ami-art-wrap .article-full{max-width:880px;margin:0;padding:40px 24px 80px var(--art-rail-space);box-sizing:border-box}}',
    '.ami-art-side{align-self:stretch;padding-top:40px}',
    '.ami-art-side .ami-adwrap{position:sticky;top:16px}',
    '@media(max-width:1259px){.ami-art-wrap{display:block}.ami-art-side{padding:0 24px 32px}.ami-art-side .ami-adwrap{position:static}.ami-art-side .ami-ad--tall{height:250px}}',
    '.ami-rel{display:grid;grid-template-columns:1fr 96px;gap:14px;align-items:start;margin:26px 0;padding:12px 14px;border-left:4px solid var(--gold,#C9A84C);background:var(--gold-pale,#FDF6E3);clear:both}',
    '.ami-rel.ami-rel--noimg{grid-template-columns:1fr}',
    '.ami-rel .rk{font:500 11px/1.2 "DM Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--text-soft,#3D2B1F);margin:0 0 4px}',
    '.ami-rel a.ra{font:700 19px/1.3 var(--lay-serif,"Playfair Display",Georgia,serif);color:var(--text,#1A1208);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;display:inline-block;padding:2px 0}',
    '.ami-rel a.ra:hover{text-decoration-thickness:2px}',
    '.ami-rel a.ra:focus-visible{outline:3px solid var(--text,#1A1208);outline-offset:3px}',
    '.ami-rel .rm{font:500 12px/1.3 "DM Mono",monospace;color:var(--text-soft,#6B5344);margin:4px 0 0}',
    '.ami-rel img{display:block;width:96px;height:64px;object-fit:cover}',
    '@media(max-width:620px){.ami-rel{grid-template-columns:1fr}.ami-rel img{display:none}}'
  ].join('\n');

  var st = doc.createElement('style');
  st.id = 'amiLayoutCSS';
  st.textContent = CSS;
  doc.head.appendChild(st);
  doc.body.classList.add('ami-lay');

  /* ── Helpers ────────────────────────────────────────────────────────── */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? (parseInt(m[3], 10) + ' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1]) : (s || '');
  }
  function url(a) { return 'article.html?id=' + encodeURIComponent(a.id); }
  function metaLine(a) {
    var p = [];
    var d = fmtDate(a.published_date);
    if (d) p.push(d);
    if (a.read_time) p.push(a.read_time);
    return p.join(' &middot; ');
  }
  function tag(a) { return a.is_locked ? '<span class="lay-tag">Premium</span>' : ''; }
  function kick(a) { return a.section ? '<p class="lay-kick">' + a.section + '</p>' : ''; }
  function link(a, txt) { return '<a class="lay-a" href="' + url(a) + '">' + (txt || a.headline) + '</a>'; }
  function img(a, h) {
    var ph = '<div class="lay-img-ph" style="height:' + h + 'px"></div>';
    var inner = a.hero_image
      ? '<img class="lay-img" src="' + a.hero_image + '" alt="" loading="lazy" style="height:' + h + 'px" onerror="this.outerHTML=\'<div class=lay-img-ph style=height:' + h + 'px></div>\'">'
      : ph;
    return '<a class="lay-imglink" href="' + url(a) + '" tabindex="-1" aria-hidden="true">' + inner + '</a>';
  }
  function adSlot(kind) {
    var c = ADS[kind];
    var box = doc.createElement('div');
    box.className = 'ami-adwrap';
    var lab = '<span class="ami-ad__lab">Advertisement</span>';
    if (c && c.img) {
      box.innerHTML = lab + '<div class="ami-ad ami-ad--filled ami-ad--' + kind + '"><a href="' + (c.href || '#') +
        '" target="_blank" rel="sponsored noopener"><img src="' + c.img + '" alt="' + (c.alt || 'Advertisement') + '"></a></div>';
    } else {
      box.innerHTML = lab + '<div class="ami-ad ami-ad--' + kind + '"><span>Advertising space</span></div>';
    }
    var aside = doc.createElement('aside');
    aside.setAttribute('aria-label', 'Advertisement');
    aside.className = 'ami-adwrap-outer';
    aside.appendChild(box);
    return aside;
  }
  function track(name, params) { if (typeof window.amiTrack === 'function') window.amiTrack(name, params); }

  /* ── Banner above the header (all layout pages) ─────────────────────── */
  (function addBand() {
    var strip = $('.ticker-bar') || $('.ami-strip') || $('.ami-ticker');
    var band = doc.createElement('div');
    band.className = 'ami-adband';
    band.appendChild(adSlot('band'));
    if (strip && strip.parentNode) strip.parentNode.insertBefore(band, strip);
    else doc.body.insertBefore(band, doc.body.firstChild);
  })();

  /* ═══ LISTING PAGES (home and the 11 section pages) ═══════════════════ */
  function initListing() {
    var main = $('#main-content');
    var aside = $('.main-wrapper > aside');
    var nw = $('.newsletter-widget');          // moved, never cloned: it keeps its ids and handlers
    var shown = {};                            // ids already drawn in the lead
    var lead = null;
    var origCards = window.renderCards;
    var origHero = window.renderHero;

    // Right-hand column links and advert for section pages
    if (aside && !$('.lay-links', aside)) {
      var secs = ['Markets', 'Politics', 'Economy', 'Energy', 'Technology', 'Deals'];
      var regs = ['West Africa', 'East Africa', 'Central Africa', 'Southern Africa', 'North Africa'];
      var mk = function (arr) { return arr.map(function (n) { return '<a href="' + SECTION_PAGES[n] + '">' + n + '</a>'; }).join(''); };
      var box = doc.createElement('div');
      box.className = 'lay-links';
      box.innerHTML = '<h3>Sections</h3>' + mk(secs) + '<h3 style="margin-top:16px">Regions</h3>' + mk(regs);
      aside.appendChild(box);
      aside.appendChild(adSlot('mpu'));
    }

    function setMode() {
      var sec = (typeof filterActive !== 'undefined') && filterActive !== 'all';
      doc.body.classList.toggle('ami-lay--section', sec);
      doc.body.classList.toggle('ami-lay--home', !sec);
      return sec;
    }

    function placeNewsletter(sec, rail) {
      if (!nw) return;
      if (!sec && rail) rail.appendChild(nw);
      else if (aside && nw.parentNode !== aside) aside.insertBefore(nw, aside.firstChild);
    }

    // ── Lead ────────────────────────────────────────────────────────────
    function renderHeroNew(filtered) {
      var sec = setMode();
      var grid = $('#heroGrid');
      if (!grid) return;
      shown = {};
      // A section page with nothing in it says so. It must not fall back to
      // counting every article on the site under the section name.
      if (sec && filtered && !filtered.length) {
        grid.innerHTML = '<div class="lay-sechead"><h1>' + filterActive + '</h1><p>No stories yet</p></div>';
        placeNewsletter(true);
        return;
      }
      var pool = (filtered && filtered.length) ? filtered : allArticles;
      if (!pool || !pool.length) { return; }

      if (sec) {
        lead = pool.find(function (a) { return a.placement === 'hero'; }) || pool[0];
        shown[lead.id] = 1;
        window.__amiLead = lead;
        grid.innerHTML =
          '<div class="lay-sechead"><h1>' + filterActive + '</h1></div>' +
          '<div class="lay-first">' + img(lead, 220) + kick(lead) +
          '<h2>' + link(lead) + tag(lead) + '</h2><p class="lay-sf">' + (lead.standfirst || '') + '</p><p class="lay-meta">' + metaLine(lead) + '</p></div>';
        placeNewsletter(true);
        return;
      }

      var hero = allArticles.find(function (a) { return a.placement === 'hero'; }) || allArticles[0];
      var s1 = allArticles.find(function (a) { return a.placement === 'side1'; }) || allArticles[1];
      var s2 = allArticles.find(function (a) { return a.placement === 'side2'; }) || allArticles[2];
      lead = hero;
      window.__amiLead = hero;
      [hero, s1, s2].forEach(function (a) { if (a) shown[a.id] = 1; });

      // two headline-only links under the lead: the next editorial cards
      var cards = allArticles.filter(function (a) { return a.placement === 'card' && !shown[a.id]; });
      var subs = cards.slice(0, 2);
      subs.forEach(function (a) { shown[a.id] = 1; });

      // right-hand column: side 2, then up to two Premium stories not yet shown
      var rail = [];
      if (s2) rail.push(s2);
      allArticles.filter(function (a) { return a.is_locked && !shown[a.id]; }).slice(0, 2).forEach(function (a) { rail.push(a); shown[a.id] = 1; });

      var colA =
        kick(hero) + '<h1 class="lay-h1">' + link(hero) + tag(hero) + '</h1>' +
        '<p class="lay-sf">' + (hero.standfirst || '') + '</p><p class="lay-meta">' + metaLine(hero) + '</p>' +
        (subs.length ? '<div class="lay-sub">' + subs.map(function (a) { return '<h3>' + link(a) + '</h3>'; }).join('') + '</div>' : '');
      var colB = s1
        ? img(s1, 300) + '<div class="lay-cap">' + kick(s1) + '<h2>' + link(s1) + tag(s1) + '</h2><p class="lay-meta">' + metaLine(s1) + '</p></div>'
        : '';
      var colC = '<h3 class="lay-rail__h">More from AMI</h3>' + rail.map(function (a) {
        return '<div class="lay-it">' + kick(a) + '<h2>' + link(a) + tag(a) + '</h2><p class="lay-sf">' + (a.standfirst || '') + '</p><p class="lay-meta">' + metaLine(a) + '</p></div>';
      }).join('');

      grid.innerHTML = '<div class="lay-lead"><div id="layColA">' + colA + '</div><div>' + colB + '</div><div class="lay-rail" id="layRail">' + colC + '</div></div>';
      var railEl = $('#layRail');
      placeNewsletter(false, $('#layColA'));
      if (railEl) railEl.appendChild(adSlot('mpu'));

      var ttl = $('.section-header .section-title');
      if (ttl) ttl.textContent = 'Latest';
    }

    // ── List below the lead ─────────────────────────────────────────────
    function renderCardsNew(articles) {
      if (window.searchQuery || (typeof searchQuery !== 'undefined' && searchQuery) || window.ARCHIVE_MODE) {
        return origCards.apply(this, arguments);
      }
      var sec = setMode();
      var list = (articles || allArticles.filter(function (a) { return a.placement === 'card'; }))
        .filter(function (a) { return !shown[a.id]; });
      filteredCards = list;
      totalArticles = list.length;
      var start = (currentPage - 1) * ARTICLES_PER_PAGE;
      var page = list.slice(start, start + ARTICLES_PER_PAGE);
      var container = $('#articleCardsContainer');
      var hdr = $('#archiveHeader');

      if (!list.length) {
        container.innerHTML = '<p style="color:var(--text-soft);font-family:DM Mono,monospace;font-size:12px;padding:24px 0">No further articles.</p>';
        var pb = $('#paginationBar'); if (pb) pb.innerHTML = '';
        if (hdr) hdr.style.display = 'none';
        renderBlocks(sec);
        return;
      }

      if (hdr) {
        if (currentPage > 1) {
          $('#archiveTitle').textContent = sec ? filterActive : 'All Articles';
          $('#archiveCount').textContent = totalArticles + ' article' + (totalArticles !== 1 ? 's' : '') + ' · Page ' + currentPage + ' of ' + Math.ceil(totalArticles / ARTICLES_PER_PAGE);
          hdr.style.display = 'flex';
        } else hdr.style.display = 'none';
      }

      var li = function (a) {
        return '<div class="lay-li">' + (sec ? '' : kick(a)) + '<h3>' + link(a) + tag(a) + '</h3><p class="lay-sf">' + (a.standfirst || '') +
          '</p><p class="lay-meta">' + metaLine(a) + '</p></div>';
      };
      var html;
      if (sec || currentPage > 1) {
        html = '<div class="lay-list lay-list--one">' + page.map(li).join('') + '</div>';
      } else {
        var top4 = page.slice(0, 4), rest = page.slice(4);
        html = '<div class="lay-c4">' + top4.map(function (a) {
          return '<div>' + img(a, 120) + kick(a).replace('<p class="lay-kick">', '<p class="lay-kick" style="margin-top:10px">') +
            '<h3>' + link(a) + tag(a) + '</h3><p class="lay-meta">' + metaLine(a) + '</p></div>';
        }).join('') + '</div>' + (rest.length ? '<div class="lay-list">' + rest.map(li).join('') + '</div>' : '');
      }
      container.innerHTML = html;
      renderPagination();
      renderBlocks(sec);
    }

    // ── Section blocks (home page 1 only) ───────────────────────────────
    function renderBlocks(sec) {
      var old = $('#amiBlocks');
      if (old) old.remove();
      if (sec || currentPage > 1 || (typeof searchQuery !== 'undefined' && searchQuery)) return;

      var drawn = {};
      Object.keys(shown).forEach(function (k) { drawn[k] = 1; });
      (filteredCards || []).slice(0, ARTICLES_PER_PAGE).forEach(function (a) { drawn[a.id] = 1; });

      var groups = {};
      allArticles.forEach(function (a) {
        if (drawn[a.id] || !a.section || !SECTION_PAGES[a.section]) return;
        (groups[a.section] = groups[a.section] || []).push(a);
      });
      var names = Object.keys(groups).sort(function (x, y) { return groups[y].length - groups[x].length; }).slice(0, 3);
      if (!names.length) return;

      var host = doc.createElement('div');
      host.id = 'amiBlocks';
      host.innerHTML = names.map(function (n) {
        var g = groups[n];
        var first = g[0], more = g.slice(1, 4);
        return '<div class="section-header"><h2 class="section-title"><a class="lay-a" href="' + SECTION_PAGES[n] + '">' + n + '</a></h2></div>' +
          '<div class="lay-blk"><div class="lay-blk__top"><div>' + kick(first) + '<h3 class="lay-blk__h">' + link(first) + tag(first) + '</h3>' +
          '<p class="lay-sf">' + (first.standfirst || '') + '</p><p class="lay-meta">' + metaLine(first) + '</p></div>' + img(first, 200) + '</div>' +
          (more.length ? '<div class="lay-sub3">' + more.map(function (a) {
            return '<div><h4>' + link(a) + tag(a) + '</h4><p class="lay-meta">' + metaLine(a) + '</p></div>';
          }).join('') + '</div>' : '') +
          '<p class="lay-blk__more"><span></span><a href="' + SECTION_PAGES[n] + '">All ' + n + ' &rarr;</a></p></div>';
      }).join('');
      var anchor = $('#paginationBar');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(host, anchor.nextSibling);
    }

    window.renderHero = renderHeroNew;
    window.renderCards = renderCardsNew;
    // function declarations in the page script are global properties; the
    // assignment above replaces them for every later call (init, filters).
    try { renderHero = renderHeroNew; renderCards = renderCardsNew; } catch (e) { /* strict mode: window.* is enough */ }

    // If the page had already drawn before this script arrived, draw again.
    if (typeof allArticles !== 'undefined' && allArticles.length && typeof applyFilters === 'function') {
      applyFilters(true);
    }
  }

  /* ═══ ARTICLE PAGE ════════════════════════════════════════════════════ */
  function initArticle() {
    var full = $('#articleFull');

    // Side panel: wrap the article column and put the tall slot beside it
    var wrap = doc.createElement('div');
    wrap.className = 'ami-art-wrap';
    full.parentNode.insertBefore(wrap, full);
    wrap.appendChild(full);
    var side = doc.createElement('div');
    side.className = 'ami-art-side';
    side.appendChild(adSlot('tall'));
    wrap.appendChild(side);

    var removed = null;
    function relCard() { return $('[data-ami-related]'); }

    // The editor saves the body's innerHTML, so the card is taken out while
    // editing and put back afterwards. It is also never added for a signed-in
    // editor.
    var toggle = window.toggleEditMode;
    if (typeof toggle === 'function') {
      window.toggleEditMode = function () {
        var c = relCard();
        if (c) { removed = { node: c, prev: c.previousElementSibling }; c.remove(); }
        else if (removed && removed.prev && removed.prev.parentNode) {
          removed.prev.parentNode.insertBefore(removed.node, removed.prev.nextSibling);
          removed = null;
        }
        return toggle.apply(this, arguments);
      };
    }

    function build() {
      var body = $('#articleBody');
      if (!body || relCard() || body.getAttribute('contenteditable') === 'true' || window._amiAdminAuthed) return;
      var paras = [].slice.call(body.children).filter(function (n) { return n.tagName === 'P'; });
      if (paras.length < 4) return;                 // too short to carry a card
      if (typeof db === 'undefined' || !db.query) return;
      var id = new URLSearchParams(location.search).get('id');
      var kEl = $('.af-kicker', full);
      var section = kEl ? kEl.childNodes[0].textContent.trim() : '';
      body.setAttribute('data-ami-related-pending', '1');

      db.query('articles', { select: 'id,headline,section,published_date,read_time,is_locked,hero_image', eq: { is_published: 'true' }, order: 'created_at.desc', limit: '40' })
        .then(function (rows) {
          rows = (rows || []).filter(function (r) { return String(r.id) !== String(id); });
          var pick = rows.find(function (r) { return r.section === section; }) || rows[0];
          if (!pick || relCard() || window._amiAdminAuthed) return;
          var same = pick.section === section;
          var label = same ? 'More in ' + pick.section : 'Also on AMI';
          var node = doc.createElement('aside');
          node.className = 'ami-rel' + (pick.hero_image ? '' : ' ami-rel--noimg');
          node.setAttribute('aria-label', 'Related story');
          node.setAttribute('data-ami-related', '1');
          node.setAttribute('contenteditable', 'false');
          node.innerHTML = '<div><p class="rk">' + label + '</p><a class="ra" href="' + url(pick) + '">' + pick.headline + '</a>' +
            '<p class="rm">' + metaLine(pick) + (pick.is_locked ? ' &middot; Premium' : '') + '</p></div>' +
            (pick.hero_image ? '<img src="' + pick.hero_image + '" alt="" onerror="this.remove()">' : '');
          node.querySelector('a.ra').addEventListener('click', function () { track('related_story_click', { section: pick.section || '' }); });
          paras[2].parentNode.insertBefore(node, paras[2].nextSibling);   // after the third paragraph
        })
        .catch(function () { /* no card is better than a broken one */ });
    }

    // The article draws after a network call, so watch for its body.
    var tries = 0;
    var obs = new MutationObserver(function () {
      if ($('#articleBody') && !$('#articleBody').hasAttribute('data-ami-related-pending')) {
        build();
        if (++tries > 3) obs.disconnect();
      }
    });
    obs.observe(full, { childList: true });
    build();
  }

  if (isListing) initListing(); else initArticle();
})();
