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
  // The forced first-visit modal on index.html and article.html only runs when
  // this is true. Off since the newsletter bar replaced it; set true to restore.
  window.AMI_FIRST_VISIT_MODAL = false;

  // ── Nav HTML ───────────────────────────────────────────────
  // nav-left is intentionally empty; section links live in .section-nav below the masthead.
  // nav-right holds only #navSubscribeBtn (hidden by default); login.js injects the
  // Login / Account button immediately after it.
  const navHTML = `
<nav class="top-nav" aria-label="Main navigation">
  <button class="nav-hamburger" aria-label="Open menu" data-ami-act="menu">
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
    <button data-ami-act="verify-close" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:20px;color:#9A8070;cursor:pointer;line-height:1">×</button>
    <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:800;color:#1A1208;margin-bottom:4px">Verify Your Access</div>
    <p style="font-size:13px;color:#6B5344;margin-bottom:20px;line-height:1.6">Enter the email address you used when subscribing to unlock your premium access.</p>
    <div id="amiVerifyForm">
      <input id="amiVerifyEmail" type="email" placeholder="your@email.com" autocomplete="email"
        style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:'DM Mono',monospace;font-size:13px;padding:12px 14px;outline:none;margin-bottom:10px;box-sizing:border-box"
        data-ami-enter="verify-submit">
      <button id="amiVerifyBtn" data-ami-act="verify-submit"
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
footer.ami-foot .ami-foot__legal p.ami-foot__credit,footer.ami-foot .ami-foot__legal p.ami-foot__credit a{font-size:11px}
footer.ami-foot .ami-foot__verify{background:none;border:1px solid #1A1208;color:#1A1208;
  font-family:'DM Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;
  padding:7px 13px;cursor:pointer;margin-top:4px}
footer.ami-foot .ami-foot__verify:hover{background:#FDF6E3}
footer.ami-foot .ami-foot__linkbtn{background:none;border:0;padding:0;margin:0;cursor:pointer;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;
  color:#1A1208;text-decoration:underline;text-underline-offset:2px;text-transform:none;letter-spacing:0}
footer.ami-foot .ami-foot__linkbtn:hover,footer.ami-foot .ami-foot__linkbtn:focus{color:#8C3A1F}
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
      + '<p><button type="button" class="ami-foot__verify" data-ami-act="verify-open">'
      + 'Already a subscriber? Verify access &rarr;</button></p>'
      + '</div>'
      + '</div>'
      + '<div class="ami-foot__rule"></div>'
      + '<div class="ami-foot__legal">'
      + '<p>AMI is operated by African Business Trade Association Limited, a company registered in '
      + 'England and Wales, United Kingdom.</p>'
      + '<p>&copy; ' + new Date().getFullYear() + ' African Business Trade Association Limited. '
      + (GA_MEASUREMENT_ID ? '<button type="button" class="ami-foot__linkbtn" data-ami-act="cookies">Cookie settings</button>' : '')
      + '</p>'
      + '<p class="ami-foot__credit"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates by Exchange Rate API</a></p>'
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
    // Wordmark: the colours stay as each page sets them (dark text, gold second
    // word). On hover or keyboard focus the first words turn green. The second
    // word stays gold. In dark mode a lighter green is used so it stays legible.
    if (!document.getElementById('amiLogoCSS')) {
      const ls = document.createElement('style');
      ls.id = 'amiLogoCSS';
      ls.textContent = '.masthead-name{transition:color .15s}'
        + '.masthead-name:hover,.masthead-name:focus-within{color:#10492A!important}'
        + '[data-theme="dark"] .masthead-name:hover,[data-theme="dark"] .masthead-name:focus-within{color:#4DBA7F!important}'
        + '.masthead-name span,.masthead-name:hover span{color:#C9A84C!important}'
        + '.masthead-name[role="link"]{cursor:pointer}';
      document.head.appendChild(ls);
    }
    // Home and section pages hold the wordmark as plain text. Make it a link to
    // the home page, unless the page editor has made it editable.
    const wm = head.querySelector('.masthead-name');
    if (wm && wm.tagName !== 'A' && !wm.querySelector('a')) {
      wm.setAttribute('role', 'link');
      wm.setAttribute('tabindex', '0');
      const goHome = function () { window.location.href = R + 'index.html'; };
      wm.addEventListener('click', function () { if (!wm.isContentEditable) goHome(); });
      wm.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !wm.isContentEditable) goHome();
      });
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

  // ── Google Analytics (GA4) ─────────────────────────────────
  // The GA4 Measurement ID (Admin > Data streams in Google Analytics). It is
  // public by design. Set to '' to switch analytics off: nothing loads, no
  // cookie notice is shown and no data is sent.
  const GA_MEASUREMENT_ID = 'G-KJWPP1E5DY';

  // Analytics cookies need the visitor's agreement first (UK PECR). Google's
  // script is therefore not requested at all until "Accept" is pressed, and
  // the choice is remembered for 180 days. Advertising features are off.
  // 'opt-in'  : nothing loads until Accept (safest; fewer visitors counted).
  // 'notice'  : loads at once with a notice and a one-click "Turn off". Relies on
  //             the 2025 UK analytics exemption; confirm with the lawyer first,
  //             and visitors in other jurisdictions may still need opt-in.
  const GA_CONSENT_MODEL = 'notice';
  const GA_CHOICE_KEY = 'ami_analytics';
  const GA_CHOICE_DAYS = 180;

  function gaChoice() {
    try {
      const v = JSON.parse(localStorage.getItem(GA_CHOICE_KEY) || 'null');
      if (v && v.until > Date.now() && (v.v === 'granted' || v.v === 'denied')) return v.v;
    } catch (e) { /* storage unavailable */ }
    return null;
  }
  // In 'opt-in' mode nothing may load until a choice is made. In 'notice' mode
  // the notice is information with a way to object, so nothing waits for it.
  function gaNeedsChoice() { return !!GA_MEASUREMENT_ID && GA_CONSENT_MODEL !== 'notice' && gaChoice() === null; }

  function gaLoad() {
    if (!GA_MEASUREMENT_ID || window.__amiGaLoaded) return;
    window.__amiGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    gtag('js', new Date());
    const cfg = { allow_google_signals: false, allow_ad_personalization_signals: false };
    // Dealroom and Mailroom hold member accounts and some links carry tokens in
    // the query string or after the #. Google gets the page path only there.
    if (/\/(dealroom|mailroom)\//.test(window.location.pathname)) {
      cfg.page_location = window.location.origin + window.location.pathname;
      try {
        const ref = document.referrer ? new URL(document.referrer) : null;
        cfg.page_referrer = ref ? ref.origin + ref.pathname : '';
      } catch (e) { cfg.page_referrer = ''; }
    }
    gtag('config', GA_MEASUREMENT_ID, cfg);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);
  }

  // Safe to call anywhere: does nothing unless analytics was accepted.
  window.amiTrack = function (name, params) {
    if (window.__amiGaLoaded && typeof window.gtag === 'function') window.gtag('event', name, params || {});
  };

  function gaSetChoice(v) {
    try {
      localStorage.setItem(GA_CHOICE_KEY, JSON.stringify({ v: v, until: Date.now() + GA_CHOICE_DAYS * 864e5 }));
    } catch (e) { /* ignore */ }
    if (v === 'granted') gaLoad();
    else {
      if (window.__amiGaLoaded && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
      }
      // Remove the Google Analytics cookies already set on this site.
      const host = window.location.hostname;
      const parts = host.split('.');
      const doms = ['', host, '.' + host];
      if (parts.length > 2) doms.push('.' + parts.slice(-2).join('.'));
      document.cookie.split(';').forEach(function (c) {
        const name = c.split('=')[0].trim();
        if (/^_ga/.test(name)) doms.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      });
    }
    const n = document.getElementById('amiCookieNote');
    if (n) n.remove();
    document.body.style.paddingBottom = '';
    document.dispatchEvent(new CustomEvent('ami:consent'));
  }

  const GA_CSS = `
.ami-cookie{position:fixed;left:0;right:0;bottom:0;z-index:950;background:#FAF7F0;color:#1A1208;
  border-top:3px solid #C9A84C;box-shadow:0 -2px 12px rgba(0,0,0,.18);box-sizing:border-box;
  padding:14px max(16px,calc((100% - 1280px)/2 + 24px));display:flex;gap:16px;align-items:center;flex-wrap:wrap;
  font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.ami-cookie p{margin:0;flex:1 1 360px;max-width:75ch}
.ami-cookie a{color:#1E6B3C}
.ami-cookie button{min-height:44px;padding:0 22px;border-radius:2px;cursor:pointer;
  font:500 12px 'DM Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;border:2px solid #0A1A10}
.ami-cookie .ok{background:#0A1A10;color:#FAF7F0}
.ami-cookie .no{background:#fff;color:#0A1A10}`;

  function showCookieNote() {
    if (!GA_MEASUREMENT_ID || gaChoice() !== null || document.getElementById('amiCookieNote')) return;
    if (!document.getElementById('amiCookieCSS')) {
      const st = document.createElement('style');
      st.id = 'amiCookieCSS';
      st.textContent = GA_CSS;
      document.head.appendChild(st);
    }
    const n = document.createElement('div');
    n.id = 'amiCookieNote';
    n.className = 'ami-cookie';
    n.setAttribute('role', 'region');
    n.setAttribute('aria-label', 'Analytics cookies');
    const notice = GA_CONSENT_MODEL === 'notice';
    n.innerHTML = '<p>' + (notice
        ? 'AMI uses analytics to help improve the site. '
        : 'AMI would like to use analytics cookies to help improve the site. ')
      + '<a href="' + R + 'privacy.html#analytics">Privacy</a></p>'
      + '<button type="button" class="ok">' + (notice ? 'OK' : 'Accept') + '</button>'
      + '<button type="button" class="no">' + (notice ? 'Turn off' : 'Decline') + '</button>';
    n.querySelector('.ok').addEventListener('click', function () { gaSetChoice('granted'); });
    n.querySelector('.no').addEventListener('click', function () { gaSetChoice('denied'); });
    document.body.appendChild(n);
    document.body.style.paddingBottom = n.offsetHeight + 'px';
  }

  // Page buttons built here use data attributes, not inline onclick. The
  // Dealroom and Mailroom pages carry a Content Security Policy that blocks
  // inline handlers, so one listener on the document serves every page.
  document.addEventListener('click', function (e) {
    const t = e.target && e.target.closest ? e.target.closest('[data-ami-act]') : null;
    if (!t) return;
    const act = t.getAttribute('data-ami-act');
    if (act === 'menu') { if (typeof toggleMobileNav === 'function') toggleMobileNav(); }
    else if (act === 'verify-open') { if (typeof amiVerifyAccess === 'function') amiVerifyAccess(); }
    else if (act === 'verify-close') { if (typeof amiVerifyClose === 'function') amiVerifyClose(); }
    else if (act === 'verify-submit') { if (typeof amiVerifySubmit === 'function') amiVerifySubmit(); }
    else if (act === 'cookies') { if (typeof window.amiCookieSettings === 'function') window.amiCookieSettings(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.getAttribute && e.target.getAttribute('data-ami-enter') === 'verify-submit') {
      if (typeof amiVerifySubmit === 'function') amiVerifySubmit();
    }
  });

  window.amiCookieSettings = function () {
    try { localStorage.removeItem(GA_CHOICE_KEY); } catch (e) { /* ignore */ }
    showCookieNote();
  };

  function initAnalytics() {
    if (!GA_MEASUREMENT_ID) return;
    const c = gaChoice();
    if (c === 'denied') return;
    if (c === 'granted') { gaLoad(); return; }
    if (GA_CONSENT_MODEL === 'notice') gaLoad();
    showCookieNote();
  }

  // ── Market strip (one strip, every page) ───────────────────
  // Every page carries the same strip: eight currencies against the US dollar
  // from open.er-api.com, with the source and update time shown. Pages used to
  // build their own (index markets from the database, then FX after 1.2 s;
  // article and deals never filled in). A hidden #tickerInner is kept so those
  // page scripts still find their element and write to nothing visible.
  // The free ExchangeRate-API tier requires attribution, which the label gives.
  const STRIP_CCY = ['UGX', 'ETB', 'NGN', 'ZAR', 'KES', 'EGP', 'GHS', 'TZS'];
  const STRIP_KEY = 'ami_fx_v1';
  const STRIP_FRESH = 6 * 36e5;
  const STRIP_STALE = 48 * 36e5;

  const STRIP_CSS = `
html body .ami-strip{display:flex !important;align-items:center;gap:0;height:32px !important;box-sizing:border-box !important;
  background:#0A1A10 !important;color:#C9A84C !important;border:0 !important;margin:0 !important;
  padding:0 max(24px,calc((100% - 1280px)/2 + 24px)) !important;overflow:hidden !important;white-space:nowrap !important;
  font:500 11.5px/1 'DM Mono',ui-monospace,monospace !important;letter-spacing:.03em !important}
html body .ami-strip[hidden]{display:none !important}
.ami-strip__list{display:flex;align-items:center;gap:22px;overflow-x:auto;scrollbar-width:none;flex:1 1 auto;min-width:0;height:100%}
.ami-strip__list::-webkit-scrollbar{display:none}
.ami-strip__i b{font-weight:600;color:#E3C677;margin-right:6px}
.ami-strip__lead{flex:0 0 auto;color:#9aa89e;font-size:10px}
.ami-strip__i{flex:0 0 auto}
.ami-strip__src{flex:0 0 auto;margin-left:auto;color:#9aa89e;font-size:10px}
.ami-strip__src a{color:#9aa89e;text-decoration:underline}
@media (max-width:900px){html body .ami-strip{padding:0 16px !important}}`;

  function stripFmt(n) {
    return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function stripRender(el, d) {
    const list = el.querySelector('.ami-strip__list');
    const items = STRIP_CCY.filter(function (c) { return d.rates && d.rates[c] > 0; });
    if (!items.length) { el.hidden = true; return; }
    list.innerHTML = '<span class="ami-strip__lead">Per US$1</span>' + items.map(function (c) {
      return '<span class="ami-strip__i"><b>' + c + '</b>' + stripFmt(d.rates[c]) + '</span>';
    }).join('');
    let when = '';
    if (d.upd) {
      const t = new Date(d.upd);
      if (!isNaN(t)) {
        when = t.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
      }
    }
    if (when) list.insertAdjacentHTML('beforeend', '<span class="ami-strip__src">' + when + '</span>');
    el.hidden = false;
  }

  function stripMount() {
    if (!document.getElementById('amiStripCSS')) {
      const st = document.createElement('style');
      st.id = 'amiStripCSS';
      st.textContent = STRIP_CSS;
      document.head.appendChild(st);
    }
    const found = [].slice.call(document.querySelectorAll('.ticker-bar'));
    let el = found.shift() || document.querySelector('.ami-ticker');
    found.forEach(function (x) { x.parentNode && x.parentNode.removeChild(x); });
    const created = !el;
    if (created) {
      el = document.createElement('div');
      if (slot) slot.appendChild(el);
      else document.body.insertAdjacentElement('afterbegin', el);
    }
    el.className = (created ? 'ami-ticker ' : 'ticker-bar ') + 'ami-strip';
    el.removeAttribute('style');
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Exchange rates against the US dollar');
    el.innerHTML = '<span id="tickerInner" hidden aria-hidden="true"></span>'
      + '<div class="ami-strip__list"></div>';
    return el;
  }

  function stripLoad(el) {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(STRIP_KEY) || 'null'); } catch (e) { /* ignore */ }
    const age = cached ? Date.now() - cached.t : Infinity;
    if (cached && age < STRIP_FRESH) { stripRender(el, cached); return; }
    if (cached && age < STRIP_STALE) stripRender(el, cached);
    else el.hidden = true;
    fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
      .then(function (j) {
        if (!j || j.result === 'error' || !j.rates) throw new Error('no rates');
        const keep = { t: Date.now(), upd: j.time_last_update_utc || '', rates: {} };
        STRIP_CCY.forEach(function (c) { if (j.rates[c] > 0) keep.rates[c] = j.rates[c]; });
        try { localStorage.setItem(STRIP_KEY, JSON.stringify(keep)); } catch (e) { /* ignore */ }
        stripRender(el, keep);
      })
      .catch(function () { /* keeps cached figures if under 48 hours old, otherwise stays hidden */ });
  }

  function ensureTicker() {
    stripLoad(stripMount());
  }

  // ── Newsletter bar ─────────────────────────────────────────
  // A slim, non-modal bar at the foot of the screen on editorial pages only.
  // Shown on the first of: 50% of the page scrolled, or 20 seconds with the
  // tab in view. On a return visit (a new browser session) it shows after
  // 5 seconds. Never shown to anyone who has signed up, anyone who closed it
  // in the last 30 days, or when the sign-up could not be saved. Closing it
  // does not set any subscriber flag, so paywall behaviour is untouched.
  const BAR_PAGES = /^(index|economy|markets|energy|politics|technology|opinion|east-africa|west-africa|north-africa|southern-africa|central-africa|article)$/;
  const BAR_SECONDS_FIRST = 20;
  const BAR_SECONDS_RETURN = 5;
  const BAR_SCROLL_SHARE = 0.5;
  const BAR_SNOOZE_DAYS = 30;
  const BAR_REQUIRE_CONSENT = true;
  const BAR_UNTIL_KEY = 'ami_bar_until';
  const BAR_JOINED_KEY = 'ami_newsletter_joined';

  const BAR_CSS = `
.ami-bar{position:fixed;left:0;right:0;bottom:0;z-index:900;background:#0A1A10;color:#FAF7F0;
  border-top:3px solid #C9A84C;box-sizing:border-box;padding:12px max(16px,calc((100% - 1280px)/2 + 24px));
  font:15px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.ami-bar[hidden]{display:none}
.ami-bar__row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.ami-bar__msg{flex:1 1 240px;margin:0;max-width:60ch}
.ami-bar__msg b{font-family:'Playfair Display',Georgia,serif;font-size:17px}
.ami-bar form{display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex:1 1 420px;margin:0}
.ami-bar input[type=email]{flex:1 1 220px;min-width:0;height:44px;border:2px solid #C9A84C;border-radius:2px;padding:0 12px;
  font-size:16px;background:#fff;color:#1A1208}
.ami-bar button[type=submit]{height:44px;padding:0 22px;border:0;border-radius:2px;background:#C9A84C;color:#0A1A10;cursor:pointer;
  font:600 12px 'DM Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
.ami-bar button[disabled]{opacity:.6;cursor:default}
.ami-bar__consent{flex:1 0 100%;display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#d9d3c3;margin:0}
.ami-bar__consent input{width:20px;height:20px;margin:1px 0 0;accent-color:#C9A84C;flex:0 0 auto}
.ami-bar__consent a,.ami-bar a{color:#E3C677}
.ami-bar__close{background:none;border:0;color:#FAF7F0;cursor:pointer;min-width:44px;min-height:44px;padding:0 8px;
  font-size:15px;text-decoration:underline}
.ami-bar__status{flex:1 0 100%;margin:0;font-size:14px;min-height:0}
.ami-bar__status:empty{display:none}
.ami-bar__status.err{color:#ffb4a8}
.ami-bar input:focus-visible,.ami-bar button:focus-visible,.ami-bar a:focus-visible{outline:3px solid #fff;outline-offset:2px}
@media (max-width:620px){.ami-bar{padding:10px 16px}.ami-bar__msg b{font-size:16px}}`;

  function barFile() {
    const f = (window.location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    return f || 'index';
  }

  function barSignedUp() {
    try {
      return !!(localStorage.getItem('ami_subscriber') || localStorage.getItem('amiVisited')
        || localStorage.getItem('ami_email') || localStorage.getItem(BAR_JOINED_KEY));
    } catch (e) { return true; }
  }

  function barSnoozed() {
    try { return Number(localStorage.getItem(BAR_UNTIL_KEY) || 0) > Date.now(); } catch (e) { return true; }
  }

  function barIsReturn() {
    // A visit is a browser session. The first page of a session adds one.
    try {
      let n = Number(localStorage.getItem('ami_visits') || 0);
      if (!sessionStorage.getItem('ami_visit_counted')) {
        n += 1;
        localStorage.setItem('ami_visits', String(n));
        sessionStorage.setItem('ami_visit_counted', '1');
      }
      return n >= 2;
    } catch (e) { return false; }
  }

  function initBar() {
    if (!BAR_PAGES.test(barFile())) return;
    if (!sbReady() || window.amiIsSubscriber || barSignedUp() || barSnoozed()) return;
    const returning = barIsReturn();
    const needSeconds = returning ? BAR_SECONDS_RETURN : BAR_SECONDS_FIRST;
    let seen = 0;
    let shown = false;
    let bar = null;

    function trySlow() {
      if (shown || gaNeedsChoice()) return false;
      if (document.getElementById('fvOverlay') && document.getElementById('fvOverlay').style.display === 'flex') return false;
      return true;
    }

    function show() {
      if (shown || !trySlow()) return;
      shown = true;
      stop();
      const st = document.createElement('style');
      st.textContent = BAR_CSS;
      document.head.appendChild(st);
      bar = document.createElement('div');
      bar.className = 'ami-bar';
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Newsletter sign-up');
      bar.innerHTML = '<div class="ami-bar__row">'
        + '<p class="ami-bar__msg"><b>The AMI newsletter.</b> African markets, trade and economic news by email.</p>'
        + '<form novalidate>'
        + '<label for="amiBarEmail" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Email address</label>'
        + '<input id="amiBarEmail" type="email" name="email" autocomplete="email" placeholder="Email address" required>'
        + '<button type="submit">Subscribe</button>'
        + (BAR_REQUIRE_CONSENT
          ? '<label class="ami-bar__consent"><input type="checkbox" id="amiBarConsent"><span>I agree to receive the AMI newsletter by email. '
            + 'See the <a href="' + R + 'privacy.html">privacy policy</a>. You can unsubscribe at any time.</span></label>'
          : '')
        + '<p class="ami-bar__status" role="status" aria-live="polite"></p>'
        + '</form>'
        + '<button type="button" class="ami-bar__close" aria-label="Close newsletter sign-up">Close</button>'
        + '</div>';
      document.body.appendChild(bar);
      const note = document.getElementById('amiCookieNote');
      if (note) bar.style.bottom = note.offsetHeight + 'px';
      document.body.style.paddingBottom = (bar.offsetHeight + (note ? note.offsetHeight : 0)) + 'px';
      window.amiTrack('newsletter_bar_shown', { trigger: returning ? 'return_visit' : 'first_visit' });

      const form = bar.querySelector('form');
      const status = bar.querySelector('.ami-bar__status');
      bar.querySelector('.ami-bar__close').addEventListener('click', function () { close(true); });
      bar.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = form.email.value.trim();
        status.className = 'ami-bar__status';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          status.className = 'ami-bar__status err';
          status.textContent = 'Enter a valid email address.';
          form.email.focus();
          return;
        }
        if (BAR_REQUIRE_CONSENT && !bar.querySelector('#amiBarConsent').checked) {
          status.className = 'ami-bar__status err';
          status.textContent = 'Tick the box to agree to receive the newsletter.';
          return;
        }
        const btn = form.querySelector('button[type=submit]');
        btn.disabled = true;
        status.textContent = 'Subscribing…';
        const token = (typeof AUTH_TOKEN === 'string' && AUTH_TOKEN) ? AUTH_TOKEN : SUPABASE_ANON;
        fetch(SUPABASE_URL + '/rest/v1/subscribers', {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON, Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json', Prefer: 'return=minimal'
          },
          body: JSON.stringify({ email: email, source: 'slim_bar', subscribed_at: new Date().toISOString() })
        }).then(function (r) {
          return r.ok ? '' : r.text();
        }).then(function (err) {
          if (err && err.indexOf('23505') === -1) throw new Error(err);
          try { localStorage.setItem(BAR_JOINED_KEY, '1'); } catch (x) { /* ignore */ }
          window.amiTrack('newsletter_signup', { method: 'slim_bar' });
          status.textContent = err ? 'This address is already subscribed.' : 'Thank you. You are subscribed.';
          form.querySelectorAll('input,button').forEach(function (x) { x.disabled = true; });
          setTimeout(function () { close(false); }, 4000);
        }).catch(function () {
          btn.disabled = false;
          status.className = 'ami-bar__status err';
          status.textContent = 'The sign-up could not be saved. Try again in a moment.';
        });
      });
    }

    function close(remember) {
      if (!bar) return;
      if (remember) {
        try { localStorage.setItem(BAR_UNTIL_KEY, String(Date.now() + BAR_SNOOZE_DAYS * 864e5)); } catch (e) { /* ignore */ }
        window.amiTrack('newsletter_bar_closed');
      }
      bar.remove();
      bar = null;
      document.body.style.paddingBottom = '';
    }

    // Time counts only while the tab is in view.
    const timer = setInterval(function () {
      if (document.visibilityState === 'visible') seen += 1;
      if (seen >= needSeconds) show();
    }, 1000);

    function onScroll() {
      const h = document.documentElement.scrollHeight;
      if (h < window.innerHeight * 1.5) return; // short page: scroll share means nothing
      if ((window.scrollY + window.innerHeight) / h >= BAR_SCROLL_SHARE) show();
    }
    function stop() {
      clearInterval(timer);
      window.removeEventListener('scroll', onScroll);
    }
    if (!returning) window.addEventListener('scroll', onScroll, { passive: true });
    // If the cookie choice is made after a trigger already passed, show then.
    document.addEventListener('ami:consent', function () {
      if (bar) { bar.style.bottom = '0'; document.body.style.paddingBottom = bar.offsetHeight + 'px'; }
      else if (!shown && seen >= needSeconds) show();
    });
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

  // A page with no chrome of its own - privacy.html is the one - takes all four
  // tiers from here. ensureTicker() runs first and inserts at the top of body,
  // then the masthead, product row and band are inserted above it, so the
  // ticker finishes below the band instead of on top. This puts it back.
  // Guarded on the ticker being a direct child of body: on a page that has its
  // own chrome the ticker sits inside that wrapper and must not be moved.
  function liftTicker() {
    const t = document.querySelector('.ami-ticker');
    if (!t || t.parentNode !== document.body) return;
    const first = document.body.firstElementChild;
    if (first && first !== t) document.body.insertBefore(t, first);
  }

  function run() {
    harvestProductHeader();
    ensureTicker();
    injectNav();
    initMasthead();
    injectProducts();
    injectBand();
    liftTicker();
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
    initAnalytics();
    initBar();
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
