/* Deal Room v2 – Your Deal Room (member account area) */
(function () {
  'use strict';
  var DR = window.DR, h = DR.h;

  var SECTIONS = [
    ['overview', 'Overview'],
    ['interests', 'Your requests'],
    ['introductions', 'Introductions'],
    ['opportunities', 'Your listed opportunities'],
    ['saved', 'Saved opportunities'],
    ['alerts', 'Email alerts'],
    ['details', 'Account and membership']
  ];
  var INTEREST_STATUS = {
    submitted: ['Submitted', 'dr-tag--blue'],
    screening: ['Being screened', 'dr-tag--yellow'],
    introduced: ['Introduced', 'dr-tag--green'],
    declined: ['Not progressed', 'dr-tag--grey']
  };
  var SUBMISSION_STATUS = {
    pending: ['Under review', 'dr-tag--yellow'],
    approved: ['Published', 'dr-tag--green'],
    rejected: ['Not accepted', 'dr-tag--grey']
  };

  document.addEventListener('DOMContentLoaded', function () {
    var app = document.getElementById('app');
    if (!DR.requireSignIn()) return;
    var section = DR.params.get('section') || 'overview';
    if (!SECTIONS.some(function (s) { return s[0] === section; })) section = 'overview';

    DR.loadAccount().then(function (acc) {
      if (acc.signedOut) { DR.requireSignIn(); return; }
      if (acc.unavailable) { DR.clear(app).appendChild(DR.unavailablePage('Your Deal Room is not available yet', 'view your requests, introductions and membership')); return; }
      if (acc.error) { DR.clear(app).appendChild(h('p', { style: 'margin-top:2rem', text: 'Sorry, there is a problem with the service. Try again later.' })); return; }
      var m = acc.member;
      if (!m) { DR.setTitle('Membership needed'); DR.clear(app).appendChild(DR.membershipGate(acc, 'use Your Deal Room')); return; }
      render(app, acc, section);
    });
  });

  function render(app, acc, section) {
    var m = acc.member;
    var label = SECTIONS.filter(function (s) { return s[0] === section; })[0][1];
    DR.setTitle(label + ' – Your Deal Room');
    DR.clear(app);

    var nav = h('nav', { 'aria-label': 'Your Deal Room' }, h('ul', { class: 'dr-subnav' }, SECTIONS.map(function (s) {
      return h('li', null, h('a', { href: 'account.html?section=' + s[0], 'aria-current': s[0] === section ? 'true' : null, text: s[1] }));
    })));
    var content = h('div');
    app.appendChild(h('div', { style: 'margin-top:1.5rem' },
      h('span', { class: 'dr-caption-l', text: [m.full_name, m.organisation].filter(Boolean).join(', ') }),
      h('h1', { text: 'Your Deal Room' }),
      m.status !== 'active' ? DR.membershipGate(acc, 'use all Deal Room features') : null,
      h('div', { class: 'dr-grid dr-account-grid' }, nav, content)));

    content.appendChild(h('h2', { style: 'margin-top:0', text: label }));
    ({ overview: overview, interests: interests, introductions: introductions, opportunities: opportunities, saved: saved, alerts: alerts, details: details })[section](content, acc);
  }

  function tag(map, status) {
    var t = map[status] || [status || 'Unknown', 'dr-tag--grey'];
    return h('strong', { class: 'dr-tag ' + t[1], text: t[0] });
  }

  function verificationText(m) {
    if (m.verification_status === 'verified') return h('strong', { class: 'dr-tag dr-tag--green', text: 'Verified' });
    if (m.verification_status === 'failed') return h('strong', { class: 'dr-tag dr-tag--red', text: 'Not verified' });
    return h('strong', { class: 'dr-tag dr-tag--yellow', text: 'Verification in progress' });
  }

  function overview(c, acc) {
    var m = acc.member, ints = acc.interests || [], subs = acc.submissions || [];
    c.appendChild(h('div', { class: 'dr-status-card' },
      h('h3', { text: 'Membership' }),
      h('p', null, m.status === 'active' ? h('strong', { class: 'dr-tag dr-tag--green', text: 'Active' }) : h('strong', { class: 'dr-tag dr-tag--yellow', text: m.status === 'pending_payment' ? 'Payment needed' : 'Not active' }),
        m.paid_until ? ' ' + (m.renews === false ? 'Ends on ' : 'Renews on ') + DR.formatDate(m.paid_until) : ''),
      h('p', null, 'Organisation verification: ', verificationText(m)),
      m.verification_status !== 'verified' ? h('p', { class: 'dr-secondary', text: 'ABTA checks your organisation’s registration and screens it against sanctions lists. ABTA will not make an introduction until this is complete.' }) : null));
    var open = ints.filter(function (i) { return i.status === 'submitted' || i.status === 'screening'; }).length;
    var introduced = ints.filter(function (i) { return i.status === 'introduced'; }).length;
    c.appendChild(h('div', { class: 'dr-grid dr-grid--thirds' },
      stat('Requests being reviewed', open, 'account.html?section=interests'),
      stat('Introductions', introduced, 'account.html?section=introductions'),
      stat('Listed opportunities', subs.length, 'account.html?section=opportunities')));
    c.appendChild(h('h3', { text: 'Find opportunities' }));
    c.appendChild(h('p', null, h('a', { href: 'opportunities.html', text: 'Browse all opportunities' }), ' or ', h('a', { href: 'account.html?section=alerts', text: 'set up email alerts' }), '.'));
  }
  function stat(label, n, href) {
    return h('div', { class: 'dr-status-card' }, h('p', { class: 'dr-price', style: 'font-size:2rem', text: String(n) }), h('p', { style: 'margin:0' }, h('a', { href: href, text: label })));
  }

  function interests(c, acc) {
    var ints = acc.interests || [];
    if (!ints.length) { c.appendChild(h('div', { class: 'dr-empty' }, h('p', { text: 'You have not expressed interest in any opportunities yet.' }), h('p', null, h('a', { href: 'opportunities.html', text: 'Browse opportunities' })))); return; }
    var steps = ['submitted', 'screening', 'introduced'];
    ints.forEach(function (i) {
      var idx = steps.indexOf(i.status);
      c.appendChild(h('div', { class: 'dr-status-card' },
        h('h3', null, h('a', { href: 'opportunity.html' + DR.qs({ ref: i.teaser_ref }), text: 'Opportunity ' + i.teaser_ref })),
        h('p', null, 'Your reference: ', h('strong', { text: i.reference || '–' }), ' · Sent on ' + DR.formatDate(i.created_at)),
        h('p', null, 'Status: ', tag(INTEREST_STATUS, i.status)),
        i.status === 'declined' ? h('p', { text: 'ABTA decided not to progress this request' + (i.declined_at ? ' on ' + DR.formatDate(i.declined_at) : '') + '. This does not affect other requests.' })
          : h('ol', { class: 'dr-tracker', 'aria-label': 'Progress' }, ['Sent', 'Being screened', 'Introduced'].map(function (s, n) {
            return h('li', { class: n < idx ? 'is-done' : null, 'aria-current': n === idx ? 'step' : null, text: s });
          }))));
    });
  }

  function introductions(c, acc) {
    var list = (acc.interests || []).filter(function (i) { return i.status === 'introduced'; });
    c.appendChild(h('p', { text: 'When ABTA introduces you, the other party’s details appear here and in your Introduction Notice email.' }));
    if (!list.length) { c.appendChild(h('div', { class: 'dr-empty' }, h('p', { text: 'You do not have any introductions yet.' }))); return; }
    list.forEach(function (i) {
      var box = h('div', { class: 'dr-status-card' },
        h('h3', { text: 'Opportunity ' + i.teaser_ref }),
        h('p', { class: 'dr-secondary', text: 'Introduced on ' + DR.formatDate(i.introduced_at) + (i.reference ? ' · Your reference ' + i.reference : '') }));
      var body = h('div', { 'aria-live': 'polite' }, h('p', { class: 'dr-loading', text: 'Loading contact details…' }));
      box.appendChild(body);
      c.appendChild(box);
      DR.fn('deal-room-reveal', { body: { teaser_ref: i.teaser_ref } }).then(function (res) {
        DR.clear(body);
        if (!res.ok) {
          body.appendChild(h('p', { text: res.data && res.data.error === 'verification_required' ? 'Contact details will appear once ABTA has finished verifying your organisation.' : 'Contact details are not available yet. Check your Introduction Notice email or contact ABTA.' }));
          return;
        }
        var dl = h('dl', { class: 'dr-summary-list' });
        (res.data.fields || []).forEach(function (f) {
          var label = String(f[0] || ''), value = String(f[1] || '');
          var val = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? h('a', { href: 'mailto:' + value, text: value }) : value;
          dl.appendChild(h('div', { class: 'dr-summary-list__row' }, h('dt', { class: 'dr-summary-list__key', text: label }), h('dd', { class: 'dr-summary-list__value' }, val), h('dd', { class: 'dr-summary-list__actions' })));
        });
        body.appendChild(dl);
        body.appendChild(h('p', { class: 'dr-small', text: 'These details are confidential under the Non-Disclosure Agreement. Any transaction with this party is covered by the Platform Membership Agreement.' }));
      });
    });
  }

  function opportunities(c, acc) {
    var subs = acc.submissions || [];
    c.appendChild(h('p', null, h('a', { href: 'submit-opportunity.html', role: 'button', draggable: 'false', class: 'dr-button', text: 'List an opportunity' })));
    if (!subs.length) { c.appendChild(h('div', { class: 'dr-empty' }, h('p', { text: 'You have not listed any opportunities yet.' }))); return; }
    var tbody = h('tbody');
    subs.forEach(function (s) {
      tbody.appendChild(h('tr', null,
        h('td', { text: s.reference || '–' }),
        h('td', { text: [DR.label(DR.DEAL_TYPES, s.deal_type), DR.label(DR.SECTORS, s.sector)].filter(Boolean).join(', ') }),
        h('td', { text: DR.formatDate(s.created_at) }),
        h('td', null, tag(SUBMISSION_STATUS, s.status), s.published_ref ? [h('br'), h('a', { href: 'opportunity.html' + DR.qs({ ref: s.published_ref }), text: 'View listing' })] : null)));
    });
    c.appendChild(h('div', { class: 'dr-table-wrap' }, h('table', { class: 'dr-table' },
      h('caption', { class: 'dr-visually-hidden', text: 'Your listed opportunities' }),
      h('thead', null, h('tr', null, ['Reference', 'Opportunity', 'Sent on', 'Status'].map(function (t) { return h('th', { scope: 'col', text: t }); }))),
      tbody)));
  }

  function saved(c, acc) {
    var refs = acc.bookmarks || [];
    if (!refs.length) { c.appendChild(h('div', { class: 'dr-empty' }, h('p', { text: 'You have not saved any opportunities. Select Save on any listing to keep it here.' }), h('p', null, h('a', { href: 'opportunities.html', text: 'Browse opportunities' })))); return; }
    var ul = h('ul', { class: 'dr-cards' });
    c.appendChild(ul);
    Promise.all(refs.map(function (r) { return DR.listings({ ref: r, limit: 1 }); })).then(function (results) {
      var found = 0;
      results.forEach(function (res, i) {
        if (res.ok && res.rows.length) { found++; ul.appendChild(DR.card(res.rows[0], { saved: true })); }
        else ul.appendChild(h('li', { class: 'dr-empty' }, h('p', { text: 'Opportunity ' + refs[i] + ' is no longer listed.' })));
      });
      if (!found) DR.announce('None of your saved opportunities are still listed');
    });
  }

  function alerts(c) {
    var p = DR.params;
    var box = h('div');
    c.appendChild(box);
    DR.fn('deal-room-preferences').then(function (res) {
      var prefs = res.ok ? res.data : { preferred_sectors: [], preferred_regions: [], digest_opt_in: false };
      var sectors = (prefs.preferred_sectors || []).slice();
      var regions = (prefs.preferred_regions || []).slice();
      var added = [];
      if (p.get('sector') && sectors.indexOf(p.get('sector')) === -1) { sectors.push(p.get('sector')); added.push(DR.label(DR.SECTORS, p.get('sector'))); }
      if (p.get('region') && regions.indexOf(p.get('region')) === -1) { regions.push(p.get('region')); added.push(p.get('region')); }
      form(box, sectors, regions, added.length ? true : !!prefs.digest_opt_in, added, []);
    });
  }

  function form(box, sectors, regions, optIn, added, errors) {
    DR.clear(box);
    if (errors.length) box.appendChild(h('div', { class: 'dr-error-summary', tabindex: '-1', role: 'alert' }, h('h2', { class: 'dr-error-summary__title', text: 'There is a problem' }), h('ul', { class: 'dr-error-summary__list' }, errors.map(function (e) { return h('li', null, h('a', { href: '#' + e.id, text: e.message })); }))));
    box.appendChild(h('p', { text: 'Once a week, ABTA emails you new opportunities published in the last 7 days that match at least one sector or region you choose.' }));
    if (added.length) box.appendChild(h('div', { class: 'dr-inset' }, h('p', { text: 'We have added ' + added.join(' and ') + ' from your search. Save to confirm.' })));
    function group(name, legend, list, selected) {
      return h('div', { class: 'dr-form-group' }, h('fieldset', { class: 'dr-fieldset' },
        h('legend', { class: 'dr-fieldset__legend dr-fieldset__legend--m', text: legend }),
        h('div', { class: 'dr-hint', text: 'Select all that apply.' }),
        list.map(function (o, i) {
          var id = name + '-' + i;
          return h('div', { class: 'dr-choice dr-choice--checkbox' }, h('input', { class: 'dr-choice__input', type: 'checkbox', id: id, name: name, value: o.value, checked: selected.indexOf(o.value) !== -1 }), h('label', { class: 'dr-choice__label', for: id, text: o.label }));
        })));
    }
    var err = errors[0];
    var f = h('form', { novalidate: true },
      h('div', { class: 'dr-form-group' + (err ? ' dr-form-group--error' : '') }, h('fieldset', { class: 'dr-fieldset' },
        h('legend', { class: 'dr-fieldset__legend dr-fieldset__legend--m', text: 'Do you want weekly email alerts?' }),
        err ? h('p', { class: 'dr-error-message' }, h('span', { class: 'dr-visually-hidden', text: 'Error: ' }), err.message) : null,
        h('div', { class: 'dr-choice dr-choice--radio' }, h('input', { class: 'dr-choice__input', type: 'radio', id: 'opt-yes', name: 'opt', value: 'yes', checked: optIn }), h('label', { class: 'dr-choice__label', for: 'opt-yes', text: 'Yes, email me each week' })),
        h('div', { class: 'dr-choice dr-choice--radio' }, h('input', { class: 'dr-choice__input', type: 'radio', id: 'opt-no', name: 'opt', value: 'no', checked: !optIn }), h('label', { class: 'dr-choice__label', for: 'opt-no', text: 'No, do not email me alerts' })))),
      group('sector', 'Sectors', DR.SECTORS.filter(function (s) { return s.value !== 'Other'; }), sectors),
      group('region', 'Regions', DR.REGIONS, regions),
      h('button', { type: 'submit', class: 'dr-button', text: 'Save alert settings' }));
    box.appendChild(f);
    if (errors.length) box.firstChild.focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = Array.prototype.map.call(f.querySelectorAll('input[name=sector]:checked'), function (i) { return i.value; });
      var r = Array.prototype.map.call(f.querySelectorAll('input[name=region]:checked'), function (i) { return i.value; });
      var yes = f.querySelector('#opt-yes').checked;
      if (yes && !s.length && !r.length) return form(box, s, r, yes, [], [{ id: 'sector-0', message: 'Select at least one sector or region to get alerts' }]);
      DR.fn('deal-room-preferences', { body: { preferred_sectors: s, preferred_regions: r, digest_opt_in: yes } }).then(function (res) {
        form(box, s, r, yes, [], []);
        box.insertBefore(res.ok
          ? h('div', { class: 'dr-banner', role: 'alert' }, h('p', { class: 'dr-banner__title', text: 'Success' }), h('div', { class: 'dr-banner__content' }, h('p', { text: yes ? 'Your alert settings have been saved.' : 'You will not receive alert emails.' })))
          : h('div', { class: 'dr-error-summary', role: 'alert' }, h('h2', { class: 'dr-error-summary__title', text: 'There is a problem' }), h('p', { text: 'Your settings could not be saved. Try again.' })), box.firstChild);
      });
    });
  }

  function details(c, acc) {
    var m = acc.member;
    function row(k, v) { return h('div', { class: 'dr-summary-list__row' }, h('dt', { class: 'dr-summary-list__key', text: k }), h('dd', { class: 'dr-summary-list__value' }, v || 'Not provided'), h('dd', { class: 'dr-summary-list__actions' })); }
    c.appendChild(h('h3', { text: 'Your details' }));
    c.appendChild(h('dl', { class: 'dr-summary-list' }, row('Name', m.full_name), row('Job title', m.role), row('Email address', m.email)));
    c.appendChild(h('h3', { text: 'Your organisation' }));
    c.appendChild(h('dl', { class: 'dr-summary-list' }, row('Registered name', m.organisation), row('Country of registration', m.company_country), row('Registration number', m.company_number), row('Type', m.org_type), row('Verification', verificationText(m))));
    c.appendChild(h('p', { class: 'dr-small' }, 'To change these details, email ', h('a', { href: 'mailto:ami@abta.africa?subject=Change%20Deal%20Room%20details', text: 'ami@abta.africa' }), '. ABTA may need to verify changes to your organisation.'));
    c.appendChild(h('h3', { text: 'Membership' }));
    c.appendChild(h('dl', { class: 'dr-summary-list' },
      row('Status', m.status === 'active' ? 'Active' : (m.status === 'pending_payment' ? 'Payment needed' : 'Not active')),
      row(m.renews === false ? 'Ends on' : 'Renews on', m.paid_until ? DR.formatDate(m.paid_until) : ''),
      row('Agreement reference', m.agreement_id)));
    var errBox = h('div');
    c.appendChild(errBox);
    var manage = h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Manage payment and renewal' });
    manage.addEventListener('click', function () {
      manage.setAttribute('aria-disabled', 'true');
      DR.fn('deal-room-checkout', { body: { action: 'portal' } }).then(function (res) {
        manage.removeAttribute('aria-disabled');
        var url = res.ok && res.data && res.data.url;
        if (url && (/^https:\/\/billing\.stripe\.com\//.test(url) || /^[a-z-]+\.html(\?|$)/.test(url))) { location.href = url; return; }
        DR.clear(errBox).appendChild(h('p', { class: 'dr-error-message', role: 'alert', text: 'We could not open payment settings. Try again, or email ami@abta.africa.' }));
      });
    });
    if (m.payment_status === 'paid') c.appendChild(h('p', null, manage));
    c.appendChild(h('p', { class: 'dr-secondary', text: 'You can update your card, download invoices and turn off automatic renewal on Stripe’s secure page.' }));
    c.appendChild(h('h3', { text: 'Sign out' }));
    var so = h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Sign out' });
    so.addEventListener('click', function () { DR.auth.signOut().then(function () { location.href = 'index.html?signed_out=1'; }); });
    c.appendChild(so);
  }
})();
