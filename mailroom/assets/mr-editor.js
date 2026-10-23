/* ==========================================================================
   Campaign editor – drag and drop
   Drag a block from the palette into the campaign, drag a block to reorder it,
   or do the same with the keyboard: every block has Move up and Move down
   buttons, and the palette items are ordinary buttons that add to the end.
   Drag and drop alone is not accessible, so it is never the only way.

   A panel is a container: drag blocks into it, or use its own Add row, and
   everything inside it takes the panel's colours. Panels do not nest, which
   keeps the markup to something Outlook can still render.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  var TYPES = [
    { value: 'heading', label: 'Title', hint: 'A short line that breaks up the email' },
    { value: 'text', label: 'Text', hint: 'Body text' },
    { value: 'image', label: 'Image', hint: 'Needs a description' },
    { value: 'video', label: 'Video', hint: 'A picture that opens a video page' },
    { value: 'button', label: 'Button', hint: 'A link that stands out' },
    { value: 'dynamic', label: 'Dynamic content', hint: 'Text with each reader\'s details filled in' },
    { value: 'logo', label: 'Logo', hint: 'Your logo, from your brand settings or chosen here' },
    { value: 'social', label: 'Social', hint: 'A row of links' },
    { value: 'html', label: 'HTML', hint: 'Your own markup. Only safe tags are kept' },
    { value: 'divider', label: 'Divider', hint: 'A horizontal rule' },
    { value: 'product', label: 'Product', hint: 'Picture, name, price and a button' },
    { value: 'navigation', label: 'Navigation', hint: 'A row of page links' },
    { value: 'spacer', label: 'Spacer', hint: 'A gap between blocks' },
    { value: 'story', label: 'Story', hint: 'A headline with one line underneath', more: true },
    { value: 'list', label: 'Bullet list', hint: 'One point per line', more: true },
    { value: 'imagetext', label: 'Image and text', hint: 'Side by side, stacking on a phone', more: true },
    { value: 'columns', label: 'Two columns', hint: 'Text side by side, stacking on a phone', more: true },
    { value: 'panel', label: 'Colour panel', hint: 'A block of colour with other blocks inside it', more: true }
  ];
  MR.BLOCK_TYPES = TYPES;

  // Everything except a panel, which cannot go inside another panel.
  var INNER_TYPES = TYPES.filter(function (t) { return t.value !== 'panel'; });

  var ALIGNABLE = ['heading', 'text', 'story', 'list', 'button', 'image', 'social', 'video', 'logo', 'product', 'navigation', 'dynamic'];

  function blank(type) {
    if (type === 'button') return { type: 'button', label: 'Read more', url: '', align: 'left' };
    if (type === 'image') return { type: 'image', url: '', alt: '', align: 'left' };
    if (type === 'imagetext') return { type: 'imagetext', url: '', alt: '', text: '', side: 'left' };
    if (type === 'columns') return { type: 'columns', left: '', right: '' };
    if (type === 'social') return { type: 'social', style: 'text', align: 'center', links: [{ label: '', url: '' }] };
    if (type === 'divider') return { type: 'divider' };
    if (type === 'video') return { type: 'video', url: '', thumb: '', alt: '', label: 'Watch the video', align: 'center' };
    if (type === 'logo') return { type: 'logo', url: '', alt: '', width: 180, link: '', align: 'center' };
    if (type === 'html') return { type: 'html', html: '' };
    if (type === 'product') return { type: 'product', url: '', alt: '', name: '', price: '', description: '', label: 'Buy now', link: '', align: 'left' };
    if (type === 'navigation') return { type: 'navigation', align: 'center', links: [{ label: '', url: '' }, { label: '', url: '' }] };
    if (type === 'dynamic') return { type: 'dynamic', text: 'Hello {{first_name|there}},', align: 'left' };
    if (type === 'spacer') return { type: 'spacer', size: 'medium' };
    if (type === 'list') return { type: 'list', text: '' };
    if (type === 'heading') return { type: 'heading', text: '', level: 'large', align: 'left' };
    if (type === 'story') return { type: 'story', text: '', detail: '', url: '', align: 'left' };
    if (type === 'panel') {
      return {
        type: 'panel', background: '#1b4332', text_colour: '#ffffff',
        link_colour: '#b7e4c7', blocks: [{ type: 'heading', text: '', level: 'large', align: 'left' }]
      };
    }
    return { type: 'text', text: '', align: 'left' };
  }
  MR.blankBlock = blank;

  // The studio (mr-studio.js) draws a block's settings with the same field
  // builders as this editor, so a change to a field is made once.
  MR.editorParts = { fields: fields, colourField: colourField, optColourField: optColourField, label: label, types: TYPES, innerTypes: INNER_TYPES };

  function label(block) {
    var t = TYPES.filter(function (x) { return x.value === block.type; })[0];
    return t ? t.label : 'Block';
  }

  var LINK_HINT = 'To link a few words, write them as [the words](https://example.com).';

  /* ---------------- palette ---------------- */
  function palette(api, saved) {
    var box = MR.h('div', { class: 'mr-palette', role: 'group', 'aria-label': 'Blocks you can add' });
    box.appendChild(MR.h('p', { class: 'dr-small', text: 'Drag a block into the campaign, or select one to add it at the end. Drop one inside a colour panel to put it in there.' }));
    TYPES.forEach(function (t) {
      var item = MR.h('button', {
        type: 'button', class: 'mr-palette__item', draggable: 'true',
        'data-type': t.value, text: t.label, title: t.hint,
        onclick: function () { api.add(t.value); }
      });
      item.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/mr-new', t.value);
        e.dataTransfer.effectAllowed = 'copy';
      });
      box.appendChild(item);
    });

    if (saved && saved.length) {
      box.appendChild(MR.h('p', { class: 'dr-small', text: 'Your saved blocks:' }));
      saved.forEach(function (s) {
        var item = MR.h('button', {
          type: 'button', class: 'mr-palette__item mr-palette__item--saved', draggable: 'true',
          'data-saved': s.id, text: s.name,
          onclick: function () { api.addSaved(s); }
        });
        item.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/mr-saved', s.id);
          e.dataTransfer.effectAllowed = 'copy';
        });
        box.appendChild(item);
      });
    }
    return box;
  }

  /* ---------------- one block ----------------
     path is "3" for a top level block, "3.1" for the second block inside the
     panel at position 4. Everything the editor does takes a path. */
  function blockCard(block, path, list, index, api) {
    var card = MR.h('div', {
      class: 'mr-block' + (block.type === 'panel' ? ' mr-block--panel' : ''),
      draggable: 'true', tabindex: '0', 'data-path': path,
      'aria-label': label(block) + ', block ' + (index + 1) + ' of ' + list.length
    });

    card.addEventListener('dragstart', function (e) {
      e.stopPropagation();
      e.dataTransfer.setData('text/mr-move', path);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('is-dragging');
    });
    card.addEventListener('dragend', function () { card.classList.remove('is-dragging'); });

    // keyboard: alt with the arrow keys moves the focused block in its own list
    card.addEventListener('keydown', function (e) {
      if (!e.altKey) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); api.move(path, -1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); api.move(path, 1); }
    });

    var bar = MR.h('div', { class: 'mr-block__bar' },
      MR.h('span', { class: 'dr-tag dr-tag--grey', text: label(block) }),
      MR.h('span', { class: 'mr-block__grip', 'aria-hidden': 'true', text: '☰' }),
      MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary',
        text: 'Move up', disabled: index === 0,
        onclick: function () { api.move(path, -1); }
      }),
      MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary',
        text: 'Move down', disabled: index === list.length - 1,
        onclick: function () { api.move(path, 1); }
      }),
      MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary', text: 'Duplicate',
        onclick: function () { api.duplicate(path); }
      }),
      api.canSave ? MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary', text: 'Save to reuse',
        onclick: function () { api.saveBlock(path); }
      }) : null,
      MR.h('button', {
        type: 'button', class: 'dr-button dr-button--warning', text: 'Remove',
        onclick: function () { api.remove(path); }
      }));
    card.appendChild(bar);
    card.appendChild(fields(block, path, api));
    return card;
  }

  /* ---------------- the fields for one block ---------------- */
  // In the campaign studio the words and links of these blocks are typed on the
  // email itself, so the panel leaves those boxes out. The classic editor does
  // not set api.inline and keeps every box.
  var INLINE_HIDE = {
    text: ['text'], heading: ['text'], list: ['text'], columns: ['left', 'right'], imagetext: ['text'],
    story: ['text', 'detail', 'url'], button: ['label', 'url'],
    product: ['name', 'price', 'description', 'label', 'link']
  };
  var INLINE_HINT = {
    text: 'Type straight into the email. Select words and a link box appears.',
    heading: 'Type straight into the email.',
    list: 'Type straight into the email. Press Enter for a new point.',
    columns: 'Type straight into the email. Select words and a link box appears.',
    imagetext: 'Type beside the picture in the email. Click the grey box to add a picture, or double-click a picture to change it.',
    story: 'Type straight into the email. Click the headline to set where it links to.',
    button: 'Type the words on the button in the email. Click the button to set where it goes.',
    product: 'Type straight into the email. Click the grey box to add a picture. Click the button to set where it goes.',
    image: 'Click the grey box in the email to add a picture, or double-click a picture to change it.'
  };

  function fields(block, path, api) {
    var wrap = fieldsCore(block, path, api);
    var hint = api.inline ? INLINE_HINT[block.type] : '';
    if (hint) wrap.insertBefore(MR.h('p', { class: 'dr-small mr-studio__inlinehint', text: hint }), wrap.firstChild);
    return wrap;
  }

  function fieldsCore(block, path, api) {
    var wrap = MR.h('div');
    var id = 'b' + path.replace(/\./g, '-');

    // True for a box whose job the email itself now does.
    function inlined(fid) {
      if (!api.inline) return false;
      var list = INLINE_HIDE[block.type];
      return !!list && list.indexOf(fid.slice(id.length + 1)) > -1;
    }

    if (block.type === 'panel') {
      wrap.appendChild(colourField(id + '-bg', 'Background', block, 'background', api,
        'The colour behind everything in this panel.'));
      wrap.appendChild(colourField(id + '-ink', 'Text', block, 'text_colour', api,
        'Light text on a dark panel, or the other way round. Check it is easy to read.'));
      wrap.appendChild(colourField(id + '-link', 'Links and buttons', block, 'link_colour', api));
      wrap.appendChild(MR.h('h3', { class: 'dr-h', text: 'Inside this panel' }));
      var inner = MR.h('div', { class: 'mr-panel-canvas', 'data-panel': path });
      wrap.appendChild(inner);
      api.drawInto(inner, block.blocks, path);
      wrap.appendChild(innerPalette(block, path, api));
      return wrap;
    }

    if (block.type === 'divider') {
      wrap.appendChild(MR.h('p', { class: 'dr-small', text: 'A horizontal rule. Nothing to fill in.' }));
      return wrap;
    }

    if (block.type === 'spacer') {
      var sizes = MR.h('select', { class: 'dr-select dr-input--w', id: id + '-size' },
        MR.h('option', { value: 'small', text: 'Small', selected: block.size === 'small' }),
        MR.h('option', { value: 'medium', text: 'Medium', selected: !block.size || block.size === 'medium' }),
        MR.h('option', { value: 'large', text: 'Large', selected: block.size === 'large' }));
      sizes.addEventListener('change', function () { block.size = sizes.value; api.changed(); });
      wrap.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: id + '-size', text: 'How much space' }), sizes));
      return wrap;
    }

    if (block.type === 'story') {
      wrap.appendChild(field(id + '-text', 'Headline', 'text', block.text,
        function (v) { block.text = v; api.changed(); }));
      wrap.appendChild(textArea(id + '-detail', 'The line underneath', block.detail, 2,
        function (v) { block.detail = v; api.changed(); },
        'One sentence. This is the part people skim.'));
      wrap.appendChild(field(id + '-url', 'Link, if the headline should be one', 'url', block.url,
        function (v) { block.url = v; api.changed(); }));
      wrap.appendChild(checkbox(id + '-rule', 'Show a rule above this story', block.rule !== false,
        function (on) { block.rule = on; api.changed(); }));
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    if (block.type === 'image' || block.type === 'imagetext') {
      wrap.appendChild(imageField(block, id, api));
      wrap.appendChild(field(id + '-alt', 'Description of the image', 'text', block.alt,
        function (v) { block.alt = v; api.changed(); },
        'Required. Many readers block images, and some use a screen reader.'));
      if (block.type === 'imagetext') {
        wrap.appendChild(textArea(id + '-text', 'Text beside it', block.text, 4,
          function (v) { block.text = v; api.changed(); }, LINK_HINT));
        var side = MR.h('select', { class: 'dr-select dr-input--w', id: id + '-side' },
          MR.h('option', { value: 'left', text: 'Image on the left', selected: block.side !== 'right' }),
          MR.h('option', { value: 'right', text: 'Image on the right', selected: block.side === 'right' }));
        side.addEventListener('change', function () { block.side = side.value; api.changed(); });
        wrap.appendChild(MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: id + '-side', text: 'Which side' }),
          MR.h('span', { class: 'dr-hint', text: 'On a phone the image always ends up above the text.' }), side));
      } else {
        wrap.appendChild(alignField(id, block, api));
      }
      return wrap;
    }

    if (block.type === 'video') {
      wrap.appendChild(field(id + '-url', 'Video link', 'url', block.url,
        function (v) { block.url = v; api.changed(); },
        'The web address of the video. Email cannot play video, so readers see a picture that opens it.'));
      wrap.appendChild(imageField(block, id, api, 'thumb', 'Thumbnail address',
        'Leave this empty for a YouTube link and its own thumbnail is used. A thumbnail with a play symbol on it works best.'));
      wrap.appendChild(field(id + '-alt', 'Description of the thumbnail', 'text', block.alt,
        function (v) { block.alt = v; api.changed(); },
        'Required. Many readers block images, and some use a screen reader.'));
      wrap.appendChild(field(id + '-label', 'Link text under the thumbnail', 'text', block.label,
        function (v) { block.label = v; api.changed(); }));
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    if (block.type === 'logo') {
      wrap.appendChild(imageField(block, id, api, 'url', 'Logo address',
        'Leave this empty to use the logo saved in your brand settings.'));
      wrap.appendChild(field(id + '-alt', 'Description of the logo', 'text', block.alt,
        function (v) { block.alt = v; api.changed(); },
        'Leave this empty to use the description saved in your brand settings.'));
      wrap.appendChild(field(id + '-link', 'Link, if the logo should be one', 'url', block.link,
        function (v) { block.link = v; api.changed(); }));
      wrap.appendChild(field(id + '-width', 'Width in pixels, from 40 to 552', 'number', block.width,
        function (v) { block.width = parseInt(v, 10) || 180; api.changed(); }));
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    if (block.type === 'html') {
      wrap.appendChild(textArea(id + '-html', 'HTML', block.html, 10,
        function (v) { block.html = v; api.changed(); },
        'Paragraphs, headings, links, lists, bold, italic, underline and images are kept. Scripts, styles, forms and every other tag are removed, because email apps block or ignore them.'));
      return wrap;
    }

    if (block.type === 'product') {
      wrap.appendChild(imageField(block, id, api, 'url', 'Product image address'));
      wrap.appendChild(field(id + '-alt', 'Description of the image', 'text', block.alt,
        function (v) { block.alt = v; api.changed(); },
        'Required when there is an image.'));
      wrap.appendChild(field(id + '-name', 'Name', 'text', block.name, function (v) { block.name = v; api.changed(); }));
      wrap.appendChild(field(id + '-price', 'Price', 'text', block.price, function (v) { block.price = v; api.changed(); },
        'Written as you want it shown, with the currency.'));
      wrap.appendChild(textArea(id + '-description', 'Description', block.description, 3,
        function (v) { block.description = v; api.changed(); }, LINK_HINT));
      wrap.appendChild(field(id + '-label', 'Button text', 'text', block.label, function (v) { block.label = v; api.changed(); }));
      wrap.appendChild(field(id + '-link', 'Button link', 'url', block.link, function (v) { block.link = v; api.changed(); },
        'Leave this empty for no button.'));
      wrap.appendChild(alignField(id, block, api));
      wrap.appendChild(optColourField(id + '-fill', 'Button colour', block, 'colour', api,
        'Empty uses the button colour from the Style tab.'));
      wrap.appendChild(optColourField(id + '-text', 'Button text colour', block, 'text_colour', api));
      return wrap;
    }

    if (block.type === 'navigation') {
      if (!Array.isArray(block.links)) block.links = [];
      block.links.forEach(function (link, i) {
        var row = MR.h('div', { class: 'mr-social-row' },
          field(id + '-l' + i + '-label', 'Name', 'text', link.label, function (v) { link.label = v; api.changed(); }),
          field(id + '-l' + i + '-url', 'Link', 'url', link.url, function (v) { link.url = v; api.changed(); }));
        row.appendChild(MR.h('button', {
          type: 'button', class: 'dr-button dr-button--warning', text: 'Remove',
          onclick: function () { block.links.splice(i, 1); api.redraw(); }
        }));
        wrap.appendChild(row);
      });
      wrap.appendChild(MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary', text: 'Add another link',
        onclick: function () { block.links.push({ label: '', url: '' }); api.redraw(); }
      }));
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    if (block.type === 'dynamic') {
      var area = textArea(id + '-text', 'Text', block.text, 5,
        function (v) { block.text = v; api.changed(); },
        'Fields are filled in for each reader from their record. Add a fallback after a bar, as in {{first_name|there}}, for readers who have none. The preview shows the fallback.');
      var box = area.querySelector('textarea');
      var bar = MR.h('div', { class: 'dr-button-group' });
      [['First name', '{{first_name|there}}'], ['Full name', '{{full_name}}'],
       ['Organisation', '{{organisation}}'], ['Country', '{{country}}']].forEach(function (f) {
        bar.appendChild(MR.h('button', {
          type: 'button', class: 'dr-button dr-button--secondary', text: 'Add ' + f[0].toLowerCase(),
          onclick: function () {
            var at = box.selectionStart == null ? box.value.length : box.selectionStart;
            var to = box.selectionEnd == null ? at : box.selectionEnd;
            box.value = box.value.slice(0, at) + f[1] + box.value.slice(to);
            box.focus();
            box.setSelectionRange(at + f[1].length, at + f[1].length);
            block.text = box.value; api.changed();
          }
        }));
      });
      wrap.appendChild(area);
      wrap.appendChild(bar);
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    if (block.type === 'button') {
      wrap.appendChild(field(id + '-label', 'Button text', 'text', block.label, function (v) { block.label = v; api.changed(); }));
      wrap.appendChild(field(id + '-url', 'Link', 'url', block.url, function (v) { block.url = v; api.changed(); }));
      wrap.appendChild(alignField(id, block, api));
      wrap.appendChild(optColourField(id + '-fill', 'Button colour', block, 'colour', api,
        'Empty uses the button colour from the Style tab.'));
      wrap.appendChild(optColourField(id + '-text', 'Button text colour', block, 'text_colour', api));
      return wrap;
    }

    if (block.type === 'columns') {
      wrap.appendChild(textArea(id + '-left', 'Left column', block.left, 4,
        function (v) { block.left = v; api.changed(); }, LINK_HINT));
      wrap.appendChild(textArea(id + '-right', 'Right column', block.right, 4,
        function (v) { block.right = v; api.changed(); }));
      return wrap;
    }

    if (block.type === 'social') {
      if (!Array.isArray(block.links)) block.links = [];
      var style = MR.h('select', { class: 'dr-select dr-input--w', id: id + '-style' },
        MR.h('option', { value: 'text', text: 'Text links', selected: block.style !== 'icons' }),
        MR.h('option', { value: 'icons', text: 'Icons', selected: block.style === 'icons' }));
      style.addEventListener('change', function () { block.style = style.value; api.redraw(); });
      wrap.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: id + '-style', text: 'How they look' }),
        MR.h('span', { class: 'dr-hint', text: 'Icons are images, and most mail apps block images by default. The description is what a reader sees until they load them, so it has to say which service it is.' }),
        style));
      block.links.forEach(function (link, i) {
        var row = MR.h('div', { class: 'mr-social-row' },
          field(id + '-l' + i + '-label', 'Name', 'text', link.label, function (v) { link.label = v; api.changed(); }),
          field(id + '-l' + i + '-url', 'Link', 'url', link.url, function (v) { link.url = v; api.changed(); }));
        if (block.style === 'icons') {
          row.appendChild(field(id + '-l' + i + '-icon', 'Icon address', 'url', link.icon,
            function (v) { link.icon = v; api.changed(); }));
          if (api.images) {
            row.appendChild(MR.h('button', {
              type: 'button', class: 'dr-button dr-button--secondary', text: 'Choose an icon',
              onclick: function () {
                api.images(function (picked) { link.icon = picked.url; api.redraw(); });
              }
            }));
          }
        }
        row.appendChild(MR.h('button', {
          type: 'button', class: 'dr-button dr-button--warning', text: 'Remove',
          onclick: function () { block.links.splice(i, 1); api.redraw(); }
        }));
        wrap.appendChild(row);
      });
      wrap.appendChild(MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary', text: 'Add another link',
        onclick: function () { block.links.push({ label: '', url: '' }); api.redraw(); }
      }));
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    if (block.type === 'list') {
      wrap.appendChild(textArea(id + '-text', 'One point per line', block.text, 5,
        function (v) { block.text = v; api.changed(); }));
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    if (block.type === 'heading') {
      wrap.appendChild(textArea(id + '-text', 'Title', block.text, 2,
        function (v) { block.text = v; api.changed(); }));
      var level = MR.h('select', { class: 'dr-select dr-input--w', id: id + '-level' },
        MR.h('option', { value: 'large', text: 'Large', selected: block.level !== 'small' }),
        MR.h('option', { value: 'small', text: 'Small', selected: block.level === 'small' }));
      level.addEventListener('change', function () { block.level = level.value; api.changed(); });
      wrap.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: id + '-level', text: 'Size' }), level));
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    wrap.appendChild(textArea(id + '-text', 'Text', block.text, 5,
      function (v) { block.text = v; api.changed(); }, LINK_HINT));
    wrap.appendChild(alignField(id, block, api));
    return wrap;

    /* ---- small field builders ---- */
    function field(fid, labelText, type, value, onInput, hint) {
      if (inlined(fid)) return document.createDocumentFragment();
      var input = MR.h('input', { class: 'dr-input', id: fid, type: type, value: value || '' });
      input.addEventListener('input', function () { onInput(input.value); });
      return MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: fid, text: labelText }),
        hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null, input);
    }

    function textArea(fid, labelText, value, rows, onInput, hint) {
      if (inlined(fid)) return document.createDocumentFragment();
      var area = MR.h('textarea', { class: 'dr-textarea', id: fid, rows: String(rows) });
      area.value = value || '';
      area.addEventListener('input', function () { onInput(area.value); });
      return MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: fid, text: labelText }),
        hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null, area);
    }

    function checkbox(fid, labelText, on, onChange) {
      var input = MR.h('input', { class: 'dr-choice__input', id: fid, type: 'checkbox', checked: on });
      input.addEventListener('change', function () { onChange(input.checked); });
      return MR.h('div', { class: 'dr-choice dr-choice--checkbox' }, input,
        MR.h('label', { class: 'dr-choice__label', for: fid, text: labelText }));
    }

    function imageField(b, fid, a, key, labelText, hint) {
      key = key || 'url';
      var preview = MR.h('div', { class: 'mr-image-field__preview' });
      function drawPreview() {
        preview.textContent = '';
        if (b[key]) preview.appendChild(MR.h('img', { src: b[key], alt: b.alt || '', class: 'mr-thumb' }));
      }
      var input = MR.h('input', { class: 'dr-input', id: fid + '-' + key, type: 'url', value: b[key] || '' });
      input.addEventListener('input', function () { b[key] = input.value; drawPreview(); a.changed(); });
      drawPreview();

      var buttons = MR.h('div', { class: 'dr-button-group' });
      if (a.images) {
        buttons.appendChild(MR.h('button', {
          type: 'button', class: 'dr-button dr-button--secondary', text: 'Choose or upload an image',
          onclick: function () {
            a.images(function (picked) {
              b[key] = picked.url;
              if (!b.alt) b.alt = picked.alt || '';
              a.redraw();
            });
          }
        }));
      }
      return MR.h('div', { class: 'mr-image-field' },
        MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: fid + '-' + key, text: labelText || 'Image address' }),
          MR.h('span', { class: 'dr-hint', text: hint || 'Upload one, or paste the address of an image already online. Keep it under 200KB: readers on mobile data pay for every one.' }),
          input),
        buttons, preview);
    }
  }

  function alignField(id, block, api) {
    if (ALIGNABLE.indexOf(block.type) === -1) return null;
    var select = MR.h('select', { class: 'dr-select dr-input--w', id: id + '-align' },
      MR.h('option', { value: 'left', text: 'Left', selected: (block.align || 'left') === 'left' }),
      MR.h('option', { value: 'center', text: 'Centre', selected: block.align === 'center' }),
      MR.h('option', { value: 'right', text: 'Right', selected: block.align === 'right' }));
    select.addEventListener('change', function () { block.align = select.value; api.changed(); });
    return MR.h('div', { class: 'dr-form-group' },
      MR.h('label', { class: 'dr-label', for: id + '-align', text: 'Alignment' }), select);
  }

  function colourField(id, labelText, block, key, api, hint) {
    var swatch = MR.h('input', { class: 'mr-colour', id: id, type: 'color', value: block[key] || '#000000' });
    var hex = MR.h('input', { class: 'dr-input dr-input--w', id: id + '-hex', type: 'text', value: block[key] || '' });
    swatch.addEventListener('input', function () {
      block[key] = swatch.value; hex.value = swatch.value; api.changed();
    });
    hex.addEventListener('input', function () {
      if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) { block[key] = hex.value; swatch.value = hex.value; api.changed(); }
    });
    hex.addEventListener('blur', function () {
      if (hex.value !== block[key]) hex.value = block[key] || '';
    });
    return MR.h('div', { class: 'dr-form-group' },
      MR.h('label', { class: 'dr-label', for: id, text: labelText }),
      hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null,
      MR.h('div', { class: 'mr-colour-row' }, swatch, hex));
  }

  // A colour that may be left unset, in which case the campaign's own choice
  // applies. "Use default" takes the setting off the block again.
  function optColourField(id, labelText, block, key, api, hint) {
    var cur = block[key] || '';
    var swatch = MR.h('input', { class: 'mr-colour', id: id, type: 'color', value: cur || '#000000' });
    var hex = MR.h('input', { class: 'dr-input dr-input--w', id: id + '-hex', type: 'text', value: cur,
      placeholder: 'Default', maxlength: 7, 'aria-label': labelText + ', as a colour code' });
    var reset = MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Use default', hidden: !cur });
    swatch.addEventListener('input', function () {
      block[key] = swatch.value; hex.value = swatch.value; reset.hidden = false; api.changed();
    });
    hex.addEventListener('input', function () {
      if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) { block[key] = hex.value; swatch.value = hex.value; reset.hidden = false; api.changed(); }
      else if (hex.value === '') { delete block[key]; reset.hidden = true; api.changed(); }
    });
    hex.addEventListener('blur', function () { hex.value = block[key] || ''; });
    reset.addEventListener('click', function () { delete block[key]; hex.value = ''; reset.hidden = true; api.changed(); });
    return MR.h('div', { class: 'dr-form-group' },
      MR.h('label', { class: 'dr-label', for: id, text: labelText }),
      hint ? MR.h('span', { class: 'dr-hint', text: hint }) : null,
      MR.h('div', { class: 'mr-colour-row' }, swatch, hex, reset));
  }

  // A panel's own Add row, so the keyboard reaches inside it too.
  function innerPalette(block, path, api) {
    var box = MR.h('div', { class: 'mr-palette mr-palette--inner', role: 'group',
      'aria-label': 'Blocks you can add inside this panel' });
    box.appendChild(MR.h('p', { class: 'dr-small', text: 'Add inside this panel:' }));
    INNER_TYPES.forEach(function (t) {
      box.appendChild(MR.h('button', {
        type: 'button', class: 'mr-palette__item', 'data-inner': t.value, text: t.label, title: t.hint,
        onclick: function () { api.add(t.value, path + '.' + block.blocks.length); }
      }));
    });
    return box;
  }

  /* ---------------- the editor ----------------
     opts: { saved: [...], images: function(pick), onSaveBlock: function(blocks) } */
  MR.editor = function (target, campaign, onChange, opts) {
    opts = opts || {};
    var canvas = MR.h('div', { class: 'mr-canvas', id: 'mr-canvas' });
    var paletteBox = MR.h('div');
    var saved = opts.saved || [];

    // "3" or "3.1" into the array that holds it and the position in it.
    function resolve(path) {
      var parts = String(path).split('.').map(Number);
      if (parts.length === 1) return { list: campaign.body_blocks, index: parts[0] };
      var parent = campaign.body_blocks[parts[0]];
      if (!parent || !Array.isArray(parent.blocks)) return null;
      return { list: parent.blocks, index: parts[1] };
    }

    var api = {
      canSave: !!opts.onSaveBlock,
      images: opts.images || null,
      count: function () { return campaign.body_blocks.length; },
      changed: function () { onChange(); },
      redraw: function () { draw(); onChange(); },

      move: function (path, dir) {
        var at = resolve(path);
        if (!at) return;
        var to = at.index + dir;
        if (to < 0 || to >= at.list.length) return;
        var block = at.list.splice(at.index, 1)[0];
        at.list.splice(to, 0, block);
        draw();
        onChange();
        MR.announce(label(block) + ' moved to position ' + (to + 1));
        var parts = String(path).split('.');
        parts[parts.length - 1] = String(to);
        var moved = canvas.querySelector('[data-path="' + parts.join('.') + '"]');
        if (moved) moved.focus();
      },

      remove: function (path) {
        var at = resolve(path);
        if (!at) return;
        var block = at.list.splice(at.index, 1)[0];
        if (!campaign.body_blocks.length) campaign.body_blocks.push(blank('text'));
        draw();
        onChange();
        MR.announce(label(block) + ' removed');
      },

      duplicate: function (path) {
        var at = resolve(path);
        if (!at) return;
        var copy = JSON.parse(JSON.stringify(at.list[at.index]));
        at.list.splice(at.index + 1, 0, copy);
        draw();
        onChange();
        MR.announce(label(copy) + ' duplicated');
      },

      // path is where to put it: "2" means position 3 at the top level,
      // "2.0" means the first position inside the panel at position 3.
      add: function (type, path) {
        var block = blank(type);
        if (path === undefined || path === null) {
          campaign.body_blocks.push(block);
        } else {
          var at = resolve(path);
          if (!at) return;
          if (at.list !== campaign.body_blocks && type === 'panel') return;
          at.list.splice(at.index, 0, block);
        }
        draw();
        onChange();
        MR.announce(label(block) + ' added');
      },

      addSaved: function (s, path) {
        var blocks = JSON.parse(JSON.stringify(s.blocks || []));
        if (!blocks.length) return;
        var at = path === undefined || path === null
          ? { list: campaign.body_blocks, index: campaign.body_blocks.length }
          : resolve(path);
        if (!at) return;
        if (at.list !== campaign.body_blocks) {
          blocks = blocks.filter(function (b) { return b.type !== 'panel'; });
          if (!blocks.length) return;
        }
        Array.prototype.splice.apply(at.list, [at.index, 0].concat(blocks));
        draw();
        onChange();
        MR.announce(s.name + ' added');
      },

      saveBlock: function (path) {
        var at = resolve(path);
        if (!at) return;
        opts.onSaveBlock([at.list[at.index]], function (row) {
          saved = saved.concat([row]);
          drawPalette();
        });
      },

      setSaved: function (list) { saved = list || []; drawPalette(); },

      // Used by a panel to draw its own children into its card.
      drawInto: function (box, list, parentPath) {
        box.textContent = '';
        list.forEach(function (b, i) {
          box.appendChild(dropZone(parentPath + '.' + i));
          box.appendChild(blockCard(b, parentPath + '.' + i, list, i, api));
        });
        box.appendChild(dropZone(parentPath + '.' + list.length));
      }
    };

    function drawPalette() {
      paletteBox.textContent = '';
      paletteBox.appendChild(palette(api, saved));
    }

    function draw() {
      canvas.textContent = '';
      campaign.body_blocks.forEach(function (b, i) {
        canvas.appendChild(dropZone(String(i)));
        canvas.appendChild(blockCard(b, String(i), campaign.body_blocks, i, api));
      });
      canvas.appendChild(dropZone(String(campaign.body_blocks.length)));
    }

    function dropZone(path) {
      var zone = MR.h('div', { class: 'mr-drop', 'data-drop': path, 'aria-hidden': 'true' });
      zone.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add('is-over');
      });
      zone.addEventListener('dragleave', function () { zone.classList.remove('is-over'); });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('is-over');

        var newType = e.dataTransfer.getData('text/mr-new');
        if (newType) { api.add(newType, path); return; }

        var savedId = e.dataTransfer.getData('text/mr-saved');
        if (savedId) {
          var s = saved.filter(function (x) { return String(x.id) === String(savedId); })[0];
          if (s) api.addSaved(s, path);
          return;
        }

        var from = e.dataTransfer.getData('text/mr-move');
        if (!from) return;
        moveTo(from, path);
      });
      return zone;
    }

    // Moving a block, possibly from the top level into a panel or back out.
    function moveTo(fromPath, toPath) {
      if (fromPath === toPath) return;
      var from = resolve(fromPath);
      if (!from) return;
      var block = from.list[from.index];
      // A panel cannot be dropped inside another panel.
      var intoPanel = String(toPath).indexOf('.') > -1;
      if (block.type === 'panel' && intoPanel) {
        MR.announce('A colour panel cannot go inside another panel');
        return;
      }
      // Nor can a panel be dropped inside itself.
      if (intoPanel && String(toPath).split('.')[0] === String(fromPath)) return;

      from.list.splice(from.index, 1);
      var to = resolve(toPath);
      if (!to) { from.list.splice(from.index, 0, block); return; }
      var index = to.index;
      if (to.list === from.list && index > from.index) index -= 1;
      to.list.splice(index, 0, block);
      draw();
      onChange();
      MR.announce(label(block) + ' moved');
    }

    target.textContent = '';
    target.appendChild(paletteBox);
    target.appendChild(canvas);
    target.appendChild(MR.h('p', { class: 'dr-small', text: 'Keyboard: focus a block and hold Alt with the up or down arrow to move it within its list, or use the Move buttons. To put a block inside a colour panel without a mouse, use the Add row inside that panel.' }));
    drawPalette();
    draw();
    return api;
  };

  /* ---------------- previews ---------------- */
  var VIEWS = [
    { value: 'desktop', label: 'Desktop', width: 660 },
    { value: 'phone', label: 'Phone', width: 390 },
    { value: 'outlook', label: 'Outlook', width: 660 },
    { value: 'dark', label: 'Dark mode', width: 660 },
    { value: 'text', label: 'Plain text', width: 660 }
  ];

  MR.preview = function (target, getCampaign, getAccount, getBrand) {
    var view = 'desktop';
    var frame = MR.h('iframe', {
      class: 'mr-preview__frame', title: 'Email preview', id: 'mr-preview-frame'
    });
    var textBox = MR.h('pre', { class: 'mr-preview__text', hidden: true, id: 'mr-preview-text' });
    var note = MR.h('p', { class: 'dr-small', id: 'mr-preview-note' });

    var tabs = MR.h('div', { class: 'mr-preview__tabs', role: 'tablist', 'aria-label': 'Preview' });
    VIEWS.forEach(function (v) {
      tabs.appendChild(MR.h('button', {
        type: 'button', role: 'tab', class: 'mr-preview__tab', 'data-view': v.value,
        'aria-selected': v.value === view ? 'true' : 'false', text: v.label,
        onclick: function () { view = v.value; render(); }
      }));
    });

    target.textContent = '';
    target.appendChild(tabs);
    target.appendChild(frame);
    target.appendChild(textBox);
    target.appendChild(note);

    function render() {
      var campaign = getCampaign();
      var account = getAccount() || { name: 'Your organisation', postal_address: 'Your postal address' };
      var brand = getBrand ? getBrand() : null;
      Array.prototype.forEach.call(tabs.children, function (b) {
        var on = b.getAttribute('data-view') === view;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.classList.toggle('is-on', on);
      });

      if (view === 'text') {
        frame.hidden = true;
        textBox.hidden = false;
        textBox.textContent = MR.renderText(campaign, account, 'https://ami.abta.africa/mailroom/unsubscribe.html?token=…');
        note.textContent = 'The plain text version, sent alongside the HTML. Some readers, and some filters, see only this.';
        return;
      }

      frame.hidden = false;
      textBox.hidden = true;
      var html = MR.renderEmail(campaign, account, { outlook: view === 'outlook', brand: brand });
      if (view === 'dark') {
        html = html.replace('<body style="margin:0;padding:0;background-color:#f3f2f1">',
          '<body style="margin:0;padding:0;background-color:#0b0c0c">')
          .replace(/background-color:#ffffff/g, 'background-color:#14181c')
          .replace(/color:#1a1208/g, 'color:#f3f2f1');
      }
      var v = VIEWS.filter(function (x) { return x.value === view; })[0];
      frame.style.width = v.width + 'px';
      frame.setAttribute('width', String(v.width));
      frame.srcdoc = html;

      note.textContent = {
        desktop: 'How it looks in most mail apps at full width.',
        phone: 'At 390px, the width of a common phone. Columns stack here.',
        outlook: 'An approximation of Outlook on Windows: square button, no rounded corners, fallback font, and columns that stay side by side. Outlook cannot be simulated exactly, so send a test before a real campaign.',
        dark: 'An approximation of dark mode. Mail apps recolour differently, so check a test message on your own phone. A colour panel keeps its own colours, which is usually what you want.',
        text: ''
      }[view];
    }

    render();
    return { refresh: render };
  };
})();
