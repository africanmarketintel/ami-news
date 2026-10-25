/* ==========================================================================
   The layout gallery (mr-gallery.js)
   One gallery of starter layouts, used in two places: the "Write a campaign"
   page, where choosing a layout starts a campaign, and the public Templates
   page, where choosing a layout is a link to the editor.

   MR.templateGallery({
     root       the element to draw into
     account    what the previews show as the sender (name, postal address)
     onUse      function (layout) for the editor; or
     hrefFor    function (layout) -> address, for a page that links instead
     onBlank    function (blank layout), if "Start with a blank page" is offered
   })

   Layouts are grouped by what the sender wants to do (MR.TEMPLATE_GROUPS).
   A tab shows one group with a line on what it is for; the search box looks
   across all of them. Previews are drawn only as they come into view, so
   sixty layouts do not load at once.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  function layoutFacts(t) {
      var pics = false, button = false;
      (function walk(list) {
        list.forEach(function (b) {
          if (b.type === 'image' || b.type === 'imagetext' || b.type === 'product') pics = true;
          if (b.type === 'button' || b.type === 'product') button = true;
          if (Array.isArray(b.blocks)) walk(b.blocks);
        });
      })(t.blocks || []);
      return [pics ? 'With pictures' : 'Text only', button ? 'Has a button' : 'No button'];
    }


  MR.templateGallery = function (o) {
      var all = (MR.TEMPLATES || []).filter(function (t) { return t.id !== 'blank'; });
      var groups = (MR.TEMPLATE_GROUPS || []).filter(function (g) {
        return all.some(function (t) { return t.category === g.name; });
      });
      var current = 'All', term = '';

      var wrap = o.root;
      var account = o.account;
      function useLayout(t) { o.onUse(t); }
      function thumbAction(t) { if (o.hrefFor) preview(t); else useLayout(t); }
      // On a page that cannot open the editor itself the choice is a link.
      function useControl(t, quiet) {
        var label = 'Use this layout';
        var aria = 'Use the layout: ' + t.name;
        if (o.hrefFor) return MR.h('a', { class: 'dr-button', href: o.hrefFor(t), 'aria-label': aria, text: label });
        return MR.h('button', { type: 'button', class: 'dr-button', 'data-template': t.id, 'aria-label': aria, text: label, onclick: function () { useLayout(t); } });
      }
      var blank = o.onBlank ? MR.TEMPLATES.filter(function (t) { return t.id === 'blank'; })[0] : null;


      var search = MR.h('input', { class: 'dr-input', id: 'mr-tpl-q', type: 'search', autocomplete: 'off', placeholder: 'For example: sale, event, thank you' });
      wrap.appendChild(MR.h('div', { class: 'mr-tpl-tools' },
        MR.h('div', { class: 'mr-tpl-tools__search' },
          MR.h('label', { class: 'dr-label', for: 'mr-tpl-q', text: 'Search layouts' }), search),
        blank ? MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Start with a blank page', onclick: function () { o.onBlank(blank); } }) : null));

      var tabs = MR.h('div', { class: 'mr-tpl-tabs', role: 'group', 'aria-label': 'Types of layout' });
      var tabButtons = {};
      function count(g) { return all.filter(function (t) { return g === 'All' || t.category === g; }).length; }
      ['All'].concat(groups.map(function (g) { return g.name; })).forEach(function (g) {
        var b = MR.h('button', { type: 'button', class: 'mr-tpl-tab', 'aria-pressed': g === current ? 'true' : 'false',
          onclick: function () { current = g; refresh(true); } },
          g === 'All' ? 'All layouts' : g, MR.h('span', { class: 'mr-tpl-tab__n', text: String(count(g)) }));
        tabButtons[g] = b; tabs.appendChild(b);
      });
      wrap.appendChild(tabs);
      var about = MR.h('p', { class: 'mr-tpl-about', role: 'status' });
      wrap.appendChild(about);

      var grid = MR.h('div', { class: 'mr-tpl-grid', id: 'mr-templates' });
      // Each layout sits on its own coloured panel, so the grid reads as a set
      // of finished designs rather than a list of thumbnails.
      var PANELS = ['#c9c0f2', '#e8795e', '#8091bd', '#b4b57a', '#4a1426', '#efd56b', '#9db39d', '#c4d6fb', '#e9b9a0', '#2d4a3e', '#d8a6c3', '#f3c969'];
      var cards = [];
      var seen = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          seen.unobserve(e.target);
          var f = e.target.querySelector('iframe');
          if (f && !f.getAttribute('srcdoc')) f.srcdoc = f.getAttribute('data-id') && MR.templatePreviewHtml ? MR.templatePreviewHtml(f.getAttribute('data-id'), account) : '';
        });
      }, { rootMargin: '500px 0px' }) : null;

      all.forEach(function (t, n) {
        var frame = MR.h('iframe', { class: 'mr-tpl__frame', tabindex: '-1', sandbox: '', title: '', 'data-id': t.id });
        var thumb = MR.h('div', { class: 'mr-tpl__thumb', 'aria-hidden': 'true', style: '--tpl-bg:' + PANELS[n % PANELS.length], onclick: function () { thumbAction(t); } }, frame);
        var facts = MR.h('p', { class: 'mr-tpl__facts' });
        layoutFacts(t).forEach(function (f) { facts.appendChild(MR.h('span', { text: f })); });
        var card = MR.h('div', { class: 'mr-tpl', 'data-group': t.category || '' },
          thumb,
          MR.h('div', { class: 'mr-tpl__body' },
            t.category ? MR.h('span', { class: 'mr-tpl__cat', text: t.category }) : null,
            MR.h('h2', { class: 'mr-tpl__name', text: t.name }),
            MR.h('p', { class: 'dr-small', text: t.summary }),
            facts,
            MR.h('div', { class: 'mr-tpl__actions' },
              useControl(t),
              MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', 'aria-label': 'Preview the layout: ' + t.name, text: 'Preview', onclick: function () { preview(t); } }))));
        card._t = t; card._frame = frame;
        cards.push(card); grid.appendChild(card);
        if (seen) seen.observe(card); else frame.srcdoc = MR.templatePreviewHtml ? MR.templatePreviewHtml(t.id, account) : '';
      });
      wrap.appendChild(grid);
      var none = MR.h('p', { class: 'mr-tpl-none', hidden: true, text: 'No layouts match. Try a simpler word, or choose All layouts.' });
      wrap.appendChild(none);

      function refresh(announce) {
        Object.keys(tabButtons).forEach(function (k) { tabButtons[k].setAttribute('aria-pressed', k === current ? 'true' : 'false'); });
        var q = term.trim().toLowerCase();
        var shown = 0;
        cards.forEach(function (c) {
          var t = c._t;
          var inGroup = current === 'All' || t.category === current;
          var hit = !q || (t.name + ' ' + t.summary + ' ' + (t.category || '')).toLowerCase().indexOf(q) !== -1;
          c.hidden = !(inGroup && hit);
          if (!c.hidden) shown += 1;
        });
        var g = groups.filter(function (x) { return x.name === current; })[0];
        about.textContent = (g ? g.about + '. ' : '') + shown + (shown === 1 ? ' layout' : ' layouts') + (q ? ' match "' + term.trim() + '".' : '.');
        none.hidden = shown !== 0;
        if (announce) MR.announce(about.textContent);
      }
      search.addEventListener('input', function () { term = search.value; refresh(false); });
      refresh(false);

      function preview(t) {
        var dlg = MR.h('dialog', { class: 'mr-tpl-dialog', 'aria-labelledby': 'mr-tpl-dlg-h' });
        var frame = MR.h('iframe', { class: 'mr-tpl-dialog__frame', sandbox: '', title: 'Preview of the ' + t.name + ' layout' });
        frame.srcdoc = MR.templatePreviewHtml ? MR.templatePreviewHtml(t.id, account) : '';
        function close() { dlg.close ? dlg.close() : dlg.removeAttribute('open'); dlg.remove(); }
        dlg.appendChild(MR.h('div', { class: 'mr-tpl-dialog__head' },
          MR.h('h2', { id: 'mr-tpl-dlg-h', text: t.name }),
          MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Close', onclick: close })));
        dlg.appendChild(MR.h('p', { class: 'dr-small', text: t.summary + ' The words and facts are examples for you to replace.' }));
        dlg.appendChild(frame);
        dlg.appendChild(MR.h('div', { class: 'mr-tpl__actions' },
          o.hrefFor ? useControl(t) : MR.h('button', { type: 'button', class: 'dr-button', text: 'Use this layout', onclick: function () { close(); useLayout(t); } })));
        dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
        document.body.appendChild(dlg);
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      }

      wrap.appendChild(MR.h('section', { class: 'mr-tpl-faq', 'aria-labelledby': 'mr-tpl-faq-h' },
        MR.h('h2', { id: 'mr-tpl-faq-h', text: 'Questions about layouts' }),
        [['Can I change everything in a layout?', 'Yes. Every part is an ordinary block. Change the words, swap the pictures, move parts around, delete what you do not need and change the colours and type.'],
         ['Whose pictures are in the layouts?', 'The drawings were made for the Mailroom, so there is nothing to license. Replace any of them with your own picture or a free one from the picture search.'],
         ['Why am I asked to change the words before I send?', 'Every layout is written out in full, with invented dates, prices and names, so you can see how it reads. Before an email goes out, the Mailroom lists any of those lines you have not yet changed, so an example cannot reach your list by mistake.'],
         ['Do the layouts work on a phone?', 'Yes. Columns stack, buttons keep a large target and text stays at a readable size. The preview in the editor shows both.']].map(function (qa) {
          return MR.h('details', { class: 'mr-tpl-faq__item' }, MR.h('summary', { text: qa[0] }), MR.h('p', { text: qa[1] }));
        })));

  };
})();
