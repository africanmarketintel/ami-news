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
        accent_colour: d.accent_colour || '#6b7280', button_colour: d.button_colour || '#222222',
        button_text: d.button_text || '#ffffff', font_family: 'sans', footer_note: '', footer_credit: '',
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
        'Usually your organisation name. Read out to anyone using a screen reader, and shown when images are blocked. If you leave it empty, your account name is used.');
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
        'Your postal address is added automatically. A UK company should also give its registered name, number, place of registration and registered office here, as plain text. For example: Registered in England and Wales, number 00000000. Or add a charity registration.').group);

      /* a line of your own at the very bottom. There is no platform line, so
         this is empty unless a plan that allows it adds one. Only emails sent
         from the account's own verified domain print it. */
      var canCredit = !!account.allows_custom_footer;
      if (canCredit) {
        form.appendChild(MR.h('h3', { class: 'dr-h', text: 'Line at the very bottom' }));
        var mode = brand.footer_credit && brand.footer_credit !== MR.NO_CREDIT ? 'own' : 'none';
        var ownInput = MR.h('input', { class: 'dr-input', id: 'b-credit', type: 'text', maxlength: '160',
          value: mode === 'own' ? brand.footer_credit : '' });
        var ownBox = MR.h('div', { class: 'dr-form-group', hidden: mode !== 'own' },
          MR.h('label', { class: 'dr-label', for: 'b-credit', text: 'Your line' }),
          MR.h('span', { class: 'dr-hint', text: 'Up to 160 characters, plain text.' }), ownInput);
        var set = function (m) {
          mode = m;
          ownBox.hidden = m !== 'own';
          brand.footer_credit = m === 'own' ? ownInput.value : '';
          refresh();
        };
        ownInput.addEventListener('input', function () { brand.footer_credit = ownInput.value; refresh(); });
        var creditGroup = MR.h('fieldset', { class: 'dr-form-group' },
          MR.h('legend', { class: 'dr-label', text: 'Do you want a line under the footer?' }));
        [
          { id: 'none', label: 'No line', hint: 'Nothing is printed at the bottom.' },
          { id: 'own', label: 'My own line', hint: 'A short line of text you write, printed under the footer.' }
        ].forEach(function (opt) {
          var rid = 'b-credit-' + opt.id;
          var radio = MR.h('input', { class: 'dr-choice__input', type: 'radio', id: rid, name: 'b-credit-mode',
            value: opt.id, checked: mode === opt.id });
          radio.addEventListener('change', function () { if (radio.checked) set(opt.id); });
          creditGroup.appendChild(MR.h('div', { class: 'dr-choice dr-choice--radio' }, radio,
            MR.h('label', { class: 'dr-choice__label', for: rid }, opt.label,
              MR.h('span', { class: 'dr-choice__hint', text: opt.hint }))));
        });
        form.appendChild(creditGroup);
        form.appendChild(ownBox);
        form.appendChild(MR.h('p', { class: 'dr-hint' },
          'This line is printed only on emails sent from your own verified domain. ',
          MR.h('a', { href: 'domain.html', text: 'Set up your own domain' }), '.'));
      } else {
        brand.footer_credit = '';
      }

      // Social icons. Each network is one entry in social_links with an icon
      // name, so nothing new is stored. Ticking adds the icon to the bottom of
      // every email; unticking removes it.
      form.appendChild(MR.h('h3', { class: 'dr-h', text: 'Social icons at the bottom of your emails' }));
      form.appendChild(MR.h('p', { class: 'dr-hint', text: 'Tick a network to show its icon above the unsubscribe line. Paste the full address of your page, starting with https://. Untick it to remove the icon.' }));
      // One colour for the whole row. It is stored on each icon, so nothing
      // new has to be saved.
      var COLOURS = [['dark', 'Black'], ['grey', 'Grey'], ['white', 'White'], ['clay', 'Terracotta'], ['green', 'Green'], ['blue', 'Blue'],
        ['purple', 'Purple'], ['rose', 'Rose'], ['gold', 'Gold']];
      function iconColour() {
        var first = (brand.social_links || []).filter(function (l) { return l.icon; })[0];
        return (first && first.colour) || 'dark';
      }
      var colourSel = MR.h('select', { class: 'dr-select dr-input--w', id: 'b-ico-colour' });
      COLOURS.forEach(function (c) { colourSel.appendChild(MR.h('option', { value: c[0], text: c[1], selected: iconColour() === c[0] })); });
      colourSel.addEventListener('change', function () {
        (brand.social_links || []).forEach(function (l) {
          if (!l.icon) return;
          if (colourSel.value === 'dark') delete l.colour; else l.colour = colourSel.value;
        });
        refresh();
      });
      form.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: 'b-ico-colour', text: 'Icon colour' }),
        MR.h('span', { class: 'dr-hint', text: 'Pick a colour that suits your emails. White is for a dark footer.' }), colourSel));
      [['facebook', 'Facebook', 'https://www.facebook.com/yourpage'], ['instagram', 'Instagram', 'https://www.instagram.com/yourname'],
       ['x', 'X', 'https://x.com/yourname'], ['pinterest', 'Pinterest', 'https://www.pinterest.com/yourname'],
       ['spotify', 'Spotify', 'https://open.spotify.com/user/yourname'], ['patreon', 'Patreon', 'https://www.patreon.com/yourname'],
       ['linkedin', 'LinkedIn', 'https://www.linkedin.com/company/yourname'], ['youtube', 'YouTube', 'https://www.youtube.com/@yourname'],
       ['tiktok', 'TikTok', 'https://www.tiktok.com/@yourname']
      ].forEach(function (n) {
        var kept = '';
        function entry() {
          return (brand.social_links || []).filter(function (l) { return l.icon === n[0]; })[0] || null;
        }
        if (entry()) kept = entry().url || '';
        var id = 'b-ico-' + n[0];
        var box = MR.h('input', { type: 'checkbox', id: id, class: 'dr-choice__input' });
        box.checked = !!entry();
        var url = MR.h('input', { class: 'dr-input', id: id + '-url', type: 'url', value: kept, placeholder: n[2],
          'aria-label': n[1] + ' page address' });
        url.disabled = !box.checked;
        box.addEventListener('change', function () {
          if (!Array.isArray(brand.social_links)) brand.social_links = [];
          if (box.checked) {
            var made = { label: n[1], url: url.value.trim(), icon: n[0] };
            if (iconColour() !== 'dark') made.colour = iconColour();
            brand.social_links.push(made);
          } else {
            brand.social_links = brand.social_links.filter(function (l) { return l.icon !== n[0]; });
          }
          url.disabled = !box.checked;
          if (box.checked) url.focus();
          refresh();
        });
        url.addEventListener('input', function () { var e = entry(); if (e) e.url = url.value.trim(); refresh(); });
        form.appendChild(MR.h('div', { class: 'mr-social-icon-row' },
          MR.h('div', { class: 'dr-choice dr-choice--checkbox' }, box,
            MR.h('label', { class: 'dr-choice__label', for: id, text: n[1] })), url));
      });

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
          if (l.icon) return; // icons are managed in the section above
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
        var hex = MR.h('input', { class: 'dr-input dr-input--w', id: id + '-hex', type: 'text', value: brand[key],
          'aria-label': labelText + ', colour code' });
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
          errors.push({ id: ['b-accent', 'b-button', 'b-button-text'][i] + '-hex', message: 'Enter a colour as six characters, such as #222222' });
        }
      });
      if (account.allows_custom_footer && brand.footer_credit !== MR.NO_CREDIT && String(brand.footer_credit || '').trim().length > 160) {
        errors.push({ id: 'b-credit', message: 'Keep the line to 160 characters or fewer' });
      }
      var picked = form.querySelector('input[name="b-credit-mode"]:checked');
      if (picked && picked.value === 'own' && !String(brand.footer_credit || '').trim()) {
        errors.push({ id: 'b-credit', message: 'Write your line, or choose no line' });
      }
      (brand.social_links || []).forEach(function (l) {
        if (l.icon && !String(l.url || '').trim()) errors.push({ id: 'b-ico-' + l.icon + '-url', message: 'Paste the address of your ' + l.label + ' page, or untick it' });
      });
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
        social_links: (brand.social_links || []).filter(function (l) { return l.url && (l.label || l.icon); }),
        updated_at: new Date().toISOString()
      };
      // Only sent when the plan allows it. Sending nothing leaves whatever is
      // stored alone, so a downgraded account can still save the rest.
      if (account.allows_custom_footer) patch.footer_credit = String(brand.footer_credit || '').trim() || null;
      MR.api.insert('mailroom_brand', patch, { query: '?on_conflict=account_id', upsert: true })
        .then(function () { MR.banner(wrap, 'Saved', 'New campaigns will use this.'); })
        .catch(function (err) {
          MR.errors.show(form, [{ id: 'b-accent-hex', message: 'That could not be saved. Please try again shortly.' }]);
          console.error(err);
        });
    }
  });
})();
