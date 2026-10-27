/* ==========================================================================
   AMI Mailroom – ABTA admin (admin.html)
     open flags, held campaigns, complaint watch, suspensions
     There is no approval queue: senders sign up and send.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  function section(title, node) {
    return MR.h('section', null, MR.h('h2', { text: title }), node);
  }
  function table(headings, body) {
    return MR.h('div', { class: 'dr-table-wrap' },
      MR.h('table', { class: 'dr-table' },
        MR.h('thead', null, MR.h('tr', null, headings.map(function (h) {
          return MR.h('th', { scope: 'col', text: h });
        }))), body));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-admin');
    if (!wrap || MR.cfg.demo) return;

    if (!MR.auth.signedIn()) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'Sign in with an ABTA account.' }));
      wrap.appendChild(MR.h('p', null, MR.h('a', { class: 'dr-button', href: 'sign-in.html?next=admin.html', text: 'Sign in' })));
      return;
    }

    Promise.all([
      MR.api.select('mailroom_risk_flags?select=*,mailroom_accounts(name)&resolved_at=is.null&order=created_at.desc&limit=40'),
      MR.api.select('mailroom_campaigns?select=*,mailroom_accounts(name,postal_address),mailroom_lists(name,consent_status,consent_source)&status=eq.held&order=created_at.asc'),
      MR.api.select('mailroom_campaigns?select=ref,subject,recipients,delivered,bounced,complained,unsubscribed,account_id,mailroom_accounts(name)&status=eq.sent&order=sent_at.desc&limit=20'),
      MR.api.select('mailroom_accounts?select=id,name,status,suspension_reason,trust_level&status=eq.suspended'),
      MR.api.select('mailroom_domains?select=*,mailroom_accounts(name)&status=neq.verified&order=created_at.asc'),
      MR.api.select('mailroom_campaigns?select=id,subject,scheduled_for,dispatch_claimed_at,mailroom_accounts(name,timezone)&status=eq.scheduled&order=scheduled_for.asc')
    ]).then(function (res) {
      render(res[0] || [], res[1] || [], res[2] || [], res[3] || [], res[4] || [], res[5] || []);
    }).catch(function (err) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'This account does not have admin access, or the queues could not be loaded.' }));
      console.error(err);
    });

    function render(flags, held, recent, suspended, pendingDomains, queued) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'AMI Mailroom admin' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: held.length + ' campaigns held · ' + flags.length + ' open flags · ' + pendingDomains.length + ' domains waiting · ' + queued.length + ' campaigns scheduled · ' + suspended.length + ' accounts suspended' }));
      wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'Senders are not approved here. Anyone can sign up and send, and this page is where the exceptions land.' }));

      /* ---- open flags ---- */
      var fBody = MR.h('tbody');
      flags.forEach(function (f) {
        fBody.appendChild(MR.h('tr', null,
          MR.h('td', { text: (f.mailroom_accounts && f.mailroom_accounts.name) || '' }),
          MR.h('td', null,
            MR.h('span', { text: MR.FLAG_TEXT[f.kind] || f.kind }), MR.h('br'),
            MR.h('span', { class: 'dr-small', text: JSON.stringify(f.detail || {}) })),
          MR.h('td', null, MR.h('span', {
            class: 'dr-tag dr-tag--' + (f.severity === 'hold' ? 'red' : 'yellow'), text: f.severity
          })),
          MR.h('td', { text: MR.date(f.created_at) }),
          MR.h('td', null, MR.h('button', {
            class: 'dr-button dr-button--secondary', type: 'button', text: 'Mark as seen',
            onclick: function () {
              MR.api.update('mailroom_risk_flags', 'id=eq.' + f.id, {
                resolved_at: new Date().toISOString()
              }).then(reload).catch(fail);
            }
          }))));
      });
      wrap.appendChild(section('Open flags', flags.length
        ? table(['Account', 'What was found', 'Severity', 'When', 'Action'], fBody)
        : MR.h('p', { class: 'dr-empty', text: 'Nothing flagged.' })));

      /* ---- held campaigns ---- */
      var cBody = MR.h('tbody');
      held.forEach(function (c) {
        cBody.appendChild(MR.h('tr', null,
          MR.h('td', null, MR.h('span', { text: c.subject }), MR.h('br'),
            MR.h('span', { class: 'dr-small', text: (c.mailroom_accounts && c.mailroom_accounts.name) || '' })),
          MR.h('td', { text: c.held_reason || '' }),
          MR.h('td', null,
            MR.h('span', { text: (c.mailroom_lists && c.mailroom_lists.name) || '' }), MR.h('br'),
            MR.h('span', { class: 'dr-small', text: (c.mailroom_lists && c.mailroom_lists.consent_source) || 'no consent source recorded' })),
          MR.h('td', null, MR.h('a', { href: 'campaign.html?id=' + c.id, text: 'Read it' })),
          MR.h('td', null,
            MR.h('button', {
              class: 'dr-button', type: 'button', text: 'Release to the sender',
              onclick: function () {
                MR.api.update('mailroom_campaigns', 'id=eq.' + c.id, {
                  status: 'draft', held_reason: null, reviewed_at: new Date().toISOString()
                }).then(reload).catch(fail);
              }
            }), ' ',
            MR.h('button', {
              class: 'dr-button dr-button--warning', type: 'button', text: 'Cancel it',
              onclick: function () {
                MR.api.update('mailroom_campaigns', 'id=eq.' + c.id, {
                  status: 'cancelled', reviewed_at: new Date().toISOString()
                }).then(reload).catch(fail);
              }
            }))));
      });
      wrap.appendChild(section('Campaigns held for review', held.length
        ? table(['Campaign', 'Why it was held', 'List and consent', 'Content', 'Decision'], cBody)
        : MR.h('p', { class: 'dr-empty', text: 'Nothing held.' })));

      /* ---- sending domains waiting ---- */
      var abta = pendingDomains.filter(function (d) { return d.kind === 'abta_subdomain'; });
      var own = pendingDomains.filter(function (d) { return d.kind === 'own_domain'; });
      var dBody = MR.h('tbody');
      pendingDomains.forEach(function (d) {
        var recs = Array.isArray(d.records) ? d.records : [];
        var lines = MR.h('div');
        recs.forEach(function (r) {
          lines.appendChild(MR.h('p', { class: 'dr-small' },
            MR.h('strong', { text: (r.type || '') + ' ' }),
            MR.h('code', { class: 'mr-dns', text: r.name || '' }), ' → ',
            MR.h('code', { class: 'mr-dns', text: r.value || '' }),
            r.priority == null ? null : MR.h('span', { text: ' priority ' + r.priority })));
        });
        dBody.appendChild(MR.h('tr', null,
          MR.h('td', null, MR.h('span', { text: d.domain }), MR.h('br'),
            MR.h('span', { class: 'dr-small', text: (d.mailroom_accounts && d.mailroom_accounts.name) || '' })),
          MR.h('td', { text: d.kind === 'abta_subdomain' ? 'ABTA publishes these' : d.kind === 'alias' ? 'Nobody: an alias takes the keys of mail.abta.africa. If it stays pending, check the provider.' : d.kind === 'address' ? 'Nobody: one address confirmed by an emailed link. Sent through ABTA’s servers without the domain’s signature.' : 'The member publishes these' }),
          MR.h('td', null, recs.length ? lines : MR.h('span', { class: 'dr-small', text: 'No records returned yet.' })),
          MR.h('td', { text: d.status }),
          MR.h('td', null, d.kind === 'abta_subdomain'
            ? MR.h('button', {
                class: 'dr-button dr-button--secondary', type: 'button',
                text: d.dns_published ? 'Published' : 'Mark as published',
                disabled: !!d.dns_published,
                onclick: function () {
                  MR.api.update('mailroom_domains', 'id=eq.' + d.id, { dns_published: true })
                    .then(reload).catch(fail);
                }
              })
            : MR.h('span', { class: 'dr-small', text: 'Nothing for ABTA to do.' }))));
      });
      wrap.appendChild(section('Sending domains waiting to verify', pendingDomains.length
        ? table(['Domain', 'Who publishes', 'Records', 'Status', 'Action'], dBody)
        : MR.h('p', { class: 'dr-empty', text: 'Nothing waiting.' })));
      if (abta.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-small', text: abta.length + ' subdomain' + (abta.length === 1 ? '' : 's') + ' of mail.abta.africa need the records above published in ABTA’s DNS. The member cannot do this and is waiting on it.' }));
      }
      if (own.length) {
        wrap.appendChild(MR.h('p', { class: 'dr-small', text: own.length + ' member domain' + (own.length === 1 ? ' is' : 's are') + ' waiting on the member’s own DNS. Nothing for ABTA to do unless they ask for help.' }));
      }

      /* ---- what is scheduled ----
         Nothing to approve here. It is the answer to "what is about to go out
         from the shared domain", which matters on a morning when several
         members have queued the same hour. A campaign whose claim is stale
         means a dispatcher run that died partway and will be picked up again. */
      var qBody = MR.h('tbody');
      queued.forEach(function (c) {
        var acct = c.mailroom_accounts || {};
        var stale = c.dispatch_claimed_at &&
          (Date.now() - new Date(c.dispatch_claimed_at).getTime()) > 15 * 60 * 1000;
        var overdue = new Date(c.scheduled_for).getTime() < Date.now() - 10 * 60 * 1000;
        qBody.appendChild(MR.h('tr', null,
          MR.h('td', null, MR.h('a', { href: 'campaign.html?id=' + c.id, text: c.subject }),
            MR.h('br'), MR.h('span', { class: 'dr-small', text: acct.name || '' })),
          MR.h('td', { text: MR.dateTimeInZone(c.scheduled_for, acct.timezone || MR.TIMEZONE_FALLBACK) }),
          MR.h('td', { text: MR.dateTimeInZone(c.scheduled_for, 'Europe/London') }),
          MR.h('td', null, MR.h('span', {
            class: 'dr-tag dr-tag--' + (stale || overdue ? 'red' : 'blue'),
            text: stale ? 'Dispatch stalled' : overdue ? 'Overdue' : 'Waiting'
          }))));
      });
      wrap.appendChild(section('Scheduled campaigns', queued.length
        ? table(['Campaign', 'Due, sender’s time', 'Due, London time', 'State'], qBody)
        : MR.h('p', { class: 'dr-empty', text: 'Nothing scheduled.' })));
      wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'The dispatcher runs every five minutes, so a campaign shows as overdue only if it is more than ten minutes late. Anything stuck here means pg_cron or the dispatcher secrets need looking at.' }));

      /* ---- complaint watch ---- */
      var rBody = MR.h('tbody');
      recent.forEach(function (c) {
        var complaintRate = c.recipients ? (c.complained / c.recipients) : 0;
        var bounceRate = c.recipients ? (c.bounced / c.recipients) : 0;
        rBody.appendChild(MR.h('tr', null,
          MR.h('td', null, MR.h('span', { text: c.subject }), MR.h('br'),
            MR.h('span', { class: 'dr-small', text: (c.mailroom_accounts && c.mailroom_accounts.name) + ' · ' + (c.ref || '') })),
          MR.h('td', { text: MR.number(c.recipients) }),
          MR.h('td', { text: MR.percent(c.delivered, c.recipients) }),
          MR.h('td', null, MR.h('span', {
            class: 'dr-tag dr-tag--' + (bounceRate > 0.05 ? 'red' : bounceRate > 0.02 ? 'yellow' : 'green'),
            text: MR.percent(c.bounced, c.recipients)
          })),
          MR.h('td', null, MR.h('span', {
            class: 'dr-tag dr-tag--' + (complaintRate > 0.003 ? 'red' : complaintRate > 0.001 ? 'yellow' : 'green'),
            text: MR.percent(c.complained, c.recipients)
          })),
          MR.h('td', { text: MR.percent(c.unsubscribed, c.recipients) })));
      });
      wrap.appendChild(section('Recent campaigns', recent.length
        ? table(['Campaign', 'Recipients', 'Delivered', 'Bounces', 'Complaints', 'Unsubscribes'], rBody)
        : MR.h('p', { class: 'dr-empty', text: 'Nothing sent yet.' })));
      wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'Mailbox providers expect complaints below 0.3 per cent. An account passing that, or 5 per cent hard bounces, is suspended automatically the day after the campaign. Reinstating an account lets it send again straight away, so be sure the problem is fixed.' }));

      /* ---- suspended ---- */
      var suspBody = MR.h('tbody');
      suspended.forEach(function (a) {
        suspBody.appendChild(MR.h('tr', null,
          MR.h('td', { text: a.name }),
          MR.h('td', { text: a.suspension_reason || '' }),
          MR.h('td', null, MR.h('button', {
            class: 'dr-button dr-button--secondary', type: 'button', text: 'Reinstate',
            onclick: function () {
              MR.api.update('mailroom_accounts', 'id=eq.' + a.id, {
                status: 'active', suspension_reason: null, trust_level: 1
              }).then(reload).catch(fail);
            }
          }))));
      });
      wrap.appendChild(section('Suspended accounts', suspended.length
        ? table(['Organisation', 'Reason', 'Action'], suspBody)
        : MR.h('p', { class: 'dr-empty', text: 'None.' })));

      /* ---- closing an account on request ----
         A member can close its own account from its dashboard. This is for
         when they ask ABTA to do it instead, which is the route the data
         processing terms promise. The copy downloads here before anything is
         deleted, so it can be sent on to them. */
      var closeName = MR.h('input', { class: 'dr-input', id: 'mr-admin-close-name', type: 'text', autocomplete: 'off' });
      var closeStatus = MR.h('p', { class: 'dr-small', id: 'mr-admin-close-status' });
      wrap.appendChild(section('Close an account on request',
        MR.h('div', { class: 'mr-aside', id: 'mr-admin-close' },
          MR.h('p', { class: 'dr-small', text: 'Deletes the sender’s subscribers, lists and delivery records, and downloads a copy here first so you can send it to them. Campaigns already sent stay in the archive. Suppression records are never removed. This cannot be undone.' }),
          MR.h('div', { class: 'dr-form-group' },
            MR.h('label', { class: 'dr-label', for: 'mr-admin-close-name', text: 'Type the organisation name exactly' }),
            closeName),
          MR.h('button', {
            type: 'button', class: 'dr-button dr-button--warning', text: 'Export and close',
            onclick: function (e) {
              var typed = closeName.value.trim();
              if (!typed) { closeStatus.textContent = 'Type the organisation name first.'; return; }
              MR.api.select('mailroom_accounts?select=id,name,status&name=eq.' + encodeURIComponent(typed))
                .then(function (rows) {
                  var a = (rows || [])[0];
                  if (!a) throw new Error('no_such_account');
                  var btn = e.target;
                  btn.disabled = true;
                  closeStatus.textContent = 'Closing ' + a.name + '.';
                  return MR.fn('mailroom-account', {
                    action: 'close', account_id: a.id, confirm: a.name
                  }).then(function (r) {
                    var blob = new Blob([JSON.stringify(r.export, null, 2)], { type: 'application/json' });
                    var url = URL.createObjectURL(blob);
                    var link = MR.h('a', { href: url, download: 'ami-mailroom-' + a.id + '.json' });
                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
                    closeStatus.textContent = a.name + ' is closed, and the copy has downloaded. ' +
                      ((r.trouble && r.trouble.length) ? r.trouble.join(' ') : '');
                    btn.disabled = false;
                  });
                })
                .catch(function (err) {
                  var m = String(err && err.message || '');
                  closeStatus.textContent = /no_such_account/.test(m)
                    ? 'No account has exactly that name.'
                    : /scheduled or sending/i.test(m)
                      ? 'That account has a campaign scheduled or sending. Deal with that first.'
                      : 'That account could not be closed.';
                  e.target.disabled = false;
                  console.error(err);
                });
            }
          }),
          closeStatus)));
    }

    function reload() { location.reload(); }
    function fail(err) { alert('That action could not be completed.'); console.error(err); }
  });
})();
