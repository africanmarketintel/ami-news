/* ==========================================================================
   AMI Mailroom – reader-facing pages
     unsubscribe.html?token=   confirmation after one click from an email
     archive.html              past campaigns
     preview.html?t=           a draft a member shared for sign-off
   None of these need an account. The token in the link identifies one
   subscriber and nothing else.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  function fn(name, body, method) {
    var url = MR.cfg.url + '/functions/v1/' + name;
    return fetch(url, {
      method: method || 'POST',
      headers: { apikey: MR.cfg.key, 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body || {})
    }).then(function (r) {
      return r.json().then(function (b) {
        if (!r.ok) throw new Error(b.error || 'request failed');
        return b;
      });
    });
  }

  /* ---------------- the reader hub ----------------
     Every ABTA sender this address hears from, in one place. No other
     platform can offer this: their senders are unrelated companies with no
     reason to share a front door. Ours all sit on one list of members, so a
     reader who wants less email can turn it down instead of reporting spam,
     which is also what keeps the shared domain's complaint rate survivable.  */
  function initHub() {
    var wrap = document.getElementById('mr-hub');
    if (!wrap) return;
    var token = MR.qs('token');

    if (MR.cfg.demo) { render({ email: 'reader@example.com', senders: MR.sampleHub || [] }); return; }
    if (!token) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'Open this page from the link at the bottom of one of our emails.' }));
      return;
    }

    load();

    function load() {
      fetch(MR.cfg.url + '/functions/v1/mailroom-unsubscribe?token=' + encodeURIComponent(token) + '&action=hub', {
        headers: { apikey: MR.cfg.key }
      }).then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) throw new Error(data.error);
          render(data);
        })
        .catch(function () {
          wrap.textContent = '';
          wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'That link is not valid any more. Ask the sender for a new one.' }));
        });
    }

    function render(data) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Everyone who emails you' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: data.email }));

      var live = (data.senders || []).filter(function (s) { return s.status === 'subscribed'; });
      wrap.appendChild(MR.h('p', null,
        live.length === 1
          ? 'One sender on AMI Mailroom has your address.'
          : live.length + ' senders on AMI Mailroom have your address.',
        ' You can change any of them here, or stop all of it at once.'));

      if (!(data.senders || []).length) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'Nobody on the platform is mailing this address.' }));
        return;
      }

      var list = MR.h('div', { id: 'mr-hub-senders' });
      data.senders.forEach(function (s) { list.appendChild(senderCard(s)); });
      wrap.appendChild(list);

      if (live.length) {
        wrap.appendChild(MR.h('div', { class: 'mr-aside', id: 'mr-hub-all' },
          MR.h('h2', { class: 'dr-h', text: 'Stop everything' }),
          MR.h('p', { class: 'dr-small', text: 'Unsubscribes you from every sender above, and adds you to the do-not-mail list so nobody on the platform can add you again.' }),
          MR.h('button', {
            class: 'dr-button dr-button--danger', id: 'mr-hub-stop', type: 'button',
            onclick: function () {
              // This also adds the address to the do-not-mail list, so it is the
              // harder of the two to take back.
              if (!confirm('This stops every sender who uses AMI Mailroom from emailing you, and none of them can add you again. Continue?')) return;
              apply({ token: token, hub: true, unsubscribe: true },
                    'You will not hear from any sender on AMI Mailroom again.');
            }
          }, 'Stop all email from every sender')));
      }
    }

    function senderCard(s) {
      var box = MR.h('div', { class: 'dr-status-card' });
      box.appendChild(MR.h('h2', { class: 'dr-h', text: s.sender_name }));
      box.appendChild(MR.h('p', { class: 'dr-small', text: s.list_name }));

      if (s.status !== 'subscribed') {
        box.appendChild(MR.h('p', { class: 'dr-small', text: 'You are not receiving these.' }));
        return box;
      }

      var sel = MR.h('select', { class: 'dr-input dr-input--w', id: 'hub-freq-' + s.account_id });
      [['all', 'Everything they send'], ['weekly', 'A weekly summary at most'],
       ['monthly', 'A monthly summary at most']].forEach(function (o) {
        var opt = MR.h('option', { value: o[0], text: o[1] });
        if (s.frequency === o[0]) opt.selected = true;
        sel.appendChild(opt);
      });
      box.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'hub-freq-' + s.account_id, text: 'How often' }), sel));

      box.appendChild(MR.h('p', null,
        MR.h('button', {
          class: 'dr-button dr-button--secondary', type: 'button',
          onclick: function () {
            apply({ token: token, hub: true, account_id: s.account_id, frequency: sel.value },
                  'Saved.');
          }
        }, 'Save'),
        ' ',
        MR.h('button', {
          class: 'dr-button dr-button--secondary', type: 'button',
          onclick: function () {
            apply({ token: token, hub: true, account_id: s.account_id, unsubscribe: true },
                  'You will not hear from ' + s.sender_name + ' again.');
          }
        }, 'Stop these')));
      return box;
    }

    function apply(body, message) {
      if (MR.cfg.demo) { MR.banner(wrap, 'Preview only', 'Nothing was changed.'); return; }
      fn('mailroom-unsubscribe', body).then(function () {
        MR.announce(message);
        load();
      }).catch(function (err) {
        MR.banner(wrap, 'That did not work', 'Please try again in a moment.', 'important');
        console.error(err);
      });
    }
  }

  /* ---------------- unsubscribe confirmation ---------------- */
  function initUnsubscribe() {
    var wrap = document.getElementById('mr-unsubscribe');
    if (!wrap) return;
    var token = MR.qs('token');
    var done = MR.qs('done');

    // What a reader sees once the unsubscribe has happened. One way onward:
    // undo a mistaken click. It needs the token, so a page reached without
    // one offers nothing.
    function showDone() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'You have been unsubscribed' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'You will not receive any more campaigns from this sender.' }));
      if (!token && !MR.cfg.demo) return;
      var undo = MR.h('div', { class: 'mr-aside', id: 'mr-resubscribe' },
        MR.h('h2', { class: 'dr-h', text: 'Unsubscribed by mistake?' }),
        MR.h('p', { class: 'dr-small', text: 'You can start receiving this sender\u2019s email again.' }));
      var msg = MR.h('p', { class: 'dr-small', role: 'status' });
      var btn = MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary', text: 'Subscribe me again',
        onclick: function () {
          if (MR.cfg.demo) { msg.textContent = 'Preview only: nothing was changed.'; return; }
          btn.disabled = true;
          fn('mailroom-unsubscribe', { token: token, resubscribe: true }).then(function () {
            undo.textContent = '';
            undo.appendChild(MR.h('h2', { class: 'dr-h', text: 'You are subscribed again' }));
            undo.appendChild(MR.h('p', { class: 'dr-small', role: 'status', text: 'You will receive this sender\u2019s email again.' }));
          }).catch(function () {
            btn.disabled = false;
            msg.textContent = 'That did not work. If you stopped all email from AMI Mailroom, the sender has to add you again. Otherwise try again, or reply to the email you received.';
          });
        }
      });
      undo.appendChild(MR.h('p', null, btn));
      undo.appendChild(msg);
      wrap.appendChild(undo);
    }

    if (done || MR.cfg.demo) { showDone(); return; }
    if (!token) {
      // A test email has no subscriber behind it, so its link carries no token.
      // Say so, rather than leaving "Working…" on the page.
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'This link has no reader attached' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'If this came from a test email, that is expected. A test is not sent to a subscriber, so there is nobody to unsubscribe. Each reader of a real send gets a personal link.' }));
      wrap.appendChild(MR.h('p', { text: 'If you reached this page from a real email and want to stop receiving it, reply to that email and ask to be removed.' }));
      return;
    }

    fn('mailroom-unsubscribe', { token: token, unsubscribe: true }).then(showDone).catch(function () {
      wrap.textContent = '';
      wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'That link is not valid any more. If you are still receiving email, reply to it and ask to be removed.' }));
    });
  }

  /* ---------------- archive ---------------- */
  function initArchive() {
    var wrap = document.getElementById('mr-archive');
    if (!wrap) return;
    var p = MR.cfg.demo
      ? Promise.resolve(MR.sampleArchive)
      : MR.api.select('mailroom_archive?select=ref,subject,sender_name,sent_at&order=sent_at.desc&limit=50');

    p.then(function (rows) {
      wrap.textContent = '';
      if (!rows || !rows.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'Nothing has been published yet.' }));
        return;
      }
      var ul = MR.h('ul', { class: 'dr-list dr-list--plain' });
      rows.forEach(function (c) {
        ul.appendChild(MR.h('li', null,
          MR.h('a', { href: 'campaign-view.html?ref=' + encodeURIComponent(c.ref), text: c.subject }),
          MR.h('br'),
          MR.h('span', { class: 'dr-small', text: c.sender_name + ' · ' + MR.date(c.sent_at) })));
      });
      wrap.appendChild(ul);
    }).catch(function (err) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'The archive could not be loaded.' }));
      console.error(err);
    });
  }

  /* ---------------- one archived campaign ---------------- */
  function initArchiveItem() {
    var wrap = document.getElementById('mr-campaign-view');
    if (!wrap) return;
    var ref = MR.qs('ref');
    var p = MR.cfg.demo
      ? Promise.resolve([{ ref: ref, subject: 'Sample: March trade briefing', sender_name: 'Sample Member Ltd',
          sent_at: new Date().toISOString(), body_blocks: [
            { type: 'heading', text: 'Sample heading' },
            { type: 'text', text: 'This is how an archived campaign appears on the web.' }] }])
      : MR.api.select('mailroom_archive?select=*&ref=eq.' + encodeURIComponent(ref));

    p.then(function (rows) {
      var c = rows && rows[0];
      wrap.textContent = '';
      if (!c) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'That campaign is not in the archive.' }));
        return;
      }
      document.title = c.subject + ' – AMI Mailroom';
      wrap.appendChild(MR.h('h1', { text: c.subject }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: c.sender_name + ' · ' + MR.date(c.sent_at) }));
      wrap.appendChild(emailFrame(c, { name: c.sender_name, postal_address: '' }, null));
    }).catch(function (err) {
      // An archived campaign is a public page, reached from a link somebody
      // was given. Leaving "Loading…" on it tells the reader nothing and
      // gives them nowhere to go.
      wrap.textContent = '';
      wrap.appendChild(MR.h('p', { class: 'dr-empty' },
        'That campaign could not be loaded just now. ',
        MR.h('a', { href: 'archive.html', text: 'See the archive' })));
      console.error(err);
    });
  }

  /* ---------------- a shared draft ----------------
     The link is the only key. It shows the campaign exactly as it would
     arrive, so a colleague can sign it off without a Mailroom account. */
  function initSharedPreview() {
    var wrap = document.getElementById('mr-shared');
    if (!wrap) return;
    var token = MR.qs('t');

    if (MR.cfg.demo) {
      show({
        subject: 'Sample: April market outlook', preheader: 'A shared draft',
        font_family: 'sans', status: 'draft', account_name: 'Sample Member Ltd',
        postal_address: '12 Example Road, London, EC1A 1AA, United Kingdom',
        body_blocks: [
          { type: 'heading', text: 'A shared draft' },
          { type: 'text', text: 'This is what the sender sees, and what would arrive.' }
        ]
      });
      return;
    }
    if (!token) { missing(); return; }

    MR.api.select('mailroom_shared_campaign?select=*&share_token=eq.' + encodeURIComponent(token))
      .then(function (rows) {
        var c = rows && rows[0];
        if (!c) { missing(); return; }
        show(c);
      }).catch(function () { missing(); });

    function missing() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'That link does not work' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'The draft may have been sent already, or the sender may have stopped sharing it. Ask them for a new link.' }));
    }

    function show(c) {
      document.title = c.subject + ' – AMI Mailroom';
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: c.subject }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead' },
        'A draft from ' + (c.account_name || '') + '. ',
        c.status === 'sent' ? 'It has been sent.' : 'It has not been sent yet.'));
      wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'Anyone with this link can read it. Comments go to whoever sent it to you, not to ABTA.' }));
      wrap.appendChild(emailFrame(c, { name: c.account_name, postal_address: c.postal_address }, {
        logo_url: c.logo_url, logo_alt: c.logo_alt, logo_width: c.logo_width,
        accent_colour: c.accent_colour, button_colour: c.button_colour,
        button_text: c.button_text, footer_note: c.footer_note, footer_credit: c.footer_credit,
        social_links: c.social_links
      }));
    }
  }

  // The campaign, rendered by the same code that builds the email, inside a
  // frame so its styles cannot touch the page around it.
  function emailFrame(campaign, account, brand) {
    var frame = MR.h('iframe', {
      class: 'mr-shared__frame', title: 'The campaign', loading: 'lazy'
    });
    var html = MR.renderEmail
      ? MR.renderEmail(campaign, account, { brand: brand, noPlaceholders: true })
      : '<p>The preview could not be built.</p>';
    frame.setAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox');
    frame.srcdoc = html;
    return frame;
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHub();
    initUnsubscribe();
    initArchive();
    initArchiveItem();
    initSharedPreview();
  });
})();
