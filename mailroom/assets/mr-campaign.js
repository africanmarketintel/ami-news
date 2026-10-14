/* ==========================================================================
   AMI Mailroom – writing and sending a campaign (campaign.html)
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

    if (MR.cfg.demo) {
      account = MR.sampleAccount;
      brand = MR.sampleBrand || null;
      campaign = JSON.parse(JSON.stringify(DEMO_CAMPAIGN));
      lists = (MR.sampleLists || []).map(function (l) { return { id: l.id, name: l.name, consent_status: l.consent_status }; });
      domains = (MR.sampleDomains || []).filter(function (d) { return d.status === 'verified'; });
      savedBlocks = MR.sampleSavedBlocks || [];
      replyAddresses = [DEMO_CAMPAIGN.reply_to];
      render();
      return;
    }

    MR.requireAccount(wrap).then(function (a) {
      account = a;
      return Promise.all([
        MR.api.select('mailroom_lists?select=id,name,consent_status'),
        campaignId ? MR.api.select('mailroom_campaigns?select=*&id=eq.' + campaignId) : Promise.resolve([]),
        MR.api.select('mailroom_domains?select=id,domain,from_local,is_default,sending_status&status=eq.verified'),
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
      if (!campaign.reply_to) campaign.reply_to = replyAddresses[0] || account.contact_email;
      if (!campaign.font_family) campaign.font_family = (brand && brand.font_family) || 'sans';
      if (campaign.id) return loadVersions().then(render);
      render();
    }).catch(function (err) {
      return MR.loadFailed(wrap, err);
    });

    function loadVersions() {
      return MR.api.select('mailroom_campaign_versions?select=id,subject,created_at&campaign_id=eq.' +
        campaign.id + '&order=created_at.desc&limit=20')
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
        renderTemplateChoice();
        return;
      }
      renderEditor();
    }

    /* ---- choosing a starter layout ---- */
    function renderTemplateChoice() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Write a campaign' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'Start from a layout, or from nothing. Everything in it can be changed.' }));
      var grid = MR.h('div', { class: 'dr-grid dr-grid--thirds', id: 'mr-templates' });
      (MR.TEMPLATES || []).forEach(function (t) {
        grid.appendChild(MR.h('div', { class: 'dr-status-card' },
          MR.h('h2', { class: 'dr-h', text: t.name }),
          MR.h('p', { class: 'dr-small', text: t.summary }),
          MR.h('button', {
            type: 'button', class: 'dr-button', 'data-template': t.id,
            text: t.id === 'blank' ? 'Start blank' : 'Use this layout',
            onclick: function () {
              campaign.body_blocks = MR.templateBlocks(t.id);
              renderEditor();
              MR.announce(t.name + ' layout added');
            }
          })));
      });
      wrap.appendChild(grid);
    }

    /* ---- the editor ---- */
    function renderEditor() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: campaignId ? 'Edit campaign' : 'Write a campaign' }));

      if (campaign.status === 'held') {
        MR.banner(wrap, 'Held for review',
          (campaign.held_reason || 'A check flagged this campaign.') +
          ' ABTA looks at held campaigns within one working day. Fix the problem and it will be released.', 'important');
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

      form.appendChild(field('c-subject', 'Subject line', campaign.subject, function (v) { campaign.subject = v; refresh(); },
        'Say what is in the email. Capitals and rows of exclamation marks get flagged.'));
      form.appendChild(field('c-preheader', 'Preview text', campaign.preheader, function (v) { campaign.preheader = v; refresh(); },
        'The line mail apps show after the subject.'));
      form.appendChild(field('c-from', 'From name', campaign.from_name, function (v) { campaign.from_name = v; refresh(); },
        'Your organisation name. It appears in front of the sending address below.'));

      var domainSelect = MR.h('select', { class: 'dr-select', id: 'c-domain' },
        MR.h('option', {
          value: '', selected: !campaign.sending_domain_id,
          text: 'The shared AMI Mailroom address'
        }));
      domains.forEach(function (d) {
        domainSelect.appendChild(MR.h('option', {
          value: d.id, selected: campaign.sending_domain_id === d.id,
          text: d.from_local + '@' + d.domain
        }));
      });
      domainSelect.addEventListener('change', function () {
        campaign.sending_domain_id = domainSelect.value || null;
      });
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'c-domain', text: 'Sent from' }),
        MR.h('span', { class: 'dr-hint' }, domains.length
          ? 'Your own domain puts your real address in front of readers and carries its own delivery record.'
          : 'You have no verified domain of your own yet. ',
          domains.length ? null : MR.h('a', { href: 'domain.html', text: 'Send from your own domain instead' })),
        domainSelect));

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
          MR.h('span', { class: 'dr-hint' }, 'Replies come to you, not to ABTA. ',
            MR.h('a', { href: 'account.html', text: 'Add another address' })),
          replySelect));
      } else {
        form.appendChild(field('c-reply', 'Replies go to', campaign.reply_to, function (v) { campaign.reply_to = v; },
          'Replies come to you, not to ABTA. This address has to be confirmed on your account page before you can send.'));
      }

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

      var listSelect = MR.h('select', { class: 'dr-select', id: 'c-list' },
        MR.h('option', { value: '', text: 'Choose a list' }));
      lists.forEach(function (l) {
        listSelect.appendChild(MR.h('option', {
          value: l.id, selected: campaign.list_id === l.id,
          disabled: l.consent_status === 'unconfirmed',
          text: l.name + (l.consent_status === 'unconfirmed' ? ' (consent not recorded, cannot be mailed)' : '')
        }));
      });
      listSelect.addEventListener('change', function () { campaign.list_id = listSelect.value; });
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'c-list', text: 'Send to' }), listSelect));

      form.appendChild(MR.h('h2', { text: 'Content' }));
      var editorBox = MR.h('div', { id: 'mr-editor' });
      form.appendChild(editorBox);

      form.appendChild(scheduleBox());

      form.appendChild(MR.h('div', { class: 'dr-button-group' },
        MR.h('button', { class: 'dr-button dr-button--secondary', type: 'button', text: 'Save draft', onclick: function () { save('draft', true); } }),
        MR.h('button', { class: 'dr-button dr-button--secondary', type: 'button', text: 'Send a test to your team', onclick: testSend }),
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
        function () { return account; }, function () { return brand; });

      function refresh() { if (preview) preview.refresh(); }

      function field(id, labelText, value, onInput, hint) {
        var input = MR.h('input', { class: 'dr-input', id: id, type: 'text', value: value || '' });
        input.addEventListener('input', function () { onInput(input.value); });
        return MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: id, text: labelText }),
          hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null, input);
      }
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
          MR.h('span', { text: MR.date(v.created_at) + ' · ' + (v.subject || 'no subject') }), ' ',
          MR.h('button', {
            type: 'button', class: 'dr-button dr-button--secondary', text: 'Restore',
            onclick: function () { restore(v.id); }
          })));
      });
      box.appendChild(ul);
      box.appendChild(MR.h('p', { class: 'dr-small', text: 'The last twenty saves are kept. Restoring brings the content back; it does not send anything.' }));
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
        MR.banner(wrap, 'Could not restore that draft', message(err), 'important');
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
        MR.banner(wrap, 'Preview only', 'On the live service this gives you a link anyone can open, without a Mailroom account.');
        return;
      }
      save('draft').then(function (saved) {
        if (!saved) return;
        return MR.rpc('mailroom_share_campaign', { cid: saved.id });
      }).then(function (token) {
        if (!token) return;
        var url = location.origin + location.pathname.replace(/campaign\.html$/, 'preview.html') + '?t=' + token;
        var box = MR.banner(wrap, 'Anyone with this link can read the draft', url);
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
        MR.banner(wrap, 'Could not make a link', message(err), 'important');
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
      var hasContent = campaign.body_blocks.some(function (b) {
        return (b.text && b.text.trim()) || (b.left && b.left.trim()) ||
               (b.right && b.right.trim()) || (b.url && b.url.trim());
      });
      if (!hasContent) errors.push({ id: 'c-subject', message: 'Add some content before sending' });
      campaign.body_blocks.forEach(function (b, i) {
        var needsImage = b.type === 'image' || b.type === 'imagetext';
        if (needsImage && !String(b.alt || '').trim()) {
          errors.push({ id: 'b' + i + '-alt', message: 'Describe image ' + (i + 1) + ', or readers who block images see nothing' });
        }
        if (needsImage && !String(b.url || '').trim()) {
          errors.push({ id: 'b' + i + '-url', message: 'Choose or upload image ' + (i + 1) });
        }
        if (b.type === 'button' && !String(b.url || '').trim()) {
          errors.push({ id: 'b' + i + '-url', message: 'Give the link for button ' + (i + 1) });
        }
        if (b.type === 'social') {
          (b.links || []).forEach(function (l, j) {
            if (String(l.label || '').trim() && !String(l.url || '').trim()) {
              errors.push({ id: 'b' + i + '-l' + j + '-url', message: 'Give the link for ' + l.label });
            }
          });
        }
      });
      return errors;
    }

    function row(status) {
      return {
        account_id: account.id, list_id: campaign.list_id || null,
        sending_domain_id: campaign.sending_domain_id || null, subject: campaign.subject,
        preheader: campaign.preheader || null, from_name: campaign.from_name,
        reply_to: campaign.reply_to, body_blocks: campaign.body_blocks,
        font_family: campaign.font_family || 'sans',
        header_colour: campaign.header_colour || null,
        show_browser_link: !!campaign.show_browser_link,
        status: status, created_by: MR.auth.userId()
      };
    }

    function save(status, announce) {
      var form = document.getElementById('mr-campaign-form');
      var errors = status === 'draft' ? [] : validate(true);
      if (MR.errors.show(form, errors)) return Promise.resolve(null);
      if (MR.cfg.demo) {
        if (announce) MR.banner(form.parentNode, 'Preview only', 'Nothing was saved.');
        return Promise.resolve({ id: 'demo' });
      }
      var p = campaign.id
        ? MR.api.update('mailroom_campaigns', 'id=eq.' + campaign.id, row(status))
        : MR.api.insert('mailroom_campaigns', row(status));
      return p.then(function (rows) {
        campaign.id = rows[0].id;
        campaign.status = rows[0].status;
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

    function tz() { return (account && account.timezone) || MR.TIMEZONE_FALLBACK; }

    function scheduleBox() {
      var box = MR.h('div', { class: 'mr-aside', id: 'mr-schedule' },
        MR.h('h2', { class: 'dr-h', text: 'Send it later' }),
        MR.h('p', { class: 'dr-small' }, 'Times are in ',
          MR.h('strong', { text: tz().replace(/_/g, ' ') }),
          ', your account timezone. ',
          MR.h('a', { href: 'account.html', text: 'Change it' }), '.'));

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
      if (MR.errors.show(form, errors)) return;

      if (MR.cfg.demo) {
        MR.banner(form.parentNode, 'Preview only',
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
        wrap.textContent = '';
        MR.banner(wrap, 'Campaign scheduled',
          'It goes out on ' + MR.dateTimeInZone(iso, tz()) +
          '. Until then it is locked, and you can unschedule it from your dashboard.');
      }).catch(function (err) {
        MR.errors.show(form, [{ id: 'c-date', message: message(err) }]);
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
        function () { return account; }, function () { return brand; });

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

    function testSend() {
      var form = document.getElementById('mr-campaign-form');
      if (MR.cfg.demo) {
        MR.banner(form.parentNode, 'Preview only', 'On the live service a test goes to everyone on your account.');
        return;
      }
      save('draft').then(function (saved) {
        if (!saved) return;
        return MR.fn('mailroom-send', { campaign_id: saved.id, mode: 'test' }).then(function (r) {
          MR.banner(form.parentNode, 'Test on its way',
            'A test is going to the ' + (r.queued || 0) + ' addresses on your account, usually within a minute. Open it on a phone as well as a laptop, and try it with images turned off.');
        });
      }).catch(function (err) {
        MR.banner(form.parentNode, 'Test not sent', message(err), 'important');
        console.error(err);
      });
    }

    function sendNow(form) {
      var errors = validate(true);
      if (MR.errors.show(form, errors)) return;
      if (MR.cfg.demo) {
        MR.banner(form.parentNode, 'Preview only',
          'Your campaign passed every check. On the live service it would send now, with no approval step.');
        return;
      }
      if (!confirm('Send this campaign now? Once it starts it cannot be recalled.')) return;

      save('draft').then(function (saved) {
        if (!saved) return;
        return MR.fn('mailroom-send', { campaign_id: saved.id, mode: 'send' }).then(function (r) {
          wrap.textContent = '';
          MR.banner(wrap, 'Campaign sending',
            MR.number(r.queued || 0) + ' emails are queued and going out now. A large list takes a few minutes. ' +
            'Progress and results appear on your dashboard as they come back.');
        });
      }).catch(function (err) {
        if (/held_for_review/.test(String(err.message))) {
          wrap.textContent = '';
          MR.banner(wrap, 'Held for review',
            'A check flagged this campaign, so it has not gone out. ABTA looks at held campaigns within one working day, and will tell you what to change.', 'important');
          return;
        }
        MR.errors.show(form, [{ id: 'c-subject', message: message(err) }]);
        console.error(err);
      });
    }

    function message(err) {
      var m = String(err && err.message || '');
      if (/consent evidence/i.test(m)) return 'That list cannot be mailed until its consent evidence is recorded.';
      if (/account_suspended|cannot send at the moment/i.test(m)) return 'Sending is suspended on this account. Check your dashboard for the reason.';
      if (/reply_to_not_verified|reply-to address has not been confirmed/i.test(m)) return 'The reply-to address has not been confirmed. Confirm it on your account page, then send.';
      if (/domain_not_verified|not verified yet/i.test(m)) return 'That sending domain is not verified yet. Publish its DNS records, then check it on the sending domains page.';
      if (/domain_suspended|Sending from/i.test(m)) return 'Sending from that domain is suspended. Check the sending domains page for the reason.';
      if (/domain_not_yours|does not belong to this account/i.test(m)) return 'That sending domain does not belong to your account.';
      if (/monthly limit/i.test(m)) return 'This send would pass your monthly limit.';
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
