/* ==========================================================================
   Campaign studio
   A full-screen editor for a campaign: a bar across the top (undo, redo,
   save status, desktop and phone width, Preview & test, Save & quit), a rail
   on the left (Content, Style, Send), a panel beside it, and the email itself
   in the middle. Click a block in the email to select it and its settings
   open in the panel; drag a block from the panel into the email; drag a
   selected block by its handle to move it.

   The email in the middle is the real thing: MR.renderEmail, the same markup
   that is sent, drawn in a frame. The studio adds nothing to that markup. It
   works out which table row belongs to which block, and puts its outlines,
   toolbar and drop line on top in the page around the frame.

   Everything done with a mouse has a keyboard route: the blocks in the panel
   are buttons that add a block, the outline lists every block as a button
   that selects it, and the settings panel has Move up, Move down, Duplicate
   and Remove.

   The old stacked editor (mr-editor.js) is still used on narrow screens and
   when the page address ends ?classic=1.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;
  var h = MR.h;

  var WIDTHS = { desktop: 660, phone: 390 };

  /* ---------------- icons ---------------- */
  var SVG = {
    heading: '<path d="M5 6h14M12 6v13M8 19h8"/>',
    text: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    story: '<path d="M4 6h13" stroke-width="2.8"/><path d="M4 12h16M4 16h10"/>',
    list: '<circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/><path d="M9 7h11M9 12h11M9 17h11"/>',
    button: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M9 12h6"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4 4 3 3-2 4 3"/>',
    imagetext: '<rect x="3" y="6" width="8" height="12" rx="1.5"/><path d="M14 8h7M14 12h7M14 16h5"/>',
    columns: '<rect x="3" y="6" width="8" height="12" rx="1.5"/><rect x="13" y="6" width="8" height="12" rx="1.5"/>',
    social: '<circle cx="6" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="M8.2 10.9l6.6-3.8M8.2 13.1l6.6 3.8"/>',
    panel: '<rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" fill-opacity=".14"/><path d="M7 10h10M7 14h6"/>',
    divider: '<path d="M3 12h18"/><path d="M3 7h5M16 7h5M3 17h5M16 17h5" stroke-opacity=".45"/>',
    spacer: '<rect x="4" y="6" width="16" height="12" rx="1.5" stroke-dasharray="3 3"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.5v5l4.5-2.5z"/>',
    logo: '<rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M6.5 14.2V9.8h1.6M10.5 9.8v4.4M13 14.2V9.8l2 4.4 2-4.4"/>',
    html: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9.5 9.5L7 12l2.5 2.5M14.5 9.5L17 12l-2.5 2.5"/>',
    product: '<path d="M8 4l-5 3 2 4 2-1v9h10v-9l2 1 2-4-5-3c-.6 1.3-1.8 2-4 2s-3.4-.7-4-2z"/>',
    navigation: '<rect x="3" y="9" width="18" height="6" rx="1.5"/><path d="M7 12h2M11 12h2M15 12h2"/>',
    dynamic: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/><path d="M15.5 14.5l1 1.8 2-.3-1.2 1.6 1 1.8-2-.8-1.5 1.4.2-2-1.8-1 2-.7z" fill="currentColor" stroke="none"/>',
    content: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>',
    style: '<path d="M4 20l4-1L19 8a2.1 2.1 0 00-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/>',
    send: '<path d="M21 3L3 11l7 3 3 7 8-18z"/><path d="M10 14l11-11"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>',
    desktop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    more: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
    bookmark: '<path d="M7 4h10a1 1 0 011 1v15l-6-4-6 4V5a1 1 0 011-1z"/>',
    trash: '<path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    grip: '<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>'
  };

  function icon(name, size) {
    var s = h('span', { class: 'mr-studio__icon', 'aria-hidden': 'true' });
    var px = size || 22;
    s.innerHTML = '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + (SVG[name] || '') + '</svg>';
    return s;
  }

  function blockLabel(block) {
    var t = (MR.BLOCK_TYPES || []).filter(function (x) { return x.value === block.type; })[0];
    return t ? t.label : 'Block';
  }

  // A few words from a block, so a list of blocks tells them apart.
  function snippet(b) {
    var raw = b.text || b.name || b.label || b.left || b.alt || b.detail || '';
    if (b.type === 'html') raw = String(b.html || '').replace(/<[^>]*>/g, ' ');
    if (b.type === 'logo' || b.type === 'navigation') raw = b.type === 'navigation'
      ? (Array.isArray(b.links) ? b.links.map(function (l) { return l.label; }).filter(Boolean).join(', ') : '') : '';
    if (b.type === 'divider') raw = '';
    raw = String(raw).replace(/\s+/g, ' ').trim();
    return raw.length > 34 ? raw.slice(0, 33) + '…' : raw;
  }

  function emptySocial(b) {
    return b.type === 'social' && !(Array.isArray(b.links) && b.links.length);
  }

  /* ======================================================================
     mount(o)
       campaign      the object the page saves
       getAccount()  getBrand()  getSender() -> { name, address }, for the Email preview
       saved         the member's saved blocks
       images        function (onPick) or null
       onSaveBlock   function (blocks, done) or null
       sendPanel     an element: subject, sender, list, schedule, send
       save          function () -> promise
       testSend      shareLink      functions
       home          where Save & quit goes
       classicUrl    where "Use the simple editor" goes
       demo          true in preview mode
     ====================================================================== */
  function mount(o) {
    var campaign = o.campaign;
    var PARTS = MR.editorParts;
    var saved = o.saved || [];
    var state = { sel: null, sheet: false, device: 'desktop', rail: 'content', tab: 'blocks', btab: 'block', adding: false, dirty: false, savedAt: null, saving: false };
    var hist = { stack: [], i: -1 };
    var map = [];                       // one entry per top-level block row
    var byRow = new Map();              // table row -> { path, block, tr }
    var dragging = null;                // { kind, type, id, path } while something is dragged
    var timers = {};
    var ready = false;
    var dialog = null;
    var sectionsDrawn = false;
    var outlineBox = null;

    function account() { return (o.getAccount && o.getAccount()) || { name: 'Your organisation', postal_address: 'Your postal address' }; }
    function brandNow() { return o.getBrand ? o.getBrand() : null; }

    /* ---------------- structure ---------------- */
    // The editor replaces the whole page, so it carries the page's main landmark
    // and its main heading itself. Without them a screen reader user had
    // nothing to jump to and no page title to hear.
    var root = h('div', { class: 'mr-studio', role: 'main', 'aria-label': 'Campaign editor' });
    var pageHeading = h('h1', { class: 'dr-visually-hidden' });
    root.appendChild(pageHeading);

    // top bar
    // The campaign's name in the bar is its subject line, and it can be typed
    // over here. The subject is also on the Send panel; the two are kept the
    // same, so there is one name to find a draft by in the lists.
    var titleEl = h('input', {
      type: 'text', class: 'mr-studio__title', placeholder: 'Add a subject line', spellcheck: 'true',
      'aria-label': 'Subject line. This is also the name of the campaign in your lists.'
    });
    titleEl.addEventListener('input', function () {
      campaign.subject = titleEl.value;
      var box = document.getElementById('c-subject');
      if (box && box !== titleEl) box.value = titleEl.value;
      pageHeading.textContent = 'Campaign editor: ' + (titleEl.value.trim() || 'Untitled campaign');
      markDirty();
    });
    titleEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); } });
    var undoBtn = h('button', { type: 'button', class: 'mr-studio__iconbtn', 'aria-label': 'Undo', title: 'Undo', onclick: undo }, icon('undo'));
    var redoBtn = h('button', { type: 'button', class: 'mr-studio__iconbtn mr-studio__redo', 'aria-label': 'Redo', title: 'Redo', onclick: redo }, icon('redo'));
    var statusEl = h('span', { class: 'mr-studio__status', role: 'status', 'aria-live': 'polite' });
    var deskBtn = h('button', { type: 'button', class: 'mr-studio__iconbtn', 'aria-label': 'Desktop width', title: 'Desktop width', 'aria-pressed': 'true', onclick: function () { setDevice('desktop'); } }, icon('desktop'));
    var phoneBtn = h('button', { type: 'button', class: 'mr-studio__iconbtn', 'aria-label': 'Phone width', title: 'Phone width', 'aria-pressed': 'false', onclick: function () { setDevice('phone'); } }, icon('phone'));
    var previewBtn = h('button', { type: 'button', class: 'mr-studio__btn', text: 'Preview & test', onclick: function () { openPreview('preview'); } });
    var quitBtn = h('button', { type: 'button', class: 'mr-studio__btn mr-studio__btn--dark', text: 'Save & quit', onclick: saveAndQuit });

    var menuBtn = h('button', {
      type: 'button', class: 'mr-studio__iconbtn', 'aria-label': 'More options', 'aria-haspopup': 'true', 'aria-expanded': 'false',
      onclick: function (e) { e.stopPropagation(); toggleMenu(); }
    }, icon('more'));
    var menu = h('div', { class: 'mr-studio__menu', hidden: true, role: 'menu' },
      h('button', { type: 'button', role: 'menuitem', text: 'Save a draft', onclick: function () { closeMenu(); saveDraft(); } }),
      h('a', { role: 'menuitem', href: o.classicUrl || 'campaign.html?classic=1', text: 'Use the simple editor' }));

    var bar = h('header', { class: 'mr-studio__bar' },
      h('a', { class: 'mr-studio__home', href: o.home || 'campaigns.html', title: 'Back to your campaigns' }, icon('back', 20), h('span', { text: 'Back' })),
      titleEl, undoBtn, redoBtn, statusEl,
      h('span', { class: 'mr-studio__grow' }),
      h('div', { class: 'mr-studio__seg', role: 'group', 'aria-label': 'Preview width' }, deskBtn, phoneBtn),
      previewBtn, quitBtn,
      h('div', { class: 'mr-studio__menuwrap' }, menuBtn, menu));

    // rail
    var railBtns = {};
    function railBtn(key, label) {
      var b = h('button', {
        type: 'button', class: 'mr-studio__railbtn', 'aria-pressed': 'false',
        onclick: function () {
          // On a phone the same tab pressed twice closes the sheet again.
          var wasOpen = narrow() && state.sheet && state.rail === key && state.sel === null;
          state.rail = key; state.sel = null; state.adding = false; placeSel(); renderPanels(); renderRail(); drawOutline();
          if (narrow()) setSheet(!wasOpen);
        }
      }, icon(key, 20), h('span', { text: label }));
      railBtns[key] = b;
      return b;
    }
    var rail = h('nav', { class: 'mr-studio__rail', 'aria-label': 'Editor sections' },
      railBtn('content', 'Add'), railBtn('style', 'Design'), railBtn('send', 'Send'));

    // panels
    var pContent = h('div', { class: 'mr-studio__pane' });
    var pBlock = h('div', { class: 'mr-studio__pane', hidden: true });
    var pStyle = h('div', { class: 'mr-studio__pane', hidden: true });
    var pSend = h('div', { class: 'mr-studio__pane', hidden: true });
    var panel = h('aside', { class: 'mr-studio__panel', 'aria-label': 'Editor panel' }, rail, pContent, pBlock, pStyle, pSend);

    // stage
    var notes = h('div', { class: 'mr-studio__notes' });
    var frame = h('iframe', { class: 'mr-studio__frame', title: 'Your email, as readers will see it' });
    var hoverBox = h('div', { class: 'mr-studio__box mr-studio__box--hover', hidden: true });
    var selBox = h('div', { class: 'mr-studio__box mr-studio__box--sel', hidden: true });
    var dropLine = h('div', { class: 'mr-studio__dropline', hidden: true });
    var tools = h('div', { class: 'mr-studio__tools', role: 'toolbar', 'aria-label': 'Selected block', hidden: true });
    // The box that appears when words are selected, or a button or story is clicked, to set where it goes.
    var lbLabel = h('label', { class: 'mr-studio__linklabel', for: 'mrs-linkinput', text: 'Link' });
    var lbInput = h('input', { type: 'text', id: 'mrs-linkinput', class: 'mr-studio__linkinput', placeholder: 'https://', autocomplete: 'off', spellcheck: 'false' });
    var lbApply = h('button', { type: 'button', class: 'mr-studio__linkbtn', text: 'Add link' });
    var lbRemove = h('button', { type: 'button', class: 'mr-studio__linkbtn mr-studio__linkbtn--quiet', text: 'Remove' });
    var linkBar = h('div', { class: 'mr-studio__linkbar', role: 'group', 'aria-label': 'Link', hidden: true }, lbLabel, lbInput, lbApply, lbRemove);
    var stage = h('div', { class: 'mr-studio__stage' }, frame, hoverBox, selBox, dropLine, tools);
    // The link box sits at the top of the editing area, in a dock with no height of its own,
    // so it never covers the words being edited and the email does not move when it appears.
    var linkDock = h('div', { class: 'mr-studio__linkdock' }, linkBar);
    var main = h('div', { class: 'mr-studio__main' }, notes, linkDock, stage);

    root.appendChild(bar);
    root.appendChild(h('div', { class: 'mr-studio__body' }, main, panel));

    /* ---------------- phones ----------------
       Under 700 pixels the panel becomes a sheet along the bottom: the three
       tabs are always showing, and the sheet rises when a tab is pressed or a
       block is tapped, and drops when the email is tapped outside any block.
       The email takes the width of the screen, so what is edited is what a
       phone reader gets. While the keyboard is up the sheet steps aside. */
    var narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 700px)') : null;
    function narrow() { return !!(narrowQuery && narrowQuery.matches); }
    function applySheet() {
      root.classList.toggle('is-narrow', narrow());
      root.classList.toggle('is-sheet-open', narrow() && state.sheet);
    }
    function setSheet(on) {
      state.sheet = !!on;
      applySheet();
      fit();
      placeSel();
      if (state.sheet && state.sel !== null) setTimeout(scrollToSel, 40);
    }
    function onNarrowChange() { applySheet(); fit(); placeSel(); }
    if (narrowQuery) {
      if (narrowQuery.addEventListener) narrowQuery.addEventListener('change', onNarrowChange);
      else if (narrowQuery.addListener) narrowQuery.addListener(onNarrowChange);
    }
    function onKeyboard() {
      var vv = window.visualViewport;
      root.classList.toggle('is-keyboard', !!(narrow() && vv && vv.height < window.innerHeight * 0.75));
      placeSel();
    }
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onKeyboard);
    applySheet();

    /* ---------------- history ---------------- */
    function snap() {
      return JSON.stringify({
        b: campaign.body_blocks, f: campaign.font_family || '', c: campaign.header_colour || '',
        v: !!campaign.show_browser_link, s: campaign.style || null
      });
    }
    function record() {
      var s = snap();
      if (hist.stack[hist.i] === s) return;
      hist.stack = hist.stack.slice(0, hist.i + 1);
      hist.stack.push(s);
      if (hist.stack.length > 100) hist.stack.shift();
      hist.i = hist.stack.length - 1;
      updateUndo();
    }
    function flush() { clearTimeout(timers.rec); record(); }
    function updateUndo() {
      undoBtn.disabled = hist.i <= 0;
      redoBtn.disabled = hist.i >= hist.stack.length - 1;
    }
    function restore(s) {
      var v = JSON.parse(s);
      campaign.body_blocks = v.b;
      campaign.font_family = v.f || campaign.font_family;
      campaign.header_colour = v.c || null;
      campaign.show_browser_link = v.v;
      if (v.s) campaign.style = v.s; else if (campaign.style) campaign.style = {};
      if (state.sel !== null && !byPath(state.sel)) state.sel = null;
      markDirty();
      paint();
      renderPanels();
      buildStyle();
      drawOutline();
      placeSel();
      updateUndo();
    }
    function undo() {
      flush();
      if (hist.i <= 0) return;
      hist.i -= 1;
      restore(hist.stack[hist.i]);
      MR.announce('Undone');
    }
    function redo() {
      flush();
      if (hist.i >= hist.stack.length - 1) return;
      hist.i += 1;
      restore(hist.stack[hist.i]);
      MR.announce('Redone');
    }

    /* ---------------- blocks and paths ---------------- */
    function resolve(path) {
      var parts = String(path).split('.').map(Number);
      if (parts.length === 1) return { list: campaign.body_blocks, index: parts[0] };
      var parent = campaign.body_blocks[parts[0]];
      if (!parent || !Array.isArray(parent.blocks)) return null;
      return { list: parent.blocks, index: parts[1] };
    }
    function byPath(path) {
      // The name at the top of the email is not a block. Its words live in
      // the style, so typing over it on the email changes the style.
      if (path === 'header') return sty();
      var at = resolve(path);
      return at ? at.list[at.index] || null : null;
    }
    function pathOf(block) {
      var found = null;
      campaign.body_blocks.forEach(function (b, i) {
        if (b === block) found = String(i);
        else if (Array.isArray(b.blocks)) b.blocks.forEach(function (c, j) { if (c === block) found = i + '.' + j; });
      });
      return found;
    }
    function isBlankStart() {
      var b = campaign.body_blocks;
      return b.length === 1 && b[0].type === 'text' && !String(b[0].text || '').trim();
    }

    // Where a block chosen from the panel goes: after the selected block,
    // or at the end when nothing is selected.
    function defaultPath(type) {
      if (state.sel === null) return null;
      var parts = String(state.sel).split('.').map(Number);
      if (parts.length === 1 || type === 'panel') return String(parts[0] + 1);
      return parts[0] + '.' + (parts[1] + 1);
    }

    function afterMutation(focusBlock) {
      record();
      markDirty();
      paint();
      var p = focusBlock ? pathOf(focusBlock) : null;
      state.sel = p;
      state.adding = false;
      if (p !== null) state.rail = 'content';
      renderRail();
      renderPanels();
      drawOutline();
      placeSel();
      if (p !== null) scrollToSel();
    }

    function insertAt(path, blocks, replaceBlank) {
      flush();
      var at;
      if (path === undefined || path === null) at = { list: campaign.body_blocks, index: campaign.body_blocks.length };
      else at = resolve(path);
      if (!at) return null;
      if (at.list !== campaign.body_blocks) blocks = blocks.filter(function (b) { return b.type !== 'panel'; });
      if (!blocks.length) return null;
      if (replaceBlank && isBlankStart()) { campaign.body_blocks.splice(0, 1); at = { list: campaign.body_blocks, index: 0 }; }
      Array.prototype.splice.apply(at.list, [at.index, 0].concat(blocks));
      afterMutation(blocks[0]);
      return blocks[0];
    }

    function add(type, path) {
      var b = MR.blankBlock(type);
      var where = (path === undefined) ? defaultPath(type) : path;
      insertAt(where, [b]);
      MR.announce(blockLabel(b) + ' added');
    }
    function addSaved(s, path) {
      var blocks = JSON.parse(JSON.stringify(s.blocks || []));
      if (!blocks.length) return;
      insertAt(path === undefined ? defaultPath('x') : path, blocks);
      MR.announce(s.name + ' added');
    }
    function addSection(id, path) {
      var blocks = MR.sectionBlocks(id);
      var where = path === undefined ? defaultPath('panel') : path;
      // A layout is made of whole top level blocks, so it never goes inside a panel.
      if (where && String(where).indexOf('.') > -1) where = String(Number(String(where).split('.')[0]) + 1);
      insertAt(where, blocks, true);
      MR.announce('Section added');
    }
    function remove(path) {
      flush();
      var at = resolve(path);
      if (!at) return;
      var block = at.list.splice(at.index, 1)[0];
      if (!campaign.body_blocks.length) campaign.body_blocks.push(MR.blankBlock('text'));
      state.sel = null;
      afterMutation(null);
      MR.announce(blockLabel(block) + ' removed');
    }
    function duplicate(path) {
      flush();
      var at = resolve(path);
      if (!at) return;
      var copy = JSON.parse(JSON.stringify(at.list[at.index]));
      at.list.splice(at.index + 1, 0, copy);
      afterMutation(copy);
      MR.announce(blockLabel(copy) + ' duplicated');
    }
    function move(path, dir) {
      flush();
      var at = resolve(path);
      if (!at) return;
      var to = at.index + dir;
      if (to < 0 || to >= at.list.length) return;
      var block = at.list.splice(at.index, 1)[0];
      at.list.splice(to, 0, block);
      afterMutation(block);
      MR.announce(blockLabel(block) + ' moved to position ' + (to + 1));
      var again = pane('block').querySelector('[data-focus="' + (dir < 0 ? 'up' : 'down') + '"]');
      if (again && !again.disabled) again.focus();
    }
    // Moving a block by dragging it, possibly into a panel or back out.
    function moveTo(fromPath, toPath) {
      if (fromPath === toPath) return;
      var from = resolve(fromPath);
      if (!from) return;
      var block = from.list[from.index];
      var intoPanel = String(toPath).indexOf('.') > -1;
      if (block.type === 'panel' && intoPanel) { MR.announce('A colour panel cannot go inside another panel'); return; }
      if (intoPanel && String(toPath).split('.')[0] === String(fromPath)) return;
      var to = resolve(toPath);              // before anything moves, so the path still means what it said
      if (!to) return;
      flush();
      var index = to.index;
      if (to.list === from.list && index > from.index) index -= 1;
      from.list.splice(from.index, 1);
      to.list.splice(index, 0, block);
      afterMutation(block);
      MR.announce(blockLabel(block) + ' moved');
    }

    /* ---------------- status ---------------- */
    function markDirty() { state.dirty = true; updateStatus(); scheduleAutosave(AUTOSAVE_MS); }
    function updateStatus() {
      var text, cls = '';
      if (o.demo) text = 'Preview only: nothing is saved';
      else if (state.saving) text = 'Saving…';
      else if (state.dirty) { text = 'Unsaved changes'; cls = ' is-dirty'; }
      else if (state.savedAt) text = 'Last saved ' + state.savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      else text = 'No unsaved changes';
      statusEl.textContent = text;
      statusEl.className = 'mr-studio__status' + cls;
    }
    function updateTitle() {
      // Not while it is being typed in, or the cursor would jump.
      if (document.activeElement !== titleEl) titleEl.value = campaign.subject || '';
      titleEl.title = titleEl.value || 'Add a subject line';
      pageHeading.textContent = 'Campaign editor: ' + ((campaign.subject || '').trim() || 'Untitled campaign');
    }

    /* ---------------- automatic saving ----------------
       A draft is saved by itself a short while after the last change, so a
       closed tab or a dropped connection costs at most the last few seconds.
       It is silent: no "Draft saved" announcement for a screen reader each
       time, and the status line is read out only when something goes wrong.
       Only a plain draft is saved this way. A held campaign is left for the
       person to save on purpose, because saving puts it back to a draft. */
    var AUTOSAVE_MS = o.autosaveMs || 20000, AUTOSAVE_RETRY_MS = o.autosaveRetryMs || 60000;
    var autosaveTimer = null;
    function autosaveAllowed() {
      return !o.demo && (!campaign.status || campaign.status === 'draft');
    }
    function scheduleAutosave(ms) {
      clearTimeout(autosaveTimer);
      if (!autosaveAllowed()) return;
      autosaveTimer = setTimeout(autosave, ms);
    }
    function quietStatus(fn) {
      statusEl.setAttribute('aria-live', 'off');
      fn();
      statusEl.setAttribute('aria-live', 'polite');
    }
    function autosave() {
      clearTimeout(autosaveTimer);
      if (!state.dirty || !autosaveAllowed()) return Promise.resolve();
      if (state.saving) { scheduleAutosave(5000); return Promise.resolve(); }
      state.saving = true;
      quietStatus(function () { statusEl.textContent = 'Saving…'; });
      return Promise.resolve(o.save(false)).then(function (row) {
        state.saving = false;
        if (row) { state.dirty = false; state.savedAt = new Date(); }
        quietStatus(function () {
          updateStatus();
          if (row) statusEl.textContent = 'Saved automatically at ' + state.savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        });
        if (!row && state.dirty) scheduleAutosave(AUTOSAVE_RETRY_MS);
      }, function (err) {
        state.saving = false;
        console.error(err);
        statusEl.textContent = 'Not saved. Check your connection. Trying again shortly.';
        statusEl.className = 'mr-studio__status is-dirty';
        scheduleAutosave(AUTOSAVE_RETRY_MS);
      });
    }
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('online', onOnline);
    function onHide() { if (document.visibilityState === 'hidden' && state.dirty) autosave(); }
    function onOnline() { if (state.dirty) autosave(); }

    function saveDraft() {
      clearTimeout(autosaveTimer);
      state.saving = true; updateStatus();
      return Promise.resolve(o.save(true)).then(function (row) {
        state.saving = false;
        if (row) { state.dirty = false; state.savedAt = new Date(); }
        updateStatus();
        if (!row && state.dirty) scheduleAutosave(AUTOSAVE_MS);
        return row;
      }, function (err) {
        state.saving = false; updateStatus();
        scheduleAutosave(AUTOSAVE_RETRY_MS);
        throw err;
      });
    }
    function saveAndQuit() {
      saveDraft().then(function (row) {
        if (row && !o.demo) {
          window.removeEventListener('beforeunload', guard);
          location.href = o.home || 'campaigns.html';
        }
      }).catch(function (err) { console.error(err); });
    }
    function guard(e) {
      if (!state.dirty || o.demo) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', guard);

    /* ---------------- rail and panels ---------------- */
    function renderRail() {
      Object.keys(railBtns).forEach(function (k) {
        var on = state.rail === k && !(k === 'content' && state.sel !== null && !state.adding && byPath(state.sel));
        railBtns[k].setAttribute('aria-pressed', on ? 'true' : 'false');
        railBtns[k].classList.toggle('is-on', on);
      });
    }
    function pane(name) { return { content: pContent, block: pBlock, style: pStyle, send: pSend }[name]; }
    function renderPanels() {
      var showBlock = state.rail === 'content' && state.sel !== null && !state.adding && byPath(state.sel);
      pContent.hidden = !(state.rail === 'content' && !showBlock);
      pBlock.hidden = !showBlock;
      pStyle.hidden = state.rail !== 'style';
      pSend.hidden = state.rail !== 'send';
      if (addNote) addNote.textContent = state.adding
        ? 'Choose a block. It goes below the one you selected.'
        : 'Click anything in your email to change it. To add something new, drag a block in or click it.';
      if (showBlock) buildBlockPane();
    }

    /* ---------------- Content: blocks, sections, saved ---------------- */
    var tabBtns = {};
    var addNote = null;
    var styleUi = { open: { email: true } };
    var tabBodies = {};
    function buildContent() {
      pContent.textContent = '';
      addNote = h('p', { class: 'mr-studio__hint mr-studio__addnote' });
      pContent.appendChild(addNote);
      var tablist = h('div', { class: 'mr-studio__tabs', role: 'tablist', 'aria-label': 'Content' });
      [['blocks', 'Blocks'], ['sections', 'Ready-made'], ['saved', 'Saved']].forEach(function (t) {
        var b = h('button', {
          type: 'button', role: 'tab', class: 'mr-studio__tab', id: 'mrs-tab-' + t[0], 'aria-controls': 'mrs-body-' + t[0],
          onclick: function () { state.tab = t[0]; renderTabs(); if (t[0] === 'sections') drawSections(); }
        }, t[1]);
        b.addEventListener('keydown', function (e) {
          var keys = ['blocks', 'sections', 'saved'];
          var i = keys.indexOf(t[0]);
          if (e.key === 'ArrowRight') i = (i + 1) % 3; else if (e.key === 'ArrowLeft') i = (i + 2) % 3; else return;
          e.preventDefault(); state.tab = keys[i]; renderTabs(); tabBtns[keys[i]].focus();
          if (keys[i] === 'sections') drawSections();
        });
        tabBtns[t[0]] = b;
        tablist.appendChild(b);
        tabBodies[t[0]] = h('div', { class: 'mr-studio__tabbody', id: 'mrs-body-' + t[0], role: 'tabpanel', 'aria-labelledby': 'mrs-tab-' + t[0] });
      });
      pContent.appendChild(tablist);
      pContent.appendChild(tabBodies.blocks);
      pContent.appendChild(tabBodies.sections);
      pContent.appendChild(tabBodies.saved);
      drawBlocks();
      drawSaved();
      renderTabs();
    }
    function renderTabs() {
      Object.keys(tabBtns).forEach(function (k) {
        var on = state.tab === k;
        tabBtns[k].setAttribute('aria-selected', on ? 'true' : 'false');
        tabBtns[k].setAttribute('tabindex', on ? '0' : '-1');
        tabBtns[k].classList.toggle('is-on', on);
        tabBodies[k].hidden = !on;
      });
    }

    var PRIMARY = ['heading', 'text', 'image', 'button', 'imagetext', 'columns', 'list', 'video', 'social', 'divider', 'spacer', 'logo'];
    var TILE_NAME = { dynamic: 'Personalised text', video: 'Video', imagetext: 'Image and text', panel: 'Colour panel' };
    function drawBlocks() {
      var box = tabBodies.blocks;
      box.textContent = '';
      var types = MR.BLOCK_TYPES || [];
      function tiles(list) {
        var grid = h('div', { class: 'mr-studio__tiles' });
        list.forEach(function (t) {
          var tile = h('button', {
            type: 'button', class: 'mr-studio__tile', draggable: 'true', title: t.hint,
            onclick: function () { add(t.value); }
          }, icon(t.value, 30), h('span', { text: TILE_NAME[t.value] || t.label }));
          tile.addEventListener('dragstart', function (e) {
            dragging = { kind: 'new', type: t.value };
            e.dataTransfer.setData('text/mr-new', t.value);
            e.dataTransfer.effectAllowed = 'copy';
          });
          tile.addEventListener('dragend', endDrag);
          grid.appendChild(tile);
        });
        return grid;
      }
      box.appendChild(tiles(PRIMARY.map(function (v) { return types.filter(function (t) { return t.value === v; })[0]; }).filter(Boolean)));
      var more = types.filter(function (t) { return PRIMARY.indexOf(t.value) === -1; });
      if (more.length) {
        var d = h('details', { class: 'mr-studio__fold' });
        d.open = !!styleUi.open['more-blocks'];
        d.addEventListener('toggle', function () { styleUi.open['more-blocks'] = d.open; });
        d.appendChild(h('summary', { class: 'mr-studio__foldhead', text: 'More blocks' }));
        var inner = h('div', { class: 'mr-studio__foldbody' });
        inner.appendChild(tiles(more));
        d.appendChild(inner);
        box.appendChild(d);
      }
      var od = h('details', { class: 'mr-studio__fold' });
      od.open = !!styleUi.open['outline'];
      od.addEventListener('toggle', function () { styleUi.open['outline'] = od.open; });
      od.appendChild(h('summary', { class: 'mr-studio__foldhead', text: 'Every block in this email' }));
      outlineBox = h('div', { class: 'mr-studio__outline' });
      od.appendChild(h('div', { class: 'mr-studio__foldbody' }, outlineBox));
      box.appendChild(od);
      drawOutline();
    }

    function drawOutline() {
      var box = outlineBox;
      if (!box) return;
      box.textContent = '';
      function item(b, path, depth) {
        var s = snippet(b);
        var btn = h('button', {
          type: 'button', class: 'mr-studio__outitem' + (state.sel === path ? ' is-on' : ''),
          'aria-current': state.sel === path ? 'true' : null,
          style: depth ? 'padding-left:' + (0.6 + depth * 1.1) + 'rem' : null,
          onclick: function () { select(path); }
        }, icon(b.type, 18), h('span', { class: 'mr-studio__outlabel', text: blockLabel(b) }),
           s ? h('span', { class: 'mr-studio__outsnip', text: s }) : null);
        box.appendChild(btn);
      }
      campaign.body_blocks.forEach(function (b, i) {
        item(b, String(i), 0);
        if (Array.isArray(b.blocks)) b.blocks.forEach(function (c, j) { item(c, i + '.' + j, 1); });
      });
    }

    // Stand-ins for pictures, used only in the small previews. The blocks that
    // are added to the email keep their pictures empty.
    var PH_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320"><rect width="600" height="320" fill="#e5e7eb"/>' +
      '<g fill="none" stroke="#9ca3af" stroke-width="8" stroke-linejoin="round"><rect x="240" y="110" width="120" height="100" rx="10"/>' +
      '<circle cx="278" cy="142" r="9"/><path d="M246 200l38-32 26 20 22-14 22 26"/></g></svg>');
    var PH_LOGO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><rect width="240" height="80" rx="6" fill="#6b7280"/>' +
      '<text x="120" y="52" font-family="Arial,sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#ffffff">Logo</text></svg>');

    var MARK_IMAGE = 'https://placeholder.invalid/image';
    var MARK_LOGO = 'https://placeholder.invalid/logo';

    function forThumb(blocks) {
      var brand = brandNow() || {};
      function fix(b) {
        if (!b) return;
        // The renderer only follows web addresses, so these two stand in for the
        // pictures and are swapped for the drawings below once the page is built.
        if ((b.type === 'image' || b.type === 'imagetext' || b.type === 'product') && !b.url) b.url = MARK_IMAGE;
        if (b.type === 'product' && !b.link) b.link = 'https://placeholder.invalid/';
        if (b.type === 'video' && !b.thumb && !/youtu/i.test(b.url || '')) b.thumb = MARK_IMAGE;
        if (b.type === 'logo' && !b.url && !brand.logo_url) { b.url = MARK_LOGO; b.width = 140; }
        if (Array.isArray(b.blocks)) b.blocks.forEach(fix);
      }
      blocks.forEach(fix);
      return blocks;
    }

    // One small, true-to-life picture of a section: the email renderer draws it,
    // with the header and footer hidden, and the result is scaled down to fit.
    // The look of the text, links and buttons carries into the section
    // pictures. Width, padding and the background do not: the pictures are all
    // drawn at the same size on a white ground.
    function thumbStyle() {
      var out = {};
      var src = campaign.style || {};
      Object.keys(src).forEach(function (k) {
        if (['width', 'pad', 'page', 'body', 'bg_image'].indexOf(k) === -1) out[k] = src[k];
      });
      return out;
    }

    function paintThumb(card) {
      var item = card.__item;
      var wrap = card.querySelector('.mr-studio__secthumb');
      if (!item || !wrap || wrap.firstChild) return;
      var fake = {
        subject: '', preheader: '', font_family: campaign.font_family || 'sans',
        header_colour: campaign.header_colour || null, show_browser_link: false,
        style: thumbStyle(),
        body_blocks: forThumb(MR.sectionBlocks(item.id))
      };
      var doc = MR.renderEmail(fake, account(), { brand: brandNow() })
        .split(MARK_IMAGE).join(PH_IMAGE).split(MARK_LOGO).join(PH_LOGO)
        .replace('</head>',
          '<style>body{background:#fff !important}body>table{background-color:#fff !important}' +
          'table.rc-wrap>tbody>tr:first-child,table.rc-wrap>tbody>tr:last-child{display:none !important}</style></head>');
      var f = h('iframe', {
        class: 'mr-studio__secframe', tabindex: '-1', 'aria-hidden': 'true', title: '', scrolling: 'no',
        sandbox: 'allow-same-origin'
      });
      f.addEventListener('load', function () {
        var d = f.contentDocument;
        if (!d || !d.body || !d.body.firstChild) return;
        var k = (wrap.clientWidth || 230) / 640;
        var outer = d.querySelector('body > table');
        var height = Math.ceil(outer ? outer.getBoundingClientRect().height : d.body.scrollHeight);
        f.style.height = height + 'px';
        f.style.transform = 'scale(' + k + ')';
        wrap.style.height = Math.ceil(height * k) + 'px';
      });
      f.srcdoc = doc;
      wrap.appendChild(f);
    }

    function drawSections() {
      if (sectionsDrawn) return;
      sectionsDrawn = true;
      var box = tabBodies.sections;
      box.textContent = '';
      box.appendChild(h('p', { class: 'mr-studio__hint', text: 'Ready-made sections. Drag one into your email, or select one to add it after the block you have selected. Everything in it can be changed.' }));
      var groups = (MR.SECTIONS || []).slice();
      var layouts = (MR.TEMPLATES || []).filter(function (t) { return t.id !== 'blank'; });
      if (layouts.length) {
        groups.push({ id: 'layouts', name: 'Whole email layouts', items: layouts.map(function (t) { return { id: t.id, name: t.name }; }) });
      }
      var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { io.unobserve(en.target); paintThumb(en.target); }
        });
      }, { rootMargin: '300px' }) : null;

      groups.forEach(function (g) {
        var gid = 'mrs-sec-' + g.id;
        var body = h('div', { class: 'mr-studio__secgroup', id: gid });
        var head = h('button', {
          type: 'button', class: 'mr-studio__sechead', 'aria-expanded': 'true', 'aria-controls': gid
        }, h('span', { text: g.name }), icon('up', 18));
        head.addEventListener('click', function () {
          var open = head.getAttribute('aria-expanded') !== 'true';
          head.setAttribute('aria-expanded', open ? 'true' : 'false');
          body.hidden = !open;
        });
        g.items.forEach(function (it) {
          var card = h('button', {
            type: 'button', class: 'mr-studio__sec', draggable: 'true', title: it.name,
            'aria-label': 'Add section: ' + it.name,
            onclick: function () { addSection(it.id); }
          }, h('span', { class: 'mr-studio__secgrip' }, icon('grip', 16)),
             h('span', { class: 'mr-studio__secthumb' }),
             h('span', { class: 'mr-studio__vh', text: it.name }));
          card.__item = it;
          card.addEventListener('dragstart', function (e) {
            dragging = { kind: 'section', id: it.id };
            e.dataTransfer.setData('text/mr-section', it.id);
            e.dataTransfer.effectAllowed = 'copy';
          });
          card.addEventListener('dragend', endDrag);
          body.appendChild(card);
          if (io) io.observe(card); else paintThumb(card);
        });
        box.appendChild(head);
        box.appendChild(body);
      });
    }

    function drawSaved() {
      var box = tabBodies.saved;
      box.textContent = '';
      if (!saved.length) {
        box.appendChild(h('p', { class: 'mr-studio__hint', text: 'Blocks you save to reuse appear here, for example your sign-off. Select a block in your email, then choose Save to reuse.' }));
        return;
      }
      box.appendChild(h('p', { class: 'mr-studio__hint', text: 'Drag one into your email, or select it to add it.' }));
      saved.forEach(function (s) {
        var item = h('button', {
          type: 'button', class: 'mr-studio__saved', draggable: 'true', onclick: function () { addSaved(s); }
        }, icon('bookmark', 20), h('span', { text: s.name }));
        item.addEventListener('dragstart', function (e) {
          dragging = { kind: 'saved', id: s.id };
          e.dataTransfer.setData('text/mr-saved', String(s.id));
          e.dataTransfer.effectAllowed = 'copy';
        });
        item.addEventListener('dragend', endDrag);
        box.appendChild(item);
      });
    }

    /* ---------------- the settings of one block ---------------- */
    var fieldsApi = {
      canSave: false,
      images: o.images || null,
      inline: true,                     // words and links are edited on the email itself
      changed: function () { changed(); },
      redraw: function () { flush(); record(); markDirty(); paint(); renderPanels(); drawOutline(); placeSel(); }
    };

    // Which of the email-wide text styles a block follows, so the Text tab can
    // show the right ones. A block with no words in it has no Text tab.
    function textKind(block) {
      var t = block.type;
      if (t === 'panel') return 'panel';
      if (t === 'heading' || t === 'story') return 'title';
      if (t === 'button') return 'button';
      if (['text', 'list', 'columns', 'imagetext', 'dynamic', 'html', 'product'].indexOf(t) > -1) return 'paragraph';
      return null;
    }

    // The Font tab of one block, in the order people expect: font, size and
    // style, colour, alignment, capitals, then spacing. Every choice changes the
    // selected block only; the email-wide defaults are on the Design tab. Each
    // control starts on the value the block already shows, and a choice that
    // matches the email-wide value is not stored, so nothing is saved needlessly.
    // Kept on the block as font, size, bold, italic, ink, tcase, lead and lspace;
    // mr-render.js checks every one again.
    function blockFontPane(block, kind) {
      var box = h('div', { class: 'mr-studio__fontpane' });
      var isPanel = kind === 'panel';
      var isButton = kind === 'button';
      var isTitle = kind === 'title';
      var st = sty();
      var S = MR.resolveStyle ? MR.resolveStyle(st) : {};
      var brand = brandNow() || {};
      var DB = MR.DEFAULT_BRAND;
      var P = isTitle
        ? { size: S.tSize || 22, bold: S.tBold !== false, italic: !!S.tItalic, tcase: st.t_case || '', space: st.t_spacing || 0, lead: st.t_leading || 127, ink: hexOk(st.t_colour) ? st.t_colour : '#1a1208' }
        : isButton
          ? { size: S.btnSize || 16, bold: S.btnBold !== false, italic: !!S.btnItalic, tcase: st.btn_case || '', space: st.btn_spacing || 0, lead: 0,
              ink: hexOk(st.btn_text) ? st.btn_text : (hexOk(brand.button_text) ? brand.button_text : DB.button_text) }
          : { size: S.pSize || 16, bold: !!S.pBold, italic: !!S.pItalic, tcase: st.p_case || '', space: st.p_spacing || 0,
              lead: st.p_leading || (S.pSize && S.pLine ? Math.round(S.pLine / S.pSize * 100) : 150), ink: hexOk(st.p_colour) ? st.p_colour : '#1a1208' };

      // Font
      var sel = h('select', { class: 'dr-select dr-input--w', id: 'bf-font' });
      fillSelect(sel, fontOptions('Same as the rest of the email'), block.font || '');
      sel.addEventListener('change', function () {
        if (sel.value) block.font = sel.value; else delete block.font;
        changed(true);
      });
      box.appendChild(group('bf-font', isPanel ? 'Font for this panel' : 'Font', null, sel));
      if (isPanel) return box;

      // Size and style side by side
      var lo = isButton ? 11 : 10, hi = isButton ? 28 : 60;
      var size = h('input', { class: 'dr-input dr-input--w', id: 'bf-size', type: 'number', min: String(lo), max: String(hi),
        step: '1', inputmode: 'numeric', value: String(block.size || P.size), 'aria-label': 'Size in pixels' });
      size.addEventListener('input', function () {
        var n = parseInt(size.value, 10);
        if (!isFinite(n)) return;
        n = Math.max(lo, Math.min(hi, n));
        if (n === P.size) delete block.size; else block.size = n;
        changed(true);
      });
      size.addEventListener('blur', function () { size.value = String(block.size || P.size); });
      var curB = block.bold === undefined ? P.bold : !!block.bold;
      var curI = block.italic === undefined ? P.italic : !!block.italic;
      var style = h('select', { class: 'dr-select dr-input--w', id: 'bf-style' });
      fillSelect(style, STYLE_OPTS, styleValue(curB, curI));
      style.addEventListener('change', function () {
        var b2 = style.value === 'bold' || style.value === 'bolditalic';
        var i2 = style.value === 'italic' || style.value === 'bolditalic';
        if (b2 === P.bold && i2 === P.italic) { delete block.bold; delete block.italic; }
        else { block.bold = b2; block.italic = i2; }
        changed(true);
      });
      box.appendChild(twoUp(group('bf-size', 'Size', null, size), group('bf-style', 'Style', null, style)));

      // Colour
      var swatch = h('input', { class: 'mr-colour', id: 'bf-ink', type: 'color', value: hexOk(block.ink) ? block.ink : P.ink });
      var hex = h('input', { class: 'dr-input dr-input--w', id: 'bf-ink-hex', type: 'text', value: hexOk(block.ink) ? block.ink : P.ink,
        maxlength: 7, 'aria-label': 'Colour, as a colour code' });
      var reset = h('button', { type: 'button', class: 'mr-studio__linkbtn', text: 'Use default', hidden: !hexOk(block.ink) });
      function putInk(v) { block.ink = v; reset.hidden = false; changed(true); }
      swatch.addEventListener('input', function () { hex.value = swatch.value; putInk(swatch.value); });
      hex.addEventListener('input', function () { if (hexOk(hex.value)) { swatch.value = hex.value; putInk(hex.value); } });
      hex.addEventListener('blur', function () { hex.value = hexOk(block.ink) ? block.ink : P.ink; });
      reset.addEventListener('click', function () { delete block.ink; swatch.value = P.ink; hex.value = P.ink; reset.hidden = true; changed(true); });
      box.appendChild(group('bf-ink', 'Colour', null, h('div', { class: 'mr-colour-row' }, swatch, hex, reset)));

      // Alignment, for the blocks that have it. Same setting as Position on the Block tab.
      if (['text', 'heading', 'story', 'list', 'button'].indexOf(block.type) > -1) {
        var curAlign = block.align || 'left';
        var seg = h('div', { class: 'mr-seg', role: 'group', id: 'bf-align', 'aria-labelledby': 'bf-align-label' });
        [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']].forEach(function (o2) {
          var bb = h('button', { type: 'button', class: 'mr-seg__btn mr-seg__btn--text', 'aria-pressed': curAlign === o2[0] ? 'true' : 'false', text: o2[1] });
          bb.addEventListener('click', function () {
            if (o2[0] === 'left') delete block.align; else block.align = o2[0];
            Array.prototype.forEach.call(seg.children, function (c) { c.setAttribute('aria-pressed', c === bb ? 'true' : 'false'); });
            changed(true);
          });
          seg.appendChild(bb);
        });
        box.appendChild(h('div', { class: 'dr-form-group mr-field--inline' }, h('span', { class: 'dr-label', id: 'bf-align-label', text: 'Alignment' }), seg));
      }

      // Capitals
      var baseCase = P.tcase || 'none';
      var curCase = block.tcase || baseCase;
      var cseg = h('div', { class: 'mr-seg', role: 'group', id: 'bf-case', 'aria-labelledby': 'bf-case-label' });
      [['none', 'Aa', 'As typed'], ['upper', 'AA', 'All capitals'], ['lower', 'aa', 'All lowercase']].forEach(function (o2) {
        var cb = h('button', { type: 'button', class: 'mr-seg__btn mr-seg__btn--text', title: o2[2], 'aria-label': o2[2],
          'aria-pressed': curCase === o2[0] ? 'true' : 'false', text: o2[1] });
        cb.addEventListener('click', function () {
          if (o2[0] === baseCase) delete block.tcase; else block.tcase = o2[0];
          Array.prototype.forEach.call(cseg.children, function (c) { c.setAttribute('aria-pressed', c === cb ? 'true' : 'false'); });
          changed(true);
        });
        cseg.appendChild(cb);
      });
      box.appendChild(h('div', { class: 'dr-form-group mr-field--inline' }, h('span', { class: 'dr-label', id: 'bf-case-label', text: 'Case' }), cseg));

      // Spacing, closed until opened
      function slider(id, text, key, min, max, def) {
        var val = block[key] === undefined ? def : block[key];
        var range = h('input', { type: 'range', class: 'mr-range', id: id, min: String(min), max: String(max), step: '1', value: String(val) });
        var num = h('input', { type: 'number', class: 'dr-input mr-range__num', min: String(min), max: String(max), step: '1', value: String(val), 'aria-label': text + ', as a number' });
        function put(n) { if (n === def) delete block[key]; else block[key] = n; changed(true); }
        range.addEventListener('input', function () { var n = parseInt(range.value, 10); num.value = n; put(n); });
        num.addEventListener('input', function () {
          var n = parseInt(num.value, 10);
          if (isFinite(n) && n >= min && n <= max) { range.value = n; put(n); }
        });
        num.addEventListener('blur', function () { num.value = block[key] === undefined ? def : block[key]; });
        return group(id, text, null, h('div', { class: 'mr-range__row' }, range, num));
      }
      spacingFold(box, 'bf-spacing', function (inner) {
        if (!isButton) inner.appendChild(slider('bf-lead', 'Line height', 'lead', 100, isTitle ? 200 : 220, P.lead));
        inner.appendChild(slider('bf-space', 'Letter spacing', 'lspace', -2, 10, P.space));
      });
      return box;
    }

    function buildBlockPane() {
      var path = state.sel;
      var block = byPath(path);
      pBlock.textContent = '';
      if (!block) return;
      var at = resolve(path);
      var kind = textKind(block);
      if (state.btab === 'text' && !kind) state.btab = 'block';

      var actions = h('div', { class: 'mr-studio__tinys' },
        tinyBtn('Add a block below', 'plus', false, function () {
          state.adding = true; state.rail = 'content'; state.tab = 'blocks'; renderTabs(); renderPanels(); renderRail();
          var first = pContent.querySelector('.mr-studio__tile'); if (first) first.focus();
        }),
        tinyBtn('Move up', 'up', at.index === 0, function () { move(path, -1); }, 'up'),
        tinyBtn('Move down', 'down', at.index === at.list.length - 1, function () { move(path, 1); }, 'down'),
        tinyBtn('Duplicate', 'copy', false, function () { duplicate(path); }),
        o.onSaveBlock ? tinyBtn('Save to reuse later', 'bookmark', false, function () {
          o.onSaveBlock([block], function (row) { saved = saved.concat([row]); drawSaved(); });
        }) : null,
        tinyBtn('Remove', 'trash', false, function () { remove(path); }, null, true));
      pBlock.appendChild(h('div', { class: 'mr-studio__phead' },
        h('button', { type: 'button', class: 'mr-studio__back', onclick: function () { select(null); } }, icon('back', 18), h('span', { text: 'Done' })),
        h('div', { class: 'mr-studio__titlerow' }, h('h2', { class: 'mr-studio__h2', text: blockLabel(block) }), actions)));

      if (kind) {
        var tabs = h('div', { class: 'mr-studio__tabs mr-studio__tabs--block', role: 'tablist', 'aria-label': 'Settings for this block' });
        var tb = {};
        [['block', 'Block'], ['text', 'Font']].forEach(function (t) {
          var b2 = h('button', {
            type: 'button', role: 'tab', class: 'mr-studio__tab' + (state.btab === t[0] ? ' is-on' : ''),
            'aria-selected': state.btab === t[0] ? 'true' : 'false', tabindex: state.btab === t[0] ? '0' : '-1',
            onclick: function () { state.btab = t[0]; buildBlockPane(); var again = pBlock.querySelector('[role="tab"][aria-selected="true"]'); if (again) again.focus(); }
          }, t[1]);
          b2.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            state.btab = t[0] === 'block' ? 'text' : 'block';
            buildBlockPane();
            var again = pBlock.querySelector('[role="tab"][aria-selected="true"]'); if (again) again.focus();
          });
          tb[t[0]] = b2;
          tabs.appendChild(b2);
        });
        pBlock.appendChild(tabs);
      }

      if (kind && state.btab === 'text') {
        pBlock.appendChild(blockFontPane(block, kind));
        return;
      }

      if (block.type === 'panel') pBlock.appendChild(panelSettings(block, path));
      else pBlock.appendChild(PARTS.fields(block, path, fieldsApi));
      pBlock.appendChild(designPanel(block));
    }

    /* ---------------- block design ----------------
       Layout, spacing, background, rounded corners, borders and who sees the
       block. Kept in block.design, one key each, and a key is removed when it
       goes back to its default. mr-render.js checks every value again. */
    function dget(block, key) { return block.design ? block.design[key] : undefined; }
    function dset(block, key, v) {
      if (v === '' || v === null || v === undefined) {
        if (block.design) { delete block.design[key]; if (!Object.keys(block.design).length) delete block.design; }
      } else {
        if (!block.design) block.design = {};
        block.design[key] = v;
      }
      changed(true);
    }
    function dnum(block, id, text, key, min, max, def, unit) {
      var cur = dget(block, key);
      var input = h('input', { class: 'dr-input', id: id, type: 'number', min: String(min), max: String(max), step: '1',
        inputmode: 'numeric', value: cur === undefined ? '' : String(cur), placeholder: String(def), 'aria-label': text });
      input.addEventListener('input', function () {
        var v = input.value.trim();
        if (v === '') { dset(block, key, ''); return; }
        var n = parseInt(v, 10);
        if (isFinite(n)) dset(block, key, Math.max(min, Math.min(max, n)));
      });
      input.addEventListener('blur', function () { var v = dget(block, key); input.value = v === undefined ? '' : String(v); });
      return unit ? h('div', { class: 'mr-studio__unit' }, input, h('span', { text: unit })) : input;
    }
    function dseg(block, text, key, options, def) {
      var cur = dget(block, key) || def;
      var wrap = h('div', { class: 'mr-studio__pills', role: 'group', 'aria-label': text });
      options.forEach(function (op) {
        var b = h('button', { type: 'button', class: 'mr-studio__pill', 'aria-pressed': cur === op[0] ? 'true' : 'false', text: op[1] });
        b.addEventListener('click', function () {
          dset(block, key, op[0] === def ? '' : op[0]);
          Array.prototype.forEach.call(wrap.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        });
        wrap.appendChild(b);
      });
      return wrap;
    }
    // Four sides, or one value for all four while "Group sides" is ticked.
    function dsides(block, id, text, keys, max) {
      var vals = keys.map(function (k) { return dget(block, k); });
      var grouped = vals.every(function (v) { return String(v === undefined ? '' : v) === String(vals[0] === undefined ? '' : vals[0]); });
      var holder = h('div');
      var box = h('input', { class: 'dr-choice__input', id: id + '-group', type: 'checkbox', checked: grouped });
      function draw() {
        holder.textContent = '';
        if (box.checked) {
          var one = h('input', { class: 'dr-input', id: id + '-all', type: 'number', min: '0', max: String(max), step: '1',
            inputmode: 'numeric', value: dget(block, keys[0]) === undefined ? '' : String(dget(block, keys[0])), placeholder: '0', 'aria-label': text + ', all sides' });
          one.addEventListener('input', function () {
            var v = one.value.trim();
            var n = v === '' ? '' : Math.max(0, Math.min(max, parseInt(v, 10) || 0));
            keys.forEach(function (k) { if (n === '') { if (block.design) delete block.design[k]; } else { (block.design = block.design || {})[k] = n; } });
            if (block.design && !Object.keys(block.design).length) delete block.design;
            changed(true);
          });
          holder.appendChild(h('div', { class: 'mr-studio__unit' }, one, h('span', { text: 'px' })));
        } else {
          var g = h('div', { class: 'mr-studio__sides' });
          [['Top', 0], ['Right', 1], ['Bottom', 2], ['Left', 3]].forEach(function (s2) {
            g.appendChild(h('label', { class: 'mr-studio__side' }, h('span', { text: s2[0] }),
              dnum(block, id + '-' + s2[1], text + ', ' + s2[0].toLowerCase(), keys[s2[1]], 0, max, 0)));
          });
          holder.appendChild(g);
        }
      }
      box.addEventListener('change', draw);
      draw();
      return h('div', { class: 'dr-form-group' },
        h('div', { class: 'mr-studio__row2' }, h('span', { class: 'dr-label', text: text + ' (px)' }),
          h('span', { class: 'dr-choice dr-choice--checkbox' }, box, h('label', { class: 'dr-choice__label', for: id + '-group', text: 'Same on all sides' }))),
        holder);
    }
    function dfield(id, text, control, hint) {
      return h('div', { class: 'dr-form-group' },
        h('label', { class: 'dr-label', for: id, text: text }), hint ? h('span', { class: 'dr-hint', text: hint }) : null, control);
    }
    function dcolour(block, id, text, key, fallback) {
      var cur = dget(block, key) || '';
      var ok = function (v) { return /^#[0-9a-fA-F]{6}$/.test(v || ''); };
      var swatch = h('input', { class: 'mr-colour', id: id, type: 'color', value: ok(cur) ? cur : fallback });
      var hex = h('input', { class: 'dr-input dr-input--w', id: id + '-hex', type: 'text', value: cur, placeholder: 'None', maxlength: 7,
        'aria-label': text + ', as a colour code' });
      var reset = h('button', { type: 'button', class: 'mr-studio__linkbtn', text: 'Clear', hidden: !cur });
      swatch.addEventListener('input', function () { hex.value = swatch.value; reset.hidden = false; dset(block, key, swatch.value); });
      hex.addEventListener('input', function () {
        if (ok(hex.value)) { swatch.value = hex.value; reset.hidden = false; dset(block, key, hex.value); }
        else if (hex.value === '') { reset.hidden = true; dset(block, key, ''); }
      });
      hex.addEventListener('blur', function () { hex.value = dget(block, key) || ''; });
      reset.addEventListener('click', function () { hex.value = ''; swatch.value = fallback; reset.hidden = true; dset(block, key, ''); });
      return dfield(id, text, h('div', { class: 'mr-colour-row' }, swatch, hex, reset));
    }
    function dfold(key, title, build) {
      var d = h('details', { class: 'mr-studio__fold' });
      d.open = !!styleUi.open['d-' + key];
      d.addEventListener('toggle', function () { styleUi.open['d-' + key] = d.open; });
      d.appendChild(h('summary', { class: 'mr-studio__foldhead', text: title }));
      var inner = h('div', { class: 'mr-studio__foldbody' });
      build(inner);
      d.appendChild(inner);
      return d;
    }

    function dslider(block, id, text, key, min, max, def) {
      var cur = dget(block, key);
      var val = cur === undefined ? def : cur;
      var range = h('input', { type: 'range', class: 'mr-range', id: id, min: String(min), max: String(max), step: '1', value: String(val) });
      var num = h('input', { type: 'number', class: 'dr-input mr-range__num', min: String(min), max: String(max), step: '1', value: String(val), 'aria-label': text + ', as a number' });
      function put(n) { dset(block, key, n === def ? '' : n); }
      range.addEventListener('input', function () { var n = parseInt(range.value, 10); num.value = n; put(n); });
      num.addEventListener('input', function () {
        var n = parseInt(num.value, 10);
        if (isFinite(n) && n >= min && n <= max) { range.value = n; put(n); }
      });
      num.addEventListener('blur', function () { var v = dget(block, key); num.value = v === undefined ? def : v; });
      return h('div', { class: 'dr-form-group' }, h('label', { class: 'dr-label', for: id, text: text }),
        h('div', { class: 'mr-range__row' }, range, num));
    }

    function designPanel(block) {
      var id = 'dz' + String(state.sel).replace(/\./g, '-');
      var wrap = h('div', { class: 'mr-studio__design' });
      wrap.appendChild(h('h3', { class: 'mr-studio__h3', text: 'Spacing and colour' }));
      wrap.appendChild(dslider(block, id + '-pt', 'Space above', 'pad_t', 0, 80, 0));
      wrap.appendChild(dslider(block, id + '-pb', 'Space below', 'pad_b', 0, 80, 0));
      if (block.type !== 'panel') wrap.appendChild(dcolour(block, id + '-bgc', 'Background colour', 'bg', '#ffffff'));

      var more = h('details', { class: 'mr-studio__fold mr-studio__fold--more' });
      more.open = !!styleUi.open['d-more'];
      more.addEventListener('toggle', function () { styleUi.open['d-more'] = more.open; });
      more.appendChild(h('summary', { class: 'mr-studio__foldhead', text: 'More options' }));
      var inner = h('div', { class: 'mr-studio__foldbody' });
      inner.appendChild(h('p', { class: 'mr-studio__hint', text: 'Leave a setting empty to keep the email’s own style.' }));
      more.appendChild(inner);
      wrap.appendChild(more);

      inner.appendChild(dfold('layout', 'Size and position', function (b) {
        b.appendChild(dfield(id + '-w', 'Width', dnum(block, id + '-w', 'Width', 'width', 10, 100, 100, '%')));
        b.appendChild(dfield(id + '-a', 'Position',
          dseg(block, 'Position', 'block_align', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']], 'left'),
          'Where a block narrower than 100% sits.'));
      }));
      inner.appendChild(dfold('spacing', 'Space inside and outside', function (b) {
        b.appendChild(dsides(block, id + '-pad', 'Space inside', ['pad_t', 'pad_r', 'pad_b', 'pad_l'], 80));
        b.appendChild(dsides(block, id + '-mar', 'Space outside', ['mar_t', 'mar_r', 'mar_b', 'mar_l'], 80));
      }));
      inner.appendChild(dfold('bg', 'Background picture', function (b) {
        var url = h('input', { class: 'dr-input', id: id + '-bgi', type: 'url', placeholder: 'https://', value: dget(block, 'bg_image') || '' });
        url.addEventListener('input', function () { dset(block, 'bg_image', /^https?:\/\//i.test(url.value.trim()) ? url.value.trim() : ''); });
        b.appendChild(dfield(id + '-bgi', 'Picture address', url, 'A web address starting https://. Some email apps do not show background pictures.'));
      }));
      inner.appendChild(dfold('radius', 'Rounded corners', function (b) {
        b.appendChild(dslider(block, id + '-r', 'Roundness', 'radius', 0, 40, 0));
        b.appendChild(h('p', { class: 'mr-studio__hint', text: 'Outlook for Windows shows square corners.' }));
      }));
      inner.appendChild(dfold('border', 'Border', function (b) {
        b.appendChild(dfield(id + '-bs', 'Thickness', dnum(block, id + '-bs', 'Border thickness', 'border_size', 0, 10, 0, 'px')));
        b.appendChild(dcolour(block, id + '-bc', 'Colour', 'border_colour', '#cccccc'));
        var cur = String(dget(block, 'border_sides') || 'trbl');
        var sides = h('div', { class: 'mr-studio__sidechecks' });
        [['t', 'Top'], ['r', 'Right'], ['b', 'Bottom'], ['l', 'Left']].forEach(function (sd) {
          var cb = h('input', { class: 'dr-choice__input', id: id + '-s' + sd[0], type: 'checkbox', checked: cur.indexOf(sd[0]) > -1 });
          cb.addEventListener('change', function () {
            var now = ['t', 'r', 'b', 'l'].filter(function (k) { return k === sd[0] ? cb.checked : cur.indexOf(k) > -1; }).join('');
            cur = now;
            dset(block, 'border_sides', now === 'trbl' ? '' : (now || 'x'));
          });
          sides.appendChild(h('span', { class: 'dr-choice dr-choice--checkbox' }, cb, h('label', { class: 'dr-choice__label', for: id + '-s' + sd[0], text: sd[1] })));
        });
        b.appendChild(dfield(id + '-sides', 'Which sides', sides));
      }));
      inner.appendChild(dfold('show', 'Show on', function (b) {
        b.appendChild(dseg(block, 'Show on', 'show', [['all', 'All devices'], ['desktop', 'Computers only'], ['mobile', 'Phones only']], 'all'));
      }));
      return wrap;
    }
    function tinyBtn(text, ic, disabled, fn, focusKey, warn) {
      return h('button', {
        type: 'button', class: 'mr-studio__tiny' + (warn ? ' is-warn' : ''), disabled: disabled, 'data-focus': focusKey,
        title: text, 'aria-label': text, onclick: fn
      }, icon(ic, 18));
    }
    function smallBtn(text, ic, disabled, fn, focusKey, warn) {
      return h('button', {
        type: 'button', class: 'mr-studio__small' + (warn ? ' is-warn' : ''), disabled: disabled, 'data-focus': focusKey,
        onclick: fn
      }, icon(ic, 16), h('span', { text: text }));
    }

    function panelSettings(block, path) {
      var id = 'b' + path.replace(/\./g, '-');
      var wrap = h('div');
      wrap.appendChild(PARTS.colourField(id + '-bg', 'Background', block, 'background', fieldsApi, 'The colour behind everything in this panel.'));
      wrap.appendChild(PARTS.colourField(id + '-ink', 'Text', block, 'text_colour', fieldsApi, 'Light text on a dark panel, or the other way round. Check it is easy to read.'));
      wrap.appendChild(PARTS.colourField(id + '-link', 'Links and buttons', block, 'link_colour', fieldsApi));
      wrap.appendChild(h('h3', { class: 'mr-studio__h3', text: 'Add inside this panel' }));
      var grid = h('div', { class: 'mr-studio__tiles mr-studio__tiles--small' });
      PARTS.innerTypes.forEach(function (t) {
        grid.appendChild(h('button', {
          type: 'button', class: 'mr-studio__tile', title: t.hint,
          onclick: function () { add(t.value, path + '.' + block.blocks.length); }
        }, icon(t.value, 26), h('span', { text: t.label })));
      });
      wrap.appendChild(grid);
      wrap.appendChild(h('p', { class: 'mr-studio__hint', text: 'Select a block inside the panel in your email to change it.' }));
      return wrap;
    }

    /* ---------------- Style ----------------
       The choices on this tab are kept in campaign.style, one key each, and
       a key is removed when it goes back to its default. The renderer checks
       every value again, so nothing here is trusted on the other side. */
    // One name each. The first group is fonts every device has. The second is
    // the 30 most used Google fonts: a mail app that cannot load one shows a
    // similar standard font instead (listed in mr-render.js beside each name).
    // ['__group', ...] starts a labelled group in the list.
    var FONT_OPTS = [
      ['__group', 'Standard fonts: look the same everywhere'],
      ['sans', 'Arial'], ['serif', 'Georgia'], ['system', 'Each device’s own font'],
      ['verdana', 'Verdana'], ['trebuchet', 'Trebuchet MS'], ['tahoma', 'Tahoma'], ['courier', 'Courier New'],
      ['__group', 'Google fonts: some mail apps swap these'],
      ['roboto', 'Roboto'],
      ['opensans', 'Open Sans'],
      ['inter', 'Inter'],
      ['montserrat', 'Montserrat'],
      ['poppins', 'Poppins'],
      ['lato', 'Lato'],
      ['arimo', 'Arimo'],
      ['robotocondensed', 'Roboto Condensed'],
      ['robotomono', 'Roboto Mono'],
      ['oswald', 'Oswald'],
      ['notosans', 'Noto Sans'],
      ['dmsans', 'DM Sans'],
      ['playfair', 'Playfair Display'],
      ['raleway', 'Raleway'],
      ['nunito', 'Nunito'],
      ['nunitosans', 'Nunito Sans'],
      ['robotoslab', 'Roboto Slab'],
      ['rubik', 'Rubik'],
      ['manrope', 'Manrope'],
      ['outfit', 'Outfit'],
      ['ubuntu', 'Ubuntu'],
      ['merriweather', 'Merriweather'],
      ['kanit', 'Kanit'],
      ['plusjakarta', 'Plus Jakarta Sans'],
      ['bebasneue', 'Bebas Neue'],
      ['lora', 'Lora'],
      ['worksans', 'Work Sans'],
      ['figtree', 'Figtree'],
      ['archivoblack', 'Archivo Black'],
      ['jetbrainsmono', 'JetBrains Mono']
    ];

    function sty() {
      if (!campaign.style || typeof campaign.style !== 'object') campaign.style = {};
      return campaign.style;
    }
    function setSty(key, v) {
      var s = sty();
      if (v === '' || v === null || v === undefined) delete s[key]; else s[key] = v;
      changed(true);
    }
    function hexOk(v) { return /^#[0-9a-fA-F]{6}$/.test(v || ''); }

    function group(forId, text, hint, control) {
      return h('div', { class: 'dr-form-group' },
        h('label', { class: 'dr-label', for: forId, text: text }),
        hint ? h('span', { class: 'dr-hint', text: hint }) : null,
        control);
    }

    function colourControl(id, text, key, fallback, hint) {
      var cur = sty()[key] || '';
      var swatch = h('input', { class: 'mr-colour', id: id, type: 'color', value: hexOk(cur) ? cur : fallback });
      var hex = h('input', { class: 'dr-input dr-input--w', id: id + '-hex', type: 'text', value: cur,
        placeholder: fallback, maxlength: 7, 'aria-label': text + ', as a colour code' });
      var reset = h('button', { type: 'button', class: 'mr-studio__linkbtn', text: 'Use default', hidden: !cur });
      swatch.addEventListener('input', function () { hex.value = swatch.value; reset.hidden = false; setSty(key, swatch.value); });
      hex.addEventListener('input', function () {
        if (hexOk(hex.value)) { swatch.value = hex.value; reset.hidden = false; setSty(key, hex.value); }
        else if (hex.value === '') { swatch.value = fallback; reset.hidden = true; setSty(key, ''); }
      });
      hex.addEventListener('blur', function () { hex.value = sty()[key] || ''; });
      reset.addEventListener('click', function () { hex.value = ''; swatch.value = fallback; reset.hidden = true; setSty(key, ''); });
      return group(id, text, hint, h('div', { class: 'mr-colour-row' }, swatch, hex, reset));
    }

    function numControl(id, text, key, min, max, def, hint) {
      var cur = sty()[key];
      var input = h('input', { class: 'dr-input dr-input--w', id: id, type: 'number', min: String(min), max: String(max),
        step: '1', inputmode: 'numeric', value: cur === undefined ? '' : String(cur), placeholder: String(def) });
      input.addEventListener('input', function () {
        var v = input.value.trim();
        if (v === '') { setSty(key, ''); return; }
        var n = parseInt(v, 10);
        if (isFinite(n)) setSty(key, Math.max(min, Math.min(max, n)));
      });
      input.addEventListener('blur', function () { var v = sty()[key]; input.value = v === undefined ? '' : String(v); });
      return group(id, text, hint || ('Between ' + min + ' and ' + max + '. Empty means ' + def + '.'), input);
    }

    // Capital letters: as typed, ALL CAPITALS or all lowercase. Three buttons, one choice.
    function caseControl(id, text, key) {
      var cur = sty()[key] || '';
      var wrap = h('div', { class: 'mr-seg', role: 'group', id: id, 'aria-labelledby': id + '-label' });
      [['', 'Aa', 'As typed'], ['upper', 'AA', 'All capitals'], ['lower', 'aa', 'All lowercase']].forEach(function (o2) {
        var b = h('button', { type: 'button', class: 'mr-seg__btn mr-seg__btn--text', title: o2[2], 'aria-label': o2[2], 'aria-pressed': cur === o2[0] ? 'true' : 'false', text: o2[1] });
        b.addEventListener('click', function () {
          setSty(key, o2[0]);
          Array.prototype.forEach.call(wrap.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        });
        wrap.appendChild(b);
      });
      return h('div', { class: 'dr-form-group mr-field--inline' }, h('span', { class: 'dr-label', id: id + '-label', text: text }), wrap);
    }

    // A slider with its number beside it. The default value clears the setting.
    function sliderControl(id, text, key, min, max, def, hint) {
      var cur = sty()[key];
      var val = cur === undefined ? def : cur;
      var range = h('input', { type: 'range', class: 'mr-range', id: id, min: String(min), max: String(max), step: '1', value: String(val) });
      var num = h('input', { type: 'number', class: 'dr-input mr-range__num', min: String(min), max: String(max), step: '1', value: String(val), 'aria-label': text + ', as a number' });
      function put(n) { setSty(key, n === def ? '' : n); }
      range.addEventListener('input', function () { var n = parseInt(range.value, 10); num.value = n; put(n); });
      num.addEventListener('input', function () {
        var n = parseInt(num.value, 10);
        if (isFinite(n) && n >= min && n <= max) { range.value = n; put(n); }
      });
      num.addEventListener('blur', function () { var v = sty()[key]; num.value = v === undefined ? def : v; });
      return group(id, text, hint, h('div', { class: 'mr-range__row' }, range, num));
    }

    // Fill a list with options. An entry written ['__group', 'Label'] starts a
    // labelled group, and the options after it go inside that group.
    function fillSelect(sel, options, cur) {
      var into = sel;
      options.forEach(function (o2) {
        if (o2[0] === '__group') {
          into = h('optgroup', { label: o2[1] });
          sel.appendChild(into);
          return;
        }
        into.appendChild(h('option', { value: o2[0], text: o2[1], selected: cur === o2[0] }));
      });
    }

    function selControl(id, text, key, options, hint) {
      var cur = sty()[key] || '';
      var sel = h('select', { class: 'dr-select dr-input--w', id: id });
      fillSelect(sel, options, cur);
      sel.addEventListener('change', function () { setSty(key, sel.value); });
      return group(id, text, hint, sel);
    }

    // A size in pixels as a plain number box. Empty means the email-wide default,
    // so the setting is removed rather than stored.
    function sizeControl(id, text, key, min, max, def) {
      var cur = sty()[key];
      var num = h('input', { type: 'number', class: 'dr-input dr-input--w', id: id, min: String(min), max: String(max), step: '1',
        inputmode: 'numeric', value: cur === undefined ? '' : String(cur), placeholder: String(def) });
      num.addEventListener('input', function () {
        var v = num.value.trim();
        if (v === '') { setSty(key, ''); return; }
        var n = parseInt(v, 10);
        if (isFinite(n)) setSty(key, Math.max(min, Math.min(max, n)));
      });
      num.addEventListener('blur', function () { var v = sty()[key]; num.value = v === undefined ? '' : String(v); });
      return group(id, text, null, num);
    }

    // Two short controls side by side, with one hint underneath.
    function twoUp(a, b, hint) {
      var row = h('div', { class: 'mr-studio__two' }, a, b);
      var wrap = h('div', null, row);
      if (hint) wrap.appendChild(h('p', { class: 'mr-studio__hint', text: hint }));
      return wrap;
    }

    // Spacing choices tucked away under one heading, closed until opened.
    function spacingFold(box, name, build) {
      var d = h('details', { class: 'mr-studio__fold mr-studio__fold--more' });
      d.open = !!styleUi.open[name];
      d.addEventListener('toggle', function () { styleUi.open[name] = d.open; });
      d.appendChild(h('summary', { class: 'mr-studio__foldhead', text: 'Spacing' }));
      var inner = h('div', { class: 'mr-studio__foldbody' });
      build(inner);
      d.appendChild(inner);
      box.appendChild(d);
    }

    // Regular, Bold, Italic or Bold italic in one menu. It writes the same two
    // keys the renderer already reads (a bold key and an italic key), and a key
    // that matches its default is removed, so an untouched email is unchanged.
    var STYLE_OPTS = [['regular', 'Regular'], ['bold', 'Bold'], ['italic', 'Italic'], ['bolditalic', 'Bold italic']];
    function styleValue(bold, italic) { return bold ? (italic ? 'bolditalic' : 'bold') : (italic ? 'italic' : 'regular'); }
    function styleControl(id, text, boldKey, italicKey, boldDefault, hint) {
      var st = sty();
      var bold = st[boldKey] === undefined ? boldDefault : !!st[boldKey];
      var italic = st[italicKey] === undefined ? false : !!st[italicKey];
      var sel = h('select', { class: 'dr-select dr-input--w', id: id });
      fillSelect(sel, STYLE_OPTS, styleValue(bold, italic));
      sel.addEventListener('change', function () {
        var b2 = sel.value === 'bold' || sel.value === 'bolditalic';
        var i2 = sel.value === 'italic' || sel.value === 'bolditalic';
        var s2 = sty();
        if (b2 === boldDefault) delete s2[boldKey]; else s2[boldKey] = b2;
        if (i2) s2[italicKey] = true; else delete s2[italicKey];
        changed(true);
      });
      return group(id, text, hint, sel);
    }

    function toggleControl(id, text, key, def) {
      var cur = sty()[key];
      var box = h('input', { class: 'dr-choice__input', id: id, type: 'checkbox', checked: cur === undefined ? def : !!cur });
      box.addEventListener('change', function () { setSty(key, box.checked === def ? '' : box.checked); });
      return h('div', { class: 'dr-choice dr-choice--checkbox' }, box, h('label', { class: 'dr-choice__label', for: id, text: text }));
    }

    function fold(name, title, build) {
      var d = h('details', { class: 'mr-studio__fold' });
      d.open = !!styleUi.open[name];
      d.addEventListener('toggle', function () { styleUi.open[name] = d.open; });
      d.appendChild(h('summary', { class: 'mr-studio__foldhead', text: title }));
      var inner = h('div', { class: 'mr-studio__foldbody' });
      build(inner);
      d.appendChild(inner);
      pStyle.appendChild(d);
    }

    function fontOptions(first) {
      return (first ? [['', first]] : []).concat(FONT_OPTS);
    }

    // The text choices for one kind of text. Used on the Text tab of a selected
    // block and on the Design tab, so there is one set of controls for each.
    function textControls(kind, box, pfx) {
      var brand = brandNow() || {};
      var DB = MR.DEFAULT_BRAND;
      var accent = hexOk(brand.accent_colour) ? brand.accent_colour : DB.accent_colour;
      var btnFill = hexOk(brand.button_colour) ? brand.button_colour : DB.button_colour;
      var btnInk = hexOk(brand.button_text) ? brand.button_text : DB.button_text;
      if (kind === 'title') {
        box.appendChild(selControl(pfx + '-t-font', 'Font', 't_font', fontOptions('Same as the rest of the email')));
        box.appendChild(twoUp(sizeControl(pfx + '-t-size', 'Size', 't_size', 16, 40, 22),
          styleControl(pfx + '-t-style', 'Style', 't_bold', 't_italic', true)));
        box.appendChild(colourControl(pfx + '-t-colour', 'Colour', 't_colour', '#1a1208'));
        box.appendChild(caseControl(pfx + '-t-case', 'Capitals', 't_case'));
        spacingFold(box, pfx + '-t-spacing', function (inner) {
          inner.appendChild(sliderControl(pfx + '-t-lead', 'Line height (per cent)', 't_leading', 100, 200, 127));
          inner.appendChild(sliderControl(pfx + '-t-space', 'Letter spacing (pixels)', 't_spacing', -2, 10, 0));
        });
      } else if (kind === 'paragraph') {
        box.appendChild(selControl(pfx + '-p-font', 'Font', 'p_font', fontOptions('Same as the rest of the email')));
        box.appendChild(twoUp(sizeControl(pfx + '-p-size', 'Size', 'p_size', 11, 28, 16),
          styleControl(pfx + '-p-style', 'Style', 'p_bold', 'p_italic', false)));
        box.appendChild(colourControl(pfx + '-p-colour', 'Colour', 'p_colour', '#1a1208'));
        box.appendChild(caseControl(pfx + '-p-case', 'Capitals', 'p_case'));
        // An older choice of Tight or Roomy becomes the same line height as a number.
        var legacy = { compact: 130, relaxed: 175 }[sty().line];
        if (legacy && sty().p_leading === undefined) { sty().p_leading = legacy; delete sty().line; }
        spacingFold(box, pfx + '-p-spacing', function (inner) {
          inner.appendChild(sliderControl(pfx + '-p-lead', 'Line height (per cent)', 'p_leading', 100, 220, 150));
          inner.appendChild(sliderControl(pfx + '-p-space', 'Letter spacing (pixels)', 'p_spacing', -2, 10, 0));
        });
      } else if (kind === 'links') {
        box.appendChild(colourControl(pfx + '-link-colour', 'Colour', 'link_colour', accent, 'Empty uses the accent colour from your brand.'));
        box.appendChild(styleControl(pfx + '-link-style', 'Style', 'link_bold', 'link_italic', false));
        box.appendChild(toggleControl(pfx + '-link-underline', 'Underline', 'link_underline', true));
      } else if (kind === 'button') {
        box.appendChild(colourControl(pfx + '-b-bg', 'Button colour', 'btn_bg', btnFill, 'Empty uses the button colour from your brand.'));
        box.appendChild(colourControl(pfx + '-b-text', 'Words colour', 'btn_text', btnInk));
        box.appendChild(selControl(pfx + '-b-font', 'Font', 'btn_font', fontOptions('Same as the rest of the email')));
        box.appendChild(twoUp(sizeControl(pfx + '-b-size', 'Size', 'btn_size', 11, 28, 16),
          styleControl(pfx + '-b-style', 'Style', 'btn_bold', 'btn_italic', true)));
        box.appendChild(sliderControl(pfx + '-b-radius', 'Roundness', 'btn_radius', 0, 50, 24));
        box.appendChild(caseControl(pfx + '-b-case', 'Capitals', 'btn_case'));
        box.appendChild(sliderControl(pfx + '-b-space', 'Letter spacing (pixels)', 'btn_spacing', -2, 10, 0));
        var more = h('details', { class: 'mr-studio__fold mr-studio__fold--more' });
        more.open = !!styleUi.open['b-more'];
        more.addEventListener('toggle', function () { styleUi.open['b-more'] = more.open; });
        more.appendChild(h('summary', { class: 'mr-studio__foldhead', text: 'More button options' }));
        var inner = h('div', { class: 'mr-studio__foldbody' });
        inner.appendChild(toggleControl(pfx + '-b-underline', 'Underline', 'btn_underline', false));
        inner.appendChild(sliderControl(pfx + '-b-width', 'Width in pixels', 'btn_width', 10, 600, 260));
        inner.appendChild(sliderControl(pfx + '-b-border', 'Border thickness', 'btn_border', 0, 6, 2));
        inner.appendChild(colourControl(pfx + '-b-border-colour', 'Border colour', 'btn_border_colour', btnFill, 'Empty matches the button colour.'));
        more.appendChild(inner);
        box.appendChild(more);
      }
    }

    function buildStyle() {
      pStyle.textContent = '';
      pStyle.appendChild(h('h2', { class: 'mr-studio__h2', text: 'Design' }));
      pStyle.appendChild(h('p', { class: 'mr-studio__hint', text: 'These choices apply to the whole email. To change one block, click it.' }));
      var brand = brandNow() || {};

      // The brand library: what is kept once and used by every campaign.
      var lib = h('div', { class: 'mr-studio__card' });
      lib.appendChild(h('h3', { class: 'mr-studio__cardhead', text: 'Your brand' }));
      var list = h('dl', { class: 'mr-studio__brand' });
      function swatch(label, hex) {
        list.appendChild(h('dt', { text: label }));
        list.appendChild(h('dd', null,
          hex ? h('span', { class: 'mr-studio__swatch', style: 'background:' + hex, 'aria-hidden': 'true' }) : null,
          hex || 'Not set'));
      }
      list.appendChild(h('dt', { text: 'Logo' }));
      list.appendChild(h('dd', { text: brand.logo_url ? 'Set' : 'Not set yet' }));
      // The footer draws an icon for each social page set on the Brand page.
      var icons = (brand.social_links || []).filter(function (l) { return l && l.url; }).length;
      list.appendChild(h('dt', { text: 'Social icons' }));
      list.appendChild(h('dd', { text: icons ? icons + ' shown in the footer' : 'None set yet. Add them on the Brand page' }));
      swatch('Accent colour', hexOk(brand.accent_colour) ? brand.accent_colour : '');
      swatch('Button colour', hexOk(brand.button_colour) ? brand.button_colour : '');
      lib.appendChild(list);
      lib.appendChild(h('p', { class: 'mr-studio__hint' },
        h('a', { href: 'brand.html', target: '_blank', rel: 'noopener', text: 'Change your brand' }),
        ' (opens in a new tab). Reload this page afterwards to see the change.'));
      pStyle.appendChild(lib);

      fold('email', 'Email size and colours', function (box) {
        box.appendChild(sliderControl('mrs-width', 'Email width', 'width', 480, 700, 600,
          'On a phone the email always fills the screen.'));
        var font = h('select', { class: 'dr-select dr-input--w', id: 'mrs-font' });
        fillSelect(font, FONT_OPTS, campaign.font_family || 'sans');
        font.addEventListener('change', function () { campaign.font_family = font.value; changed(true); });
        box.appendChild(group('mrs-font', 'Main font',
          'Standard fonts look the same everywhere. Google fonts show in most mail apps, but Gmail and some versions of Outlook show a similar standard font instead.', font));
        box.appendChild(colourControl('mrs-page', 'Colour around the email', 'page', '#f3f2f1'));
        box.appendChild(colourControl('mrs-body', 'Colour of the email', 'body', '#ffffff'));
      });

      fold('header', 'Top of the email', function (box) {
        var topName = h('input', { class: 'dr-input dr-input--w', id: 'mrs-header-text', type: 'text', maxlength: '80',
          value: sty().header_text || '', placeholder: account().name || '' });
        topName.addEventListener('input', function () { setSty('header_text', topName.value.trim() ? topName.value : ''); });
        box.appendChild(group('mrs-header-text', 'Name at the top',
          'Shown when there is no logo. Leave it empty to use your account name.', topName));
        var on = h('input', { class: 'dr-choice__input', id: 'mrs-strip', type: 'checkbox', checked: !!campaign.header_colour });
        var colourWrap = h('div', { hidden: !campaign.header_colour });
        function drawColour() {
          colourWrap.textContent = '';
          if (campaign.header_colour) {
            colourWrap.appendChild(PARTS.colourField('mrs-strip-colour', 'Strip colour', campaign, 'header_colour',
              { changed: function () { changed(true); } }, 'The band behind your logo.'));
          }
        }
        on.addEventListener('change', function () {
          campaign.header_colour = on.checked ? '#f3ead9' : null;
          colourWrap.hidden = !on.checked;
          drawColour();
          changed(true);
        });
        box.appendChild(h('div', { class: 'dr-choice dr-choice--checkbox' }, on,
          h('label', { class: 'dr-choice__label', for: 'mrs-strip' }, 'Put a colour strip behind the logo',
            h('span', { class: 'dr-choice__hint', text: 'Otherwise the top is a line in your accent colour.' }))));
        drawColour();
        box.appendChild(colourWrap);
        var br = h('input', { class: 'dr-choice__input', id: 'mrs-browser', type: 'checkbox', checked: !!campaign.show_browser_link });
        br.addEventListener('change', function () { campaign.show_browser_link = br.checked; changed(true); });
        box.appendChild(h('div', { class: 'dr-choice dr-choice--checkbox' }, br,
          h('label', { class: 'dr-choice__label', for: 'mrs-browser' }, 'Show a “View in browser” link',
            h('span', { class: 'dr-choice__hint', text: 'It only works if this campaign is public in the archive.' }))));
      });

      fold('titles', 'Titles', function (box) { textControls('title', box, 'ds'); });
      fold('paragraphs', 'Paragraphs', function (box) { textControls('paragraph', box, 'ds'); });
      fold('links', 'Links', function (box) { textControls('links', box, 'ds'); });
      fold('buttons', 'Buttons', function (box) { textControls('button', box, 'ds'); });

      fold('more', 'More options', function (box) {
        box.appendChild(sliderControl('mrs-pad', 'Space at the sides', 'pad', 0, 48, 24,
          'On a phone this is always 16.'));
        box.appendChild(selControl('mrs-dir', 'Writing direction', 'dir',
          [['', 'Left to right'], ['rtl', 'Right to left']],
          'Right to left is for Arabic, Hebrew and similar languages.'));
        var url = h('input', { class: 'dr-input', id: 'mrs-bgimage', type: 'url', value: sty().bg_image || '',
          placeholder: 'https://' });
        url.addEventListener('input', function () { setSty('bg_image', url.value.trim()); });
        var row2 = h('div', { class: 'dr-button-group' });
        if (o.images) {
          row2.appendChild(h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Choose or upload a picture',
            onclick: function () { o.images(function (picked) { setSty('bg_image', picked.url); buildStyle(); }); } }));
        }
        row2.appendChild(h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Remove picture',
          onclick: function () { setSty('bg_image', ''); url.value = ''; } }));
        box.appendChild(group('mrs-bgimage', 'Picture behind the email',
          'A web address starting https://. Outlook on Windows does not show it, so the colour around the email must work without it.', url));
        box.appendChild(row2);
      });

      var count = campaign.style ? Object.keys(campaign.style).length : 0;
      var reset = h('button', { type: 'button', class: 'mr-studio__small is-warn', id: 'mrs-style-reset', disabled: !count,
        onclick: function () { if (campaign.style) campaign.style = {}; buildStyle(); changed(true); } },
        h('span', { text: 'Put the design back to normal' }));
      pStyle.appendChild(h('div', { class: 'mr-studio__reset' }, reset,
        h('p', { class: 'mr-studio__hint', text: 'Resets the choices on this tab. Undo brings them back. The main font and the top of the email are not changed.' })));
    }

    /* ---------------- Send ---------------- */
    function buildSend() {
      pSend.textContent = '';
      pSend.appendChild(h('h2', { class: 'mr-studio__h2', text: 'Send' }));
      pSend.appendChild(h('p', { class: 'mr-studio__hint', text: 'Subject, sender and list, then send it now or choose a time.' }));
      if (o.sendPanel) pSend.appendChild(o.sendPanel);
    }

    /* ---------------- the email in the middle ---------------- */
    function html() { return MR.renderEmail(campaign, account(), { brand: brandNow(), editing: true }); }

    function paint() {
      clearTimeout(timers.paint);
      var src = html();
      if (!ready) { frame.srcdoc = src; return; }
      var doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      var parsed = new DOMParser().parseFromString(src, 'text/html');
      doc.body.innerHTML = parsed.body.innerHTML;
      // The width of the phone breakpoint lives in the head, so keep it current.
      var liveCss = doc.head && doc.head.querySelector('style');
      var newCss = parsed.head && parsed.head.querySelector('style');
      if (liveCss && newCss && liveCss.textContent !== newCss.textContent) liveCss.textContent = newCss.textContent;
      doc.body.setAttribute('style', (parsed.body.getAttribute('style') || '') + ';cursor:default');
      afterPaint();
    }

    function afterPaint() {
      var doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      buildMap(doc);
      fit();
      placeSel();
      hoverBox.hidden = true;
    }

    // One table row per block, in order. A social block with no links draws
    // nothing, and a panel inside a panel is skipped, so neither has a row.
    function buildMap(doc) {
      map = [];
      byRow = new Map();
      var tables = doc.querySelectorAll('table.rc-wrap');
      var content = tables[tables.length - 1];
      if (!content) return;
      var rows = Array.prototype.slice.call(content.rows);
      var next = 1;                                  // row 0 is the header
      campaign.body_blocks.forEach(function (b, i) {
        if (emptySocial(b)) return;
        var tr = rows[next++];
        if (!tr) return;
        var entry = { path: String(i), block: b, tr: tr, kids: [] };
        byRow.set(tr, entry);
        map.push(entry);
        if (b.type === 'panel') {
          var inner = tr.querySelector('table:not(.rc-dsn)');   // a designed block has two wrapper tables of its own
          var innerRows = inner ? Array.prototype.slice.call(inner.rows) : [];
          var k = 1;                                 // row 0 is the top spacer
          (b.blocks || []).forEach(function (c, j) {
            if (c.type === 'panel' || emptySocial(c)) return;
            var ctr = innerRows[k++];
            if (!ctr) return;
            var kid = { path: i + '.' + j, block: c, tr: ctr, parent: entry };
            byRow.set(ctr, kid);
            entry.kids.push(kid);
          });
        }
      });
    }

    function entryAt(target) {
      var doc = frame.contentDocument;
      for (var el = target; el && doc && el !== doc.body; el = el.parentNode) {
        var m = byRow.get(el);
        if (m) return m;
      }
      return null;
    }
    function entryByPath(path) {
      if (path === null || path === undefined) return null;
      var found = null;
      map.forEach(function (e) {
        if (e.path === path) found = e;
        e.kids.forEach(function (k) { if (k.path === path) found = k; });
      });
      return found;
    }

    function fit() {
      var doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      var wide = narrow() ? Math.max(260, main.clientWidth - 12)
        : state.device === 'desktop' ? Math.max(WIDTHS.desktop, MR.resolveStyle(campaign.style).width + 60) : WIDTHS[state.device];
      frame.style.width = wide + 'px';
      var height = Math.ceil(doc.body.getBoundingClientRect().height);
      if (height > 0) frame.style.height = height + 'px';
    }

    function placeBox(box, tr) {
      if (!tr) { box.hidden = true; return; }
      var r = tr.getBoundingClientRect();
      box.hidden = false;
      box.style.left = (frame.offsetLeft + r.left) + 'px';
      box.style.top = (frame.offsetTop + r.top) + 'px';
      box.style.width = r.width + 'px';
      box.style.height = r.height + 'px';
    }

    function placeSel() {
      placeLinkBar();
      var e = entryByPath(state.sel);
      placeBox(selBox, e && e.tr);
      if (!e) { tools.hidden = true; return; }
      buildTools();
      tools.hidden = false;
      var r = e.tr.getBoundingClientRect();
      var w = tools.offsetWidth;
      var left = frame.offsetLeft + r.left + r.width - w;
      var top = frame.offsetTop + r.top - 38;
      tools.style.left = Math.max(frame.offsetLeft, left) + 'px';
      tools.style.top = Math.max(2, top) + 'px';
    }

    function scrollToSel() {
      var e = entryByPath(state.sel);
      if (!e) return;
      var r = e.tr.getBoundingClientRect();
      var top = frame.offsetTop + r.top;
      var m = main;
      // On a phone the sheet covers the foot of the screen, so the block has to
      // stay above it.
      var covered = narrow() && state.sheet ? panel.offsetHeight : 0;
      var room = m.clientHeight - covered;
      if (top < m.scrollTop + 60 || top + r.height > m.scrollTop + room - 20) {
        m.scrollTo({ top: Math.max(0, top - (covered ? 60 : 80)), behavior: 'smooth' });
      }
    }

    function buildTools() {
      var path = state.sel;
      var block = byPath(path);
      tools.textContent = '';
      if (!block) return;
      var at = resolve(path);
      var grip = h('button', {
        type: 'button', class: 'mr-studio__toolbtn mr-studio__toolbtn--grip', draggable: 'true',
        'aria-label': 'Drag to move this block', title: 'Drag to move'
      }, icon('grip', 18));
      grip.addEventListener('dragstart', function (e) {
        dragging = { kind: 'move', path: path, type: block.type };
        e.dataTransfer.setData('text/mr-move', path);
        e.dataTransfer.effectAllowed = 'move';
        var e0 = entryByPath(path);
        if (e0 && e.dataTransfer.setDragImage) {
          var ghost = h('div', { class: 'mr-studio__ghost', text: blockLabel(block) });
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 12, 12);
          setTimeout(function () { ghost.remove(); }, 0);
        }
      });
      grip.addEventListener('dragend', endDrag);
      tools.appendChild(grip);
      tools.appendChild(toolBtn('Move up', 'up', at.index === 0, function () { move(path, -1); }));
      tools.appendChild(toolBtn('Move down', 'down', at.index === at.list.length - 1, function () { move(path, 1); }));
      tools.appendChild(toolBtn('Duplicate', 'copy', false, function () { duplicate(path); }));
      if (o.onSaveBlock) tools.appendChild(toolBtn('Save to reuse', 'bookmark', false, function () {
        o.onSaveBlock([block], function (row) { saved = saved.concat([row]); drawSaved(); });
      }));
      tools.appendChild(toolBtn('Remove', 'trash', false, function () { remove(path); }));
    }
    function toolBtn(label, ic, disabled, fn) {
      return h('button', { type: 'button', class: 'mr-studio__toolbtn', 'aria-label': label, title: label, disabled: disabled, onclick: fn }, icon(ic, 18));
    }

    function select(path, quiet) {
      state.sel = (path === undefined) ? null : path;
      state.adding = false;
      if (state.sel !== null) state.rail = 'content';
      renderRail();
      renderPanels();
      drawOutline();
      placeSel();
      if (narrow()) setSheet(state.sel !== null);
      if (state.sel !== null && !quiet) scrollToSel();
    }

    /* ---------------- events inside the frame ---------------- */
    function wireFrame() {
      var doc = frame.contentDocument;
      doc.addEventListener('mousemove', function (e) {
        if (dragging) return;
        var en = entryAt(e.target);
        placeBox(hoverBox, en && en.path !== state.sel ? en.tr : null);
      });
      doc.addEventListener('mouseleave', function () { hoverBox.hidden = true; });
      doc.addEventListener('click', function (e) {
        e.preventDefault();                          // a link in the email must not take the editor away
        var f = fieldEl(e.target);
        if (f) {                                     // words, a button or a picture: edited where it stands
          if (f.getAttribute('data-mr-k') === 'image') {
            select(f.getAttribute('data-mr-b'), true);
            if (f.classList.contains('mr-ph-img')) chooseImage(f);
          }
          return;
        }
        var en = entryAt(e.target);
        if (!en) { select(null); return; }
        select(en.path);
        focusFirst(en);
      });
      wireInline(doc);
      doc.addEventListener('dragover', function (e) {
        if (!dragging) return;
        e.preventDefault();
        var at = dropAt(e.target, e.clientY);
        showDrop(at);
      });
      doc.addEventListener('drop', function (e) {
        if (!dragging) return;
        e.preventDefault();
        var at = dropAt(e.target, e.clientY);
        perform(at);
      });
      doc.addEventListener('dragleave', function (e) { if (!e.relatedTarget) dropLine.hidden = true; });
      if (frame.contentWindow.ResizeObserver) {
        var ro = new frame.contentWindow.ResizeObserver(function () { fit(); placeSel(); });
        ro.observe(doc.body);
      }
      doc.addEventListener('load', function () { fit(); placeSel(); }, true);   // images arriving
    }

    /* ---------------- drag and drop ---------------- */
    function dropAt(target, clientY) {
      var doc = frame.contentDocument;
      var en = entryAt(target);
      if (!en) {
        if (!map.length) return { path: '0', ref: null, before: true };
        var first = map[0].tr.getBoundingClientRect();
        if (clientY < first.top) return { path: '0', ref: map[0], before: true };
        return { path: String(campaign.body_blocks.length), ref: map[map.length - 1], before: false };
      }
      if (en.parent && dragging.type === 'panel') en = en.parent;      // a panel cannot go in a panel
      var r = en.tr.getBoundingClientRect();
      var before = clientY < r.top + r.height / 2;
      var parts = en.path.split('.');
      var idx = Number(parts[parts.length - 1]) + (before ? 0 : 1);
      var path = parts.length > 1 ? parts[0] + '.' + idx : String(idx);
      return { path: path, ref: en, before: before };
    }
    function showDrop(at) {
      if (!at || !at.ref) { dropLine.hidden = true; return; }
      var r = at.ref.tr.getBoundingClientRect();
      dropLine.hidden = false;
      dropLine.style.left = (frame.offsetLeft + r.left) + 'px';
      dropLine.style.width = r.width + 'px';
      dropLine.style.top = (frame.offsetTop + (at.before ? r.top : r.bottom) - 2) + 'px';
    }
    function endDrag() { dragging = null; dropLine.hidden = true; }
    function perform(at) {
      var d = dragging;
      endDrag();
      if (!d || !at) return;
      if (d.kind === 'new') add(d.type, at.path);
      else if (d.kind === 'saved') {
        var s = saved.filter(function (x) { return String(x.id) === String(d.id); })[0];
        if (s) addSaved(s, at.path);
      } else if (d.kind === 'section') addSection(d.id, at.path);
      else if (d.kind === 'move') moveTo(d.path, at.path);
    }
    // Dropping beside the email, in the grey space, puts the block at the end.
    main.addEventListener('dragover', function (e) {
      if (!dragging || e.target === frame) return;
      e.preventDefault();
      showDrop({ ref: map[map.length - 1], before: false });
    });
    main.addEventListener('drop', function (e) {
      if (!dragging || e.target === frame) return;
      e.preventDefault();
      perform({ path: String(campaign.body_blocks.length) });
    });
    document.addEventListener('dragend', endDrag);


    /* ---------------- editing on the email ----------------
       MR.renderEmail(..., { editing: true }) marks every editable element with
       data-mr-b (which block), data-mr-f (which field of it) and data-mr-k (what
       kind: text, line, list or image), and makes it editable. Typing changes the
       campaign straight away and the page is not redrawn while someone types, so
       the cursor stays where it is. The next redraw, whatever causes it, draws the
       same words from the campaign. */
    var lb = null;        // what the link box is set to: { mode, key, el, range, anchor }

    function fieldEl(target) {
      var el = target && target.nodeType === 3 ? target.parentNode : target;
      return el && el.closest ? el.closest('[data-mr-f]') : null;
    }

    function setIn(block, field, value) {
      var parts = field.split('.');
      var o = block;
      for (var i = 0; i < parts.length - 1; i++) o = o ? o[parts[i]] : null;
      if (!o) return false;
      o[parts[parts.length - 1]] = value;
      return true;
    }

    function getIn(block, field) {
      var o = block;
      field.split('.').forEach(function (k) { o = o ? o[k] : undefined; });
      return o === undefined || o === null ? '' : o;
    }

    // What an element shows, written the way the campaign stores it:
    // line breaks as new lines and links as [words](address).
    function readField(el) {
      var kind = el.getAttribute('data-mr-k');
      if (kind === 'list') {
        var items = el.querySelectorAll('li');
        if (items.length) {
          return Array.prototype.map.call(items, function (li) {
            return li.textContent.replace(/[ ​]/g, ' ').trim();
          }).filter(Boolean).join('\n');
        }
      }
      var out = '';
      (function walk(node) {
        Array.prototype.forEach.call(node.childNodes, function (c) {
          if (c.nodeType === 3) { out += c.nodeValue.replace(/ /g, ' ').replace(/​/g, ''); return; }
          if (c.nodeType !== 1) return;
          var tag = c.tagName;
          if (tag === 'BR') { out += '\n'; return; }
          if (tag === 'A' && kind === 'text') {
            var url = (c.getAttribute('data-mr-url') || c.getAttribute('href') || '').replace(/\s/g, '').replace(/\)/g, '%29');
            var words = c.textContent.replace(/ /g, ' ').replace(/[\[\]\n]/g, ' ');
            var core = words.trim();
            if (url && url !== '#' && core) {
              out += /^\s*/.exec(words)[0] + '[' + core + '](' + url + ')' + /\s*$/.exec(words)[0];
            } else {
              out += words;
            }
            return;
          }
          if (tag === 'DIV' || tag === 'P') {
            if (out && out.charAt(out.length - 1) !== '\n') out += '\n';
            walk(c);
            return;
          }
          walk(c);
        });
      })(el);
      // A line break at the very end is only the browser's marker for the cursor.
      if (el.lastChild && el.lastChild.nodeName === 'BR' && out.slice(-1) === '\n') out = out.slice(0, -1);
      if (kind === 'line') out = out.replace(/\s*\n\s*/g, ' ');
      return out;
    }

    function inlineChanged() {
      markDirty();
      clearTimeout(timers.rec);
      timers.rec = setTimeout(record, 700);
      clearTimeout(timers.outline);
      timers.outline = setTimeout(drawOutline, 250);
    }

    function fieldChanged(el) {
      var block = byPath(el.getAttribute('data-mr-b'));
      if (!block) return;
      var v = readField(el);
      if (v === '' && el.childNodes.length) {              // an empty field shows its prompt again
        el.textContent = '';
        var d = el.ownerDocument, r = d.createRange();
        r.setStart(el, 0); r.collapse(true);
        var s = d.getSelection(); s.removeAllRanges(); s.addRange(r);
      }
      if (setIn(block, el.getAttribute('data-mr-f'), v)) {
        // The name at the top also has a box on the Style tab. Keep it in step.
        if (el.getAttribute('data-mr-b') === 'header') {
          var box = document.getElementById('mrs-header-text');
          if (box && box !== document.activeElement) box.value = v;
        }
        inlineChanged();
      }
    }

    function caretToEnd(el) {
      var d = el.ownerDocument, r = d.createRange();
      r.selectNodeContents(el); r.collapse(false);
      var s = d.getSelection(); s.removeAllRanges(); s.addRange(r);
    }

    // A click on the padding of a block puts the cursor in its first piece of text.
    function focusFirst(en) {
      var t = en.block.type === 'panel' ? null : en.tr.querySelector('[data-mr-f]:not([data-mr-k="image"])');
      if (t) { t.focus(); caretToEnd(t); return; }
      var first = pBlock.querySelector('textarea, input[type="text"], input[type="url"], select');
      if (first) first.focus();
    }

    function chooseImage(el) {
      var path = el.getAttribute('data-mr-b'), field = el.getAttribute('data-mr-f');
      if (!fieldsApi.images) {                             // no image library here: the address box in the panel is the way in
        var addr = pBlock.querySelector('input[type="url"]');
        if (addr) addr.focus();
        return;
      }
      fieldsApi.images(function (picked) {
        var b = byPath(path);
        if (!b) return;
        setIn(b, field, picked.url);
        if (!b.alt && picked.alt && (b.type === 'image' || b.type === 'imagetext' || b.type === 'product')) b.alt = picked.alt;
        fieldsApi.redraw();
      });
    }

    function wireInline(doc) {
      doc.addEventListener('input', function (e) {
        var el = fieldEl(e.target);
        if (el && el.getAttribute('data-mr-k') !== 'image') fieldChanged(el);
      });
      doc.addEventListener('focusin', function (e) {
        var el = fieldEl(e.target);
        if (!el || el.getAttribute('data-mr-k') === 'image') return;
        var path = el.getAttribute('data-mr-b');
        if (path !== 'header' && state.sel !== path) select(path, true);
        syncLinkBar(el);
      });
      doc.addEventListener('focusout', function () {
        setTimeout(function () {
          if (!lb) return;
          if (linkBar.contains(document.activeElement)) return;
          var active = doc.activeElement;
          if (active && fieldEl(active) && fieldEl(active).getAttribute('data-mr-k') !== 'image') return;
          hideLinkBar();
        }, 150);
      });
      doc.addEventListener('selectionchange', function () {
        if (linkBar.contains(document.activeElement)) return;
        var s = doc.getSelection();
        var el = s && s.anchorNode ? fieldEl(s.anchorNode) : null;
        if (el && el.getAttribute('data-mr-k') !== 'image') syncLinkBar(el);
      });
      doc.addEventListener('keydown', function (e) {
        var el = fieldEl(e.target);
        if (!el) return;
        var kind = el.getAttribute('data-mr-k');
        var mod = e.metaKey || e.ctrlKey;
        if (e.key === 'Escape') { el.blur(); return; }
        if (mod && /^[biu]$/i.test(e.key)) { e.preventDefault(); return; }       // bold and italic are not kept in email text
        if (mod && e.key.toLowerCase() === 'k' && (kind === 'text' || el.getAttribute('data-mr-l'))) {
          e.preventDefault();
          syncLinkBar(el);
          if (lb) { lbInput.focus(); lbInput.select(); }
          return;
        }
        if (e.key === 'Enter' && !mod) {
          if (kind === 'line') { e.preventDefault(); el.blur(); }
          else if (kind === 'text') { e.preventDefault(); doc.execCommand('insertLineBreak'); }
        }
      });
      doc.addEventListener('paste', function (e) {
        var el = fieldEl(e.target);
        if (!el || el.getAttribute('data-mr-k') === 'image') return;
        e.preventDefault();
        var t = ((e.clipboardData || window.clipboardData).getData('text/plain') || '').replace(/\r/g, '');
        if (el.getAttribute('data-mr-k') === 'line') t = t.replace(/\s*\n\s*/g, ' ');
        doc.execCommand('insertText', false, t);
      });
      doc.addEventListener('dblclick', function (e) {
        var el = fieldEl(e.target);
        if (el && el.getAttribute('data-mr-k') === 'image' && !el.classList.contains('mr-ph-img')) {
          select(el.getAttribute('data-mr-b'), true);
          chooseImage(el);
        }
      });
    }

    /* ---------------- the link box ---------------- */
    function linkOk(v) {
      v = String(v || '').trim();
      return /^(https?:|mailto:)/i.test(v) || /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v) || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
    }
    function linkClean(v) {
      v = String(v || '').replace(/\s/g, '');
      if (/^[^\s@:\/]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) v = 'mailto:' + v;
      else if (!/^(https?:|mailto:)/i.test(v) && /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v)) v = 'https://' + v;
      return v;
    }

    function anchorAt(sel, el) {
      var n = sel && sel.anchorNode;
      for (; n && n !== el; n = n.parentNode) if (n.nodeType === 1 && n.tagName === 'A') return el.contains(n) ? n : null;
      return null;
    }

    function lbElement() {
      if (!lb) return null;
      if (lb.el && lb.el.isConnected) return lb.el;
      var d = frame.contentDocument;
      lb.el = d ? d.querySelector(lb.key) : null;
      return lb.el;
    }

    function syncLinkBar(el) {
      var doc = frame.contentDocument;
      var sel = doc.getSelection();
      var kind = el.getAttribute('data-mr-k');
      var link = el.getAttribute('data-mr-l');
      var key = '[data-mr-b="' + el.getAttribute('data-mr-b') + '"][data-mr-f="' + el.getAttribute('data-mr-f') + '"]';
      var block = byPath(el.getAttribute('data-mr-b'));
      if (link && block) {
        showLinkBar({ mode: 'field', key: key, el: el, field: link, path: el.getAttribute('data-mr-b') }, String(getIn(block, link) || ''));
        return;
      }
      if (kind !== 'text') { hideLinkBar(); return; }
      var a = anchorAt(sel, el);
      if (a) { showLinkBar({ mode: 'anchor', key: key, el: el, anchor: a }, a.getAttribute('data-mr-url') || a.getAttribute('href') || ''); return; }
      if (sel && sel.rangeCount && !sel.isCollapsed && el.contains(sel.anchorNode) && el.contains(sel.focusNode)) {
        showLinkBar({ mode: 'sel', key: key, el: el, range: sel.getRangeAt(0).cloneRange() }, '');
        return;
      }
      hideLinkBar();
    }

    function showLinkBar(next, value) {
      var same = lb && lb.mode === next.mode && lb.key === next.key;
      lb = next;
      lbLabel.textContent = next.mode === 'sel' ? 'Link the selected words' : (next.mode === 'field' ? 'Where it links to' : 'Link');
      lbRemove.textContent = 'Remove link';
      lbApply.hidden = next.mode !== 'sel';
      lbRemove.hidden = next.mode === 'sel';
      lbInput.removeAttribute('aria-invalid');
      if (!same || document.activeElement !== lbInput) lbInput.value = value;
      linkBar.hidden = false;
      placeLinkBar();
    }

    function hideLinkBar() {
      lb = null;
      linkBar.hidden = true;
    }

    function placeLinkBar() {
      if (lb && !lbElement()) hideLinkBar();     // the words it was for have gone
    }

    lbInput.addEventListener('input', function () {
      if (!lb) return;
      var v = lbInput.value.trim();
      lbInput.removeAttribute('aria-invalid');
      if (lb.mode === 'field') {
        var block = byPath(lb.path);
        if (block && setIn(block, lb.field, v)) changed();
      } else if (lb.mode === 'anchor') {
        var a = lb.anchor, c = linkClean(v);
        if (c) { a.setAttribute('data-mr-url', c); a.setAttribute('href', linkOk(c) ? c : '#'); }
        else { a.removeAttribute('data-mr-url'); a.setAttribute('href', '#'); }
        fieldChanged(lbElement());
      }
    });
    lbInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (lb && lb.mode === 'sel') applyLink();
        else { var el = lbElement(); if (el) el.focus(); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        var el2 = lbElement();
        if (el2) el2.focus(); else hideLinkBar();
      }
    });
    // A bare address such as example.org/page is stored with https:// in front, so the plain-text
    // version of the email carries a link a mail app can follow.
    lbInput.addEventListener('change', function () {
      if (!lb || lb.mode === 'sel') return;
      var v = lbInput.value.trim();
      if (!v || /^(https?:|mailto:)/i.test(v) || !linkOk(v)) return;
      var c = linkClean(v);
      lbInput.value = c;
      lbInput.dispatchEvent(new Event('input'));
    });
    lbApply.addEventListener('click', applyLink);
    lbRemove.addEventListener('click', function () {
      if (!lb) return;
      if (lb.mode === 'field') {
        var block = byPath(lb.path);
        if (block && setIn(block, lb.field, '')) { lbInput.value = ''; changed(); }
        lbInput.focus();
      } else if (lb.mode === 'anchor') {
        var a = lb.anchor, el = lbElement();
        while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a);
        a.parentNode.removeChild(a);
        if (el) fieldChanged(el);
        paint();
        hideLinkBar();
      }
    });

    function applyLink() {
      if (!lb || lb.mode !== 'sel') return;
      var c = linkClean(lbInput.value);
      if (!c || !linkOk(c)) {
        lbInput.setAttribute('aria-invalid', 'true');
        lbInput.title = 'Use a full web address, such as https://example.com';
        lbInput.focus();
        return;
      }
      var el = lbElement(), r = lb.range;
      if (!el || !r) return;
      var a = el.ownerDocument.createElement('a');
      a.setAttribute('href', c);
      a.setAttribute('data-mr-url', c);
      var frag = r.extractContents();
      Array.prototype.forEach.call(frag.querySelectorAll('a'), function (old) {
        while (old.firstChild) old.parentNode.insertBefore(old.firstChild, old);
        old.parentNode.removeChild(old);
      });
      a.appendChild(frag);
      r.insertNode(a);
      fieldChanged(el);
      hideLinkBar();
      flush(); record();
      paint();                                   // draws the link in the email's own link style
    }

    /* ---------------- changes from the settings fields ---------------- */
    function changed(style) {
      markDirty();
      clearTimeout(timers.paint);
      timers.paint = setTimeout(function () { paint(); drawOutline(); }, style ? 0 : 120);
      clearTimeout(timers.rec);
      timers.rec = setTimeout(record, 700);
    }

    function setDevice(d) {
      state.device = d;
      deskBtn.setAttribute('aria-pressed', d === 'desktop' ? 'true' : 'false');
      phoneBtn.setAttribute('aria-pressed', d === 'phone' ? 'true' : 'false');
      deskBtn.classList.toggle('is-on', d === 'desktop');
      phoneBtn.classList.toggle('is-on', d === 'phone');
      fit();
      setTimeout(function () { fit(); placeSel(); }, 30);
    }

    /* ---------------- the menu ---------------- */
    function toggleMenu() {
      var open = menu.hidden;
      menu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function closeMenu() { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }
    function onDocClick(e) { if (!menu.hidden && !menu.contains(e.target)) closeMenu(); }
    document.addEventListener('click', onDocClick);

    /* ---------------- Preview & test ---------------- */
    function openPreview(which) {
      if (dialog) return;
      flush();
      var back = document.activeElement;
      var dlg = h('dialog', { class: 'mr-studio__modal', 'aria-labelledby': 'mrs-modal-title' });
      var body = h('div', { class: 'mr-studio__modalbody' });
      var modalNotes = h('div', { class: 'mr-studio__modalnotes' });
      var tabs = {};
      var tablist = h('div', { class: 'mr-studio__tabs', role: 'tablist', 'aria-label': 'Preview and test' });
      [['preview', 'Preview'], ['test', 'Send a test'], ['share', 'Share a link']].forEach(function (t) {
        var b = h('button', { type: 'button', role: 'tab', class: 'mr-studio__tab', onclick: function () { show(t[0]); } }, t[1]);
        tabs[t[0]] = b;
        tablist.appendChild(b);
      });
      function show(key) {
        Object.keys(tabs).forEach(function (k) {
          tabs[k].setAttribute('aria-selected', k === key ? 'true' : 'false');
          tabs[k].classList.toggle('is-on', k === key);
        });
        body.textContent = '';
        if (key === 'preview') {
          var box = h('div', { class: 'mr-preview', id: 'mr-preview' });
          body.appendChild(box);
          MR.preview(box, function () { return campaign; }, function () { return account(); }, function () { return brandNow(); }, o.getSender || null);
        } else if (key === 'test') {
          var remembered = '';
          try { remembered = localStorage.getItem('mr-test-addresses') || ''; } catch (e) { /* storage may be blocked */ }
          var toBox = h('input', { type: 'text', id: 'mrs-test-to', class: 'dr-input', autocomplete: 'email', spellcheck: 'false', value: remembered, placeholder: 'name@example.com, other@example.com' });
          var toErr = h('p', { class: 'mr-studio__testerr', role: 'alert', hidden: true });
          var sendBtn = h('button', { type: 'button', class: 'mr-studio__btn', text: 'Send to these addresses' });
          // The usual case, in one click: the address you signed up with, and
          // anyone else on your account.
          var meBtn = h('button', { type: 'button', class: 'mr-studio__btn mr-studio__btn--dark', id: 'mrs-test-me', text: 'Send a test to me',
            onclick: function () { o.testSend([]); } });
          function sendTest() {
            var list = toBox.value.split(/[\s,;]+/).filter(Boolean);
            var seen = {};
            list = list.filter(function (a) { var k = a.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
            var bad = list.filter(function (a) { return !/^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[a-z]{2,}$/i.test(a); });
            toErr.hidden = true;
            toBox.removeAttribute('aria-invalid');
            if (bad.length || list.length > 5) {
              toErr.textContent = bad.length
                ? 'This does not look like an email address: ' + bad[0] + '. Check it and try again.'
                : 'A test can go to five addresses at most.';
              toErr.hidden = false;
              toBox.setAttribute('aria-invalid', 'true');
              toBox.focus();
              return;
            }
            try { localStorage.setItem('mr-test-addresses', list.join(', ')); } catch (e) { /* not essential */ }
            o.testSend(list);
          }
          sendBtn.addEventListener('click', sendTest);
          toBox.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sendTest(); } });
          body.appendChild(h('p', { text: 'Open the test on a phone as well as a laptop, and try it with images turned off. The subject starts with [TEST].' }));
          body.appendChild(meBtn);
          body.appendChild(h('div', { class: 'dr-form-group' },
            h('label', { class: 'dr-label', for: 'mrs-test-to', text: 'Send the test to' }),
            h('span', { class: 'dr-hint', text: 'Or send it to other addresses: up to five, separated by commas. Leave it empty to send to everyone on your account.' }),
            toBox, toErr));
          body.appendChild(sendBtn);
        } else {
          body.appendChild(h('p', { text: 'Make a link anyone can open to read this draft, without an account. Useful for sign-off. You can stop sharing at any time.' }));
          body.appendChild(h('button', { type: 'button', class: 'mr-studio__btn mr-studio__btn--dark', text: 'Make a preview link', onclick: function () { o.shareLink(); } }));
        }
      }
      var closeBtn = h('button', { type: 'button', class: 'mr-studio__iconbtn', 'aria-label': 'Close', onclick: function () { dlg.close(); } }, icon('close'));
      dlg.appendChild(h('div', { class: 'mr-studio__modalhead' }, h('h2', { id: 'mrs-modal-title', class: 'mr-studio__h2', text: 'Preview & test' }), closeBtn));
      dlg.appendChild(tablist);
      dlg.appendChild(modalNotes);
      dlg.appendChild(body);
      dlg.addEventListener('close', function () { dlg.remove(); dialog = null; if (back && back.focus) back.focus(); });
      document.body.appendChild(dlg);
      dialog = { el: dlg, notes: modalNotes };
      dlg.showModal();
      show(which || 'preview');
    }

    /* ---------------- keyboard ---------------- */
    function onKey(e) {
      var tag = (e.target && e.target.tagName) || '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
      var mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      else if (mod && ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')) { e.preventDefault(); redo(); }
      else if (e.key === 'Escape' && state.sel !== null && !dialog) select(null);
    }
    document.addEventListener('keydown', onKey);

    function onResize() { fit(); placeSel(); }
    window.addEventListener('resize', onResize);

    frame.addEventListener('load', function () {
      var d = frame.contentDocument;
      // A new frame fires a load for its empty starting page before the email
      // arrives. Only the email counts.
      if (!d || !d.body || d.location.href === 'about:blank') return;
      if (!ready) {
        ready = true;
        wireFrame();
        frame.contentDocument.body.setAttribute('style', (frame.contentDocument.body.getAttribute('style') || '') + ';cursor:default');
      }
      afterPaint();
    });

    /* ---------------- go ---------------- */
    buildContent();
    buildStyle();
    buildSend();
    updateTitle();
    updateUndo();
    updateStatus();
    renderRail();
    renderPanels();
    setDevice('desktop');
    document.documentElement.classList.add('mr-studio-on');
    frame.srcdoc = html();                 // set before the frame is in the page, so the empty page never loads
    document.body.appendChild(root);
    record();
    state.dirty = false;
    updateStatus();

    return {
      notes: function () { return dialog ? dialog.notes : notes; },
      openSend: function () { state.sel = null; state.rail = 'send'; renderRail(); renderPanels(); placeSel(); },
      select: function (path) { select(path); },
      touch: function () { updateTitle(); markDirty(); },
      repaint: function () { paint(); },
      sendPanelShown: function () { return state.rail === 'send'; },
      markSaved: function () { state.dirty = false; state.savedAt = new Date(); updateStatus(); },
      destroy: function () {
        window.removeEventListener('beforeunload', guard);
        clearTimeout(autosaveTimer);
        document.removeEventListener('visibilitychange', onHide);
        window.removeEventListener('online', onOnline);
        window.removeEventListener('resize', onResize);
        if (window.visualViewport) window.visualViewport.removeEventListener('resize', onKeyboard);
        if (narrowQuery) {
          if (narrowQuery.removeEventListener) narrowQuery.removeEventListener('change', onNarrowChange);
          else if (narrowQuery.removeListener) narrowQuery.removeListener(onNarrowChange);
        }
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('dragend', endDrag);
        if (dialog) dialog.el.close();
        root.remove();
        document.documentElement.classList.remove('mr-studio-on');
      }
    };
  }

  MR.studio = { mount: mount };
})();
