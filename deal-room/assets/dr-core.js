/* ==========================================================================
   ABTA Deal Room v2 – core
   - Safe DOM building only (no innerHTML with data)
   - Session shared with AMI login (ami_* keys)
   - Calls Supabase REST view and Edge Functions
   - Review mode with sample data when ?demo=1 or config is not injected
   ========================================================================== */
(function () {
  'use strict';

  var DR = window.DR = window.DR || {};
  document.documentElement.classList.add('js');
  var scriptSrc = (document.currentScript && document.currentScript.getAttribute('src')) || '';
  DR.base = scriptSrc.replace(/assets\/dr-core\.js.*$/, '');

  /* ---------------- Configuration ---------------- */
  var url = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : '';
  var anon = (typeof SUPABASE_ANON !== 'undefined') ? SUPABASE_ANON : '';
  var configured = /^https:\/\//.test(url) && anon && anon.indexOf('PLACEHOLDER') === -1;

  var params = new URLSearchParams(location.search);
  try {
    if (params.get('demo') === '1') sessionStorage.setItem('dr_demo', '1');
    if (params.get('demo') === '0') sessionStorage.removeItem('dr_demo');
  } catch (e) { /* storage blocked */ }
  var demoFlag = false;
  try { demoFlag = sessionStorage.getItem('dr_demo') === '1'; } catch (e) {}

  DR.config = { url: url, anon: anon, configured: configured };
  DR.demo = demoFlag || !configured;
  DR.params = params;

  /* ---------------- Reference data ---------------- */
  DR.DEAL_TYPES = [
    { value: 'Equity Investment', label: 'Equity investment' },
    { value: 'Debt Financing', label: 'Debt financing' },
    { value: 'Acquisition / Sale', label: 'Acquisition or sale' },
    { value: 'Joint Venture', label: 'Joint venture' },
    { value: 'Commercial Contract', label: 'Commercial contract' },
    { value: 'Other', label: 'Other' }
  ];
  DR.SECTORS = [
    { value: 'Clean Energy', label: 'Clean energy', icon: 'energy', bg: '#14532d' },
    { value: 'Infrastructure', label: 'Infrastructure', icon: 'infrastructure', bg: '#1f3a4d' },
    { value: 'Financial Services', label: 'Financial services', icon: 'finance', bg: '#2d2a4a' },
    { value: 'Agriculture & Food', label: 'Agriculture and food', icon: 'agriculture', bg: '#3b4a17' },
    { value: 'Technology & Digital', label: 'Technology and digital', icon: 'technology', bg: '#123c4a' },
    { value: 'Healthcare', label: 'Healthcare', icon: 'health', bg: '#4a1f2d' },
    { value: 'Mining & Resources', label: 'Mining and resources', icon: 'mining', bg: '#4a3317' },
    { value: 'Real Estate', label: 'Real estate', icon: 'building', bg: '#33302b' },
    { value: 'Manufacturing', label: 'Manufacturing', icon: 'factory', bg: '#2b3a33' },
    { value: 'Other', label: 'Other', icon: 'briefcase', bg: '#0a1a10' }
  ];
  DR.REGIONS = [
    { value: 'West Africa', label: 'West Africa' },
    { value: 'East Africa', label: 'East Africa' },
    { value: 'North Africa', label: 'North Africa' },
    { value: 'Southern Africa', label: 'Southern Africa' },
    { value: 'Central Africa', label: 'Central Africa' },
    { value: 'Pan-African', label: 'Pan-African' }
  ];
  DR.CAPITAL = [
    { value: 'Under USD 5m', label: 'Under USD 5m', rank: 1 },
    { value: 'USD 5m – 15m', label: 'USD 5m to 15m', rank: 2 },
    { value: 'USD 15m – 50m', label: 'USD 15m to 50m', rank: 3 },
    { value: 'USD 50m – 150m', label: 'USD 50m to 150m', rank: 4 },
    { value: 'USD 150m+', label: 'USD 150m or more', rank: 5 }
  ];

  function find(list, value) {
    for (var i = 0; i < list.length; i++) if (list[i].value === value) return list[i];
    return null;
  }
  DR.label = function (list, value) { var f = find(list, value); return f ? f.label : (value || ''); };
  DR.sector = function (value) { return find(DR.SECTORS, value) || DR.SECTORS[DR.SECTORS.length - 1]; };
  DR.capitalRank = function (value) { var f = find(DR.CAPITAL, value); return f ? f.rank : 0; };

  /* ---------------- Safe DOM ---------------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    if (typeof child === 'string' || typeof child === 'number') el.appendChild(document.createTextNode(String(child)));
    else el.appendChild(child);
  }
  DR.h = h;
  DR.clear = function (el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; };

  /* ---------------- Icons (simple line icons, 24px grid) ---------------- */
  var ICONS = {
    energy: ['M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4', 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z'],
    infrastructure: ['M2 18h20', 'M4 18V11M20 18V11M9 18v-4M15 18v-4', 'M2 11c4-5 16-5 20 0'],
    finance: ['M3 10h18L12 4z', 'M5 10v8M9.5 10v8M14.5 10v8M19 10v8', 'M3 20h18'],
    agriculture: ['M12 21V11', 'M12 11C12 6 8 4 4 4c0 4 3 7 8 7z', 'M12 14c0-4 3-6 8-6c0 4-3 6-8 6z'],
    technology: ['M7 7h10v10H7z', 'M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4'],
    health: ['M9 3h6v6h6v6h-6v6H9v-6H3V9h6z'],
    mining: ['M3 20l7-12l4 6l2-3l5 9z', 'M7.5 12.5l2 1.5'],
    building: ['M5 21V4h9v17', 'M14 9h5v12', 'M8 7h3M8 11h3M8 15h3M3 21h18'],
    factory: ['M3 21V11l5 3v-3l5 3v-3l5 3V4h3v17z', 'M7 17h2M12 17h2'],
    briefcase: ['M3 8h18v12H3z', 'M8 8V5h8v3', 'M3 13h18'],
    tag: ['M3 12V4h8l10 10l-8 8z', 'M7.5 7.5h.01'],
    pin: ['M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z', 'M12 7a2 2 0 1 0 0 4a2 2 0 1 0 0-4z'],
    grid: ['M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'],
    money: ['M3 7h18v10H3z', 'M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z', 'M6 12h.01M18 12h.01'],
    shield: ['M12 3l8 3v6c0 5-3.5 8-8 9c-4.5-1-8-4-8-9V6z', 'M8.5 12l2.5 2.5l4.5-5'],
    lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
    handshake: ['M3 12l4-4l5 3l5-3l4 4', 'M7 8l-4 4l6 6l3-2l3 2l6-6l-4-4', 'M12 11l-2 2l2 2'],
    bookmark: ['M6 3h12v18l-6-4l-6 4z'],
    calendar: ['M4 6h16v14H4z', 'M4 10h16M8 3v4M16 3v4']
  };
  DR.icon = function (name, extraClass) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    if (extraClass) svg.setAttribute('class', extraClass);
    (ICONS[name] || ICONS.briefcase).forEach(function (d) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  };

  /* ---------------- Formatting ---------------- */
  DR.formatDate = function (iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  DR.words = function (text) { var t = String(text || '').trim(); return t ? t.split(/\s+/).length : 0; };
  DR.qs = function (obj) {
    var p = new URLSearchParams();
    Object.keys(obj).forEach(function (k) { if (obj[k] !== '' && obj[k] !== null && obj[k] !== undefined) p.set(k, obj[k]); });
    var s = p.toString();
    return s ? '?' + s : '';
  };

  /* ---------------- Storage helpers ---------------- */
  DR.store = {
    get: function (k, fallback) { try { var v = sessionStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    remove: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsRemove(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* ---------------- Session (shared with AMI login.js) ---------------- */
  DR.session = {
    get: function () {
      if (DR.demo) {
        var d = DR.store.get('dr_demo_session', null);
        return d || { token: '', refresh: '', email: '', expires: 0 };
      }
      return {
        token: lsGet('ami_auth_token'),
        refresh: lsGet('ami_refresh_token'),
        email: lsGet('ami_user_email'),
        expires: parseInt(lsGet('ami_token_expires') || '0', 10)
      };
    },
    save: function (data, email) {
      var expires = Date.now() + (data.expires_in || 3600) * 1000;
      if (DR.demo) { DR.store.set('dr_demo_session', { token: 'demo', refresh: 'demo', email: email, expires: expires }); return; }
      lsSet('ami_auth_token', data.access_token || '');
      lsSet('ami_refresh_token', data.refresh_token || '');
      lsSet('ami_user_email', email || '');
      lsSet('ami_token_expires', String(expires));
    },
    clear: function () {
      if (DR.demo) { DR.store.remove('dr_demo_session'); return; }
      ['ami_auth_token', 'ami_refresh_token', 'ami_user_email', 'ami_token_expires', 'dr_member', 'dr_email', 'dr_name', 'dr_org', 'dr_bookmarks'].forEach(lsRemove);
    },
    active: function () { var s = DR.session.get(); return !!(s.token && s.expires > Date.now()); }
  };

  /* ---------------- Network ---------------- */
  function timeoutFetch(resource, options, ms) {
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 20000) : null;
    if (ctrl) options.signal = ctrl.signal;
    return fetch(resource, options).finally(function () { if (t) clearTimeout(t); });
  }

  DR.auth = {
    request: function (path, method, body, token) {
      var headers = { 'Content-Type': 'application/json', apikey: DR.config.anon };
      if (token) headers.Authorization = 'Bearer ' + token;
      return timeoutFetch(DR.config.url + '/auth/v1/' + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, status: r.status, data: data }; }); });
    },
    signIn: function (email, password) {
      if (DR.demo) return demoDelay({ ok: password.length >= 1, data: { access_token: 'demo', expires_in: 3600 } });
      return DR.auth.request('token?grant_type=password', 'POST', { email: email, password: password });
    },
    sendCode: function (email) {
      if (DR.demo) return demoDelay({ ok: true, data: {} });
      return DR.auth.request('otp', 'POST', { email: email, create_user: true });
    },
    verifyCode: function (email, code) {
      if (DR.demo) return demoDelay({ ok: /^\d{6}$/.test(code), data: { access_token: 'demo', expires_in: 3600 } });
      return DR.auth.request('verify', 'POST', { type: 'email', email: email, token: code });
    },
    setPassword: function (password) {
      if (DR.demo) return demoDelay({ ok: true, data: {} });
      return DR.auth.request('user', 'PUT', { password: password }, DR.session.get().token);
    },
    recover: function (email) {
      if (DR.demo) return demoDelay({ ok: true, data: {} });
      return DR.auth.request('recover', 'POST', { email: email });
    },
    refresh: function () {
      var s = DR.session.get();
      if (DR.demo) { DR.session.save({ access_token: 'demo', expires_in: 3600 }, s.email); return demoDelay({ ok: true, data: {} }); }
      if (!s.refresh) return Promise.resolve({ ok: false, data: {} });
      return DR.auth.request('token?grant_type=refresh_token', 'POST', { refresh_token: s.refresh }).then(function (res) {
        if (res.ok) DR.session.save(res.data, s.email);
        return res;
      });
    },
    signOut: function () {
      var s = DR.session.get();
      var done = function () { DR.session.clear(); };
      if (DR.demo || !s.token) { done(); return Promise.resolve(); }
      return DR.auth.request('logout', 'POST', {}, s.token).catch(function () {}).then(done);
    }
  };

  /* Edge Function call. Returns { ok, status, data } and never throws. */
  DR.fn = function (name, options) {
    options = options || {};
    if (DR.demo) return DR.demoApi(name, options);
    var headers = { apikey: DR.config.anon };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    var token = options.token || DR.session.get().token;
    if (token) headers.Authorization = 'Bearer ' + token;
    var path = DR.config.url + '/functions/v1/' + name + (options.query ? DR.qs(options.query) : '');
    return timeoutFetch(path, { method: options.method || (options.body !== undefined ? 'POST' : 'GET'), headers: headers, body: options.body !== undefined ? JSON.stringify(options.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, status: r.status, data: data }; }); })
      .catch(function () { return { ok: false, status: 0, data: { error: 'network_error' } }; });
  };

  /* Public listings from the deal_submissions_public view. */
  DR.listings = function (filters) {
    filters = filters || {};
    if (DR.demo) return DR.demoListings(filters);
    var q = new URLSearchParams();
    q.set('select', 'id,published_ref,deal_type,sector,region,capital_range,summary,teaser_headline,published_at,highlights,secondary_facts');
    if (filters.type) q.set('deal_type', 'eq.' + filters.type);
    if (filters.sector) q.set('sector', 'eq.' + filters.sector);
    if (filters.region) q.set('region', 'eq.' + filters.region);
    if (filters.capital) q.set('capital_range', 'eq.' + filters.capital);
    if (filters.ref) q.set('published_ref', 'eq.' + filters.ref);
    if (filters.id) q.set('id', 'eq.' + filters.id);
    if (filters.keywords) {
      var kw = filters.keywords.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim();
      if (kw) q.set('or', '(teaser_headline.ilike.*' + kw + '*,summary.ilike.*' + kw + '*)');
    }
    q.set('order', filters.sort === 'oldest' ? 'published_at.asc' : 'published_at.desc');
    var limit = filters.limit || 10;
    q.set('limit', String(limit));
    q.set('offset', String(((filters.page || 1) - 1) * limit));
    return timeoutFetch(DR.config.url + '/rest/v1/deal_submissions_public?' + q.toString(), {
      headers: { apikey: DR.config.anon, Prefer: 'count=exact' }
    }).then(function (r) {
      var range = r.headers.get('content-range') || '';
      var total = parseInt(range.split('/')[1] || '0', 10);
      return r.json().then(function (rows) {
        if (!r.ok || !Array.isArray(rows)) return { ok: false, rows: [], total: 0 };
        if (filters.sort === 'largest' || filters.sort === 'smallest') {
          rows.sort(function (a, b) { var d = DR.capitalRank(a.capital_range) - DR.capitalRank(b.capital_range); return filters.sort === 'largest' ? -d : d; });
        }
        return { ok: true, rows: rows, total: isNaN(total) ? rows.length : total };
      });
    }).catch(function () { return { ok: false, rows: [], total: 0 }; });
  };

  function demoDelay(value) { return new Promise(function (resolve) { setTimeout(function () { resolve(value); }, 250); }); }
  DR.demoDelay = demoDelay;

  /* ---------------- Page title helpers ---------------- */
  DR.setTitle = function (title, hasError) {
    document.title = (hasError ? 'Error: ' : '') + title + ' – ABTA Deal Room';
  };

  /* ---------------- Bookmarks ---------------- */
  var bookmarkCache = null;
  DR.bookmarks = function () {
    if (bookmarkCache) return Promise.resolve(bookmarkCache);
    if (!DR.session.active()) return Promise.resolve([]);
    if (DR.demo) { bookmarkCache = DR.store.get('dr_demo_bookmarks', []); return Promise.resolve(bookmarkCache); }
    return DR.fn('deal-room-bookmarks').then(function (res) {
      bookmarkCache = (res.ok && Array.isArray(res.data.bookmarks)) ? res.data.bookmarks : (res.ok && Array.isArray(res.data) ? res.data.map(function (r) { return r.teaser_ref; }) : []);
      return bookmarkCache;
    });
  };
  DR.toggleBookmark = function (ref) {
    if (DR.demo) {
      var list = DR.store.get('dr_demo_bookmarks', []);
      var i = list.indexOf(ref);
      if (i === -1) list.push(ref); else list.splice(i, 1);
      DR.store.set('dr_demo_bookmarks', list);
      bookmarkCache = list;
      return demoDelay(i === -1);
    }
    return DR.fn('deal-room-bookmarks', { body: { teaser_ref: ref } }).then(function (res) {
      bookmarkCache = null;
      return res.ok ? !!(res.data.bookmarked !== undefined ? res.data.bookmarked : true) : null;
    });
  };

  DR.saveButton = function (ref, title, saved) {
    var btn = h('button', { type: 'button', class: 'dr-save', 'aria-pressed': saved ? 'true' : 'false' },
      DR.icon('bookmark'), h('span', { text: saved ? 'Saved' : 'Save' }),
      h('span', { class: 'dr-visually-hidden', text: ' ' + title }));
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!DR.session.active()) {
        location.href = 'sign-in.html' + DR.qs({ return: location.pathname.split('/').pop() + location.search, reason: 'save' });
        return;
      }
      btn.setAttribute('aria-disabled', 'true');
      DR.toggleBookmark(ref).then(function (nowSaved) {
        btn.removeAttribute('aria-disabled');
        if (nowSaved === null) return;
        btn.setAttribute('aria-pressed', nowSaved ? 'true' : 'false');
        btn.querySelector('span').textContent = nowSaved ? 'Saved' : 'Save';
        DR.announce(nowSaved ? 'Opportunity saved' : 'Opportunity removed from saved');
      });
    });
    return btn;
  };

  /* ---------------- Live region ---------------- */
  var live;
  DR.announce = function (msg) {
    if (!live) { live = h('div', { class: 'dr-visually-hidden', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(live); }
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 50);
  };

  /* ---------------- Opportunity card ---------------- */
  DR.card = function (deal, opts) {
    opts = opts || {};
    var sector = DR.sector(deal.sector);
    var ref = deal.published_ref || '';
    var href = 'opportunity.html' + DR.qs({ ref: ref });
    var title = deal.teaser_headline || (DR.label(DR.DEAL_TYPES, deal.deal_type) + ' in ' + sector.label.toLowerCase());
    var visual = h('div', { class: 'dr-card__visual', 'data-sector': sector.icon, style: '--sector-bg:' + sector.bg },
      DR.icon(sector.icon), h('span', { class: 'dr-card__visual-label', text: sector.label }));
    var facts = h('ul', { class: 'dr-card__facts' },
      h('li', null, DR.icon('tag'), h('span', { class: 'dr-visually-hidden', text: 'Deal type: ' }), DR.label(DR.DEAL_TYPES, deal.deal_type)),
      h('li', null, DR.icon('pin'), h('span', { class: 'dr-visually-hidden', text: 'Region: ' }), DR.label(DR.REGIONS, deal.region)));
    var body = h('div', { class: 'dr-card__body' },
      h('p', { class: 'dr-card__price' }, deal.capital_range ? DR.label(DR.CAPITAL, deal.capital_range) : 'Capital range on request',
        h('span', { class: 'dr-card__qualifier', text: 'capital sought' })),
      h(opts.headingLevel || 'h3', { class: 'dr-card__title' }, h('a', { href: href, text: title })),
      facts,
      opts.compact ? null : h('p', { class: 'dr-card__snippet', text: deal.summary || '' }),
      h('div', { class: 'dr-card__footer' },
        h('span', null, deal.published_at ? 'Listed on ' + DR.formatDate(deal.published_at) : '', ref ? ' · Ref ' + ref : ''),
        opts.saveButton === false ? h('span', { class: 'dr-tag dr-tag--green', text: 'ABTA screened' }) :
          h('span', { class: 'dr-card__save' }, h('span', { class: 'dr-tag dr-tag--green', text: 'ABTA screened' }), ' ', DR.saveButton(ref, title, !!opts.saved))));
    return h('li', null, h('article', { class: 'dr-card' + (opts.compact ? ' dr-card--compact' : ''), 'aria-label': title }, visual, body));
  };

  /* ---------------- Header state and navigation ---------------- */
  function initHeader() {
    var toggle = document.querySelector('.dr-nav__toggle');
    var nav = document.getElementById('dr-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var accountLink = document.getElementById('dr-account-link');
    if (accountLink && DR.session.active()) {
      var prefix = accountLink.getAttribute('href').replace('sign-in.html', '');
      accountLink.textContent = 'Your Deal Room';
      accountLink.setAttribute('href', prefix + 'account.html');
      var join = document.querySelector('.dr-nav a[href$="create-account.html"]');
      if (join) join.hidden = true;
    }
    if (DR.demo) {
      var banner = document.getElementById('dr-review-banner');
      if (banner) banner.hidden = false;
    }
  }

  /* ---------------- Session timeout warning ---------------- */
  var WARN_BEFORE_MS = 2 * 60 * 1000;
  function initTimeout() {
    if (!DR.session.active()) return;
    var shown = false;
    var timer = setInterval(function () {
      var s = DR.session.get();
      if (!s.token) { clearInterval(timer); return; }
      var left = s.expires - Date.now();
      if (!shown && left > 0 && left <= WARN_BEFORE_MS) { shown = true; showTimeoutDialog(); }
      if (left <= 0 && shown) {
        clearInterval(timer);
        DR.auth.signOut().then(function () { location.href = DR.base + 'sign-in.html?reason=timeout'; });
      }
    }, 15000);
  }
  function showTimeoutDialog() {
    var previous = document.activeElement;
    var stay = h('button', { type: 'button', class: 'dr-button', text: 'Stay signed in' });
    var out = h('button', { type: 'button', class: 'dr-link-button', text: 'Sign out' });
    var dialog = h('div', { class: 'dr-dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'dr-timeout-title', 'aria-describedby': 'dr-timeout-text', tabindex: '-1' },
      h('h2', { id: 'dr-timeout-title', text: 'You’re about to be signed out' }),
      h('p', { id: 'dr-timeout-text', text: 'For your security, we will sign you out in 2 minutes. Any answers you have not saved will be lost.' }),
      h('div', { class: 'dr-button-group' }, stay, out));
    var overlay = h('div', { class: 'dr-dialog-overlay' }, dialog);
    document.body.appendChild(overlay);
    dialog.focus();
    function close() { overlay.remove(); if (previous && previous.focus) previous.focus(); }
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        var items = [stay, out];
        var idx = items.indexOf(document.activeElement);
        e.preventDefault();
        items[(idx + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
      }
      if (e.key === 'Escape') { e.preventDefault(); stay.click(); }
    });
    stay.addEventListener('click', function () {
      DR.auth.refresh().then(function (res) {
        if (res.ok) { close(); DR.announce('You are still signed in'); initTimeout(); }
        else { location.href = DR.base + 'sign-in.html?reason=timeout'; }
      });
    });
    out.addEventListener('click', function () { DR.auth.signOut().then(function () { location.href = DR.base + 'index.html'; }); });
  }

  /* ---------------- Account and membership gate ---------------- */
  DR.loadAccount = function () {
    return DR.fn('deal-room-account').then(function (res) {
      if (res.status === 401) { DR.session.clear(); return { signedOut: true }; }
      if (res.status === 404 || res.status === 0) return { unavailable: true };
      if (!res.ok) return { error: true };
      return res.data || {};
    });
  };

  /* True when the version 2 server functions are deployed. A deployed
     deal-room-account answers an unauthenticated request with 401. */
  DR.backendReady = function () {
    if (DR.demo) return Promise.resolve(true);
    return timeoutFetch(DR.config.url + '/functions/v1/deal-room-account', { headers: { apikey: DR.config.anon } }, 10000)
      .then(function (r) { return r.status === 401 || r.ok; })
      .catch(function () { return false; });
  };

  /* Shown while the version 2 server functions are not yet deployed. */
  DR.unavailablePage = function (heading, purpose) {
    DR.setTitle(heading);
    return h('div', { class: 'dr-narrow', style: 'margin-top:2rem' },
      h('h1', { text: heading }),
      h('p', { text: 'We are upgrading this part of the Deal Room. You cannot ' + purpose + ' online at the moment.' }),
      h('p', null, 'Email ', h('a', { href: 'mailto:ami@abta.africa?subject=Deal%20Room', text: 'ami@abta.africa' }), ' and the ABTA team will help you directly.'),
      h('p', null, h('a', { href: 'opportunities.html', text: 'Browse opportunities' })));
  };

  /* Returns null when the member can continue, or a page explaining what to do. */
  DR.membershipGate = function (account, purpose) {
    var m = account && account.member;
    var status = m ? m.status : 'none';
    if (status === 'active') return null;
    var content;
    if (status === 'pending_payment') {
      content = [h('h1', { text: 'Complete your membership payment' }),
        h('p', { text: 'You have accepted the Deal Room agreements but we have not received your membership payment. You need to pay before you can ' + purpose + '.' }),
        h('a', { href: 'create-account.html?step=pay', role: 'button', draggable: 'false', class: 'dr-button', text: 'Continue to payment' })];
    } else if (status === 'expired') {
      content = [h('h1', { text: 'Your membership has ended' }),
        h('p', { text: 'Renew your membership to ' + purpose + '. Your saved opportunities and history are kept.' }),
        h('a', { href: 'create-account.html?step=pay', role: 'button', draggable: 'false', class: 'dr-button', text: 'Renew membership' })];
    } else if (status === 'revoked') {
      content = [h('h1', { text: 'Your membership is not active' }),
        h('p', null, 'Contact ABTA at ', h('a', { href: 'mailto:ami@abta.africa', text: 'ami@abta.africa' }), ' if you think this is wrong.')];
    } else {
      content = [h('h1', { text: 'You need to be a Deal Room member to ' + purpose }),
        h('p', { text: 'Membership costs £99 a year, plus VAT where applicable. You will need your organisation’s registration details and a debit or credit card.' }),
        h('a', { href: 'create-account.html', role: 'button', draggable: 'false', class: 'dr-button', text: 'Join the Deal Room' }),
        h('p', null, 'Signed in with the wrong account? ', h('a', { href: '#', 'data-sign-out-inline': '1', text: 'Sign out' }))];
    }
    var node = h('div', { class: 'dr-narrow', style: 'margin-top:2rem' }, content);
    var so = node.querySelector('[data-sign-out-inline]');
    if (so) so.addEventListener('click', function (e) { e.preventDefault(); DR.auth.signOut().then(function () { location.href = 'sign-in.html'; }); });
    return node;
  };

  DR.requireSignIn = function () {
    if (DR.session.active()) return true;
    location.replace('sign-in.html' + DR.qs({ return: location.pathname.split('/').pop() + location.search }));
    return false;
  };

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initTimeout();
    var signOut = document.querySelectorAll('[data-sign-out]');
    Array.prototype.forEach.call(signOut, function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); DR.auth.signOut().then(function () { location.href = 'index.html?signed_out=1'; }); });
    });
  });
})();
