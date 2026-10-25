/* ==========================================================================
   Writing and sending a campaign (campaign.html)
   The editor and the previews live in mr-editor.js, the markup in
   mr-render.js, the starter layouts in mr-templates.js and the image library
   in mr-images.js. This file is the page: choose a layout, load, validate,
   save, share, restore, test, send.
   Sending is self-serve. Nobody approves a campaign before it goes out; the
   checks in the send function run instead, and a campaign that trips a
   serious one comes back held for review.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  var DEMO_CAMPAIGN = {
    subject: 'Sample: April market outlook',
    preheader: 'What moved this month, and what to watch',
    from_name: 'Sample Member Ltd',
    reply_to: 'news@example.com',
    font_family: 'sans',
    body_blocks: [
      { type: 'heading', text: 'What moved in April' },
      { type: 'text', text: 'Sample paragraph for the preview. Replace it with your own words.\nA second line shows how line breaks come through.' },
      { type: 'columns', left: 'Two columns of text, side by side on a laptop.', right: 'On a phone they stack, one above the other.' },
      { type: 'button', label: 'Read the full briefing', url: 'https://example.com' },
      { type: 'divider' },
      { type: 'text', text: 'A closing note, and what is coming next month.' }
    ],
    status: 'draft'
  };

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-campaign');
    if (!wrap) return;

    var campaignId = MR.qs('id');
    var account = null;
    var brand = null;
    var campaign = {
      subject: '', preheader: '', from_name: '', reply_to: '', list_id: '',
      font_family: '', body_blocks: null, status: 'draft'
    };
    var lists = [];
    var domains = [];
    var savedBlocks = [];
    var replyAddresses = [];
    var versions = [];
    var preview = null;
    var editorApi = null;
    var studio = null;          // the full-screen editor, when it is in use

    if (MR.cfg.demo) {
      account = MR.sampleAccount;
      brand = MR.sampleBrand || null;
      // Lets the first-send address question be tried in preview mode.
      if (MR.qs('noaddress') === '1') account = Object.assign({}, account, { postal_address: '' });
      campaign = JSON.parse(JSON.stringify(DEMO_CAMPAIGN));
      // Lets the layout chooser be tried in preview mode.
      if (MR.qs('choose') === '1' || MR.qs('template')) campaign.body_blocks = null;
      lists = (MR.sampleLists || []).map(function (l) { return { id: l.id, name: l.name, consent_status: l.consent_status }; });
      domains = (MR.sampleDomains || []).filter(function (d) { return d.status === 'verified'; });
      savedBlocks = MR.sampleSavedBlocks || [];
      replyAddresses = [DEMO_CAMPAIGN.reply_to];
      defaultList();
      render();
      return;
    }

    MR.requireAccount(wrap).then(function (a) {
      account = a;
      return Promise.all([
        MR.api.select('mailroom_lists?select=id,name,consent_status'),
        campaignId ? MR.api.select('mailroom_campaigns?select=*&id=eq.' + campaignId) : Promise.resolve([]),
        MR.api.select('mailroom_domains?select=id,domain,from_local,is_default,sending_status,kind&status=eq.verified'),
        MR.api.select('mailroom_brand?select=*&account_id=eq.' + a.id),
        MR.api.select('mailroom_saved_blocks?select=*&order=name'),
        MR.api.select('mailroom_reply_addresses?select=email,status&status=eq.verified&order=email')
      ]);
    }).then(function (res) {
      lists = res[0] || [];
      domains = (res[2] || []).filter(function (d) { return d.sending_status === 'active'; });
      brand = (res[3] || [])[0] || null;
      savedBlocks = res[4] || [];
      replyAddresses = (res[5] || []).map(function (r) { return r.email; });
      if (res[1] && res[1][0]) campaign = res[1][0];
      if (!campaign.id && !campaign.sending_domain_id) {
        var preferred = domains.filter(function (d) { return d.is_default; })[0] || domains[0];
        if (preferred) campaign.sending_domain_id = preferred.id;
      }
      if (!campaign.from_name) campaign.from_name = account.name;
      defaultList();
      if (!campaign.reply_to) campaign.reply_to = replyAddresses[0] || account.contact_email;
      if (!campaign.font_family) campaign.font_family = (brand && brand.font_family) || 'sans';
      if (campaign.id) return loadVersions().then(render);
      render();
    }).catch(function (err) {
      return MR.loadFailed(wrap, err);
    });

    // A new campaign starts on the list named in the address (the page that
    // just filled it), or on the only list that can be mailed, so the first
    // send does not open with a question that has one answer.
    function defaultList() {
      if (campaign.id || campaign.list_id) return;
      var mailable = lists.filter(function (l) { return l.consent_status !== 'unconfirmed'; });
      var named = mailable.filter(function (l) { return l.id === MR.qs('list'); })[0];
      if (named) campaign.list_id = named.id;
      else if (mailable.length === 1) campaign.list_id = mailable[0].id;
    }

    function addressField(refresh) {
      var area = MR.h('textarea', { class: 'dr-textarea', id: 'c-address', rows: '3' });
      var status = MR.h('p', { class: 'dr-small', id: 'c-address-status', role: 'status' });
      var save = function () {
        var v = area.value.replace(/[ \t]+/g, ' ').trim();
        if (!MR.hasAddress({ postal_address: v })) { status.textContent = ''; return; }
        if (MR.cfg.demo) { status.textContent = 'Preview only: nothing is saved.'; account.postal_address = v; refresh(); return; }
        MR.api.update('mailroom_accounts', 'id=eq.' + account.id, { postal_address: v })
          .then(function () {
            account.postal_address = v;
            status.textContent = 'Saved to your account. You will not be asked again.';
            refresh();
          })
          .catch(function (err) { status.textContent = 'That address could not be saved. Please try again.'; console.error(err); });
      };
      area.addEventListener('change', save);
      return MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'c-address', text: 'Your postal address' }),
        MR.h('span', { class: 'dr-hint', text: 'Required by law in every marketing email. It is printed in the footer and saved to your account, so you only enter it once. A street address, or a PO box or private mailbox registered to you.' }),
        area, status);
    }

    // The domain this campaign will leave from, or null for the shared address.
    function chosenDomain() {
      return domains.filter(function (d) { return d.id === campaign.sending_domain_id; })[0] || null;
    }

    // The credit line is the platform's own unless the plan allows another and
    // the email leaves from the account's own domain. The preview applies the
    // same rule as the sending code, so it shows what will really go out.
    function brandForPreview() {
      if (!brand || MR.creditAllowed(account, chosenDomain())) return brand;
      var copy = {};
      Object.keys(brand).forEach(function (k) { copy[k] = brand[k]; });
      copy.footer_credit = '';
      return copy;
    }

    // Exactly what the reader sees in front of the message, worked out the way
    // the sending code works it out.
    function recipientsSee() {
      var d = chosenDomain();
      var address = d ? d.from_local + '@' + d.domain
        : (account.sender_local || 'mailroom') + '@mail.abta.africa';
      return { name: String(campaign.from_name || '').trim() || account.name, address: address,
        own: !!d && d.kind === 'own_domain', sub: !!d && d.kind !== 'own_domain' };
    }

    function loadVersions() {
      return MR.api.select('mailroom_campaign_versions?select=id,subject,created_at&campaign_id=eq.' +
        campaign.id + '&order=created_at.desc&limit=50')
        .then(function (rows) { versions = rows || []; })
        .catch(function () { versions = []; });
    }

    /* ---------------- the page ---------------- */
    function render() {
      // A campaign waiting in the queue is not editable, so it does not get
      // the editor at all.
      if (campaign.status === 'scheduled') {
        scheduledView();
        return;
      }
      if (!Array.isArray(campaign.body_blocks) || !campaign.body_blocks.length) {
        var wanted = MR.qs('template');
        var chosen = wanted && (MR.TEMPLATES || []).filter(function (x) { return x.id === wanted; })[0];
        if (chosen) { useLayout(chosen); return; }
        renderTemplateChoice();
        return;
      }
      renderEditor();
    }

    /* ---- choosing a starter layout ----
       The gallery itself is in mr-gallery.js, which the public Templates page
       uses as well. A layout can also be chosen before the editor opens:
       campaign.html?template=<id> starts a new campaign from that layout. */
    function useLayout(t) {
      campaign.body_blocks = MR.templateBlocks(t.id);
      var look = MR.templateStyle ? MR.templateStyle(t.id) : null;
      if (look) campaign.style = Object.assign({}, campaign.style || {}, look);
      if (t.id !== 'blank') campaign.style = Object.assign({}, campaign.style || {}, { template: t.id });
      if (MR.templateHeader && t.id !== 'blank') campaign.header_colour = MR.templateHeader(t.id);
      renderEditor();
      MR.announce(t.name + ' layout added');
    }

    function renderTemplateChoice() {
      wrap.textContent = '';
      var all = (MR.TEMPLATES || []).filter(function (t) { return t.id !== 'blank'; });
      wrap.appendChild(MR.h('h1', { text: 'Write a campaign' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'Choose one of ' + all.length + ' layouts to start from, grouped by what you want to send. Each one comes with its own colours and type, and everything in it can be changed.' }));
      MR.templateGallery({ root: wrap, account: account, onUse: useLayout, onBlank: useLayout });
    }


    /* ---------------- the settings fields ----------------
       Subject, sender, list: shared by the studio (in its Send panel) and by
       the simple editor. withStyle adds typeface, header strip and browser
       link, which the studio keeps on its Style panel instead. */
    function buildSettings(form, refresh, withStyle) {
      // Asked here, at the first send, rather than at sign-up: this is where
      // it is needed, and it is saved to the account so it is asked once.
      if (!MR.hasAddress(account)) form.appendChild(addressField(refresh));
      form.appendChild(field('c-subject', 'Subject line', campaign.subject, function (v) { campaign.subject = v; refresh(); },
        'Say what is in the email. Capitals and rows of exclamation marks get flagged.'));
      form.appendChild(field('c-preheader', 'Preview text', campaign.preheader, function (v) { campaign.preheader = v; refresh(); },
        'The line mail apps show after the subject.'));
      form.appendChild(field('c-from', 'From name', campaign.from_name, function (v) { campaign.from_name = v; refresh(); showSender(); },
        'Your organisation name. It appears in front of the sending address below.'));

      var domainSelect = MR.h('select', { class: 'dr-select', id: 'c-domain' },
        MR.h('option', {
          value: '', selected: !campaign.sending_domain_id,
          text: 'The shared sending address'
        }));
      domains.forEach(function (d) {
        domainSelect.appendChild(MR.h('option', {
          value: d.id, selected: campaign.sending_domain_id === d.id,
          text: d.from_local + '@' + d.domain
        }));
      });
      domainSelect.addEventListener('change', function () {
        campaign.sending_domain_id = domainSelect.value || null;
        showSender();
        refresh();
      });
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'c-domain', text: 'Sent from' }),
        MR.h('span', { class: 'dr-hint' }, domains.length
          ? 'Your own domain puts your real address in front of readers and carries its own delivery record.'
          : 'You have no verified domain of your own yet. ',
          domains.length ? null : MR.h('a', { href: 'domain.html', text: 'Send from your own domain instead' })),
        domainSelect));

      // What the reader sees in the From line, so nobody has to guess.
      var seeLine = MR.h('p', { class: 'dr-body', id: 'c-sees', 'aria-live': 'polite' });
      var seeNote = MR.h('p', { class: 'dr-hint', id: 'c-sees-note' });
      form.appendChild(MR.h('div', { class: 'dr-form-group' }, seeLine, seeNote));
      function showSender() {
        var r = recipientsSee();
        seeLine.textContent = 'Recipients will see: ' + r.name + ' <' + r.address + '>';
        seeNote.textContent = '';
        if (r.own) {
          seeNote.appendChild(document.createTextNode('This is your own address.'));
        } else {
          seeNote.appendChild(document.createTextNode(
            (r.sub ? 'This address is on a subdomain ABTA sets up for you.' : 'This is the shared ABTA address.') + ' Every email sent from it carries a line at the bottom saying it was sent through AMI Mailroom. '));
          seeNote.appendChild(MR.h('a', { href: 'domain.html', text: 'Use your own address' }));
          seeNote.appendChild(document.createTextNode('.'));
        }
      }
      showSender();

      // Only an address the account has confirmed, so replies cannot be sent
      // to somebody else's inbox. New ones are added on the account page.
      if (replyAddresses.length) {
        var replySelect = MR.h('select', { class: 'dr-select', id: 'c-reply' });
        replyAddresses.forEach(function (email) {
          replySelect.appendChild(MR.h('option', {
            value: email, selected: campaign.reply_to === email, text: email
          }));
        });
        if (replyAddresses.indexOf(campaign.reply_to) === -1 && campaign.reply_to) {
          replySelect.insertBefore(MR.h('option', {
            value: campaign.reply_to, selected: true,
            text: campaign.reply_to + ' (not confirmed)'
          }), replySelect.firstChild);
        }
        replySelect.addEventListener('change', function () { campaign.reply_to = replySelect.value; });
        form.appendChild(MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'c-reply', text: 'Replies go to' }),
          MR.h('span', { class: 'dr-hint' }, 'Replies come to you, not to ACME Limited. ',
            MR.h('a', { href: 'settings.html', text: 'Add another address' })),
          replySelect));
      } else {
        form.appendChild(field('c-reply', 'Replies go to', campaign.reply_to, function (v) { campaign.reply_to = v; },
          'Replies come to you, not to ACME Limited. This address has to be confirmed on your account page before you can send.'));
      }

      if (withStyle) {
        var fontSelect = MR.h('select', { class: 'dr-select dr-input--w', id: 'c-font' },
          MR.h('option', { value: 'sans', text: 'Sans serif (Arial, Helvetica)', selected: campaign.font_family === 'sans' }),
          MR.h('option', { value: 'serif', text: 'Serif (Georgia, Times)', selected: campaign.font_family === 'serif' }),
          MR.h('option', { value: 'system', text: 'System font', selected: campaign.font_family === 'system' }));
        fontSelect.addEventListener('change', function () { campaign.font_family = fontSelect.value; refresh(); });
        form.appendChild(MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'c-font', text: 'Typeface' }),
          MR.h('span', { class: 'dr-hint', text: 'Only fonts that exist on every device. A downloaded brand font silently falls back in Outlook, so the Mailroom does not offer one.' }),
          fontSelect));

        // The strip behind the logo, and the line above the email.
        var headerOn = MR.h('input', {
          class: 'dr-choice__input', id: 'c-header-on', type: 'checkbox',
          checked: !!campaign.header_colour
        });
        var headerHex = MR.h('input', {
          class: 'dr-input dr-input--w', id: 'c-header-colour', type: 'text',
          value: campaign.header_colour || '#f3ead9', hidden: !campaign.header_colour
        });
        headerOn.addEventListener('change', function () {
          headerHex.hidden = !headerOn.checked;
          campaign.header_colour = headerOn.checked ? headerHex.value : null;
          refresh();
        });
        headerHex.addEventListener('input', function () {
          if (/^#[0-9a-fA-F]{6}$/.test(headerHex.value)) { campaign.header_colour = headerHex.value; refresh(); }
        });
        form.appendChild(MR.h('div', { class: 'dr-choice dr-choice--checkbox' }, headerOn,
          MR.h('label', { class: 'dr-choice__label', for: 'c-header-on' }, 'Put a colour strip behind the logo',
            MR.h('span', { class: 'dr-choice__hint', text: 'Otherwise the header is a rule in your accent colour.' }))));
        form.appendChild(MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'c-header-colour', text: 'Strip colour' }), headerHex));

        var topName = MR.h('input', {
          class: 'dr-input dr-input--w', id: 'c-header-text', type: 'text', maxlength: '80',
          value: (campaign.style && campaign.style.header_text) || '', placeholder: account.name || ''
        });
        topName.addEventListener('input', function () {
          if (!campaign.style || typeof campaign.style !== 'object') campaign.style = {};
          if (topName.value.trim()) campaign.style.header_text = topName.value; else delete campaign.style.header_text;
          refresh();
        });
        form.appendChild(MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'c-header-text', text: 'Name at the top' }),
          MR.h('span', { class: 'dr-hint', text: 'Shown above the email when there is no logo. Leave it empty to use your account name.' }),
          topName));

        var browserOn = MR.h('input', {
          class: 'dr-choice__input', id: 'c-browser', type: 'checkbox',
          checked: !!campaign.show_browser_link
        });
        browserOn.addEventListener('change', function () {
          campaign.show_browser_link = browserOn.checked; refresh();
        });
        form.appendChild(MR.h('div', { class: 'dr-choice dr-choice--checkbox' }, browserOn,
          MR.h('label', { class: 'dr-choice__label', for: 'c-browser' }, 'Show a "View in browser" link',
            MR.h('span', { class: 'dr-choice__hint', text: 'It points at the archive copy, so it only works if this campaign is public in the archive.' }))));

      }
      var listSelect = MR.h('select', { class: 'dr-select', id: 'c-list' },
        MR.h('option', { value: '', text: 'Choose a list' }));
      lists.forEach(function (l) {
        listSelect.appendChild(MR.h('option', {
          value: l.id, selected: campaign.list_id === l.id,
          disabled: l.consent_status === 'unconfirmed',
          text: l.name + (l.consent_status === 'unconfirmed' ? ' (how people agreed is not recorded, so it cannot be mailed)' : '')
        }));
      });
      listSelect.addEventListener('change', function () { campaign.list_id = listSelect.value; });
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'c-list', text: 'Send to' }), listSelect));

      function field(id, labelText, value, onInput, hint) {
        var input = MR.h('input', { class: 'dr-input', id: id, type: 'text', value: value || '' });
        input.addEventListener('input', function () { onInput(input.value); });
        return MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: id, text: labelText }),
          hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null, input);
      }
    }

    /* ---- the editor ---- */
    function renderEditor() {
      if (studioWanted()) { renderStudio(); return; }
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: campaignId ? 'Edit campaign' : 'Write a campaign' }));
      if (window.innerWidth < 700 && !MR.qs('classic') && MR.studio && MR.editorParts) {
        wrap.appendChild(MR.h('p', { class: 'dr-lead', id: 'mr-simple-note',
          text: 'You are using the simple editor because this screen is narrow. It does the same job, with fewer tools and no editing directly on the email. Open this campaign on a tablet or a computer for the full editor.' }));
      }

      if (campaign.status === 'held') {
        MR.banner(wrap, 'Held for review',
          (campaign.held_reason || 'A check flagged this campaign.') +
          ' ACME Limited looks at held campaigns within one working day. Fix the problem and it will be released.', 'important');
      }
      if (campaign.status === 'sent') {
        MR.banner(wrap, 'Already sent', 'This campaign has been sent, so it can no longer be edited.');
      }
      if (account && account.status === 'suspended') {
        MR.banner(wrap, 'Sending suspended', account.suspension_reason || 'Contact ami@abta.africa.', 'important');
      }
      if (!brand && !MR.cfg.demo) {
        MR.banner(wrap, 'Set up your look once',
          'Your logo, colours and footer can be saved on the brand page and applied to every campaign after this one.');
      }

      var form = MR.h('form', { id: 'mr-campaign-form', novalidate: true });

      buildSettings(form, refresh, true);

      form.appendChild(MR.h('h2', { text: 'Content' }));
      var editorBox = MR.h('div', { id: 'mr-editor' });
      form.appendChild(editorBox);

      form.appendChild(scheduleBox());

      form.appendChild(MR.h('div', { class: 'dr-button-group' },
        MR.h('button', { class: 'dr-button dr-button--secondary', type: 'button', text: 'Save draft', onclick: function () { save('draft', true); } }),
        MR.h('button', { class: 'dr-button dr-button--secondary', type: 'button', text: 'Send a test to me', onclick: testSend }),
        MR.h('button', { class: 'dr-button dr-button--secondary', type: 'button', text: 'Share a preview link', onclick: shareLink }),
        MR.h('button', { class: 'dr-button', type: 'submit', text: 'Send campaign' })));

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        sendNow(form);
      });

      var previewBox = MR.h('div', { class: 'mr-preview', id: 'mr-preview' });
      var aside = MR.h('aside', null,
        MR.h('h2', { class: 'dr-h', text: 'Preview' }), previewBox, versionBox());
      wrap.appendChild(MR.h('div', { class: 'dr-grid dr-grid--two-thirds' }, form, aside));

      editorApi = MR.editor(editorBox, campaign, refresh, {
        saved: savedBlocks,
        images: MR.cfg.demo ? null : function (onPick) { MR.pickImage(account.id, onPick); },
        onSaveBlock: function (blocks, done) { saveBlock(blocks, done); }
      });
      preview = MR.preview(previewBox, function () { return campaign; },
        function () { return account; }, brandForPreview);

      function refresh() { if (preview) preview.refresh(); }

      function field(id, labelText, value, onInput, hint) {
        var input = MR.h('input', { class: 'dr-input', id: id, type: 'text', value: value || '' });
        input.addEventListener('input', function () { onInput(input.value); });
        return MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: id, text: labelText }),
          hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null, input);
      }
    }

    /* ---------------- the studio ----------------
       The full-screen editor (mr-studio.js). It needs room: a panel, the
       email and a bar. It is laid out well from 700 pixels wide, which takes in
       a tablet held upright. On a narrower screen, or with ?classic=1 on the
       address, the stacked editor above is used instead, and says so. */
    function studioWanted() {
      return !!(MR.studio && MR.editorParts && !MR.qs('classic') && window.innerWidth >= 700);
    }

    // Where a message goes: the studio's own space when it is open, because
    // the page behind it is hidden.
    function notes() {
      if (studio) {
        // A new message replaces the last one. The ones marked data-keep, which
        // say what state the campaign is in, stay.
        var n = studio.notes();
        Array.prototype.slice.call(n.children).forEach(function (c) { if (!c.hasAttribute('data-keep')) c.remove(); });
        return n;
      }
      var form = document.getElementById('mr-campaign-form');
      return (form && form.parentNode) || wrap;
    }

    // Leave the studio before a confirmation page replaces the page.
    function leaveStudio() {
      if (studio) { studio.destroy(); studio = null; }
    }

    // Show the error summary on the Send panel, and make a link to a block
    // select that block, since its fields are only on screen when it is selected.
    function showErrors(form, errors) {
      if (studio && errors.length) studio.openSend();
      var shown = MR.errors.show(form, errors);
      if (shown && studio) {
        var links = form.querySelectorAll('.dr-error-summary a');
        errors.forEach(function (err, i) {
          if (err.path && links[i]) {
            links[i].addEventListener('click', function () {
              studio.select(err.path);
              setTimeout(function () {
                var t = document.getElementById(err.id);
                if (t) t.focus();
              }, 60);
            });
          }
        });
      }
      return shown;
    }

    function renderStudio() {
      leaveStudio();
      wrap.textContent = '';
      var form = MR.h('form', { id: 'mr-campaign-form', novalidate: true });

      buildSettings(form, function () { if (studio) studio.touch(); }, false);
      form.appendChild(scheduleBox());
      form.appendChild(MR.h('div', { class: 'dr-button-group' },
        MR.h('button', { class: 'dr-button dr-button--secondary', type: 'button', text: 'Save draft', onclick: function () { save('draft', true); } }),
        MR.h('button', { class: 'dr-button', type: 'submit', text: 'Send campaign' })));
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        sendNow(form);
      });
      var panel = MR.h('div', null, form, versionBox());

      studio = MR.studio.mount({
        campaign: campaign,
        getAccount: function () { return account; },
        getBrand: brandForPreview,
        saved: savedBlocks,
        images: MR.cfg.demo ? null : function (onPick) { MR.pickImage(account.id, onPick); },
        onSaveBlock: function (blocks, done) { saveBlock(blocks, done); },
        sendPanel: panel,
        save: function (announce) { return save('draft', announce); },
        testSend: testSend,
        shareLink: shareLink,
        home: 'campaigns.html',
        classicUrl: 'campaign.html?classic=1' + (campaign.id ? '&id=' + campaign.id : ''),
        demo: !!MR.cfg.demo
      });

      if (campaign.status === 'held') {
        keep(MR.banner(studio.notes(), 'Held for review',
          (campaign.held_reason || 'A check flagged this campaign.') +
          ' Held campaigns are looked at within one working day. Fix the problem and it will be released.', 'important'));
      }
      if (campaign.status === 'sent') {
        keep(MR.banner(studio.notes(), 'Already sent', 'This campaign has been sent, so it can no longer be edited.'));
      }
      if (account && account.status === 'suspended') {
        keep(MR.banner(studio.notes(), 'Sending suspended', account.suspension_reason || 'Contact support to find out why.', 'important'));
      }
      if (!brand && !MR.cfg.demo) {
        keep(MR.banner(studio.notes(), 'Set up your look once',
          'Your logo, colours and footer can be saved on the brand page and applied to every campaign after this one.'));
      }
      function keep(box) { box.setAttribute('data-keep', ''); return box; }
    }

    /* ---------------- earlier drafts ---------------- */
    function versionBox() {
      var box = MR.h('div', { class: 'mr-aside', id: 'mr-versions' },
        MR.h('h2', { class: 'dr-h', text: 'Earlier drafts' }));
      if (!versions.length) {
        box.appendChild(MR.h('p', { class: 'dr-small', text: 'Every save is kept here, so you can go back to what this said before.' }));
        return box;
      }
      var ul = MR.h('ul', { class: 'dr-list' });
      versions.forEach(function (v) {
        ul.appendChild(MR.h('li', null,
          MR.h('span', { text: MR.dateTimeInZone(v.created_at, tz()) + ' · ' + (v.subject || 'no subject') }), ' ',
          MR.h('button', {
            type: 'button', class: 'dr-button dr-button--secondary', text: 'Restore',
            onclick: function () { restore(v.id); }
          })));
      });
      box.appendChild(ul);
      box.appendChild(MR.h('p', { class: 'dr-small', text: 'Up to the last fifty saves are kept, including the ones made automatically. Restoring brings the content back; it does not send anything.' }));
      return box;
    }

    function restore(versionId) {
      if (!confirm('Bring back this draft? The content you have now is saved first, so you can come back to it.')) return;
      save('draft').then(function () {
        return MR.api.select('mailroom_campaign_versions?select=*&id=eq.' + versionId);
      }).then(function (rows) {
        var v = rows && rows[0];
        if (!v) return;
        campaign.subject = v.subject;
        campaign.preheader = v.preheader;
        campaign.body_blocks = v.body_blocks;
        return save('draft').then(loadVersions).then(function () {
          renderEditor();
          MR.announce('Earlier draft restored');
        });
      }).catch(function (err) {
        MR.banner(notes(), 'Could not restore that draft', message(err), 'important');
      });
    }

    /* ---------------- saved blocks ---------------- */
    function saveBlock(blocks, done) {
      var name = prompt('Name this block, so you can find it again. For example: Our sign-off.');
      if (!name) return;
      if (MR.cfg.demo) { MR.announce('Preview only: nothing is saved.'); return; }
      MR.api.insert('mailroom_saved_blocks', {
        account_id: account.id, name: name.slice(0, 60), blocks: blocks, created_by: MR.auth.userId()
      }).then(function (rows) {
        savedBlocks = savedBlocks.concat([rows[0]]);
        done(rows[0]);
        MR.announce('Block saved');
      }).catch(function (err) {
        alert(/duplicate key/i.test(String(err.message))
          ? 'You already have a saved block with that name.'
          : 'That block could not be saved.');
      });
    }

    /* ---------------- share a preview ---------------- */
    function shareLink() {
      if (MR.cfg.demo) {
        MR.banner(notes(), 'Preview only', 'On the live service this gives you a link anyone can open, without a Mailroom account.');
        return;
      }
      save('draft').then(function (saved) {
        if (!saved) return;
        return MR.rpc('mailroom_share_campaign', { cid: saved.id });
      }).then(function (token) {
        if (!token) return;
        var url = location.origin + location.pathname.replace(/campaign\.html$/, 'preview.html') + '?t=' + token;
        var box = MR.banner(notes(), 'Anyone with this link can read the draft', url);
        box.appendChild(MR.h('p', null, MR.h('button', {
          class: 'dr-button dr-button--secondary', type: 'button', text: 'Copy the link',
          onclick: function () {
            if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { MR.announce('Link copied'); });
          }
        }), ' ', MR.h('button', {
          class: 'dr-button dr-button--warning', type: 'button', text: 'Stop sharing',
          onclick: function () {
            MR.rpc('mailroom_unshare_campaign', { cid: campaign.id }).then(function () {
              box.remove();
              MR.announce('Sharing stopped');
            });
          }
        })));
      }).catch(function (err) {
        MR.banner(notes(), 'Could not make a link', message(err), 'important');
      });
    }

    /* ---------------- validation ---------------- */
    function validate(forSend) {
      var errors = [];
      if (!String(campaign.subject || '').trim()) errors.push({ id: 'c-subject', message: 'Enter a subject line' });
      if (!String(campaign.from_name || '').trim()) errors.push({ id: 'c-from', message: 'Enter a from name' });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(campaign.reply_to || '')) {
        errors.push({ id: 'c-reply', message: 'Enter a reply-to address' });
      }
      if (forSend && !campaign.list_id) errors.push({ id: 'c-list', message: 'Choose a list to send to' });
      if (forSend && !MR.hasAddress(account)) {
        errors.push({ id: document.getElementById('c-address') ? 'c-address' : 'c-from',
          message: 'Add your postal address. Every marketing email has to carry one' });
      }
      var hasContent = campaign.body_blocks.some(function (b) {
        return (b.text && b.text.trim()) || (b.left && b.left.trim()) ||
               (b.right && b.right.trim()) || (b.url && b.url.trim()) ||
               (b.html && b.html.trim()) || (b.name && b.name.trim());
      });
      if (!hasContent) errors.push({ id: 'c-subject', message: 'Add some content before sending' });
      // A layout comes written out with invented facts. Hold the send until
      // each of those lines has been changed, or deleted.
      if (forSend && MR.sampleTextLeft) {
        var left = MR.sampleTextLeft(campaign);
        left.slice(0, 5).forEach(function (f) {
          errors.push({ id: 'b' + f.path, path: f.path,
            message: 'Replace the sample text in block ' + (Number(f.path) + 1) + ': \u201c' + f.text + '\u201d. It came with the ' + f.layout + ' layout' });
        });
        if (left.length > 5) errors.push({ id: 'b' + left[5].path, path: left[5].path,
          message: (left.length - 5) + ' more blocks still have sample text from the layout' });
      }
      campaign.body_blocks.forEach(function (b, i) {
        var needsImage = b.type === 'image' || b.type === 'imagetext';
        // A description, or the tick that says the picture is only decoration.
        var told = String(b.alt || '').trim() !== '' || b.decorative === true;
        if (needsImage && !told) {
          errors.push({ id: 'b' + i + '-alt', path: String(i), message: 'Describe image ' + (i + 1) + ', or tick that it is only decoration' });
        }
        if (needsImage && !String(b.url || '').trim()) {
          errors.push({ id: 'b' + i + '-url', path: String(i), message: 'Choose or upload image ' + (i + 1) });
        }
        if (b.type === 'button' && !String(b.url || '').trim()) {
          errors.push({ id: 'b' + i + '-url', path: String(i), message: 'Give the link for button ' + (i + 1) });
        }
        if (b.type === 'video') {
          if (!String(b.url || '').trim()) {
            errors.push({ id: 'b' + i + '-url', path: String(i), message: 'Give the link for video ' + (i + 1) });
          }
          if ((String(b.thumb || '').trim() || String(b.url || '').trim()) && !String(b.alt || '').trim()) {
            errors.push({ id: 'b' + i + '-alt', path: String(i), message: 'Describe the thumbnail of video ' + (i + 1) });
          }
        }
        if (b.type === 'logo') {
          if (!String(b.url || '').trim() && !(brand && brand.logo_url)) {
            errors.push({ id: 'b' + i + '-url', path: String(i), message: 'Choose a logo for block ' + (i + 1) + ', or save one in your brand settings' });
          }
          if (String(b.url || '').trim() && !String(b.alt || '').trim()) {
            errors.push({ id: 'b' + i + '-alt', path: String(i), message: 'Describe the logo in block ' + (i + 1) });
          }
        }
        if (b.type === 'product') {
          if (!String(b.name || '').trim()) {
            errors.push({ id: 'b' + i + '-name', path: String(i), message: 'Give product ' + (i + 1) + ' a name' });
          }
          if (String(b.url || '').trim() && !told) {
            errors.push({ id: 'b' + i + '-alt', path: String(i), message: 'Describe the image of product ' + (i + 1) + ', or tick that it is only decoration' });
          }
        }
        if (b.type === 'navigation') {
          (b.links || []).forEach(function (l, j) {
            if (String(l.label || '').trim() && !String(l.url || '').trim()) {
              errors.push({ id: 'b' + i + '-l' + j + '-url', path: String(i), message: 'Give the link for ' + l.label });
            }
          });
        }
        if (b.type === 'social') {
          (b.links || []).forEach(function (l, j) {
            if (String(l.label || '').trim() && !String(l.url || '').trim()) {
              errors.push({ id: 'b' + i + '-l' + j + '-url', path: String(i), message: 'Give the link for ' + l.label });
            }
          });
        }
      });
      return errors;
    }

    function row(status) {
      var r = {
        account_id: account.id, list_id: campaign.list_id || null,
        sending_domain_id: campaign.sending_domain_id || null, subject: campaign.subject,
        preheader: campaign.preheader || null, from_name: campaign.from_name,
        reply_to: campaign.reply_to, body_blocks: campaign.body_blocks,
        font_family: campaign.font_family || 'sans',
        header_colour: campaign.header_colour || null,
        show_browser_link: !!campaign.show_browser_link,
        status: status, created_by: MR.auth.userId()
      };
      // Only sent once there is something to send, so a campaign that was
      // never styled saves the same way it always did.
      if (campaign.style) r.style = campaign.style;
      return r;
    }

    function save(status, announce) {
      var form = document.getElementById('mr-campaign-form');
      var errors = status === 'draft' ? [] : validate(true);
      if (showErrors(form, errors)) return Promise.resolve(null);
      if (MR.cfg.demo) {
        if (announce) MR.banner(notes(), 'Preview only', 'Nothing was saved.');
        return Promise.resolve({ id: 'demo' });
      }
      var p = campaign.id
        ? MR.api.update('mailroom_campaigns', 'id=eq.' + campaign.id, row(status))
        : MR.api.insert('mailroom_campaigns', row(status));
      return p.then(function (rows) {
        campaign.id = rows[0].id;
        campaign.status = rows[0].status;
        if (studio) studio.markSaved();
        if (announce) {
          MR.announce('Draft saved');
          loadVersions().then(function () {
            var box = document.getElementById('mr-versions');
            if (box) box.parentNode.replaceChild(versionBox(), box);
          });
        }
        return rows[0];
      });
    }

    /* ---------------- scheduling ----------------
       The campaign waits in the database, not at the email provider, so every
       check runs at the moment it goes rather than at the moment it was set.
       A member picks a wall clock time; the account's timezone turns it into
       an instant. */

    function tz() { return MR.displayZone(account && account.timezone); }

    function scheduleBox() {
      var box = MR.h('div', { class: 'mr-aside', id: 'mr-schedule' },
        MR.h('h2', { class: 'dr-h', text: 'Send it later' }),
        MR.h('p', { class: 'dr-small' }, 'Times are in ',
          MR.h('strong', { text: tz().replace(/_/g, ' ') }),
          ', your account timezone. ',
          MR.h('a', { href: 'settings.html', text: 'Change it' }), '.'));

      // A campaign that came back from the queue says why, so the member is
      // not left guessing why it is a draft again.
      if (campaign.schedule_error) {
        box.appendChild(MR.h('p', { class: 'dr-error-message', text: campaign.schedule_error }));
      }

      var now = new Date();
      var picked = campaign.scheduled_for
        ? MR.isoToZoned(campaign.scheduled_for, tz())
        : MR.isoToZoned(new Date(now.getTime() + 3600000).toISOString(), tz());

      var dateInput = MR.h('input', {
        class: 'dr-input dr-input--w', id: 'c-date', type: 'date', value: picked.date
      });
      var timeInput = MR.h('input', {
        class: 'dr-input dr-input--w', id: 'c-time', type: 'time', value: picked.time
      });
      var readOut = MR.h('p', { class: 'dr-small', id: 'c-schedule-readout' });

      function showReadOut() {
        var iso = MR.zonedToIso(dateInput.value, timeInput.value, tz());
        readOut.textContent = iso
          ? 'This would go out on ' + MR.dateTimeInZone(iso, tz()) + '.'
          : 'Choose a date and a time.';
      }
      dateInput.addEventListener('input', showReadOut);
      timeInput.addEventListener('input', showReadOut);
      showReadOut();

      box.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'c-date', text: 'Date' }), dateInput));
      box.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'c-time', text: 'Time' }),
        MR.h('span', { class: 'dr-hint', text: 'Sent within five minutes of the time you choose.' }),
        timeInput));
      box.appendChild(readOut);
      box.appendChild(MR.h('button', {
        class: 'dr-button dr-button--secondary', type: 'button', text: 'Schedule it',
        onclick: function () { schedule(dateInput.value, timeInput.value); }
      }));
      box.appendChild(MR.h('p', { class: 'dr-small', text: 'A scheduled campaign cannot be edited. Unschedule it first, make the change, then schedule it again.' }));
      return box;
    }

    function schedule(dateStr, timeStr) {
      var form = document.getElementById('mr-campaign-form');
      var errors = validate(true);
      var iso = MR.zonedToIso(dateStr, timeStr, tz());
      if (!iso) errors.push({ id: 'c-date', message: 'Choose a date and a time to send this campaign' });
      else if (new Date(iso) <= new Date()) {
        errors.push({ id: 'c-date', message: 'That time has already passed. Choose a time in the future.' });
      }
      if (showErrors(form, errors)) return;

      if (MR.cfg.demo) {
        MR.banner(notes(), 'Preview only',
          'On the live service this would be queued for ' + MR.dateTimeInZone(iso, tz()) + '.');
        return;
      }
      if (!confirm('Schedule this campaign for ' + MR.dateTimeInZone(iso, tz()) + '?')) return;

      save('draft').then(function (saved) {
        if (!saved) return;
        return MR.api.update('mailroom_campaigns', 'id=eq.' + saved.id, {
          status: 'scheduled', scheduled_for: iso
        });
      }).then(function (rows) {
        if (!rows) return;
        // Confirmation page, not a cleared form. See MR.done in mr-core.js.
        leaveStudio();
        MR.done(wrap, {
          title: 'Campaign scheduled',
          lead: 'It goes out on',
          detail: MR.dateTimeInZone(iso, tz()),
          next: [
            'Until then the campaign is locked, so it cannot be edited.',
            'You can unschedule it from your mailroom if you need to change it.',
            'Results appear on your mailroom as they come back.'
          ],
          actions: [['account.html', 'Go to your mailroom'], ['campaign.html', 'Write another campaign']]
        });
      }).catch(function (err) {
        showErrors(form, [{ id: 'c-date', message: message(err) }]);
        console.error(err);
      });
    }

    // A scheduled campaign is read-only. This is the whole page for one.
    function scheduledView() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: campaign.subject || 'Scheduled campaign' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead' },
        'Scheduled for ',
        MR.h('strong', { text: MR.dateTimeInZone(campaign.scheduled_for, tz()) }), '.'));
      wrap.appendChild(MR.h('p', { text: 'It is locked while it waits, so nothing can change under it between now and then. Every check runs again at the moment it goes: if your account, your list or your reply address has changed by then, it comes back to you as a draft with the reason.' }));

      var previewBox = MR.h('div', { class: 'mr-preview', id: 'mr-preview' });
      wrap.appendChild(MR.h('h2', { text: 'What goes out' }));
      wrap.appendChild(previewBox);
      MR.preview(previewBox, function () { return campaign; },
        function () { return account; }, brandForPreview);

      wrap.appendChild(MR.h('div', { class: 'dr-button-group' },
        MR.h('button', {
          class: 'dr-button dr-button--warning', type: 'button', text: 'Unschedule it',
          disabled: !!MR.cfg.demo,
          onclick: unschedule
        }),
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'account.html', text: 'Back to your mailroom' })));
    }

    function unschedule() {
      if (!confirm('Unschedule this campaign? It goes back to a draft and will not send until you schedule or send it again.')) return;
      MR.api.update('mailroom_campaigns', 'id=eq.' + campaign.id, { status: 'draft' })
        .then(function () { location.href = 'campaign.html?id=' + campaign.id; })
        .catch(function (err) {
          alert(message(err));
          console.error(err);
        });
    }

    // addresses: the ones the member typed. Empty means everyone on the account.
    function testSend(addresses) {
      var form = document.getElementById('mr-campaign-form');
      var list = Array.isArray(addresses) ? addresses : [];
      if (MR.cfg.demo) {
        MR.banner(notes(), 'Preview only', 'On the live service a test goes to the addresses you type, or to everyone on your account if you leave the box empty.');
        return;
      }
      save('draft').then(function (saved) {
        if (!saved) return;
        var body = { campaign_id: saved.id, mode: 'test' };
        if (list.length) body.addresses = list;
        return MR.fn('mailroom-send', body).then(function (r) {
          var n = r.queued || 0;
          MR.banner(notes(), 'Test on its way',
            'A test is going to ' + (n === 1 ? '1 address' : n + ' addresses') + (list.length ? '' : ' on your account') +
            ', usually within a minute. Open it on a phone as well as a laptop, and try it with images turned off.');
        });
      }).catch(function (err) {
        MR.banner(notes(), 'Test not sent', message(err), 'important');
        console.error(err);
      });
    }

    function sendNow(form) {
      var errors = validate(true);
      if (showErrors(form, errors)) return;
      if (MR.cfg.demo) {
        MR.banner(notes(), 'Preview only',
          'Your campaign passed every check. On the live service it would send now, with no approval step.');
        return;
      }
      if (!confirm('Send this campaign now? Once it starts it cannot be recalled.')) return;

      save('draft').then(function (saved) {
        if (!saved) return;
        return MR.fn('mailroom-send', { campaign_id: saved.id, mode: 'send' }).then(function (r) {
          leaveStudio();
          MR.done(wrap, {
            title: 'Campaign sending',
            lead: 'Queued and going out now',
            detail: MR.number(r.queued || 0) + (r.queued === 1 ? ' email' : ' emails'),
            next: [
              'A large list takes a few minutes to work through.',
              'Delivery, bounces and complaints appear on your mailroom as they come back.',
              'Nothing more is needed from you.'
            ],
            actions: [['account.html', 'Go to your mailroom'], ['archive.html', 'See the archive']]
          });
        });
      }).catch(function (err) {
        if (/held_for_review/.test(String(err.message))) {
          leaveStudio();
          MR.done(wrap, {
            title: 'Held for review',
            lead: 'This campaign has not gone out',
            next: [
              'A check flagged it, so it is waiting for a person to look at it.',
              'ACME Limited reviews held campaigns within one working day.',
              'You will be told what to change, if anything.'
            ],
            actions: [['account.html', 'Go to your mailroom']]
          });
          return;
        }
        showErrors(form, [{ id: 'c-subject', message: message(err) }]);
        console.error(err);
      });
    }

    function message(err) {
      var m = String(err && err.message || '');
      if (/consent evidence/i.test(m)) return 'That list cannot be mailed until you record how its people agreed to hear from you.';
      if (/account_suspended|cannot send at the moment/i.test(m)) return 'Sending is suspended on this account. Check your dashboard for the reason.';
      if (/reply_to_not_verified|reply-to address has not been confirmed/i.test(m)) return 'The reply-to address has not been confirmed. Confirm it in Settings, then send.';
      if (/domain_not_verified|not verified yet/i.test(m)) return 'That sending domain is not verified yet. Publish its DNS records, then check it on the sending domains page.';
      if (/domain_suspended|Sending from/i.test(m)) return 'Sending from that domain is suspended. Check the sending domains page for the reason.';
      if (/domain_not_yours|does not belong to this account/i.test(m)) return 'That sending domain does not belong to your account.';
      if (/monthly limit/i.test(m)) return 'This send would pass your monthly limit.';
      if (/invalid_test_address/i.test(m)) return 'One of those is not a valid email address. Check them and try again.';
      if (/too_many_test_addresses/i.test(m)) return 'A test can go to five addresses at most.';
      if (/too_many_tests/i.test(m)) return 'You have sent a lot of tests in the last hour. Wait a while and try again.';
      if (/no_test_addresses/i.test(m)) return 'There is no address to send the test to. Type one in the box.';
      if (/already_sent/i.test(m)) return 'This campaign has already been sent.';
      if (/no_recipients/i.test(m)) return 'Nobody on that list can be mailed: everyone has unsubscribed, bounced or complained.';
      if (/already passed|in the future/i.test(m)) return 'That time has already passed. Choose a time in the future.';
      if (/90 days/i.test(m)) return 'A campaign cannot be scheduled more than 90 days ahead.';
      if (/date and time/i.test(m)) return 'Choose a date and a time to send this campaign.';
      if (/is scheduled|only be unscheduled/i.test(m)) return 'This campaign is scheduled. Unschedule it before making changes.';
      return 'That could not be sent. Please try again shortly.';
    }
  });
})();
