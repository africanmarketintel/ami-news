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

    // Says why Supabase refused the password, when it tells us. The site only
    // checks for 8 characters; the project's own rules can be stricter.
    function passwordMessage(err) {
      var code = (err && err.code) || '', reasons = (err && err.reasons) || [];
      if (code === 'same_password') return 'That is already your password. Choose a different one, or skip this step.';
      if (code === 'weak_password' || reasons.length) {
        var why = [];
        if (reasons.indexOf('length') > -1) why.push('It is shorter than the minimum we accept.');
        if (reasons.indexOf('characters') > -1) why.push('It needs a mix of letters, numbers and symbols.');
        if (reasons.indexOf('pwned') > -1) why.push('It appears in lists of passwords exposed in data breaches.');
        return 'That password is not strong enough. ' + (why.length ? why.join(' ') + ' ' : '') + 'Try a different one, or skip and do this later.';
      }
      if (/reauthentication/.test(code)) return 'For security, sign in again with a new code, then set your password. Or skip and do this later.';
      if (err && err.status === 401) return 'Your sign-in has expired. Sign in again with a new code, then set your password.';
      return 'We could not save that password. Try a longer or different one, or skip and do this later.';
    }

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
        MR.auth.setPassword(pw.value).then(go).catch(function (err) {
          save.removeAttribute('aria-disabled');
          console.error(err);
          MR.errors.show(f, [{ id: 'np-password', message: passwordMessage(err) }]);
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
          // Say what actually went wrong. Supabase answers a wrong password,
          // an account that has no password yet (made with an email code) and
          // an unknown address with the same reply, so those share a message
          // that names all three. A missing status means the request never
          // reached Supabase, which points at the site's connection settings.
          var msg;
          if (err && err.status === 429) {
            msg = 'You have tried to sign in too many times. Wait a few minutes and try again.';
          } else if (err && err.code === 'email_not_confirmed') {
            msg = 'Your email address has not been confirmed yet. Choose Email me a code instead to confirm it.';
          } else if (!err || !err.status) {
            msg = 'We could not reach the sign-in service. Check your connection and try again. If it keeps happening, email ami@abta.africa.';
          } else {
            msg = 'The email address or password is not right, or this account has no password yet. Email me a code instead, or choose Forgotten your password? to set one.';
          }
          console.error('Sign in failed:', err && err.status, err && err.code, err && err.message);
          MR.errors.show(form, [{ id: 'si-password', message: msg }]);
        });
        return;
      }

      // Code
      if (codeGroup.hidden) {
        MR.auth.sendCode(email).then(function () {
          codeGroup.hidden = false;
          if (!document.getElementById('si-resend')) {
            var note = MR.h('p', { class: 'dr-small', id: 'si-resend-note', role: 'status' });
            var again = MR.resendCode(function () { return (document.getElementById('si-email').value || '').trim(); }, note);
            again.id = 'si-resend';
            codeGroup.appendChild(MR.h('p', null, again));
            codeGroup.appendChild(note);
          }
          codeField.focus();
          submit.textContent = 'Sign in';
          MR.announce('A code has been sent to ' + email);
        }).catch(function (err) {
          MR.errors.show(form, [{ id: 'si-email', message: MR.codeError(err) }]);
          console.error(err);
        });
        return;
      }
      MR.auth.verifyCode(email, codeField.value.trim(), keep).then(function () {
        offerPassword(function () { location.href = next; });
      }).catch(function () {
        MR.errors.show(form, [{ id: 'si-code', message: 'That code was not accepted. Check it, or send a new code.' }]);
      });
    });
  });
})();
