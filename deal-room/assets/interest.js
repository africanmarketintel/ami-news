/* Deal Room v2 – express interest (question pages) */
(function () {
  'use strict';
  var DR = window.DR, h = DR.h;

  var INVOLVEMENT = [
    { value: 'Equity Investment', label: 'Equity investment' },
    { value: 'Debt Financing', label: 'Debt financing' },
    { value: 'Acquisition', label: 'Acquisition' },
    { value: 'Joint Venture', label: 'Joint venture' },
    { value: 'Strategic Partnership', label: 'Strategic partnership' },
    { value: 'Commercial Contract', label: 'Commercial contract' }
  ];
  var INVESTOR_TYPES = [
    { value: 'Family Office', label: 'Family office' },
    { value: 'Private Equity', label: 'Private equity' },
    { value: 'Venture Capital', label: 'Venture capital' },
    { value: 'Corporate Investor', label: 'Corporate investor' },
    { value: 'Development Finance Institution', label: 'Development finance institution' },
    { value: 'Bank / Lender', label: 'Bank or lender' },
    { value: 'Sovereign Fund', label: 'Sovereign fund' }
  ];
  var ELIGIBILITY = [
    { value: 'reviewed', label: 'I have read the listing for this opportunity.' },
    { value: 'genuine', label: 'My organisation has a genuine interest in this opportunity.' },
    { value: 'capacity', label: 'My organisation has the financial, commercial, operational or strategic capacity relevant to this opportunity.' },
    { value: 'authority', label: 'I am authorised to act for my organisation.' },
    { value: 'sanctions', label: 'My organisation is not subject to sanctions, regulatory restrictions or legal barriers that would prevent it from pursuing this opportunity.' }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var app = document.getElementById('app');
    var ref = (DR.params.get('ref') || '').slice(0, 40);
    var step = DR.params.get('step') || '';
    if (!DR.requireSignIn()) return;

    if (!ref) {
      DR.setTitle('Choose an opportunity');
      DR.clear(app).appendChild(h('div', { class: 'dr-narrow', style: 'margin-top:2rem' },
        h('h1', { text: 'Choose an opportunity first' }),
        h('p', { text: 'You can express interest from the page of any listed opportunity.' }),
        h('p', null, h('a', { href: 'opportunities.html', text: 'Browse opportunities' }))));
      return;
    }

    var key = 'dr_interest_' + ref;
    var cached = DR.store.get(key, null);

    // The confirmation page must not re-check membership or reload the listing.
    if (step === 'confirmation' && cached && cached.reference) return start(app, ref, key, cached.deal, cached.account);

    Promise.all([DR.loadAccount(), DR.listings({ ref: ref, limit: 1 })]).then(function (r) {
      var account = r[0], listing = r[1];
      if (account.signedOut) { DR.requireSignIn(); return; }
      if (account.unavailable) { DR.clear(app).appendChild(DR.unavailablePage('Expressing interest online is not available yet', 'express interest')); return; }
      if (account.error) { DR.clear(app).appendChild(h('p', { style: 'margin-top:2rem', text: 'Sorry, there is a problem with the service. Try again later.' })); return; }
      var gate = DR.membershipGate(account, 'express interest');
      if (gate) { DR.setTitle('Membership needed'); DR.clear(app).appendChild(gate); return; }
      if (!listing.ok || !listing.rows.length) {
        DR.setTitle('Opportunity not found');
        DR.clear(app).appendChild(h('div', { class: 'dr-narrow', style: 'margin-top:2rem' }, h('h1', { text: 'Opportunity not found' }), h('p', null, h('a', { href: 'opportunities.html', text: 'Browse current opportunities' }))));
        return;
      }
      start(app, ref, key, listing.rows[0], account);
    });
  });

  function start(app, ref, key, deal, account) {
    var m = account.member || {};
    var title = deal.teaser_headline || ref;
    var existing = DR.store.get(key, null) || { answers: {}, done: {} };
    existing.deal = deal; existing.account = account;
    DR.store.set(key, existing);

    DR.flow({
      key: key,
      page: 'express-interest.html',
      baseParams: { ref: ref },
      container: app,
      caption: 'Express interest – Ref ' + ref,
      checkStep: 'check',
      firstBack: 'opportunity.html' + DR.qs({ ref: ref }),
      steps: [
        { id: 'before', type: 'custom', title: 'Before you express interest', back: true, render: function (ctx) {
            ctx.wrapper.appendChild(h('span', { class: 'dr-caption-l', text: 'Express interest – Ref ' + ref }));
            ctx.wrapper.appendChild(h('h1', { text: 'Before you express interest' }));
            ctx.wrapper.appendChild(h('p', null, 'You are expressing interest in: ', h('strong', { text: title })));
            ctx.wrapper.appendChild(h('p', { text: 'We will ask you:' }));
            ctx.wrapper.appendChild(h('ul', { class: 'dr-list' }, h('li', { text: 'what type of involvement you want' }), h('li', { text: 'what type of investor your organisation is' }), h('li', { text: 'why this opportunity fits your mandate, in up to 250 words' }), h('li', { text: 'to confirm your eligibility' })));
            ctx.wrapper.appendChild(h('p', { text: 'ABTA uses this to decide whether to introduce you. The other party will not see your request unless ABTA introduces you.' }));
            if (m.verification_status !== 'verified') {
              ctx.wrapper.appendChild(h('div', { class: 'dr-inset' }, h('p', { text: 'ABTA has not finished verifying your organisation. You can still express interest, but ABTA will not introduce you until verification is complete.' })));
            }
            var btn = h('a', { href: ctx.url('involvement'), role: 'button', draggable: 'false', class: 'dr-button', text: 'Continue' });
            ctx.wrapper.appendChild(btn);
            ctx.state.done.before = true; ctx.save();
          } },
        { id: 'involvement', title: 'What type of involvement are you interested in?', requires: ['before'], fields: [
          { type: 'radios', name: 'opp_type', legend: 'What type of involvement are you interested in?', options: INVOLVEMENT, required: 'Select the type of involvement you are interested in' }] },
        { id: 'investor', title: 'What type of investor is your organisation?', requires: ['involvement'], fields: [
          { type: 'radios', name: 'investor_type', legend: 'What type of investor is your organisation?', required: 'Select what type of investor your organisation is',
            options: INVESTOR_TYPES.concat([{ divider: 'or' }, { value: 'Other', label: 'Other', conditional: { type: 'text', name: 'investor_type_other', label: 'Type of investor', required: 'Enter the type of investor' } }]),
            prefill: function () { return m.org_type && INVESTOR_TYPES.some(function (o) { return o.value === m.org_type; }) ? m.org_type : undefined; } }] },
        { id: 'range', title: 'What is your organisation’s typical investment range?', requires: ['investor'], fields: [
          { type: 'text', name: 'invest_range', label: 'What is your organisation’s typical investment range?', hint: 'For example, USD 10m to 50m', optional: true, width: 20, validate: function (v) { return v.length > 100 ? 'Investment range must be 100 characters or fewer' : null; } }] },
        { id: 'rationale', title: 'Why is your organisation interested in this opportunity?', requires: ['investor'], fields: [
          { type: 'textarea', name: 'rationale', label: 'Why is your organisation interested in this opportunity?', maxWords: 250, rows: 10,
            hint: h('span', null, 'Explain how it fits your mandate and what your organisation could bring to a transaction. Do not include confidential information about other deals.'),
            required: 'Enter why your organisation is interested in this opportunity' }] },
        { id: 'eligibility', title: 'Confirm your eligibility', requires: ['rationale'], fields: [
          { type: 'checkboxes', name: 'eligibility', legend: 'Confirm your eligibility', hint: 'Select all that apply. You must confirm all 5 statements to continue.', options: ELIGIBILITY,
            required: 'Confirm all 5 eligibility statements', requireAll: 'Confirm all 5 eligibility statements. If you cannot, contact ABTA before continuing' }] },
        { id: 'phone', title: 'What is your telephone number?', requires: ['eligibility'], fields: [
          { type: 'tel', name: 'contact_phone', label: 'What is your telephone number?', hint: 'Include the country code, for example +44 20 7946 0000. ABTA will only use this to discuss this request.', optional: true, autocomplete: 'tel', width: 20,
            validate: function (v) { return /^[+0-9()\s-]{6,25}$/.test(v) ? null : 'Enter a telephone number, like +44 20 7946 0000'; } }] },
        { id: 'check', type: 'check', title: 'Check your answers before sending your request', requires: ['eligibility'], button: 'Accept and send', busyText: 'Sending…',
          sections: function (s) {
            var a = s.answers;
            return [
              { title: 'Opportunity', rows: [{ key: 'Reference', value: ref }, { key: 'Listing', value: title }] },
              { title: 'Your request', rows: [
                { key: 'Type of involvement', value: DR.label(INVOLVEMENT, a.opp_type), step: 'involvement' },
                { key: 'Type of investor', value: a.investor_type === 'Other' ? a.investor_type_other : DR.label(INVESTOR_TYPES, a.investor_type), step: 'investor' },
                { key: 'Typical investment range', value: a.invest_range, step: 'range' },
                { key: 'Why you are interested', value: a.rationale, step: 'rationale' },
                { key: 'Eligibility', value: (a.eligibility || []).length === ELIGIBILITY.length ? 'All 5 statements confirmed' : 'Not confirmed', step: 'eligibility' },
                { key: 'Telephone', value: a.contact_phone, step: 'phone' }] },
              { title: 'Your details', rows: [
                { key: 'Name', value: m.full_name }, { key: 'Organisation', value: m.organisation }, { key: 'Job title', value: m.role }, { key: 'Email', value: m.email }] }
            ];
          },
          declaration: function () {
            return [
              h('p', { class: 'dr-small' }, 'To change your name, organisation or email, ', h('a', { href: 'account.html?section=details', text: 'update your account details' }), '.'),
              h('h2', { text: 'Now send your request' }),
              h('p', { text: 'By sending this request you confirm that the information you have given is correct, and you acknowledge that:' }),
              h('ul', { class: 'dr-list' },
                h('li', { text: 'this opportunity was made available to you through the ABTA Deal Room' }),
                h('li', { text: 'any introduction is governed by the Platform Membership Agreement, including its non-circumvention terms' }),
                h('li', { text: 'any disclosure of identity by ABTA counts as an introduction' }),
                h('li', { text: 'you will not try to identify or contact the other party outside ABTA’s process' }),
                h('li', { text: 'sending this request does not guarantee an introduction or a transaction' })),
              h('p', null, h('a', { href: 'legal/platform-agreement.html', target: '_blank', rel: 'noopener', text: 'Read the Platform Membership Agreement (opens in new tab)' }))
            ];
          },
          onSubmit: function (s) {
            var a = s.answers;
            return DR.fn('deal-room-interest-gateway', { body: {
              teaser_ref: ref,
              opp_type: a.opp_type,
              organisation: m.organisation, contact_name: m.full_name, contact_role: m.role, contact_email: m.email,
              contact_phone: a.contact_phone || null,
              investor_type: a.investor_type === 'Other' ? a.investor_type_other : a.investor_type,
              invest_range: a.invest_range || null,
              rationale: a.rationale,
              eligibility_confirmed: ELIGIBILITY.map(function (e) { return e.value; }),
              acknowledgements_version: '2.0'
            } }).then(function (res) {
              if (!res.ok) {
                var err = res.data && res.data.error;
                var msg = err === 'not_a_member' ? 'Your membership could not be confirmed. Sign out, sign in again and try again'
                  : err === 'rationale_too_long' ? 'Why you are interested must be 250 words or fewer'
                  : 'Your request could not be sent. Try again, or email ami@abta.africa if the problem continues';
                return { errors: [{ name: 'submit', message: msg, target: 'main' }] };
              }
              s.reference = (res.data && res.data.reference) || '';
              return { next: 'confirmation' };
            });
          } },
        { id: 'confirmation', type: 'custom', title: 'Request sent', back: false, render: function (ctx) {
            var s = ctx.state;
            if (!s.reference) { location.replace(ctx.url('before')); return; }
            ctx.wrapper.appendChild(h('div', { class: 'dr-panel' },
              h('h1', { text: 'Request sent' }),
              h('div', { class: 'dr-panel__body' }, s.reference ? ['Your reference number', h('strong', { text: s.reference })] : 'ABTA has received your request')));
            ctx.wrapper.appendChild(h('h2', { text: 'What happens next' }));
            ctx.wrapper.appendChild(h('p', { text: 'ABTA will review your request for suitability, credibility and fit. We aim to reply within 5 business days.' }));
            ctx.wrapper.appendChild(h('p', { text: 'If ABTA decides to introduce you, both parties will receive an Introduction Notice that shares identities and contact details. If not, we will let you know.' }));
            ctx.wrapper.appendChild(h('p', null, 'You can track this request in ', h('a', { href: 'account.html?section=interests', text: 'Your Deal Room' }), '.'));
            ctx.wrapper.appendChild(h('p', null, h('a', { href: 'opportunities.html', text: 'Browse more opportunities' })));
            ctx.wrapper.appendChild(h('p', { class: 'dr-small' }, h('a', { href: 'mailto:ami@abta.africa?subject=Deal%20Room%20feedback', text: 'What did you think of this service?' }), ' (takes 30 seconds)'));
            // Keep only what the confirmation page needs.
            DR.store.set(key, { answers: {}, done: {}, reference: s.reference, deal: deal, account: account });
          } }
      ]
    });
  }
})();
