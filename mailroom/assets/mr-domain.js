/* ==========================================================================
   AMI Mailroom – sending domains (domain.html)
     Send from your own domain, or from a subdomain ABTA sets up for you.
     Everything that decides whether mail may leave is in the database and
     the mailroom-domain function. This file shows the records to publish
     and asks the provider to look again.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  var STATUS_TEXT = {
    not_started: 'Waiting for the DNS records',
    pending: 'Checking the DNS records',
    verified: 'Verified',
    failed: 'The records could not be read',
    temporary_failure: 'The records could not be read just now'
  };
  var STATUS_TAG = {
    not_started: 'grey', pending: 'yellow', verified: 'green',
    failed: 'red', temporary_failure: 'yellow'
  };

  // An address waits for a click, not for DNS, so it has its own wording.
  function statusText(d) {
    if (d.kind === 'address') {
      return { not_started: 'Waiting for you to confirm', pending: 'Waiting for you to confirm',
        verified: 'Confirmed', failed: 'Not confirmed', temporary_failure: 'Not confirmed yet' }[d.status] || d.status;
    }
    return STATUS_TEXT[d.status] || d.status;
  }

  MR.domainLabel = function (d) {
    if (!d) return 'the AMI Mailroom address';
    return d.from_local + '@' + d.domain;
  };

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-domain');
    if (!wrap) return;

    var account = null;
    var domains = [];

    if (MR.cfg.demo) {
      account = MR.sampleAccount;
      domains = (MR.sampleDomains || []).slice();
      render();
      return;
    }

    MR.requireAccount(wrap).then(function (a) {
      account = a;
      return MR.api.select('mailroom_domains?select=*&order=created_at.asc');
    }).then(function (rows) {
      domains = rows || [];
      render();
      afterLink();
    }).catch(function (err) {
      return MR.loadFailed(wrap, err);
    });

    /* ---------------- page ---------------- */
    function render() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Where your email comes from' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead' },
        'Every campaign leaves from an address. Until you choose one of your own, yours go out from an address we build from your sign-up address, and readers see your organisation name in front of it.'));

      var verified = domains.filter(function (d) { return d.status === 'verified'; });
      // An alias is made for the account, so it does not count as a domain the
      // member chose: the page still invites them to add one of their own.
      var chosen = verified.filter(function (d) { return d.kind !== 'alias'; });
      if (verified.length) {
        wrap.appendChild(MR.h('p', null, 'Campaigns can be sent from ',
          MR.h('strong', { text: verified.map(MR.domainLabel).join(', ') }), '.'));
      }

      wrap.appendChild(MR.h('div', { class: 'mr-aside' },
        MR.h('h2', { class: 'dr-h', text: 'Why it is worth doing' }),
        MR.h('ul', { class: 'dr-list' },
          MR.h('li', { text: 'Readers see your own address, not ABTA’s, which is what most people open.' }),
          MR.h('li', { text: 'Your delivery record is your own. Another sender having a bad month cannot slow you down, and your own mistakes stay with you.' }),
          MR.h('li', { text: 'A suspension lands on the domain, not on your account, so a bad campaign here does not stop you sending from the shared address.' })),
        MR.h('p', { class: 'dr-small', text: 'Neither the Mailroom nor your own domain has a daily cap. A domain nobody has heard of is treated with more suspicion at first, though, so build up over a few sends rather than mailing your whole list from it on day one.' })));

      domains.forEach(function (d) { wrap.appendChild(card(d)); });

      if (!account.allows_own_domain) {
        // The rule is enforced in the database. This is here so the page says
        // so before somebody fills in a form that will be refused.
        wrap.appendChild(upgradePrompt());
        // A free address (Gmail and the like) only changes the alias, so it is
        // open on every plan.
        if (domains.filter(function (d) { return d.kind === 'address'; }).length < 3) wrap.appendChild(addressForm());
      } else {
        if (!chosen.length) wrap.appendChild(movePrompt());
        if (domains.filter(function (d) { return d.kind === 'address'; }).length < 3) wrap.appendChild(addressForm());
        if (domains.filter(function (d) { return d.kind !== 'alias' && d.kind !== 'address'; }).length < 3) wrap.appendChild(addForm());
      }

      wrap.appendChild(MR.h('p', null,
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'account.html', text: 'Back to your mailroom' })));
    }

    /* ---------------- prompts ---------------- */

    // Trial account. Deliberately not framed as a feature being withheld. A
    // trial account has the same alias address as a paid one; only a domain of
    // its own waits for a paid plan.
    function upgradePrompt() {
      return MR.h('div', { class: 'mr-aside', id: 'mr-domain-upgrade' },
        MR.h('h2', { class: 'dr-h', text: 'Sending from your own domain' }),
        MR.h('p', null, 'Your campaigns go out from an address we build from your sign-up address, with your organisation name in front of it. That works, and there is nothing you need to set up.'),
        MR.h('p', null, 'A sending domain of your own comes with ',
          MR.h('strong', { text: 'any paid plan' }),
          ', at no extra charge. It is not an add-on, because a sender on their own domain carries their own delivery record, and that is better for everybody.'),
        MR.h('p', null,
          MR.h('a', { class: 'dr-button', href: 'pricing.html', id: 'mr-domain-upgrade-link',
                      text: 'See the plans' })));
    }

    // Paid plan, still on the shared address. Worth one nudge, not a nag.
    function movePrompt() {
      return MR.h('div', { class: 'mr-aside', id: 'mr-domain-move' },
        MR.h('h2', { class: 'dr-h', text: 'You are still on the shared address' }),
        MR.h('p', null, 'Your plan includes a sending domain of your own and you have not set one up yet. On the shared address your delivery depends partly on how everyone else on it behaves.'),
        MR.h('p', { class: 'dr-small', text: 'ABTA can set up a subdomain for you with nothing for you to publish, or you can use a domain of your own and publish a few DNS records.' }));
    }

    /* ---------------- one domain ---------------- */
    function card(d) {
      var box = MR.h('div', { class: 'mr-aside' });
      box.appendChild(MR.h('h2', { class: 'dr-h' }, d.kind === 'address' ? MR.domainLabel(d) : d.domain, ' ',
        MR.h('span', { class: 'dr-tag dr-tag--' + (STATUS_TAG[d.status] || 'grey'),
          text: statusText(d) })));

      box.appendChild(MR.h('p', null,
        d.kind === 'address' && d.status !== 'verified' ? 'Campaigns can go out as ' : 'Campaigns go out as ',
        MR.h('strong', { text: MR.domainLabel(d) }), d.kind === 'address' && d.status !== 'verified' ? ' once you confirm it.' : '.',
        d.kind === 'abta_subdomain'
          ? ' ABTA publishes the records for this one, so there is nothing for you to do.'
          : d.kind === 'alias'
            ? ' We built this address from your own address, so there is nothing to set up. Replies still go to your own address. Use your own address below to change it, or add a domain to send as the exact address.'
            : d.kind === 'address' && d.status === 'verified'
              ? ' This is the exact address you confirmed. Replies go to your own reply-to address.'
              : ''));

      if (d.sending_status === 'suspended') {
        box.appendChild(MR.h('p', { class: 'dr-error-message',
          text: 'Sending from this domain is suspended. ' + (d.suspension_reason || '') }));
      }

      if (d.status === 'verified') {
        box.appendChild(MR.h('p', { class: 'dr-small',
          text: MR.number(d.clean_campaigns || 0) + ' clean campaign' +
                ((d.clean_campaigns || 0) === 1 ? '' : 's') + ' from this domain. ' +
                'There is no daily limit. Complaints and bounces are what stop a domain sending.' }));
        if (d.kind === 'address') {
          box.appendChild(MR.h('p', { class: 'dr-small', text:
            'Your domain has not signed these emails, so some inboxes may treat them with caution. If a campaign lands in spam, add your domain below to sign them yourself.' }));
        }
        if (!d.is_default) {
          box.appendChild(MR.h('button', {
            class: 'dr-button dr-button--secondary', type: 'button',
            text: 'Use this by default',
            onclick: function () { setDefault(d); }
          }));
        } else {
          box.appendChild(MR.h('p', { class: 'dr-small', text: 'New campaigns use this domain unless you choose another.' }));
        }
      } else if (d.kind === 'address') {
        box.appendChild(MR.h('p', null, 'We sent an email to ', MR.h('strong', { text: d.from_local + '@' + d.domain }),
          '. Select the confirmation link in it. It can take a minute to arrive, and it may be in your junk folder.'));
        box.appendChild(MR.h('div', { class: 'dr-button-group' },
          MR.h('button', {
            class: 'dr-button', type: 'button', text: 'I have selected the link',
            onclick: function (e) { check(d, e.target, 'I have selected the link'); }
          }),
          MR.h('button', {
            class: 'dr-button dr-button--secondary', type: 'button', text: 'Send it again',
            onclick: function (e) { resend(d, e.target); }
          })));
        box.appendChild(MR.h('p', { class: 'dr-small',
          text: d.last_checked_at ? 'Last sent or checked ' + MR.date(d.last_checked_at) + '.' : '' }));
      } else if (d.kind === 'alias') {
        box.appendChild(MR.h('p', { class: 'dr-small',
          text: 'This address is still being set up. Until it is ready your campaigns go from the shared address.' }));
        box.appendChild(MR.h('div', { class: 'dr-button-group' },
          MR.h('button', {
            class: 'dr-button', type: 'button', text: 'Check now',
            onclick: function (e) { check(d, e.target); }
          })));
      } else {
        box.appendChild(records(d));
        box.appendChild(MR.h('div', { class: 'dr-button-group' },
          MR.h('button', {
            class: 'dr-button', type: 'button', text: 'Check the records now',
            onclick: function (e) { check(d, e.target); }
          })));
        box.appendChild(MR.h('p', { class: 'dr-small',
          text: d.last_checked_at
            ? 'Last checked ' + MR.date(d.last_checked_at) + '. DNS changes can take a few hours to spread.'
            : 'DNS changes can take a few hours to spread, so a first check often comes back unverified.' }));
      }

      if (d.kind !== 'alias') {
        box.appendChild(MR.h('p', null, MR.h('button', {
          class: 'dr-button dr-button--warning', type: 'button', text: d.kind === 'address' ? 'Remove this address' : 'Remove this domain',
          onclick: function () { remove(d); }
        })));
      }
      return box;
    }

    /* ---------------- the DNS records ---------------- */
    function records(d) {
      var list = Array.isArray(d.records) ? d.records : [];
      if (!list.length) {
        return MR.h('p', { class: 'dr-empty', text: 'The provider has not returned any records yet. Check again in a moment.' });
      }
      var body = MR.h('tbody');
      list.forEach(function (r) {
        body.appendChild(MR.h('tr', null,
          MR.h('td', { text: r.type || '' }),
          MR.h('td', null, MR.h('code', { class: 'mr-dns', text: r.name || '' })),
          MR.h('td', null, MR.h('code', { class: 'mr-dns', text: r.value || '' })),
          MR.h('td', { text: r.priority == null ? '' : String(r.priority) }),
          MR.h('td', null, copyButton(r))));
      });
      return MR.h('div', null,
        MR.h('h3', { class: 'dr-h', text: 'Publish these records with whoever runs your DNS' }),
        MR.h('p', { class: 'dr-small', text: 'Your IT provider, your web host or your domain registrar. Copy each value exactly. Some control panels add the domain to the name for you, so check the result reads once, not twice.' }),
        MR.h('div', { class: 'dr-table-wrap' },
          MR.h('table', { class: 'dr-table' },
            MR.h('caption', { class: 'dr-visually-hidden', text: 'DNS records for ' + d.domain }),
            MR.h('thead', null, MR.h('tr', null,
              ['Type', 'Name', 'Value', 'Priority', ''].map(function (h) {
                return MR.h('th', { scope: 'col', text: h });
              }))),
            body)));
    }

    function copyButton(r) {
      var btn = MR.h('button', {
        class: 'dr-button dr-button--secondary', type: 'button', text: 'Copy value',
        onclick: function () {
          var done = function () { btn.textContent = 'Copied'; MR.announce('Value copied'); };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(r.value || '').then(done, fallback);
          } else { fallback(); }
          function fallback() {
            var input = MR.h('input', { type: 'text', value: r.value || '' });
            document.body.appendChild(input);
            input.select();
            try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = 'Select it by hand'; }
            input.remove();
          }
        }
      });
      return btn;
    }

    /* ---------------- use your own address ---------------- */
    // For a member who wants their own address to be the one they use before any
    // DNS is done. A business address is confirmed with one click on an email.
    // A free address (Gmail, Yahoo) or one whose domain would turn away mail it
    // did not sign cannot be sent from as itself, so it is confirmed with a
    // six-digit code and the sender shown to readers is built from it on our
    // side, with replies coming to the address itself. Same as Mailchimp does.
    function addressForm() {
      var form = MR.h('form', { id: 'mr-address-form', novalidate: true, class: 'mr-aside' });
      form.appendChild(MR.h('h2', { class: 'dr-h', text: 'Use your own address now' }));
      form.appendChild(MR.h('p', null, 'Enter the address you want to use, including a free one such as Gmail. We confirm it is yours with an email, and there is nothing to publish and nobody to ask.'));
      var input = MR.h('input', { class: 'dr-input', id: 'a-email', type: 'email', placeholder: 'hello@yourorganisation.org', autocomplete: 'off' });
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'a-email', text: 'Your address' }),
        MR.h('span', { class: 'dr-hint', text: 'It must be an address you can open.' }),
        input));
      form.appendChild(MR.h('p', { class: 'dr-small', text: 'Business address: readers see it exactly, though some inboxes may be cautious until you add your domain below. Free address: Gmail, Yahoo and others refuse email they did not send themselves, so we automatically change the part readers see to an address built from yours. Replies still come to you.' }));
      var steps = MR.h('div', { id: 'a-steps' });
      form.appendChild(steps);
      var button = MR.h('button', { class: 'dr-button', type: 'submit', text: 'Continue' });
      form.appendChild(button);

      function reset(label) { button.disabled = false; button.textContent = label || 'Continue'; }

      // The address came back as a sender. Put the new row in place and say what changed.
      function done(r) {
        domains = domains.filter(function (x) { return x.id !== r.domain.id; });
        domains.push(r.domain);
        render();
        if (r.mode === 'automatic') {
          MR.banner(wrap, 'Your address is set',
            'We send as ' + MR.domainLabel(r.domain) + ' and replies come to ' + r.address + '. ' +
            (r.reason === 'strict_policy'
              ? 'That domain tells inboxes to refuse email it has not signed, so we changed the sender for you. Add the domain below to send as the exact address.'
              : 'Free addresses cannot be used as they are, so we changed the sender for you.'));
        }
        MR.announce(r.domain.status === 'verified' ? 'Address ready' : 'Confirmation email sent');
      }

      function ask(email) {
        return MR.fn('mailroom-domain', { action: 'address', account_id: account.id, email: email });
      }

      // A free address: prove it with a code, then ask again.
      function codeStep(email) {
        steps.textContent = '';
        var status = MR.h('p', { class: 'dr-small', role: 'status', text: 'Sending a code to ' + email + '…' });
        steps.appendChild(status);
        MR.fn('mailroom-reply-address', { action: 'send', account_id: account.id, email: email }).then(function (r) {
          if (r.already_verified) { return ask(email).then(done); }
          status.textContent = 'We sent a six-digit code to ' + email + '. It lasts 30 minutes.';
          var code = MR.h('input', { class: 'dr-input dr-input--w', id: 'a-code', inputmode: 'numeric', autocomplete: 'one-time-code' });
          var confirm = MR.h('button', {
            type: 'button', class: 'dr-button', text: 'Confirm',
            onclick: function () {
              confirm.disabled = true;
              MR.fn('mailroom-reply-address', { action: 'check', account_id: account.id, email: email, code: code.value.trim() })
                .then(function () { return ask(email); })
                .then(done)
                .catch(function (err) { confirm.disabled = false; status.textContent = message(err); });
            }
          });
          steps.appendChild(MR.h('div', { class: 'dr-form-group' },
            MR.h('label', { class: 'dr-label', for: 'a-code', text: 'Code from the email' }), code, confirm));
          button.hidden = true;
          code.focus();
        }).catch(function (err) { status.textContent = message(err); reset(); });
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var value = input.value.trim().toLowerCase();
        if (MR.errors.show(form, /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value) ? [] :
          [{ id: 'a-email', message: 'Enter a full email address, such as hello@yourorganisation.org' }])) return;
        if (MR.cfg.demo) {
          MR.banner(wrap, 'Preview only', 'On the live service an email would be sent to ' + value + '.');
          return;
        }
        button.disabled = true;
        button.textContent = 'Checking…';
        ask(value).then(function (r) {
          if (r.needs_code) { button.textContent = 'Continue'; return codeStep(value); }
          done(r);
        }).catch(function (err) {
          reset();
          MR.errors.show(form, [{ id: 'a-email', message: message(err) }]);
        });
      });
      return form;
    }

    /* ---------------- add a domain ---------------- */
    function addForm() {
      var form = MR.h('form', { id: 'mr-domain-form', novalidate: true });
      form.appendChild(MR.h('h2', { text: 'Add a sending domain' }));

      // The ABTA subdomain is first and selected by default. Both routes end
      // in the same place - a verified domain the member alone carries the
      // record for - but one needs DNS records published by whoever runs the
      // member's DNS and the other needs nothing at all. Presenting them as
      // equal choices made the page read as DNS work with an alternative
      // buried underneath it, and a member without a technical colleague has
      // no way to tell from the form which one they can actually finish.
      //
      // Nothing is removed. A member who wants their own domain selects it
      // and gets the same records as before.
      var kind = 'abta_subdomain';
      var ownBox, abtaBox;

      var abtaRadio = MR.h('input', { class: 'dr-choice__input', id: 'd-abta', type: 'radio', name: 'd-kind', value: 'abta_subdomain', checked: true });
      var ownRadio = MR.h('input', { class: 'dr-choice__input', id: 'd-own', type: 'radio', name: 'd-kind', value: 'own_domain' });

      form.appendChild(MR.h('div', { class: 'dr-choice dr-choice--radio' }, abtaRadio,
        MR.h('label', { class: 'dr-choice__label', for: 'd-abta' }, 'A subdomain ABTA sets up for you',
          MR.h('span', { class: 'dr-choice__hint', text: 'Something like yourname.mail.abta.africa. ABTA publishes the records, so there is nothing for you to do and nobody to ask. Your delivery record is still your own. Readers see your organisation name, and the address after it reads as ABTA.' }))));
      form.appendChild(MR.h('div', { class: 'dr-choice dr-choice--radio' }, ownRadio,
        MR.h('label', { class: 'dr-choice__label', for: 'd-own' }, 'Your own domain',
          MR.h('span', { class: 'dr-choice__hint', text: 'Readers see your own address. You will need whoever runs your DNS to publish three or four records, and verification takes up to 72 hours from the moment they appear.' }))));

      var domainInput = MR.h('input', { class: 'dr-input', id: 'd-domain', type: 'text', placeholder: 'news.example.com' });
      ownBox = MR.h('div', { class: 'dr-form-group', hidden: true },
        MR.h('label', { class: 'dr-label', for: 'd-domain', text: 'Your domain' }),
        MR.h('span', { class: 'dr-hint', text: 'A subdomain such as news.example.com is better than the bare domain: a problem with marketing email then cannot touch your ordinary mail.' }),
        domainInput);

      var labelInput = MR.h('input', { class: 'dr-input', id: 'd-label', type: 'text', placeholder: 'yourname' });
      abtaBox = MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'd-label', text: 'The name in front' }),
        MR.h('span', { class: 'dr-hint', text: 'Letters, numbers and hyphens. It becomes yourname.mail.abta.africa.' }),
        labelInput);

      var localInput = MR.h('input', { class: 'dr-input dr-input--w', id: 'd-local', type: 'text', value: 'hello' });
      var localBox = MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'd-local', text: 'The address in front of it' }),
        MR.h('span', { class: 'dr-hint', text: 'For example hello, news or updates. Replies still go to your reply-to address.' }),
        localInput);

      form.appendChild(abtaBox);
      form.appendChild(ownBox);
      form.appendChild(localBox);
      form.appendChild(MR.h('button', { class: 'dr-button', type: 'submit', text: 'Add the domain' }));

      function switchKind() {
        kind = abtaRadio.checked ? 'abta_subdomain' : 'own_domain';
        ownBox.hidden = kind !== 'own_domain';
        abtaBox.hidden = kind !== 'abta_subdomain';
      }
      ownRadio.addEventListener('change', switchKind);
      abtaRadio.addEventListener('change', switchKind);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var errors = [];
        var value = kind === 'own_domain' ? domainInput.value.trim() : labelInput.value.trim();
        if (kind === 'own_domain' && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))) {
          errors.push({ id: 'd-domain', message: 'Enter a domain, such as news.example.com' });
        }
        if (kind === 'abta_subdomain' && !/^[a-z0-9-]{3,30}$/i.test(value)) {
          errors.push({ id: 'd-label', message: 'Enter at least three letters or numbers' });
        }
        if (!/^[a-z0-9]([a-z0-9._-]{0,62}[a-z0-9])?$/i.test(localInput.value.trim())) {
          errors.push({ id: 'd-local', message: 'Enter the part before the @, such as hello' });
        }
        if (MR.errors.show(form, errors)) return;

        if (MR.cfg.demo) {
          MR.banner(wrap, 'Preview only',
            'On the live service the records to publish would appear here within a second or two.');
          return;
        }
        var button = form.querySelector('button[type=submit]');
        button.disabled = true;
        button.textContent = 'Adding…';
        MR.fn('mailroom-domain', {
          action: 'add', account_id: account.id, kind: kind,
          domain: kind === 'own_domain' ? value : undefined,
          label: kind === 'abta_subdomain' ? value : undefined,
          from_local: localInput.value.trim()
        }).then(function (r) {
          domains.push(r.domain);
          render();
          MR.announce(kind === 'own_domain'
            ? 'Domain added. Publish the records shown.'
            : 'Subdomain requested. ABTA will publish the records.');
        }).catch(function (err) {
          button.disabled = false;
          button.textContent = 'Add the domain';
          MR.errors.show(form, [{
            id: kind === 'own_domain' ? 'd-domain' : 'd-label', message: message(err)
          }]);
        });
      });
      return form;
    }

    /* ---------------- actions ---------------- */
    function check(d, button, label) {
      if (MR.cfg.demo) { MR.banner(wrap, 'Preview only', 'Nothing is checked in preview mode.'); return; }
      button.disabled = true;
      button.textContent = 'Checking…';
      MR.fn('mailroom-domain', { action: 'check', domain_id: d.id }).then(function (r) {
        domains = domains.map(function (x) { return x.id === d.id ? r.domain : x; });
        render();
        MR.announce(r.verified ? 'Domain verified' : 'Not verified yet');
      }).catch(function (err) {
        button.disabled = false;
        button.textContent = label || 'Check the records now';
        MR.banner(wrap, 'Could not check', message(err), 'important');
      });
    }

    function resend(d, button) {
      if (MR.cfg.demo) { MR.banner(wrap, 'Preview only', 'Nothing is sent in preview mode.'); return; }
      button.disabled = true;
      button.textContent = 'Sending…';
      MR.fn('mailroom-domain', { action: 'address', account_id: account.id, email: d.from_local + '@' + d.domain }).then(function (r) {
        domains = domains.map(function (x) { return x.id === d.id ? r.domain : x; });
        render();
        MR.announce(r.wait ? 'An email was sent a moment ago. Give it a minute.' : 'Confirmation email sent again');
        if (r.wait) MR.banner(wrap, 'Sent a moment ago', 'The email was sent less than a minute ago. Give it a minute, then check your junk folder before sending it again.');
      }).catch(function (err) {
        button.disabled = false;
        button.textContent = 'Send it again';
        MR.banner(wrap, 'Could not send it', message(err), 'important');
      });
    }

    // SES sends the person back here after the link. The page then asks it
    // whether the address is confirmed, so they see the answer straight away.
    function afterLink() {
      var back = MR.qs('address');
      if (!back || MR.cfg.demo) return;
      if (back === 'failed') {
        MR.banner(wrap, 'The address was not confirmed', 'The link did not work, or it has expired. Send the email again from the address below.', 'important');
        return;
      }
      var waiting = domains.filter(function (d) { return d.kind === 'address' && d.status !== 'verified'; });
      Promise.all(waiting.map(function (d) {
        return MR.fn('mailroom-domain', { action: 'check', domain_id: d.id }).then(function (r) {
          domains = domains.map(function (x) { return x.id === d.id ? r.domain : x; });
        }).catch(function () { /* the button on the card still works */ });
      })).then(function () {
        render();
        var ok = domains.some(function (d) { return d.kind === 'address' && d.status === 'verified'; });
        MR.banner(wrap, ok ? 'Address confirmed' : 'Not confirmed yet',
          ok ? 'You can now choose it under Sent from when you write a campaign.'
             : 'We could not see the confirmation yet. Give it a minute and select I have selected the link.');
      });
    }

    function setDefault(d) {
      if (MR.cfg.demo) { MR.banner(wrap, 'Preview only', 'Nothing is saved in preview mode.'); return; }
      MR.api.update('mailroom_domains', 'id=eq.' + d.id, { is_default: true }).then(function () {
        return MR.api.select('mailroom_domains?select=*&order=created_at.asc');
      }).then(function (rows) {
        domains = rows || [];
        render();
        MR.announce('Default sending domain changed');
      }).catch(function (err) {
        MR.banner(wrap, 'Could not change it', message(err), 'important');
      });
    }

    function remove(d) {
      if (!confirm('Remove ' + (d.kind === 'address' ? MR.domainLabel(d) : d.domain) + '? Campaigns already sent keep their record, and new ones go out from the shared address until you add another domain.')) return;
      if (MR.cfg.demo) { MR.banner(wrap, 'Preview only', 'Nothing is removed in preview mode.'); return; }
      MR.fn('mailroom-domain', { action: 'remove', domain_id: d.id }).then(function () {
        domains = domains.filter(function (x) { return x.id !== d.id; });
        render();
        MR.announce('Domain removed');
      }).catch(function (err) {
        MR.banner(wrap, 'Could not remove it', message(err), 'important');
      });
    }

    function message(err) {
      var m = String((err && err.message) || '');
      if (/not_a_domain/.test(m)) return 'That does not look like a domain. Try news.example.com.';
      if (/public_mailbox/.test(m)) return 'Free domains such as gmail.com cannot be added as a sending domain. Use "Use your own address now" to send with a free address, or add a domain your organisation owns.';
      if (/abta_domain/.test(m)) return 'That domain belongs to ABTA. Choose the ABTA subdomain option instead.';
      if (/already_added/.test(m)) return 'That domain is already on your account.';
      if (/taken/.test(m)) return 'That domain is already in use by another sender.';
      if (/wrong_code/.test(m)) return 'That code was not right. Check it and try again.';
      if (/code_expired/.test(m)) return 'That code has expired. Enter your address again for a new one.';
      if (/too_many_attempts/.test(m)) return 'Too many wrong codes. Enter your address again for a new one.';
      if (/too_soon/.test(m)) return 'A code was sent a moment ago. Give it a minute, then check your junk folder.';
      if (/could_not_send/.test(m)) return 'We could not send the code. Try again shortly.';
      if (/too_many_addresses/.test(m)) return 'An account can hold three confirmed addresses. Remove one first.';
      if (/^plan$/.test(m)) return 'An exact address on a domain of your own comes with any paid plan. A free address such as Gmail works on every plan.';
      if (/not_supported/.test(m)) return 'This is not switched on for your account yet.';
      if (/alias_cannot_be_removed/.test(m)) return 'This address was made for your account and cannot be removed.';
      if (/too_many_domains/.test(m)) return 'An account can hold three sending domains. Remove one first.';
      if (/label_too_short/.test(m)) return 'Enter at least three letters or numbers.';
      if (/not_an_address/.test(m)) return 'Enter the part before the @, such as hello.';
      if (/campaign_in_flight/.test(m)) return 'A campaign is going out from this domain. Try again once it has finished.';
      if (/account_not_active/.test(m)) return 'Sending is suspended on this account.';
      if (/provider_refused/.test(m)) return 'The email provider would not accept that domain. Check the spelling.';
      if (/provider_unavailable/.test(m)) return 'The email provider did not answer. Try again shortly.';
      if (/not_configured/.test(m)) return 'Sending is not switched on yet.';
      return 'That could not be done. Please try again shortly.';
    }
  });
})();
