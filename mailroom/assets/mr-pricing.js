/* ==========================================================================
   AMI Mailroom – the plan cards and their volume sliders on the pricing page

   Basic, Plus and Max each have a slider of volumes. The cards, the table of
   every volume, the prices and the Monthly / Yearly switch are written into
   pricing.html, so the page reads in full without scripts. This file makes the
   switch work, turns each card's volumes into a slider (built from the table,
   so there is one list of prices on the page) and sends a chosen plan to
   checkout.

   The prices in the table are the same numbers as in mailroom_plans
   (price_minor for a month, price_year_minor for a year). Checkout charges
   the numbers in the database, so if one is changed there, change the table
   here too: the data-month and data-year attributes, in pence.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('mr-plan-cards');
    if (!root) return;
    var msg = document.getElementById('mr-pricing-msg');
    var toggles = [].slice.call(root.querySelectorAll('.mr-bill'));
    var interval = 'month';
    var member = null;   // a signed-in member's account, once it has loaded
    var yourPlan = document.getElementById('mr-yourplan');

    function gbp(minor) {
      var amount = minor / 100;
      try {
        return new Intl.NumberFormat('en-GB', {
          style: 'currency', currency: 'GBP', minimumFractionDigits: amount % 1 === 0 ? 0 : 2
        }).format(amount);
      } catch (e) { return '£' + amount.toFixed(amount % 1 === 0 ? 0 : 2); }
    }
    function count(n) { return n.toLocaleString('en-GB'); }

    function say(text, important) {
      if (!msg) return;
      msg.textContent = text || '';
      msg.className = 'dr-small mr-pricing__msg' + (important ? ' mr-pricing__msg--important' : '');
    }

    // Every volume, from the table: the one list of prices on the page.
    var steps = [].slice.call(root.querySelectorAll('#mr-volume-table tbody tr[data-plan]')).map(function (r) {
      return {
        plan: r.getAttribute('data-plan'),
        band: r.getAttribute('data-band'),
        emails: parseInt(r.getAttribute('data-emails'), 10),
        subs: parseInt(r.getAttribute('data-subs'), 10),
        month: parseInt(r.getAttribute('data-month'), 10),
        year: parseInt(r.getAttribute('data-year'), 10),
        row: r,
        link: r.querySelector('a[data-choose]'),
        label: (r.querySelector('a[data-choose]') || {}).textContent || 'Choose'
      };
    });

    // Each plan card: its volumes, its slider and where to draw the price.
    var cards = [].slice.call(root.querySelectorAll('.mr-plancard[data-band]')).map(function (el) {
      var band = el.getAttribute('data-band');
      var own = steps.filter(function (s) { return s.band === band; });
      var wrap = el.querySelector('.mr-band');
      var input = el.querySelector('.mr-slider__input');
      var card = {
        el: el, steps: own, wrap: wrap, input: input,
        amount: el.querySelector('.mr-plancard__amount'),
        per: el.querySelector('.mr-plancard__per'),
        from: el.querySelector('.mr-plancard__from'),
        note: el.querySelector('.mr-plancard__note'),
        emails: el.querySelector('.mr-plancard__emails'),
        subs: el.querySelector('.mr-plancard__subs'),
        out: el.querySelector('.mr-band__emails'),
        go: el.querySelector('[data-choose]'),
        name: (el.querySelector('h3') || {}).textContent || '',
        live: false
      };
      card.label = card.go ? card.go.textContent : 'Choose';
      if (wrap && input && own.length) {
        input.max = String(own.length - 1);
        wrap.hidden = false;
        card.live = true;
        input.addEventListener('input', draw);
      }
      return card;
    });

    function current(card) {
      return card.steps[card.live ? parseInt(card.input.value, 10) || 0 : 0] || card.steps[0];
    }

    // For a member already on a paid plan, mark the volume that is theirs and
    // call the others a switch rather than a purchase.
    function labelFor(st, fallback) {
      if (!member || !member.step) return fallback;
      if (st === member.step) {
        return interval === member.interval ? 'Your plan'
          : 'Switch to ' + (interval === 'year' ? 'yearly' : 'monthly') + ' billing';
      }
      return 'Switch to this plan';
    }
    function isCurrent(st) {
      return !!(member && member.step && st === member.step && interval === member.interval);
    }
    function setLabel(link, text, current) {
      if (!link || link.getAttribute('data-busy') === 'true') return;
      link.textContent = text;
      link.classList.toggle('mr-current', current);
      if (current) link.setAttribute('aria-disabled', 'true'); else link.removeAttribute('aria-disabled');
    }
    function labels() {
      cards.forEach(function (c) {
        if (c.go) setLabel(c.go, labelFor(current(c), c.label), isCurrent(current(c)));
      });
      steps.forEach(function (st) {
        setLabel(st.link, labelFor(st, st.label), isCurrent(st));
        st.row.classList.toggle('mr-volume__row--current', !!(member && member.step === st));
      });
    }

    // One sentence above the plans saying where this member stands.
    function describe(a) {
      if (!yourPlan) return;
      var text = '';
      var plan = MR.planLabel(a.plan_code);
      if (plan) {
        text = 'Your plan: ' + plan + (a.billing_interval === 'year' ? ', billed yearly. ' : a.billing_interval === 'month' ? ', billed monthly. ' : '. ') +
          'Choosing another volume changes your plan. Stripe charges or credits the difference.';
      } else if (a.plan_code === 'trial') {
        var ts = MR.trialState(a);
        text = ts.state === 'not_offered'
          ? 'A free trial has already been used with this email address. Choose a plan to start sending. Your account, lists and campaigns stay as they are.'
          : ts.state === 'ended'
            ? 'Your trial has ended. Choose a plan to start sending again. Your account, lists and campaigns stay as they are.'
            : 'You are on the free trial' + (ts.days ? ', ' + ts.days + (ts.days === 1 ? ' day' : ' days') + ' left' : '') +
              '. Choose a plan at any time. Your lists and campaigns carry over.';
      }
      if (text) { yourPlan.textContent = text; yourPlan.hidden = false; }
    }

    function draw() {
      cards.forEach(function (card) {
        var st = current(card);
        if (!st) return;
        if (card.from) card.from.hidden = card.live;
        card.amount.textContent = gbp(interval === 'year' ? st.year : st.month);
        card.per.textContent = interval === 'year' ? ' a year' : ' a month';
        card.note.textContent = interval === 'year'
          ? 'Paying monthly for a year costs ' + gbp(st.month * 12) + '.'
          : 'Or ' + gbp(st.year) + ' a year: 12 months for the price of 11.';
        if (card.live) {
          card.out.textContent = count(st.emails);
          card.input.setAttribute('aria-valuetext', count(st.emails) + ' emails a month');
          if (card.emails) card.emails.textContent = count(st.emails) + ' emails a month';
          if (card.subs) card.subs.textContent = count(st.subs) + ' subscribers held';
          card.go.setAttribute('data-choose', st.plan);
        }
      });
      steps.forEach(function (st) {
        var on = cards.some(function (c) { return c.live && current(c) === st; });
        st.row.classList.toggle('mr-volume__row--on', on);
      });
      labels();
      toggles.forEach(function (t) {
        [].slice.call(t.querySelectorAll('.mr-bill__btn')).forEach(function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-interval') === interval ? 'true' : 'false');
        });
      });
    }

    toggles.forEach(function (t) {
      t.hidden = false;
      t.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('.mr-bill__btn') : null;
        if (!b) return;
        interval = b.getAttribute('data-interval') === 'year' ? 'year' : 'month';
        draw();
      });
    });

    function choose(plan, link) {
      if (MR.cfg.demo) {
        say('Preview only: on the live service this opens the payment page.');
        return;
      }
      if (!MR.auth.signedIn()) {
        // New here: the trial comes first. The plan is remembered for this
        // tab so the account page can offer to finish the choice.
        MR.billing.remember(plan, interval);
        location.href = 'create-account.html';
        return;
      }
      var label = link.textContent;
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('data-busy', 'true');
      link.textContent = 'Opening the payment page…';
      say('');
      MR.billing.start(plan, interval).then(function (r) {
        if (r && r.leaving) return;
        link.removeAttribute('data-busy');
        link.removeAttribute('aria-disabled');
        link.textContent = label;
        if (r && r.updated) {
          say('Your plan has been changed. Stripe charges or credits the difference. It can take a minute to show on your account page.');
        }
        labels();
      }, function (err) {
        link.removeAttribute('data-busy');
        link.removeAttribute('aria-disabled');
        link.textContent = label;
        say(err.message, true);
        labels();
      });
    }

    root.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('[data-choose]') : null;
      if (!a) return;
      e.preventDefault();
      if (a.getAttribute('aria-disabled') === 'true') return;
      choose(a.getAttribute('data-choose'), a);
    });

    if (MR.qs && MR.qs('checkout') === 'cancelled') {
      say('Payment cancelled. Nothing was charged.');
    }
    draw();

    // A signed-in member sees which volume is theirs. The page reads the same
    // without this, so a failure is not reported.
    if (!MR.cfg.demo && MR.auth && MR.auth.signedIn() && MR.api && MR.api.select) {
      MR.api.select('mailroom_accounts?select=id,plan_code,billing_interval,billing_status,trial_ends_at,created_at&limit=1').then(function (rows) {
        var a = rows && rows[0];
        if (!a) return;
        member = { account: a, step: null, interval: a.billing_interval === 'year' ? 'year' : 'month' };
        steps.forEach(function (st) { if (st.plan === a.plan_code) member.step = st; });
        if (member.step) {
          interval = member.interval;
          cards.forEach(function (c) {
            var at = c.steps.indexOf(member.step);
            if (c.live && at > -1) c.input.value = String(at);
          });
        }
        describe(a);
        draw();
      }, function () { /* leave the page as it is */ });
    }
  });
})();
