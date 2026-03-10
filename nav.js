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

  // ── Subscriber state (checked before anything renders) ─────
  window.amiIsSubscriber = localStorage.getItem('ami_subscriber') === 'true';

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
        <p style="margin-top:12px">
          <button onclick="amiVerifyAccess()" style="background:none;border:1px solid rgba(201,168,76,.4);color:rgba(201,168,76,.8);font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;cursor:pointer;transition:all .2s" onmouseover="this.style.borderColor='#C9A84C';this.style.color='#C9A84C'" onmouseout="this.style.borderColor='rgba(201,168,76,.4)';this.style.color='rgba(201,168,76,.8)'">Already a subscriber? Verify access →</button>
        </p>
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

  // ── Subscriber verification modal HTML ─────────────────────
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

  // ── Inject nav: replace existing .top-nav or prepend to body ──
  function injectNav() {
    const existing = document.querySelector('.top-nav');
    if (existing) {
      existing.outerHTML = navHTML;
    } else {
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
    injectNav();
    injectFooter();
    injectVerifyModal();
    restoreDarkMode();
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
