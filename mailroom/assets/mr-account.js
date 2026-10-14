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
      return MR.knownZone(z) ? z : MR.TIMEZONE_FALLBACK;
    } catch (e) { return MR.TIMEZONE_FALLBACK; }
  }

  function zoneLabel(tz) {
    var name = tz.replace(/_/g, ' ');
    try {
      var now = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
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

  function timezoneBox(account) {
    var box = MR.h('div', { class: 'mr-aside', id: 'mr-timezone' },
      MR.h('h2', { class: 'dr-h', text: 'Your timezone' }),
      MR.h('p', { class: 'dr-small', text: 'When you schedule a campaign for 9am, this is the 9am it means.' }));

    var select = MR.h('select', { class: 'dr-select', id: 'mr-timezone-select' });
    fillZones(select, account.timezone || MR.TIMEZONE_FALLBACK);
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
      MR.h('strong', { text: (plan && plan.name) || 'Free' }),
      plan && plan.price_minor
        ? MR.h('span', { text: ' \u00b7 ' + (plan.currency || 'GBP') + ' ' +
            (plan.price_minor / 100).toFixed(2) + (plan.interval === 'year' ? ' a year' : ' a month') })
        : MR.h('span', { class: 'dr-small', text: ' \u00b7 nothing extra to pay' })));

    // The opening fortnight. Say what happens when it ends, in the same
    // breath as saying it is running: a trial nobody saw coming to an end is
    // how you lose somebody who would have paid.
    if (account.trial_ends_at) {
      var ends = new Date(account.trial_ends_at);
      var daysLeft = Math.max(0, Math.ceil((ends - new Date()) / 86400000));
      if (daysLeft > 0) {
        box.appendChild(MR.h('p', { class: 'mr-trial', id: 'mr-trial' },
          MR.h('strong', { text: daysLeft === 1 ? 'Last day of your opening fortnight'
                                                : daysLeft + ' days left of your opening fortnight' }),
          MR.h('span', { class: 'dr-small', text:
            ' You are on the Starter allowance until ' + MR.date(account.trial_ends_at) +
            '. After that you keep your account and drop to the free allowance ' +
            'of 1,000 emails a month. Nothing is deleted and nothing stops working.' })));
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

    fillZones(form.querySelector('#m-timezone'), browserZone());

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var zoneField = form.querySelector('#m-timezone');
      var v = {
        name: form.querySelector('#m-name').value.trim(),
        website: form.querySelector('#m-website').value.trim(),
        contact: form.querySelector('#m-contact').value.trim(),
        email: form.querySelector('#m-email').value.trim(),
        address: form.querySelector('#m-address').value.trim(),
        timezone: (zoneField && zoneField.value) || MR.TIMEZONE_FALLBACK,
        declared: form.querySelector('#m-declaration').checked
      };
      var errors = [];
      if (!v.name) errors.push({ id: 'm-name', message: 'Enter your organisation name' });
      if (!v.contact) errors.push({ id: 'm-contact', message: 'Enter a contact name' });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) errors.push({ id: 'm-email', message: 'Enter a work email address' });
      if (!v.address) errors.push({ id: 'm-address', message: 'Enter the postal address that will appear in every email' });
      if (!v.declared) errors.push({ id: 'm-declaration', message: 'You must confirm how your list was collected' });
      if (MR.errors.show(form, errors)) return;

      if (MR.cfg.demo) {
        form.textContent = '';
        MR.banner(form.parentNode, 'Preview only',
          'On the live service you would be emailed a code to confirm your address, and the account would be ready to use. There is no approval queue.');
        return;
      }

      var finish = function () {
        return MR.api.insert('mailroom_accounts', {
          name: v.name, website: v.website || null, contact_name: v.contact,
          contact_email: v.email, postal_address: v.address, timezone: v.timezone
        }).then(function (rows) {
          return MR.api.insert('mailroom_account_users', {
            account_id: rows[0].id, user_id: MR.auth.userId(), email: v.email, role: 'owner'
          });
        }).then(function () {
          // This used to leave the member on the signup form with the banner
          // and nothing to click: no onward link, and the member navigation
          // does not appear until another page loads, so the only way forward
          // was knowing the URL. Go straight to the dashboard instead and
          // show the message there. Not a timed redirect, which would fail
          // WCAG 2.2.1 unless the member could stop it. 14 October 2026.
          location.href = 'account.html?created=1';
        });
      };

      if (MR.auth.signedIn()) { finish().catch(fail); return; }
      MR.auth.sendCode(v.email).then(function () {
        var code = MR.h('input', { class: 'dr-input dr-input--w', id: 'mr-code' });
        var status = MR.h('p', { class: 'dr-small', role: 'status' });
        var panel = MR.h('div', { class: 'mr-aside' },
          MR.h('h2', { class: 'dr-h', text: 'Confirm your email address' }),
          MR.h('p', { text: 'Enter the six-digit code sent to ' + v.email + '.' }),
          MR.h('div', { class: 'dr-form-group' }, MR.h('label', { class: 'dr-label', for: 'mr-code', text: 'Code' }), code),
          MR.h('button', {
            class: 'dr-button', type: 'button', text: 'Confirm',
            onclick: function () {
              status.textContent = 'Checking…';
              MR.auth.verifyCode(v.email, code.value.trim())
                .then(function () { panel.remove(); return finish(); })
                .catch(function (err) { status.textContent = err.message; });
            }
          }), status);
        form.parentNode.insertBefore(panel, form);
      }).catch(fail);

      function fail(err) {
        MR.errors.show(form, [{ id: 'm-email', message: 'That could not be sent. Please try again shortly.' }]);
        console.error(err);
      }
    });
  }

  /* ---------------- dashboard ---------------- */
  function initDashboard() {
    var wrap = document.getElementById('mr-dashboard');
    if (!wrap) return;

    // In preview mode the same render runs on the sample data, so the page a
    // member is sent to when a reply-to address is refused is not a blank one.
    var load = MR.cfg.demo
      ? Promise.resolve([MR.sampleAccount, MR.sampleCampaigns || [], MR.sampleLists || [],
                         MR.sampleDomains || [], MR.sampleReplyAddresses || [],
                         MR.samplePlans || [], []])
      : MR.requireAccount(wrap).then(function (account) {
          return Promise.all([
            account,
            MR.api.select('mailroom_campaigns?select=id,ref,subject,status,sent_at,scheduled_for,schedule_error,recipients,delivered,bounced,complained,clicked,unsubscribed&order=created_at.desc&limit=20'),
            MR.api.select('mailroom_lists?select=id,name,consent_status'),
            MR.api.select('mailroom_domains?select=id,domain,from_local,status,is_default,sending_status,trust_level,clean_campaigns'),
            MR.api.select('mailroom_reply_addresses?select=id,email,status&order=email'),
            MR.api.select('mailroom_plans?select=*&code=eq.' + encodeURIComponent(account.plan_code || 'included')),
            MR.api.select('mailroom_subscribers?select=id&status=eq.subscribed')
          ]);
        });

    load.then(function (res) {
      var account = res[0], campaigns = res[1] || [], lists = res[2] || [], domains = res[3] || [];
      var replies = res[4] || [];
      var plan = (res[5] || [])[0] || null;
      var subscriberCount = MR.cfg.demo
        ? (MR.sampleLists || []).reduce(function (n, l) { return n + (l.subscribers || 0); }, 0)
        : (res[6] || []).length;
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

      wrap.appendChild(replyBox(account, replies));
      wrap.appendChild(timezoneBox(account));
      var emailsThisMonth = campaigns.filter(function (c) {
        if (c.status !== 'sent' || !c.sent_at) return false;
        var d = new Date(c.sent_at), now = new Date();
        return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
      }).reduce(function (n, c) { return n + (c.recipients || 0); }, 0);

      wrap.appendChild(planBox(account, plan, {
        emails: emailsThisMonth, subscribers: subscriberCount
      }));
      wrap.appendChild(dataBox(account));

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
            MR.h('a', { href: 'campaign.html?id=' + c.id, text: c.subject }),
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
        var at = figures.nextSibling;
        block.forEach(function (el) { wrap.insertBefore(el, at); });
      }

      // "Recent campaigns" with a View all link, per the mockup. Write a
      // campaign moved up to the heading row; Manage lists and How your email
      // looks are both in the member navigation above, so the button strip
      // that used to sit here was a third way to the same two pages.
      wrap.appendChild(MR.h('div', { class: 'mr-section-head' },
        MR.h('h2', { class: 'dr-h', text: 'Recent campaigns' }),
        MR.h('a', { class: 'mr-section-head__all', href: 'campaign.html', text: 'View all' })));

      if (!lists.some(function (l) { return l.consent_status !== 'unconfirmed'; })) {
        MR.banner(wrap, 'No list is ready to mail',
          'A list can only be used once you have recorded how the addresses were collected.');
      }

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
          : 'Not sent yet';
        var stats = MR.h('div', { class: 'mr-camps__stats' });
        stats.appendChild(MR.h('span', { text: c.recipients ? MR.number(c.recipients) + ' sent' : '\u2013 sent' }));
        stats.appendChild(MR.h('span', { text: c.recipients ? MR.percent(c.clicked, c.recipients) + ' clicked' : '\u2013 clicked' }));
        stats.appendChild(MR.h('span', { class: 'dr-tag dr-tag--' + tagFor(c.status),
          text: MR.CAMPAIGN_STATUS[c.status] || c.status }));
        list.appendChild(MR.h('li', { class: 'mr-camps__row' },
          MR.h('div', null,
            MR.h('p', { class: 'mr-camps__name' }, MR.h('a', { href: 'campaign.html?id=' + c.id, text: c.subject })),
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
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'A list can only be mailed once you have said how its addresses were collected. One answer and a date, asked once per list, and they become the consent record you can show a subscriber who asks why you have their address.' }));
      wrap.appendChild(newListForm(account));

      if (!lists.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'No lists yet.' }));
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
          box.appendChild(MR.h('p', { class: 'dr-small', text: 'Collected: ' + period }));
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

      form.appendChild(MR.h('p', { class: 'dr-small', text: 'One answer and a date, and this list can be mailed. Together they are the consent record: if a subscriber or a regulator asks why you hold an address, this is the answer, and you can export it at any time.' }));

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
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'from-' + list.id, text: 'Roughly when did you start collecting them?' }),
          MR.h('span', { class: 'dr-hint', text: 'The first of the month is close enough. It is the start of the period this record covers.' }),
          from),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'to-' + list.id, text: 'And the last of them? (optional)' }),
          MR.h('span', { class: 'dr-hint', text: 'Leave this empty if you are still collecting.' }),
          to),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'word-' + list.id, text: 'What were they told?' }),
          MR.h('span', { class: 'dr-hint', id: 'word-hint-' + list.id, text: '' }),
          wording),
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
          if (hint) hint.textContent = 'Copy the wording from the form itself, as they read it.';
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
        if (!from.value) {
          errors.push({ id: 'from-' + list.id, message: 'Give roughly when you started collecting them' });
        }
        if (chosen && !chosen.refuse && !wording.value.trim()) {
          errors.push({ id: 'word-' + list.id, message: 'Say what people were told when you took their address' });
        }
        if (MR.errors.show(form, errors)) return;

        if (MR.cfg.demo) {
          MR.banner(wrap, 'Preview only', 'On the live service this list would now be mailable.');
          return;
        }
        MR.api.update('mailroom_lists', 'id=eq.' + list.id, {
          consent_source: chosen.source,
          consent_wording: wording.value.trim(),
          consent_from: from.value,
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
    var fileField = form.querySelector('#i-file');
    var preview = document.getElementById('mr-import-preview');
    var parsed = [];

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
        if (preselect && preselect === opt.id) { radio.checked = true; importChoice = opt; }
        radio.addEventListener('change', function () {
          importChoice = opt;
          var warn = document.getElementById('mr-import-refused');
          if (warn) warn.hidden = !opt.refuse;
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

    function parseCsv(text) {
      var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
      if (!lines.length) return [];
      var head = lines[0].split(',').map(function (h) { return h.trim().toLowerCase().replace(/^"|"$/g, ''); });
      var emailAt = head.indexOf('email');
      var nameAt = head.indexOf('name') > -1 ? head.indexOf('name') : head.indexOf('full_name');
      var orgAt = head.indexOf('organisation') > -1 ? head.indexOf('organisation') : head.indexOf('company');
      var countryAt = head.indexOf('country');
      var start = 1;
      if (emailAt === -1) { emailAt = 0; start = 0; }
      return lines.slice(start).map(function (line) {
        var cells = line.split(',').map(function (c) { return c.trim().replace(/^"|"$/g, ''); });
        return {
          email: cells[emailAt] || '',
          full_name: nameAt > -1 ? cells[nameAt] : null,
          organisation: orgAt > -1 ? cells[orgAt] : null,
          country: countryAt > -1 ? cells[countryAt] : null
        };
      }).filter(function (r) { return r.email; });
    }

    if (fileField) fileField.addEventListener('change', function () {
      var file = fileField.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var all = parseCsv(String(reader.result));
        var valid = all.filter(function (r) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email); });
        parsed = valid;
        preview.textContent = '';
        preview.appendChild(MR.h('p', { text: all.length + ' rows read from the file.' }));
        preview.appendChild(MR.h('p', { class: 'dr-small', text: valid.length + ' look like valid email addresses. ' +
          (all.length - valid.length) + ' will be skipped.' }));
        if (valid.length) {
          preview.appendChild(MR.h('p', { class: 'dr-small', text: 'First address: ' + valid[0].email }));
        }
      };
      reader.readAsText(file);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errors = [];
      if (!parsed.length) errors.push({ id: 'i-file', message: 'Choose a CSV file with an email column' });
      if (!importChoice) {
        errors.push({ id: 'i-src-' + MR.CONSENT_SOURCES[0].id, message: 'Choose how these addresses were collected' });
      } else if (importChoice.refuse) {
        errors.push({ id: 'i-src-' + MR.CONSENT_SOURCES[0].id, message: 'A bought, rented, scraped or appended list cannot be imported' });
      }
      if (MR.errors.show(form, errors)) return;
      var source = importChoice.source;

      if (MR.cfg.demo) {
        MR.banner(form.parentNode, 'Preview only',
          parsed.length + ' rows would be checked against the suppression list and imported.');
        return;
      }

      MR.fn('mailroom-import', { list_id: listId, rows: parsed, consent_source: source })
        .then(function (r) {
          // Confirmation page, not a cleared form. See MR.done.
          var main = document.getElementById('main') || form.parentNode;
          MR.done(main, {
            title: 'Import finished',
            lead: r.added + (r.added === 1 ? ' address added to' : ' addresses added to'),
            detail: listName || 'your list',
            next: [
              'The addresses are on the list now and can be mailed.',
              'How you said they were collected is saved against each one, with today\u2019s date, so every person has a record of their own.',
              'Anyone who had unsubscribed or complained before was left off, whichever sender they left.'
            ],
            actions: [
              ['campaign.html', 'Write a campaign'],
              ['lists.html', 'Back to your lists'],
              ['import.html' + (listId ? '?list=' + encodeURIComponent(listId) : ''), 'Import another file']
            ],
            detailList: [
              r.added + ' added',
              r.skipped_duplicate + ' already on the list',
              r.skipped_invalid + ' not valid addresses',
              r.skipped_suppressed + ' skipped because they had unsubscribed or complained before'
            ]
          });
        })
        .catch(function (err) {
          MR.errors.show(form, [{ id: 'i-file', message: 'The import failed: ' + err.message }]);
          console.error(err);
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCreateAccount();
    initDashboard();
    initLists();
    initImport();
  });
})();
