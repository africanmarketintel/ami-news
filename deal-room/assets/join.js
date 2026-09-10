/* Deal Room v2 – join (create an account, accept agreements, pay) */
(function () {
  'use strict';
  var DR = window.DR, h = DR.h;
  var KEY = 'dr_join';
  var AGREEMENT_VERSION = '2.0';

  var ORG_TYPES = [
    { value: 'Strategic investor', label: 'Strategic investor' },
    { value: 'Financial investor', label: 'Financial investor' },
    { value: 'Private equity', label: 'Private equity' },
    { value: 'Family office', label: 'Family office' },
    { value: 'Development finance institution', label: 'Development finance institution' },
    { value: 'Bank / lender', label: 'Bank or lender' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'Advisory firm', label: 'Advisory firm' },
    { divider: 'or' },
    { value: 'Other', label: 'Other', conditional: { type: 'text', name: 'org_type_other', label: 'Type of organisation', required: 'Enter the type of organisation' } }
  ];

  function safeRedirect(url) {
    if (/^https:\/\/checkout\.stripe\.com\//.test(url) || /^https:\/\/billing\.stripe\.com\//.test(url) || /^[a-z-]+\.html(\?|$)/.test(url)) { location.href = url; return true; }
    return false;
  }

  function checkout() {
    return DR.fn('deal-room-checkout', { body: { action: 'membership' } }).then(function (res) {
      if (res.ok && res.data && res.data.url && safeRedirect(res.data.url)) return { next: false };
      var err = res.data && res.data.error;
      var msg = err === 'already_active' ? 'Your membership is already active. Go to Your Deal Room'
        : err === 'agreement_required' ? 'You need to accept the agreements before paying'
        : 'We could not start the payment. Try again, or email ami@abta.africa if the problem continues';
      return { errors: [{ name: 'submit', message: msg, target: 'main' }] };
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var app = document.getElementById('app');
    DR.backendReady().then(function (ready) {
      if (ready) return init(app);
      DR.setTitle('Joining the Deal Room is not open yet');
      DR.clear(app).appendChild(h('div', { class: 'dr-narrow', style: 'margin-top:2rem' },
        h('h1', { text: 'Joining the Deal Room is not open yet' }),
        h('p', { text: 'We are upgrading how members join and pay. You cannot join online at the moment.' }),
        h('p', null, 'Email ', h('a', { href: 'mailto:ami@abta.africa?subject=Deal%20Room%20membership', text: 'ami@abta.africa' }), ' to register your interest and we will contact you when joining opens.'),
        h('p', null, 'Already a member? ', h('a', { href: 'sign-in.html', text: 'Sign in' }), '.'),
        h('p', null, h('a', { href: 'opportunities.html', text: 'Browse opportunities' }))));
    });
  });

  function init(app) {
    var step = DR.params.get('step') || 'start';

    if (step === 'pay' || step === 'confirmation' || step === 'cancelled') {
      if (!DR.requireSignIn()) return;
      return special(app, step);
    }

    if (DR.session.active() && step === 'start') {
      DR.loadAccount().then(function (account) {
        var m = account && account.member;
        if (m && m.status === 'active') {
          DR.setTitle('You are already a member');
          DR.clear(app).appendChild(h('div', { class: 'dr-narrow', style: 'margin-top:2rem' },
            h('h1', { text: 'You are already a Deal Room member' }),
            h('p', null, h('a', { href: 'account.html', text: 'Go to Your Deal Room' }))));
          return;
        }
        if (m && (m.status === 'pending_payment' || m.status === 'expired')) { location.replace('create-account.html?step=pay'); return; }
        run(app);
      });
      return;
    }
    run(app);
  }

  function run(app) {
    var saved = DR.store.get(KEY, { answers: {} });
    var orgName = (saved.answers && saved.answers.organisation) || 'your organisation';
    var signedIn = DR.session.active();

    DR.flow({
      key: KEY,
      page: 'create-account.html',
      container: app,
      caption: 'Join the Deal Room',
      checkStep: 'check',
      steps: [
        { id: 'start', type: 'custom', title: 'Join the ABTA Deal Room', back: false, render: function (ctx) {
            var w = ctx.wrapper;
            w.className = '';
            w.appendChild(h('div', { class: 'dr-grid dr-grid--two-thirds' },
              h('div', null,
                h('h1', { text: 'Join the ABTA Deal Room' }),
                h('p', { class: 'dr-lead', text: 'Membership lets your organisation browse screened opportunities, express interest, ask ABTA questions and list its own opportunities.' }),
                h('p', { text: 'Membership costs £99 a year and renews automatically. You can turn off renewal in your account.' }),
                h('h2', { text: 'Before you start' }),
                h('p', { text: 'You will need:' }),
                h('ul', { class: 'dr-list' },
                  h('li', { text: 'access to your work email account, to receive a 6-digit code' }),
                  h('li', { text: 'your organisation’s registered name, country of registration and registration number' }),
                  h('li', { text: 'to be authorised to act for your organisation' }),
                  h('li', { text: 'a debit or credit card' })),
                h('p', { text: 'ABTA verifies every organisation and screens it against sanctions lists before making any introduction.' }),
                signedIn ? h('p', { text: 'You are signed in, so you will not need to create a new password.' }) : h('p', null, 'If you already have an African Market Intelligence account, ', h('a', { href: 'sign-in.html?return=create-account.html', text: 'sign in first' }), ' so you do not need to create a new one.'),
                h('a', { href: ctx.url('name'), role: 'button', draggable: 'false', class: 'dr-button dr-button--start' }, 'Start now')),
              h('aside', null, h('div', { class: 'dr-contact-panel' },
                h('h2', { text: 'Already a member?' }),
                h('p', null, h('a', { href: 'sign-in.html', text: 'Sign in to Your Deal Room' })),
                h('h2', { text: 'Read the terms' }),
                h('ul', { class: 'dr-list dr-list--plain' },
                  h('li', null, h('a', { href: 'legal/platform-agreement.html', text: 'Platform Membership Agreement' })),
                  h('li', null, h('a', { href: 'legal/nda.html', text: 'Non-Disclosure Agreement' })),
                  h('li', null, h('a', { href: 'legal/fee-schedule.html', text: 'Fee Schedule' })))))));
            ctx.state.done.start = true; ctx.save();
          } },

        { id: 'name', title: 'What is your full name?', requires: ['start'], fields: [
          { type: 'text', name: 'full_name', label: 'What is your full name?', autocomplete: 'name', spellcheck: false, width: 30, required: 'Enter your full name',
            validate: function (v) { return v.length > 100 ? 'Full name must be 100 characters or fewer' : null; } }] },

        { id: 'organisation', title: 'Your organisation', requires: ['name'], fields: [
          { type: 'text', name: 'organisation', label: 'Registered name of your organisation', autocomplete: 'organization', required: 'Enter the registered name of your organisation',
            validate: function (v) { return v.length > 160 ? 'Organisation name must be 160 characters or fewer' : null; } },
          { type: 'text', name: 'company_country', label: 'Country where it is registered', autocomplete: 'country-name', width: 20, required: 'Enter the country where your organisation is registered' },
          { type: 'text', name: 'company_number', label: 'Registration number', hint: 'For example, a Companies House number. If your organisation does not have one, say why.', width: 30, spellcheck: false, required: 'Enter your organisation’s registration number, or say why it does not have one',
            validate: function (v) { return v.length > 120 ? 'Registration number must be 120 characters or fewer' : null; } }] },

        { id: 'org_type', title: 'What type of organisation is it?', requires: ['organisation'], fields: [
          { type: 'radios', name: 'org_type', legend: 'What type of organisation is it?', options: ORG_TYPES, required: 'Select the type of organisation' }] },

        { id: 'role', title: 'What is your job title?', requires: ['org_type'], fields: [
          { type: 'text', name: 'role', label: 'What is your job title?', autocomplete: 'organization-title', width: 30, required: 'Enter your job title' }] },

        { id: 'authority', title: 'Are you authorised to act for your organisation?', requires: ['role'],
          next: function (s, v) { return v.authority === 'yes' ? (signedIn ? 'agreements' : 'email') : 'not-authorised'; }, fields: [
          { type: 'radios', name: 'authority', legend: 'Are you authorised to act for ' + orgName + '?', hint: 'This means you can accept agreements on its behalf.', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
            required: 'Select yes if you are authorised to act for your organisation' }] },

        { id: 'not-authorised', type: 'custom', title: 'You need someone who can act for your organisation', render: function (ctx) {
            ctx.wrapper.appendChild(h('h1', { text: 'You need someone who can act for your organisation' }));
            ctx.wrapper.appendChild(h('p', { text: 'Membership must be set up by a person authorised to accept agreements on the organisation’s behalf.' }));
            ctx.wrapper.appendChild(h('p', { text: 'Ask an authorised colleague to join. They can add you as a user later.' }));
            ctx.wrapper.appendChild(h('p', null, 'If you have a question, email ', h('a', { href: 'mailto:ami@abta.africa', text: 'ami@abta.africa' }), '.'));
          } },

        { id: 'email', title: 'What is your work email address?', requires: ['authority'], skip: function () { return signedIn; }, busyText: 'Sending code…', fields: [
          { type: 'email', name: 'email', label: 'What is your work email address?', hint: 'We will send a 6-digit code to this address to confirm it is yours.', autocomplete: 'email', spellcheck: false, required: 'Enter your work email address',
            validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254 ? null : 'Enter an email address in the correct format, like name@example.com'; } }],
          onSubmit: function (s, v) {
            return DR.auth.sendCode(v.email).then(function (res) {
              if (!res.ok) return { errors: [{ name: 'email', message: res.status === 429 ? 'You have asked for too many codes. Wait a few minutes and try again' : 'We could not send a code to this email address. Check it and try again', target: 'f-email' }] };
              s.codeSentAt = Date.now();
              return { next: 'code' };
            });
          } },

        { id: 'code', title: 'Check your email', requires: ['email'], skip: function () { return signedIn; }, busyText: 'Checking…',
          intro: function (s) {
            return [h('p', null, 'We have sent a 6-digit code to ', h('strong', { text: s.answers.email || 'your email address' }), '.'), h('p', { text: 'The code expires after a short time. Check your spam folder if you cannot find it.' })];
          },
          fields: [{ type: 'text', name: 'code', label: 'Enter the code', inputmode: 'numeric', autocomplete: 'one-time-code', spellcheck: false, width: 10, required: 'Enter the 6-digit code from your email',
            validate: function (v) { return /^\d{6}$/.test(v.replace(/\s/g, '')) ? null : 'The code must be 6 numbers'; } }],
          after: function (s) {
            var resend = h('button', { type: 'button', class: 'dr-link-button', text: 'Send a new code' });
            resend.addEventListener('click', function () {
              DR.auth.sendCode(s.answers.email).then(function (res) { DR.announce(res.ok ? 'A new code has been sent' : 'We could not send a new code. Try again in a few minutes'); });
            });
            return h('details', { class: 'dr-details' }, h('summary', { class: 'dr-details__summary', text: 'Not received an email?' }),
              h('div', { class: 'dr-details__text' },
                h('p', { text: 'Emails sometimes take a few minutes to arrive.' }),
                h('p', null, resend, ' or ', h('a', { href: DR.flowUrl ? 'create-account.html?step=email' : '#', text: 'change your email address' }), '.')));
          },
          onSubmit: function (s, v) {
            var code = v.code.replace(/\s/g, '');
            delete s.answers.code;
            return DR.auth.verifyCode(s.answers.email, code).then(function (res) {
              if (!res.ok) return { errors: [{ name: 'code', message: 'The code is not correct or has expired – check your email or ask for a new code', target: 'f-code' }] };
              DR.session.save(res.data, s.answers.email);
              return { next: 'password' };
            });
          } },

        { id: 'password', title: 'Create a password', requires: ['code'], skip: function () { return signedIn; }, back: false, busyText: 'Saving…', fields: [
          { type: 'password', name: 'password', label: 'Create a password', autocomplete: 'new-password', hint: 'Use at least 12 characters. A few unrelated words is a good choice. Do not use a password you use elsewhere.', width: 30, required: 'Enter a password',
            validate: function (v) { return v.length < 12 ? 'Password must be 12 characters or more' : (v.length > 72 ? 'Password must be 72 characters or fewer' : null); } }],
          onSubmit: function (s, v) {
            delete s.answers.password;
            if (!DR.session.active()) return { errors: [{ name: 'password', message: 'Your session has ended – go back and enter your email address again', target: 'f-password' }] };
            return DR.auth.setPassword(v.password).then(function (res) {
              if (!res.ok) return { errors: [{ name: 'password', message: (res.data && /weak|pwned|leaked/i.test(JSON.stringify(res.data))) ? 'This password is too easy to guess – choose a different password' : 'We could not save your password – try again', target: 'f-password' }] };
              return { next: 'agreements' };
            });
          } },

        { id: 'agreements', title: 'Read and accept the Deal Room agreements', requires: ['authority'], backTo: function () { return signedIn ? { id: 'authority' } : { id: 'password' }; },
          intro: function () {
            function doc(title, href, points) {
              return [h('h2', { class: 'dr-h3', text: title + ' (version ' + AGREEMENT_VERSION + ')' }),
                h('ul', { class: 'dr-list' }, points.map(function (p) { return h('li', { text: p }); })),
                h('p', null, h('a', { href: href, target: '_blank', rel: 'noopener', text: 'Read the full ' + title + ' (opens in new tab)' }))];
            }
            return [
              h('div', { class: 'dr-draft', role: 'note' }, h('strong', { text: 'Review build: ' }), 'these agreements are drafts awaiting legal review.'),
              h('p', { text: 'These are the key points. The full documents are the binding versions.' }),
              doc('Platform Membership Agreement', 'legal/platform-agreement.html', [
                'Membership is £99 a year and renews automatically unless you turn off renewal.',
                'ABTA verifies your organisation and screens it against sanctions lists before any introduction.',
                'Identities are shared only through an Introduction Notice from ABTA.',
                'You must not deal with an introduced party outside the Deal Room to avoid ABTA’s process or any fee that applies.',
                'ABTA does not give advice or recommend opportunities.']),
              doc('Non-Disclosure Agreement', 'legal/nda.html', [
                'Keep information from the Deal Room confidential and use it only to assess a possible transaction.',
                'You may share it with advisers and staff who need it and keep it confidential.']),
              doc('Fee Schedule', 'legal/fee-schedule.html', [
                'The membership fee and renewal terms.',
                'Whether any introduction or success fee applies.'])
            ];
          },
          fields: [{ type: 'checkboxes', name: 'agree', legend: 'Your agreement', legendSize: 'm', options: [
            { value: 'yes', label: 'I have read and agree to the Platform Membership Agreement and the Non-Disclosure Agreement, and I have read the Fee Schedule, on behalf of my organisation' }],
            required: 'Confirm that you have read and agree to the agreements' }] },

        { id: 'check', type: 'check', title: 'Check your answers before you pay', requires: ['agreements'], button: 'Accept and continue to payment', busyText: 'Please wait…',
          sections: function (s) {
            var a = s.answers;
            return [
              { title: 'Your details', rows: [
                { key: 'Full name', value: a.full_name, step: 'name' },
                { key: 'Job title', value: a.role, step: 'role' },
                { key: 'Email address', value: signedIn ? DR.session.get().email : a.email }] },
              { title: 'Your organisation', rows: [
                { key: 'Registered name', value: a.organisation, step: 'organisation' },
                { key: 'Country of registration', value: a.company_country, step: 'organisation' },
                { key: 'Registration number', value: a.company_number, step: 'organisation' },
                { key: 'Type', value: a.org_type === 'Other' ? a.org_type_other : a.org_type, step: 'org_type' },
                { key: 'Authorised to act', value: a.authority === 'yes' ? 'Yes' : 'No', step: 'authority' }] },
              { title: 'Agreements', rows: [
                { key: 'Accepted', value: 'Platform Membership Agreement v' + AGREEMENT_VERSION + '\nNon-Disclosure Agreement v' + AGREEMENT_VERSION + '\nFee Schedule v' + AGREEMENT_VERSION, step: 'agreements' }] }
            ];
          },
          declaration: function (s) {
            s.renderedAt = s.renderedAt || Date.now();
            DR.flowSave();
            return [
              h('h2', { text: 'Payment' }),
              h('dl', { class: 'dr-summary-list' },
                h('div', { class: 'dr-summary-list__row' }, h('dt', { class: 'dr-summary-list__key', text: 'Deal Room membership, 12 months' }), h('dd', { class: 'dr-summary-list__value', text: '£99' }), h('dd', { class: 'dr-summary-list__actions' }))),
              h('p', { text: 'When you continue, we record that you have accepted the agreements on behalf of your organisation. You will then pay securely on Stripe’s website. ABTA does not see or store your card details.' })
            ];
          },
          onSubmit: function (s) {
            var a = s.answers;
            var email = signedIn ? DR.session.get().email : a.email;
            if (!DR.session.active()) return { errors: [{ name: 'submit', message: 'Your session has ended – sign in and try again', target: 'main' }] };
            return DR.fn('deal-room-agreement-gateway', { body: {
              honeypot: '', form_rendered_at: s.renderedAt || (Date.now() - 5000),
              full_name: a.full_name, email: email, organisation: a.organisation, role: a.role,
              company_country: a.company_country, company_number: a.company_number,
              org_type: a.org_type === 'Other' ? a.org_type_other : a.org_type,
              authority_confirmed: a.authority === 'yes',
              documents_accepted: [
                { name: 'Platform Membership Agreement', version: AGREEMENT_VERSION },
                { name: 'Non-Disclosure Agreement', version: AGREEMENT_VERSION },
                { name: 'Fee Schedule', version: AGREEMENT_VERSION }]
            } }).then(function (res) {
              if (!res.ok) {
                var err = res.data && res.data.error;
                var msg = err === 'email_not_verified' ? 'Your email address could not be confirmed – sign in again and try again'
                  : (err === 'spam_detected' || err === 'rate_limited') ? 'This could not be processed. Wait a few minutes and try again, or email ami@abta.africa'
                  : 'We could not record your acceptance. Try again, or email ami@abta.africa if the problem continues';
                return { errors: [{ name: 'submit', message: msg, target: 'main' }] };
              }
              s.agreement_id = res.data.agreement_id;
              DR.flowSave();
              return checkout();
            });
          } }
      ]
    });
  }

  /* Pay, confirmation and cancelled pages */
  function special(app, step) {
    DR.clear(app);
    var w = h('div', { class: 'dr-narrow', style: 'margin-top:2rem' });
    app.appendChild(w);

    if (step === 'pay') {
      DR.setTitle('Pay for your membership');
      DR.loadAccount().then(function (account) {
        var m = account && account.member;
        if (account.signedOut) { DR.requireSignIn(); return; }
        if (!m) { location.replace('create-account.html'); return; }
        if (m.status === 'active') { location.replace('account.html'); return; }
        if (!m.agreement_version_current) {
          // Existing member records without v2 acceptance must accept again first.
          w.appendChild(h('h1', { text: 'Accept the updated agreements' }));
          w.appendChild(h('p', { text: 'The Deal Room agreements have changed. You need to accept the current versions before you pay.' }));
          w.appendChild(h('a', { href: 'create-account.html?step=agreements', role: 'button', draggable: 'false', class: 'dr-button', text: 'Continue' }));
          var st = DR.store.get(KEY, { answers: {}, done: {} });
          st.answers = Object.assign({ full_name: m.full_name, organisation: m.organisation, role: m.role, company_country: m.company_country, company_number: m.company_number, org_type: m.org_type, authority: 'yes' }, st.answers);
          ['start', 'name', 'organisation', 'org_type', 'role', 'authority'].forEach(function (k) { st.done[k] = true; });
          DR.store.set(KEY, st);
          return;
        }
        w.appendChild(h('h1', { text: m.status === 'expired' ? 'Renew your membership' : 'Pay for your membership' }));
        w.appendChild(h('dl', { class: 'dr-summary-list' },
          h('div', { class: 'dr-summary-list__row' }, h('dt', { class: 'dr-summary-list__key', text: 'Organisation' }), h('dd', { class: 'dr-summary-list__value', text: m.organisation || '' }), h('dd', { class: 'dr-summary-list__actions' })),
          h('div', { class: 'dr-summary-list__row' }, h('dt', { class: 'dr-summary-list__key', text: 'Deal Room membership, 12 months' }), h('dd', { class: 'dr-summary-list__value', text: '£99' }), h('dd', { class: 'dr-summary-list__actions' }))));
        w.appendChild(h('p', { text: 'You will pay securely on Stripe’s website. ABTA does not see or store your card details.' }));
        var errBox = h('div');
        w.insertBefore(errBox, w.firstChild);
        var btn = h('button', { type: 'button', class: 'dr-button', text: 'Continue to payment' });
        btn.addEventListener('click', function () {
          btn.setAttribute('aria-disabled', 'true'); btn.textContent = 'Please wait…';
          checkout().then(function (r) {
            if (r && r.errors) {
              btn.removeAttribute('aria-disabled'); btn.textContent = 'Continue to payment';
              DR.clear(errBox).appendChild(h('div', { class: 'dr-error-summary', tabindex: '-1', role: 'alert' }, h('h2', { class: 'dr-error-summary__title', text: 'There is a problem' }), h('p', { text: r.errors[0].message })));
              errBox.firstChild.focus();
              DR.setTitle('Pay for your membership', true);
            }
          });
        });
        w.appendChild(btn);
      });
      return;
    }

    if (step === 'cancelled') {
      DR.setTitle('Payment not completed');
      w.appendChild(h('h1', { text: 'Your payment was not completed' }));
      w.appendChild(h('p', { text: 'You have not been charged. Your details and agreement acceptance have been saved.' }));
      w.appendChild(h('a', { href: 'create-account.html?step=pay', role: 'button', draggable: 'false', class: 'dr-button', text: 'Try again' }));
      w.appendChild(h('p', null, 'If you need help, email ', h('a', { href: 'mailto:ami@abta.africa', text: 'ami@abta.africa' }), '.'));
      return;
    }

    // confirmation: the Stripe webhook activates membership; poll until it has.
    DR.setTitle('Confirming your payment');
    var status = h('p', { role: 'status', text: 'We are confirming your payment. This usually takes a few seconds.' });
    w.appendChild(h('h1', { text: 'Confirming your payment' }));
    w.appendChild(status);
    var tries = 0;
    (function poll() {
      DR.loadAccount().then(function (account) {
        var m = account && account.member;
        if (m && m.status === 'active' && m.payment_status === 'paid') {
          DR.store.remove(KEY);
          DR.setTitle('Membership confirmed');
          DR.clear(w);
          w.appendChild(h('div', { class: 'dr-panel' }, h('h1', { text: 'Membership confirmed' }), h('div', { class: 'dr-panel__body' }, 'Welcome to the ABTA Deal Room', m.agreement_id ? [h('br'), 'Agreement reference', h('strong', { text: m.agreement_id })] : null)));
          w.appendChild(h('h2', { text: 'What happens next' }));
          w.appendChild(h('p', { text: 'ABTA will now verify your organisation, including sanctions screening. You can browse opportunities, express interest and list opportunities straight away, but ABTA will not make an introduction until verification is complete. We will email you when it is.' }));
          w.appendChild(h('a', { href: 'opportunities.html', role: 'button', draggable: 'false', class: 'dr-button', text: 'Browse opportunities' }));
          w.appendChild(h('p', null, h('a', { href: 'account.html', text: 'Go to Your Deal Room' })));
          w.appendChild(h('p', { class: 'dr-small' }, h('a', { href: 'mailto:ami@abta.africa?subject=Deal%20Room%20feedback', text: 'What did you think of joining?' }), ' (takes 30 seconds)'));
          return;
        }
        tries++;
        if (tries < 8) { setTimeout(poll, 2500); return; }
        status.textContent = 'We have not received confirmation of your payment yet. If you completed payment, it may take a few minutes. Refresh this page to check again, or email ami@abta.africa.';
      });
    })();
  }
})();
