/* ==========================================================================
   AMI Mailroom – sign in with a one-time code (sign-in.html)
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('mr-signin-form');
    if (!form) return;
    var emailField = form.querySelector('#si-email');
    var codeGroup = document.getElementById('mr-code-group');
    var codeField = form.querySelector('#si-code');
    var next = MR.qs('next') || 'account.html';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = emailField.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        MR.errors.show(form, [{ id: 'si-email', message: 'Enter an email address in the correct format, like name@example.com' }]);
        return;
      }
      MR.errors.clear(form);

      if (MR.cfg.demo) {
        MR.banner(form.parentNode, 'Preview only', 'Sign in works once the back end is connected.');
        return;
      }

      if (codeGroup.hidden) {
        MR.auth.sendCode(email).then(function () {
          codeGroup.hidden = false;
          codeField.focus();
          form.querySelector('button[type="submit"]').textContent = 'Sign in';
          MR.announce('A code has been sent to ' + email);
        }).catch(function (err) {
          MR.errors.show(form, [{ id: 'si-email', message: 'We could not send a code to that address.' }]);
          console.error(err);
        });
        return;
      }

      MR.auth.verifyCode(email, codeField.value.trim()).then(function () {
        location.href = next;
      }).catch(function () {
        MR.errors.show(form, [{ id: 'si-code', message: 'That code was not accepted. Check it or ask for a new one.' }]);
      });
    });
  });
})();
