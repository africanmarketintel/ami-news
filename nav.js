// ═══════════════════════════════════════════════════════════
// AMI SHARED NAVIGATION — nav.js
// Add <script src="nav.js"></script> to any AMI page and
// this script will inject the correct nav and footer automatically.
// Active page is highlighted based on the current filename.
// ═══════════════════════════════════════════════════════════

(function () {

  // ── Active page detection ──────────────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

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

  // ── Nav HTML ───────────────────────────────────────────────
  const navHTML = `
<nav class="top-nav">
  <div class="nav-left">
    ${navLink('markets.html',    'Markets')}
    ${navLink('politics.html',   'Politics')}
    ${navLink('economy.html',    'Economy')}
    ${navLink('energy.html',     'Energy')}
    ${navLink('technology.html', 'Tech')}
    ${navLink('opinion.html',    'Opinion')}
    ${navLink('archive.html',    'Archive')}
  </div>
  <div class="nav-right">
    <input class="nav-search" type="text" placeholder="Search AMI…" oninput="if(typeof searchArticles==='function') searchArticles(this.value)">
    ${navLinkRight('about.html',      'About')}
    ${navLinkRight('membership.html', 'Membership')}
    ${navLinkRight('contact.html',    'Contact')}
    <button class="dark-toggle" onclick="if(typeof toggleDark==='function') toggleDark()" id="themeBtn">🌙</button>
    <a href="membership.html" id="navSubscribeBtn" class="btn-subscribe">Subscribe</a>
  </div>
</nav>`;

  // ── Footer HTML ────────────────────────────────────────────
  const footerHTML = `
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-brand">African Market Intelligence</div>
        <p class="footer-about">The continent's most trusted source for financial news and business intelligence across Africa's 54 markets.</p>
      </div>
      <div>
        <div class="footer-col-title">Sections</div>
        <ul class="footer-links">
          <li><a href="markets.html">Markets</a></li>
          <li><a href="economy.html">Economy</a></li>
          <li><a href="politics.html">Politics</a></li>
          <li><a href="energy.html">Energy</a></li>
          <li><a href="technology.html">Technology</a></li>
          <li><a href="opinion.html">Opinion</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Regions</div>
        <ul class="footer-links">
          <li><a href="west-africa.html">West Africa</a></li>
          <li><a href="east-africa.html">East Africa</a></li>
          <li><a href="north-africa.html">North Africa</a></li>
          <li><a href="southern-africa.html">Southern Africa</a></li>
        </ul>
      </div>
      <div>
        <div class="footer-col-title">Company</div>
        <ul class="footer-links">
          <li><a href="about.html">About AMI</a></li>
          <li><a href="membership.html">Membership</a></li>
          <li><a href="careers.html">Careers</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="privacy.html">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} African Market Intelligence Ltd. All rights reserved.</span>
      <span>Terms · Privacy · Cookie Policy</span>
    </div>
  </div>
</footer>`;

  // ── Inject nav: replace existing .top-nav or prepend to body ──
  function injectNav() {
    const existing = document.querySelector('.top-nav');
    if (existing) {
      existing.outerHTML = navHTML;
    } else {
      // Insert after ticker bar if present, otherwise at top of body
      const ticker = document.querySelector('.ticker-bar');
      if (ticker) {
        ticker.insertAdjacentHTML('afterend', navHTML);
      } else {
        document.body.insertAdjacentHTML('afterbegin', navHTML);
      }
    }
  }

  // ── Inject footer: replace existing footer or append to body ──
  function injectFooter() {
    const existing = document.querySelector('footer');
    if (existing) {
      existing.outerHTML = footerHTML;
    } else {
      document.body.insertAdjacentHTML('beforeend', footerHTML);
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
    injectNav();
    injectFooter();
    restoreDarkMode();
  }

})();
