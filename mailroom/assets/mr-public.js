/* ==========================================================================
   AMI Mailroom – reader-facing pages
     preferences.html?token=   choose topics and frequency, or leave
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

  var TOPICS = [
    { value: 'markets', label: 'Markets and data' },
    { value: 'deals', label: 'Deals and investment' },
    { value: 'policy', label: 'Policy and regulation' },
    { value: 'events', label: 'Events and invitations' },
    { value: 'jobs', label: 'Jobs and hiring' }
  ];

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

  /* ---------------- preference centre ---------------- */
  function initPreferences() {
    var wrap = document.getElementById('mr-preferences');
    if (!wrap) return;
    var token = MR.qs('token');

    if (MR.cfg.demo) { render(MR.sampleSubscriber); return; }
    if (!token) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'Open this page from the link at the bottom of one of our emails.' }));
      return;
    }

    fetch(MR.cfg.url + '/functions/v1/mailroom-unsubscribe?token=' + encodeURIComponent(token) + '&action=get', {
      headers: { apikey: MR.cfg.key }
    }).then(function (r) { return r.json(); })
      .then(function (sub) {
        if (sub.error) throw new Error(sub.error);
        render(sub);
      })
      .catch(function () {
        wrap.textContent = '';
        wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'That link is not valid any more. Ask the sender for a new one.' }));
      });

    function render(sub) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'What you receive' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: sub.email }));
      if (sub.status !== 'subscribed') {
        MR.banner(wrap, 'You are not subscribed', 'You can start again below if you would like to.');
      }

      var form = MR.h('form', { id: 'mr-prefs-form' });
      var chosen = sub.topics || [];
      var fieldset = MR.h('fieldset', { class: 'dr-fieldset' },
        MR.h('legend', { class: 'dr-fieldset__legend dr-fieldset__legend--m', text: 'Topics' }));
      TOPICS.forEach(function (t) {
        var box = MR.h('input', { class: 'dr-choice__input', type: 'checkbox', id: 'topic-' + t.value, checked: chosen.indexOf(t.value) > -1 });
        fieldset.appendChild(MR.h('div', { class: 'dr-choice dr-choice--checkbox' }, box,
          MR.h('label', { class: 'dr-choice__label', for: 'topic-' + t.value, text: t.label })));
      });
      form.appendChild(fieldset);

      var freq = MR.h('select', { class: 'dr-select dr-input--w', id: 'mr-frequency' },
        MR.h('option', { value: 'all', text: 'Everything they send', selected: sub.frequency === 'all' }),
        MR.h('option', { value: 'weekly', text: 'A weekly summary at most', selected: sub.frequency === 'weekly' }),
        MR.h('option', { value: 'monthly', text: 'A monthly summary at most', selected: sub.frequency === 'monthly' }));
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'mr-frequency', text: 'How often' }), freq));

      form.appendChild(MR.h('div', { class: 'dr-button-group' },
        MR.h('button', { class: 'dr-button', type: 'submit', text: 'Save preferences' }),
        MR.h('button', {
          class: 'dr-button dr-button--secondary', type: 'button', text: 'Unsubscribe from this sender',
          onclick: function () { act({ token: token, unsubscribe: true }, 'You will not hear from this sender again.'); }
        })));

      form.appendChild(MR.h('p', { class: 'dr-small' },
        MR.h('a', {
          href: '#', text: 'Stop all email sent through AMI Mailroom',
          onclick: function (e) {
            e.preventDefault();
            if (!confirm('This stops every sender who uses AMI Mailroom from emailing you. Continue?')) return;
            act({ token: token, unsubscribe_all: true }, 'You have been removed from every list on AMI Mailroom.');
          }
        })));

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var topics = TOPICS.filter(function (t) { return document.getElementById('topic-' + t.value).checked; })
          .map(function (t) { return t.value; });
        act({ token: token, topics: topics, frequency: freq.value, resubscribe: sub.status !== 'subscribed' },
          'Saved. Thank you.');
      });

      wrap.appendChild(form);
      wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'Your address is held by the sender, with ABTA as its service provider. You can ask either of us for a copy of what is held or for it to be deleted.' }));
      wrap.appendChild(MR.h('p', null,
        MR.h('a', { id: 'mr-prefs-hub-link', href: 'hub.html?token=' + encodeURIComponent(MR.qs('token') || ''),
                    text: 'See everyone on AMI Mailroom who emails you' })));

      function act(body, message) {
        if (MR.cfg.demo) { MR.banner(wrap, 'Preview only', 'Nothing was changed.'); return; }
        fn('mailroom-unsubscribe', body).then(function () {
          wrap.textContent = '';
          MR.banner(wrap, 'Done', message);
        }).catch(function (err) {
          MR.banner(wrap, 'That did not work', 'Please try the link in the email again.', 'important');
          console.error(err);
        });
      }
    }
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

    if (done || MR.cfg.demo) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'You have been unsubscribed' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'You will not receive any more campaigns from this sender.' }));
      wrap.appendChild(MR.h('p', null, MR.h('a', { class: 'dr-link', href: 'preferences.html?token=' + encodeURIComponent(token), text: 'Change what you receive instead' })));
      return;
    }
    if (!token) return;

    fn('mailroom-unsubscribe', { token: token, unsubscribe: true }).then(function () {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'You have been unsubscribed' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'You will not receive any more campaigns from this sender.' }));
      wrap.appendChild(MR.h('p', null, MR.h('a', { class: 'dr-link', href: 'preferences.html?token=' + encodeURIComponent(token), text: 'Change what you receive instead' })));
    }).catch(function () {
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
      ? MR.renderEmail(campaign, account, { brand: brand })
      : '<p>The preview could not be built.</p>';
    frame.setAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox');
    frame.srcdoc = html;
    return frame;
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPreferences();
    initHub();
    initUnsubscribe();
    initArchive();
    initArchiveItem();
    initSharedPreview();
  });
})();
