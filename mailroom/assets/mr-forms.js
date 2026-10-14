/* ==========================================================================
   AMI Mailroom – signup forms, and the welcome email

   A form writes into one list. The wording a visitor agrees to lives on the
   form and is copied onto every subscriber it creates, so editing the form
   later never rewrites the evidence for people who already signed up.

   The welcome email is an ordinary campaign with kind = 'welcome'. It sits in
   'sending' permanently and gains one recipient at a time, which is why it
   reuses the renderer, the queue and the statistics instead of needing a
   second sending path.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.requireAccount) return;   // mr-account.js supplies requireAccount

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-forms');
    if (!wrap) return;

    var account = null, forms = [], lists = [], welcomes = [];

    if (MR.cfg.demo) {
      account = MR.sampleAccount;
      forms = (MR.sampleForms || []).slice();
      lists = (MR.sampleLists || []).slice();
      welcomes = (MR.sampleWelcomes || []).slice();
      render();
      return;
    }

    MR.requireAccount(wrap).then(function (a) {
      account = a;
      return Promise.all([
        MR.api.select('mailroom_forms?select=*&order=created_at.desc'),
        MR.api.select('mailroom_lists?select=id,name'),
        MR.api.select('mailroom_campaigns?select=id,list_id,subject&kind=eq.welcome')
      ]);
    }).then(function (r) {
      forms = r[0] || []; lists = r[1] || []; welcomes = r[2] || [];
      render();
    }).catch(function (err) {
      return MR.loadFailed(wrap, err);
    });

    function listName(id) {
      var l = lists.filter(function (x) { return x.id === id; })[0];
      return l ? l.name : 'a list that has been deleted';
    }

    function render() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Signup forms' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead' },
        'A form people fill in on your own website, or on a page we host for you. Whoever signs up is added to the list you choose, with the wording they agreed to and the date recorded against them.'));

      if (!lists.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty' },
          'Make a list first, then come back. ',
          MR.h('a', { href: 'lists.html', text: 'Your lists' })));
        return;
      }

      if (!forms.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty', id: 'mr-forms-empty',
          text: 'You have no signup forms yet. The one below takes a minute to set up.' }));
      }

      forms.forEach(function (f) { wrap.appendChild(card(f)); });
      wrap.appendChild(addForm());
      wrap.appendChild(MR.h('p', null,
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'account.html', text: 'Back to your mailroom' })));
    }

    function card(f) {
      // The form is linked from the member's own site, so it needs an absolute
      // address rather than a relative one.
      var url = new URL('subscribe.html?f=' + encodeURIComponent(f.slug),
                        window.location.href).href;
      var box = MR.h('div', { class: 'dr-status-card' },
        MR.h('h2', { class: 'dr-h', text: f.name }),
        MR.h('p', { class: 'dr-small' }, 'Adds people to ', MR.h('strong', { text: listName(f.list_id) }),
          '. ', String(f.submissions), f.submissions === 1 ? ' person has' : ' people have', ' signed up.'));

      if (!f.is_active) {
        box.appendChild(MR.h('p', { class: 'dr-small', text: 'Switched off. Nobody can sign up through it.' }));
      }

      box.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', text: 'Send people to this address' }),
        MR.h('input', { class: 'dr-input', readonly: true, value: url,
                        id: 'form-url-' + f.id, onclick: function (e) { e.target.select(); } })));

      box.appendChild(MR.h('p', { class: 'dr-small', text: 'What they agree to: ' + f.consent_wording }));

      var welcome = welcomes.filter(function (w) { return w.list_id === f.list_id; })[0];
      box.appendChild(MR.h('p', { class: 'dr-small' },
        welcome
          ? 'A welcome email goes out when somebody signs up.'
          : 'No welcome email on this list yet. ',
        welcome
          ? MR.h('a', { href: 'campaign.html?id=' + welcome.id, text: 'Edit it' })
          : MR.h('a', { href: 'campaign.html?welcome=' + f.list_id, text: 'Write one' })));

      box.appendChild(MR.h('p', null,
        MR.h('button', {
          class: 'dr-button dr-button--secondary', type: 'button',
          onclick: function () { toggle(f); }
        }, f.is_active ? 'Switch it off' : 'Switch it back on')));
      return box;
    }

    function addForm() {
      var el = MR.h('form', { id: 'mr-form-new', novalidate: true });
      el.appendChild(MR.h('h2', { text: 'Add a form' }));

      el.appendChild(group('f-name', 'What is it for?', 'Website footer'));

      var sel = MR.h('select', { class: 'dr-input dr-input--w', id: 'f-list' });
      lists.forEach(function (l) { sel.appendChild(MR.h('option', { value: l.id, text: l.name })); });
      el.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'f-list', text: 'Which list do they join?' }), sel));

      el.appendChild(group('f-headline', 'Heading on the page', 'Milling prices, every Tuesday'));

      var consent = MR.h('textarea', { class: 'dr-input', id: 'f-consent', rows: '3' });
      el.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'f-consent', text: 'What are they agreeing to?' }),
        consent,
        MR.h('span', { class: 'dr-hint', text: 'Shown above the button, and recorded against everyone who signs up. Write it as they would read it: "Yes, send me price updates by email. I can unsubscribe at any time."' })));

      el.appendChild(MR.h('button', { class: 'dr-button', type: 'submit' }, 'Add the form'));

      el.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('f-name').value.trim();
        var wording = consent.value.trim();
        var errors = [];
        if (name.length < 2) errors.push({ id: 'f-name', message: 'Give it a name you will recognise later' });
        if (wording.length < 10) errors.push({ id: 'f-consent', message: 'Write what they are agreeing to, in a full sentence' });
        if (MR.errors.show(el, errors)) return;

        if (MR.cfg.demo) {
          MR.banner(wrap, 'Preview only', 'On the live service the form would be ready to use now.');
          return;
        }

        var button = el.querySelector('button[type=submit]');
        button.disabled = true;
        button.textContent = 'Adding…';

        MR.api.insert('mailroom_forms', {
          account_id: account.id,
          list_id: sel.value,
          name: name,
          slug: slugify(name),
          headline: document.getElementById('f-headline').value.trim() || null,
          consent_wording: wording
        }).then(function (rows) {
          forms.unshift(rows[0]);
          render();
          MR.announce('Form added.');
        }).catch(function (err) {
          button.disabled = false;
          button.textContent = 'Add the form';
          MR.errors.show(el, [{
            id: 'f-name',
            message: /duplicate|unique/i.test(err.message)
              ? 'A form with a very similar name already exists. Try a different one.'
              : 'That could not be saved. Check the details and try again.'
          }]);
        });
      });
      return el;
    }

    // The slug is public and unique across the whole platform, so a member's
    // own name for the form is not enough on its own.
    function slugify(name) {
      var base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '').slice(0, 40);
      if (base.length < 3) base = 'form';
      return base + '-' + Math.random().toString(36).slice(2, 8);
    }

    function toggle(f) {
      if (MR.cfg.demo) { MR.banner(wrap, 'Preview only', 'Nothing was changed.'); return; }
      MR.api.update('mailroom_forms', 'id=eq.' + f.id, { is_active: !f.is_active })
        .then(function () { f.is_active = !f.is_active; render(); })
        .catch(function (err) { console.error(err); });
    }

    function group(id, label, placeholder) {
      return MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: id, text: label }),
        MR.h('input', { class: 'dr-input', id: id, type: 'text', placeholder: placeholder }));
    }
  });
})();
