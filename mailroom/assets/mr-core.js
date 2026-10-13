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

  /* ---------------- session ---------------- */
  var STORE = 'amiMailroomSession';

  MR.auth = {
    session: function () {
      try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { return null; }
    },
    save: function (s) {
      try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* private mode */ }
    },
    clear: function () {
      try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    },
    signedIn: function () {
      var s = MR.auth.session();
      return !!(s && s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now()));
    },
    email: function () { var s = MR.auth.session(); return s && s.user && s.user.email; },
    userId: function () { var s = MR.auth.session(); return s && s.user && s.user.id; },

    // Send a one-time code to an email address.
    sendCode: function (email) {
      return fetch(MR.cfg.url + '/auth/v1/otp', {
        method: 'POST',
        headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, create_user: true })
      }).then(function (r) {
        if (!r.ok) return r.json().then(function (b) { throw new Error(b.msg || b.error_description || 'Could not send the code'); });
        return true;
      });
    },

    // Exchange the code for a session.
    verifyCode: function (email, token) {
      return fetch(MR.cfg.url + '/auth/v1/verify', {
        method: 'POST',
        headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, token: token, type: 'email' })
      }).then(function (r) {
        return r.json().then(function (b) {
          if (!r.ok) throw new Error(b.msg || b.error_description || 'That code was not accepted');
          MR.auth.save(b);
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
      headers: {
        apikey: MR.cfg.key,
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
    // The preview banner is shown only while there is no back end configured.
    var preview = document.getElementById('mr-preview-banner');
    if (preview && !MR.cfg.demo) preview.hidden = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();
