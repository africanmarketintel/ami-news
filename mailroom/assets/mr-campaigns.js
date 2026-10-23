/* ==========================================================================
   AMI Mailroom – every campaign (campaigns.html)
   One page that lists all of a sender's campaigns, most recently edited first,
   with a filter by status and a search on the subject line. Before this page
   existed the only list was the 20 newest on Your mailroom, and the
   "Campaigns" menu link opened a blank new campaign.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  var PAGE = 25;
  var FILTERS = [
    ['', 'All'], ['draft', 'Drafts'], ['scheduled', 'Scheduled'], ['sent', 'Sent'], ['held', 'Held for review']
  ];
  var FIELDS = 'id,ref,subject,status,sent_at,scheduled_for,recipients,clicked,created_at,updated_at';

  function tagFor(status) {
    return { sent: 'green', sending: 'blue', scheduled: 'blue', cancelled: 'grey', draft: 'grey', held: 'grey' }[status] || 'grey';
  }

  function init() {
    var wrap = document.getElementById('mr-campaigns');
    if (!wrap) return;

    var state = { status: '', q: '', rows: [], more: false, loading: false, tz: 'Africa/Lagos', seq: 0 };

    var toolbar = MR.h('div', { class: 'mr-camps-bar' });
    var chips = MR.h('div', { class: 'mr-camps-bar__chips', role: 'group', 'aria-label': 'Show campaigns that are' });
    var chipBtns = {};
    FILTERS.forEach(function (f) {
      var b = MR.h('button', {
        type: 'button', class: 'mr-chip', 'aria-pressed': f[0] === '' ? 'true' : 'false', text: f[1],
        onclick: function () { setStatus(f[0]); }
      });
      chipBtns[f[0]] = b;
      chips.appendChild(b);
    });
    var search = MR.h('input', {
      class: 'dr-input mr-camps-bar__search', id: 'mr-camps-q', type: 'search',
      autocomplete: 'off', enterkeyhint: 'search'
    });
    var searchTimer = null;
    search.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { state.q = search.value.trim(); load(true); }, 300);
    });
    toolbar.appendChild(chips);
    toolbar.appendChild(MR.h('div', { class: 'mr-camps-bar__find' },
      MR.h('label', { class: 'dr-label', for: 'mr-camps-q', text: 'Search subject lines' }), search));

    var status = MR.h('p', { class: 'dr-small', role: 'status', 'aria-live': 'polite' });
    var list = MR.h('ul', { class: 'mr-camps' });
    var moreBtn = MR.h('button', {
      type: 'button', class: 'dr-button dr-button--secondary', text: 'Show more',
      onclick: function () { load(false); }
    });
    moreBtn.hidden = true;

    wrap.textContent = '';
    wrap.appendChild(MR.h('h1', { text: 'Campaigns' }));
    wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'Every campaign you have written, with the one you edited last at the top.' }));
    wrap.appendChild(MR.h('p', null, MR.h('a', { class: 'dr-button', href: 'campaign.html', text: 'Write a campaign' })));
    wrap.appendChild(toolbar);
    wrap.appendChild(status);
    wrap.appendChild(list);
    wrap.appendChild(MR.h('p', null, moreBtn));

    function setStatus(s) {
      state.status = s;
      Object.keys(chipBtns).forEach(function (k) { chipBtns[k].setAttribute('aria-pressed', k === s ? 'true' : 'false'); });
      load(true);
    }

    function demoRows() {
      return (MR.sampleCampaigns || []).filter(function (c) {
        return (!state.status || c.status === state.status) &&
          (!state.q || String(c.subject || '').toLowerCase().indexOf(state.q.toLowerCase()) !== -1);
      }).sort(function (a, b) {
        return String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''));
      });
    }

    function fetchRows(offset) {
      if (MR.cfg.demo) return Promise.resolve(demoRows().slice(offset, offset + PAGE));
      var q = 'mailroom_campaigns?select=' + FIELDS + '&order=updated_at.desc&limit=' + PAGE + '&offset=' + offset;
      if (state.status) q += '&status=eq.' + encodeURIComponent(state.status);
      if (state.q) q += '&subject=ilike.' + encodeURIComponent('*' + state.q.replace(/[*,()]/g, ' ') + '*');
      return MR.api.select(q);
    }

    function load(fresh) {
      if (state.loading && !fresh) return;
      var mine = ++state.seq;
      state.loading = true;
      if (fresh) { state.rows = []; draw(); status.textContent = 'Loading campaigns.'; }
      fetchRows(state.rows.length).then(function (rows) {
        return MR.loadSnippets(rows || []);
      }).then(function (rows) {
        if (mine !== state.seq) return;
        rows = rows || [];
        state.rows = state.rows.concat(rows);
        state.more = rows.length === PAGE;
        state.loading = false;
        draw();
      }).catch(function (err) {
        if (mine !== state.seq) return;
        state.loading = false;
        MR.loadFailed(wrap, err);
      });
    }

    function draw() {
      list.textContent = '';
      state.rows.forEach(function (c) {
        var when = c.sent_at ? 'Sent ' + MR.date(c.sent_at)
          : c.scheduled_for ? 'Scheduled for ' + MR.dateTimeInZone(c.scheduled_for, state.tz)
          : 'Edited ' + MR.dateTimeInZone(c.updated_at || c.created_at, state.tz);
        var stats = MR.h('div', { class: 'mr-camps__stats' });
        if (c.recipients) {
          stats.appendChild(MR.h('span', { text: MR.number(c.recipients) + ' sent' }));
          stats.appendChild(MR.h('span', { text: MR.percent(c.clicked, c.recipients) + ' clicked' }));
        }
        stats.appendChild(MR.h('span', { class: 'dr-tag dr-tag--' + tagFor(c.status), text: MR.CAMPAIGN_STATUS[c.status] || c.status }));
        list.appendChild(MR.h('li', { class: 'mr-camps__row' },
          MR.h('div', null,
            MR.h('p', { class: 'mr-camps__name' }, MR.h('a', { href: 'campaign.html?id=' + encodeURIComponent(c.id), text: MR.campaignName(c) })),
            MR.h('p', { class: 'mr-camps__sub', text: when + (c.ref ? ' · ' + c.ref : '') })),
          stats));
      });
      moreBtn.hidden = !state.more;
      if (state.loading && !state.rows.length) return;
      var n = state.rows.length;
      var filtered = state.status || state.q;
      status.textContent = n
        ? (state.more ? n + ' campaigns shown. There are more.' : n === 1 ? '1 campaign.' : n + ' campaigns.')
        : filtered ? 'No campaign matches. Clear the search or choose All.' : 'You have not written a campaign yet.';
    }

    if (MR.cfg.demo) { state.tz = (MR.sampleAccount && MR.sampleAccount.timezone) || state.tz; load(true); return; }
    MR.requireAccount(wrap).then(function (account) {
      state.tz = account.timezone || state.tz;
      load(true);
    }).catch(function (err) { if (err && err.message !== 'signed out' && err.message !== 'no account') MR.loadFailed(wrap, err); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
