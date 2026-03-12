// ═══════════════════════════════════════════════════════════════════
// AMI LOGIN  —  login.js
// Replaces the "Deal Tracker" / "Subscribe" nav button with a
// subscriber login for premium paying members.
//
// Flow:
//   1. Subscriber pays via Stripe → email lands in Supabase subscribers table
//   2. First visit: click "Login" → "Set Up Account" tab → choose password
//   3. Subsequent visits: click "Login" → Sign In with email + password
//   4. On success: session stored in localStorage, paywall suppressed
//
// Requires config.js to be loaded first (SUPABASE_URL + SUPABASE_ANON).
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Config helpers ──────────────────────────────────────────────
  function sbUrl()  { return (typeof SUPABASE_URL  !== 'undefined' ? SUPABASE_URL  : '').replace(/\/$/, ''); }
  function sbAnon() { return (typeof SUPABASE_ANON !== 'undefined' ? SUPABASE_ANON : ''); }

  // ── Session helpers ─────────────────────────────────────────────
  function getSession() {
    return {
      token:   localStorage.getItem('ami_auth_token')    || '',
      refresh: localStorage.getItem('ami_refresh_token') || '',
      email:   localStorage.getItem('ami_user_email')    || '',
      expires: parseInt(localStorage.getItem('ami_token_expires') || '0', 10),
    };
  }

  function saveSession(data) {
    const email = (data.user && data.user.email) ? data.user.email : getSession().email;
    localStorage.setItem('ami_auth_token',    data.access_token  || '');
    localStorage.setItem('ami_refresh_token', data.refresh_token || '');
    localStorage.setItem('ami_user_email',    email);
    localStorage.setItem('ami_token_expires', String(Date.now() + (data.expires_in || 3600) * 1000));
    localStorage.setItem('ami_subscriber',    'true');
    localStorage.setItem('ami_email',         email);
    window.amiIsSubscriber      = true;
    window.amiPaywallSuppressed = true;
  }

  function clearSession() {
    ['ami_auth_token', 'ami_refresh_token', 'ami_user_email', 'ami_token_expires',
     'ami_subscriber', 'ami_email'].forEach(function (k) { localStorage.removeItem(k); });
    window.amiIsSubscriber      = false;
    window.amiPaywallSuppressed = false;
  }

  function isLoggedIn() {
    var s = getSession();
    return !!(s.token && s.email && s.expires > Date.now());
  }

  function getInitials(email) {
    return (email || '??').slice(0, 2).toUpperCase();
  }

  // ── Supabase Auth REST calls ────────────────────────────────────
  async function sbSignIn(email, password) {
    var r = await fetch(sbUrl() + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': sbAnon() },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await r.json();
    if (!r.ok) throw new Error(data.error_description || data.msg || data.error || 'Sign in failed');
    return data;
  }

  async function sbSignUp(email, password) {
    var r = await fetch(sbUrl() + '/auth/v1/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': sbAnon() },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await r.json();
    if (!r.ok) throw new Error(data.error_description || data.msg || data.error || 'Sign up failed');
    return data;
  }

  async function sbRecover(email) {
    var r = await fetch(sbUrl() + '/auth/v1/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': sbAnon() },
      body: JSON.stringify({ email: email })
    });
    if (!r.ok) {
      var d = await r.json();
      throw new Error(d.error_description || d.msg || 'Could not send reset email');
    }
  }

  async function sbRefresh(refreshToken) {
    var r = await fetch(sbUrl() + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': sbAnon() },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    var data = await r.json();
    if (!r.ok) throw new Error('Token refresh failed');
    return data;
  }

  async function sbUpdatePassword(token, newPassword) {
    var r = await fetch(sbUrl() + '/auth/v1/user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': sbAnon(),
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ password: newPassword })
    });
    if (!r.ok) {
      var d = await r.json();
      throw new Error(d.error_description || d.msg || 'Password update failed');
    }
  }

  async function sbSignOut(token) {
    try {
      await fetch(sbUrl() + '/auth/v1/logout', {
        method: 'POST',
        headers: { 'apikey': sbAnon(), 'Authorization': 'Bearer ' + token }
      });
    } catch (e) { /* best-effort */ }
  }

  async function checkSubscriberStatus(email, token) {
    var r = await fetch(sbUrl() + '/rest/v1/rpc/verify_subscriber', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': sbAnon(),
        'Authorization': 'Bearer ' + (token || sbAnon())
      },
      body: JSON.stringify({ p_email: email })
    });
    if (!r.ok) return false;
    return await r.json(); // true or false
  }

  // ── Refresh expired session ─────────────────────────────────────
  async function tryRefreshSession() {
    var s = getSession();
    if (!s.refresh) return false;
    if (s.token && s.expires > Date.now() + 60000) return true; // still valid
    try {
      var data = await sbRefresh(s.refresh);
      saveSession(data);
      return true;
    } catch (e) {
      clearSession();
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MODAL HTML
  // ═══════════════════════════════════════════════════════════════
  var MODAL_HTML = [
    '<div id="amiLoginOverlay" style="display:none;position:fixed;inset:0;background:rgba(6,15,9,.87);z-index:10000;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(5px)" onclick="if(event.target===this)window.amiCloseLogin()">',
    '<div style="background:#FAF7F0;max-width:430px;width:100%;border-top:4px solid #C9A84C;box-shadow:0 24px 80px rgba(0,0,0,.55);font-family:\'Spectral\',Georgia,serif;position:relative;max-height:90vh;overflow-y:auto">',

    // Close button
    '<button onclick="window.amiCloseLogin()" aria-label="Close" style="position:sticky;top:0;float:right;margin:12px 14px 0 0;background:none;border:none;font-size:22px;color:#9A8070;cursor:pointer;line-height:1;z-index:2">×</button>',

    // Header
    '<div style="padding:28px 32px 0;clear:right">',
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">',
        '<div style="width:3px;height:28px;background:#C9A84C;flex-shrink:0"></div>',
        '<div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:#1A1208">Subscriber Login</div>',
      '</div>',
      '<p style="font-size:13px;color:#6B5344;line-height:1.6;margin:0 0 0 13px">Premium access for African Market Intelligence subscribers.</p>',
    '</div>',

    // Tabs
    '<div style="display:flex;border-bottom:1px solid #D4C4A0;margin-top:20px;padding:0 32px">',
      '<button id="amiTabSignIn" onclick="window.amiSwitchTab(\'signin\')" style="font-family:\'DM Mono\',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:10px 0;margin-right:24px;border:none;background:none;cursor:pointer;color:#C9A84C;border-bottom:2px solid #C9A84C;font-weight:600;transition:color .2s">Sign In</button>',
      '<button id="amiTabSetup" onclick="window.amiSwitchTab(\'setup\')" style="font-family:\'DM Mono\',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:10px 0;border:none;background:none;cursor:pointer;color:#9A8070;border-bottom:2px solid transparent;font-weight:400;transition:color .2s">Set Up Account</button>',
    '</div>',

    // ── Sign In panel ──
    '<div id="amiPanelSignIn" style="padding:24px 32px 32px">',
      '<div style="margin-bottom:14px">',
        '<label style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B5344;display:block;margin-bottom:6px">Email Address</label>',
        '<input id="amiSubEmail" type="email" placeholder="your@email.com" autocomplete="email" style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:\'DM Mono\',monospace;font-size:13px;padding:12px 14px;outline:none;box-sizing:border-box;transition:border-color .2s" onkeydown="if(event.key===\'Enter\')document.getElementById(\'amiSubPassword\').focus()" onfocus="this.style.borderColor=\'#C9A84C\'" onblur="this.style.borderColor=\'#D4C4A0\'">',
      '</div>',
      '<div style="margin-bottom:6px">',
        '<label style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B5344;display:block;margin-bottom:6px">Password</label>',
        '<input id="amiSubPassword" type="password" placeholder="••••••••" autocomplete="current-password" style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:\'DM Mono\',monospace;font-size:13px;padding:12px 14px;outline:none;box-sizing:border-box;transition:border-color .2s" onkeydown="if(event.key===\'Enter\')window.amiDoSignIn()" onfocus="this.style.borderColor=\'#C9A84C\'" onblur="this.style.borderColor=\'#D4C4A0\'">',
      '</div>',
      '<div style="text-align:right;margin-bottom:18px;margin-top:6px">',
        '<button onclick="window.amiSwitchTab(\'reset\')" style="background:none;border:none;font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.06em;color:#C9A84C;cursor:pointer;padding:0;text-decoration:underline">Forgot password?</button>',
      '</div>',
      '<button id="amiSignInBtn" onclick="window.amiDoSignIn()" style="width:100%;background:#C9A84C;color:#060F09;font-family:\'DM Mono\',monospace;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:13px;border:none;cursor:pointer;transition:background .2s" onmouseover="this.style.background=\'#D4B86A\'" onmouseout="this.style.background=\'#C9A84C\'">Sign In →</button>',
      '<div id="amiSignInError" style="display:none;background:#FFF0ED;border-left:3px solid #B85C38;padding:10px 14px;margin-top:12px;font-family:\'DM Mono\',monospace;font-size:11px;color:#8C3A1F;line-height:1.5"></div>',
      '<p style="text-align:center;margin-top:16px;font-size:12px;color:#9A8070;font-family:\'DM Mono\',monospace">First time here? <button onclick="window.amiSwitchTab(\'setup\')" style="background:none;border:none;font-family:\'DM Mono\',monospace;font-size:12px;color:#C9A84C;cursor:pointer;padding:0;text-decoration:underline">Set up your account →</button></p>',
    '</div>',

    // ── Set Up Account panel ──
    '<div id="amiPanelSetup" style="display:none;padding:24px 32px 32px">',
      // Welcome banner — shown only when arriving from Stripe success URL (?setup=1)
      '<div id="amiSetupWelcome" style="display:none;background:#F0FFF5;border:1px solid #A8D8B9;border-left:4px solid #2E7D4F;padding:14px 16px;margin-bottom:18px;font-family:\'DM Mono\',monospace;font-size:12px;color:#1A4D2E;line-height:1.6">',
        '<div style="font-weight:700;font-size:13px;margin-bottom:4px">Payment confirmed — welcome to AMI Premium!</div>',
        'Create your login password below so you can access your subscription on any device.',
      '</div>',
      '<div id="amiSetupInfoBanner" style="background:#F5F0E8;border-left:3px solid #C9A84C;padding:10px 14px;margin-bottom:18px;font-family:\'DM Mono\',monospace;font-size:11px;color:#6B5344;line-height:1.5">Use the email address you used to pay via Stripe. If you haven\'t subscribed yet, <a href="membership.html" style="color:#C9A84C">get membership here →</a></div>',
      '<div style="margin-bottom:14px">',
        '<label style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B5344;display:block;margin-bottom:6px">Subscription Email</label>',
        '<input id="amiSetupEmail" type="email" placeholder="your@email.com" autocomplete="email" style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:\'DM Mono\',monospace;font-size:13px;padding:12px 14px;outline:none;box-sizing:border-box;transition:border-color .2s" onfocus="this.style.borderColor=\'#C9A84C\'" onblur="this.style.borderColor=\'#D4C4A0\'">',
      '</div>',
      '<div style="margin-bottom:14px">',
        '<label style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B5344;display:block;margin-bottom:6px">Choose Password</label>',
        '<input id="amiSetupPassword" type="password" placeholder="Min. 8 characters" autocomplete="new-password" style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:\'DM Mono\',monospace;font-size:13px;padding:12px 14px;outline:none;box-sizing:border-box;transition:border-color .2s" onfocus="this.style.borderColor=\'#C9A84C\'" onblur="this.style.borderColor=\'#D4C4A0\'">',
      '</div>',
      '<div style="margin-bottom:20px">',
        '<label style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B5344;display:block;margin-bottom:6px">Confirm Password</label>',
        '<input id="amiSetupConfirm" type="password" placeholder="Repeat password" autocomplete="new-password" style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:\'DM Mono\',monospace;font-size:13px;padding:12px 14px;outline:none;box-sizing:border-box;transition:border-color .2s" onkeydown="if(event.key===\'Enter\')window.amiDoSetup()" onfocus="this.style.borderColor=\'#C9A84C\'" onblur="this.style.borderColor=\'#D4C4A0\'">',
      '</div>',
      '<button id="amiSetupBtn" onclick="window.amiDoSetup()" style="width:100%;background:#C9A84C;color:#060F09;font-family:\'DM Mono\',monospace;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:13px;border:none;cursor:pointer;transition:background .2s" onmouseover="this.style.background=\'#D4B86A\'" onmouseout="this.style.background=\'#C9A84C\'">Create Account →</button>',
      '<div id="amiSetupError"   style="display:none;background:#FFF0ED;border-left:3px solid #B85C38;padding:10px 14px;margin-top:12px;font-family:\'DM Mono\',monospace;font-size:11px;color:#8C3A1F;line-height:1.5"></div>',
      '<div id="amiSetupSuccess" style="display:none;background:#F0FFF5;border-left:3px solid #2E7D4F;padding:10px 14px;margin-top:12px;font-family:\'DM Mono\',monospace;font-size:11px;color:#1A4D2E;line-height:1.5"></div>',
    '</div>',

    // ── Reset Password panel ──
    '<div id="amiPanelReset" style="display:none;padding:24px 32px 32px">',
      '<p style="font-size:13px;color:#6B5344;line-height:1.6;margin-bottom:18px">Enter your subscription email and we\'ll send you a link to set a new password.</p>',
      '<div style="margin-bottom:18px">',
        '<label style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B5344;display:block;margin-bottom:6px">Email Address</label>',
        '<input id="amiResetEmail" type="email" placeholder="your@email.com" autocomplete="email" style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:\'DM Mono\',monospace;font-size:13px;padding:12px 14px;outline:none;box-sizing:border-box;transition:border-color .2s" onkeydown="if(event.key===\'Enter\')window.amiDoReset()" onfocus="this.style.borderColor=\'#C9A84C\'" onblur="this.style.borderColor=\'#D4C4A0\'">',
      '</div>',
      '<button id="amiResetBtn" onclick="window.amiDoReset()" style="width:100%;background:#C9A84C;color:#060F09;font-family:\'DM Mono\',monospace;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:13px;border:none;cursor:pointer;transition:background .2s" onmouseover="this.style.background=\'#D4B86A\'" onmouseout="this.style.background=\'#C9A84C\'">Send Reset Link →</button>',
      '<button onclick="window.amiSwitchTab(\'signin\')" style="display:block;margin:12px auto 0;background:none;border:none;font-family:\'DM Mono\',monospace;font-size:11px;letter-spacing:.06em;color:#9A8070;cursor:pointer;text-decoration:underline">← Back to Sign In</button>',
      '<div id="amiResetError"   style="display:none;background:#FFF0ED;border-left:3px solid #B85C38;padding:10px 14px;margin-top:12px;font-family:\'DM Mono\',monospace;font-size:11px;color:#8C3A1F;line-height:1.5"></div>',
      '<div id="amiResetSuccess" style="display:none;background:#F0FFF5;border-left:3px solid #2E7D4F;padding:10px 14px;margin-top:12px;font-family:\'DM Mono\',monospace;font-size:11px;color:#1A4D2E;line-height:1.5"></div>',
    '</div>',

    '</div></div>'
  ].join('');

  // ═══════════════════════════════════════════════════════════════
  // NAV BUTTON INJECTION
  // ═══════════════════════════════════════════════════════════════

  function injectLoginButton() {
    var existing = document.getElementById('navSubscribeBtn');
    if (!existing) return;

    // Hide original (keep in DOM so existing page scripts don't crash)
    existing.style.display = 'none';

    var sess = getSession();

    if (isLoggedIn()) {
      // ── Logged-in: show Account button with dropdown ──
      var initials  = getInitials(sess.email);
      var shortMail = sess.email.length > 24 ? sess.email.slice(0, 22) + '…' : sess.email;

      var wrapper = document.createElement('div');
      wrapper.id = 'amiAccountWrapper';
      wrapper.style.cssText = 'position:relative;display:inline-flex;align-items:center';
      wrapper.innerHTML = [
        '<button id="amiAccountBtn" onclick="window.amiToggleAccountMenu(event)" aria-haspopup="true" aria-expanded="false"',
        ' style="background:#2E7D4F;color:#fff;font-family:\'DM Mono\',monospace;font-size:11px;font-weight:600;',
        'letter-spacing:.08em;text-transform:uppercase;padding:7px 13px;border-radius:2px;border:none;cursor:pointer;',
        'display:flex;align-items:center;gap:8px;transition:background .2s;white-space:nowrap"',
        ' onmouseover="this.style.background=\'#3E9D5F\'" onmouseout="this.style.background=\'#2E7D4F\'">',
          '<span style="width:22px;height:22px;background:rgba(255,255,255,.22);border-radius:50%;display:inline-flex;',
          'align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">' + initials + '</span>',
          'Account <span style="font-size:9px;opacity:.7">▾</span>',
        '</button>',
        '<div id="amiAccountMenu" role="menu" style="display:none;position:absolute;right:0;top:calc(100% + 8px);',
        'background:#FAF7F0;border:1px solid #D4C4A0;border-top:3px solid #C9A84C;min-width:210px;',
        'z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.2)">',
          '<div style="padding:12px 16px;border-bottom:1px solid #D4C4A0;background:#F5F0E8">',
            '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;',
            'color:#9A8070;margin-bottom:3px">Signed in as</div>',
            '<div style="font-size:12px;color:#1A1208;word-break:break-all;font-family:\'DM Mono\',monospace">' + shortMail + '</div>',
            '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:.06em;color:#2E7D4F;margin-top:4px">',
            '✓ Premium Subscriber</div>',
          '</div>',
          '<a href="deals.html" role="menuitem" style="display:flex;align-items:center;gap:8px;padding:11px 16px;',
          'font-family:\'DM Mono\',monospace;font-size:11px;letter-spacing:.06em;color:#1A1208;text-decoration:none;',
          'transition:background .15s;border-bottom:1px solid rgba(212,196,160,.4)" ',
          'onmouseover="this.style.background=\'#F0EAD9\'" onmouseout="this.style.background=\'none\'">',
          '📊&nbsp; Deal Tracker</a>',
          '<button onclick="window.amiSignOut()" role="menuitem" style="display:flex;align-items:center;gap:8px;',
          'width:100%;text-align:left;padding:11px 16px;font-family:\'DM Mono\',monospace;font-size:11px;',
          'letter-spacing:.06em;color:#B85C38;border:none;background:none;cursor:pointer;transition:background .15s"',
          ' onmouseover="this.style.background=\'#FFF0ED\'" onmouseout="this.style.background=\'none\'">',
          '⎋&nbsp; Sign Out</button>',
        '</div>'
      ].join('');

      existing.insertAdjacentElement('afterend', wrapper);

    } else {
      // ── Not logged in: show Login button ──
      var btn = document.createElement('button');
      btn.id        = 'amiNavLoginBtn';
      btn.className = 'btn-subscribe';
      btn.setAttribute('style', 'cursor:pointer;border:none');
      btn.textContent = 'Login';
      btn.addEventListener('click', function () { window.amiOpenLogin(); });
      existing.insertAdjacentElement('afterend', btn);
    }
  }

  // Update mobile nav drawer
  function updateMobileNav() {
    var mobBtns = document.querySelectorAll('.mob-subscribe');
    mobBtns.forEach(function (el) {
      if (isLoggedIn()) {
        el.textContent = '✓ Account →';
        el.href = 'deals.html';
        el.style.background = '#2E7D4F';
      } else {
        el.textContent = 'Login →';
        el.removeAttribute('href');
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (e) {
          e.preventDefault();
          // Close mobile menu if open
          var drawer = document.getElementById('navMobileDrawer');
          if (drawer) { drawer.style.display = 'none'; }
          window.amiOpenLogin();
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // MODAL INJECTION & CONTROLS
  // ═══════════════════════════════════════════════════════════════

  function injectLoginModal() {
    if (!document.getElementById('amiLoginOverlay')) {
      document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    }
  }

  window.amiSwitchTab = function (tab) {
    var panels = { signin: 'amiPanelSignIn', setup: 'amiPanelSetup', reset: 'amiPanelReset' };
    var tabBtns = { signin: 'amiTabSignIn', setup: 'amiTabSetup' };

    Object.keys(panels).forEach(function (t) {
      var panel = document.getElementById(panels[t]);
      if (panel) panel.style.display = (t === tab) ? '' : 'none';
    });
    Object.keys(tabBtns).forEach(function (t) {
      var b = document.getElementById(tabBtns[t]);
      if (!b) return;
      var active = (t === tab);
      b.style.color       = active ? '#C9A84C' : '#9A8070';
      b.style.borderBottom = active ? '2px solid #C9A84C' : '2px solid transparent';
      b.style.fontWeight  = active ? '600' : '400';
    });
  };

  window.amiOpenLogin = function (tab) {
    var overlay = document.getElementById('amiLoginOverlay');
    if (!overlay) { injectLoginModal(); overlay = document.getElementById('amiLoginOverlay'); }
    if (!overlay) return;
    overlay.style.display = 'flex';
    window.amiSwitchTab(tab || 'signin');
    setTimeout(function () {
      var f = document.getElementById('amiSubEmail');
      if (f) f.focus();
    }, 80);
  };

  window.amiCloseLogin = function () {
    var overlay = document.getElementById('amiLoginOverlay');
    if (overlay) overlay.style.display = 'none';
    // Clear messages
    ['amiSignInError', 'amiSetupError', 'amiSetupSuccess', 'amiResetError', 'amiResetSuccess'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.textContent = ''; }
    });
    // Re-enable buttons
    [['amiSignInBtn', 'Sign In →'], ['amiSetupBtn', 'Create Account →'], ['amiResetBtn', 'Send Reset Link →']].forEach(function (pair) {
      var b = document.getElementById(pair[0]);
      if (b) { b.textContent = pair[1]; b.disabled = false; }
    });
    // Clear inputs
    ['amiSubEmail','amiSubPassword','amiSetupEmail','amiSetupPassword','amiSetupConfirm','amiResetEmail'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.value = ''; el.style.borderColor = '#D4C4A0'; }
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // ACCOUNT MENU TOGGLE
  // ═══════════════════════════════════════════════════════════════

  window.amiToggleAccountMenu = function (e) {
    if (e) e.stopPropagation();
    var menu = document.getElementById('amiAccountMenu');
    var btn  = document.getElementById('amiAccountBtn');
    if (!menu) return;
    var open = menu.style.display !== 'none';
    menu.style.display = open ? 'none' : 'block';
    if (btn) btn.setAttribute('aria-expanded', String(!open));
  };

  document.addEventListener('click', function (e) {
    var wrapper = document.getElementById('amiAccountWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      var menu = document.getElementById('amiAccountMenu');
      if (menu) menu.style.display = 'none';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var menu = document.getElementById('amiAccountMenu');
      if (menu && menu.style.display !== 'none') { menu.style.display = 'none'; return; }
      var overlay = document.getElementById('amiLoginOverlay');
      if (overlay && overlay.style.display !== 'none') window.amiCloseLogin();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SIGN IN
  // ═══════════════════════════════════════════════════════════════

  window.amiDoSignIn = async function () {
    var emailEl = document.getElementById('amiSubEmail');
    var passEl  = document.getElementById('amiSubPassword');
    var btn     = document.getElementById('amiSignInBtn');
    var errorEl = document.getElementById('amiSignInError');

    var email    = emailEl ? emailEl.value.trim() : '';
    var password = passEl  ? passEl.value         : '';

    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

    var valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (emailEl) emailEl.style.borderColor = '#B85C38';
      valid = false;
    }
    if (!password) {
      if (passEl) passEl.style.borderColor = '#B85C38';
      valid = false;
    }
    if (!valid) return;

    if (btn) { btn.textContent = 'Signing in…'; btn.disabled = true; }

    try {
      var data = await sbSignIn(email, password);

      // Verify this is a paying subscriber
      var isPaid = await checkSubscriberStatus(email, data.access_token);
      if (!isPaid) {
        if (errorEl) {
          errorEl.innerHTML = 'No active subscription found for this account. <a href="membership.html" style="color:#B85C38;text-decoration:underline">Get membership →</a>';
          errorEl.style.display = 'block';
        }
        if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }
        return;
      }

      saveSession(data);
      window.amiCloseLogin();
      window.location.reload();

    } catch (err) {
      var msg = err.message || 'Sign in failed. Please try again.';
      if (/invalid|credential|wrong|incorrect/i.test(msg)) {
        msg = 'Incorrect email or password. Please try again or use "Forgot password?".';
      }
      if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
      if (btn) { btn.textContent = 'Sign In →'; btn.disabled = false; }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SET UP ACCOUNT (first-time signup for paying subscribers)
  // ═══════════════════════════════════════════════════════════════

  window.amiDoSetup = async function () {
    var emailEl   = document.getElementById('amiSetupEmail');
    var passEl    = document.getElementById('amiSetupPassword');
    var confirmEl = document.getElementById('amiSetupConfirm');
    var btn       = document.getElementById('amiSetupBtn');
    var errorEl   = document.getElementById('amiSetupError');
    var successEl = document.getElementById('amiSetupSuccess');

    var email    = emailEl   ? emailEl.value.trim()  : '';
    var password = passEl    ? passEl.value          : '';
    var confirm  = confirmEl ? confirmEl.value       : '';

    if (errorEl)   { errorEl.style.display = 'none';   errorEl.textContent   = ''; }
    if (successEl) { successEl.style.display = 'none'; successEl.textContent = ''; }

    var valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (emailEl) emailEl.style.borderColor = '#B85C38'; valid = false;
    }
    if (password.length < 8) {
      if (errorEl) { errorEl.textContent = 'Password must be at least 8 characters.'; errorEl.style.display = 'block'; }
      if (passEl) passEl.style.borderColor = '#B85C38'; valid = false;
    }
    if (password !== confirm) {
      if (errorEl) { errorEl.textContent = 'Passwords do not match.'; errorEl.style.display = 'block'; }
      if (confirmEl) confirmEl.style.borderColor = '#B85C38'; valid = false;
    }
    if (!valid) return;

    if (emailEl)   emailEl.style.borderColor   = '#D4C4A0';
    if (passEl)    passEl.style.borderColor     = '#D4C4A0';
    if (confirmEl) confirmEl.style.borderColor  = '#D4C4A0';
    if (btn) { btn.textContent = 'Checking subscription…'; btn.disabled = true; }

    try {
      // Step 1: verify email is a paying subscriber
      var isPaid = await checkSubscriberStatus(email, null);
      if (!isPaid) {
        if (errorEl) {
          errorEl.innerHTML = 'No active subscription found for <strong>' + email + '</strong>. '
            + 'Please <a href="membership.html" style="color:#B85C38;text-decoration:underline">subscribe first →</a>';
          errorEl.style.display = 'block';
        }
        if (btn) { btn.textContent = 'Create Account →'; btn.disabled = false; }
        return;
      }

      if (btn) btn.textContent = 'Creating account…';

      // Step 2: create Supabase Auth account
      await sbSignUp(email, password);

      // Step 3: try to sign in immediately
      if (btn) btn.textContent = 'Signing in…';
      try {
        var data = await sbSignIn(email, password);
        saveSession(data);
        if (successEl) {
          successEl.textContent = '✓ Account created! Signing you in now…';
          successEl.style.display = 'block';
        }
        setTimeout(function () { window.amiCloseLogin(); window.location.reload(); }, 1400);
      } catch (signInErr) {
        // Email confirmation may be required
        if (successEl) {
          successEl.textContent = '✓ Account created! Check your inbox for a confirmation email, then sign in.';
          successEl.style.display = 'block';
        }
        if (btn) { btn.textContent = 'Create Account →'; btn.disabled = false; }
      }

    } catch (err) {
      var msg = err.message || 'Account creation failed.';
      if (/already registered|already exists|already been registered/i.test(msg)) {
        msg = 'An account with this email already exists. Please use the Sign In tab instead.';
      }
      if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
      if (btn) { btn.textContent = 'Create Account →'; btn.disabled = false; }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════════════════════════════

  window.amiDoReset = async function () {
    var emailEl   = document.getElementById('amiResetEmail');
    var btn       = document.getElementById('amiResetBtn');
    var errorEl   = document.getElementById('amiResetError');
    var successEl = document.getElementById('amiResetSuccess');

    var email = emailEl ? emailEl.value.trim() : '';

    if (errorEl)   { errorEl.style.display = 'none';   errorEl.textContent   = ''; }
    if (successEl) { successEl.style.display = 'none'; successEl.textContent = ''; }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (emailEl) emailEl.style.borderColor = '#B85C38';
      return;
    }
    if (emailEl) emailEl.style.borderColor = '#D4C4A0';
    if (btn)     { btn.textContent = 'Sending…'; btn.disabled = true; }

    try {
      await sbRecover(email);
      if (successEl) {
        successEl.textContent = '✓ Reset link sent to ' + email + '. Check your inbox and click the link to set a new password.';
        successEl.style.display = 'block';
      }
      if (btn) { btn.textContent = 'Send Reset Link →'; btn.disabled = false; }
    } catch (err) {
      if (errorEl) { errorEl.textContent = err.message || 'Could not send reset email.'; errorEl.style.display = 'block'; }
      if (btn)     { btn.textContent = 'Send Reset Link →'; btn.disabled = false; }
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SIGN OUT
  // ═══════════════════════════════════════════════════════════════

  window.amiSignOut = function () {
    var token = getSession().token;
    if (token) sbSignOut(token);
    clearSession();
    window.location.reload();
  };

  // ═══════════════════════════════════════════════════════════════
  // PASSWORD RESET REDIRECT HANDLER
  // When Supabase sends a reset email, user clicks the link and
  // lands back on the site with #access_token=...&type=recovery
  // ═══════════════════════════════════════════════════════════════

  function handleAuthRedirect() {
    var hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;

    var params = new URLSearchParams(hash.replace(/^#/, ''));
    var type   = params.get('type');
    var token  = params.get('access_token');

    if (type === 'recovery' && token) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      showSetNewPasswordModal(token);
    }
  }

  function showSetNewPasswordModal(recoveryToken) {
    var id = 'amiSetNewPassModal';
    if (document.getElementById(id)) return;

    var html = [
      '<div id="' + id + '" style="position:fixed;inset:0;background:rgba(6,15,9,.87);z-index:10001;display:flex;',
      'align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(5px)">',
        '<div style="background:#FAF7F0;max-width:400px;width:100%;border-top:4px solid #C9A84C;',
        'box-shadow:0 24px 80px rgba(0,0,0,.55);padding:32px;font-family:\'Spectral\',Georgia,serif">',
          '<div style="font-family:\'Playfair Display\',serif;font-size:22px;font-weight:800;color:#1A1208;margin-bottom:8px">Set New Password</div>',
          '<p style="font-size:13px;color:#6B5344;line-height:1.6;margin-bottom:20px">Enter and confirm your new password below.</p>',
          '<div style="margin-bottom:14px">',
            '<label style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B5344;display:block;margin-bottom:6px">New Password</label>',
            '<input id="amiNewPass1" type="password" placeholder="Min. 8 characters" autocomplete="new-password"',
            ' style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:\'DM Mono\',monospace;',
            'font-size:13px;padding:12px 14px;outline:none;box-sizing:border-box">',
          '</div>',
          '<div style="margin-bottom:20px">',
            '<label style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B5344;display:block;margin-bottom:6px">Confirm Password</label>',
            '<input id="amiNewPass2" type="password" placeholder="Repeat password" autocomplete="new-password"',
            ' style="width:100%;background:#fff;border:1px solid #D4C4A0;color:#1A1208;font-family:\'DM Mono\',monospace;',
            'font-size:13px;padding:12px 14px;outline:none;box-sizing:border-box"',
            ' onkeydown="if(event.key===\'Enter\')window._amiUpdatePass()">',
          '</div>',
          '<button id="amiUpdatePassBtn" onclick="window._amiUpdatePass()"',
          ' style="width:100%;background:#C9A84C;color:#060F09;font-family:\'DM Mono\',monospace;font-size:12px;',
          'font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:13px;border:none;cursor:pointer;transition:background .2s"',
          ' onmouseover="this.style.background=\'#D4B86A\'" onmouseout="this.style.background=\'#C9A84C\'">Update Password →</button>',
          '<div id="amiNewPassErr" style="display:none;background:#FFF0ED;border-left:3px solid #B85C38;padding:10px 14px;',
          'margin-top:12px;font-family:\'DM Mono\',monospace;font-size:11px;color:#8C3A1F;line-height:1.5"></div>',
          '<div id="amiNewPassOk"  style="display:none;background:#F0FFF5;border-left:3px solid #2E7D4F;padding:10px 14px;',
          'margin-top:12px;font-family:\'DM Mono\',monospace;font-size:11px;color:#1A4D2E;line-height:1.5"></div>',
        '</div>',
      '</div>'
    ].join('');

    document.body.insertAdjacentHTML('beforeend', html);

    window._amiUpdatePass = async function () {
      var p1  = document.getElementById('amiNewPass1')?.value || '';
      var p2  = document.getElementById('amiNewPass2')?.value || '';
      var btn = document.getElementById('amiUpdatePassBtn');
      var err = document.getElementById('amiNewPassErr');
      var ok  = document.getElementById('amiNewPassOk');

      if (err) err.style.display = 'none';
      if (ok)  ok.style.display  = 'none';

      if (p1.length < 8) {
        if (err) { err.textContent = 'Password must be at least 8 characters.'; err.style.display = 'block'; }
        return;
      }
      if (p1 !== p2) {
        if (err) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; }
        return;
      }
      if (btn) { btn.textContent = 'Updating…'; btn.disabled = true; }

      try {
        await sbUpdatePassword(recoveryToken, p1);
        if (ok) { ok.textContent = '✓ Password updated! You can now sign in.'; ok.style.display = 'block'; }
        setTimeout(function () {
          var modal = document.getElementById(id);
          if (modal) modal.remove();
          window.amiOpenLogin('signin');
        }, 1800);
      } catch (e) {
        if (err) { err.textContent = e.message || 'Could not update password.'; err.style.display = 'block'; }
        if (btn) { btn.textContent = 'Update Password →'; btn.disabled = false; }
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // POST-PAYMENT REDIRECT HANDLER
  // Stripe success_url should be set to:
  //   https://ami.abta.africa/?setup=1
  // When a new subscriber lands with ?setup=1, automatically open
  // the Set Up Account tab and show a welcome message.
  // ═══════════════════════════════════════════════════════════════

  function handlePostPaymentRedirect() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('setup') !== '1') return;

    // Clean the URL so refreshing doesn't re-trigger the banner
    var cleanUrl = window.location.pathname + (window.location.hash || '');
    history.replaceState(null, '', cleanUrl);

    // Pre-filled email if Stripe passes it (e.g. ?setup=1&email=user@example.com)
    var prefillEmail = params.get('email') || '';

    // Open the modal with a brief delay to ensure DOM is fully injected
    setTimeout(function () {
      window.amiOpenLogin('setup');

      // Show the welcome banner, hide the generic info banner
      var welcomeBanner = document.getElementById('amiSetupWelcome');
      var infoBanner    = document.getElementById('amiSetupInfoBanner');
      if (welcomeBanner) welcomeBanner.style.display = 'block';
      if (infoBanner)    infoBanner.style.display    = 'none';

      // Pre-fill email field if we have one
      if (prefillEmail) {
        var emailEl = document.getElementById('amiSetupEmail');
        if (emailEl) {
          emailEl.value = prefillEmail;
          // Move focus to password field since email is already filled
          var passEl = document.getElementById('amiSetupPassword');
          if (passEl) passEl.focus();
        }
      }
    }, 350);
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALISE
  // ═══════════════════════════════════════════════════════════════

  async function init() {
    // Refresh token if near expiry
    await tryRefreshSession();

    // Sync subscriber state with login state
    if (isLoggedIn()) {
      window.amiIsSubscriber      = true;
      window.amiPaywallSuppressed = true;
      localStorage.setItem('ami_subscriber', 'true');
      localStorage.setItem('ami_email', getSession().email);
      // Suppress paywall elements
      var pw = document.getElementById('paywallOverlay');
      if (pw) pw.style.display = 'none';
      var pb = document.getElementById('paywallBlur');
      if (pb) pb.style.display = 'none';
      var fv = document.getElementById('fvOverlay');
      if (fv) fv.style.display = 'none';
      localStorage.setItem('amiVisited', '1');
    } else {
      // Clear stale email-only subscriber state if no valid auth token
      // (They must now log in with password)
      // NOTE: We don't auto-clear ami_subscriber here to avoid breaking
      // users who haven't set a password yet — they can still email-verify
    }

    injectLoginModal();
    injectLoginButton();
    updateMobileNav();
    handleAuthRedirect();
    handlePostPaymentRedirect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
