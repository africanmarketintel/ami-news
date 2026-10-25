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
      var current = 'All', term = '', page = 1;
      // Six rows of three a page, so the page stays short and quick to draw.
      var PER_PAGE = 18;

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
          onclick: function () { current = g; page = 1; refresh(true); } },
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
        // The layout fills the width of the card with a thin outline and the name
        // underneath. The two buttons sit over the bottom of the picture and show
        // on hover or keyboard focus. A tap or click on the picture does the same job.
        var card = MR.h('div', { class: 'mr-tpl', 'data-group': t.category || '' },
          MR.h('div', { class: 'mr-tpl__media' },
            thumb,
            MR.h('div', { class: 'mr-tpl__actions' },
              useControl(t),
              MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', 'aria-label': 'Preview the layout: ' + t.name, text: 'Preview', onclick: function () { preview(t); } }))),
          MR.h('div', { class: 'mr-tpl__body' },
            MR.h('h2', { class: 'mr-tpl__name', text: t.name }),
            t.category ? MR.h('span', { class: 'mr-tpl__cat', text: t.category }) : null,
            MR.h('p', { class: 'dr-small', text: t.summary }),
            facts));
        card._t = t; card._frame = frame;
        cards.push(card); grid.appendChild(card);
        if (seen) seen.observe(card); else frame.srcdoc = MR.templatePreviewHtml ? MR.templatePreviewHtml(t.id, account) : '';
      });
      wrap.appendChild(grid);
      // The pictures are drawn at the full email width and shrunk to fit the card,
      // so work out the scale from the width of one column.
      function fitCards() {
        var cs = window.getComputedStyle(grid);
        var cols = cs.gridTemplateColumns.split(' ').length || 1;
        var gap = parseFloat(cs.columnGap) || 0;
        var w = (grid.clientWidth - gap * (cols - 1)) / cols;
        if (w > 0) grid.style.setProperty('--tpl-scale', String(w / 600));
      }
      fitCards();
      if (window.ResizeObserver) new ResizeObserver(fitCards).observe(grid); else window.addEventListener('resize', fitCards);
      var none = MR.h('p', { class: 'mr-tpl-none', hidden: true, text: 'No layouts match. Try a simpler word, or choose All layouts.' });
      wrap.appendChild(none);

      // The page buttons: 1 2 3 4 > with the current page in bold. A long run
      // is shortened with dots, and the first and last page are always there.
      var pager = MR.h('nav', { class: 'mr-pager', 'aria-label': 'Pages of layouts', hidden: true });
      wrap.appendChild(pager);
      function pageList(now, last) {
        if (last <= 7) { var all7 = []; for (var i = 1; i <= last; i++) all7.push(i); return all7; }
        var out = [1];
        var from = Math.max(2, now - 1), to = Math.min(last - 1, now + 1);
        if (now <= 3) { from = 2; to = 4; }
        if (now >= last - 2) { from = last - 3; to = last - 1; }
        if (from > 2) out.push('gap');
        for (var n = from; n <= to; n++) out.push(n);
        if (to < last - 1) out.push('gap');
        out.push(last);
        return out;
      }
      function drawPager(pages, focusNow) {
        pager.textContent = '';
        pager.hidden = pages <= 1;
        if (pages <= 1) return;
        function go(n) { page = n; refresh(false, true); }
        if (page > 1) {
          pager.appendChild(MR.h('button', { type: 'button', class: 'mr-pager__btn mr-pager__arrow', 'aria-label': 'Previous page',
            onclick: function () { go(page - 1); } }, MR.h('span', { 'aria-hidden': 'true', text: '\u2039' })));
        }
        pageList(page, pages).forEach(function (n) {
          if (n === 'gap') { pager.appendChild(MR.h('span', { class: 'mr-pager__gap', 'aria-hidden': 'true', text: '\u2026' })); return; }
          var b = MR.h('button', { type: 'button', class: 'mr-pager__btn', 'aria-label': 'Page ' + n + (n === page ? ', current page' : ''),
            onclick: function () { go(n); }, text: String(n) });
          if (n === page) { b.setAttribute('aria-current', 'page'); b.classList.add('is-current'); }
          pager.appendChild(b);
        });
        if (page < pages) {
          pager.appendChild(MR.h('button', { type: 'button', class: 'mr-pager__btn mr-pager__arrow', 'aria-label': 'Next page',
            onclick: function () { go(page + 1); } }, MR.h('span', { 'aria-hidden': 'true', text: '\u203a' })));
        }
        if (focusNow) { var cur = pager.querySelector('[aria-current="page"]'); if (cur) cur.focus(); }
      }

      // paged is true when the visitor moved between pages: the top of the list
      // scrolls back into view, and the page button keeps the keyboard focus.
      function refresh(announce, paged) {
        Object.keys(tabButtons).forEach(function (k) { tabButtons[k].setAttribute('aria-pressed', k === current ? 'true' : 'false'); });
        var q = term.trim().toLowerCase();
        var matches = cards.filter(function (c) {
          var t = c._t;
          var inGroup = current === 'All' || t.category === current;
          var hit = !q || (t.name + ' ' + t.summary + ' ' + (t.category || '')).toLowerCase().indexOf(q) !== -1;
          return inGroup && hit;
        });
        var shown = matches.length;
        var pages = Math.max(1, Math.ceil(shown / PER_PAGE));
        if (page > pages) page = pages;
        var first = (page - 1) * PER_PAGE;
        var onPage = matches.slice(first, first + PER_PAGE);
        cards.forEach(function (c) { c.hidden = onPage.indexOf(c) === -1; });
        var g = groups.filter(function (x) { return x.name === current; })[0];
        var range = pages > 1 ? ' Showing ' + (first + 1) + ' to ' + (first + onPage.length) + '. Page ' + page + ' of ' + pages + '.' : '';
        about.textContent = (g ? g.about + '. ' : '') + shown + (shown === 1 ? ' layout' : ' layouts') + (q ? ' match "' + term.trim() + '".' : '.') + range;
        none.hidden = shown !== 0;
        drawPager(pages, paged);
        if (paged && about.scrollIntoView) about.scrollIntoView({ block: 'start' });
        if (announce || paged) MR.announce(about.textContent);
      }
      search.addEventListener('input', function () { term = search.value; page = 1; refresh(false); });
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
         ['Where do the pictures in the layouts come from?', 'The photographs come from Pixabay, a free picture library, and are stored on this site. Replace any of them with your own photograph, or a free one from the picture search, before you send.'],
         ['Why am I asked to change the words before I send?', 'Every layout is written out in full, with invented dates, prices and names, so you can see how it reads. Before an email goes out, the Mailroom lists any of those lines you have not yet changed, so an example cannot reach your list by mistake.'],
         ['Do the layouts work on a phone?', 'Yes. Columns stack, buttons keep a large target and text stays at a readable size. The preview in the editor shows both.']].map(function (qa) {
          return MR.h('details', { class: 'mr-tpl-faq__item' }, MR.h('summary', { text: qa[0] }), MR.h('p', { text: qa[1] }));
        })));

  };
})();
