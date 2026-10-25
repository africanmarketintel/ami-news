/* ==========================================================================
   AMI Mailroom – member account: dashboard, lists, subscribers, import
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  MR.requireAccount = function (wrap) {
    if (!MR.auth.signedIn()) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Sign in' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'Sign in to manage your lists and campaigns.' }));
      wrap.appendChild(MR.h('p', null,
        MR.h('a', { class: 'dr-button', href: 'sign-in.html?next=account.html', text: 'Sign in' }), ' ',
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'create-account.html', text: 'Create a sender account' })));
      return Promise.reject(new Error('signed out'));
    }
    return MR.api.select('mailroom_account_users?select=account_id,role,mailroom_accounts(*)')
      .then(function (rows) {
        if (!rows || !rows.length) {
          wrap.textContent = '';
          wrap.appendChild(MR.h('h1', { text: 'No sender account' }));
          wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'This sign in is not linked to a sender account yet.' }));
          wrap.appendChild(MR.h('p', null, MR.h('a', { class: 'dr-button', href: 'create-account.html', text: 'Create a sender account' })));
          throw new Error('no account');
        }
        return rows[0].mailroom_accounts;
      });
  };

  /* ---------------- timezone ----------------
     The account's timezone is what a scheduled send is read in, so it is
     worth getting right once rather than explaining later. */

  function browserZone() {
    try {
      var z = Intl.DateTimeFormat().resolvedOptions().timeZone;
      z = MR.displayZone(z);
      return MR.knownZone(z) ? z : MR.TIMEZONE_FALLBACK;
    } catch (e) { return MR.TIMEZONE_FALLBACK; }
  }

  function zoneLabel(tz) {
    var name = tz.replace(/_/g, ' ');
    try {
      var now = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short'
      }).format(new Date());
      return name + ' (' + now + ' now)';
    } catch (e) { return name; }
  }

  // A member whose zone is not on the list keeps it rather than being moved
  // silently to one that is.
  function fillZones(select, current) {
    if (!select) return;
    select.textContent = '';
    var zones = (MR.TIMEZONES || []).slice();
    if (current && zones.indexOf(current) === -1) zones.unshift(current);
    zones.forEach(function (z) {
      select.appendChild(MR.h('option', {
        value: z, selected: z === current, text: zoneLabel(z)
      }));
    });
  }

  /* ---------------- the postal address ----------------
     Printed in the footer of every email. The law in the UK and the US asks
     for one, so a campaign cannot be sent without it. It could only be set
     when the account was created, so an account made with a placeholder had
     no way to fix it. */
  function addressBox(account) {
    var missing = !MR.hasAddress(account);
    var box = MR.h('div', { class: 'mr-aside', id: 'mr-address-box' },
      MR.h('h2', { class: 'dr-h', text: 'Postal address' }),
      MR.h('p', { class: 'dr-small', text: missing
        ? 'Your account has no postal address yet. Every marketing email has to carry one, so you cannot send until you add it.'
        : 'Printed in the footer of every email, after your organisation name. Use an address where post reaches you: a street address, or a PO box or private mailbox that is registered to you.' }));
    var area = MR.h('textarea', { class: 'dr-textarea', id: 'mr-address', rows: '3' });
    area.value = missing ? '' : String(account.postal_address || '');
    var status = MR.h('span', { class: 'dr-small', id: 'mr-address-status', role: 'status' });
    box.appendChild(MR.h('div', { class: 'dr-form-group' },
      MR.h('label', { class: 'dr-label', for: 'mr-address', text: 'Address' }), area));
    box.appendChild(MR.h('button', {
      type: 'button', class: 'dr-button dr-button--secondary', text: 'Save address',
      disabled: !!MR.cfg.demo,
      onclick: function () {
        var v = area.value.replace(/[ \t]+/g, ' ').trim();
        if (!MR.hasAddress({ postal_address: v })) { status.textContent = 'Enter the address that should appear in your emails.'; return; }
        MR.api.update('mailroom_accounts', 'id=eq.' + account.id, { postal_address: v })
          .then(function () {
            account.postal_address = v;
            status.textContent = 'Saved.';
            MR.announce('Address saved');
          })
          .catch(function (err) {
            status.textContent = 'That address could not be saved.';
            console.error(err);
          });
      }
    }));
    box.appendChild(MR.h('p', null, status));
    if (MR.cfg.demo) box.appendChild(MR.h('p', { class: 'dr-small', text: 'Nothing is saved in preview mode.' }));
    return box;
  }

  function timezoneBox(account) {
    var box = MR.h('div', { class: 'mr-aside', id: 'mr-timezone' },
      MR.h('h2', { class: 'dr-h', text: 'Your timezone' }),
      MR.h('p', { class: 'dr-small', text: 'When you schedule a campaign for 9am, this is the 9am it means.' }));

    var select = MR.h('select', { class: 'dr-select', id: 'mr-timezone-select' });
    fillZones(select, MR.displayZone(account.timezone));
    var status = MR.h('span', { class: 'dr-small', id: 'mr-timezone-status' });

    box.appendChild(MR.h('div', { class: 'dr-form-group' },
      MR.h('label', { class: 'dr-label', for: 'mr-timezone-select', text: 'Timezone' }), select));
    box.appendChild(MR.h('button', {
      type: 'button', class: 'dr-button dr-button--secondary', text: 'Save timezone',
      disabled: !!MR.cfg.demo,
      onclick: function () {
        MR.api.update('mailroom_accounts', 'id=eq.' + account.id, { timezone: select.value })
          .then(function () {
            account.timezone = select.value;
            status.textContent = 'Saved. Scheduled campaigns already in the queue keep the time they were set for.';
            MR.announce('Timezone saved');
          })
          .catch(function (err) {
            status.textContent = 'That timezone could not be saved.';
            console.error(err);
          });
      }
    }));
    box.appendChild(MR.h('p', null, status));
    if (MR.cfg.demo) {
      box.appendChild(MR.h('p', { class: 'dr-small', text: 'Nothing is saved in preview mode.' }));
    }
    return box;
  }

  /* ---------------- the plan, and how much of it is left ----------------
     Both limits apply and whichever is reached first stops the send, so both
     are shown rather than just the one that looks healthier. */

  function bar(used, allowed) {
    var pct = allowed ? Math.min(100, Math.round((used / allowed) * 100)) : 0;
    var tone = pct >= 100 ? 'red' : pct >= 80 ? 'yellow' : 'green';
    return MR.h('div', { class: 'mr-meter' },
      MR.h('div', { class: 'mr-meter__track' },
        MR.h('div', { class: 'mr-meter__fill mr-meter__fill--' + tone,
                      style: 'width:' + pct + '%' })),
      MR.h('span', { class: 'dr-small', text: MR.number(used) + ' of ' + MR.number(allowed) + ' (' + pct + '%)' }));
  }

  function planBox(account, plan, usage) {
    var box = MR.h('div', { class: 'mr-aside', id: 'mr-plan' },
      MR.h('h2', { class: 'dr-h', text: 'Your plan' }));

    box.appendChild(MR.h('p', null,
      MR.h('strong', { text: (plan && plan.name) || (account.plan_code === 'trial' ? 'Trial' : 'Your plan') }),
      plan && plan.price_minor
        ? MR.h('span', { text: ' \u00b7 ' + (plan.currency || 'GBP') + ' ' +
            (plan.price_minor / 100).toFixed(2) + (plan.interval === 'year' ? ' a year' : ' a month') })
        : MR.h('span', { class: 'dr-small', text: account.plan_code === 'trial' ? ' \u00b7 14-day trial, no card' : '' })));

    // The 14-day trial. Say what happens when it ends in the same breath as
    // saying it is running: a trial nobody saw coming to an end is how you
    // lose somebody who would have paid. Nothing is deleted when it ends.
    if (account.plan_code === 'trial' && account.trial_ends_at) {
      var ends = new Date(account.trial_ends_at);
      var daysLeft = Math.max(0, Math.ceil((ends - new Date()) / 86400000));
      var contact = MR.h('a', { href: 'mailto:ami@abta.africa', text: 'ami@abta.africa' });
      if (daysLeft > 0) {
        box.appendChild(MR.h('p', { class: 'mr-trial', id: 'mr-trial' },
          MR.h('strong', { text: daysLeft === 1 ? 'Last day of your trial'
                                                : daysLeft + ' days left of your trial' }),
          MR.h('span', { class: 'dr-small' },
            ' Your trial includes up to 1,000 emails in total and ends on ' + MR.date(account.trial_ends_at) +
            '. After that sending stops until you choose a plan. Your account, lists and campaigns stay as they are. To choose a plan, email ',
            contact, '.')));
      } else {
        box.appendChild(MR.h('p', { class: 'mr-trial', id: 'mr-trial' },
          MR.h('strong', { text: 'Your trial has ended' }),
          MR.h('span', { class: 'dr-small' },
            ' Sending is switched off. Your account, lists and campaigns stay as they are. To choose a plan and start sending again, email ',
            contact, '.')));
      }
    }

    box.appendChild(MR.h('h3', { class: 'dr-h', text: 'Emails this month' }));
    box.appendChild(bar(usage.emails, account.monthly_send_limit));
    box.appendChild(MR.h('h3', { class: 'dr-h', text: 'Subscribers held' }));
    box.appendChild(bar(usage.subscribers, account.max_subscribers));

    box.appendChild(MR.h('p', { class: 'dr-small', text: 'Whichever of the two you reach first is the one that stops a send. Sending stops at the limit rather than continuing and billing you, so nothing arrives as a surprise.' }));
    box.appendChild(MR.h('p', null, MR.h('a', {
      class: 'dr-button dr-button--secondary', href: 'pricing.html',
      text: 'What the plans include'
    })));
    return box;
  }

  /* ---------------- your data ----------------
     The data processing terms promise a portable copy on request, and
     deletion when an account closes. This is where a member gets both. */

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = MR.h('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  // A spreadsheet of the subscribers, which is what portability means to most
  // people. The JSON carries everything; this carries the part they will open.
  function subscribersCsv(data) {
    var rows = [['list', 'email', 'name', 'topics', 'status', 'added', 'unsubscribed']];
    (data.lists || []).forEach(function (l) {
      (l.subscribers || []).forEach(function (s) {
        rows.push([l.name, s.email, s.full_name || '', (s.topics || []).join(' '),
                   s.status, s.created_at || '', s.unsubscribed_at || '']);
      });
    });
    return rows.map(function (r) {
      return r.map(function (c) {
        var v = String(c == null ? '' : c);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(',');
    }).join('\r\n');
  }

  function dataBox(account) {
    var box = MR.h('div', { class: 'mr-aside', id: 'mr-your-data' },
      MR.h('h2', { class: 'dr-h', text: 'Your data' }),
      MR.h('p', { class: 'dr-small', text: 'Everything you have put into the Mailroom is yours. Take a copy whenever you like, in a format you can load somewhere else.' }));

    var status = MR.h('p', { class: 'dr-small', id: 'mr-data-status' });

    box.appendChild(MR.h('div', { class: 'dr-button-group' },
      MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary', id: 'mr-export',
        text: 'Download a copy', disabled: !!MR.cfg.demo,
        onclick: function (e) {
          var btn = e.target;
          btn.disabled = true;
          status.textContent = 'Putting your copy together.';
          MR.fn('mailroom-account', { action: 'export', account_id: account.id })
            .then(function (r) {
              var stamp = new Date().toISOString().slice(0, 10);
              download('ami-mailroom-' + stamp + '.json', JSON.stringify(r.export, null, 2));
              download('ami-mailroom-subscribers-' + stamp + '.csv',
                       subscribersCsv(r.export), 'text/csv');
              status.textContent = 'Downloaded: everything as JSON, and your subscribers as a spreadsheet.';
              btn.disabled = false;
            })
            .catch(function (err) {
              status.textContent = 'That copy could not be made. Please try again shortly.';
              btn.disabled = false;
              console.error(err);
            });
        }
      })));
    box.appendChild(status);

    box.appendChild(MR.h('h3', { class: 'dr-h', text: 'Closing your account' }));
    box.appendChild(MR.h('p', { class: 'dr-small', text: 'Closing deletes your subscribers, your lists and everything we recorded about who opened what. Campaigns you have already sent stay in the public archive, and addresses that unsubscribed or complained stay on the do-not-mail list, because neither of those is ours to undo. It cannot be reversed, so take a copy first.' }));

    var nameField = MR.h('input', { class: 'dr-input', id: 'mr-close-name', type: 'text', autocomplete: 'off' });
    box.appendChild(MR.h('div', { class: 'dr-form-group' },
      MR.h('label', { class: 'dr-label', for: 'mr-close-name', text: 'Type your organisation name to confirm' }),
      MR.h('span', { class: 'dr-hint', text: account.name }),
      nameField));
    box.appendChild(MR.h('button', {
      type: 'button', class: 'dr-button dr-button--warning', id: 'mr-close',
      text: 'Close this account', disabled: !!MR.cfg.demo,
      onclick: function (e) {
        if (nameField.value.trim() !== String(account.name).trim()) {
          status.textContent = 'Type your organisation name exactly as it appears above.';
          nameField.focus();
          return;
        }
        var btn = e.target;
        btn.disabled = true;
        status.textContent = 'Closing the account.';
        MR.fn('mailroom-account', {
          action: 'close', account_id: account.id, confirm: nameField.value.trim()
        }).then(function (r) {
          var stamp = new Date().toISOString().slice(0, 10);
          download('ami-mailroom-' + stamp + '.json', JSON.stringify(r.export, null, 2));
          var wrap = document.getElementById('mr-dashboard');
          wrap.textContent = '';
          MR.banner(wrap, 'Account closed',
            'Your subscriber data has been deleted and a copy has downloaded to this computer. ' +
            (r.result && r.result.subscribers_deleted ? MR.number(r.result.subscribers_deleted) + ' subscriber records were removed. ' : '') +
            'Campaigns you already sent remain in the archive.', 'important');
        }).catch(function (err) {
          status.textContent = closeError(err);
          btn.disabled = false;
          console.error(err);
        });
      }
    }));
    if (MR.cfg.demo) {
      box.appendChild(MR.h('p', { class: 'dr-small', text: 'Nothing is exported or deleted in preview mode.' }));
    }
    return box;
  }

  function closeError(err) {
    var m = String(err && err.message || '');
    if (/scheduled or sending/i.test(m)) return 'A campaign is scheduled or part-way through sending. Unschedule it, or wait for it to finish, then try again.';
    if (/confirm_mismatch/i.test(m)) return 'Type your organisation name exactly as it appears above.';
    if (/already_closed/i.test(m)) return 'This account is already closed.';
    if (/not_allowed/i.test(m)) return 'Only an owner of this account, or ABTA, can close it.';
    return 'The account could not be closed. Please try again shortly, or email ami@abta.africa.';
  }

  /* ---------------- where replies go ----------------
     A campaign can only name an address the account has confirmed, so that
     replies cannot be pointed at somebody else's inbox. The address a member
     signs in with is confirmed already. */
  function replyBox(account, replies) {
    var box = MR.h('div', { class: 'mr-aside', id: 'mr-reply-addresses' },
      MR.h('h2', { class: 'dr-h', text: 'Where replies go' }),
      MR.h('p', { class: 'dr-small', text: 'A campaign can only use an address confirmed here. Your sign-in address is confirmed already.' }));

    var list = MR.h('ul', { class: 'dr-list' });
    (replies || []).forEach(function (r) {
      var row = MR.h('li', null,
        MR.h('span', { text: r.email }), ' ',
        MR.h('span', {
          class: 'dr-tag dr-tag--' + (r.status === 'verified' ? 'green' : 'yellow'),
          text: r.status === 'verified' ? 'Confirmed' : 'Not confirmed'
        }));
      if (r.status !== 'verified') {
        row.appendChild(MR.h('span', null, ' ', MR.h('button', {
          type: 'button', class: 'dr-button dr-button--secondary', text: 'Confirm it',
          disabled: !!MR.cfg.demo,
          onclick: function () { confirmFlow(account, r.email, box); }
        })));
      }
      row.appendChild(MR.h('span', null, ' ', MR.h('button', {
        type: 'button', class: 'dr-button dr-button--warning', text: 'Remove',
        disabled: !!MR.cfg.demo,
        onclick: function () { removeReply(account, r.email); }
      })));
      list.appendChild(row);
    });
    if (!replies.length) {
      list.appendChild(MR.h('li', { class: 'dr-empty', text: 'No addresses yet.' }));
    }
    box.appendChild(list);

    var input = MR.h('input', { class: 'dr-input', id: 'mr-reply-new', type: 'email' });
    var form = MR.h('div', { id: 'mr-reply-form' },
      MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'mr-reply-new', text: 'Add another address' }),
        MR.h('span', { class: 'dr-hint', text: 'A shared inbox, or a colleague. We send a six-digit code to it.' }),
        input),
      MR.h('button', {
        type: 'button', class: 'dr-button', text: 'Send a code',
        disabled: !!MR.cfg.demo,
        onclick: function () {
          var email = input.value.trim().toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            MR.announce('Enter an email address');
            return;
          }
          confirmFlow(account, email, box);
        }
      }));
    box.appendChild(form);
    if (MR.cfg.demo) {
      box.appendChild(MR.h('p', { class: 'dr-small', text: 'No code is sent in preview mode.' }));
    }
    return box;
  }

  function confirmFlow(account, email, box) {
    if (MR.cfg.demo) { MR.banner(box, 'Preview only', 'Nothing is sent in preview mode.'); return; }
    var status = MR.h('p', { class: 'dr-small', role: 'status', text: 'Sending a code to ' + email + '…' });
    box.appendChild(status);
    MR.fn('mailroom-reply-address', { action: 'send', account_id: account.id, email: email })
      .then(function (r) {
        if (r.already_verified) { status.textContent = 'That address is confirmed already.'; return; }
        status.textContent = 'We sent a six-digit code to ' + email + '. It lasts 30 minutes.';
        var code = MR.h('input', { class: 'dr-input dr-input--w', id: 'mr-reply-code', inputmode: 'numeric', autocomplete: 'one-time-code' });
        var panel = MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'mr-reply-code', text: 'Code from the email' }), code,
          MR.h('button', {
            type: 'button', class: 'dr-button', text: 'Confirm',
            onclick: function () {
              MR.fn('mailroom-reply-address', {
                action: 'check', account_id: account.id, email: email, code: code.value.trim()
              }).then(function () {
                MR.announce('Address confirmed');
                location.reload();
              }).catch(function (err) {
                status.textContent = replyError(err);
              });
            }
          }));
        box.appendChild(panel);
        code.focus();
      })
      .catch(function (err) { status.textContent = replyError(err); });
  }

  function removeReply(account, email) {
    if (MR.cfg.demo) return;
    if (!confirm('Remove ' + email + '? Campaigns already sent are unaffected.')) return;
    MR.fn('mailroom-reply-address', { action: 'remove', account_id: account.id, email: email })
      .then(function () { location.reload(); })
      .catch(function (err) { alert(replyError(err)); });
  }

  function replyError(err) {
    var m = String((err && err.message) || '');
    if (/wrong_code/.test(m)) return 'That code was not right. Check it and try again.';
    if (/code_expired/.test(m)) return 'That code has expired. Send another.';
    if (/too_many_attempts/.test(m)) return 'Too many tries. Send a new code.';
    if (/too_soon/.test(m)) return 'A code was sent a moment ago. Wait a minute and try again.';
    if (/not_an_address/.test(m)) return 'That is not an email address.';
    if (/campaign_in_flight/.test(m)) return 'A campaign is going out to that address. Try again once it has finished.';
    if (/not_configured/.test(m)) return 'Sending is not switched on yet.';
    return 'That did not work. Please try again shortly.';
  }

  function statusTag(status) {
    var map = { active: 'green', suspended: 'red', closed: 'grey' };
    return MR.h('span', { class: 'dr-tag dr-tag--' + (map[status] || 'grey'), text: status });
  }

  /* ---------------- apply to send ---------------- */
  function initCreateAccount() {
    var form = document.getElementById('mr-account-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Only the three answers the account cannot exist without. The postal
      // address is asked for at the first send, where it is needed, the
      // timezone is read from the browser and can be changed on the account
      // page, and a contact name is not used anywhere.
      var v = {
        name: form.querySelector('#m-name').value.trim(),
        email: form.querySelector('#m-email').value.trim(),
        timezone: browserZone(),
        declared: form.querySelector('#m-declaration').checked
      };
      var errors = [];
      if (!v.name) errors.push({ id: 'm-name', message: 'Enter your name or organisation name' });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) errors.push({ id: 'm-email', message: 'Enter an email address' });
      if (!v.declared) errors.push({ id: 'm-declaration', message: 'You must confirm how your list was collected' });
      if (MR.errors.show(form, errors)) return;

      if (MR.cfg.demo) {
        form.textContent = '';
        MR.banner(form.parentNode, 'Preview only',
          'On the live service you would be emailed a code to confirm your address, and the account would be ready to use. There is no approval queue.');
        return;
      }

      var finish = function () {
        // The account is created with an id made here and nothing asked back.
        // Asking for the new row back fails for a new member, because they
        // can only read an account once they are listed as a user of it, and
        // that row is added next. 24 October 2026.
        var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : uuidFallback();
        return MR.api.insert('mailroom_accounts', {
          id: id, name: v.name, contact_email: v.email, postal_address: '', timezone: v.timezone
        }, { minimal: true }).then(function () {
          return MR.api.insert('mailroom_account_users', {
            account_id: id, user_id: MR.auth.userId(), email: v.email, role: 'owner'
          });
        }).then(function () {
          // This used to leave the member on the signup form with the banner
          // and nothing to click: no onward link, and the member navigation
          // does not appear until another page loads, so the only way forward
          // was knowing the URL. Go straight to the dashboard instead and
          // show the message there. Not a timed redirect, which would fail
          // WCAG 2.2.1 unless the member could stop it. 14 October 2026.
          location.href = 'import.html?start=1';
        }).catch(function (err) {
          err.stage = 'account';
          throw err;
        });
      };

      function uuidFallback() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 3 | 8)).toString(16);
        });
      }

      if (MR.auth.signedIn()) { finish().catch(fail); return; }
      MR.auth.sendCode(v.email).then(function () {
        var code = MR.h('input', { class: 'dr-input dr-input--w', id: 'mr-code' });
        var status = MR.h('p', { class: 'dr-small', role: 'status' });
        var old = document.getElementById('mr-code-panel'); if (old) old.remove();
        var panel = MR.h('div', { class: 'mr-aside', id: 'mr-code-panel' },
          MR.h('h2', { class: 'dr-h', text: 'Confirm your email address' }),
          MR.h('p', { text: 'Enter the six-digit code sent to ' + v.email + '.' }),
          MR.h('div', { class: 'dr-form-group' }, MR.h('label', { class: 'dr-label', for: 'mr-code', text: 'Code' }), code),
          MR.h('button', {
            class: 'dr-button', type: 'button', text: 'Confirm',
            onclick: function () {
              status.textContent = 'Checking…';
              MR.auth.verifyCode(v.email, code.value.trim())
                .then(function () { panel.remove(); return finish(); })
                .catch(function (err) {
                  status.textContent = err && err.stage === 'account'
                    ? MR.friendlyError(err, 'Your email address is confirmed but the account could not be set up. Try again, and if it keeps happening contact ABTA.')
                    : err.message;
                });
            }
          }), status);
        form.parentNode.insertBefore(panel, form);
      }).catch(fail);

      function fail(err) {
        MR.errors.show(form, [{ id: 'm-email', message: (err && err.stage === 'account')
          ? MR.friendlyError(err, 'Your email address is confirmed but the account could not be set up. Try again, and if it keeps happening contact ABTA.')
          : MR.codeError(err) }]);
        console.error(err);
      }
    });
  }

  /* ---------------- dashboard ---------------- */

  /* ---------------- first steps ----------------
     A new sender sees what to do next, in order. Each step is true or false
     from what already exists, so it ticks itself and disappears when the
     sender has done them all. */
  function firstSteps(done) {
    var steps = [
      { key: 'brand', title: 'Set how your email looks', text: 'Your logo, colours and the address people see it from.', href: 'brand.html', go: 'Set it up' },
      { key: 'people', title: 'Add your people', text: 'Upload a file, or paste the addresses in.', href: 'import.html', go: 'Add subscribers' },
      { key: 'agreed', title: 'Record how they agreed to hear from you', text: 'A list can only be mailed once you have said how its addresses were collected.', href: 'lists.html', go: 'Open your lists' },
      { key: 'written', title: 'Write a campaign from a layout', text: 'Pick one of more than 50 layouts and change anything in it.', href: 'campaign.html', go: 'Write a campaign' },
      { key: 'sent', title: 'Send your first campaign', text: 'Send a test to yourself first, then send it to your list.', href: 'campaigns.html', go: 'Open your campaigns' }
    ];
    var count = steps.filter(function (x) { return done[x.key]; }).length;
    if (count === steps.length) return null;
    var next = steps.filter(function (x) { return !done[x.key]; })[0];
    var list = MR.h('ol', { class: 'mr-steps__list' });
    steps.forEach(function (x) {
      var ok = !!done[x.key];
      var item = MR.h('li', { class: 'mr-steps__item' + (ok ? ' is-done' : x === next ? ' is-next' : '') },
        MR.h('span', { class: 'mr-steps__mark', 'aria-hidden': 'true', text: ok ? '✓' : String(steps.indexOf(x) + 1) }),
        MR.h('div', { class: 'mr-steps__body' },
          MR.h('p', { class: 'mr-steps__title' }, x.title, ok ? MR.h('span', { class: 'dr-visually-hidden', text: ' (done)' }) : null),
          ok ? null : MR.h('p', { class: 'mr-steps__text', text: x.text })),
        !ok && x === next ? MR.h('a', { class: 'dr-button', href: x.href, text: x.go }) : null);
      list.appendChild(item);
    });
    return MR.h('section', { class: 'mr-steps', 'aria-labelledby': 'mr-steps-h' },
      MR.h('div', { class: 'mr-steps__head' },
        MR.h('h2', { class: 'dr-h', id: 'mr-steps-h', text: 'Get started' }),
        MR.h('p', { class: 'mr-steps__count', text: count + ' of ' + steps.length + ' done' })),
      MR.h('div', { class: 'mr-steps__bar', role: 'presentation' },
        MR.h('span', { style: 'width:' + Math.round(count / steps.length * 100) + '%' })),
      list);
  }

  /* ---------------- the Settings page ----------------
     The things set once and rarely touched: where replies go, the postal
     address, the timezone, the plan, and a copy of your data. They used to sit
     under the campaigns on the dashboard, next to the button that closes the
     account. */
  function initSettings() {
    var wrap = document.getElementById('mr-settings-page');
    if (!wrap) return;
    var load = MR.cfg.demo
      ? Promise.resolve([MR.sampleAccount, MR.sampleReplyAddresses || [], MR.samplePlans || [], [], MR.sampleCampaigns || []])
      : MR.requireAccount(wrap).then(function (account) {
          return Promise.all([
            account,
            MR.api.select('mailroom_reply_addresses?select=id,email,status&order=email'),
            MR.api.select('mailroom_plans?select=*&code=eq.' + encodeURIComponent(account.plan_code || 'trial')),
            MR.api.select('mailroom_subscribers?select=id&status=eq.subscribed'),
            MR.api.select('mailroom_campaigns?select=status,sent_at,recipients&status=eq.sent&order=sent_at.desc&limit=200')
          ]);
        });
    load.then(function (res) {
      var account = res[0], replies = res[1] || [], plan = (res[2] || [])[0] || null;
      var subscriberCount = MR.cfg.demo
        ? (MR.sampleLists || []).reduce(function (n, l) { return n + (l.subscribers || 0); }, 0)
        : (res[3] || []).length;
      var emails = (res[4] || []).filter(function (c) {
        if (c.status !== 'sent' || !c.sent_at) return false;
        var d = new Date(c.sent_at), now = new Date();
        return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
      }).reduce(function (n, c) { return n + (c.recipients || 0); }, 0);
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Settings' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'Things you set once: how your email looks, where it comes from, your replies, postal address, timezone, plan and data.' }));
      wrap.appendChild(MR.h('div', { class: 'mr-linkcards' },
        MR.h('a', { class: 'mr-linkcard', href: 'brand.html' },
          MR.h('strong', { text: 'How your email looks' }),
          MR.h('span', { text: 'Your logo, colours and footer, saved once and used by every campaign.' })),
        MR.h('a', { class: 'mr-linkcard', href: 'domain.html' },
          MR.h('strong', { text: 'Sending domains' }),
          MR.h('span', { text: 'Send from a subdomain ABTA sets up for you, or from a domain of your own.' }))));
      var settings = MR.h('div', { class: 'mr-settings' });
      settings.appendChild(replyBox(account, replies));
      settings.appendChild(addressBox(account));
      settings.appendChild(timezoneBox(account));
      settings.appendChild(planBox(account, plan, { emails: emails, subscribers: subscriberCount }));
      settings.appendChild(dataBox(account));
      wrap.appendChild(settings);
    }).catch(function (err) { return MR.loadFailed(wrap, err); });
  }

  function initDashboard() {
    var wrap = document.getElementById('mr-dashboard');
    if (!wrap) return;

    // In preview mode the same render runs on the sample data, so the page a
    // member is sent to when a reply-to address is refused is not a blank one.
    var load = MR.cfg.demo
      ? (MR.qs('fresh')
          ? Promise.resolve([MR.sampleAccount, [], [], [], MR.sampleReplyAddresses || [], MR.samplePlans || [], [], []])
          : Promise.resolve([MR.sampleAccount, MR.sampleCampaigns || [], MR.sampleLists || [],
                             MR.sampleDomains || [], MR.sampleReplyAddresses || [],
                             MR.samplePlans || [], [], []]))
      : MR.requireAccount(wrap).then(function (account) {
          return Promise.all([
            account,
            MR.api.select('mailroom_campaigns?select=id,ref,subject,status,sent_at,scheduled_for,schedule_error,recipients,delivered,bounced,complained,clicked,unsubscribed,created_at,updated_at&order=updated_at.desc&limit=20'),
            MR.api.select('mailroom_lists?select=id,name,consent_status'),
            MR.api.select('mailroom_domains?select=id,domain,from_local,status,is_default,sending_status,trust_level,clean_campaigns'),
            MR.api.select('mailroom_reply_addresses?select=id,email,status&order=email'),
            MR.api.select('mailroom_plans?select=*&code=eq.' + encodeURIComponent(account.plan_code || 'trial')),
            MR.api.select('mailroom_subscribers?select=id&status=eq.subscribed&limit=1'),
            MR.api.select('mailroom_brand?select=account_id&limit=1')
          ]);
        });

    // Untitled drafts are named by what they start with, so two started on the
    // same day can be told apart.
    load = load.then(function (res) {
      return MR.loadSnippets(res[1] || []).then(function () { return res; });
    });

    load.then(function (res) {
      var account = res[0], campaigns = (res[1] || []).slice().sort(function (a, b) {
        return String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''));
      }), lists = res[2] || [], domains = res[3] || [];
      var replies = res[4] || [];
      var plan = (res[5] || [])[0] || null;
      var subscriberCount = MR.cfg.demo
        ? (MR.qs('fresh') ? 0 : (MR.sampleLists || []).reduce(function (n, l) { return n + (l.subscribers || 0); }, 0))
        : (res[6] || []).length;
      var hasBrand = MR.cfg.demo ? !MR.qs('fresh') && !!MR.sampleBrand : (res[7] || []).length > 0;
      wrap.textContent = '';
      // Arriving straight from create-account.html, which no longer leaves the
      // member stranded on the signup form.
      var justCreated = MR.qs('created') === '1';
      // Heading row to YO's mockup of 14 October 2026: the title and a plain
      // sentence on the left, the one action a member comes here to take on
      // the right. The account name and status tag that used to sit under the
      // title are gone; a suspended account still gets the banner below.
      wrap.appendChild(MR.h('div', { class: 'mr-page-head' },
        MR.h('div', null,
          MR.h('h1', { text: 'Your mailroom' }),
          MR.h('p', { class: 'dr-lead', text: 'Everything you have sent, and what it did.' })),
        MR.h('div', { class: 'mr-page-head__action' },
          MR.h('a', { class: 'dr-button', href: 'campaign.html', text: 'Write a campaign' }))));

      if (justCreated) {
        MR.banner(wrap, 'Account created',
          'Your next step is a list. A list can only be mailed once you have recorded how its addresses were collected, which is also your consent record. There is no daily limit: a monthly quota and the complaint thresholds are what hold a sender back.');
      }

      var sent = campaigns.filter(function (c) { return c.status === 'sent'; });
      var recipients = sent.reduce(function (n, c) { return n + (c.recipients || 0); }, 0);
      var complaints = sent.reduce(function (n, c) { return n + (c.complained || 0); }, 0);
      var delivered = sent.reduce(function (n, c) { return n + (c.delivered || 0); }, 0);
      // "Across the last 12 months" has to be true, so the count is filtered
      // to that window rather than being every campaign ever sent.
      var yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      var sentThisYear = sent.filter(function (c) {
        return c.sent_at && new Date(c.sent_at).getTime() >= yearAgo;
      });
      // Each figure carries the thing you would do about it, or the line it
      // must not cross. A complaint rate with no threshold beside it tells a
      // member nothing: they cannot know whether 0.04% is fine or alarming.
      var steps = firstSteps({
        brand: hasBrand, people: subscriberCount > 0,
        agreed: lists.some(function (l) { return l.consent_status !== 'unconfirmed'; }),
        written: campaigns.length > 0, sent: sent.length > 0
      });
      if (steps) wrap.appendChild(steps);
      wrap.appendChild(MR.h('div', { class: 'mr-figures mr-figures--cards' },
        card('Campaigns sent', MR.number(sentThisYear.length), 'Across the last 12 months'),
        card('Delivered', MR.number(delivered),
             recipients ? MR.percent(delivered, recipients) + ' of everything queued' : 'Nothing queued yet'),
        card('Complaint rate', MR.percent(complaints, recipients),
             'Sending is suspended above 0.3%')));

      if (account.status === 'suspended') {
        MR.banner(wrap, 'Sending suspended', account.suspension_reason || 'Contact ami@abta.africa.', 'important');
      }
      var live = domains.filter(function (d) { return d.status === 'verified' && d.sending_status === 'active'; });
      var onOwnDomain = live.length > 0;

      // Where the email goes out from, and what to do about it.
      // Sending domain, as a single tinted row at the foot of the page rather
       // than the panel of paragraphs and buttons that was here before. The
       // mockup of 14 October 2026 puts one line and one link in it. Everything
       // the panel explained is on domain.html, which the link goes to, and
       // "How your email looks" is in the member navigation above.
      var domainRow = MR.h('div', { class: 'mr-domain-row' });
      var domainText = MR.h('div');
      if (onOwnDomain) {
        var addresses = live.map(function (d) { return d.from_local + '@' + d.domain; }).join(', ');
        var clean = live.reduce(function (n, d) { return n + (d.clean_campaigns || 0); }, 0);
        domainText.appendChild(MR.h('h2', { text: live.map(function (d) { return d.domain; }).join(', ') + (live.length === 1 ? ' is verified' : ' are verified') }));
        domainText.appendChild(MR.h('p', { text: 'Campaigns go out as ' + addresses + '.'
          + (clean ? ' ' + MR.number(clean) + (clean === 1 ? ' clean campaign' : ' clean campaigns') + ' from this domain.' : '') }));
      } else if (domains.length) {
        domainText.appendChild(MR.h('h2', { text: domains[0].domain + ' is waiting for its DNS records' }));
        domainText.appendChild(MR.h('p', { text: 'Until it is verified, campaigns go out from the shared AMI Mailroom address.' }));
      } else {
        domainText.appendChild(MR.h('h2', { text: 'Sending from the shared ABTA domain' }));
        domainText.appendChild(MR.h('p', { text: account.sender_local
          ? 'Campaigns go out as ' + account.sender_local + '@mail.abta.africa, with your organisation name in front of it. Your own domain keeps your delivery record separate from other senders.'
          : 'Campaigns go out from the shared AMI Mailroom address, with your organisation name in front of it. Your own domain keeps your delivery record separate from other senders.' }));
      }
      domainRow.appendChild(domainText);
      domainRow.appendChild(MR.h('a', { class: 'mr-domain-row__link', href: 'domain.html', text: 'Sending domains' }));
      // Appended at the foot, below the campaign list, as the mockup has it.

      // A campaign part-way through sending. Large lists take minutes now that
      // the work is spread across workers, so say so rather than leaving the
      // member watching a status that looks stuck.
      var inFlight = campaigns.filter(function (c) { return c.status === 'sending'; });
      if (inFlight.length && !MR.cfg.demo) {
        var progress = MR.h('div', { class: 'mr-aside', id: 'mr-in-flight' },
          MR.h('h2', { class: 'dr-h', text: 'Going out now' }));
        inFlight.forEach(function (c) {
          var line = MR.h('p', null,
            MR.h('strong', { text: c.subject }), ' ',
            MR.h('span', { class: 'dr-small', id: 'mr-progress-' + c.id, text: 'counting…' }));
          progress.appendChild(line);
          MR.api.select('mailroom_sends?select=state&campaign_id=eq.' + c.id + '&is_test=eq.false')
            .then(function (rows) {
              var total = (rows || []).length;
              var left = (rows || []).filter(function (r) {
                return r.state === 'queued' || r.state === 'sending';
              }).length;
              var el = document.getElementById('mr-progress-' + c.id);
              if (!el) return;
              el.textContent = total
                ? MR.number(total - left) + ' of ' + MR.number(total) + ' sent'
                : 'preparing';
            })
            .catch(function () { /* the figure is a nicety, not the send */ });
        });
        progress.appendChild(MR.h('p', { class: 'dr-small', text: 'This page does not refresh itself. Reload it to see where a send has got to.' }));
        wrap.appendChild(progress);
      }

      // What is waiting to go out, and the only place to stop it.
      var queued = campaigns.filter(function (c) { return c.status === 'scheduled'; })
        .sort(function (a, b) { return String(a.scheduled_for).localeCompare(String(b.scheduled_for)); });
      if (queued.length) {
        var qList = MR.h('ul', { class: 'dr-list' });
        queued.forEach(function (c) {
          qList.appendChild(MR.h('li', null,
            MR.h('a', { href: 'campaign.html?id=' + c.id, text: MR.campaignName(c) }),
            MR.h('br'),
            MR.h('span', { class: 'dr-small', text: MR.dateTimeInZone(c.scheduled_for, account.timezone) })));
        });
        wrap.appendChild(MR.h('div', { class: 'mr-aside', id: 'mr-queued' },
          MR.h('h2', { class: 'dr-h', text: 'Waiting to go out' }), qList,
          MR.h('p', { class: 'dr-small', text: 'A scheduled campaign is locked. Open it to unschedule it, then edit and schedule it again.' })));
      }


      // Anything the automatic checks flagged against this account, so the
      // member can fix it rather than wait to be told.
      (MR.cfg.demo ? Promise.resolve([])
        : MR.api.select('mailroom_risk_flags?select=kind,severity,detail,created_at&resolved_at=is.null&order=created_at.desc&limit=5'))
        .then(function (flags) {
          if (!flags || !flags.length) return;
          var ul = MR.h('ul', { class: 'dr-list' });
          flags.forEach(function (f) { ul.appendChild(MR.h('li', { text: MR.FLAG_TEXT[f.kind] || f.kind })); });
          var box = MR.h('div', { class: 'mr-aside' },
            MR.h('h2', { class: 'dr-h', text: 'Things to look at' }), ul);
          wrap.insertBefore(box, wrap.querySelector('.mr-section-head') || null);
        }).catch(function () { /* not essential */ });

      // The settings panels - reply addresses, timezone, plan, data - are built
      // before the campaign list because they depend on values resolved earlier
      // in this function. The mockup puts Recent campaigns directly under the
      // figures, so the campaigns block is moved up at the end rather than
      // reshuffling that logic.
      function placeCampaigns() {
        var figures = wrap.querySelector('.mr-figures--cards');
        var head = wrap.querySelector('.mr-section-head');
        if (!figures || !head) return;
        var block = [], n = head;
        while (n) { block.push(n); n = n.nextSibling; }
        // Placed one after another from the figures down, so the order holds
        // whatever is or is not between them.
        var anchor = figures;
        ['mr-in-flight', 'mr-queued'].forEach(function (id) {
          var box = document.getElementById(id);
          if (box) { anchor.after(box); anchor = box; }
        });
        block.forEach(function (el) { anchor.after(el); anchor = el; });
      }

      // "Recent campaigns" with a View all link, per the mockup. Write a
      // campaign moved up to the heading row; Manage lists and How your email
      // looks are both in the member navigation above, so the button strip
      // that used to sit here was a third way to the same two pages.
      wrap.appendChild(MR.h('div', { class: 'mr-section-head' },
        MR.h('h2', { class: 'dr-h', text: 'Recent campaigns' }),
        MR.h('a', { class: 'mr-section-head__all', href: 'campaigns.html', text: 'View all' })));

      // The Get started list above says what to do about lists, so there is no
      // separate banner for it.

      if (!campaigns.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'You have not written a campaign yet.' }));
        wrap.appendChild(domainRow);
        placeCampaigns();
        return;
      }

      // The six-column table became a list of rows on 14 October 2026, to the
      // mockup. Each row says what it is, when it went or is going, how many
      // it reached and how many clicked. Complaints are no longer per row:
      // the account-wide rate is the figure that governs suspension and it is
      // in the cards above.
      var list = MR.h('ul', { class: 'mr-camps' });
      campaigns.forEach(function (c) {
        var when = c.sent_at ? 'Sent ' + MR.date(c.sent_at)
          : c.scheduled_for ? 'Scheduled for ' + MR.dateTimeInZone(c.scheduled_for, account.timezone)
          : c.updated_at || c.created_at ? 'Edited ' + MR.dateTimeInZone(c.updated_at || c.created_at, account.timezone) : 'Not sent yet';
        var stats = MR.h('div', { class: 'mr-camps__stats' });
        stats.appendChild(MR.h('span', { text: c.recipients ? MR.number(c.recipients) + ' sent' : '\u2013 sent' }));
        stats.appendChild(MR.h('span', { text: c.recipients ? MR.percent(c.clicked, c.recipients) + ' clicked' : '\u2013 clicked' }));
        stats.appendChild(MR.h('span', { class: 'dr-tag dr-tag--' + tagFor(c.status),
          text: MR.CAMPAIGN_STATUS[c.status] || c.status }));
        list.appendChild(MR.h('li', { class: 'mr-camps__row' },
          MR.h('div', null,
            MR.h('p', { class: 'mr-camps__name' }, MR.h('a', { href: 'campaign.html?id=' + c.id, text: MR.campaignName(c) })),
            MR.h('p', { class: 'mr-camps__sub', text: when + (c.ref ? ' \u00b7 ' + c.ref : '') })),
          stats));
      });
      wrap.appendChild(list);
      wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'Open rates are not shown. Mail privacy features make them unreliable, so clicks are the measure that means something.' }));
      wrap.appendChild(domainRow);
      placeCampaigns();
    }).catch(function (err) {
      return MR.loadFailed(wrap, err);
    });

    function card(title, value, note) {
      var cell = MR.h('div', { class: 'mr-figures__cell' },
        MR.h('h2', { class: 'mr-figures__label', text: title }),
        MR.h('p', { class: 'mr-figures__value', text: String(value) }));
      if (note) {
        var p = MR.h('p', { class: 'mr-figures__note' });
        if (typeof note === 'string') p.textContent = note;
        else p.appendChild(note);
        cell.appendChild(p);
      }
      return cell;
    }
    function tagFor(status) {
      return { sent: 'green', sending: 'blue', approved: 'blue', pending_approval: 'yellow',
        rejected: 'red', cancelled: 'grey', draft: 'grey', scheduled: 'blue' }[status] || 'grey';
    }
  }

  /* ---------------- lists ---------------- */
  function initLists() {
    var wrap = document.getElementById('mr-lists');
    if (!wrap || MR.cfg.demo) return;

    MR.requireAccount(wrap).then(function (account) {
      return MR.api.select('mailroom_lists?select=*&order=created_at.desc').then(function (lists) {
        render(account, lists || []);
      });
    }).catch(function (err) {
      return MR.loadFailed(wrap, err);
    });

    function render(account, lists) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Your lists' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'Each list records how its people agreed to hear from you. Once that is saved, the list can be mailed, and the record is there to show anyone who asks why you have their address.' }));
      wrap.appendChild(MR.h('p', null,
        MR.h('a', { class: 'dr-button', href: 'import.html', text: 'Add subscribers from a file' }),
        ' creates a list, records how it was collected and imports the file in one go.'));
      wrap.appendChild(newListForm(account));

      if (!lists.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty' }, 'No lists yet. Add subscribers from a file above, or collect them with a ',
          MR.h('a', { href: 'forms.html', text: 'signup form' }), '.'));
        return;
      }
      lists.forEach(function (l) { wrap.appendChild(listCard(l)); });
    }

    function newListForm(account) {
      var name = MR.h('input', { class: 'dr-input', id: 'mr-new-list', type: 'text' });
      var box = MR.h('div', { class: 'mr-aside' },
        MR.h('h2', { class: 'dr-h', text: 'Create a list' }),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'mr-new-list', text: 'List name' }), name),
        MR.h('button', {
          class: 'dr-button', type: 'button', text: 'Create list',
          onclick: function () {
            if (!name.value.trim()) { name.focus(); return; }
            MR.api.insert('mailroom_lists', { account_id: account.id, name: name.value.trim() })
              .then(function () { location.reload(); })
              .catch(function (err) { alert('The list could not be created.'); console.error(err); });
          }
        }));
      return box;
    }

    function listCard(list) {
      var box = MR.h('div', { class: 'mr-aside' });
      box.appendChild(MR.h('h2', { class: 'dr-h' }, list.name, ' ',
        MR.h('span', {
          class: 'dr-tag dr-tag--' + (list.consent_status === 'unconfirmed' ? 'red' : 'green'),
          text: MR.CONSENT_STATUS[list.consent_status] || list.consent_status
        })));

      // The element goes in now and gets its text later, so a slow count does
      // not land underneath the buttons and shift the card as it arrives.
      var count = MR.h('p', { class: 'dr-small', text: 'Counting\u2026' });
      box.appendChild(count);
      MR.api.select('mailroom_subscribers?select=status&list_id=eq.' + list.id).then(function (rows) {
        var subscribed = (rows || []).filter(function (r) { return r.status === 'subscribed'; }).length;
        count.textContent = MR.number(subscribed) + ' subscribed, ' +
          MR.number((rows || []).length - subscribed) + ' not mailable';
      }).catch(function () { count.textContent = 'The subscriber count could not be loaded.'; });

      if (list.consent_status === 'unconfirmed') {
        box.appendChild(consentForm(list));
      } else {
        // What was recorded, and when it covers, rather than the source alone.
        // A member asked for their consent evidence by a subscriber or a
        // regulator needs the dates, and reading them off this page is
        // quicker than reading them out of an export.
        var period = list.consent_from
          ? MR.date(list.consent_from) + (list.consent_to ? ' to ' + MR.date(list.consent_to) : ' onwards')
          : '';
        box.appendChild(MR.h('p', { class: 'dr-small', text: 'How they were collected: ' + (list.consent_source || '') }));
        if (list.consent_wording) {
          box.appendChild(MR.h('p', { class: 'dr-small', text: 'What they agreed to: ' + list.consent_wording }));
        }
        if (period) {
          box.appendChild(MR.h('p', { class: 'dr-small', text: 'Record covers: ' + period }));
        }
        box.appendChild(MR.h('p', { class: 'dr-small', text: 'Every address on this list also carries its own record of where it came from and the date it was added, which is the evidence a subscriber or a regulator would be shown.' }));
      }
      box.appendChild(MR.h('p', null,
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'import.html?list=' + list.id, text: 'Import subscribers' })));
      return box;
    }

    function consentForm(list) {
      // A named choice plus a date, rather than four empty boxes. The schema
      // only moves a list to 'declared' when consent_source, consent_wording
      // and consent_from are all set, so the choice supplies the first two and
      // the member supplies the third. The date is not guessed: it is the one
      // fact here that only they have, and a made-up date would be a false
      // record in the file that exists to be shown to somebody.
      var form = MR.h('form', { novalidate: true });
      var firstId = 'src-' + list.id + '-' + MR.CONSENT_SOURCES[0].id;
      var chosen = null;

      form.appendChild(MR.h('p', { class: 'dr-small', text: 'One answer, and this list can be mailed. It is the consent record: if a subscriber or a regulator asks why you hold an address, this is the answer, and you can export it at any time.' }));

      var group = MR.h('fieldset', { class: 'dr-form-group' },
        MR.h('legend', { class: 'dr-label', text: 'How were these addresses collected?' }));

      MR.CONSENT_SOURCES.forEach(function (opt) {
        var id = 'src-' + list.id + '-' + opt.id;
        var radio = MR.h('input', {
          class: 'dr-choice__input', type: 'radio', id: id,
          name: 'src-' + list.id, value: opt.id
        });
        radio.addEventListener('change', function () { pick(opt); });
        group.appendChild(MR.h('div', { class: 'dr-choice dr-choice--radio' }, radio,
          MR.h('label', { class: 'dr-choice__label', for: id }, opt.label,
            MR.h('span', { class: 'dr-choice__hint', text: opt.hint }))));
      });
      form.appendChild(group);

      // Shown only once a choice is made, so the page is one question wide
      // until it needs to be more.
      var wording = MR.h('textarea', { class: 'dr-textarea', id: 'word-' + list.id, rows: '2' });
      var from = MR.h('input', { class: 'dr-input dr-input--w', id: 'from-' + list.id, type: 'date' });
      var to = MR.h('input', { class: 'dr-input dr-input--w', id: 'to-' + list.id, type: 'date' });

      var rest = MR.h('div', { hidden: true },
        MR.h('details', { class: 'dr-details' },
        MR.h('summary', { text: 'Add when you started collecting and what people were told (optional)' }),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'from-' + list.id, text: 'Roughly when did you start collecting them? (optional)' }),
          MR.h('span', { class: 'dr-hint', text: 'Leave it empty and today is recorded as the start of this record.' }),
          from),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'to-' + list.id, text: 'And the last of them? (optional)' }),
          MR.h('span', { class: 'dr-hint', text: 'Leave this empty if you are still collecting.' }),
          to),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'word-' + list.id, text: 'What were they told? (optional)' }),
          MR.h('span', { class: 'dr-hint', id: 'word-hint-' + list.id, text: '' }),
          wording)),
        MR.h('button', { class: 'dr-button', type: 'submit', text: 'Record this and make the list mailable' }));
      form.appendChild(rest);

      var refused = MR.h('div', { class: 'mr-aside', hidden: true, role: 'alert' },
        MR.h('h3', { class: 'dr-h', text: 'Those addresses cannot be mailed here' }),
        MR.h('p', { text: 'A bought, rented, scraped or appended list cannot be sent through the Mailroom, whatever the supplier said about it being opted in. Complaints from a list like that land on the shared sending domain, which every other member is also using.' }),
        MR.h('p', { class: 'dr-small' }, 'If some of these addresses were collected properly and the rest were not, separate them and record only the ones you can account for. ',
          MR.h('a', { href: 'forms.html', text: 'A signup form' }), ' is the quickest way to start a list you can stand behind.'));
      form.appendChild(refused);

      function pick(opt) {
        chosen = opt;
        refused.hidden = !opt.refuse;
        rest.hidden = !!opt.refuse;
        if (opt.refuse) return;
        var hint = document.getElementById('word-hint-' + list.id);
        if (opt.wordingRequired) {
          if (hint) hint.textContent = 'If you have the wording from the form, add it as they read it. Otherwise leave this empty.';
          if (!wording.value.trim()) wording.value = '';
        } else {
          if (hint) hint.textContent = 'Filled in from your answer above. Change it if it is not quite right.';
          if (!wording.value.trim()) wording.value = opt.wording;
        }
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var errors = [];
        if (!chosen || chosen.refuse) {
          errors.push({ id: firstId, message: 'Choose how these addresses were collected' });
        }
        if (MR.errors.show(form, errors)) return;

        if (MR.cfg.demo) {
          MR.banner(wrap, 'Preview only', 'On the live service this list would now be mailable.');
          return;
        }
        MR.api.update('mailroom_lists', 'id=eq.' + list.id, {
          consent_source: chosen.source,
          consent_wording: wording.value.trim() || MR.defaultWording(chosen),
          consent_from: from.value || MR.todayIso(),
          consent_to: to.value || null
        }).then(function () { location.reload(); })
          .catch(function (err) { alert('That could not be saved.'); console.error(err); });
      });
      return form;
    }
  }

  /* ---------------- import ---------------- */
  function initImport() {
    var form = document.getElementById('mr-import-form');
    if (!form) return;
    var listId = MR.qs('list');
    var listName = '';
    // With no list named, this page makes the list as well: one page and one
    // answer to "where did these addresses come from", instead of a lists
    // page, a consent form and an import page asking the same question.
    var newList = !listId;
    var account = null;
    var wordingBox = null, fromBox = null, nameBox = null, moreBox = null;
    var fileField = form.querySelector('#i-file');
    var preview = document.getElementById('mr-import-preview');
    var parsed = [];
    var pasteField = form.querySelector('#i-paste');
    var pasteCount = document.getElementById('mr-paste-count');
    var EMAIL_OK = /^[^@\s,;<>()"]+@[^@\s,;<>()"]+\.[^@\s,;<>()"]+$/;

    // Addresses typed or pasted in, read the same way as a file: one contact a
    // line, commas or semicolons between them, a name in front of an address,
    // or cells pasted from a spreadsheet. A first row headed "email" brings
    // the name, organisation and country columns with it. See mr-contacts.js.
    function typedRows() {
      var r = MR.parseContacts(pasteField ? pasteField.value : '');
      return { rows: r.rows, bad: r.bad, header: r.header, columns: r.columns };
    }

    // The file and the typed addresses together. A repeat is dropped here, and
    // the server drops any already on the list.
    function allRows() {
      var seen = {}, out = [];
      parsed.concat(typedRows().rows).forEach(function (r) {
        var k = String(r.email).toLowerCase();
        if (!seen[k]) { seen[k] = 1; out.push(r); }
      });
      return out;
    }

    function showTyped() {
      if (!pasteCount) return;
      var t = typedRows();
      if (!t.rows.length && !t.bad.length) { pasteCount.textContent = ''; return; }
      pasteCount.textContent = t.rows.length + (t.rows.length === 1 ? ' address' : ' addresses') + ' read.' +
        (t.header ? ' Columns found: ' + t.columns.join(', ') + '.' : '') +
        (t.bad.length ? ' ' + t.bad.length + ' will be skipped because ' + (t.bad.length === 1 ? 'it does' : 'they do') +
          ' not look like an email address: ' + t.bad.slice(0, 3).join(', ') + (t.bad.length > 3 ? ' and more' : '') + '.' : '');
    }
    if (pasteField) pasteField.addEventListener('input', showTyped);

    // The same choice as the list page, in the same words. A file can come
    // from somewhere the rest of the list did not, so it is still asked per
    // import - but the list's own answer is preselected, so the usual case is
    // reading one line rather than answering a question twice.
    //
    // It matters that this is per-import: mailroom-import writes
    // consent_source and consent_at against every row, so each subscriber
    // ends up with evidence of their own rather than inheriting the list's.
    // That per-person record is the stronger of the two, and the note says so.
    var importChoice = null;
    var importGroup = document.getElementById('mr-import-source');

    function renderImportSources(preselect) {
      if (!importGroup) return;
      MR.CONSENT_SOURCES.forEach(function (opt) {
        var id = 'i-src-' + opt.id;
        var radio = MR.h('input', {
          class: 'dr-choice__input', type: 'radio', id: id, name: 'i-source', value: opt.id
        });
        if (preselect && preselect === opt.id) { radio.checked = true; importChoice = opt; setTimeout(function () { chosenSource(opt); }, 0); }
        radio.addEventListener('change', function () {
          importChoice = opt;
          var warn = document.getElementById('mr-import-refused');
          if (warn) warn.hidden = !opt.refuse;
          chosenSource(opt);
        });
        importGroup.appendChild(MR.h('div', { class: 'dr-choice dr-choice--radio' }, radio,
          MR.h('label', { class: 'dr-choice__label', for: id }, opt.label,
            MR.h('span', { class: 'dr-choice__hint', text: opt.hint }))));
      });
      importGroup.appendChild(MR.h('p', {
        class: 'dr-error-message', id: 'mr-import-refused', hidden: true,
        text: 'A bought, rented, scraped or appended list cannot be imported, whatever the supplier said about it being opted in.'
      }));
    }

    // Match the list's recorded answer back to one of the choices, so the
    // member sees their own earlier answer rather than a blank set.
    function sourceIdFor(recorded) {
      var hit = MR.CONSENT_SOURCES.filter(function (o) { return o.source === recorded; })[0];
      return hit ? hit.id : null;
    }

    // The extra questions a new list needs: its name, when the addresses
    // started being collected, and what people were told. The wording is
    // filled in from the answer above, so the usual case is one date.
    function chosenSource(opt) {
      if (!newList || !wordingBox) return;
      var open = !opt.refuse;
      moreBox.hidden = !open;
      if (!open) return;
      var w = form.querySelector('#i-wording');
      var hint = form.querySelector('#i-wording-hint');
      if (opt.wordingRequired) {
        hint.textContent = 'If you have the wording from the form, add it as they read it. Otherwise leave this empty.';
        // A wording filled in for another answer is not theirs to keep.
        if (MR.CONSENT_SOURCES.some(function (o) { return o.wording && o.wording === w.value; })) w.value = '';
      } else {
        hint.textContent = 'Filled in from your answer above. Change it if it is not quite right.';
        if (!w.value.trim() || MR.CONSENT_SOURCES.some(function (o) { return o.wording && o.wording === w.value; })) w.value = opt.wording || '';
      }
    }

    if (newList) {
      var h1 = document.querySelector('main h1');
      var lead = document.querySelector('main .dr-lead');
      if (h1) h1.textContent = 'Add your subscribers';
      document.title = 'Add your subscribers \u2013 AMI Mailroom';
      if (lead) lead.textContent = 'Upload a CSV, TXT or Excel file, or paste the addresses in. Name, organisation and country are optional. This creates your list and fills it in one go.';
      var legendHint = importGroup && importGroup.querySelector('.dr-hint');
      if (legendHint) legendHint.textContent = 'This becomes the consent record for the list, and is saved against every address in the file.';

      if (MR.qs('start') === '1') {
        var steps = MR.h('ol', { class: 'dr-small', id: 'mr-start-steps', 'aria-label': 'Your first email, in three steps' },
          MR.h('li', { 'aria-current': 'step' }, MR.h('strong', { text: 'Add your subscribers' })),
          MR.h('li', { text: 'Write your email' }),
          MR.h('li', { text: 'Send it' }));
        form.parentNode.insertBefore(steps, form);
      }

      var nameInput = MR.h('input', { class: 'dr-input', id: 'i-list-name', type: 'text', value: 'Subscribers' });
      nameBox = MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'i-list-name', text: 'List name' }),
        MR.h('span', { class: 'dr-hint', text: 'Only you see this. You can add more lists later.' }), nameInput);
      form.insertBefore(nameBox, form.firstChild);

      fromBox = MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'i-from', text: 'Roughly when did you start collecting them? (optional)' }),
        MR.h('span', { class: 'dr-hint', text: 'Leave it empty and today is recorded as the start of this record.' }),
        MR.h('input', { class: 'dr-input dr-input--w', id: 'i-from', type: 'date' }));
      wordingBox = MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'i-wording', text: 'What were they told? (optional)' }),
        MR.h('span', { class: 'dr-hint', id: 'i-wording-hint', text: '' }),
        MR.h('textarea', { class: 'dr-textarea', id: 'i-wording', rows: '2' }));
      var consentNote = document.getElementById('mr-import-consent');
      // Optional. Most senders only need to say where the addresses came
      // from, so the extra detail sits behind a line of its own.
      moreBox = MR.h('details', { class: 'dr-details', id: 'i-more', hidden: true },
        MR.h('summary', { text: 'Add when you started collecting and what people were told (optional)' }),
        fromBox, wordingBox);
      form.insertBefore(moreBox, consentNote);
      form.querySelector('button[type="submit"]').textContent = 'Add subscribers';
      if (!MR.cfg.demo) {
        MR.requireAccount(form.parentNode).then(function (a) { account = a; }).catch(function () { /* the sign-in prompt is already showing */ });
      }
    } else {
      var h1b = document.querySelector('main h1'); if (h1b) h1b.textContent = 'Import subscribers';
    }

    if (listId && !MR.cfg.demo) {
      MR.api.select('mailroom_lists?select=name,consent_source,consent_status&id=eq.' + encodeURIComponent(listId))
        .then(function (rows) {
          var list = (rows && rows[0]) || {};
          listName = list.name || '';
          renderImportSources(sourceIdFor(list.consent_source));
          var note = document.getElementById('mr-import-consent');
          if (!note) return;
          note.textContent = list.consent_source
            ? 'Preselected from what you recorded for ' + list.name + '. Change it if this file came from somewhere else. Your answer is saved against every address in the file, with today\u2019s date, so each person ends up with a record of their own.'
            : 'Saved against every address in this file, with today\u2019s date, so each person ends up with a record of their own as well as the list.';
        })
        .catch(function () { renderImportSources(null); });
    } else {
      renderImportSources(null);
    }

    // A CSV, TSV or TXT file is read as text and an .xlsx as a zip of sheets,
    // both by mr-contacts.js. The old .xls format cannot be read here.
    var MAX_FILE = 25 * 1024 * 1024, MAX_ROWS_ALL = 200000;
    var fileBad = [];
    function showFile(res, note) {
      parsed = res.rows; fileBad = res.bad;
      preview.textContent = '';
      preview.appendChild(MR.h('p', { text: res.rows.length + (res.rows.length === 1 ? ' address' : ' addresses') + ' read from the file.' }));
      if (note) preview.appendChild(MR.h('p', { class: 'dr-small', text: note }));
      preview.appendChild(MR.h('p', { class: 'dr-small', text: res.header
        ? 'Columns found: ' + res.columns.join(', ') + '.'
        : 'No heading row found, so the address on each row is used, with any other text beside it as the name. Add a first row headed email to bring in name, organisation and country.' }));
      if (res.bad.length) {
        preview.appendChild(MR.h('p', { class: 'dr-small', text: res.bad.length + ' will be skipped because ' +
          (res.bad.length === 1 ? 'it does' : 'they do') + ' not look like an email address: ' +
          res.bad.slice(0, 3).join(', ') + (res.bad.length > 3 ? ' and more' : '') + '.' }));
      }
      if (res.rows.length) preview.appendChild(MR.h('p', { class: 'dr-small', text: 'First address: ' + res.rows[0].email }));
    }
    function fileProblem(message) {
      parsed = []; fileBad = [];
      preview.textContent = '';
      preview.appendChild(MR.h('p', { class: 'dr-error-message', role: 'alert', text: message }));
    }
    if (fileField) fileField.addEventListener('change', function () {
      var file = fileField.files[0];
      if (!file) { parsed = []; preview.textContent = ''; return; }
      if (file.size > MAX_FILE) { fileProblem('That file is over 25 MB. Split it, or save only the email columns.'); return; }
      if (/\.xls$/i.test(file.name)) { fileProblem('Old Excel (.xls) files cannot be read. In Excel choose Save As and pick Excel Workbook (.xlsx) or CSV.'); return; }
      var read = /\.xlsx$/i.test(file.name)
        ? file.arrayBuffer().then(MR.readXlsx).then(function (x) {
            var res = MR.contactsFromCells(x.cells);
            showFile(res, x.sheet ? 'Read the first sheet, ' + x.sheet + '.' : 'Read the first sheet.');
          })
        : file.text().then(function (t) { showFile(MR.parseContacts(t)); });
      read.catch(function (err) { fileProblem(err && err.message ? err.message : 'That file could not be read.'); });
    });

    // The server takes up to 5,000 rows a call, so a long list goes in
    // batches and the totals are added up here. A repeat is skipped by the
    // server, so running a half-finished import again is safe.
    var BATCH = 2000;
    var submitButton = form.querySelector('button[type="submit"]');
    var progress = MR.h('p', { class: 'dr-small', id: 'mr-import-progress', role: 'status' });
    submitButton.parentNode.insertBefore(progress, submitButton);

    function importInBatches(rows, source) {
      var total = { added: 0, skipped_invalid: 0, skipped_suppressed: 0, skipped_duplicate: 0, skipped_quota: 0, skipped_disposable: 0, role_addresses: 0 };
      var done = 0, chain = Promise.resolve();
      function step(i) {
        chain = chain.then(function () {
          return MR.fn('mailroom-import', { list_id: listId, rows: rows.slice(i, i + BATCH), consent_source: source })
            .then(function (r) {
              Object.keys(total).forEach(function (k) { total[k] += (r && r[k]) || 0; });
              done = Math.min(i + BATCH, rows.length);
              progress.textContent = rows.length > BATCH
                ? 'Importing: ' + MR.number(done) + ' of ' + MR.number(rows.length) + ' addresses checked.' : '';
            });
        });
      }
      progress.textContent = rows.length > BATCH ? 'Importing: 0 of ' + MR.number(rows.length) + ' addresses checked.' : 'Importing\u2026';
      for (var i = 0; i < rows.length; i += BATCH) step(i);
      return chain.then(function () { return total; }).catch(function (err) {
        err.done = done; err.imported = total.added; err.of = rows.length; throw err;
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errors = [];
      if (!allRows().length) errors.push({ id: 'i-file', message: 'Choose a file with an email column, or type at least one email address' });
      else if (allRows().length > MAX_ROWS_ALL) errors.push({ id: 'i-file', message: 'That is more than 200,000 addresses. Import them as two or more files.' });
      if (!importChoice) {
        errors.push({ id: 'i-src-' + MR.CONSENT_SOURCES[0].id, message: 'Choose how these addresses were collected' });
      } else if (importChoice.refuse) {
        errors.push({ id: 'i-src-' + MR.CONSENT_SOURCES[0].id, message: 'A bought, rented, scraped or appended list cannot be imported' });
      }
      var nameValue = '', fromValue = '', wordingValue = '';
      if (newList) {
        nameValue = form.querySelector('#i-list-name').value.trim();
        fromValue = form.querySelector('#i-from').value;
        wordingValue = form.querySelector('#i-wording').value.trim();
        if (!nameValue) errors.push({ id: 'i-list-name', message: 'Give the list a name' });
        if (importChoice && !importChoice.refuse) {
          fromValue = fromValue || MR.todayIso();
          wordingValue = wordingValue || MR.defaultWording(importChoice);
        }
      }
      if (MR.errors.show(form, errors)) return;
      var source = importChoice.source;

      if (MR.cfg.demo) {
        MR.banner(form.parentNode, 'Preview only',
          allRows().length + ' addresses would be checked against the blocked addresses and imported.');
        return;
      }

      // A new list is made first, with its consent record, then filled. If the
      // import fails the list is kept, and a second try fills that one rather
      // than making another.
      var ready = listId ? Promise.resolve(listId)
        : (account ? Promise.resolve() : Promise.reject(new Error('Sign in again, then retry')))
          .then(function () {
            return MR.api.insert('mailroom_lists', {
              account_id: account.id, name: nameValue, consent_source: source,
              consent_wording: wordingValue, consent_from: fromValue, consent_to: null
            });
          }).then(function (rows) { listId = rows[0].id; listName = nameValue; return listId; });
      submitButton.disabled = true;
      ready.then(function () { return importInBatches(allRows(), source); })
        .then(function (r) {
          progress.textContent = '';
          // Confirmation page, not a cleared form. See MR.done.
          var main = document.getElementById('main') || form.parentNode;
          MR.done(main, {
            title: newList && MR.qs('start') === '1' ? 'Step 1 of 3 done: your subscribers are added' : 'Import finished',
            lead: r.added + (r.added === 1 ? ' address added to' : ' addresses added to'),
            detail: listName || 'your list',
            next: [
              'The addresses are on the list now and can be mailed.',
              'How you said they were collected is saved against each one, with today\u2019s date, so every person has a record of their own.',
              'Addresses blocked on the platform or on your account were left off: addresses that do not exist, spam reports and requests to stop all AMI Mailroom email. Anyone who had unsubscribed from your list stays unsubscribed.'
            ],
            actions: [
              ['campaign.html?list=' + encodeURIComponent(listId) + (MR.qs('start') === '1' ? '&start=1' : ''), 'Write your email'],
              ['lists.html', 'Back to your lists'],
              ['import.html' + (listId ? '?list=' + encodeURIComponent(listId) : ''), 'Import another file']
            ],
            detailList: [
              r.added + ' added',
              r.skipped_duplicate + ' already on the list, including anyone who had unsubscribed',
              r.skipped_invalid + ' not valid addresses',
              r.skipped_suppressed + ' skipped because they are blocked: an address that does not exist, a spam report or a request to stop all email'
            ].concat(r.skipped_disposable ? [r.skipped_disposable + ' throwaway addresses skipped'] : [])
             .concat(r.skipped_quota ? [r.skipped_quota + ' not added because your plan\u2019s subscriber limit was reached'] : [])
          });
        })
        .catch(function (err) {
          submitButton.disabled = false;
          progress.textContent = '';
          MR.errors.show(form, [{ id: 'i-file', message: err && err.done
            ? 'The import stopped after ' + MR.number(err.done) + ' of ' + MR.number(err.of) + ' addresses (' + MR.number(err.imported) +
              ' added): ' + MR.friendlyError(err, 'Something went wrong.') + ' Run it again and the ones already added are skipped.'
            : 'The import failed. ' + MR.friendlyError(err, 'Try again, and if it keeps happening contact ABTA.') }]);
          console.error(err);
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCreateAccount();
    initDashboard();
    initSettings();
    initLists();
    initImport();
  });
})();
