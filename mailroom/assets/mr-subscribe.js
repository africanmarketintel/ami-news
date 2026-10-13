/* ==========================================================================
   AMI Mailroom – the hosted signup form

   A visitor arrives here from a member's own website, or from a link the
   member shared. Nobody is signed in, so everything comes from the form's
   slug in the URL.

   The wording above the button is the member's own, stored on the form and
   copied onto the subscriber when they sign up. That is what makes the list
   auditable a year later, so it is never paraphrased here.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-subscribe');
    if (!wrap) return;

    var slug = MR.qs('f') || MR.qs('form');

    if (MR.cfg.demo) { render(MR.sampleForm); return; }
    if (!slug) { missing(); return; }

    fetch(MR.cfg.url + '/functions/v1/mailroom-subscribe?slug=' + encodeURIComponent(slug), {
      headers: { apikey: MR.cfg.key }
    }).then(function (r) { return r.json(); })
      .then(function (form) {
        if (form.error) throw new Error(form.error);
        render(form);
      })
      .catch(missing);

    function missing() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'That form is not here' }));
      wrap.appendChild(MR.h('p', { class: 'dr-empty', text: 'The link may be wrong, or the sender may have closed the form. Ask them for a current one.' }));
    }

    function render(form) {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: form.headline || ('Subscribe to ' + form.sender_name) }));
      if (form.blurb) wrap.appendChild(MR.h('p', { class: 'dr-lead', text: form.blurb }));

      var el = MR.h('form', { id: 'mr-subscribe-form', novalidate: true });

      el.appendChild(field('s-email', 'Email address', 'email', 'email'));
      if (form.ask_name) el.appendChild(field('s-name', 'Your name', 'text', 'name'));
      if (form.ask_organisation) el.appendChild(field('s-org', 'Organisation', 'text', 'organization'));
      if (form.ask_country) el.appendChild(field('s-country', 'Country', 'text', 'country-name'));

      var topicBoxes = [];
      if ((form.topics || []).length) {
        var group = MR.h('fieldset', { class: 'dr-form-group', id: 'mr-subscribe-topics' },
          MR.h('legend', { class: 'dr-label', text: 'What would you like to hear about?' }));
        form.topics.forEach(function (t, i) {
          var id = 's-topic-' + i;
          var box = MR.h('input', { class: 'dr-choice__input', id: id, type: 'checkbox', value: t });
          topicBoxes.push(box);
          group.appendChild(MR.h('div', { class: 'dr-choice' }, box,
            MR.h('label', { class: 'dr-choice__label', for: id, text: t })));
        });
        el.appendChild(group);
      }

      // The honeypot. Hidden from people and from screen readers alike, and
      // irresistible to a naive bot. The position is inline rather than a
      // class, because a honeypot that depends on a stylesheet loading is a
      // visible field with a confusing label the day that stylesheet changes.
      el.appendChild(MR.h('div', {
        'aria-hidden': 'true',
        style: 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden'
      },
        MR.h('label', { for: 's-website', text: 'Leave this blank' }),
        MR.h('input', { id: 's-website', type: 'text', tabindex: '-1', autocomplete: 'off' })));

      // The member's own words, shown exactly as stored.
      el.appendChild(MR.h('p', { class: 'dr-small', id: 'mr-subscribe-consent', text: form.consent_wording }));

      el.appendChild(MR.h('button', { class: 'dr-button', type: 'submit' }, 'Subscribe'));
      el.appendChild(MR.h('p', { class: 'dr-small', text: 'Sent through AMI Mailroom on behalf of ' + form.sender_name + '. Every email has an unsubscribe link, and you can manage every sender on the platform from one page.' }));

      el.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById('s-email').value.trim();
        var errors = [];
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          errors.push({ id: 's-email', message: 'Enter an email address, such as name@example.com' });
        }
        if (MR.errors.show(el, errors)) return;

        if (MR.cfg.demo) {
          done('Preview only. On the live form you would be subscribed now.');
          return;
        }

        var button = el.querySelector('button[type=submit]');
        button.disabled = true;
        button.textContent = 'Subscribing…';

        fetch(MR.cfg.url + '/functions/v1/mailroom-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: MR.cfg.key },
          body: JSON.stringify({
            slug: slug,
            email: email,
            full_name: value('s-name'),
            organisation: value('s-org'),
            country: value('s-country'),
            topics: topicBoxes.filter(function (b) { return b.checked; })
              .map(function (b) { return b.value; }),
            website: document.getElementById('s-website').value
          })
        }).then(function (r) { return r.json(); })
          .then(function (out) {
            if (out.error === 'invalid_email') {
              button.disabled = false;
              button.textContent = 'Subscribe';
              MR.errors.show(el, [{ id: 's-email', message: 'That address does not look right. Check it and try again.' }]);
              return;
            }
            if (out.redirect) { window.location.href = out.redirect; return; }
            done('Thank you. You are on the list.');
          })
          .catch(function () {
            button.disabled = false;
            button.textContent = 'Subscribe';
            MR.banner(wrap, 'That did not work', 'Please try again in a moment.', 'important');
          });
      });

      wrap.appendChild(el);

      function value(id) {
        var f = document.getElementById(id);
        return f ? f.value.trim() : null;
      }

      function done(message) {
        wrap.textContent = '';
        wrap.appendChild(MR.h('h1', { text: 'You are subscribed' }));
        wrap.appendChild(MR.h('p', { class: 'dr-lead', id: 'mr-subscribe-done', text: message }));
        wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'If a welcome email does not arrive in a few minutes, check your spam folder and mark it as not spam, so the rest reach you.' }));
      }
    }

    function field(id, label, type, autocomplete) {
      return MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: id, text: label }),
        MR.h('input', { class: 'dr-input', id: id, type: type, autocomplete: autocomplete }));
    }
  });
})();
