/* Deal Room v2 – list an opportunity (task list + question pages) */
(function () {
  'use strict';
  var DR = window.DR, h = DR.h;
  var KEY = 'dr_submit';
  var MAX_FILES = 10, MAX_BYTES = 25 * 1024 * 1024;
  var ALLOWED = ['pdf', 'docx', 'xlsx', 'pptx'];

  var FINANCIALS = [
    { value: '3 years, audited', label: 'At least 3 years of audited accounts' },
    { value: 'Some financial records, not fully audited', label: 'Some financial records, not fully audited' },
    { value: 'Not yet prepared', label: 'Not yet prepared' },
    { divider: 'or' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];
  var CAPSTRUCTURE = [
    { value: 'Clearly documented', label: 'Clearly documented' },
    { value: 'Partially documented', label: 'Partially documented' },
    { value: 'Not yet documented', label: 'Not yet documented' },
    { divider: 'or' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var app = document.getElementById('app');
    var step = DR.params.get('step') || '';
    var cached = DR.store.get(KEY, null);

    if (!step) return startPage(app);
    if (!DR.requireSignIn()) return;
    if (step === 'confirmation' && cached && cached.reference) return flow(app, cached.account);

    DR.loadAccount().then(function (account) {
      if (account.signedOut) { DR.requireSignIn(); return; }
      if (account.unavailable) { DR.clear(app).appendChild(DR.unavailablePage('Listing an opportunity online is not available yet', 'list an opportunity')); return; }
      if (account.error) { DR.clear(app).appendChild(h('p', { style: 'margin-top:2rem', text: 'Sorry, there is a problem with the service. Try again later.' })); return; }
      var gate = DR.membershipGate(account, 'list an opportunity');
      if (gate) { DR.setTitle('Membership needed'); DR.clear(app).appendChild(gate); return; }
      var s = DR.store.get(KEY, null) || { answers: {}, done: {} };
      s.account = account;
      DR.store.set(KEY, s);
      flow(app, account);
    });
  });

  /* Start page, visible to everyone (GOV.UK start page pattern) */
  function startPage(app) {
    DR.setTitle('List an opportunity');
    DR.clear(app).appendChild(h('div', { class: 'dr-grid dr-grid--two-thirds', style: 'margin-top:2rem' },
      h('div', null,
        h('h1', { text: 'List an opportunity' }),
        h('p', { class: 'dr-lead', text: 'Deal Room members can submit an investment, financing, acquisition, joint venture or commercial opportunity for ABTA to review.' }),
        h('p', { text: 'If it meets ABTA’s criteria, we contact you to prepare an anonymised listing before it is published. Your name, organisation and documents are seen only by the ABTA team unless ABTA makes an introduction.' }),
        h('h2', { text: 'Before you start' }),
        h('p', { text: 'You will need:' }),
        h('ul', { class: 'dr-list' },
          h('li', { text: 'to be a Deal Room member and signed in' }),
          h('li', { text: 'the deal type, sector, region and amount of capital sought' }),
          h('li', { text: 'a summary of up to 300 words that does not name the business, people or exact locations' }),
          h('li', { text: 'supporting documents, if you have them (PDF, Word, Excel or PowerPoint, up to 25MB each)' })),
        h('p', { text: 'You can save your progress and come back to it in the same browser tab.' }),
        h('h2', { text: 'Fees' }),
        h('p', { text: 'There is no charge to submit or list an opportunity. If your listing leads to a completed deal with a party ABTA introduced, you pay a success fee of 1.798% of the transaction value, plus VAT where applicable.' }),
        h('p', null, h('a', { href: 'legal/fee-schedule.html', text: 'Read the Fee Schedule' })),
        h('a', { href: 'submit-opportunity.html?step=tasks', role: 'button', draggable: 'false', class: 'dr-button dr-button--start' }, 'Start now'),
        h('h2', { text: 'What ABTA looks for' }),
        h('p', { text: 'ABTA reviews each submission for credibility, completeness and fit with the Deal Room’s members. We aim to reply within 5 business days.' }),
        h('p', null, 'For a list of documents investors commonly ask for, email ', h('a', { href: 'mailto:ami@abta.africa?subject=Deal%20Room%20document%20checklist', text: 'ami@abta.africa' }), ' for the Deal Room document checklist.')),
      h('aside', null, h('div', { class: 'dr-contact-panel' },
        h('h2', { text: 'Not a member yet?' }),
        h('p', { text: 'Membership is £99 a year, plus VAT where applicable, and includes listing opportunities.' }),
        h('a', { href: 'create-account.html', text: 'Join the Deal Room' })))));
  }

  function flow(app, account) {
    var m = (account && account.member) || {};
    function sectionDone(s, ids) { return ids.every(function (id) { return s.done[id]; }); }

    DR.flow({
      key: KEY,
      page: 'submit-opportunity.html',
      container: app,
      caption: 'List an opportunity',
      checkStep: 'check',
      firstBack: 'submit-opportunity.html',
      steps: [
        { id: 'tasks', type: 'custom', title: 'List an opportunity', backTo: 'submit-opportunity.html', render: function (ctx) {
            var s = ctx.state;
            var about = sectionDone(s, ['deal_type', 'sector', 'region', 'capital']);
            var summary = !!s.done.summary;
            var readiness = sectionDone(s, ['financials', 'capstructure']);
            var docs = !!s.done.documents;
            var complete = [about, summary].filter(Boolean).length;
            ctx.wrapper.appendChild(h('h1', { text: 'List an opportunity' }));
            ctx.wrapper.appendChild(h('p', { class: 'dr-secondary', text: 'You have completed ' + complete + ' of 2 required sections.' }));
            function item(title, hint, href, status, canStart) {
              var tag = status === 'done' ? h('strong', { class: 'dr-tag dr-tag--green', text: 'Completed' })
                : status === 'optional' ? h('strong', { class: 'dr-tag dr-tag--grey', text: 'Optional' })
                : canStart === false ? h('strong', { class: 'dr-tag dr-tag--grey', text: 'Cannot start yet' })
                : h('strong', { class: 'dr-tag dr-tag--blue', text: 'Not yet started' });
              return h('li', { class: 'dr-task-list__item' },
                h('div', { class: 'dr-task-list__name' }, canStart === false ? h('span', { text: title }) : h('a', { href: href, 'aria-describedby': 'status-' + title.replace(/\W+/g, '-') , text: title }), hint ? h('span', { class: 'dr-task-list__hint', text: hint }) : null),
                h('div', { id: 'status-' + title.replace(/\W+/g, '-') }, tag));
            }
            ctx.wrapper.appendChild(h('h2', { class: 'dr-h3', text: 'Required' }));
            ctx.wrapper.appendChild(h('ul', { class: 'dr-task-list' },
              item('About the opportunity', 'Deal type, sector, region and capital sought', ctx.url('deal_type'), about ? 'done' : ''),
              item('Opportunity summary', 'Up to 300 words, without identifying details', ctx.url('summary'), summary ? 'done' : '')));
            ctx.wrapper.appendChild(h('h2', { class: 'dr-h3', text: 'Optional' }));
            ctx.wrapper.appendChild(h('ul', { class: 'dr-task-list' },
              item('Investment readiness', 'Financial records and capital structure', ctx.url('financials'), readiness ? 'done' : 'optional'),
              item('Supporting documents', 'PDF, Word, Excel or PowerPoint', ctx.url('documents'), docs ? 'done' : 'optional')));
            ctx.wrapper.appendChild(h('h2', { class: 'dr-h3', text: 'Send' }));
            ctx.wrapper.appendChild(h('ul', { class: 'dr-task-list' },
              item('Check and send', null, ctx.url('check'), '', about && summary)));
            ctx.wrapper.appendChild(h('p', { class: 'dr-small' }, 'Your answers are kept in this browser tab until you send them or close the tab.'));
          } },

        { id: 'deal_type', title: 'What type of deal is this?', requires: [], backTo: 'submit-opportunity.html?step=tasks', fields: [
          { type: 'radios', name: 'deal_type', legend: 'What type of deal is this?', options: DR.DEAL_TYPES, required: 'Select the type of deal' }] },
        { id: 'sector', title: 'Which sector is the opportunity in?', requires: ['deal_type'], fields: [
          { type: 'radios', name: 'sector', legend: 'Which sector is the opportunity in?', options: DR.SECTORS.map(function (s) { return { value: s.value, label: s.label }; }), required: 'Select the sector' }] },
        { id: 'region', title: 'Which region is the opportunity in?', requires: ['sector'], fields: [
          { type: 'radios', name: 'region', legend: 'Which region is the opportunity in?', hint: 'Choose Pan-African if it covers more than one region.', options: DR.REGIONS, required: 'Select the region' }] },
        { id: 'capital', title: 'How much capital is being sought?', requires: ['region'], next: function () { return 'tasks'; }, fields: [
          { type: 'radios', name: 'capital_range', legend: 'How much capital is being sought?', hint: 'In US dollars. Most opportunities in the Deal Room seek USD 5m or more.', options: DR.CAPITAL.concat([{ divider: 'or' }, { value: 'not_stated', label: 'Prefer not to say at this stage' }]),
            required: 'Select how much capital is being sought, or select prefer not to say' }] },

        { id: 'summary', title: 'Describe the opportunity', backTo: 'submit-opportunity.html?step=tasks', next: function () { return 'tasks'; }, fields: [
          { type: 'textarea', name: 'summary', label: 'Describe the opportunity', maxWords: 300, rows: 12,
            hint: h('span', null, 'Say what the business or project does, what is being sought and why it is a strong opportunity. ', h('strong', { text: 'Do not include' }), ' the name of the business, people, exact locations, website addresses or anything else that could identify it.'),
            required: 'Enter a description of the opportunity',
            after: function () { return anonymityCheck(); } }] },

        { id: 'financials', title: 'What financial records does the business have?', backTo: 'submit-opportunity.html?step=tasks', fields: [
          { type: 'radios', name: 'financials_status', legend: 'What financial records does the business have?', hint: 'Development finance institutions and many other investors check this before a first meeting.', options: FINANCIALS, required: 'Select what financial records the business has, or select prefer not to say' }] },
        { id: 'capstructure', title: 'Is the capital structure documented?', requires: ['financials'], next: function () { return 'tasks'; }, fields: [
          { type: 'radios', name: 'cap_structure_status', legend: 'Is the capital structure documented?', hint: 'For example, a shareholder register, cap table and details of existing debt.', options: CAPSTRUCTURE, required: 'Select whether the capital structure is documented, or select prefer not to say' }] },

        { id: 'documents', type: 'custom', title: 'Upload supporting documents', backTo: 'submit-opportunity.html?step=tasks', render: function (ctx) { uploadPage(ctx); } },

        { id: 'check', type: 'check', title: 'Check your answers before sending your opportunity', requires: ['capital', 'summary'], button: 'Accept and send', busyText: 'Sending…', backTo: 'submit-opportunity.html?step=tasks',
          sections: function (s) {
            var a = s.answers;
            var docs = (a.documents || []).map(function (d) { return d.name; });
            return [
              { title: 'About the opportunity', rows: [
                { key: 'Deal type', value: DR.label(DR.DEAL_TYPES, a.deal_type), step: 'deal_type' },
                { key: 'Sector', value: DR.label(DR.SECTORS, a.sector), step: 'sector' },
                { key: 'Region', value: DR.label(DR.REGIONS, a.region), step: 'region' },
                { key: 'Capital sought', value: a.capital_range === 'not_stated' ? 'Prefer not to say' : DR.label(DR.CAPITAL, a.capital_range), step: 'capital' }] },
              { title: 'Summary', rows: [{ key: 'Description', value: a.summary, step: 'summary' }] },
              { title: 'Investment readiness', rows: [
                { key: 'Financial records', value: DR.label(FINANCIALS.filter(function (o) { return !o.divider; }), a.financials_status), step: 'financials' },
                { key: 'Capital structure', value: DR.label(CAPSTRUCTURE.filter(function (o) { return !o.divider; }), a.cap_structure_status), step: 'capstructure' }] },
              { title: 'Supporting documents', rows: [{ key: 'Files', value: docs.length ? docs : 'None', step: 'documents' }] },
              { title: 'Your details', rows: [{ key: 'Name', value: m.full_name }, { key: 'Organisation', value: m.organisation }, { key: 'Job title', value: m.role }, { key: 'Email', value: m.email }] }
            ];
          },
          declaration: function (s) {
            s.renderedAt = s.renderedAt || Date.now();
            DR.flowSave();
            return [
              h('h2', { text: 'Now send your opportunity' }),
              h('p', { text: 'By sending this opportunity you confirm that:' }),
              h('ul', { class: 'dr-list' },
                h('li', { text: 'you are authorised to submit it and to share the documents you have uploaded' }),
                h('li', { text: 'the information is accurate to the best of your knowledge' }),
                h('li', { text: 'you agree that ABTA may review it and, if approved, publish an anonymised listing as described in the Platform Membership Agreement' }),
                h('li', { text: 'you agree to pay ABTA a success fee of 1.798% of the transaction value, plus VAT where applicable, if this opportunity leads to a completed deal with a party ABTA introduced, as set out in the Fee Schedule' })),
              h('p', { text: 'Your contact details and documents stay confidential to the ABTA team unless ABTA makes an introduction.' })
            ];
          },
          onSubmit: function (s) {
            var a = s.answers;
            return DR.fn('deal-room-submit-gateway', { body: {
              honeypot: '', form_rendered_at: s.renderedAt || (Date.now() - 5000),
              deal_type: a.deal_type, sector: a.sector, region: a.region,
              capital_range: a.capital_range === 'not_stated' ? null : a.capital_range,
              summary: a.summary,
              financials_status: a.financials_status || null, cap_structure_status: a.cap_structure_status || null,
              organisation: m.organisation, contact_name: m.full_name, contact_role: m.role, contact_email: m.email,
              document_paths: (a.documents || []).map(function (d) { return d.path; })
            } }).then(function (res) {
              if (!res.ok) {
                var err = res.data && res.data.error;
                var msg = err === 'rate_limited' ? 'You have sent too many submissions in the last hour. Try again later'
                  : err === 'not_a_member' ? 'Your membership could not be confirmed. Sign out, sign in again and try again'
                  : 'Your opportunity could not be sent. Try again, or email ami@abta.africa if the problem continues';
                return { errors: [{ name: 'submit', message: msg, target: 'main' }] };
              }
              s.reference = (res.data && res.data.reference) || '';
              return { next: 'confirmation' };
            });
          } },

        { id: 'confirmation', type: 'custom', title: 'Opportunity sent', back: false, render: function (ctx) {
            var s = ctx.state;
            if (!s.reference) { location.replace(ctx.url('tasks')); return; }
            ctx.wrapper.appendChild(h('div', { class: 'dr-panel' }, h('h1', { text: 'Opportunity sent' }), h('div', { class: 'dr-panel__body' }, 'Your reference number', h('strong', { text: s.reference }))));
            ctx.wrapper.appendChild(h('h2', { text: 'What happens next' }));
            ctx.wrapper.appendChild(h('p', { text: 'ABTA will review your opportunity. We aim to reply within 5 business days.' }));
            ctx.wrapper.appendChild(h('p', { text: 'If it meets our criteria, we will contact you to agree the anonymised listing before it is published.' }));
            ctx.wrapper.appendChild(h('p', null, 'You can track it in ', h('a', { href: 'account.html?section=opportunities', text: 'Your Deal Room' }), '.'));
            ctx.wrapper.appendChild(h('p', { class: 'dr-small' }, h('a', { href: 'mailto:ami@abta.africa?subject=Deal%20Room%20feedback', text: 'What did you think of this service?' }), ' (takes 30 seconds)'));
            DR.store.set(KEY, { answers: {}, done: {}, reference: s.reference, account: s.account });
          } }
      ]
    });
  }

  /* Optional AI check, with disclosure (advisory only) */
  function anonymityCheck() {
    var results = h('div', { 'aria-live': 'polite' });
    var btn = h('button', { type: 'button', class: 'dr-button dr-button--secondary', style: 'margin-top:1rem', text: 'Check for identifying details' });
    btn.addEventListener('click', function () {
      var text = (document.getElementById('f-summary') || {}).value || '';
      DR.clear(results);
      if (!text.trim()) { results.appendChild(h('p', { class: 'dr-error-message', text: 'Enter a description before checking it' })); return; }
      btn.setAttribute('aria-disabled', 'true'); btn.textContent = 'Checking…';
      DR.fn('deal-room-anonymity-check', { body: { text: text } }).then(function (res) {
        btn.removeAttribute('aria-disabled'); btn.textContent = 'Check for identifying details';
        if (!res.ok || !res.data.ok) { results.appendChild(h('p', { text: 'The check is not available at the moment. You can still continue: ABTA reviews every summary.' })); return; }
        var flags = res.data.flags || [];
        if (!flags.length) { results.appendChild(h('p', { text: 'No obvious identifying details found. ABTA will still review your summary.' })); return; }
        results.appendChild(h('div', { class: 'dr-inset' },
          h('p', { text: 'You may want to remove or generalise:' }),
          h('ul', { class: 'dr-list' }, flags.map(function (f) { return h('li', null, h('strong', { text: String(f.text) }), ' – ', String(f.reason)); }))));
      });
    });
    return h('div', null,
      btn,
      h('details', { class: 'dr-details' },
        h('summary', { class: 'dr-details__summary', text: 'How this check works' }),
        h('div', { class: 'dr-details__text' },
          h('p', { text: 'The check sends your description to Google’s Gemini AI service, which looks for names, addresses and other details that could identify the business. It is optional and only a suggestion. It does not approve or reject your opportunity.' }),
          h('p', null, h('a', { href: 'legal/privacy-notice.html', target: '_blank', rel: 'noopener', text: 'Read how we use AI (opens in new tab)' })))),
      results);
  }

  /* GOV.UK-style file upload page */
  function uploadPage(ctx) {
    var s = ctx.state;
    s.answers.documents = s.answers.documents || [];
    var errors = ctx.errors || [];
    var w = ctx.wrapper;
    w.appendChild(h('span', { class: 'dr-caption-l', text: 'List an opportunity' }));
    w.appendChild(h('h1', { text: 'Upload supporting documents' }));
    w.appendChild(h('p', { text: 'For example, an investor presentation, financial statements or a use of funds statement. Remove names from documents if you want them to stay anonymous at the review stage.' }));

    var err = errors[0];
    var group = h('div', { class: 'dr-form-group' + (err ? ' dr-form-group--error' : '') },
      h('label', { class: 'dr-label', for: 'f-file', text: 'Upload a file' }),
      h('div', { class: 'dr-hint', id: 'f-file-hint', text: 'PDF, Word (.docx), Excel (.xlsx) or PowerPoint (.pptx). Up to 25MB each and up to ' + MAX_FILES + ' files.' }),
      err ? h('p', { class: 'dr-error-message', id: 'f-file-error' }, h('span', { class: 'dr-visually-hidden', text: 'Error: ' }), err.message) : null);
    var input = h('input', { class: 'dr-file-upload', id: 'f-file', name: 'file', type: 'file', accept: '.pdf,.docx,.xlsx,.pptx', 'aria-describedby': 'f-file-hint' + (err ? ' f-file-error' : '') });
    group.appendChild(input);
    var uploadBtn = h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Upload file' });
    group.appendChild(h('div', { style: 'margin-top:.75rem' }, uploadBtn));
    w.appendChild(group);

    var status = h('p', { role: 'status', 'aria-live': 'polite', class: 'dr-secondary' });
    w.appendChild(status);

    if (s.answers.documents.length) {
      w.appendChild(h('h2', { class: 'dr-h3', text: 'Files added' }));
      var ul = h('ul', { class: 'dr-file-list' });
      s.answers.documents.forEach(function (d, i) {
        var rm = h('button', { type: 'button', class: 'dr-link-button' }, 'Remove', h('span', { class: 'dr-visually-hidden', text: ' ' + d.name }));
        rm.addEventListener('click', function () { s.answers.documents.splice(i, 1); ctx.save(); ctx.rerender(); DR.announce(d.name + ' removed'); });
        ul.appendChild(h('li', null, h('span', null, d.name, ' ', h('span', { class: 'dr-secondary', text: '(' + Math.max(1, Math.round(d.size / 1024)) + 'KB)' })), rm));
      });
      w.appendChild(ul);
    }

    uploadBtn.addEventListener('click', function () {
      var file = input.files && input.files[0];
      var fail = function (msg) { ctx.rerender([{ name: 'file', message: msg, target: 'f-file' }]); };
      if (!file) return fail('Select a file to upload');
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      if (ALLOWED.indexOf(ext) === -1) return fail('The selected file must be a PDF, DOCX, XLSX or PPTX');
      if (file.size > MAX_BYTES) return fail('The selected file must be smaller than 25MB');
      if (file.size === 0) return fail('The selected file is empty');
      if (s.answers.documents.length >= MAX_FILES) return fail('You can upload up to ' + MAX_FILES + ' files');
      uploadBtn.setAttribute('aria-disabled', 'true');
      status.textContent = 'Uploading ' + file.name + '…';
      DR.fn('deal-room-upload-url', { body: { file_name: file.name } }).then(function (res) {
        if (!res.ok || !res.data.path) throw new Error('url');
        if (DR.demo) return res.data;
        return fetch(res.data.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream', apikey: DR.config.anon }, body: file })
          .then(function (up) { if (!up.ok) throw new Error('put'); return res.data; });
      }).then(function (data) {
        s.answers.documents.push({ name: file.name, size: file.size, path: data.path });
        ctx.save();
        ctx.rerender();
        DR.announce(file.name + ' uploaded');
      }).catch(function () {
        fail('The selected file could not be uploaded – try again');
      });
    });

    var cont = h('a', { href: ctx.url('tasks'), role: 'button', draggable: 'false', class: 'dr-button', style: 'margin-top:1.5rem', text: 'Continue' });
    cont.addEventListener('click', function () { s.done.documents = true; ctx.save(); });
    w.appendChild(cont);
  }
})();
