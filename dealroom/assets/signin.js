/* Deal Room v2 – sign in and forgotten password */
(function () {
  'use strict';
  var DR = window.DR, h = DR.h;

  function safeReturn(v) { return /^[a-z-]+\.html(\?[^#]*)?$/.test(v || '') ? v : 'account.html'; }

  function summary(errors) {
    return h('div', { class: 'dr-error-summary', tabindex: '-1', role: 'alert', 'aria-labelledby': 'es-title' },
      h('h2', { class: 'dr-error-summary__title', id: 'es-title', text: 'There is a problem' }),
      h('ul', { class: 'dr-error-summary__list' }, errors.map(function (e) {
        var a = h('a', { href: '#' + e.id, text: e.message });
        a.addEventListener('click', function (ev) { var t = document.getElementById(e.id); if (t) { ev.preventDefault(); t.focus(); } });
        return h('li', null, a);
      })));
  }

  function input(id, label, type, opts, err) {
    opts = opts || {};
    var group = h('div', { class: 'dr-form-group' + (err ? ' dr-form-group--error' : '') },
      h('label', { class: 'dr-label', for: id, text: label }),
      opts.hint ? h('div', { class: 'dr-hint', id: id + '-hint', text: opts.hint }) : null,
      err ? h('p', { class: 'dr-error-message', id: id + '-error' }, h('span', { class: 'dr-visually-hidden', text: 'Error: ' }), err) : null);
    var el = h('input', { class: 'dr-input dr-input--w30' + (err ? ' dr-input--error' : ''), id: id, name: id, type: type, autocomplete: opts.autocomplete, spellcheck: 'false',
      'aria-describedby': [opts.hint ? id + '-hint' : null, err ? id + '-error' : null].filter(Boolean).join(' ') || null });
    el.value = opts.value || '';
    group.appendChild(el);
    if (type === 'password') {
      var t = h('button', { type: 'button', class: 'dr-button dr-button--secondary', style: 'margin-top:.6rem', 'aria-controls': id, text: 'Show password' });
      t.addEventListener('click', function () { var show = el.type === 'password'; el.type = show ? 'text' : 'password'; t.textContent = show ? 'Hide password' : 'Show password'; });
      group.appendChild(t);
    }
    return group;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var app = document.getElementById('app');
    var view = DR.params.get('view');
    var ret = safeReturn(DR.params.get('return'));
    if (view === 'forgot') return forgot(app, [], '');
    if (DR.session.active() && !DR.params.get('reason')) { location.replace(ret); return; }
    signIn(app, [], {}, ret);
  });

  function signIn(app, errors, values, ret) {
    DR.setTitle('Sign in', errors.length > 0);
    DR.clear(app);
    var w = h('div', { class: 'dr-narrow', style: 'margin-top:2rem' });
    app.appendChild(w);
    if (errors.length) w.appendChild(summary(errors));
    var reason = DR.params.get('reason');
    if (reason === 'timeout') w.appendChild(h('div', { class: 'dr-banner dr-banner--important', role: 'region', 'aria-labelledby': 'nb-title' }, h('p', { class: 'dr-banner__title', id: 'nb-title', text: 'Important' }), h('div', { class: 'dr-banner__content' }, h('p', { text: 'You were signed out to protect your information. Sign in again to continue.' }))));
    if (reason === 'save') w.appendChild(h('div', { class: 'dr-inset' }, h('p', { text: 'Sign in to save opportunities to Your Deal Room.' })));

    w.appendChild(h('h1', { text: 'Sign in to the Deal Room' }));
    w.appendChild(h('p', { text: 'Use the email address and password for your Deal Room or African Market Intelligence account.' }));
    var err = function (id) { var e = errors.filter(function (x) { return x.id === id; })[0]; return e ? e.message : null; };
    var form = h('form', { novalidate: true },
      input('email', 'Email address', 'email', { autocomplete: 'email', value: values.email }, err('email')),
      input('password', 'Password', 'password', { autocomplete: 'current-password' }, err('password')),
      h('button', { type: 'submit', class: 'dr-button', text: 'Sign in' }));
    w.appendChild(form);
    w.appendChild(h('p', null, h('a', { href: 'sign-in.html?view=forgot', text: 'Forgotten your password?' })));
    w.appendChild(h('h2', { class: 'dr-h3', text: 'Not a member?' }));
    w.appendChild(h('p', null, h('a', { href: 'create-account.html', text: 'Join the Deal Room' })));
    if (errors.length) w.querySelector('.dr-error-summary').focus();

    var busy = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var email = form.email.value.trim(), password = form.password.value;
      var errs = [];
      if (!email) errs.push({ id: 'email', message: 'Enter your email address' });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errs.push({ id: 'email', message: 'Enter an email address in the correct format, like name@example.com' });
      if (!password) errs.push({ id: 'password', message: 'Enter your password' });
      if (errs.length) return signIn(app, errs, { email: email }, ret);
      busy = true;
      form.querySelector('button[type=submit]').setAttribute('aria-disabled', 'true');
      DR.auth.signIn(email, password).then(function (res) {
        busy = false;
        if (!res.ok) {
          var msg = res.status === 429 ? 'You have tried to sign in too many times. Wait a few minutes and try again' : 'Enter a correct email address and password';
          return signIn(app, [{ id: 'email', message: msg }], { email: email }, ret);
        }
        DR.session.save(res.data, email);
        location.href = ret;
      });
    });
  }

  function forgot(app, errors, value) {
    DR.setTitle('Reset your password', errors.length > 0);
    DR.clear(app);
    var w = h('div', { class: 'dr-narrow' });
    app.appendChild(h('a', { class: 'dr-back', href: 'sign-in.html', text: 'Back' }));
    app.appendChild(w);
    w.style.marginTop = '1.5rem';
    if (errors.length) w.appendChild(summary(errors));
    w.appendChild(h('h1', { text: 'Reset your password' }));
    w.appendChild(h('p', { text: 'Enter the email address you use for the Deal Room. We will send you a link to create a new password.' }));
    var form = h('form', { novalidate: true },
      input('email', 'Email address', 'email', { autocomplete: 'email', value: value }, errors.length ? errors[0].message : null),
      h('button', { type: 'submit', class: 'dr-button', text: 'Send reset link' }));
    w.appendChild(form);
    if (errors.length) w.querySelector('.dr-error-summary').focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return forgot(app, [{ id: 'email', message: email ? 'Enter an email address in the correct format, like name@example.com' : 'Enter your email address' }], email);
      DR.auth.recover(email).then(function () {
        DR.setTitle('Check your email');
        DR.clear(w);
        w.appendChild(h('h1', { text: 'Check your email' }));
        w.appendChild(h('p', null, 'If there is an account for ', h('strong', { text: email }), ', we have sent a link to reset the password.'));
        w.appendChild(h('p', { text: 'The link expires after a short time. Check your spam folder if you cannot find it.' }));
        w.appendChild(h('p', null, h('a', { href: 'sign-in.html', text: 'Return to sign in' })));
      });
    });
  }
})();
