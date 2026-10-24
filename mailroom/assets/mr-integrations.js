/* ==========================================================================
   AMI Mailroom – integrations

   Two directions, one page.

   IN   Another tool (Zapier, Make, Pabbly, a form builder, a shop) adds a
        contact to a list. It identifies itself with an API key. Only a hash
        of the key is stored, so the full key is shown once, here, when it is
        made.

   OUT  Mailroom tells another tool when somebody subscribes, unsubscribes,
        bounces or complains, by posting to a web address the member gives.
        Each message is signed, so the receiver can check it came from here.

   The work is done by the mailroom-integrations function. This page only
   manages the keys and addresses.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.requireAccount) return;

  var EVENTS = [
    ['subscribed', 'Someone subscribes'],
    ['unsubscribed', 'Someone unsubscribes'],
    ['bounced', 'An address bounces'],
    ['complained', 'Someone reports an email as spam']
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-integrations');
    if (!wrap) return;

    var account = null, keys = [], hooks = [], lists = [], newKey = null;

    if (MR.cfg.demo) {
      account = MR.sampleAccount;
      keys = [{ id: 'k1', name: 'Zapier', key_prefix: 'mr_3f9a…', last_used_at: new Date(Date.now() - 36e5).toISOString() }];
      hooks = [{ id: 'h1', name: 'Zapier new subscribers', url: 'https://hooks.zapier.com/hooks/catch/000000/sample/',
                 events: ['subscribed', 'unsubscribed'], secret: 'sample-secret', is_active: true,
                 last_attempt_at: new Date(Date.now() - 9e5).toISOString(), last_status: 200 }];
      lists = (MR.sampleLists || []).slice();
      render();
      return;
    }

    MR.requireAccount(wrap).then(function (a) {
      account = a;
      return load();
    }).then(render).catch(function (err) { return MR.loadFailed(wrap, err); });

    function load() {
      return Promise.all([
        MR.api.select('mailroom_api_keys?select=id,name,key_prefix,created_at,last_used_at&order=created_at.desc'),
        MR.api.select('mailroom_webhooks?select=*&order=created_at.desc'),
        MR.api.select('mailroom_lists?select=id,name&order=name.asc')
      ]).then(function (r) { keys = r[0] || []; hooks = r[1] || []; lists = r[2] || []; });
    }

    function reload() { return load().then(render); }

    function say(msg, bad) {
      var el = document.getElementById('mr-int-status');
      if (!el) return;
      el.textContent = msg || '';
      el.className = 'dr-small mr-int-status' + (bad ? ' mr-int-status--bad' : '');
    }

    // The database writes its own plain sentences for a few refusals.
    function words(err, fallback) {
      var msg = String((err && err.message) || '');
      if (/^(You can have up to|Give the key|You cannot make)/.test(msg)) return msg;
      return MR.friendlyError(err, fallback);
    }

    function when(iso) {
      if (!iso) return 'never';
      try { return MR.formatWhen ? MR.formatWhen(iso) : new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
      catch (e) { return String(iso); }
    }

    function copyButton(getText, label) {
      var b = MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary mr-copy', text: label || 'Copy' });
      b.addEventListener('click', function () {
        var t = getText();
        function done() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = label || 'Copy'; }, 2000); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { say('Select the text and copy it yourself.', true); });
        else say('Select the text and copy it yourself.', true);
      });
      return b;
    }

    function codeBox(id, label, text, rows) {
      var area = MR.h('textarea', { class: 'dr-textarea mr-code', id: id, readonly: true, rows: String(rows || 3), spellcheck: 'false' });
      area.value = text;
      area.addEventListener('focus', function () { area.select(); });
      return MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: id, text: label }), area,
        MR.h('p', null, copyButton(function () { return area.value; })));
    }

    function render() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Integrations' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead' },
        'Connect your mailroom to the other tools you use. Zapier, Make and Pabbly link to thousands of them, including Shopify, Typeform, Instagram, Canva and Squarespace.'));
      wrap.appendChild(MR.h('p', { id: 'mr-int-status', class: 'dr-small mr-int-status', role: 'status' }));

      wrap.appendChild(inSection());
      wrap.appendChild(outSection());
      wrap.appendChild(otherSection());
      wrap.appendChild(MR.h('p', null,
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'account.html', text: 'Back to your mailroom' })));
    }

    /* ---------------- IN: API keys ---------------- */
    function inSection() {
      var s = MR.h('section', { class: 'mr-int', 'aria-labelledby': 'mr-int-in' });
      s.appendChild(MR.h('h2', { class: 'dr-h', id: 'mr-int-in', text: 'Add contacts from another tool' }));
      s.appendChild(MR.h('p', { class: 'dr-small' },
        'Give the tool a key. Each time something happens there, such as a purchase or a form entry, it adds that person to the list you choose. You are confirming that each person has agreed to hear from you. Anyone who has unsubscribed is never added back.'));

      if (newKey) {
        s.appendChild(MR.h('div', { class: 'mr-newkey', role: 'alert' },
          MR.h('h3', { class: 'dr-h', text: 'Your new key' }),
          MR.h('p', { class: 'dr-small', text: 'Copy it now. For your security it is shown once and cannot be shown again. If you lose it, delete it and make another.' }),
          codeBox('mr-newkey-text', 'Key', newKey, 2)));
      }

      if (keys.length) {
        var tbl = MR.h('table', { class: 'dr-table mr-int-table' },
          MR.h('caption', { class: 'dr-visually-hidden', text: 'Your keys' }),
          MR.h('thead', null, MR.h('tr', null,
            MR.h('th', { scope: 'col', text: 'Name' }), MR.h('th', { scope: 'col', text: 'Starts with' }),
            MR.h('th', { scope: 'col', text: 'Last used' }), MR.h('th', { scope: 'col' }, MR.h('span', { class: 'dr-visually-hidden', text: 'Action' })))));
        var tb = MR.h('tbody');
        keys.forEach(function (k) {
          tb.appendChild(MR.h('tr', null,
            MR.h('td', { text: k.name }), MR.h('td', null, MR.h('code', { text: k.key_prefix })),
            MR.h('td', { text: when(k.last_used_at) }),
            MR.h('td', null, MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', 'aria-label': 'Delete the key called ' + k.name, text: 'Delete',
              onclick: function () { removeKey(k); } }))));
        });
        tbl.appendChild(tb);
        s.appendChild(tbl);
      } else {
        s.appendChild(MR.h('p', { class: 'dr-empty', text: 'You have no keys yet.' }));
      }

      var name = MR.h('input', { class: 'dr-input', id: 'mr-key-name', type: 'text', maxlength: '80', placeholder: 'For example, Zapier', autocomplete: 'off' });
      s.appendChild(MR.h('form', { class: 'mr-int-form', onsubmit: function (e) { e.preventDefault(); makeKey(name); } },
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'mr-key-name', text: 'Name the key after the tool that will use it' }), name),
        MR.h('button', { type: 'submit', class: 'dr-button', text: 'Make a key' })));

      var endpoint = MR.cfg.url + '/functions/v1/mailroom-integrations?action=contact';
      var det = MR.h('details', { class: 'mr-int-how' },
        MR.h('summary', { text: 'How to set it up in Zapier, Make or Pabbly' }),
        MR.h('ol', null,
          MR.h('li', { text: 'Choose the step that sends a web request. It is called “Webhooks by Zapier” in Zapier, “HTTP” in Make and “API by Pabbly” in Pabbly.' }),
          MR.h('li', { text: 'Set the method to POST and paste the address below.' }),
          MR.h('li', { text: 'Add a header called Authorization with the value Bearer, a space, then your key.' }),
          MR.h('li', { text: 'Send the body as JSON, with the fields below, filled from the earlier step. Only email and the list are needed.' })),
        codeBox('mr-int-endpoint', 'Address', endpoint, 2),
        codeBox('mr-int-body', 'Body',
          '{\n  "email": "person@example.com",\n  "list": "' + (lists[0] ? lists[0].name : 'Your list name') + '",\n  "full_name": "Optional",\n  "organisation": "Optional",\n  "country": "Optional"\n}', 7),
        MR.h('p', { class: 'dr-small' }, 'To use a list’s code instead of its name, send "list_id". The answer says "added", "exists" or "not_added". "not_added" means the person is on a stop list and was left off.'));
      if (lists.length) {
        var lt = MR.h('table', { class: 'dr-table' },
          MR.h('thead', null, MR.h('tr', null, MR.h('th', { scope: 'col', text: 'List' }), MR.h('th', { scope: 'col', text: 'list_id' }))));
        var lb = MR.h('tbody');
        lists.forEach(function (l) { lb.appendChild(MR.h('tr', null, MR.h('td', { text: l.name }), MR.h('td', null, MR.h('code', { text: l.id })))); });
        lt.appendChild(lb); det.appendChild(lt);
      }
      s.appendChild(det);
      return s;
    }

    function makeKey(input) {
      var n = input.value.trim();
      if (!n) { say('Name the key first, for example “Zapier”.', true); input.focus(); return; }
      if (MR.cfg.demo) { newKey = 'mr_sample0000000000000000000000000000000000000000'; keys.push({ id: 'k' + keys.length, name: n, key_prefix: 'mr_sample…' }); render(); return; }
      say('Making the key…');
      MR.rpc('mailroom_create_api_key', { acct: account.id, key_name: n }).then(function (raw) {
        newKey = raw;
        return reload();
      }).then(function () {
        say('Key made. Copy it now: it will not be shown again.');
        var box = document.getElementById('mr-newkey-text'); if (box) box.focus();
      }).catch(function (err) { say(words(err, 'The key could not be made. Try again.'), true); });
    }

    function removeKey(k) {
      if (!window.confirm('Delete the key called “' + k.name + '”? Anything using it will stop being able to add contacts.')) return;
      if (MR.cfg.demo) { keys = keys.filter(function (x) { return x.id !== k.id; }); render(); return; }
      MR.api.remove('mailroom_api_keys', 'id=eq.' + encodeURIComponent(k.id))
        .then(function () { newKey = null; return reload(); })
        .then(function () { say('Key deleted.'); })
        .catch(function (err) { say(words(err, 'The key could not be deleted. Try again.'), true); });
    }

    /* ---------------- OUT: webhooks ---------------- */
    function outSection() {
      var s = MR.h('section', { class: 'mr-int', 'aria-labelledby': 'mr-int-out' });
      s.appendChild(MR.h('h2', { class: 'dr-h', id: 'mr-int-out', text: 'Tell another tool when something happens' }));
      s.appendChild(MR.h('p', { class: 'dr-small' },
        'Give us a web address and we will send it a short message each time one of the events you choose happens. In Zapier use “Catch Hook”, in Make “Custom webhook” and in Pabbly “Webhook”. Each tool gives you the address.'));

      hooks.forEach(function (h) { s.appendChild(hookCard(h)); });
      if (!hooks.length) s.appendChild(MR.h('p', { class: 'dr-empty', text: 'No addresses yet.' }));

      var name = MR.h('input', { class: 'dr-input', id: 'mr-hook-name', type: 'text', maxlength: '80', placeholder: 'For example, New subscribers to Zapier' });
      var url = MR.h('input', { class: 'dr-input', id: 'mr-hook-url', type: 'url', maxlength: '500', placeholder: 'https://', autocomplete: 'off' });
      var boxes = EVENTS.map(function (ev, i) {
        return MR.h('div', { class: 'dr-choice' },
          MR.h('input', { class: 'dr-choice__input', id: 'mr-hook-ev-' + i, type: 'checkbox', value: ev[0], checked: i < 2 }),
          MR.h('label', { class: 'dr-choice__label', for: 'mr-hook-ev-' + i, text: ev[1] }));
      });
      var form = MR.h('form', { class: 'mr-int-form', id: 'mr-hook-form', novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        var chosen = boxes.map(function (b) { return b.querySelector('input'); }).filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
        addHook(name.value.trim(), url.value.trim(), chosen, url);
      } },
        MR.h('h3', { class: 'dr-h', text: 'Add an address' }),
        MR.h('div', { class: 'dr-form-group' }, MR.h('label', { class: 'dr-label', for: 'mr-hook-name', text: 'Name (optional)' }), name),
        MR.h('div', { class: 'dr-form-group' }, MR.h('label', { class: 'dr-label', for: 'mr-hook-url', text: 'Web address' }),
          MR.h('span', { class: 'dr-hint', text: 'Must start with https://' }), url),
        MR.h('fieldset', { class: 'dr-form-group' }, MR.h('legend', { class: 'dr-label', text: 'Send a message when' }),
          MR.h('div', { class: 'dr-choices' }, boxes)),
        MR.h('button', { type: 'submit', class: 'dr-button', text: 'Add address' }));
      s.appendChild(form);

      s.appendChild(MR.h('details', { class: 'mr-int-how' },
        MR.h('summary', { text: 'What the message looks like' }),
        codeBox('mr-int-sample', 'Example', JSON.stringify({
          event: 'subscribed', occurred_at: '2026-10-24T09:30:00Z', list_id: '…', list_name: 'Newsletter',
          email: 'person@example.com', full_name: 'Pat Jones', organisation: null, country: 'Ghana', topics: [], status: 'subscribed'
        }, null, 2), 13),
        MR.h('p', { class: 'dr-small' }, 'Every message carries a header called X-Mailroom-Signature, “sha256=” followed by an HMAC-SHA256 of the body made with the address’s secret. Zapier, Make and Pabbly do not need it. If you build your own receiver, use it to check the message came from here. If your address is down, we try again for up to a day.')));
      return s;
    }

    function hookCard(h) {
      var card = MR.h('div', { class: 'dr-status-card' },
        MR.h('h3', { class: 'dr-h', text: h.name || 'Webhook' }),
        MR.h('p', { class: 'dr-small' }, MR.h('code', { text: h.url })),
        MR.h('p', { class: 'dr-small', text: 'Sends a message when: ' + (h.events || []).map(function (e) {
          var f = EVENTS.filter(function (x) { return x[0] === e; })[0]; return f ? f[1].toLowerCase() : e; }).join('; ') + '.' }),
        MR.h('p', { class: 'dr-small', text: h.last_attempt_at
          ? 'Last attempt ' + when(h.last_attempt_at) + ': ' + (h.last_status >= 200 && h.last_status < 300 ? 'received' : 'not received (' + (h.last_status ? 'the address answered ' + h.last_status : 'no answer') + ')')
          : 'Nothing sent yet.' }));
      if (!h.is_active) card.appendChild(MR.h('p', { class: 'dr-small', text: 'Switched off. Nothing is sent to it.' }));

      var secret = MR.h('p', { class: 'dr-small', hidden: true }, 'Secret: ', MR.h('code', { text: h.secret }));
      card.appendChild(secret);
      card.appendChild(MR.h('p', { class: 'dr-button-group' },
        MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Send a test', 'aria-label': 'Send a test message to ' + (h.name || h.url), onclick: function () { test(h); } }),
        MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: h.is_active ? 'Switch off' : 'Switch on', onclick: function () { toggle(h); } }),
        MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Show secret', 'aria-expanded': 'false', onclick: function (e) {
          secret.hidden = !secret.hidden; e.target.textContent = secret.hidden ? 'Show secret' : 'Hide secret'; e.target.setAttribute('aria-expanded', String(!secret.hidden)); } }),
        MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Delete', 'aria-label': 'Delete ' + (h.name || h.url), onclick: function () { removeHook(h); } })));
      return card;
    }

    function addHook(name, url, events, input) {
      if (!/^https:\/\/[^\s/]+\.[^\s/]+/.test(url)) { say('Enter a web address that starts with https://', true); input.focus(); return; }
      if (!events.length) { say('Choose at least one thing to be told about.', true); return; }
      if (MR.cfg.demo) { hooks.push({ id: 'h' + hooks.length, name: name || 'Webhook', url: url, events: events, secret: 'sample-secret', is_active: true }); render(); return; }
      say('Adding…');
      MR.api.insert('mailroom_webhooks', { account_id: account.id, name: name || 'Webhook', url: url, events: events })
        .then(reload).then(function () { say('Address added. Use “Send a test” to check it works.'); })
        .catch(function (err) { say(words(err, 'The address could not be added. Check it and try again.'), true); });
    }

    function toggle(h) {
      if (MR.cfg.demo) { h.is_active = !h.is_active; render(); return; }
      MR.api.update('mailroom_webhooks', 'id=eq.' + encodeURIComponent(h.id), { is_active: !h.is_active })
        .then(reload).catch(function (err) { say(words(err, 'That could not be changed. Try again.'), true); });
    }

    function removeHook(h) {
      if (!window.confirm('Delete this address? Messages waiting to be sent to it are dropped.')) return;
      if (MR.cfg.demo) { hooks = hooks.filter(function (x) { return x.id !== h.id; }); render(); return; }
      MR.api.remove('mailroom_webhooks', 'id=eq.' + encodeURIComponent(h.id))
        .then(reload).then(function () { say('Address deleted.'); })
        .catch(function (err) { say(words(err, 'The address could not be deleted. Try again.'), true); });
    }

    function test(h) {
      if (MR.cfg.demo) { say('Preview only: nothing is sent.'); return; }
      say('Sending a test…');
      MR.fn('mailroom-integrations?action=test', { webhook_id: h.id }).then(function (r) {
        return reload().then(function () {
          say(r.ok ? 'The test was received.' : 'The test was not received. ' + (r.status ? 'The address answered ' + r.status + '.' : 'There was no answer.') + ' Check the address.', !r.ok);
        });
      }).catch(function (err) { say(words(err, 'The test could not be sent. Try again.'), true); });
    }

    /* ---------------- everything else ---------------- */
    function otherSection() {
      var s = MR.h('section', { class: 'mr-int', 'aria-labelledby': 'mr-int-other' });
      s.appendChild(MR.h('h2', { class: 'dr-h', id: 'mr-int-other', text: 'Already built in' }));
      s.appendChild(MR.h('ul', { class: 'dr-list' },
        MR.h('li', null, MR.h('strong', { text: 'Signup forms for your website. ' }), 'Put a form on Wix, Squarespace, WordPress or any page. ',
          MR.h('a', { href: 'forms.html', text: 'Signup forms' })),
        MR.h('li', null, MR.h('strong', { text: 'Photos and GIFs. ' }), 'Search free pictures from the image button in the editor, so you can see your message with a real picture in it.'),
        MR.h('li', null, MR.h('strong', { text: 'Import. ' }), 'Bring a list in from a spreadsheet or another email service. ',
          MR.h('a', { href: 'import.html', text: 'Import subscribers' }))));
      return s;
    }
  });
})();
