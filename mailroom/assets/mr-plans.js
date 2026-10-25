/* ==========================================================================
   AMI Mailroom – what a plan costs, on the sending policy page

   The plans come from mailroom_plans rather than the page, so changing a
   price is an update statement and nothing is rebuilt or redeployed. Only
   plans marked as offered are readable, so a staged or retired price never
   appears here.

   If the fetch fails the page keeps the plain limits table that was built
   into it, which is why that table is still there.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  function money(plan) {
    if (plan.price_minor === null || plan.price_minor === undefined) return 'Talk to us';
    if (plan.price_minor === 0) return plan.code === 'trial' ? '14 days free' : 'Included';
    var amount = plan.price_minor / 100;
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency', currency: plan.currency || 'GBP',
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2
      }).format(amount);
    } catch (e) {
      return (plan.currency || 'GBP') + ' ' + amount.toFixed(2);
    }
  }

  function per(plan) {
    if (!plan.price_minor) return '';
    return plan.interval === 'year' ? ' a year' : ' a month';
  }

  function card(plan) {
    var box = MR.h('div', { class: 'dr-status-card' },
      MR.h('h3', { class: 'dr-h', text: plan.name }),
      MR.h('p', { class: 'dr-price-box__amount' },
        MR.h('span', { text: money(plan) }),
        MR.h('span', { class: 'dr-small', text: per(plan) })));

    if (plan.summary) {
      box.appendChild(MR.h('p', { class: 'dr-small', text: plan.summary }));
    }
    box.appendChild(MR.h('ul', { class: 'dr-list' },
      MR.h('li', { text: MR.number(plan.monthly_send_limit) + (plan.code === 'trial' ? ' emails in total' : ' emails a month') }),
      MR.h('li', { text: MR.number(plan.max_subscribers) + ' subscribers held' }),
      MR.h('li', { text: 'No daily cap' })));
    return box;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-plans');
    if (!wrap) return;

    var plans = MR.cfg.demo ? (MR.samplePlans || []) : null;

    function draw(list) {
      if (!list || !list.length) return;          // keep the built-in table
      wrap.textContent = '';
      var grid = MR.h('div', { class: 'dr-grid dr-grid--thirds' });
      list.forEach(function (p) { grid.appendChild(card(p)); });
      wrap.appendChild(grid);
      if (list.length === 1) {
        wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'Need more than this? Tell us what you are sending and we will work it out with you.' }));
      }
    }

    if (plans) { draw(plans); return; }

    MR.api.select('mailroom_plans?select=code,name,summary,price_minor,currency,interval,monthly_send_limit,max_subscribers&order=sort_order')
      .then(draw)
      .catch(function (err) {
        // The built-in table stays on the page, so a visitor still sees the
        // limits even when the database cannot be reached.
        console.error('plans could not be loaded', err);
      });
  });
})();
