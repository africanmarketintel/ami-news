/* ==========================================================================
   AMI Deal Room v2 – question page engine
   One question per page, error summary, specific error messages,
   check answers with change links, confirmation page. Each step has its
   own URL (?step=) so browser Back works as users expect.
   ========================================================================== */
(function () {
  'use strict';
  var DR = window.DR;
  var h = DR.h;

  function uid(name, i) { return 'f-' + name + (i !== undefined ? '-' + i : ''); }

  DR.flow = function (cfg) {
    var params = DR.params;
    var container = cfg.container;
    var state = DR.store.get(cfg.key, null) || { answers: {}, done: {} };
    var steps = cfg.steps;
    var byId = {};
    steps.forEach(function (s, i) { s.index = i; byId[s.id] = s; });

    function save() { DR.store.set(cfg.key, state); }
    function url(stepId, extra) {
      var q = Object.assign({}, cfg.baseParams || {}, { step: stepId }, extra || {});
      return cfg.page + DR.qs(q);
    }
    function go(stepId, extra) { location.href = url(stepId, extra); }

    DR.flowState = state;
    DR.flowGo = go;
    DR.flowSave = save;
    DR.flowUrl = url;

    var currentId = params.get('step') || steps[0].id;
    var step = byId[currentId] || steps[0];

    // Guard: send users back to the first unanswered required step.
    if (step.requires) {
      for (var r = 0; r < step.requires.length; r++) {
        if (!state.done[step.requires[r]]) { location.replace(url(step.requires[r])); return; }
      }
    }
    if (cfg.guard && cfg.guard(step, state) === false) return;

    render(step, []);

    /* ----------------------------- rendering ----------------------------- */
    function render(step, errors, submitted) {
      DR.clear(container);
      var hasErrors = errors.length > 0;
      DR.setTitle(step.pageTitle || step.title, hasErrors);

      var back = step.back === false ? null : prevStep(step);
      if (back) {
        container.appendChild(h('a', { class: 'dr-back', href: back.href || url(back.id), text: 'Back' }));
      }

      var wrapper = h('div', { class: 'dr-narrow', style: 'margin-top:1.5rem' });
      container.appendChild(wrapper);

      if (hasErrors) wrapper.appendChild(errorSummary(errors));

      if (step.type === 'custom') { step.render({ state: state, wrapper: wrapper, go: go, save: save, url: url, errors: errors, rerender: function (e) { render(step, e || []); } }); focusAfterRender(hasErrors); return; }

      var singleQuestion = step.fields && step.fields.length === 1 && step.pageHeading !== false && !step.intro;
      var form = h('form', { novalidate: true, method: 'post', action: '#' });

      if (!singleQuestion) {
        if (cfg.caption) wrapper.appendChild(h('span', { class: 'dr-caption-l', text: typeof cfg.caption === 'function' ? cfg.caption(state) : cfg.caption }));
        wrapper.appendChild(h('h1', { text: step.title }));
        if (step.intro) wrapper.appendChild(h('div', null, step.intro(state)));
      }

      if (step.type === 'check') {
        renderCheck(step, form);
      } else {
        (step.fields || []).forEach(function (f) {
          form.appendChild(field(f, errors, submitted, singleQuestion ? (typeof cfg.caption === 'function' ? cfg.caption(state) : cfg.caption) : null));
        });
      }

      if (step.after) form.appendChild(h('div', null, step.after(state)));

      var buttonLabel = step.button || 'Continue';
      var submitBtn = h('button', { type: 'submit', class: 'dr-button', 'data-prevent-double-click': 'true', text: buttonLabel });
      var group = h('div', { class: 'dr-button-group' }, submitBtn);
      if (step.secondaryLink) group.appendChild(h('a', { class: 'dr-link', href: step.secondaryLink.href, text: step.secondaryLink.text }));
      form.appendChild(group);

      var busy = false;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        var values = collect(step, form);
        var errs = validate(step, values);
        if (errs.length) { render(step, errs, values); return; }
        Object.keys(values).forEach(function (k) { state.answers[k] = values[k]; });
        var afterSave = function (next) {
          state.done[step.id] = true;
          save();
          if (next === false) return;
          if (params.get('change') === '1' && cfg.checkStep && step.type !== 'check') { go(cfg.checkStep); return; }
          go(next || (steps[step.index + 1] && steps[step.index + 1].id));
        };
        if (step.onSubmit) {
          busy = true;
          submitBtn.setAttribute('aria-disabled', 'true');
          submitBtn.textContent = step.busyText || 'Sending…';
          Promise.resolve(step.onSubmit(state, values)).then(function (res) {
            busy = false;
            if (res && res.errors) { submitBtn.removeAttribute('aria-disabled'); render(step, res.errors, values); return; }
            afterSave(res && res.next);
          });
        } else {
          afterSave(step.next ? step.next(state, values) : null);
        }
      });

      wrapper.appendChild(form);
      if (step.footer) wrapper.appendChild(h('div', null, step.footer(state)));
      focusAfterRender(hasErrors);
    }

    function focusAfterRender(hasErrors) {
      if (hasErrors) {
        var sum = container.querySelector('.dr-error-summary');
        if (sum) sum.focus();
      }
    }

    function prevStep(step) {
      if (step.backTo) return typeof step.backTo === 'string' ? { href: step.backTo } : step.backTo(state);
      if (params.get('change') === '1' && cfg.checkStep) return { id: cfg.checkStep };
      for (var i = step.index - 1; i >= 0; i--) {
        var s = steps[i];
        if (s.skip && s.skip(state)) continue;
        return s;
      }
      return cfg.firstBack ? { href: cfg.firstBack } : null;
    }

    /* ----------------------------- fields ----------------------------- */
    function valueOf(f, submitted) {
      if (submitted && submitted[f.name] !== undefined) return submitted[f.name];
      var v = state.answers[f.name];
      if (v === undefined && f.prefill) v = f.prefill(state);
      return v;
    }

    function errorFor(errors, name) {
      for (var i = 0; i < errors.length; i++) if (errors[i].name === name) return errors[i];
      return null;
    }

    function field(f, errors, submitted, caption) {
      var err = errorFor(errors, f.name);
      var group = h('div', { class: 'dr-form-group' + (err ? ' dr-form-group--error' : '') });
      var hintId = f.hint ? uid(f.name) + '-hint' : null;
      var errId = err ? uid(f.name) + '-error' : null;
      var describedBy = [hintId, errId].filter(Boolean).join(' ') || null;
      var value = valueOf(f, submitted);

      if (f.type === 'radios' || f.type === 'checkboxes') {
        var legendText = f.legend + (f.optional ? ' (optional)' : '');
        var legend = caption
          ? h('legend', { class: 'dr-fieldset__legend dr-fieldset__legend--l' }, h('span', { class: 'dr-caption-l', text: caption }), h('h1', { class: 'dr-fieldset__heading', text: legendText }))
          : h('legend', { class: 'dr-fieldset__legend' + (f.legendSize ? ' dr-fieldset__legend--' + f.legendSize : ''), text: legendText });
        var fs = h('fieldset', { class: 'dr-fieldset', 'aria-describedby': describedBy }, legend);
        if (f.hint) fs.appendChild(h('div', { class: 'dr-hint', id: hintId }, f.hint));
        if (err) fs.appendChild(h('p', { class: 'dr-error-message', id: errId }, h('span', { class: 'dr-visually-hidden', text: 'Error: ' }), err.message));
        var list = h('div', { class: 'dr-choices' });
        var selected = Array.isArray(value) ? value : (value ? [value] : []);
        f.options.forEach(function (o, i) {
          if (o.divider) { list.appendChild(h('div', { class: 'dr-choices__divider', text: o.divider })); return; }
          var id = uid(f.name, i);
          var input = h('input', { class: 'dr-choice__input', id: id, name: f.name, type: f.type === 'radios' ? 'radio' : 'checkbox', value: o.value, checked: selected.indexOf(o.value) !== -1, 'aria-describedby': o.hint ? id + '-hint' : null });
          var item = h('div', { class: 'dr-choice dr-choice--' + (f.type === 'radios' ? 'radio' : 'checkbox') },
            input, h('label', { class: 'dr-choice__label', for: id, text: o.label }),
            o.hint ? h('div', { class: 'dr-choice__hint', id: id + '-hint', text: o.hint }) : null);
          list.appendChild(item);
          if (o.conditional) {
            var cid = id + '-conditional';
            var cond = h('div', { class: 'dr-conditional', id: cid, hidden: selected.indexOf(o.value) === -1 });
            cond.appendChild(field(o.conditional, errors, submitted, null));
            input.setAttribute('aria-controls', cid);
            list.appendChild(cond);
          }
        });
        list.addEventListener('change', function () {
          Array.prototype.forEach.call(list.querySelectorAll('.dr-choice__input'), function (inp) {
            var c = inp.getAttribute('aria-controls');
            if (c) document.getElementById(c).hidden = !inp.checked;
          });
        });
        fs.appendChild(list);
        group.appendChild(fs);
        return group;
      }

      var id = uid(f.name);
      var labelText = f.label + (f.optional ? ' (optional)' : '');
      var labelEl = h('label', { class: 'dr-label' + (caption ? ' dr-label--l' : ''), for: id, text: labelText });
      if (caption) {
        group.appendChild(h('h1', { class: 'dr-fieldset__heading' }, h('span', { class: 'dr-caption-l', text: caption }), labelEl));
      } else {
        group.appendChild(labelEl);
      }
      if (f.hint) group.appendChild(h('div', { class: 'dr-hint', id: hintId }, f.hint));
      if (err) group.appendChild(h('p', { class: 'dr-error-message', id: errId }, h('span', { class: 'dr-visually-hidden', text: 'Error: ' }), err.message));

      var control;
      if (f.type === 'textarea') {
        control = h('textarea', { class: 'dr-textarea' + (err ? ' dr-textarea--error' : ''), id: id, name: f.name, rows: f.rows || 8, 'aria-describedby': [describedBy, f.maxWords ? id + '-count' : null].filter(Boolean).join(' ') || null, spellcheck: 'true' });
        control.value = value || '';
        group.appendChild(control);
        if (f.maxWords) {
          var count = h('div', { class: 'dr-character-count', id: id + '-count', 'aria-live': 'polite' });
          var update = function () {
            var n = DR.words(control.value), left = f.maxWords - n;
            count.textContent = left >= 0 ? 'You have ' + left + ' word' + (left === 1 ? '' : 's') + ' remaining' : 'You have ' + (-left) + ' word' + (left === -1 ? '' : 's') + ' too many';
            count.className = 'dr-character-count' + (left < 0 ? ' dr-character-count--over' : '');
          };
          var t; control.addEventListener('input', function () { clearTimeout(t); t = setTimeout(update, 400); });
          update();
          group.appendChild(count);
        }
      } else if (f.type === 'select') {
        control = h('select', { class: 'dr-select' + (err ? ' dr-select--error' : ''), id: id, name: f.name, 'aria-describedby': describedBy });
        control.appendChild(h('option', { value: '', text: f.placeholder || 'Select an option' }));
        f.options.forEach(function (o) { control.appendChild(h('option', { value: o.value, text: o.label, selected: value === o.value })); });
        group.appendChild(control);
      } else {
        control = h('input', {
          class: 'dr-input' + (err ? ' dr-input--error' : '') + (f.width ? ' dr-input--w' + f.width : ''),
          id: id, name: f.name, type: f.type || 'text', autocomplete: f.autocomplete || null,
          spellcheck: f.spellcheck === false ? 'false' : null, inputmode: f.inputmode || null,
          'aria-describedby': describedBy
        });
        control.value = value || '';
        group.appendChild(control);
        if (f.type === 'password') {
          var toggle = h('button', { type: 'button', class: 'dr-button dr-button--secondary', style: 'margin-top:.6rem', 'aria-controls': id, text: 'Show password' });
          toggle.addEventListener('click', function () {
            var show = control.type === 'password';
            control.type = show ? 'text' : 'password';
            toggle.textContent = show ? 'Hide password' : 'Show password';
            DR.announce(show ? 'Your password is visible' : 'Your password is hidden');
          });
          group.appendChild(toggle);
        }
      }
      if (f.after) group.appendChild(h('div', null, f.after(state)));
      return group;
    }

    function collect(step, form) {
      var out = {};
      var fields = [];
      (step.fields || []).forEach(function (f) {
        fields.push(f);
        (f.options || []).forEach(function (o) { if (o.conditional) fields.push(o.conditional); });
      });
      fields.forEach(function (f) {
        if (f.type === 'checkboxes') {
          out[f.name] = Array.prototype.map.call(form.querySelectorAll('input[name="' + f.name + '"]:checked'), function (i) { return i.value; });
        } else if (f.type === 'radios') {
          var c = form.querySelector('input[name="' + f.name + '"]:checked');
          out[f.name] = c ? c.value : '';
        } else {
          var el = form.querySelector('[name="' + f.name + '"]');
          out[f.name] = el ? String(el.value).trim() : '';
        }
      });
      if (step.collect) Object.assign(out, step.collect(form, state));
      return out;
    }

    function validate(step, values) {
      var errs = [];
      (step.fields || []).forEach(function (f) {
        check(f, values, errs);
        (f.options || []).forEach(function (o) {
          if (o.conditional && (values[f.name] === o.value || (Array.isArray(values[f.name]) && values[f.name].indexOf(o.value) !== -1))) check(o.conditional, values, errs);
        });
      });
      if (step.validate) errs = errs.concat(step.validate(values, state) || []);
      return errs;
    }

    function check(f, values, errs) {
      var v = values[f.name];
      var empty = Array.isArray(v) ? v.length === 0 : !v;
      if (empty && !f.optional) { errs.push({ name: f.name, message: f.required, target: firstId(f) }); return; }
      if (f.requireAll && Array.isArray(v) && v.length < f.options.length) { errs.push({ name: f.name, message: f.requireAll, target: firstId(f) }); return; }
      if (!empty && f.maxWords && DR.words(v) > f.maxWords) { errs.push({ name: f.name, message: f.label + ' must be ' + f.maxWords + ' words or fewer', target: firstId(f) }); return; }
      if (!empty && f.validate) { var m = f.validate(v, values); if (m) errs.push({ name: f.name, message: m, target: firstId(f) }); }
    }
    function firstId(f) { return (f.type === 'radios' || f.type === 'checkboxes') ? uid(f.name, 0) : uid(f.name); }

    function errorSummary(errors) {
      var list = h('ul', { class: 'dr-error-summary__list' });
      errors.forEach(function (e) {
        var a = h('a', { href: '#' + (e.target || uid(e.name)), text: e.message });
        a.addEventListener('click', function (ev) {
          var target = document.getElementById(e.target || uid(e.name));
          if (!target) return;
          ev.preventDefault();
          var legend = target.closest('fieldset') ? target.closest('fieldset').querySelector('legend') : document.querySelector('label[for="' + target.id + '"]');
          (legend || target).scrollIntoView();
          target.focus({ preventScroll: true });
        });
        list.appendChild(h('li', null, a));
      });
      return h('div', { class: 'dr-error-summary', tabindex: '-1', role: 'alert', 'aria-labelledby': 'error-summary-title' },
        h('h2', { class: 'dr-error-summary__title', id: 'error-summary-title', text: 'There is a problem' }),
        list);
    }
    DR.errorSummary = errorSummary;

    /* ----------------------------- check answers ----------------------------- */
    function renderCheck(step, form) {
      step.sections(state).forEach(function (section) {
        if (section.title) form.appendChild(h('h2', { class: 'dr-h3', text: section.title }));
        var dl = h('dl', { class: 'dr-summary-list' });
        section.rows.forEach(function (row) {
          var val = row.value;
          if (Array.isArray(val)) val = val.join('\n');
          dl.appendChild(h('div', { class: 'dr-summary-list__row' },
            h('dt', { class: 'dr-summary-list__key', text: row.key }),
            h('dd', { class: 'dr-summary-list__value', text: val || 'Not provided' }),
            row.step ? h('dd', { class: 'dr-summary-list__actions' },
              h('a', { href: url(row.step, { change: '1' }) }, 'Change', h('span', { class: 'dr-visually-hidden', text: ' ' + row.key.toLowerCase() }))) : h('dd', { class: 'dr-summary-list__actions' })));
        });
        form.appendChild(dl);
      });
      if (step.declaration) form.appendChild(h('div', null, step.declaration(state)));
    }
  };

  /* Prevent double submission on any button marked data-prevent-double-click. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-prevent-double-click]');
    if (!b) return;
    if (b.getAttribute('data-clicked') === '1') { e.preventDefault(); return; }
    b.setAttribute('data-clicked', '1');
    setTimeout(function () { b.removeAttribute('data-clicked'); }, 1000);
  });
})();
