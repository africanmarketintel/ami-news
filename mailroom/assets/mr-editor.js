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

  // The icons that come with the Mailroom, and the colours they come in.
  var SOCIAL_NETWORKS = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['x', 'X'], ['pinterest', 'Pinterest'], ['spotify', 'Spotify'],
    ['patreon', 'Patreon'], ['linkedin', 'LinkedIn'], ['youtube', 'YouTube'], ['tiktok', 'TikTok']];
  var SOCIAL_COLOURS = [['dark', 'Black'], ['grey', 'Grey'], ['white', 'White'], ['clay', 'Terracotta'], ['green', 'Green'], ['blue', 'Blue'],
    ['purple', 'Purple'], ['rose', 'Rose'], ['gold', 'Gold']];
  function labelOf(key) { var n = SOCIAL_NETWORKS.filter(function (x) { return x[0] === key; })[0]; return n ? n[1] : ''; }
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
      wrap.appendChild(altGroup(block, id, api, {
        decorative: 'This picture is only decoration. Screen readers skip it.'
      }));
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
        wrap.appendChild(checkbox(id + '-full', 'Full width, edge to edge', block.full === true,
          function (on) { if (on) block.full = true; else delete block.full; api.changed(); }));
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
      wrap.appendChild(altGroup(block, id, api, {
        label: 'Description of the thumbnail',
        hint: 'What the thumbnail shows, or the name of the video. The thumbnail is a link, so this is what a screen reader says the link is.'
      }));
      wrap.appendChild(field(id + '-label', 'Link text under the thumbnail', 'text', block.label,
        function (v) { block.label = v; api.changed(); }));
      wrap.appendChild(alignField(id, block, api));
      return wrap;
    }

    if (block.type === 'logo') {
      wrap.appendChild(imageField(block, id, api, 'url', 'Logo address',
        'Leave this empty to use the logo saved in your brand settings.'));
      wrap.appendChild(altGroup(block, id, api, {
        label: 'Description of the logo',
        hint: 'What the logo says, usually your organisation name. Leave this empty to use the description saved in your brand settings.'
      }));
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
      wrap.appendChild(altGroup(block, id, api, {
        hint: ALT_HINT + ' Needed when there is an image.',
        decorative: 'The name beside it says everything. Screen readers skip the picture.'
      }));
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
        onclick: function () {
          block.links.push(block.style === 'icons' ? { label: 'Facebook', url: '', network: 'facebook' } : { label: '', url: '' });
          api.redraw();
        }
      }));
      if (block.style === 'icons') {
        var col = MR.h('select', { class: 'dr-select dr-input--w', id: id + '-icol' });
        SOCIAL_COLOURS.forEach(function (c) {
          col.appendChild(MR.h('option', { value: c[0], text: c[1], selected: (block.icon_colour || 'dark') === c[0] }));
        });
        col.addEventListener('change', function () { if (col.value === 'dark') delete block.icon_colour; else block.icon_colour = col.value; api.changed(); });
        wrap.appendChild(MR.h('div', { class: 'dr-form-group' },
          MR.h('label', { class: 'dr-label', for: id + '-icol', text: 'Icon colour' }),
          MR.h('span', { class: 'dr-hint', text: 'Applies to the built-in icons. A picture of your own keeps its own colours.' }), col));
      }
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
          // One of the built-in networks, or a picture of the member's own.
          var net = MR.h('select', { class: 'dr-select dr-input--w', id: id + '-l' + i + '-net', 'aria-label': 'Network for link ' + (i + 1) },
            MR.h('option', { value: '', text: 'My own picture', selected: !link.network }));
          SOCIAL_NETWORKS.forEach(function (n) {
            net.appendChild(MR.h('option', { value: n[0], text: n[1], selected: link.network === n[0] }));
          });
          net.addEventListener('change', function () {
            var was = link.network ? labelOf(link.network) : '';
            link.network = net.value;
            if (!link.label || link.label === was) link.label = net.value ? labelOf(net.value) : '';
            api.redraw();
          });
          row.appendChild(MR.h('div', { class: 'dr-form-group' },
            MR.h('label', { class: 'dr-label', for: id + '-l' + i + '-net', text: 'Network' }), net));
          if (!link.network) {
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

    /* The description of a picture, with a tick for a picture that is only
       decoration. The description belongs to this use of the picture, not to
       the file: one photo can inform in one email and decorate in another, so
       it is asked for here and not when the file is uploaded. A decorative
       picture is sent with an empty description, which tells a screen reader
       to skip it. Keep it short: 125 characters is about what is read out well. */
    var ALT_HINT = 'One short sentence on what the picture shows. If it contains words, include them. There is no need to start with \u201cimage of\u201d.';
    function altGroup(block, id, api, o) {
      o = o || {};
      var input = MR.h('input', { class: 'dr-input', id: id + '-alt', type: 'text', value: block.alt || '' });
      var hint = MR.h('span', { class: 'dr-hint', id: id + '-alt-hint', text: o.hint || ALT_HINT });
      var length = MR.h('span', { class: 'dr-hint', id: id + '-alt-length', role: 'status' });
      input.setAttribute('aria-describedby', id + '-alt-hint ' + id + '-alt-length');
      function measure() {
        var n = input.value.length;
        length.textContent = n > 125 ? 'That is ' + n + ' characters. Under 125 is easier to listen to.' : '';
      }
      input.addEventListener('input', function () { block.alt = input.value; measure(); api.changed(); });
      var out = document.createDocumentFragment();
      out.appendChild(MR.h('div', { class: 'dr-form-group' },
        MR.h('label', { class: 'dr-label', for: id + '-alt', text: o.label || 'Description of the image' }),
        hint, input, length));
      if (o.decorative) {
        input.disabled = !!block.decorative;
        out.appendChild(checkbox(id + '-decor', o.decorative, !!block.decorative, function (on) {
          if (on) block.decorative = true; else delete block.decorative;
          input.disabled = on;
          api.changed();
        }));
      }
      measure();
      return out;
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

  // Left, centre and right as three icon buttons, so the choice is one click.
  // Each button still has its words for a screen reader and a tooltip.
  var ALIGN_ICONS = {
    left: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
    center: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
    right: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'
  };
  function alignField(id, block, api) {
    if (ALIGNABLE.indexOf(block.type) === -1) return null;
    var cur = block.align || 'left';
    var group = MR.h('div', { class: 'mr-seg', role: 'group', id: id + '-align', 'aria-labelledby': id + '-align-label' });
    [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']].forEach(function (o) {
      var b = MR.h('button', { type: 'button', class: 'mr-seg__btn', title: o[1], 'aria-label': o[1], 'aria-pressed': cur === o[0] ? 'true' : 'false' });
      b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' + ALIGN_ICONS[o[0]] + '</svg>';
      b.addEventListener('click', function () {
        block.align = o[0];
        Array.prototype.forEach.call(group.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        api.changed();
      });
      group.appendChild(b);
    });
    return MR.h('div', { class: 'dr-form-group mr-field--inline' },
      MR.h('span', { class: 'dr-label', id: id + '-align-label', text: 'Alignment' }), group);
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
  // The three tabs. Each has an icon and a word. The icon is decoration, so
  // the word is what a screen reader reads.
  var VIEW_ICONS = {
    desktop: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
    inbox: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'
  };
  var VIEWS = [
    { value: 'desktop', label: 'Desktop', width: 660 },
    { value: 'phone', label: 'Phone', width: 390 },
    { value: 'inbox', label: 'Email', width: 660 }
  ];
  // The Dark mode, Outlook, Images off and Plain text views are not offered as
  // tabs. The code that draws them is kept below: add { value: 'dark' |
  // 'outlook' | 'images' | 'text', label: ..., width: 660 } to VIEWS to bring
  // one back. The plain text version of every email is still sent.

  /* ---------------- checks before sending ----------------
     What can be checked without a mail app: the size of the HTML, which Gmail
     cuts off above 102 KB; images with no description, which a screen reader
     skips and which show as an empty box when images are blocked; and buttons
     that go nowhere. A real look in 20 or more mail apps needs a testing
     service, which this does not replace: send a test to your own addresses. */
  var GMAIL_CLIP_KB = 102;

  function bytes(str) {
    try { return new TextEncoder().encode(str).length; } catch (e) { return str.length; }
  }

  // Pictures with neither a description nor the tick that says they are
  // only decoration. A picture in an HTML block counts when it has no alt
  // attribute at all: writing alt="" there is the same decision.
  function undescribed(blocks) {
    var n = 0;
    (function walk(list) {
      (Array.isArray(list) ? list : []).forEach(function (b) {
        if (!b || typeof b !== 'object') return;
        var told = String(b.alt || '').trim() !== '' || b.decorative === true;
        var url = String(b.url || '').trim() !== '';
        if ((b.type === 'image' || b.type === 'imagetext') && !told) n++;
        if (b.type === 'product' && url && !told) n++;
        if (b.type === 'video' && (url || String(b.thumb || '').trim()) && !String(b.alt || '').trim()) n++;
        if (b.type === 'logo' && url && !String(b.alt || '').trim()) n++;
        if (b.type === 'html') n += (String(b.html || '').match(/<img\b(?![^>]*\balt\s*=)[^>]*>/gi) || []).length;
        if (Array.isArray(b.blocks)) walk(b.blocks);
      });
    })(blocks);
    return n;
  }

  function linklessButtons(blocks) {
    var n = 0;
    (function walk(list) {
      (Array.isArray(list) ? list : []).forEach(function (b) {
        if (!b || typeof b !== 'object') return;
        if (b.type === 'button' && !String(b.link || '').trim()) n++;
        if (Array.isArray(b.blocks)) walk(b.blocks);
      });
    })(blocks);
    return n;
  }

  function checkList(campaign, account, brand) {
    var html = MR.renderEmail(campaign, account, { brand: brand });
    var kb = Math.round(bytes(html) / 1024 * 10) / 10;
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var noAlt = undescribed(campaign.body_blocks);
    var buttons = linklessButtons(campaign.body_blocks);
    var out = [];
    out.push(kb > GMAIL_CLIP_KB * 0.9
      ? { ok: false, text: 'The email is about ' + kb + ' KB before link tracking is added. Gmail cuts off the end of a message above ' + GMAIL_CLIP_KB + ' KB and hides it behind \u201cView entire message\u201d. Remove blocks or repeated sections.' }
      : { ok: true, text: 'Size: about ' + kb + ' KB, under the ' + GMAIL_CLIP_KB + ' KB where Gmail starts cutting messages off.' });
    out.push(noAlt
      ? { ok: false, text: (noAlt === 1 ? '1 image has' : noAlt + ' images have') + ' no description. Add one, which a screen reader reads out and which shows when images are blocked. If a picture adds nothing for someone who cannot see it, tick that it is only decoration.' }
      : { ok: true, text: 'Every image has a description or is marked as decoration.' });
    out.push(buttons
      ? { ok: false, text: (buttons === 1 ? '1 button has' : buttons + ' buttons have') + ' no link, so a reader who presses it goes nowhere.' }
      : { ok: true, text: 'Every button has a link.' });
    return out;
  }

  // The email as it looks when a mail app blocks images: each picture is
  // replaced by its description, or by a note that it has none.
  function withoutImages(html) {
    return html.replace(/<img\b[^>]*>/gi, function (tag) {
      var m = /\balt="([^"]*)"/i.exec(tag);
      var alt = m ? m[1].trim() : '';
      var box = 'display:block;padding:12px;border:1px dashed #8a8d8f;background:#f3f2f1;color:#3b3f42;font:14px/1.4 Arial,sans-serif;';
      return alt ? '<span style="' + box + '">' + alt + '</span>'
        : '<span style="' + box + 'font-style:italic">No description: nothing shows here</span>';
    });
  }

  MR.preview = function (target, getCampaign, getAccount, getBrand, getSender) {
    var view = 'desktop';
    var frame = MR.h('iframe', {
      class: 'mr-preview__frame', title: 'Email preview', id: 'mr-preview-frame'
    });
    var textBox = MR.h('pre', { class: 'mr-preview__text', hidden: true, id: 'mr-preview-text' });
    var inbox = MR.h('div', { class: 'mr-inbox', hidden: true, id: 'mr-preview-inbox' });
    var note = MR.h('p', { class: 'dr-small', id: 'mr-preview-note' });
    var checks = MR.h('div', { class: 'mr-preview__checks', id: 'mr-preview-checks' });

    var tabs = MR.h('div', { class: 'mr-preview__tabs', role: 'tablist', 'aria-label': 'Preview' });
    VIEWS.forEach(function (v) {
      var tab = MR.h('button', {
        type: 'button', role: 'tab', class: 'mr-preview__tab', 'data-view': v.value,
        'aria-selected': v.value === view ? 'true' : 'false',
        onclick: function () { view = v.value; render(); }
      });
      var ic = MR.h('span', { class: 'mr-preview__tabicon', 'aria-hidden': 'true' });
      ic.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" ' +
        'stroke-linecap="round" stroke-linejoin="round" focusable="false">' + (VIEW_ICONS[v.value] || '') + '</svg>';
      tab.appendChild(ic);
      tab.appendChild(MR.h('span', { text: v.label }));
      tabs.appendChild(tab);
    });

    target.textContent = '';
    target.appendChild(tabs);
    target.appendChild(inbox);
    target.appendChild(frame);
    target.appendChild(textBox);
    target.appendChild(note);
    target.appendChild(checks);

    function drawChecks(campaign, account, brand) {
      checks.textContent = '';
      checks.appendChild(MR.h('h3', { class: 'dr-h', text: 'Checks before you send' }));
      var ul = MR.h('ul', { class: 'mr-preview__checklist' });
      checkList(campaign, account, brand).forEach(function (c) {
        ul.appendChild(MR.h('li', { class: c.ok ? 'is-ok' : 'is-fix' },
          MR.h('strong', { text: c.ok ? 'Fine: ' : 'Fix: ' }), c.text));
      });
      checks.appendChild(ul);
      checks.appendChild(MR.h('p', { class: 'dr-small', text: 'These views are close approximations. They do not show how every mail app draws the email, so send a test to your own addresses before a real send.' }));
    }

    // The Email tab: what a reader sees before opening (who it is from, the
    // subject and the preview text), then the email itself below it.
    function drawInbox(campaign, account) {
      inbox.textContent = '';
      var who = getSender ? getSender() : null;
      var name = String((who && who.name) || campaign.from_name || account.name || '').trim() || 'Sender name';
      var address = who && who.address ? String(who.address) : '';
      var subject = String(campaign.subject || '').trim();
      var pre = String(campaign.preheader || '').trim();
      function line(label, value, empty) {
        return MR.h('div', { class: 'mr-inbox__item' },
          MR.h('span', { class: 'mr-inbox__label', text: label }),
          MR.h('span', { class: 'mr-inbox__value' + (value ? '' : ' is-empty'), text: value || empty }));
      }
      inbox.appendChild(line('From:', name + (address ? ' <' + address + '>' : ''), ''));
      inbox.appendChild(line('Subject:', subject, 'No subject yet'));
      inbox.appendChild(line('Preview:', pre, 'No preview text set. Mail apps show the first words of the email instead.'));
    }

    function render() {
      var campaign = getCampaign();
      var account = getAccount() || { name: 'Your organisation', postal_address: 'Your postal address' };
      var brand = getBrand ? getBrand() : null;
      Array.prototype.forEach.call(tabs.children, function (b) {
        var on = b.getAttribute('data-view') === view;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.classList.toggle('is-on', on);
      });

      drawChecks(campaign, account, brand);

      inbox.hidden = view !== 'inbox';
      if (view === 'inbox') drawInbox(campaign, account);

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
      if (view === 'images') html = withoutImages(html);
      var v = VIEWS.filter(function (x) { return x.value === view; })[0];
      frame.style.width = v.width + 'px';
      frame.setAttribute('width', String(v.width));
      frame.srcdoc = html;

      note.textContent = {
        desktop: 'How it looks in most mail apps at full width.',
        phone: 'At 390px, the width of a common phone. Columns stack here.',
        outlook: 'An approximation of Outlook on Windows: square button, no rounded corners, fallback font, and columns that stay side by side. Outlook cannot be simulated exactly, so send a test before a real campaign.',
        dark: 'An approximation of dark mode. Mail apps recolour differently, so check a test message on your own phone. A colour panel keeps its own colours, which is usually what you want.',
        images: 'How it looks when a mail app blocks images, which many do until the reader allows them. Each picture is replaced by its description. A dashed box that says there is no description is fine for a picture that is only decoration, and a gap for anything else.',
        text: '',
        inbox: 'The sender, subject and preview text are what a reader sees in an inbox before opening the email. Mail apps cut long lines off at different points, so put the most important words first.'
      }[view];
    }

    render();
    return { refresh: render };
  };
})();
