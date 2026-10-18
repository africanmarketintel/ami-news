/* ==========================================================================
   AMI Mailroom – sign in with email and password, or a one-time code (sign-in.html)
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('mr-signin-form');
    if (!form) return;
    var emailField = form.querySelector('#si-email');
    var passGroup = document.getElementById('mr-password-group');
    var passField = form.querySelector('#si-password');
    var codeGroup = document.getElementById('mr-code-group');
    var codeField = form.querySelector('#si-code');
    var remember = form.querySelector('#si-remember');
    var submit = form.querySelector('#si-submit');
    var modeLink = document.getElementById('si-mode');
    var lead = document.getElementById('mr-lead');
    var next = MR.qs('next') || 'account.html';
    var useCode = false;

    // Already signed in on another AMI product: go straight through.
    if (!MR.cfg.demo && MR.auth.signedIn()) { location.replace(next); return; }

    document.getElementById('si-show').addEventListener('click', function () {
      var show = passField.type === 'password';
      passField.type = show ? 'text' : 'password';
      this.textContent = show ? 'Hide password' : 'Show password';
    });

    function setMode(code) {
      useCode = code;
      passGroup.hidden = code;
      codeGroup.hidden = true;
      submit.textContent = code ? 'Send me a code' : 'Sign in';
      modeLink.textContent = code ? 'Use my password instead' : 'Email me a code instead';
      lead.textContent = code ? 'We send a six-digit code to your email address.' : 'Use your AMI email address and password. The same sign-in works on AMI News, the Dealroom, the Mailroom and Recruiter.';
      MR.errors.clear(form);
    }
    modeLink.addEventListener('click', function (e) { e.preventDefault(); setMode(!useCode); });

    // After a code sign-in, offer a password so the next sign-in needs no code. Can be skipped.
    function offerPassword(go) {
      var h = MR.h, wrap = form.parentNode;
      document.title = 'Set a password';
      while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
      var pw = h('input', { class: 'dr-input', id: 'np-password', type: 'password', autocomplete: 'new-password' });
      var pw2 = h('input', { class: 'dr-input', id: 'np-confirm', type: 'password', autocomplete: 'new-password' });
      var save = h('button', { class: 'dr-button', type: 'submit', text: 'Save password' });
      var skip = h('a', { href: '#', text: 'Skip for now' });
      var show = h('button', { type: 'button', class: 'dr-button dr-button--secondary', style: 'margin-top:.6rem', text: 'Show passwords' });
      var f = h('form', { novalidate: 'novalidate' },
        h('div', { class: 'dr-form-group' }, h('label', { class: 'dr-label', for: 'np-password', text: 'New password' }), h('span', { class: 'dr-hint', text: 'At least 8 characters.' }), pw),
        h('div', { class: 'dr-form-group' }, h('label', { class: 'dr-label', for: 'np-confirm', text: 'Repeat the password' }), pw2, show),
        save);
      wrap.appendChild(h('h1', { text: 'Set a password' }));
      wrap.appendChild(h('p', { class: 'dr-lead', text: 'So you can sign in with your email and password next time, without waiting for a code. You can do this later.' }));
      wrap.appendChild(f);
      wrap.appendChild(h('p', { class: 'dr-small' }, skip));
      pw.focus();
      show.addEventListener('click', function () {
        var on = pw.type === 'password';
        pw.type = pw2.type = on ? 'text' : 'password';
        show.textContent = on ? 'Hide passwords' : 'Show passwords';
      });
      skip.addEventListener('click', function (e) { e.preventDefault(); go(); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        MR.errors.clear(f);
        if (pw.value.length < 8) { MR.errors.show(f, [{ id: 'np-password', message: 'Use at least 8 characters' }]); return; }
        if (pw.value !== pw2.value) { MR.errors.show(f, [{ id: 'np-confirm', message: 'The two passwords are not the same' }]); return; }
        save.setAttribute('aria-disabled', 'true');
        MR.auth.setPassword(pw.value).then(go).catch(function () {
          save.removeAttribute('aria-disabled');
          MR.errors.show(f, [{ id: 'np-password', message: 'We could not save that password. Try a longer or different one, or skip and do this later.' }]);
        });
      });
    }

    function validEmail() {
      var email = emailField.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        MR.errors.show(form, [{ id: 'si-email', message: email ? 'Enter an email address in the correct format, like name@example.com' : 'Enter your email address' }]);
        return null;
      }
      return email;
    }

    document.getElementById('si-forgot').addEventListener('click', function (e) {
      e.preventDefault();
      MR.errors.clear(form);
      var email = validEmail();
      if (!email) return;
      if (MR.cfg.demo) { MR.banner(form.parentNode, 'Preview only', 'Sign in works once the back end is connected.'); return; }
      MR.auth.recover(email).then(function () {
        MR.banner(form.parentNode, 'Check your email', 'If there is an account for ' + email + ', we have sent a link to set a new password.');
        MR.announce('If there is an account for ' + email + ', we have sent a link to set a new password.');
      }).catch(function () {
        MR.errors.show(form, [{ id: 'si-email', message: 'We could not send a reset link. Try again in a few minutes.' }]);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      MR.errors.clear(form);
      var email = validEmail();
      if (!email) return;
      var keep = remember.checked;

      if (MR.cfg.demo) {
        MR.banner(form.parentNode, 'Preview only', 'Sign in works once the back end is connected.');
        return;
      }

      // Password
      if (!useCode) {
        if (!passField.value) { MR.errors.show(form, [{ id: 'si-password', message: 'Enter your password' }]); return; }
        MR.auth.signIn(email, passField.value, keep).then(function () {
          location.href = next;
        }).catch(function (err) {
          var msg = err && err.status === 429
            ? 'You have tried to sign in too many times. Wait a few minutes and try again.'
            : 'Enter a correct email address and password, or email me a code instead.';
          MR.errors.show(form, [{ id: 'si-password', message: msg }]);
        });
        return;
      }

      // Code
      if (codeGroup.hidden) {
        MR.auth.sendCode(email).then(function () {
          codeGroup.hidden = false;
          codeField.focus();
          submit.textContent = 'Sign in';
          MR.announce('A code has been sent to ' + email);
        }).catch(function (err) {
          var wait = err && (err.status === 429 || /rate_limit/.test(err.code || ''));
          MR.errors.show(form, [{ id: 'si-email', message: wait ? 'Too many codes have been requested. Wait a few minutes and try again.' : 'We could not send a code to that address.' }]);
          console.error(err);
        });
        return;
      }
      MR.auth.verifyCode(email, codeField.value.trim(), keep).then(function () {
        offerPassword(function () { location.href = next; });
      }).catch(function () {
        MR.errors.show(form, [{ id: 'si-code', message: 'That code was not accepted. Check it or ask for a new one.' }]);
      });
    });
  });
})();
