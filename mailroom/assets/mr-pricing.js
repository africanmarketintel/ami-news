/* ==========================================================================
   AMI Mailroom – the plan cards on the pricing page

   The cards, their prices and the Monthly / Yearly switch are written into
   pricing.html, so the page reads in full without scripts. This file only
   makes the switch work and sends a chosen plan to checkout.

   The prices on the cards are the same numbers as in mailroom_plans
   (price_minor for a month, price_year_minor for a year). Checkout charges
   the numbers in the database, so if one is changed there, change the card
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
    var toggle = root.querySelector('.mr-bill');
    var cards = [].slice.call(root.querySelectorAll('.mr-plancard[data-plan]'));
    var interval = 'month';

    function gbp(minor) {
      var amount = minor / 100;
      try {
        return new Intl.NumberFormat('en-GB', {
          style: 'currency', currency: 'GBP', minimumFractionDigits: amount % 1 === 0 ? 0 : 2
        }).format(amount);
      } catch (e) { return '£' + amount.toFixed(amount % 1 === 0 ? 0 : 2); }
    }

    function say(text, important) {
      if (!msg) return;
      msg.textContent = text || '';
      msg.className = 'dr-small mr-pricing__msg' + (important ? ' mr-pricing__msg--important' : '');
    }

    function draw() {
      cards.forEach(function (card) {
        var m = parseInt(card.getAttribute('data-month'), 10);
        var y = parseInt(card.getAttribute('data-year'), 10);
        var amount = card.querySelector('.mr-plancard__amount');
        var per = card.querySelector('.mr-plancard__per');
        var note = card.querySelector('.mr-plancard__note');
        if (interval === 'year') {
          amount.textContent = gbp(y);
          per.textContent = ' a year';
          note.textContent = 'Paying monthly for a year costs ' + gbp(m * 12) + '.';
        } else {
          amount.textContent = gbp(m);
          per.textContent = ' a month';
          note.textContent = 'Or ' + gbp(y) + ' a year: 12 months for the price of 11.';
        }
      });
      [].slice.call(toggle.querySelectorAll('.mr-bill__btn')).forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-interval') === interval ? 'true' : 'false');
      });
    }

    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('.mr-bill__btn') : null;
        if (!b) return;
        interval = b.getAttribute('data-interval') === 'year' ? 'year' : 'month';
        draw();
      });
    }

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
      link.textContent = 'Opening the payment page…';
      say('');
      MR.billing.start(plan, interval).then(function (r) {
        if (r && r.leaving) return;
        link.removeAttribute('aria-disabled');
        link.textContent = label;
        if (r && r.updated) {
          say('Your plan has been changed. Stripe charges or credits the difference. It can take a minute to show on your account page.');
        }
      }, function (err) {
        link.removeAttribute('aria-disabled');
        link.textContent = label;
        say(err.message, true);
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
  });
})();
