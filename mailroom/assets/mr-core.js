/* ==========================================================================
   AMI Mailroom – shared front end
   Loaded on every page. Provides:
     MR.cfg        Supabase URL and key, demo flag
     MR.api        REST helpers against PostgREST
     MR.auth       email one-time code sign in, session storage
     MR.fn         Edge Function calls
     MR.h / MR.esc safe DOM building
     MR.pay        pay formatting
     MR.errors     GOV.UK style error summary
   No dependencies. Nothing here decides a price or publishes a listing:
   those live in the database and the Edge Functions.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};

  // The stylesheet hides the mobile menu only when scripting is available.
  // This runs from an external file, so it satisfies the page's content
  // security policy, which allows no inline script.
  document.documentElement.classList.add('js');

  /* ---------------- configuration ---------------- */
  var url = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : '';
  var key = (typeof SUPABASE_ANON !== 'undefined') ? SUPABASE_ANON
          : (typeof SUPABASE_ANON_KEY !== 'undefined') ? SUPABASE_ANON_KEY : '';
  var configured = !!url && url.indexOf('YOUR_') !== 0 && !!key;
  MR.cfg = { url: url, key: key, demo: !configured };

  document.documentElement.classList.add(MR.cfg.demo ? 'rc-demo' : 'rc-live');

  /* ---------------- small helpers ---------------- */
  MR.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  MR.h = function (tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;      // only for strings built here
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(x); });
      else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  };

  MR.qs = function (name) {
    return new URLSearchParams(location.search).get(name) || '';
  };

  MR.date = function (value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d)) return String(value);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  MR.CAMPAIGN_STATUS = {
    draft: 'Draft', scheduled: 'Scheduled', sending: 'Sending', sent: 'Sent',
    held: 'Held for review', cancelled: 'Cancelled'
  };

  /* ---------------- timezones ----------------
     A scheduled send is stored as an instant. What a member picked is a wall
     clock time in their own timezone, so these two turn one into the other.
     Intl does the work, because a table of offsets goes stale every time a
     country changes its mind about daylight saving. */

  MR.TIMEZONE_FALLBACK = 'Africa/Lagos';

  function zoneParts(date, tz) {
    var parts = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
    return parts;
  }

  // How far ahead of UTC the zone is at that instant, in milliseconds.
  function offsetAt(date, tz) {
    var p = zoneParts(date, tz);
    return Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second) - date.getTime();
  }

  MR.knownZone = function (tz) {
    if (!tz) return false;
    try { new Intl.DateTimeFormat('en-GB', { timeZone: tz }); return true; }
    catch (e) { return false; }
  };

  // '2026-10-01' + '09:00' in Lagos -> the ISO instant that is.
  // Run twice, because the first guess can land the wrong side of a clock
  // change and give the offset for the wrong hour.
  MR.zonedToIso = function (dateStr, timeStr, tz) {
    if (!dateStr || !timeStr) return null;
    if (!MR.knownZone(tz)) tz = MR.TIMEZONE_FALLBACK;
    var asUtc = new Date(dateStr + 'T' + timeStr + ':00Z');
    if (isNaN(asUtc)) return null;
    var guess = new Date(asUtc.getTime() - offsetAt(asUtc, tz));
    var out = new Date(asUtc.getTime() - offsetAt(guess, tz));
    return isNaN(out) ? null : out.toISOString();
  };

  // The instant, back as the date and time boxes a member would recognise.
  MR.isoToZoned = function (iso, tz) {
    if (!iso) return { date: '', time: '' };
    if (!MR.knownZone(tz)) tz = MR.TIMEZONE_FALLBACK;
    var d = new Date(iso);
    if (isNaN(d)) return { date: '', time: '' };
    var p = zoneParts(d, tz);
    return { date: p.year + '-' + p.month + '-' + p.day, time: p.hour + ':' + p.minute };
  };

  // '1 October 2026 at 09:00 WAT'
  MR.dateTimeInZone = function (iso, tz) {
    if (!iso) return '';
    if (!MR.knownZone(tz)) tz = MR.TIMEZONE_FALLBACK;
    var d = new Date(iso);
    if (isNaN(d)) return String(iso);
    var day = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, day: 'numeric', month: 'long', year: 'numeric'
    }).format(d);
    var time = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
      timeZoneName: 'short'
    }).format(d);
    return day + ' at ' + time;
  };

  // The timezones offered on the account page. Every ABTA market, plus the
  // places members and readers actually sit. A member whose zone is not here
  // keeps whatever is already stored.
  MR.TIMEZONES = [
    'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers',
    'Africa/Cairo', 'Africa/Casablanca', 'Africa/Dakar', 'Africa/Dar_es_Salaam',
    'Africa/Douala', 'Africa/Harare', 'Africa/Johannesburg', 'Africa/Kampala',
    'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa', 'Africa/Lagos',
    'Africa/Luanda', 'Africa/Lusaka', 'Africa/Maputo', 'Africa/Nairobi',
    'Africa/Tunis', 'Africa/Windhoek',
    'Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Lisbon',
    'Europe/Berlin', 'Europe/Brussels', 'Europe/Madrid', 'Europe/Rome',
    'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'America/Toronto', 'America/Sao_Paulo',
    'Asia/Dubai', 'Asia/Riyadh', 'Asia/Karachi', 'Asia/Kolkata',
    'Asia/Shanghai', 'Asia/Singapore', 'Asia/Tokyo',
    'Australia/Sydney', 'UTC'
  ];
  // What an automatic check found, in words a member can act on.
  MR.FLAG_TEXT = {
    subject_shouting: 'A subject line was in capitals. It reads as shouting and filters treat it that way.',
    subject_punctuation: 'A subject line had several exclamation marks.',
    asks_for_payment: 'A campaign appeared to ask readers for money or bank details. That is never allowed.',
    image_no_alt: 'An image had no description, so readers who block images saw nothing.',
    mostly_images: 'A campaign was nearly all images. Add real text.',
    no_postal_address: 'Your account has no postal address, which every marketing email must carry.',
    role_addresses: 'A list you imported holds many addresses like info@ or sales@. They complain more often than named people.',
    poor_list_quality: 'A list you imported had many invalid rows, which usually means it is old or was not collected directly.',
    disposable_domains: 'A list you imported contained throwaway addresses, which were skipped.',
    large_import: 'A large list was imported into a new account, which is worth a look before it is mailed.',
    rates_rising: 'Complaints or bounces on a recent campaign were higher than usual. Another like it and sending stops.',
    domain_awaiting_dns: 'A sending subdomain is waiting for ABTA to publish its DNS records.',
    schedule_failed: 'A scheduled campaign could not be sent when its time came, and has gone back to the sender as a draft.',
    high_complaints: 'Complaints or bounces on a recent campaign were above the limit, so sending from that domain has stopped.'
  };

  MR.CONSENT_STATUS = {
    unconfirmed: 'Consent not recorded', declared: 'Consent recorded',
    repermission_sent: 'Re-permission sent', confirmed: 'Confirmed'
  };

  /* ---------------- where a list came from ----------------
     One vocabulary, used by the list page and the import page, so the same
     question is not asked twice in two different shapes.

     Why a named choice rather than a tick. Under PECR the electronic mail
     marketing rule does not apply to corporate subscribers, so for most B2B
     lists consent is not the legal test at all - it is for sole traders and
     some partnerships, and for anyone you cannot tell apart. Either way the
     platform has to know where the addresses came from, because it is ABTA's
     sending reputation that pays for a bad list. A tick records only that
     somebody ticked. A named answer records something that survives being
     asked about.

     Each option carries a default wording, which is a description of what
     people were told rather than an invented quotation. The member can edit
     it, and the website-form option deliberately starts blank, because in
     that case real wording exists and only they have it.

     'refused' is on the list so that the honest answer is available. Leaving
     it off does not stop anyone importing a bought list, it just stops them
     admitting to it. */
  MR.CONSENT_SOURCES = [
    {
      id: 'signup_form',
      label: 'They signed up through a form on our website',
      hint: 'A newsletter box, a landing page or an event registration form.',
      source: 'Signed up through a form on our own website or signup page',
      wording: '',
      wordingRequired: true
    },
    {
      id: 'in_person',
      label: 'They gave us their details in person',
      hint: 'An event, a meeting, a business card or an introduction.',
      source: 'Given to us in person at an event, a meeting or by introduction',
      wording: 'Gave us their business contact details in person, and were told we would send them our updates by email.'
    },
    {
      id: 'customers',
      label: 'They are existing customers, members or clients',
      hint: 'People you already do business with.',
      source: 'Existing customers, members or clients',
      wording: 'Became customers or members of ours, and were told we would send them updates about what we do.'
    },
    {
      id: 'bought',
      label: 'Bought, rented, scraped or appended from elsewhere',
      hint: 'Including a list a supplier told you was opted in.',
      refuse: true
    }
  ];

  MR.consentSource = function (id) {
    return MR.CONSENT_SOURCES.filter(function (o) { return o.id === id; })[0] || null;
  };
  MR.number = function (n) { return Number(n || 0).toLocaleString('en-GB'); };
  MR.percent = function (part, whole) {
    if (!whole) return '0%';
    return (Math.round((part / whole) * 1000) / 10) + '%';
  };

  MR.announce = function (msg) {
    var live = document.getElementById('mr-live-region');
    if (!live) {
      live = MR.h('div', { id: 'mr-live-region', class: 'dr-visually-hidden', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(live);
    }
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 50);
  };

  /* ---------------- session ----------------
     One sign-in for the whole of AMI. The news site, the Dealroom, the Mailroom and
     Recruiter all keep the same four values (the same keys login.js and the Dealroom
     already use), so signing in on one product signs you in on the others, and signing
     out signs you out of all of them. "Keep me signed in" puts them in localStorage
     (survives closing the browser); without it they go in sessionStorage (this tab only). */
  var LEGACY = 'amiMailroomSession';
  function area() {
    try { if (sessionStorage.getItem('ami_auth_token')) return sessionStorage; } catch (e) { /* ignore */ }
    return localStorage;
  }
  // Session limit (the free Supabase plan cannot set one, so the site applies it).
  // Signed out after this many days in total, or after this many days without a visit.
  // The same two numbers sit at the top of login.js, dr-core.js and the other product's core file: change all four together.
  var CAP_TOTAL_DAYS = 30;
  var CAP_IDLE_DAYS = 14;
  // Returns true (and signs out here) when the limit has passed. Otherwise notes this visit.
  function enforceCap() {
    try {
      var a = area();
      var refresh = a.getItem('ami_refresh_token') || '';
      if (!a.getItem('ami_auth_token') && !refresh) return false;
      var now = Date.now(), day = 86400000;
      var since = parseInt(a.getItem('ami_signed_in_at') || '0', 10);
      var last = parseInt(a.getItem('ami_last_active') || '0', 10);
      if (!since) { since = now; a.setItem('ami_signed_in_at', String(now)); } // signed in before the limit existed
      if (!last) last = now;
      if (now - since > CAP_TOTAL_DAYS * day || now - last > CAP_IDLE_DAYS * day) {
        wipe();
        if (refresh) revokeQuietly(refresh);
        return true;
      }
      if (now - last > 60000) a.setItem('ami_last_active', String(now));
    } catch (e) { /* storage blocked: nothing to enforce */ }
    return false;
  }
  // Ends the session at Supabase as well, where the browser can still do so.
  function revokeQuietly(refresh) {
    var base = MR.cfg.url + '/auth/v1/';
    return fetch(base + 'token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.access_token) return fetch(base + 'logout', { method: 'POST', headers: { apikey: MR.cfg.key, Authorization: 'Bearer ' + d.access_token } });
    }).catch(function () { /* best-effort */ });
  }
  function claims(t) {
    try { return JSON.parse(atob(String(t).split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return {}; }
  }
  function wipe() {
    ['ami_auth_token', 'ami_refresh_token', 'ami_user_email', 'ami_token_expires', 'ami_signed_in_at', 'ami_last_active', 'ami_subscriber', 'ami_email', 'ami_sub_check'].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ }
    });
    try { localStorage.removeItem(LEGACY); } catch (e) { /* ignore */ }
  }

  MR.auth = {
    session: function () {
      try {
        enforceCap();
        var a = area(), t = a.getItem('ami_auth_token');
        if (!t) {
          // A session saved by an earlier version of this product: move it to the shared place once.
          var old = JSON.parse(localStorage.getItem(LEGACY) || 'null');
          if (old && old.access_token) { localStorage.removeItem(LEGACY); MR.auth.save(old, true); a = localStorage; t = a.getItem('ami_auth_token'); }
          if (!t) return null;
        }
        var c = claims(t);
        return {
          access_token: t,
          refresh_token: a.getItem('ami_refresh_token') || '',
          expires_at: Math.floor(parseInt(a.getItem('ami_token_expires') || '0', 10) / 1000),
          user: { id: c.sub || '', email: a.getItem('ami_user_email') || c.email || '' }
        };
      } catch (e) { return null; }
    },
    // remember: true = keep me signed in, false = this tab only, undefined = leave as it is
    save: function (s, remember) {
      try {
        var cur = area();
        var target = remember === true ? localStorage : (remember === false ? sessionStorage : cur);
        var other = target === localStorage ? sessionStorage : localStorage;
        var c = claims(s.access_token);
        var email = (s.user && s.user.email) || c.email || cur.getItem('ami_user_email') || '';
        var exp = s.expires_at ? s.expires_at * 1000 : Date.now() + (s.expires_in || 3600) * 1000;
        target.setItem('ami_auth_token', s.access_token || '');
        target.setItem('ami_refresh_token', s.refresh_token || '');
        target.setItem('ami_user_email', email);
        target.setItem('ami_token_expires', String(exp));
        // A new sign-in starts the clock; a refresh (remember not given) keeps the original start.
        var since = remember === undefined ? parseInt(cur.getItem('ami_signed_in_at') || '0', 10) : 0;
        target.setItem('ami_signed_in_at', String(since || Date.now()));
        target.setItem('ami_last_active', String(Date.now()));
        ['ami_auth_token', 'ami_refresh_token', 'ami_user_email', 'ami_token_expires', 'ami_signed_in_at', 'ami_last_active'].forEach(function (k) { other.removeItem(k); });
      } catch (e) { /* private mode */ }
    },
    clear: function () { wipe(); },
    signedIn: function () {
      var s = MR.auth.session();
      return !!(s && s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now()));
    },
    email: function () { var s = MR.auth.session(); return s && s.user && s.user.email; },
    userId: function () { var s = MR.auth.session(); return s && s.user && s.user.id; },

    // Email and password.
    signIn: function (email, password, remember) {
      return fetch(MR.cfg.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (b) {
          if (!r.ok) { var e = new Error(b.msg || b.error_description || 'Sign in failed'); e.status = r.status; e.code = b.error_code || b.code || ''; throw e; }
          MR.auth.save(b, remember !== false);
          return b;
        });
      });
    },

    // Set a password (PUT /auth/v1/user with the new session), so the next sign-in needs no code.
    setPassword: function (password) {
      var s = MR.auth.session();
      if (!s || !s.access_token) return Promise.reject(new Error('no session'));
      return fetch(MR.cfg.url + '/auth/v1/user', {
        method: 'PUT',
        headers: { apikey: MR.cfg.key, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      }).then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (b) {
          var e = new Error(b.msg || b.error_description || 'Could not set the password');
          e.status = r.status; e.code = b.error_code || b.code || '';
          e.reasons = (b.weak_password && b.weak_password.reasons) || [];
          throw e;
        });
        return true;
      });
    },

    // Send a link to set a new password.
    recover: function (email) {
      return fetch(MR.cfg.url + '/auth/v1/recover', {
        method: 'POST',
        headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      }).then(function (r) { if (!r.ok) throw new Error('Could not send the link'); return true; });
    },

    // Send a one-time code to an email address.
    sendCode: function (email) {
      return fetch(MR.cfg.url + '/auth/v1/otp', {
        method: 'POST',
        headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, create_user: true })
      }).then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (b) {
          var e = new Error(b.msg || b.error_description || 'Could not send the code');
          e.status = r.status; e.code = b.error_code || b.code || '';
          throw e;
        });
        return true;
      });
    },

    // Exchange the code for a session.
    verifyCode: function (email, token, remember) {
      return fetch(MR.cfg.url + '/auth/v1/verify', {
        method: 'POST',
        headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, token: token, type: 'email' })
      }).then(function (r) {
        return r.json().then(function (b) {
          if (!r.ok) throw new Error(b.msg || b.error_description || 'That code was not accepted');
          MR.auth.save(b, remember !== false);
          return b;
        });
      });
    },

    refresh: function () {
      var s = MR.auth.session();
      if (!s || !s.refresh_token) return Promise.reject(new Error('no session'));
      return fetch(MR.cfg.url + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      }).then(function (r) {
        if (!r.ok) { MR.auth.clear(); throw new Error('session expired'); }
        return r.json().then(function (b) { MR.auth.save(b); return b; });
      });
    },

    signOut: function () {
      var s = MR.auth.session();
      MR.auth.clear();
      if (s && s.access_token) {
        fetch(MR.cfg.url + '/auth/v1/logout', {
          method: 'POST',
          headers: { apikey: MR.cfg.key, Authorization: 'Bearer ' + s.access_token }
        }).catch(function () { /* ignore */ });
      }
      location.href = 'index.html';
    }
  };

  /* ---------------- REST ---------------- */
  function headers(extra) {
    var s = MR.auth.session();
    var h = { apikey: MR.cfg.key, 'Content-Type': 'application/json' };
    h.Authorization = 'Bearer ' + ((s && s.access_token) || MR.cfg.key);
    return Object.assign(h, extra || {});
  }

  function request(path, options, retried) {
    return fetch(MR.cfg.url + '/rest/v1/' + path, options).then(function (r) {
      if (r.status === 401 && !retried && MR.auth.session()) {
        return MR.auth.refresh().then(function () {
          options.headers = headers(options.headers && options.headers.Prefer ? { Prefer: options.headers.Prefer } : null);
          return request(path, options, true);
        });
      }
      if (!r.ok) {
        return r.text().then(function (t) {
          var msg = t;
          try { msg = JSON.parse(t).message || JSON.parse(t).hint || t; } catch (e) { /* text */ }
          var err = new Error(msg || ('Request failed: ' + r.status));
          err.status = r.status;
          throw err;
        });
      }
      if (r.status === 204) return null;
      return r.json();
    });
  }

  MR.api = {
    select: function (path) {
      return request(path, { headers: headers() });
    },
    // opts.query adds a query string, opts.upsert writes over a row that
    // already exists rather than failing on the key.
    insert: function (table, row, opts) {
      var prefer = 'return=representation';
      if (opts && opts.upsert) prefer += ',resolution=merge-duplicates';
      return request(table + ((opts && opts.query) || ''), {
        method: 'POST',
        headers: headers({ Prefer: prefer }),
        body: JSON.stringify(row)
      });
    },
    update: function (table, query, patch) {
      return request(table + '?' + query, {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(patch)
      });
    },
    remove: function (table, query) {
      return request(table + '?' + query, { method: 'DELETE', headers: headers() });
    }
  };

  // A database function, for the few things the browser asks the database to
  // decide rather than doing itself: sharing a draft, and stopping sharing.
  MR.rpc = function (name, args) {
    return request('rpc/' + name, {
      method: 'POST', headers: headers(), body: JSON.stringify(args || {})
    });
  };

  MR.fn = function (name, body) {
    var s = MR.auth.session();
    return fetch(MR.cfg.url + '/functions/v1/' + name, {
      method: 'POST',
      // No apikey header. The functions allow only "authorization,
      // content-type" in Access-Control-Allow-Headers, so sending apikey made
      // the preflight fail and the browser blocked the request before it left
      // - which the page could only report as "Failed to fetch". The gateway
      // authenticates from the Authorization bearer alone. 14 October 2026.
      headers: {
        Authorization: 'Bearer ' + ((s && s.access_token) || MR.cfg.key),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().then(function (b) {
        if (!r.ok) throw new Error(b.error || 'Request failed');
        return b;
      });
    });
  };

  /* ---------------- task finished ----------------
     A completed task ends on a confirmation, not back on its own form. Added
     14 October 2026: the import page reported its counts in a banner and then
     re-presented "Import subscribers" with the CSV instructions and the gold
     panel about what happens to your file, all of it guidance for a task
     already done, and with no onward link. The same shape was on account
     creation and on every campaign end state.

     This is the GOV.UK confirmation page pattern, and .dr-panel - the green
     centred panel it uses - was already in mr.css and unused.

     opts: { title, detail, lead, next: [string], actions: [[href, label]] }
     The first action is the primary one. Focus moves to the heading so a
     screen reader lands on the confirmation rather than staying where the
     button used to be. */
  MR.done = function (target, opts) {
    opts = opts || {};
    MR.clear(target);

    var head = MR.h('h1', { tabindex: '-1', text: opts.title || 'Done' });
    var body = MR.h('div', { class: 'dr-panel__body' });
    if (opts.lead) body.appendChild(document.createTextNode(opts.lead));
    if (opts.detail) body.appendChild(MR.h('strong', { text: opts.detail }));
    target.appendChild(MR.h('div', { class: 'dr-panel' }, head, body));

    if (opts.next && opts.next.length) {
      target.appendChild(MR.h('h2', { class: 'dr-h', text: 'What happens next' }));
      var ul = MR.h('ul', { class: 'dr-list' });
      opts.next.forEach(function (line) { ul.appendChild(MR.h('li', { text: line })); });
      target.appendChild(ul);
    }

    if (opts.actions && opts.actions.length) {
      var row = MR.h('p');
      opts.actions.forEach(function (a, i) {
        row.appendChild(MR.h('a', {
          class: 'dr-button' + (i === 0 ? '' : ' dr-button--secondary'),
          href: a[0], text: a[1]
        }));
        row.appendChild(document.createTextNode(' '));
      });
      target.appendChild(row);
    }

    if (opts.detailList && opts.detailList.length) {
      var dl = MR.h('ul', { class: 'dr-list dr-small' });
      opts.detailList.forEach(function (line) { dl.appendChild(MR.h('li', { text: line })); });
      target.appendChild(dl);
    }

    head.focus();
    target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return target;
  };

  /* ---------------- error summary ---------------- */
  MR.errors = {
    clear: function (form) {
      var box = form.querySelector('.dr-error-summary');
      if (box) box.remove();
      form.querySelectorAll('.dr-form-group--error').forEach(function (g) {
        g.classList.remove('dr-form-group--error');
        var m = g.querySelector('.dr-error-message');
        if (m) m.remove();
      });
      form.querySelectorAll('.dr-input--error,.dr-select--error,.dr-textarea--error').forEach(function (f) {
        f.classList.remove('dr-input--error', 'dr-select--error', 'dr-textarea--error');
        f.removeAttribute('aria-invalid');
      });
    },
    // list: [{ id: 'field-id', message: 'Enter your name' }]
    show: function (form, list) {
      MR.errors.clear(form);
      if (!list.length) return false;
      var ul = MR.h('ul', { class: 'dr-error-summary__list' });
      list.forEach(function (e) {
        ul.appendChild(MR.h('li', null, MR.h('a', {
          href: '#' + e.id, text: e.message,
          onclick: function (ev) {
            ev.preventDefault();
            var t = document.getElementById(e.id);
            if (t) { t.focus(); t.scrollIntoView({ block: 'center' }); }
          }
        })));
        var field = document.getElementById(e.id);
        if (field) {
          field.setAttribute('aria-invalid', 'true');
          field.classList.add(field.tagName === 'SELECT' ? 'dr-select--error'
            : field.tagName === 'TEXTAREA' ? 'dr-textarea--error' : 'dr-input--error');
          var group = field.closest('.dr-form-group') || field.closest('.dr-fieldset');
          if (group) {
            group.classList.add('dr-form-group--error');
            var msg = MR.h('span', { class: 'dr-error-message' },
              MR.h('span', { class: 'dr-visually-hidden', text: 'Error: ' }), e.message);
            field.parentNode.insertBefore(msg, field);
          }
        }
      });
      var box = MR.h('div', {
        class: 'dr-error-summary', role: 'alert', tabindex: '-1',
        'aria-labelledby': 'rc-error-title'
      },
        MR.h('h2', { class: 'dr-error-summary__title', id: 'rc-error-title', text: 'There is a problem' }), ul);
      form.insertBefore(box, form.firstChild);
      box.focus();
      return true;
    }
  };

  MR.banner = function (target, title, text, kind) {
    var box = MR.h('div', { class: 'dr-banner' + (kind === 'important' ? ' dr-banner--important' : ''), role: 'status' },
      MR.h('p', { class: 'dr-banner__title', text: title }),
      MR.h('div', { class: 'dr-banner__content' }, MR.h('p', { text: text })));
    target.insertBefore(box, target.firstChild);
    box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return box;
  };

  /* ---------------- a page that could not load ----------------
     Every member page fetches its data and then draws itself over a
     "Loading…" placeholder. Until this existed, a query that failed left
     that placeholder on screen indefinitely: the page looked busy, nothing
     was happening, and the only record of it was in the browser console,
     where no member looks.

     Call it from the catch at the end of a page load and return. It returns
     true in every case, so `return MR.loadFailed(wrap, err);` reads
     correctly. A signed-out visitor is not a failure - requireAccount has
     already drawn the sign-in prompt - so those two cases pass through
     without touching the page. */
  MR.loadFailed = function (wrap, err) {
    if (err && (err.message === 'signed out' || err.message === 'no account')) return true;
    if (err) console.error(err);
    if (!wrap) return true;

    var placeholder = wrap.querySelector('.dr-loading');
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    if (!wrap.querySelector('h1')) {
      wrap.appendChild(MR.h('h1', { text: 'This page could not be loaded' }));
    }

    // Distinguishing the two matters: one is something the member can fix in
    // a second, the other is not theirs to fix at all.
    var offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
    var onDashboard = /account\.html$/.test(location.pathname);

    var actions = MR.h('p', null,
      MR.h('button', {
        class: 'dr-button', type: 'button', text: 'Try again',
        onclick: function () { location.reload(); }
      }));
    if (!onDashboard) {
      actions.appendChild(document.createTextNode(' '));
      actions.appendChild(MR.h('a', {
        class: 'dr-button dr-button--secondary', href: 'account.html',
        text: 'Back to your mailroom'
      }));
    }

    wrap.appendChild(MR.h('div', { class: 'mr-aside', role: 'alert' },
      MR.h('h2', { class: 'dr-h', text: offline ? 'You appear to be offline' : 'This did not load' }),
      MR.h('p', {
        text: offline
          ? 'Your details could not be fetched because this device is not connected. Nothing has been changed, saved or sent.'
          : 'Your details could not be fetched just now. Nothing has been changed, saved or sent, and nothing has gone out to anybody.'
      }),
      actions,
      MR.h('p', { class: 'dr-small' }, 'If it keeps happening, tell us at ',
        MR.h('a', { href: 'mailto:ami@abta.africa', text: 'ami@abta.africa' }),
        ' and say which page you were on.')));

    MR.announce('This page could not be loaded.');
    return true;
  };

  /* ---------------- header state ---------------- */
  function initHeader() {
    var toggle = document.querySelector('.dr-nav__toggle');
    var nav = document.getElementById('dr-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var account = document.getElementById('mr-account-link');
    if (account && MR.auth.signedIn()) {
      account.textContent = 'Your account';
      account.setAttribute('href', account.getAttribute('data-account') || 'account.html');
    }
    // The member navigation. Shown to a signed-in member, and in preview mode
    // so the sample pages demonstrate the product rather than a locked door.
    var memberNav = document.getElementById('mr-member-nav');
    if (memberNav) memberNav.hidden = !(MR.auth.signedIn() || MR.cfg.demo);

    var out = document.getElementById('mr-sign-out');
    if (out) {
      out.hidden = !MR.auth.signedIn();
      out.addEventListener('click', function (e) { e.preventDefault(); MR.auth.signOut(); });
    }
    // The Beta row was removed on 14 October 2026: it sat above the masthead
    // and broke the three-tier header, and the publication no longer has one
    // either. What is left in that strip is the sample-data warning, which is
    // not a Beta notice - it is the page saying nothing you do here is real.
    // The id is now on the strip itself, so this line still governs it.
    // The sample-data strip was removed on 14 October 2026 at YO's request,
    // markup and all, so there is nothing left here to show or hide.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();
