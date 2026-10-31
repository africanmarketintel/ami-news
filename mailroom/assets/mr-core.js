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

  // A home page picture that has not been added yet is hidden, so the sample
  // tile shows its colour and not a broken-picture mark.
  function hideBroken(img) { if (img && img.tagName === 'IMG' && img.closest && img.closest('.ma-picker__grid')) img.style.visibility = 'hidden'; }
  document.addEventListener('error', function (e) { hideBroken(e.target); }, true);
  document.addEventListener('DOMContentLoaded', function () {
    var list = document.querySelectorAll('.ma-picker__grid img');
    for (var i = 0; i < list.length; i++) if (list[i].complete && list[i].naturalWidth === 0) hideBroken(list[i]);
  });

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

  // An account row can hold the placeholder "ADDRESS NOT SET", which is not an
  // address. Every marketing email has to carry a real one.
  MR.hasAddress = function (account) {
    var a = String((account && account.postal_address) || '').replace(/\s+/g, ' ').trim();
    return a !== '' && !/^(address not set|not set|none|n\/a|tbc|tbd|-)$/i.test(a);
  };


  // The platform's line at the foot of every email. A paid plan can replace or
  // remove it, but only on emails sent from the account's own verified domain.
  // Mail sent from the shared address always carries it, so a recipient can
  // tell who is behind the shared sender. NO_CREDIT is the value stored for
  // "no line". Keep these in step with mr-render.js.
  MR.NO_CREDIT = '[none]';
  MR.PLATFORM_CREDIT_TEXT = 'Sent through AMI Mailroom, a service of the African Business Trade Association.';
  MR.creditAllowed = function (account, domain) {
    return !!(account && account.allows_custom_footer && domain && domain.kind === 'own_domain');
  };

  // What is recorded when a member gives only the one answer about how
  // addresses were collected. The date is the day they said so, and the
  // wording is the answer itself, marked as not detailed, so the record never
  // claims more than the member told us.
  MR.todayIso = function () {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  MR.defaultWording = function (opt) {
    return (opt && opt.wording) || ((opt && opt.source) ? opt.source + ' (wording not recorded)' : '');
  };

  // What a campaign is called in a list. A draft saved before it has a subject
  // line keeps an empty subject in the database - the send checks need that to
  // stay empty - so the list names it by when it was started instead of
  // showing a row nobody can read or choose.
  MR.campaignName = function (c) {
    var s = String((c && c.subject) || '').trim();
    if (s) return s;
    // Two drafts started on the same day look identical by date, so an
    // untitled one is named by what it starts with.
    if (c && c._snippet) return 'Untitled draft: \u201c' + c._snippet + '\u201d';
    var when = MR.date((c && (c.created_at || c.updated_at)) || '');
    return 'Untitled draft' + (when ? ', started ' + when : '');
  };

  // The first words in a campaign's content: the first block that has any.
  MR.snippet = function (blocks) {
    var found = '';
    (function walk(list) {
      (Array.isArray(list) ? list : []).forEach(function (b) {
        if (found || !b || typeof b !== 'object') return;
        ['text', 'headline', 'title', 'name', 'label'].some(function (k) {
          var v = typeof b[k] === 'string' ? b[k] : '';
          v = v.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
          if (v && !/^(Sample paragraph|Your weekly update)/i.test(v)) { found = v; return true; }
          return false;
        });
        if (!found && Array.isArray(b.blocks)) walk(b.blocks);
      });
    })(blocks);
    return found.length > 48 ? found.slice(0, 47).replace(/\s+\S*$/, '') + '\u2026' : found;
  };

  // Fills in the first words of every untitled draft in a list of campaigns.
  // The lists do not load whole campaigns, so this asks for the content of
  // just the untitled ones, in one request.
  MR.loadSnippets = function (rows) {
    var bare = (rows || []).filter(function (c) { return !String(c.subject || '').trim() && !c._snippet; });
    if (!bare.length) return Promise.resolve(rows);
    if (MR.cfg.demo) {
      bare.forEach(function (c) { c._snippet = MR.snippet(c.body_blocks); });
      return Promise.resolve(rows);
    }
    var ids = bare.map(function (c) { return c.id; }).join(',');
    return MR.api.select('mailroom_campaigns?select=id,body_blocks&id=in.(' + ids + ')').then(function (full) {
      var byId = {};
      (full || []).forEach(function (f) { byId[f.id] = f.body_blocks; });
      bare.forEach(function (c) { c._snippet = MR.snippet(byId[c.id]); });
      return rows;
    }).catch(function () { return rows; });   // the name falls back to the date
  };

  /* ---------------- timezones ----------------
     A scheduled send is stored as an instant. What a member picked is a wall
     clock time in their own timezone, so these two turn one into the other.
     Intl does the work, because a table of offsets goes stale every time a
     country changes its mind about daylight saving. */

  MR.TIMEZONE_FALLBACK = 'Europe/London';

  // ABTA works in London time, which is BST in summer and GMT in winter.
  // A plain UTC zone (what some browsers report) is shown as London time
  // too, so a member never sees "00:02 UTC" for 01:02 BST.
  var UTC_NAMES = ['UTC', 'Etc/UTC', 'Etc/UCT', 'UCT', 'Etc/GMT', 'GMT', 'Etc/Zulu', 'Zulu'];
  MR.displayZone = function (tz) {
    if (!tz || UTC_NAMES.indexOf(tz) !== -1) return MR.TIMEZONE_FALLBACK;
    return tz;
  };

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
    tz = MR.displayZone(tz);
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
    tz = MR.displayZone(tz);
    if (!MR.knownZone(tz)) tz = MR.TIMEZONE_FALLBACK;
    var d = new Date(iso);
    if (isNaN(d)) return { date: '', time: '' };
    var p = zoneParts(d, tz);
    return { date: p.year + '-' + p.month + '-' + p.day, time: p.hour + ':' + p.minute };
  };

  // '1 October 2026 at 09:00 BST'
  MR.dateTimeInZone = function (iso, tz) {
    if (!iso) return '';
    tz = MR.displayZone(tz);
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
    'Australia/Sydney'
  ];
  // What an automatic check found, in words a member can act on.
  MR.FLAG_TEXT = {
    subject_shouting: 'A subject line was in capitals. It reads as shouting and filters treat it that way.',
    subject_punctuation: 'A subject line had several exclamation marks.',
    asks_for_payment: 'A campaign appeared to ask readers for money or bank details. That is never allowed.',
    image_no_alt: 'An image had no description, so readers who block images saw nothing.',
    mostly_images: 'A campaign was nearly all images. Add real text.',
    protected_name: 'A sender name, account name or sending address used a name that belongs to ABTA, so a person checks it before it goes.',
    no_postal_address: 'Your account has no postal address, which every marketing email must carry.',
    role_addresses: 'A list you imported holds many addresses like info@ or sales@. They complain more often than named people.',
    poor_list_quality: 'A list you imported had many invalid rows, which usually means it is old or was not collected directly.',
    disposable_domains: 'A list you imported contained throwaway addresses, which were skipped.',
    large_import: 'A large list was imported into a new account, which is worth a look before it is mailed.',
    rates_rising: 'Complaints or bounces on a recent campaign were higher than usual. Another like it and sending stops.',
    complaints_warning: 'Readers are reporting a campaign as spam at more than 0.1 per cent. Sending stops above 0.2 per cent.',
    domain_awaiting_dns: 'A sending subdomain is waiting for ABTA to publish its DNS records.',
    schedule_failed: 'A scheduled campaign could not be sent when its time came, and has gone back to the sender as a draft.',
    high_complaints: 'Complaints or bounces on a recent campaign were above the limit, so sending from that domain has stopped.'
  };

  MR.CONSENT_STATUS = {
    unconfirmed: 'Agreement not recorded', declared: 'Agreement recorded',
    repermission_sent: 'Asked to confirm again', confirmed: 'Confirmed'
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


  // Plain words for any failed request. The technical reply is written to the
  // browser console for support and never shown to the member.
  MR.friendlyError = function (err, fallback) {
    try { console.error(err); } catch (e) { /* ignore */ }
    var msg = String((err && err.message) || '');
    var status = err && err.status;
    if (err && err.name === 'TypeError' || /failed to fetch|networkerror|load failed/i.test(msg))
      return 'The service could not be reached. Check your connection and try again.';
    if (status === 401 || /jwt|session.*(expired|ended)/i.test(msg))
      return 'Your session has ended. Sign in again, then try again.';
    if (status === 403 || /row-level security|permission denied|not allowed/i.test(msg))
      return 'Your account is not set up to do that yet. Sign out, sign in again and retry. If it still fails, contact ABTA.';
    if (status === 429) return 'Too many requests. Wait a minute and try again.';
    if (/duplicate key|already exists/i.test(msg)) return 'That already exists.';
    if (status >= 500) return 'The service had a problem. Try again in a few minutes.';
    return fallback || 'Something went wrong. Try again, and if it keeps happening contact ABTA.';
  };

  // Plain words for a failed sign-in code request, with the cause where the
  // service gives one. Used by the sign-up page and the sign-in page.
  // A button that sends a new code to an address. Supabase allows one a
  // minute, so the button waits that long between sends. The newest code is
  // the one to use. `status` is a paragraph that says what happened.
  MR.resendCode = function (getEmail, status) {
    var button = MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Send a new code' });
    var timer = null;
    function wait(seconds) {
      var left = seconds;
      button.disabled = true;
      button.textContent = 'Send a new code (' + left + 's)';
      clearInterval(timer);
      timer = setInterval(function () {
        left -= 1;
        if (left <= 0) {
          clearInterval(timer);
          button.disabled = false;
          button.textContent = 'Send a new code';
        } else {
          button.textContent = 'Send a new code (' + left + 's)';
        }
      }, 1000);
    }
    button.addEventListener('click', function () {
      var email = getEmail();
      status.textContent = 'Sending…';
      button.disabled = true;
      MR.auth.sendCode(email).then(function () {
        status.textContent = 'A new code has been sent to ' + email + '. Use the newest one.';
        MR.announce('A new code has been sent');
        wait(60);
      }).catch(function (err) {
        status.textContent = MR.codeError(err);
        wait(60);
      });
    });
    return button;
  };

  MR.codeError = function (err) {
    var code = String((err && err.code) || '');
    var msg = String((err && err.message) || '');
    var status = err && err.status;
    // Supabase allows one code per address a minute, and says so in words
    // ("you can only request this after 52 seconds") on some versions
    // without the 429 status.
    var secs = /after (\d+) seconds?/i.exec(msg);
    if (secs) return 'A code was sent a moment ago. Check your inbox and spam folder, or ask for another in ' + secs[1] + ' seconds.';
    if (status === 429 || /rate_limit/.test(code) || /rate limit|too many|security purposes/i.test(msg))
      return 'Too many codes have been requested. Check your inbox and spam folder for the latest one, or wait a few minutes and try again.';
    if (/signup_disabled|otp_disabled|email_provider_disabled/.test(code))
      return 'New sign-ups by email are switched off on this service. Contact ABTA.';
    if (/validation_failed|email_address_invalid/.test(code) || status === 422 && /email/i.test(msg))
      return 'That email address was not accepted. Check it and try again.';
    if (/error sending|smtp|unexpected_failure/i.test(code + ' ' + msg) || status >= 500)
      return 'The email service could not send the code. This is a fault on our side, not yours. Try again in a few minutes.';
    if (err && err.name === 'TypeError')
      return 'The service could not be reached. Check your connection and try again.';
    return 'The code could not be sent. Try again in a few minutes.';
  };

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
          if (!r.ok) {
            console.error('Code check failed:', r.status, b);
            var ve = new Error(r.status === 429
              ? 'Too many attempts. Wait a few minutes and try again.'
              : 'That code was not accepted. Check it, or send a new code.');
            ve.status = r.status;
            throw ve;
          }
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
      return r.text().then(function (t) { return t ? JSON.parse(t) : null; });
    });
  }

  MR.api = {
    select: function (path) {
      return request(path, { headers: headers() });
    },
    // opts.query adds a query string, opts.upsert writes over a row that
    // already exists rather than failing on the key, opts.minimal asks for
    // nothing back (needed when the member cannot read the row yet).
    insert: function (table, row, opts) {
      var prefer = (opts && opts.minimal) ? 'return=minimal' : 'return=representation';
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

  /* ---------------- using a campaign again ----------------
     A sent campaign cannot be edited, but its words, layout and settings can
     be copied into a new draft. The copy keeps the subject, preview text,
     sender, list, design and blocks. It does not keep anything about the send
     itself: no schedule, no figures, no share link, no archive reference.

       MR.duplicateCampaign(id)     resolves with the new draft's row
       MR.duplicateButton(id, kind) a button that copies the campaign and opens
                                    the copy in the editor; kind 'button' draws
                                    it as a button, otherwise as a link */
  MR.duplicateCampaign = function (id) {
    return MR.api.select('mailroom_campaigns?select=*&id=eq.' + encodeURIComponent(id)).then(function (rows) {
      var c = rows && rows[0];
      if (!c) throw new Error('That campaign could not be found.');
      var copy = {
        account_id: c.account_id, list_id: c.list_id || null,
        sending_domain_id: c.sending_domain_id || null, subject: c.subject,
        preheader: c.preheader || null, from_name: c.from_name, reply_to: c.reply_to,
        body_blocks: c.body_blocks, font_family: c.font_family || 'sans',
        header_colour: c.header_colour || null, show_browser_link: !!c.show_browser_link,
        status: 'draft', created_by: MR.auth.userId()
      };
      if (c.style) copy.style = c.style;
      return MR.api.insert('mailroom_campaigns', copy);
    }).then(function (rows) { return rows[0]; });
  };
  MR.duplicateButton = function (id, kind) {
    var label = 'Duplicate';
    var b = MR.h('button', { type: 'button', class: kind === 'button' ? 'dr-button' : 'mr-linkbtn', text: kind === 'button' ? 'Duplicate and edit' : label });
    var idle = b.textContent;
    b.addEventListener('click', function () {
      b.disabled = true; b.textContent = 'Copying\u2026';
      MR.duplicateCampaign(id).then(function (row) {
        location.href = 'campaign.html?id=' + encodeURIComponent(row.id) + '&copied=1';
      }, function (err) {
        b.disabled = false; b.textContent = idle;
        MR.announce('The campaign could not be copied. ' + (err && err.message ? err.message : ''));
        window.alert('The campaign could not be copied. Please try again.');
      });
    });
    return b;
  };

  /* ---------------- paying for a plan ----------------
     Card payment is Stripe's own page; this only starts it. The plan changes
     when Stripe confirms the payment to the mailroom-stripe function, never
     because a browser says it has paid.

       MR.billing.start('plus', 'year')   goes to Stripe, or changes the plan on
                                          an existing subscription
       MR.billing.portal()                Stripe's page for card, invoices and
                                          cancelling
       MR.billing.remember / intent       a plan chosen before signing in, kept
                                          for this tab so the account page can
                                          offer to finish the job

     Each returns a promise. A rejection carries a sentence a member can read. */
  // The name of a paid plan, from its code. A plan is Basic, Plus or Max at one
  // volume, written <plan>_<thousands>k (plus_75k is "Plus, 75,000 emails a
  // month"). The earlier codes, no longer sold, keep their names so an account
  // still on one reads correctly. One function, used by the pricing page and
  // the account pages, so a plan is never unknown to one of them.
  var LEGACY_PLANS = {
    basic: 'Basic', plus: 'Plus', max: 'Max', step20k: '20,000 emails a month', step60k: '60,000 emails a month',
    step80k: '80,000 emails a month', step100k: '100,000 emails a month'
  };
  MR.planLabel = function (code) {
    code = String(code || '');
    if (LEGACY_PLANS[code]) return LEGACY_PLANS[code];
    var m = /^(basic|plus|max)_(\d{1,4})k$/.exec(code);
    if (!m) return null;
    return m[1].charAt(0).toUpperCase() + m[1].slice(1) + ', ' + (parseInt(m[2], 10) * 1000).toLocaleString('en-GB') + ' emails a month';
  };

  MR.billing = (function () {
    var KEY = 'mr_plan_intent';
    function say(err) {
      var code = String(err && err.message || '');
      var map = {
        payments_not_open: 'Online payment is not open yet. To move onto a plan, email ami@abta.africa.',
        not_signed_in: 'Sign in first, then choose a plan.',
        account_required: 'Create your sender account first, then choose a plan.',
        not_allowed: 'That account is not yours to change.',
        account_closed: 'This account is closed.',
        unknown_plan: 'That plan does not exist.',
        plan_not_for_sale: 'That plan cannot be bought online yet. Email ami@abta.africa.',
        already_on_this_plan: 'Your account is already on this plan.',
        no_billing_yet: 'There is no billing to manage yet. Choose a plan first.',
        subscription_not_found: 'Your subscription could not be found. Email ami@abta.africa.'
      };
      return map[code] || 'That could not be started. Please try again shortly.';
    }
    function go(body) {
      return MR.fn('mailroom-billing', body).then(function (r) {
        if (r && r.url) { location.href = r.url; return { leaving: true }; }
        return r || {};
      }, function (err) { throw new Error(say(err)); });
    }
    return {
      message: say,
      start: function (plan, interval) {
        return go({ action: 'checkout', plan: plan, interval: interval === 'year' ? 'year' : 'month' });
      },
      portal: function () { return go({ action: 'portal' }); },
      remember: function (plan, interval) {
        try { sessionStorage.setItem(KEY, JSON.stringify({ plan: plan, interval: interval === 'year' ? 'year' : 'month' })); } catch (e) { /* private mode */ }
      },
      intent: function () {
        try {
          var v = JSON.parse(sessionStorage.getItem(KEY) || 'null');
          return v && MR.planLabel(v.plan) ? v : null;
        } catch (e) { return null; }
      },
      forget: function () { try { sessionStorage.removeItem(KEY); } catch (e) { /* private mode */ } }
    };
  })();

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
  // MR.done empties its target with this. It was called there and never
  // defined, so a finished import or send showed an error instead of the
  // confirmation page.
  MR.clear = function (el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
    return el;
  };

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
    // A signed-in member does not need to be asked to create an account.
    if (MR.auth.signedIn()) {
      [].forEach.call(document.querySelectorAll('[data-mr-start]'), function (a) {
        a.textContent = 'Go to your mailroom';
        a.setAttribute('href', 'account.html');
      });
    }
    // The member navigation. Shown to a signed-in member, and in preview mode
    // so the sample pages demonstrate the product rather than a locked door.
    var memberNav = document.getElementById('mr-member-nav');
    if (memberNav) { buildMemberNav(memberNav); memberNav.hidden = !(MR.auth.signedIn() || MR.cfg.demo); }

    addBackLink();
    linkProductName();

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


  /* The product name in the shared band ("Mailroom") takes the visitor to the
     Mailroom home page. The band belongs to nav.js and is left as it is: this
     only wraps its text in a link once the band exists, in the same colour and
     type, so nothing looks different. */
  function linkProductName() {
    // One folder level for the pages under /mailroom/legal/, none elsewhere.
    var home = /\/mailroom\/legal\//.test(window.location.pathname) ? '../index.html' : 'index.html';
    function wrap() {
      var name = document.querySelector('.ami-band__name:not([data-mr-home])');
      if (!name) return;
      name.setAttribute('data-mr-home', '1');
      var a = document.createElement('a');
      a.href = home;
      a.textContent = name.textContent;
      a.style.cssText = 'color:inherit;text-decoration:none;font:inherit';
      a.setAttribute('aria-label', 'Mailroom home');
      name.textContent = '';
      name.appendChild(a);
    }
    wrap();
    if (window.MutationObserver) {
      new MutationObserver(wrap).observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  /* A way back from pages that are opened from another page: How your email
     looks and Sending domains from Settings, Add subscribers from Lists, and a
     sent campaign from Campaigns. The row above shows the same place. */
  var BACK_LINKS = {
    'brand.html': ['settings.html', 'Settings'], 'domain.html': ['settings.html', 'Settings'],
    'import.html': ['lists.html', 'Your lists'], 'campaign-view.html': ['campaigns.html', 'Campaigns']
  };
  function addBackLink() {
    var here = location.pathname.split('/').pop();
    var back = BACK_LINKS[here], main = document.getElementById('main');
    if (!back || !main || main.querySelector('.mr-back')) return;
    var row = MR.h('div', { class: 'dr-width mr-back' },
      MR.h('a', { href: back[0], text: '\u2039 ' + back[1] }));
    main.insertBefore(row, main.firstChild);
  }

  /* ---------------- the member menu ----------------
     One definition, so every page has the same menu. It is a plain row of
     links on purpose: the AMI header (nav.js) reads these links and shows them
     as the section bar for a signed-in member, so they must be ordinary links,
     one level deep, in the order a sender works. */
  var MEMBER_MENU = [
    ['Your mailroom', 'account.html'],
    ['Campaigns', 'campaigns.html'],
    ['Lists', 'lists.html'],
    ['Signup forms', 'forms.html'],
    ['Integrations', 'integrations.html'],
    ['Settings', 'settings.html']
  ];
  // Pages that belong under one of the links above, so the row still shows
  // where you are. How your email looks and Sending domains are opened from
  // the Settings page.
  var MEMBER_PARENT = {
    'campaign.html': 'campaigns.html', 'campaign-view.html': 'campaigns.html',
    'import.html': 'lists.html', 'brand.html': 'settings.html', 'domain.html': 'settings.html'
  };

  function buildMemberNav(root) {
    var inner = root.querySelector('.mr-subnav__inner');
    if (!inner) return;
    var here = (location.pathname.split('/').pop() || 'account.html');
    here = MEMBER_PARENT[here] || here;
    inner.textContent = '';
    var nav = MR.h('nav', { class: 'mr-subnav__group', 'aria-label': 'Your mailroom' });
    MEMBER_MENU.forEach(function (it) {
      nav.appendChild(MR.h('a', { href: it[1], 'aria-current': it[1] === here ? 'page' : null, text: it[0] }));
    });
    inner.appendChild(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();
