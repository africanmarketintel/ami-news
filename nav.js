// ═══════════════════════════════════════════════════════════
// AMI SHARED NAVIGATION — nav.js
// Add <script src="nav.js"></script> to any AMI page and
// this script will inject the correct nav and footer automatically.
// Active page is highlighted based on the current filename.
// ═══════════════════════════════════════════════════════════

(function () {

  // ── Active page detection ──────────────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // ── Where the site root is from here ───────────────────────────
  // nav.js is now loaded by the Dealroom and the Mailroom as well as the
  // publication, and those live in subfolders. Every link this file builds for
  // the root of the site is put through P() so it resolves from wherever the
  // page is. Links harvested from a product's own nav are already relative to
  // that product's folder and are left alone.
  const SUBFOLDERS = ['dealroom', 'mailroom', 'recruiter', 'articles', 'docs'];
  const R = (function () {
    const parts = window.location.pathname.split('/');
    let i = -1;
    for (let n = 0; n < parts.length; n++) { if (SUBFOLDERS.indexOf(parts[n]) > -1) { i = n; break; } }
    if (i === -1) return '';
    return new Array(parts.length - 1 - i).fill('../').join('');
  })();

  function P(href) {
    if (!href || /^([a-z]+:|\/|#|\.\.\/)/i.test(href)) return href;
    return R + href;
  }

  // Applied to markup this file injects as a template literal, where putting
  // P() round every href by hand would be 30 edits and one missed one.
  function rewriteLinks(el) {
    if (!el || !R) return;
    el.querySelectorAll('a[href]').forEach(function (a) {
      const h = a.getAttribute('href');
      if (h !== P(h)) a.setAttribute('href', P(h));
    });
  }

  function isActive(href) {
    return currentPage === href || (currentPage === '' && href === 'index.html');
  }

  function navLink(href, label) {
    const active = isActive(href)
      ? 'style="color:var(--gold);border-bottom:2px solid var(--gold)"'
      : '';
    return `<a href="${href}" class="nav-link" ${active}>${label}</a>`;
  }

  function navLinkRight(href, label) {
    const active = isActive(href) ? 'style="color:var(--gold)"' : '';
    return `<a href="${href}" class="nav-link" ${active}>${label}</a>`;
  }

  // ── Subscriber state (checked before anything renders) ─────
  window.amiIsSubscriber = localStorage.getItem('ami_subscriber') === 'true';

  // ── Nav HTML ───────────────────────────────────────────────
  // nav-left is intentionally empty; section links live in .section-nav below the masthead.
  // nav-right holds only #navSubscribeBtn (hidden by default); login.js injects the
  // Login / Account button immediately after it.
  const navHTML = `
<nav class="top-nav" aria-label="Main navigation">
  <button class="nav-hamburger" aria-label="Open menu" onclick="if(typeof toggleMobileNav==='function') toggleMobileNav()">
    <span></span><span></span><span></span>
  </button>
  <div class="nav-left"></div>
  <div class="nav-right">
    <a href="deals.html" id="navSubscribeBtn" class="btn-subscribe" style="display:none">Deal Tracker</a>
  </div>
</nav>`;


  const verifyModalHTML = `
<div id="amiVerifyOverlay" style="display:none;position:fixed;inset:0;background:rgba(6,15,9,.85);z-index:9999;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)">
  <div style="background:#FAF7F0;max-width:440px;width:100%;border-top:4px solid #C9A84C;box-shadow:0 24px 80px rgba(0,0,0,.5);padding:36px 32px;font-family:'Spectral',Georgia,serif;position:relative">
    <button onclick="amiVerifyClose()" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:20px;color:#9A8070;cursor:pointer;line-height:1">×</button>
    <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:800;color:#1A1208;margin-bottom:4px">Verify Your Access</div>
    <p style="font-size:13px;color:#6B5344;margin-bottom:20px;line-height:1.6">Enter the email address you used when subscribing to unlock your premium access.</p>
    <div id="amiVerifyForm">
      <input id="amiVerifyEmail" type="email" placeholder="your@email.com" autocomplete="email"
        style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:'DM Mono',monospace;font-size:13px;padding:12px 14px;outline:none;margin-bottom:10px;box-sizing:border-box"
        onkeydown="if(event.key==='Enter') amiVerifySubmit()">
      <button id="amiVerifyBtn" onclick="amiVerifySubmit()"
        style="width:100%;background:#C9A84C;color:#060F09;font-family:'DM Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:13px;border:none;cursor:pointer;transition:background .2s"
        onmouseover="this.style.background='#D4B86A'" onmouseout="this.style.background='#C9A84C'">
        Verify Subscription →
      </button>
    </div>
    <div id="amiVerifySuccess" style="display:none;text-align:center;padding:12px 0">
      <div style="font-size:32px;margin-bottom:10px">✓</div>
      <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#1A1208;margin-bottom:6px">Access Confirmed</div>
      <p style="font-size:13px;color:#6B5344">Welcome back. The page will reload with your subscriber access.</p>
    </div>
    <div id="amiVerifyError" style="display:none;background:#FFF0ED;border-left:3px solid #B85C38;padding:10px 14px;margin-top:10px;font-family:'DM Mono',monospace;font-size:11px;color:#8C3A1F"></div>
  </div>
</div>`;

  // ── Masthead ───────────────────────────────────────────────
  // Tier two of the agreed header: the wordmark on the left, Sign in and
  // Subscribe on the right, nothing else.
  //
  // The pages inline a different masthead: .masthead is text-align:center with
  // a 60px wordmark and a strapline under it, and .top-nav is a second 48px
  // dark bar sitting between the ticker and the masthead holding a hamburger,
  // an empty .nav-left and a hidden button. On the desktop that reads as two
  // dark strips and a centred poster, which is not the three-tier header.
  //
  // Hidden rather than deleted, for the same reason the band carries its own
  // hex values: 16 of the 19 pages inline this CSS and :root is defined three
  // different ways, so a shared component cannot rely on the page's tokens and
  // must not depend on the page's markup surviving either.
  const MASTHEAD_CSS = `
@media (min-width:768px){.top-nav{display:none!important}}
.masthead{text-align:left!important;padding:14px max(24px,calc((100% - 1280px)/2 + 24px))!important;box-sizing:border-box}
.masthead-header-row{display:flex!important;grid-template-columns:none!important;align-items:center!important;
  justify-content:space-between!important;gap:24px!important;margin-bottom:0!important}
.masthead-name{grid-column:auto!important;text-align:left!important;margin-bottom:0!important;
  font-size:clamp(20px,2.2vw,28px)!important}
.masthead-tagline{display:none!important}
.masthead-cta{grid-column:auto!important;justify-self:auto!important;display:inline-flex!important;
  align-items:center!important;gap:18px!important;flex-shrink:0}
.masthead-cta a.dr-nav__account,
.masthead-cta #amiNavLoginBtn{background:none!important;border:none!important;padding:0!important;border-radius:0!important;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif!important;font-size:15px!important;
  font-weight:400!important;letter-spacing:0!important;text-transform:none!important;color:#1A1208!important;cursor:pointer}
.masthead-cta a.dr-nav__account{text-decoration:none!important}
.masthead-cta a.dr-nav__account:hover,.masthead-cta #amiNavLoginBtn:hover{text-decoration:underline!important}
@media (max-width:767px){.masthead-header-row{flex-direction:row!important;gap:12px!important}
  .masthead-name{text-align:left!important}.masthead-cta{gap:12px!important;justify-self:auto!important}}
`;

  // ── Footer ─────────────────────────────────────────────────
  // One footer for AMI and every product, in the structure the Recruiter
  // already used: the product you are in, then agreements and policies, then
  // contact, then a rule and the company line.
  //
  // Cream-dark ground, #F0EAD9, the same tint as the masthead band. No gold:
  // it is 1.90:1 here and cannot be text, so the headings are ink instead.
  //
  // Links are ink and underlined rather than green. Green is the design
  // system's signal colour, and a footer where every link is the signal colour
  // signals nothing - it just turns the block green. Ink underlined is what the
  // Recruiter footer this is modelled on already did.
  //
  // No rule above it: a tint change separates on its own, and the design system
  // says not to draw a line where it already does.
  //
  // Column one is the product's own navigation, read off the page the same way
  // the band reads it, so there is no second list to keep in step. Column two
  // is per product because each one has its own legal folder.
  const FOOTER_LEGAL = {
    news: [
      ['privacy.html', 'Privacy policy'],
      ['contact.html', 'Contact']
    ],
    dealroom: [
      ['dealroom/legal/website-terms.html', 'Website terms'],
      ['dealroom/legal/privacy-notice.html', 'Privacy notice'],
      ['dealroom/legal/cookies.html', 'Cookies'],
      ['dealroom/legal/security.html', 'Security'],
      ['dealroom/legal/complaints.html', 'Complaints'],
      ['dealroom/legal/accessibility.html', 'Accessibility']
    ],
    mailroom: [
      ['mailroom/legal/sender-terms.html', 'Sender terms'],
      ['mailroom/legal/acceptable-use.html', 'Acceptable use'],
      ['mailroom/legal/data-processing.html', 'Data processing'],
      ['mailroom/legal/privacy-notice.html', 'Privacy notice'],
      ['mailroom/legal/complaints.html', 'Complaints'],
      ['mailroom/legal/accessibility.html', 'Accessibility']
    ]
  };

  const FOOTER_CSS_BASE = `
footer.ami-foot{background:#F0EAD9;color:#1A1208;margin-top:48px;
  padding:40px max(24px,calc((100% - 1280px)/2 + 24px)) 26px;box-sizing:border-box;text-align:left}
footer.ami-foot *{box-sizing:border-box}
footer.ami-foot .ami-foot__cols{display:grid;grid-template-columns:repeat(3,1fr);gap:48px}
footer.ami-foot h2{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
  font-size:15px;font-weight:700;color:#1A1208;margin:0 0 12px;letter-spacing:0;text-transform:none}
footer.ami-foot ul{list-style:none;margin:0;padding:0;border:0}
footer.ami-foot li{margin:0 0 9px;padding:0;border:0}
footer.ami-foot a{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
  font-size:14px;color:#1A1208;text-decoration:underline;text-underline-offset:2px}
footer.ami-foot a:hover,footer.ami-foot a:focus{color:#8C3A1F}
footer.ami-foot p{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
  font-size:14px;line-height:1.55;margin:0 0 10px;color:#1A1208}
footer.ami-foot .ami-foot__rule{height:1px;background:#D4C4A0;margin:28px 0 18px}
footer.ami-foot .ami-foot__legal p{font-size:13px;color:#6B5344;margin-bottom:8px}
footer.ami-foot .ami-foot__verify{background:none;border:1px solid #1A1208;color:#1A1208;
  font-family:'DM Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;
  padding:7px 13px;cursor:pointer;margin-top:4px}
footer.ami-foot .ami-foot__verify:hover{background:#FDF6E3}
@media (max-width:860px){footer.ami-foot .ami-foot__cols{grid-template-columns:1fr 1fr;gap:28px}}
@media (max-width:560px){footer.ami-foot .ami-foot__cols{grid-template-columns:1fr}}
`;

  function footerLinks(pairs) {
    return pairs.map(function (x) {
      return '<li><a href="' + P(x[0]) + '">' + x[1] + '</a></li>';
    }).join('');
  }

  // Column one. The product's own nav, from the same place the band gets it.
  function footerProductLinks(who) {
    if (who === 'news') {
      return footerLinks(SECTIONS.map(function (x) { return [x.href, x.label]; })
        .concat(REGIONS.map(function (x) { return [x.href, x.label]; })));
    }
    if (harvested && harvested.links.length) {
      return harvested.links.map(function (x) {
        return '<li><a href="' + x.href + '">' + x.label + '</a></li>';
      }).join('');
    }
    return '';
  }

  function buildFooter() {
    const who = currentProduct();
    const product = PRODUCTS.filter(function (x) { return x.key === who; })[0];
    const name = product ? (who === 'news' ? 'AMI News' : 'AMI ' + product.label) : 'AMI';
    return '<footer class="ami-foot">'
      + '<div class="ami-foot__cols">'
      + '<div><h2>' + name + '</h2><ul>' + footerProductLinks(who) + '</ul></div>'
      + '<div><h2>Agreements and policies</h2><ul>'
      + footerLinks(FOOTER_LEGAL[who] || FOOTER_LEGAL.news) + '</ul></div>'
      + '<div><h2>Contact</h2>'
      + '<p>Questions about your account or a story:<br>'
      + '<a href="mailto:ami@abta.africa">ami@abta.africa</a></p>'
      + '<p>We aim to reply within 2 business days.</p>'
      + '<p><a href="' + P('index.html') + '">African Market Intelligence home</a></p>'
      + '<p><a href="' + P('about.html') + '">About AMI</a></p>'
      + '<p><button type="button" class="ami-foot__verify" onclick="if(typeof amiVerifyAccess===\'function\')amiVerifyAccess()">'
      + 'Already a subscriber? Verify access &rarr;</button></p>'
      + '</div>'
      + '</div>'
      + '<div class="ami-foot__rule"></div>'
      + '<div class="ami-foot__legal">'
      + '<p>AMI is operated by African Business Trade Association Limited, a company registered in '
      + 'England and Wales, United Kingdom. Company number 16401954.</p>'
      + '<p>&copy; ' + new Date().getFullYear() + ' African Business Trade Association Limited. '
      + '<a href="' + P('privacy.html') + '">Privacy</a></p>'
      + '</div>'
      + '</footer>';
  }


  // The sign-in control is login.js's, not ours. All this does is make sure it
  // lands in the masthead row rather than in the dark bar above it, and that it
  // says Sign in.
  //
  // login.js anchors on the first #navSubscribeBtn in the document, and there
  // are two on most pages - one in .top-nav, one in .masthead-cta. The top-nav
  // one wins on document order, which is why Login renders in the dark strip.
  // Taking the id off every copy outside the masthead moves the anchor.
  //
  // Pages with no masthead at all - contact.html, deals.html, nda-sign.html -
  // are left exactly as they are.
  function anchorSignIn() {
    const cta = document.querySelector('.masthead-cta');
    if (!cta) return;
    const all = document.querySelectorAll('#navSubscribeBtn');
    if (all.length < 2) return;
    all.forEach(function (el) { if (!cta.contains(el)) el.removeAttribute('id'); });
  }

  // nav.js and login.js both run on DOMContentLoaded and the order is not
  // guaranteed, so if login.js got there first its button is in the wrong place.
  // Move it, and relabel it. Watching rather than polling, because the button is
  // also replaced when somebody signs in or out.
  function adoptSignIn() {
    const cta = document.querySelector('.masthead-cta');
    if (!cta) return;
    ['amiNavLoginBtn', 'amiAccountWrapper'].forEach(function (id) {
      const el = document.getElementById(id);
      // First child, not last: Sign in reads before Subscribe, and the gold box
      // is the last thing in the row.
      if (el && el !== cta.firstElementChild) cta.insertBefore(el, cta.firstChild);
    });
    const btn = document.getElementById('amiNavLoginBtn');
    if (btn && btn.textContent.trim() !== 'Sign in') btn.textContent = 'Sign in';
    // The product's own account links, moved not rebuilt.
    if (harvested && harvested.account.length) {
      harvested.account.slice().reverse().forEach(function (a) {
        if (a.parentNode !== cta) cta.insertBefore(a, cta.firstChild);
      });
    }
  }

  // Three pages carry no .masthead at all. deals.html and nda-sign.html have
  // nothing in its place, so tier two was simply missing and the dark bar sat
  // against the product row. They get the same row, built here.
  //
  // contact.html is deliberately excluded: it already has an .ami-logo header,
  // the GOV.UK-style wordmark with the ABTA line under it that the products
  // use. Injecting a masthead there would put two wordmarks on one page. That
  // page needs a decision, not a patch.
  const MASTHEAD_HTML = `
<header class="masthead" role="banner">
  <div class="masthead-header-row">
    <a class="masthead-name" href="__R__index.html" style="text-decoration:none">African Market <span>Intelligence</span></a>
    <div class="masthead-cta">
      <a href="__R__membership.html" class="btn-subscribe">Subscribe</a>
      <a href="__R__deals.html" id="navSubscribeBtn" class="btn-subscribe" style="display:none">Deal Tracker</a>
    </div>
  </div>
</header>`;

  // Carried here rather than assumed, because these pages never defined the
  // masthead rules in the first place.
  const MASTHEAD_BASE_CSS = `
.masthead{background:#F0EAD9;border-bottom:1px solid #D4C4A0}
.masthead-name{font-family:'Playfair Display',Georgia,serif;font-weight:800;letter-spacing:-.02em;color:#1A1208;line-height:1}
.masthead-name span{color:#C9A84C}
.btn-subscribe{background:#C9A84C;color:#1A1208;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;
  letter-spacing:.08em;text-transform:uppercase;padding:8px 16px;border-radius:2px;text-decoration:none;display:inline-block}
`;

  // The Dealroom and the Mailroom carry .dr-header: a white bar with the
  // wordmark, the ABTA line under it, the product's nav and the account link.
  // It is tier two and tier four in one. Harvested here, before it is removed,
  // so the band can use the real nav and the account link keeps working - the
  // product scripts look up #dr-account-link, #mr-account-link and #mr-sign-out
  // by id, so those elements are moved rather than rebuilt.
  let harvested = null;
  let slot = null;

  function harvestProductHeader() {
    // .ami-header is contact.html's, and only contact.html's: a third header
    // with the GOV.UK-style wordmark and the ABTA line under it. Left in place
    // it sat below the shared chrome instead of being replaced by it, so the
    // page carried two headers and no masthead. It is harvested the same way.
    const header = document.querySelector('.dr-header, .ami-header');
    if (!header || harvested) return;
    const nav = header.querySelector('.dr-nav, .ami-nav');
    const here_ = window.location.pathname.split('/').pop() || 'index.html';
    const links = [];
    const account = [];
    if (nav) {
      [].slice.call(nav.querySelectorAll('a')).forEach(function (a) {
        if (a.classList.contains('dr-nav__account')) { account.push(a); return; }
        const h = a.getAttribute('href') || '';
        links.push({ href: h, label: a.textContent.trim(), on: h.split('/').pop() === here_ });
      });
    }
    harvested = { links: links, account: account };
    account.forEach(function (a) { a.parentNode.removeChild(a); });
    // The header is replaced by an empty slot rather than deleted, because the
    // skip link and the Beta banner sit above it and must stay above it. The
    // chrome is appended into the slot in the order it is built: ticker, the
    // mobile bar, masthead, products, band.
    slot = document.createElement('div');
    slot.id = 'amiHeaderSlot';
    header.parentNode.replaceChild(slot, header);
  }

  function ensureMasthead() {
    harvestProductHeader();
    if (document.querySelector('.masthead')) return;
    const st = document.createElement('style');
    st.textContent = MASTHEAD_BASE_CSS;
    document.head.appendChild(st);
    const nav = document.querySelector('.top-nav');
    const ticker = document.querySelector('.ticker-bar');
    const html = MASTHEAD_HTML.split('__R__').join(R);
    if (nav) nav.insertAdjacentHTML('afterend', html);
    else if (ticker) ticker.insertAdjacentHTML('afterend', html);
    else if (slot) slot.insertAdjacentHTML('beforeend', html);
    else document.body.insertAdjacentHTML('afterbegin', html);
  }

  function initMasthead() {
    ensureMasthead();
    const head = document.querySelector('.masthead');
    if (!head) return;
    if (!document.getElementById('amiMastheadCSS')) {
      const st = document.createElement('style');
      st.id = 'amiMastheadCSS';
      st.textContent = MASTHEAD_CSS;
      document.head.appendChild(st);
    }
    // Subscribe, not Membership. One gold box in the row.
    const sub = head.querySelector('a.btn-subscribe[href="membership.html"]');
    if (sub) sub.textContent = 'Subscribe';
    anchorSignIn();
    adoptSignIn();
    const cta = head.querySelector('.masthead-cta');
    if (cta && window.MutationObserver) {
      // Scoped to the row. login.js inserts next to #navSubscribeBtn, which is
      // inside it, so watching the whole body would fire on every ticker tick
      // for nothing.
      new MutationObserver(adoptSignIn).observe(cta, { childList: true });
    }
  }

  // ── Product row ────────────────────────────────────────────
  // AMI, the Dealroom and the Mailroom are one organisation, and until now
  // nothing on the publication said so: index.html contained neither the word
  // "dealroom" nor "mailroom" anywhere in 219KB of HTML.
  //
  // This sits between the masthead and the section row, which is where the
  // products belong - they are not news sections and must not be appended to
  // the section row.
  //
  // Styles are inline rather than classed because the publication's CSS is
  // inlined per page and :root is defined three different ways across the 18
  // content pages. Until that is one file, a new component cannot rely on the
  // tokens. The hex values below are the canonical ones.
  const PRODUCTS = [
    { href: 'index.html',           label: 'News',     key: 'news' },
    { href: 'dealroom/index.html',  label: 'Dealroom', key: 'dealroom' },
    { href: 'mailroom/index.html',  label: 'Mailroom', key: 'mailroom' }
  ];

  // Which product the current page belongs to. Everything at the root of the
  // site is the publication, so News is active on markets.html and
  // west-africa.html as well as the front page - not only on index.html.
  function currentProduct() {
    const path = window.location.pathname;
    if (path.indexOf('/dealroom') > -1) return 'dealroom';
    if (path.indexOf('/mailroom') > -1) return 'mailroom';
    return 'news';
  }

  function productRow() {
    const here = currentProduct();
    const links = PRODUCTS.map(function (p) {
      const on = p.key === here;
      return '<a href="' + P(p.href) + '"' + (on ? ' aria-current="page"' : '')
        + ' style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Helvetica,Arial,sans-serif;'
        + 'font-size:15px;text-decoration:none;padding:9px 0 7px;color:#1A1208;'
        + (on ? 'font-weight:700;box-shadow:inset 0 -3px 0 #1E6B3C;' : '')
        + '">' + p.label + '</a>';
    }).join('');
    return '<nav class="ami-product-row" aria-label="AMI services" '
      + 'style="border-bottom:1px solid #D4C4A0;padding:0 max(24px,calc((100% - 1280px)/2 + 24px));display:flex;gap:26px;background:#FAF7F0;box-sizing:border-box">'
      + links + '</nav>';
  }

  // Before the section row where there is one, after the masthead otherwise.
  function injectProducts() {
    if (document.querySelector('.ami-product-row')) return;
    const row = productRow();
    const section = document.querySelector('.section-nav');
    if (section) { section.insertAdjacentHTML('beforebegin', row); return; }
    const masthead = document.querySelector('.masthead');
    if (masthead) { masthead.insertAdjacentHTML('afterend', row); return; }
    const nav = document.querySelector('.top-nav');
    if (nav) nav.insertAdjacentHTML('afterend', row);
  }

  // ── Ticker ─────────────────────────────────────────────────
  // The publication builds its own ticker from the markets it has already
  // loaded. The products never had one, and the agreed header has the same
  // strip on every product, so nav.js builds it where there is none.
  const TICKER_CSS = `
.ami-ticker{background:#0A1A10;color:#C9A84C;font-family:'DM Mono',ui-monospace,monospace;font-size:11px;
  padding:7px max(24px,calc((100% - 1280px)/2 + 24px));overflow:hidden;white-space:nowrap;letter-spacing:.04em;box-sizing:border-box}
.ami-ticker span+span::before{content:'\\00a0\\00a0·\\00a0\\00a0';color:#6c7a70}`;

  // deals.html has a .ticker-bar but none of the rules for it, so it rendered
  // as 16px Spectral on no ground above the masthead. Same treatment as the
  // footer: measured, and styled only where the page does not.
  function fixBareTicker() {
    const t = document.querySelector('.ticker-bar');
    if (!t) return;
    const bg = getComputedStyle(t).backgroundColor;
    if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return;
    if (!document.getElementById('amiTickerFixCSS')) {
      const st = document.createElement('style');
      st.id = 'amiTickerFixCSS';
      st.textContent = '.ticker-bar.ami-ticker--bare{background:#0A1A10;color:#C9A84C;'
        + "font-family:'DM Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.04em;"
        + 'padding:7px max(24px,calc((100% - 1280px)/2 + 24px));overflow:hidden;white-space:nowrap;box-sizing:border-box}';
      document.head.appendChild(st);
    }
    t.classList.add('ami-ticker--bare');
  }

  function ensureTicker() {
    fixBareTicker();
    if (document.querySelector('.ticker-bar') || document.querySelector('.ami-ticker')) return;
    const st = document.createElement('style');
    st.textContent = TICKER_CSS;
    document.head.appendChild(st);
    const bar = document.createElement('div');
    bar.className = 'ami-ticker';
    bar.setAttribute('aria-label', 'Market summary');
    bar.textContent = ' ';
    if (slot) slot.appendChild(bar);
    else document.body.insertAdjacentElement('afterbegin', bar);
    sb('markets', 'select=id,value,change,direction&limit=8').then(function (rows) {
      if (!rows || !rows.length) { bar.remove(); return; }
      bar.innerHTML = rows.map(function (m) {
        return '<span>' + String(m.id).toUpperCase() + ' ' + m.value + '</span>';
      }).join('');
    }).catch(function () { bar.remove(); });
  }

  // ── Supabase ───────────────────────────────────────────────
  // config.js defines SUPABASE_URL and SUPABASE_ANON as globals and GitHub
  // Actions substitutes the real values at deploy time. Locally they are still
  // the placeholders, so every caller here has to cope with the query simply
  // not happening.
  function sbReady() {
    return typeof SUPABASE_URL === 'string' && typeof SUPABASE_ANON === 'string'
      && SUPABASE_URL.indexOf('http') === 0 && SUPABASE_ANON.length > 20;
  }

  function sb(table, qs) {
    if (!sbReady()) return Promise.reject(new Error('not configured'));
    return fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + qs, {
      headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON }
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); });
  }

  // ── Search ─────────────────────────────────────────────────
  // One search across every published article, not a filter of the page you
  // happen to be standing on. Results render inside the panel so no page
  // layout is touched and the behaviour is the same on all of them.
  const SEARCH_CSS = `
.ami-search-btn{background:none;border:0;padding:9px 0 7px;margin-left:auto;cursor:pointer;color:#1A1208;
  display:inline-flex;align-items:center}
.ami-search-btn svg{display:block}
.ami-search-panel{display:none;background:#FAF7F0;border-bottom:1px solid #D4C4A0;padding:16px max(24px,calc((100% - 1280px)/2 + 24px));box-sizing:border-box}
.ami-search-panel[data-open="1"]{display:block}
.ami-search-row{display:flex;align-items:center;gap:14px}
.ami-search-row input{flex:1;min-width:0;height:44px;background:#fff;border:2px solid #1A1208;padding:0 14px;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;color:#1A1208}
.ami-search-row button.ami-go{height:44px;background:#0A1A10;color:#FAF7F0;border:0;border-radius:2px;padding:0 22px;
  font-family:'DM Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
.ami-search-row button.ami-close{background:none;border:0;padding:0;cursor:pointer;color:#1E6B3C;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;text-decoration:underline}
.ami-search-results{margin:14px 0 0;padding:0;list-style:none;max-height:58vh;overflow:auto}
.ami-search-results li{border-top:1px solid #D4C4A0}
.ami-search-results a{display:block;padding:11px 0;text-decoration:none;color:#1A1208}
.ami-search-results a:hover,.ami-search-results a:focus{background:#F0EAD9}
.ami-search-results .h{display:block;font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;line-height:1.3}
.ami-search-results .m{display:block;font-family:'DM Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.08em;
  text-transform:uppercase;color:#6B5344;margin-top:4px}
.ami-search-note{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
  font-size:14px;color:#6B5344;margin:14px 0 0}
.ami-search-panel .sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0}
@media (max-width:620px){.ami-search-row{flex-wrap:wrap}.ami-search-row input{flex:1 0 100%}}`;

  const SEARCH_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">'
    + '<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="2"/>'
    + '<path d="M12.8 12.8L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  let searchTimer = null;

  function searchPanel() {
    return '<div class="ami-search-panel" id="amiSearchPanel" data-open="0">'
      + '<div class="ami-search-row">'
      + '<label class="sr-only" for="amiSearchInput">Search AMI</label>'
      + '<input id="amiSearchInput" type="text" inputmode="search" autocomplete="off" '
      + 'placeholder="Search for stories, topics or securities">'
      + '<button type="button" class="ami-go" id="amiSearchGo">Search</button>'
      + '<button type="button" class="ami-close" id="amiSearchClose">Close</button>'
      + '</div>'
      + '<ul class="ami-search-results" id="amiSearchResults" aria-live="polite"></ul>'
      + '<p class="ami-search-note" id="amiSearchNote" hidden></p>'
      + '</div>';
  }

  function openSearch(open) {
    const panel = document.getElementById('amiSearchPanel');
    const btn = document.getElementById('amiSearchBtn');
    if (!panel || !btn) return;
    panel.setAttribute('data-open', open ? '1' : '0');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { const i = document.getElementById('amiSearchInput'); if (i) i.focus(); }
    else btn.focus();
  }

  function renderResults(rows, q) {
    const list = document.getElementById('amiSearchResults');
    const note = document.getElementById('amiSearchNote');
    if (!list || !note) return;
    list.innerHTML = '';
    if (!rows.length) {
      note.hidden = false;
      note.textContent = 'No stories match “' + q + '”.';
      return;
    }
    note.hidden = true;
    list.innerHTML = rows.map(function (a) {
      const d = a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB',
        { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      const meta = [a.section, d].filter(Boolean).join(' · ');
      return '<li><a href="' + P('article.html') + '?id=' + encodeURIComponent(a.id) + '">'
        + '<span class="h">' + esc(a.headline || 'Untitled') + '</span>'
        + (meta ? '<span class="m">' + esc(meta) + '</span>' : '') + '</a></li>';
    }).join('');
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function runSearch(q) {
    const note = document.getElementById('amiSearchNote');
    const list = document.getElementById('amiSearchResults');
    if (!note || !list) return;
    q = q.trim();
    if (q.length < 2) { list.innerHTML = ''; note.hidden = true; return; }
    if (!sbReady()) {
      list.innerHTML = '';
      note.hidden = false;
      note.textContent = 'Search is unavailable on this page.';
      return;
    }
    // Commas and parentheses are the separators in a PostgREST or() filter, so
    // they are stripped rather than escaped.
    const term = q.replace(/[(),*]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!term) return;
    const like = '*' + term + '*';
    const qs = 'select=id,headline,standfirst,section,created_at'
      + '&is_published=eq.true'
      + '&or=(headline.ilike.' + encodeURIComponent(like)
      + ',standfirst.ilike.' + encodeURIComponent(like)
      + ',author_name.ilike.' + encodeURIComponent(like) + ')'
      + '&order=created_at.desc&limit=12';
    sb('articles', qs).then(function (rows) { renderResults(rows || [], q); })
      .catch(function () {
        list.innerHTML = '';
        note.hidden = false;
        note.textContent = 'Search could not be reached. Try again in a moment.';
      });
  }

  function initSearch() {
    const row = document.querySelector('.ami-product-row');
    if (!row || document.getElementById('amiSearchPanel')) return;
    const st = document.createElement('style');
    st.textContent = SEARCH_CSS;
    document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'amiSearchBtn';
    btn.className = 'ami-search-btn';
    btn.setAttribute('aria-label', 'Search');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'amiSearchPanel');
    btn.innerHTML = SEARCH_ICON;
    row.appendChild(btn);
    // Under the whole header, not between the product row and the band - the
    // band is injected after this runs on pages that had no .section-nav, and
    // would otherwise land between the two.
    const band = document.querySelector('.ami-band');
    (band || row).insertAdjacentHTML('afterend', searchPanel());
    btn.addEventListener('click', function () {
      openSearch(document.getElementById('amiSearchPanel').getAttribute('data-open') !== '1');
    });
    document.getElementById('amiSearchClose').addEventListener('click', function () { openSearch(false); });
    document.getElementById('amiSearchGo').addEventListener('click', function () {
      runSearch(document.getElementById('amiSearchInput').value);
    });
    const input = document.getElementById('amiSearchInput');
    input.addEventListener('input', function () {
      clearTimeout(searchTimer);
      const v = this.value;
      searchTimer = setTimeout(function () { runSearch(v); }, 250);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); clearTimeout(searchTimer); runSearch(this.value); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.getElementById('amiSearchPanel').getAttribute('data-open') === '1') {
        openSearch(false);
      }
    });
  }

  // ── Section band ───────────────────────────────────────────
  // Tier three of the agreed header: a dark band, one line, product name on
  // the left and that product's own navigation on the right.
  //
  // This REPLACES the light .section-nav the pages carry inline. The links are
  // the same ones, read off the live site, minus Home - the band already says
  // News and the masthead links to the front page, so Home said it a third
  // time. The All Africa dropdown and the search box are both preserved.
  //
  // Styles go in an injected <style> rather than inline because a dropdown
  // needs :hover and :focus-within, which inline styles cannot express. It is
  // still self-contained in this file and relies on no page tokens, because
  // :root is defined three different ways across the 18 content pages.
  const SECTIONS = [
    { href: 'markets.html',    label: 'Markets'    },
    { href: 'politics.html',   label: 'Politics'   },
    { href: 'economy.html',    label: 'Economy'    },
    { href: 'energy.html',     label: 'Energy'     },
    { href: 'technology.html', label: 'Tech'       },
    { href: 'deals.html',      label: 'Deals'      }
  ];
  const REGIONS = [
    { href: 'west-africa.html',     label: 'West Africa'     },
    { href: 'east-africa.html',     label: 'East Africa'     },
    { href: 'central-africa.html',  label: 'Central Africa'  },
    { href: 'southern-africa.html', label: 'Southern Africa' },
    { href: 'north-africa.html',    label: 'North Africa'    }
  ];

  const bandCSS = `
.ami-band{background:#0A1A10;padding:0 max(24px,calc((100% - 1280px)/2 + 24px));box-sizing:border-box}
.ami-band__inner{display:flex;align-items:center;gap:20px;min-height:42px}
.ami-band__name{margin:0;font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:600;color:#FAF7F0;white-space:nowrap}
.ami-band__nav{margin-left:auto;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.ami-band__nav a{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#EDE5D5;text-decoration:none;padding:11px 0}
.ami-band__nav a:hover,.ami-band__nav a:focus{color:#C9A84C}
.ami-band__nav a[aria-current="page"]{color:#C9A84C;box-shadow:inset 0 -2px 0 #C9A84C}
.ami-band__drop{position:relative}
.ami-band__drop>button{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;color:#EDE5D5;background:none;border:0;padding:11px 0;cursor:pointer}
.ami-band__drop>button:hover{color:#C9A84C}
.ami-band__menu{display:none;position:absolute;right:0;top:100%;background:#0A1A10;border:1px solid #1A3020;min-width:170px;z-index:60}
.ami-band__drop:hover .ami-band__menu,.ami-band__drop:focus-within .ami-band__menu{display:block}
.ami-band__menu a{display:block;padding:9px 14px}
@media (max-width:860px){.ami-band__inner{flex-wrap:wrap;padding:6px 0}.ami-band__nav{margin-left:0;width:100%}}`;

  function here(href) {
    const f = window.location.pathname.split('/').pop() || 'index.html';
    return f === href;
  }

  function newsBand() {
    const links = SECTIONS.map(function (x) {
      return '<a href="' + P(x.href) + '"' + (here(x.href) ? ' aria-current="page"' : '') + '>' + x.label + '</a>';
    }).join('');
    const regions = REGIONS.map(function (x) {
      return '<a href="' + P(x.href) + '"' + (here(x.href) ? ' aria-current="page"' : '') + '>' + x.label + '</a>';
    }).join('');
    const onRegion = REGIONS.some(function (x) { return here(x.href); });
    return links
      + '<span class="ami-band__drop"><button type="button" aria-haspopup="true" aria-expanded="false"'
      + (onRegion ? ' style="color:#C9A84C"' : '') + '>All Africa ▾</button>'
      + '<div class="ami-band__menu">' + regions + '</div></span>';
  }

  // A product's band links are the product's own nav, read off the page rather
  // than listed here. The Dealroom and the Mailroom both use .dr-header, and
  // their nav is the authority on what pages exist - a hard-coded list here
  // would be a second copy to keep in step, and a chance to invent a link that
  // has no page behind it.
  function productBandLinks() {
    if (!harvested) return '';
    return harvested.links.map(function (x) {
      return '<a href="' + x.href + '"' + (x.on ? ' aria-current="page"' : '') + '>' + x.label + '</a>';
    }).join('');
  }

  // dr-core.js already decides what a signed-in member should see: the account
  // link becomes "Your Deal Room" and the Join link is hidden. It does that by
  // querying '.dr-nav a[href$="create-account.html"]', which no longer exists
  // once the header has been replaced, and it runs after this file because
  // nav.js is loaded first.
  //
  // So the same decision is applied here, one tick later, rather than giving
  // the band a .dr-nav class it would then have to fight the product CSS over.
  // Signed out, the band keeps Join. Signed in, it reads Your interests and
  // goes to the member's own page - which is what the agreed design shows.
  function syncProductNav() {
    const nav = document.querySelector('.ami-band__nav');
    if (!nav) return;
    syncDealroomNav(nav);
    syncMailroomNav(nav);
  }

  function syncDealroomNav(nav) {
    let active = false;
    try { active = !!(window.DR && DR.session && DR.session.active()); } catch (e) { active = false; }
    if (!active) return;
    const join = nav.querySelector('a[href$="create-account.html"]');
    if (!join) return;
    join.textContent = 'Your interests';
    join.setAttribute('href', join.getAttribute('href').replace('create-account.html', 'account.html'));
  }

  // The Mailroom's member pages carry a second navigation, #mr-member-nav,
  // built by build.py and kept hidden until mr-core.js confirms a session.
  // Left alone, a signed-in member got two rows: the band with the visitor's
  // links - How it works, Archive, Sending policy, none of which they need
  // after the first visit - and the member bar underneath it.
  //
  // The agreed design has one row. So when the member bar is showing, its links
  // become the band and the bar itself goes. mr-core.js stays the only thing
  // that decides whether a member is signed in; this reads its answer.
  function syncMailroomNav(nav) {
    const bar = document.getElementById('mr-member-nav');
    if (!bar || bar.hidden) return;
    const links = [].slice.call(bar.querySelectorAll('a'));
    if (!links.length) return;
    const here = window.location.pathname.split('/').pop() || 'index.html';
    nav.innerHTML = links.map(function (a) {
      const h = a.getAttribute('href') || '';
      const on = h.split('/').pop() === here || a.getAttribute('aria-current') === 'page';
      return '<a href="' + h + '"' + (on ? ' aria-current="page"' : '') + '>' + a.textContent.trim() + '</a>';
    }).join('');
    bar.hidden = true;
  }

  function sectionBand() {
    const who = currentProduct();
    const product = PRODUCTS.filter(function (x) { return x.key === who; })[0];
    const name = product ? product.label : 'News';
    const inner = who === 'news' ? newsBand() : productBandLinks();
    return '<div class="ami-band"><div class="ami-band__inner">'
      + '<p class="ami-band__name">' + name + '</p>'
      + '<nav class="ami-band__nav" aria-label="' + name + ' navigation">' + inner + '</nav>'
      + '</div></div>';
  }

  function injectBand() {
    if (document.querySelector('.ami-band')) return;
    if (!document.getElementById('ami-band-css')) {
      const st = document.createElement('style');
      st.id = 'ami-band-css';
      st.textContent = bandCSS;
      document.head.appendChild(st);
    }
    const existing = document.querySelector('.section-nav');
    if (existing) { existing.outerHTML = sectionBand(); return; }
    const row = document.querySelector('.ami-product-row');
    if (row) row.insertAdjacentHTML('afterend', sectionBand());
  }

  // ── Inject nav: replace existing .top-nav or prepend to body ──
  function injectNav() {
    const done = function () { rewriteLinks(document.querySelector('.top-nav')); };
    const existing = document.querySelector('.top-nav');
    if (existing) {
      // Left alone on purpose. Replacing it on 14 October 2026 took out
      // #themeBtn, #visibleAdminBtn, #mastDate, #navHamburger and
      // #marketsDisplay with it. MASTHEAD_CSS hides this bar above 768px, and
      // below that it is the page's real hamburger and drawer, which is what
      // should be there.
      done();
      return;
    }
    if (false) {
    } else {
      const ticker = document.querySelector('.ticker-bar');
      if (ticker) {
        ticker.insertAdjacentHTML('afterend', navHTML);
      } else if (slot) {
        slot.insertAdjacentHTML('beforeend', navHTML);
      } else {
        document.body.insertAdjacentHTML('afterbegin', navHTML);
      }
    }
    done();
  }

  // ── Inject footer ──────────────────────────────────────────
  // One footer everywhere, built by buildFooter(), carrying all of its own
  // styling. The previous version borrowed the publication's footer CSS, which
  // the products do not have, so it rendered as a bare list on white there and
  // needed a measure-and-patch pass. Nothing is borrowed now.
  function injectFooter() {
    if (!document.getElementById('amiFooterCSS')) {
      const st = document.createElement('style');
      st.id = 'amiFooterCSS';
      st.textContent = FOOTER_CSS_BASE;
      document.head.appendChild(st);
    }
    const html = buildFooter();
    const existing = document.querySelector('footer');
    if (existing) existing.outerHTML = html;
    else document.body.insertAdjacentHTML('beforeend', html);
    keepFooterIds(document.querySelector('footer'));
  }

  // index.html line 4785 is getElementById('footerBrand').textContent = name,
  // with no guard, and the same applies to footerAboutDisplay and
  // copyrightDisplay. Those ids were on the old footer's brand and blurb, which
  // this structure does not have. Taking them away threw inside init() and
  // killed the whole page load once already, so they are kept as an off-screen
  // target for the page to write into.
  function keepFooterIds(f) {
    if (!f || document.getElementById('footerBrand')) return;
    const hold = document.createElement('div');
    hold.setAttribute('aria-hidden', 'true');
    hold.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
    hold.innerHTML = '<span id="footerBrand"></span><span id="footerAboutDisplay"></span>'
      + '<span id="copyrightDisplay"></span>';
    f.appendChild(hold);
  }


  // ── Inject verify modal once into body ─────────────────────
  function injectVerifyModal() {
    if (!document.getElementById('amiVerifyOverlay')) {
      document.body.insertAdjacentHTML('beforeend', verifyModalHTML);
    }
  }

  // ── Apply subscriber UI state ──────────────────────────────
  function applySubscriberUI() {
    const btn = document.getElementById('navSubscribeBtn');
    if (!btn) return;
    if (window.amiIsSubscriber) {
      btn.textContent = '✓ Subscribed';
      btn.style.background = '#2E7D4F';
      btn.style.cursor = 'default';
      btn.href = '#';
      btn.onclick = function(e){ e.preventDefault(); };
      // Suppress paywall
      window.amiPaywallSuppressed = true;
      // Dismiss any already-open paywall or first-visit modal
      var pw = document.getElementById('paywallOverlay');
      if (pw) pw.style.display = 'none';
      var pb = document.getElementById('paywallBlur');
      if (pb) pb.style.display = 'none';
      var fv = document.getElementById('fvOverlay');
      if (fv) fv.style.display = 'none';
      localStorage.setItem('amiVisited', '1');
    }
  }

  // ── Restore dark mode preference ───────────────────────────
  function restoreDarkMode() {
    if (localStorage.getItem('amiTheme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      const btn = document.getElementById('themeBtn');
      if (btn) btn.textContent = '☀️';
    }
  }

  // ── Run on DOMContentLoaded ────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  function run() {
    harvestProductHeader();
    ensureTicker();
    injectNav();
    initMasthead();
    injectProducts();
    injectBand();
    initSearch();
    setTimeout(syncProductNav, 0);
    // The Mailroom unhides its member bar once the session resolves, which can
    // be after this tick, so the swap is watched rather than done once.
    const memberBar = document.getElementById('mr-member-nav');
    if (memberBar && window.MutationObserver) {
      new MutationObserver(syncProductNav).observe(memberBar, { attributes: true, attributeFilter: ['hidden'] });
    }
    injectFooter();
    injectVerifyModal();
    applySubscriberUI();
  }

})();

// ═══════════════════════════════════════════════════════════
// SUBSCRIBER VERIFICATION — global functions
// ═══════════════════════════════════════════════════════════

function amiVerifyAccess() {
  if (window.amiIsSubscriber) {
    if (typeof showToast === 'function') {
      showToast('✓ You already have subscriber access!');
    } else {
      alert('You already have subscriber access!');
    }
    return;
  }
  const overlay = document.getElementById('amiVerifyOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    setTimeout(function(){ document.getElementById('amiVerifyEmail').focus(); }, 100);
  }
}

function amiVerifyClose() {
  var overlay = document.getElementById('amiVerifyOverlay');
  if (overlay) overlay.style.display = 'none';
  var form    = document.getElementById('amiVerifyForm');
  var success = document.getElementById('amiVerifySuccess');
  var error   = document.getElementById('amiVerifyError');
  var input   = document.getElementById('amiVerifyEmail');
  var btn     = document.getElementById('amiVerifyBtn');
  if (form)    form.style.display    = '';
  if (success) success.style.display = 'none';
  if (error)   error.style.display   = 'none';
  if (input)   input.value           = '';
  if (btn)     { btn.textContent = 'Verify Subscription →'; btn.disabled = false; }
}

async function amiVerifySubmit() {
  var input = document.getElementById('amiVerifyEmail');
  var btn   = document.getElementById('amiVerifyBtn');
  var error = document.getElementById('amiVerifyError');
  var email = input ? input.value.trim() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (input) input.style.borderColor = '#B85C38';
    return;
  }
  if (input)  input.style.borderColor = '#D4C4A0';
  if (error)  error.style.display     = 'none';
  if (btn)    { btn.textContent = 'Checking…'; btn.disabled = true; }

  try {
    var url  = (typeof SUPABASE_URL  !== 'undefined' ? SUPABASE_URL  : '').replace(/\/$/, '');
    var anon = (typeof SUPABASE_ANON !== 'undefined' ? SUPABASE_ANON : '');

    if (!url || !anon) {
      throw new Error('Supabase config not loaded. Please refresh and try again.');
    }

    var res = await fetch(url + '/rest/v1/rpc/verify_subscriber', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        anon,
        'Authorization': 'Bearer ' + anon
      },
      body: JSON.stringify({ p_email: email })
    });

    if (!res.ok) {
      var errText = await res.text();
      throw new Error('Server error: ' + errText);
    }

    var isPaid = await res.json();

    if (isPaid === true) {
      localStorage.setItem('ami_subscriber', 'true');
      localStorage.setItem('ami_email',      email);
      localStorage.setItem('amiVisited',     '1');
      window.amiIsSubscriber      = true;
      window.amiPaywallSuppressed = true;

      var pw = document.getElementById('paywallOverlay');
      if (pw) pw.style.display = 'none';
      var pb = document.getElementById('paywallBlur');
      if (pb) pb.style.display = 'none';
      var fv = document.getElementById('fvOverlay');
      if (fv) fv.style.display = 'none';

      var form    = document.getElementById('amiVerifyForm');
      var success = document.getElementById('amiVerifySuccess');
      if (form)    form.style.display    = 'none';
      if (success) success.style.display = 'block';

      setTimeout(function(){ window.location.reload(); }, 2000);

    } else {
      if (error) {
        error.textContent = 'We couldn\'t find an active subscription for ' + email + '. If you believe this is an error, please contact us at contact@ami.abta.africa';
        error.style.display = 'block';
      }
      if (btn) { btn.textContent = 'Verify Subscription →'; btn.disabled = false; }
    }

  } catch (e) {
    if (error) {
      error.textContent = 'Could not verify: ' + (e.message || 'Unknown error. Please try again.');
      error.style.display = 'block';
    }
    if (btn) { btn.textContent = 'Verify Subscription →'; btn.disabled = false; }
  }
}

// Close modal when clicking the backdrop
document.addEventListener('click', function(e) {
  var overlay = document.getElementById('amiVerifyOverlay');
  if (overlay && e.target === overlay) amiVerifyClose();
});
