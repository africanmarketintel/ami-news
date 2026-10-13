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
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'create-account.html', text: 'Apply to send' })));
      return Promise.reject(new Error('signed out'));
    }
    return MR.api.select('mailroom_account_users?select=account_id,role,mailroom_accounts(*)')
      .then(function (rows) {
        if (!rows || !rows.length) {
          wrap.textContent = '';
          wrap.appendChild(MR.h('h1', { text: 'No sender account' }));
          wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'This sign in is not linked to a sender account yet.' }));
          wrap.appendChild(MR.h('p', null, MR.h('a', { class: 'dr-button', href: 'create-account.html', text: 'Apply to send' })));
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
          'On the live service this would go to ABTA for approval, and you would be emailed a code to confirm your address.');
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
          form.textContent = '';
          MR.banner(form.parentNode, 'Account created',
            'You can import a list and send as soon as you have recorded how the addresses were collected. There is no daily limit: a monthly quota and the complaint thresholds are what hold a sender back.');
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
      wrap.appendChild(MR.h('h1', { text: 'Your mailroom' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead' }, account.name, ' · ', statusTag(account.status)));

      if (account.status === 'suspended') {
        MR.banner(wrap, 'Sending suspended', account.suspension_reason || 'Contact ami@abta.africa.', 'important');
      }
      var live = domains.filter(function (d) { return d.status === 'verified' && d.sending_status === 'active'; });
      var onOwnDomain = live.length > 0;

      // Where the email goes out from, and what to do about it.
      var domainBox = MR.h('div', { class: 'mr-aside' },
        MR.h('h2', { class: 'dr-h', text: 'Where your email comes from' }));
      if (onOwnDomain) {
        domainBox.appendChild(MR.h('p', null, 'Campaigns go out as ',
          MR.h('strong', { text: live.map(function (d) { return d.from_local + '@' + d.domain; }).join(', ') }),
          '. Your delivery record is your own.'));
      } else if (domains.length) {
        domainBox.appendChild(MR.h('p', { text: domains[0].domain + ' is waiting for its DNS records. Until it is verified, campaigns go out from the shared AMI Mailroom address.' }));
      } else if (account.sender_local) {
        domainBox.appendChild(MR.h('p', null, 'Campaigns go out as ',
          MR.h('strong', { text: account.sender_local + '@mail.abta.africa' }),
          ', with your organisation name in front of it. Sending from your own domain instead puts your real address in front of readers and keeps your delivery record separate from other senders.'));
      } else {
        domainBox.appendChild(MR.h('p', { text: 'Campaigns go out from the shared AMI Mailroom address, with your organisation name in front of it. Sending from your own domain is better for opens and keeps your delivery record separate from other senders.' }));
      }
      // Whatever else is set up, the account keeps its address on the shared
      // domain, and a campaign falls back to it. Worth saying, because it is
      // the address most campaigns actually leave from.
      if (account.sender_local && (onOwnDomain || domains.length)) {
        domainBox.appendChild(MR.h('p', { class: 'dr-small' },
          'Your address on the shared ABTA domain is ',
          MR.h('strong', { text: account.sender_local + '@mail.abta.africa' }),
          '. Any campaign not sent from your own domain goes out from it.'));
      }
      domainBox.appendChild(MR.h('p', null, MR.h('a', {
        class: 'dr-button dr-button--secondary', href: 'domain.html',
        text: onOwnDomain ? 'Manage sending domains' : 'Send from your own domain'
      }), ' ', MR.h('a', {
        class: 'dr-button dr-button--secondary', href: 'brand.html',
        text: 'How your email looks'
      })));
      wrap.appendChild(domainBox);
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

      var sent = campaigns.filter(function (c) { return c.status === 'sent'; });
      var recipients = sent.reduce(function (n, c) { return n + (c.recipients || 0); }, 0);
      var complaints = sent.reduce(function (n, c) { return n + (c.complained || 0); }, 0);
      wrap.appendChild(MR.h('div', { class: 'dr-grid dr-grid--thirds' },
        card('Campaigns sent', MR.number(sent.length)),
        card('Emails delivered', MR.number(sent.reduce(function (n, c) { return n + (c.delivered || 0); }, 0))),
        card('Complaint rate', MR.percent(complaints, recipients))));

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
          wrap.insertBefore(box, wrap.children[3] || null);
        }).catch(function () { /* not essential */ });

      wrap.appendChild(MR.h('div', { class: 'dr-results-bar' },
        MR.h('p', { class: 'dr-results-count', text: campaigns.length + ' campaigns' }),
        MR.h('div', { class: 'dr-results-bar__tools' },
          MR.h('a', { class: 'dr-button', href: 'campaign.html', text: 'Write a campaign' }), ' ',
          MR.h('a', { class: 'dr-button dr-button--secondary', href: 'lists.html', text: 'Manage lists' }), ' ',
          MR.h('a', { class: 'dr-button dr-button--secondary', href: 'brand.html', text: 'How your email looks' }))));

      if (!lists.some(function (l) { return l.consent_status !== 'unconfirmed'; })) {
        MR.banner(wrap, 'No list is ready to mail',
          'A list can only be used once you have recorded how the addresses were collected.');
      }

      if (!campaigns.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'You have not written a campaign yet.' }));
        return;
      }

      var tbody = MR.h('tbody');
      campaigns.forEach(function (c) {
        tbody.appendChild(MR.h('tr', null,
          MR.h('td', null, MR.h('a', { href: 'campaign.html?id=' + c.id, text: c.subject }),
            MR.h('br'), MR.h('span', { class: 'dr-small', text: c.ref || 'not sent yet' })),
          MR.h('td', null, MR.h('span', { class: 'dr-tag dr-tag--' + tagFor(c.status), text: MR.CAMPAIGN_STATUS[c.status] || c.status })),
          MR.h('td', { text: c.sent_at ? MR.date(c.sent_at)
            : c.scheduled_for ? MR.dateTimeInZone(c.scheduled_for, account.timezone) : '' }),
          MR.h('td', { text: MR.number(c.recipients) }),
          MR.h('td', { text: c.recipients ? MR.percent(c.clicked, c.recipients) : '' }),
          MR.h('td', { text: c.recipients ? MR.percent(c.complained, c.recipients) : '' })));
      });
      wrap.appendChild(MR.h('div', { class: 'dr-table-wrap' },
        MR.h('table', { class: 'dr-table' },
          MR.h('caption', { class: 'dr-visually-hidden', text: 'Campaigns' }),
          MR.h('thead', null, MR.h('tr', null,
            MR.h('th', { scope: 'col', text: 'Campaign' }), MR.h('th', { scope: 'col', text: 'Status' }),
            MR.h('th', { scope: 'col', text: 'Sent or due' }), MR.h('th', { scope: 'col', text: 'Recipients' }),
            MR.h('th', { scope: 'col', text: 'Clicks' }), MR.h('th', { scope: 'col', text: 'Complaints' }))),
          tbody)));
      wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'Open rates are not shown. Mail privacy features make them unreliable, so clicks are the measure that means something.' }));
    }).catch(function (err) {
      if (err.message === 'signed out' || err.message === 'no account') return;
      console.error(err);
    });

    function card(title, value) {
      return MR.h('div', { class: 'dr-status-card' },
        MR.h('h2', { class: 'dr-h', text: title }),
        MR.h('p', { class: 'dr-price-box__amount', text: String(value) }));
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
      if (err.message === 'signed out' || err.message === 'no account') return;
      console.error(err);
    });

    function render(account, lists) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'Your lists' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'A list can only be mailed once you have recorded how its addresses were collected.' }));
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

      MR.api.select('mailroom_subscribers?select=status&list_id=eq.' + list.id).then(function (rows) {
        var subscribed = (rows || []).filter(function (r) { return r.status === 'subscribed'; }).length;
        box.appendChild(MR.h('p', { text: MR.number(subscribed) + ' subscribed, ' + MR.number((rows || []).length - subscribed) + ' not mailable' }));
      }).catch(function () { /* counts are not essential */ });

      if (list.consent_status === 'unconfirmed') {
        box.appendChild(consentForm(list));
      } else {
        box.appendChild(MR.h('p', { class: 'dr-small', text: 'Recorded: ' + (list.consent_source || '') }));
      }
      box.appendChild(MR.h('p', null,
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'import.html?list=' + list.id, text: 'Import subscribers' })));
      return box;
    }

    function consentForm(list) {
      var source = MR.h('input', { class: 'dr-input', id: 'src-' + list.id, type: 'text' });
      var wording = MR.h('textarea', { class: 'dr-textarea', id: 'word-' + list.id, rows: '2' });
      var from = MR.h('input', { class: 'dr-input dr-input--w', id: 'from-' + list.id, type: 'date' });
      var to = MR.h('input', { class: 'dr-input dr-input--w', id: 'to-' + list.id, type: 'date' });
      var form = MR.h('form', null,
        MR.h('p', { class: 'dr-small', text: 'This list cannot be mailed until you record the following.' }),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'src-' + list.id, text: 'How were these addresses collected?' }), source),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'word-' + list.id, text: 'What did people agree to?' }), wording),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'from-' + list.id, text: 'Collected from' }), from),
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: 'to-' + list.id, text: 'Collected until' }), to),
        MR.h('button', { class: 'dr-button', type: 'submit', text: 'Record consent evidence' }));

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var errors = [];
        if (!source.value.trim()) errors.push({ id: 'src-' + list.id, message: 'Say how the addresses were collected' });
        if (!wording.value.trim()) errors.push({ id: 'word-' + list.id, message: 'Give the wording people agreed to' });
        if (!from.value) errors.push({ id: 'from-' + list.id, message: 'Give the date collection started' });
        if (MR.errors.show(form, errors)) return;
        MR.api.update('mailroom_lists', 'id=eq.' + list.id, {
          consent_source: source.value.trim(), consent_wording: wording.value.trim(),
          consent_from: from.value, consent_to: to.value || null
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
    var fileField = form.querySelector('#i-file');
    var preview = document.getElementById('mr-import-preview');
    var parsed = [];

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
      var source = form.querySelector('#i-source').value.trim();
      var declared = form.querySelector('#i-declaration').checked;
      var errors = [];
      if (!parsed.length) errors.push({ id: 'i-file', message: 'Choose a CSV file with an email column' });
      if (!source) errors.push({ id: 'i-source', message: 'Say where these addresses came from' });
      if (!declared) errors.push({ id: 'i-declaration', message: 'You must confirm that none of these addresses were bought or scraped' });
      if (MR.errors.show(form, errors)) return;

      if (MR.cfg.demo) {
        MR.banner(form.parentNode, 'Preview only',
          parsed.length + ' rows would be checked against the suppression list and imported.');
        return;
      }

      MR.fn('mailroom-import', { list_id: listId, rows: parsed, consent_source: source })
        .then(function (r) {
          form.textContent = '';
          MR.banner(form.parentNode, 'Import finished',
            r.added + ' added, ' + r.skipped_duplicate + ' already on the list, ' +
            r.skipped_invalid + ' not valid addresses, ' + r.skipped_suppressed + ' skipped because they had unsubscribed or complained before.');
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
