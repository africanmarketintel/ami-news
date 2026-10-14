/* ==========================================================================
   AMI Mailroom – how your email looks (brand.html)
   Set once, applied to every campaign afterwards. Only what survives a mail
   app: a logo, three colours, one of three web-safe typefaces, a footer line
   and a row of links. There is no custom font, because a downloaded font
   falls back silently in Outlook and the email then looks nothing like the
   builder.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  var SAMPLE = {
    subject: 'How your campaigns will look',
    preheader: 'A sample, using your logo and colours',
    font_family: '',
    body_blocks: [
      { type: 'heading', text: 'A heading in your emails' },
      { type: 'text', text: 'A paragraph, with [a link](https://example.com) in your accent colour.' },
      { type: 'button', label: 'A button', url: 'https://example.com' },
      { type: 'divider' },
      { type: 'text', text: 'The footer below carries your address, your links and the unsubscribe.' }
    ]
  };

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-brand');
    if (!wrap) return;

    var account = null;
    var brand = null;

    if (MR.cfg.demo) {
      account = MR.sampleAccount;
      brand = JSON.parse(JSON.stringify(MR.sampleBrand || {}));
      render();
      return;
    }

    MR.requireAccount(wrap).then(function (a) {
      account = a;
      return MR.api.select('mailroom_brand?select=*&account_id=eq.' + a.id);
    }).then(function (rows) {
      brand = (rows && rows[0]) || defaults();
      render();
    }).catch(function (err) {
      return MR.loadFailed(wrap, err);
    });

    function defaults() {
      var d = MR.DEFAULT_BRAND || {};
      return {
        account_id: account.id, logo_url: '', logo_alt: '', logo_width: d.logo_width || 180,
        accent_colour: d.accent_colour || '#1e6b3c', button_colour: d.button_colour || '#f9c53d',
        button_text: d.button_text || '#1a1208', font_family: 'sans', footer_note: '',
        social_links: []
      };
    }

    function render() {
      wrap.textContent = '';
      wrap.appendChild(MR.h('h1', { text: 'How your email looks' }));
      wrap.appendChild(MR.h('p', { class: 'dr-lead', text: 'Set this once. Every campaign you write afterwards starts with it, and you can still change any of it inside a campaign.' }));

      var form = MR.h('form', { id: 'mr-brand-form', novalidate: true });
      var previewBox = MR.h('div', { class: 'mr-preview', id: 'mr-brand-preview' });
      var preview = null;

      /* logo */
      form.appendChild(MR.h('h2', { text: 'Logo' }));
      var logoInput = MR.h('input', { class: 'dr-input', id: 'b-logo', type: 'url', value: brand.logo_url || '' });
      logoInput.addEventListener('input', function () { brand.logo_url = logoInput.value; refresh(); });
      var logoGroup = MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'b-logo', text: 'Logo address' }),
        MR.h('span', { class: 'dr-hint', text: 'Upload one, or paste the address of an image already online. A wide logo about 400 pixels across works best.' }),
        logoInput);
      form.appendChild(logoGroup);
      if (!MR.cfg.demo) {
        form.appendChild(MR.h('p', null, MR.h('button', {
          type: 'button', class: 'dr-button dr-button--secondary', text: 'Choose or upload a logo',
          onclick: function () {
            MR.pickImage(account.id, function (img) {
              brand.logo_url = img.url;
              if (!brand.logo_alt) brand.logo_alt = img.alt || account.name;
              logoInput.value = img.url;
              altInput.value = brand.logo_alt;
              refresh();
            });
          }
        })));
      }
      var altInput = text('b-logo-alt', 'What the logo says', brand.logo_alt,
        function (v) { brand.logo_alt = v; refresh(); },
        'Usually your organisation name. Read out to anyone using a screen reader, and shown when images are blocked.');
      form.appendChild(altInput.group);
      altInput = altInput.input;

      var width = MR.h('input', {
        class: 'dr-input dr-input--w', id: 'b-logo-width', type: 'number',
        min: '60', max: '552', value: String(brand.logo_width || 180)
      });
      width.addEventListener('input', function () {
        brand.logo_width = parseInt(width.value, 10) || 180; refresh();
      });
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'b-logo-width', text: 'How wide, in pixels' }),
        MR.h('span', { class: 'dr-hint', text: 'Between 60 and 552. The email itself is 600 pixels wide.' }),
        width));

      /* colours */
      form.appendChild(MR.h('h2', { text: 'Colours' }));
      form.appendChild(colour('b-accent', 'Accent', 'accent_colour',
        'The rule under your logo, and the colour of links.'));
      form.appendChild(colour('b-button', 'Button', 'button_colour', 'The background of buttons.'));
      form.appendChild(colour('b-button-text', 'Button text', 'button_text',
        'Dark text on a light button, or the other way round. Check it is easy to read.'));

      /* typeface */
      form.appendChild(MR.h('h2', { text: 'Typeface' }));
      var fontSelect = MR.h('select', { class: 'dr-select dr-input--w', id: 'b-font' },
        MR.h('option', { value: 'sans', text: 'Sans serif (Arial, Helvetica)', selected: brand.font_family === 'sans' }),
        MR.h('option', { value: 'serif', text: 'Serif (Georgia, Times)', selected: brand.font_family === 'serif' }),
        MR.h('option', { value: 'system', text: 'System font', selected: brand.font_family === 'system' }));
      fontSelect.addEventListener('change', function () { brand.font_family = fontSelect.value; refresh(); });
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'b-font', text: 'Typeface' }),
        MR.h('span', { class: 'dr-hint', text: 'Three stacks that exist on every device. A downloaded font is not offered: Outlook ignores it and the email arrives in something else.' }),
        fontSelect));

      /* footer */
      form.appendChild(MR.h('h2', { text: 'Footer' }));
      form.appendChild(text('b-footer', 'A line in the footer', brand.footer_note,
        function (v) { brand.footer_note = v; refresh(); },
        'For example a company number, or a charity registration. Your postal address is added automatically.').group);

      form.appendChild(MR.h('h3', { class: 'dr-h', text: 'Links in the footer' }));
      var linksBox = MR.h('div');
      form.appendChild(linksBox);
      drawLinks();
      form.appendChild(MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary', text: 'Add a link',
        onclick: function () {
          if (!Array.isArray(brand.social_links)) brand.social_links = [];
          brand.social_links.push({ label: '', url: '' });
          drawLinks(); refresh();
        }
      }));

      form.appendChild(MR.h('div', { class: 'dr-button-group' },
        MR.h('button', { class: 'dr-button', type: 'submit', text: 'Save' }),
        MR.h('a', { class: 'dr-button dr-button--secondary', href: 'account.html', text: 'Back to your mailroom' })));

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        submit(form);
      });

      wrap.appendChild(MR.h('div', { class: 'dr-grid dr-grid--two-thirds' }, form,
        MR.h('aside', null, MR.h('h2', { class: 'dr-h', text: 'Preview' }), previewBox)));

      preview = MR.preview(previewBox, function () { return SAMPLE; },
        function () { return account; }, function () { return brand; });

      function refresh() { if (preview) preview.refresh(); }

      function drawLinks() {
        linksBox.textContent = '';
        (brand.social_links || []).forEach(function (l, i) {
          linksBox.appendChild(MR.h('div', { class: 'mr-social-row' },
            text('b-l' + i + '-label', 'Name', l.label, function (v) { l.label = v; refresh(); }).group,
            text('b-l' + i + '-url', 'Link', l.url, function (v) { l.url = v; refresh(); }).group,
            MR.h('button', {
              type: 'button', class: 'dr-button dr-button--warning', text: 'Remove',
              onclick: function () { brand.social_links.splice(i, 1); drawLinks(); refresh(); }
            })));
        });
      }

      function text(id, labelText, value, onInput, hint) {
        var input = MR.h('input', { class: 'dr-input', id: id, type: 'text', value: value || '' });
        input.addEventListener('input', function () { onInput(input.value); });
        return {
          input: input,
          group: MR.h('div', { class: 'dr-form-group' },
            MR.h('label', { class: 'dr-label', for: id, text: labelText }),
            hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null, input)
        };
      }

      function colour(id, labelText, key, hint) {
        var swatch = MR.h('input', { class: 'mr-colour', id: id, type: 'color', value: brand[key] });
        var hex = MR.h('input', { class: 'dr-input dr-input--w', id: id + '-hex', type: 'text', value: brand[key] });
        swatch.addEventListener('input', function () {
          brand[key] = swatch.value; hex.value = swatch.value; refresh();
        });
        hex.addEventListener('input', function () {
          if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) { brand[key] = hex.value; swatch.value = hex.value; refresh(); }
        });
        // Anything that is not a colour is put back, rather than left sitting
        // in the box looking as though it had been accepted.
        hex.addEventListener('blur', function () {
          if (hex.value !== brand[key]) {
            hex.value = brand[key];
            MR.announce('That is not a colour, so it has been put back to ' + brand[key]);
          }
        });
        return MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: id, text: labelText }),
          hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null,
          MR.h('div', { class: 'mr-colour-row' }, swatch, hex));
      }
    }

    function submit(form) {
      var errors = [];
      ['accent_colour', 'button_colour', 'button_text'].forEach(function (k, i) {
        if (!/^#[0-9a-fA-F]{6}$/.test(brand[k] || '')) {
          errors.push({ id: ['b-accent', 'b-button', 'b-button-text'][i] + '-hex', message: 'Enter a colour as six characters, such as #1e6b3c' });
        }
      });
      if (brand.logo_url && !String(brand.logo_alt || '').trim()) {
        errors.push({ id: 'b-logo-alt', message: 'Say what the logo says, for readers who cannot see it' });
      }
      var w = parseInt(brand.logo_width, 10);
      if (!(w >= 60 && w <= 552)) errors.push({ id: 'b-logo-width', message: 'Enter a width between 60 and 552' });
      if (MR.errors.show(form, errors)) return;

      if (MR.cfg.demo) {
        MR.banner(wrap, 'Preview only', 'Nothing was saved.');
        return;
      }
      var patch = {
        account_id: account.id, logo_url: brand.logo_url || null, logo_alt: brand.logo_alt || null,
        logo_width: w, accent_colour: brand.accent_colour, button_colour: brand.button_colour,
        button_text: brand.button_text, font_family: brand.font_family || 'sans',
        footer_note: brand.footer_note || null,
        social_links: (brand.social_links || []).filter(function (l) { return l.label && l.url; }),
        updated_at: new Date().toISOString()
      };
      MR.api.insert('mailroom_brand', patch, { query: '?on_conflict=account_id', upsert: true })
        .then(function () { MR.banner(wrap, 'Saved', 'New campaigns will use this.'); })
        .catch(function (err) {
          MR.errors.show(form, [{ id: 'b-accent-hex', message: 'That could not be saved. Please try again shortly.' }]);
          console.error(err);
        });
    }
  });
})();
