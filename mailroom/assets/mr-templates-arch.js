/* ==========================================================================
   Layout builders for the extra starter layouts (mr-templates-x1.js onwards)
   Loaded after mr-templates-more.js. It adds six groups, more colour sets and
   a small set of builders. Each builder turns a few lines of wording into the
   same ordinary blocks a member could have built by hand, so every layout can
   still be changed, moved or deleted like any other.

   MR.tplX.add(id, name, group, summary, palette, over, builder, wording)

   builder is one of the functions in MR.tplX.B; wording is the object it takes.
   A line in `wording.note` is neutral (for example "Reply to this email at any
   time") and may stay in a sent email. Everything else is example wording that
   has to be replaced before sending, as for every other layout.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};
  var K = MR.tplKit;
  if (!K || !MR.TEMPLATES || !MR.TEMPLATE_GROUPS) return;
  var heading = K.heading, text = K.text, button = K.button, divider = K.divider, spacer = K.spacer,
      panel = K.panel, bullets = K.bullets, story = K.story, social = K.social, pic = K.pic,
      sidePic = K.sidePic, productWith = K.productWith;

  /* ---- six more groups, after the first eight ---- */
  [
    { name: 'Product showcase', about: 'Show a product, a collection or how to use it' },
    { name: 'Customer stories', about: 'Share a review, a result or a case study' },
    { name: 'Questions and polls', about: 'Ask a question, run a poll or set a quiz' },
    { name: 'Learning and courses', about: 'Teach something, launch a course or share a guide' },
    { name: 'Seasonal and holidays', about: 'Mark a holiday, a season or a national day' },
    { name: 'Trade and business', about: 'News, calls and updates for partners and buyers' }
  ].forEach(function (g) {
    if (!MR.TEMPLATE_GROUPS.some(function (x) { return x.name === g.name; })) MR.TEMPLATE_GROUPS.push(g);
  });
  var G = {};
  MR.TEMPLATE_GROUPS.forEach(function (g) { G[g.name] = g.name; });

  /* ---- colour sets: a page colour, an ink, a button and three tints. Every
     pair that carries text is at least 4.5 to 1 (checked by the build tests). ---- */
  var PAL = {
    sage:  { page: '#e9efe6', ink: '#17301f', btn: '#1f5d3a', dark: '#173f2a', darkLink: '#b7e4c7', light: '#eaf3ec' },
    sand:  { page: '#f3ebdd', ink: '#2e2012', btn: '#8a4b14', dark: '#3b2410', darkLink: '#f0d3a8', light: '#f8f1e4' },
    ocean: { page: '#e6eef7', ink: '#0f2740', btn: '#124f8c', dark: '#0f2740', darkLink: '#bcd9f5', light: '#edf3fa' },
    plum:  { page: '#efe4ee', ink: '#3a1237', btn: '#6b1f63', dark: '#3a1237', darkLink: '#ecc8e7', light: '#f6eef6' },
    clay:  { page: '#f6e6df', ink: '#4a1d0f', btn: '#a8431f', dark: '#4a1d0f', darkLink: '#f5c5b0', light: '#fbefe9' },
    gold:  { page: '#f7f0d8', ink: '#2b2410', btn: '#7a5a00', dark: '#2b2410', darkLink: '#f0d27a', light: '#fbf6e3' },
    rose:  { page: '#f9e6ea', ink: '#4a1020', btn: '#a3153f', dark: '#4a1020', darkLink: '#f7b8c7', light: '#fdf0f3' },
    slate: { page: '#eceff1', ink: '#1c2a33', btn: '#263c4a', dark: '#1c2a33', darkLink: '#d8c58a', light: '#f3f5f6' },
    teal:  { page: '#def0ee', ink: '#0d3b3a', btn: '#0f6b66', dark: '#0d3b3a', darkLink: '#a8e0db', light: '#e9f6f4' },
    sun:   { page: '#fff3c4', ink: '#1a1208', btn: '#1a1208', dark: '#1a1208', darkLink: '#f2a900', light: '#fff8de' },
    coral: { page: '#ffe3d9', ink: '#1a1208', btn: '#c2410c', dark: '#1a1208', darkLink: '#ffb089', light: '#fff0ea' },
    night: { page: '#1c2030', ink: '#1c2030', btn: '#2b3a8c', dark: '#1c2030', darkLink: '#f2c14e', light: '#eef0f8' },
    sunset:    { page: '#fff0e6', ink: '#3d1204', btn: '#b43c0a', dark: '#7c1d3a', darkLink: '#ffd3b0', light: '#ffe4d1' },
    jade:      { page: '#e4f7ef', ink: '#06352a', btn: '#0b7a5c', dark: '#064e3b', darkLink: '#a7f3d0', light: '#d1f5e5' },
    cobalt:    { page: '#e8efff', ink: '#0b1f5c', btn: '#1d4ed8', dark: '#172554', darkLink: '#bfdbfe', light: '#dbe7ff' },
    berry:     { page: '#fde8f3', ink: '#4a0d34', btn: '#be185d', dark: '#500724', darkLink: '#fbcfe8', light: '#fbd5ea' },
    lime:      { page: '#f1f9d9', ink: '#1f2a05', btn: '#3f6212', dark: '#1a2e05', darkLink: '#d9f99d', light: '#e6f5b8' },
    marigold:  { page: '#fff6cc', ink: '#2b1d00', btn: '#92400e', dark: '#422006', darkLink: '#fde68a', light: '#fdeea0' },
    violet:    { page: '#f0e9ff', ink: '#26064a', btn: '#6d28d9', dark: '#2e1065', darkLink: '#ddd6fe', light: '#e4d9ff' },
    scarlet:   { page: '#ffe9e7', ink: '#450a0a', btn: '#b91c1c', dark: '#7f1d1d', darkLink: '#fecaca', light: '#ffd6d1' },
    turquoise: { page: '#dffaf8', ink: '#053b3f', btn: '#0b6a85', dark: '#083344', darkLink: '#a5f3fc', light: '#c8f2f0' }
  };
  function look(p, o) {
    var c = PAL[p];
    return Object.assign({ _band: c.page, page: c.page, body: '#ffffff', p_font: 'sans', t_font: 'serif', p_size: 16, line: 'relaxed',
      t_size: 30, t_colour: c.ink, btn_bg: c.btn, btn_text: '#ffffff', btn_radius: 4, btn_border: 0, link_colour: c.btn, pad: 32 }, o || {});
  }
  function dark(p, blocks) { var c = PAL[p]; return panel('dark', blocks, { bg: c.dark, ink: '#ffffff', link: c.darkLink }); }
  function soft(p, blocks) { var c = PAL[p]; return panel('light', blocks, { bg: c.light, ink: c.ink, link: c.btn }); }
  function lines(a) { return (a || []).join('\n'); }

  /* ---- builders. Each returns the blocks of one layout. ---- */
  var B = {};

  // Photo, a kicker, a centred title, a paragraph, an optional list, a button.
  B.centre = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, 'center'));
    b.push(heading(o.title, 'center'));
    if (o.body) b.push(text(o.body, 'center'));
    if (o.list) b.push(soft(p, [].concat(o.listTitle ? [heading(o.listTitle, 'left', 'small')] : [], [bullets(lines(o.list))])));
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(spacer('medium')); b.push(divider()); b.push(text(o.note, 'center')); }
    return b;
  };

  // The same, left aligned, for a calmer, more editorial feel.
  B.left = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, 'left'));
    b.push(heading(o.title, 'left'));
    if (o.body) b.push(text(o.body, 'left'));
    if (o.body2) b.push(text(o.body2, 'left'));
    if (o.list) b.push(soft(p, [].concat(o.listTitle ? [heading(o.listTitle, 'left', 'small')] : [], [bullets(lines(o.list))])));
    if (o.btn) { b.push(spacer('small')); b.push(button('left', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'left')); }
    return b;
  };

  // A dark panel carries the message; a short note sits underneath.
  B.dark = function (o, p) {
    var inner = [spacer('small')];
    if (o.kicker) inner.push(text(o.kicker, 'center'));
    inner.push(heading(o.title, 'center'));
    if (o.body) inner.push(text(o.body, 'center'));
    if (o.btn) inner.push(button('center', true, o.btn));
    inner.push(spacer('small'));
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    b.push(dark(p, inner));
    if (o.list) b.push(soft(p, [].concat(o.listTitle ? [heading(o.listTitle, 'left', 'small')] : [], [bullets(lines(o.list))])));
    if (o.note) { b.push(spacer('medium')); b.push(text(o.note, 'center')); }
    return b;
  };

  // A title, a picture beside a short passage, a list and a button.
  B.side = function (o, p) {
    var b = [heading(o.title, 'left')];
    if (o.body) b.push(text(o.body, 'left'));
    b.push(sidePic(o.pic, o.side || 'right', o.sideText));
    if (o.list) b.push(soft(p, [].concat(o.listTitle ? [heading(o.listTitle, 'left', 'small')] : [], [bullets(lines(o.list))])));
    if (o.btn) { b.push(spacer('small')); b.push(button('left', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'left')); }
    return b;
  };

  // Key facts in a tinted panel (when, where, cost), then what to expect.
  B.facts = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, o.align || 'left'));
    b.push(heading(o.title, o.align || 'left'));
    if (o.body) b.push(text(o.body, o.align || 'left'));
    b.push(soft(p, [bullets(lines(o.facts))]));
    if (o.more) {
      b.push(spacer('small'));
      b.push(heading(o.moreTitle || 'What to expect', 'left', 'small'));
      b.push(bullets(lines(o.more)));
    }
    if (o.btn) { b.push(spacer('small')); b.push(button(o.align === 'center' ? 'center' : 'left', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, o.align || 'left')); }
    return b;
  };

  // Numbered steps in a tinted panel.
  B.steps = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    b.push(heading(o.title, o.align || 'left'));
    if (o.body) b.push(text(o.body, o.align || 'left'));
    b.push(soft(p, [bullets(o.steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n'))]));
    if (o.btn) { b.push(spacer('small')); b.push(button(o.align === 'center' ? 'center' : 'left', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, o.align || 'left')); }
    return b;
  };

  // A run of short items, each with its own link, like a digest.
  B.digest = function (o, p) {
    var b = [];
    if (o.kicker) b.push(text(o.kicker, 'left'));
    b.push(heading(o.title, 'left'));
    if (o.body) b.push(text(o.body, 'left'));
    if (o.pic) b.push(pic(o.pic));
    b.push(divider());
    o.items.forEach(function (it) { b.push(story(it[0], it[1])); });
    if (o.btn) { b.push(spacer('small')); b.push(button('left', false, o.btn)); }
    b.push(spacer('medium')); b.push(divider()); b.push(social());
    return b;
  };

  // One quotation, large, with who said it, then a short passage.
  B.quote = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    b.push(soft(p, [text('“' + o.quote + '”', 'center'), text(o.who, 'center')]));
    b.push(heading(o.title, 'left'));
    if (o.body) b.push(text(o.body, 'left'));
    if (o.list) b.push(bullets(lines(o.list)));
    if (o.btn) { b.push(spacer('small')); b.push(button('left', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'left')); }
    return b;
  };

  // Up to three products, each as its own block with a picture, a price and a link.
  B.products = function (o, p) {
    var b = [];
    if (o.kicker) b.push(text(o.kicker, 'center'));
    b.push(heading(o.title, 'center'));
    if (o.body) b.push(text(o.body, 'center'));
    o.items.forEach(function (it) { b.push(productWith(it[0], it[1], it[2], it[3], it[4])); });
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'center')); }
    return b;
  };

  // Two columns of short text, such as before and after, or two figures.
  B.pair = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, o.align || 'center'));
    b.push(heading(o.title, o.align || 'center'));
    if (o.body) b.push(text(o.body, o.align || 'center'));
    b.push({ type: 'columns', left: o.left, right: o.right });
    if (o.list) b.push(soft(p, [].concat(o.listTitle ? [heading(o.listTitle, 'left', 'small')] : [], [bullets(lines(o.list))])));
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'center')); }
    return b;
  };

  // A code or a deadline shown large in a panel.
  B.code = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, 'center'));
    b.push(heading(o.title, 'center'));
    if (o.body) b.push(text(o.body, 'center'));
    b.push(dark(p, [spacer('small'), text(o.codeLabel, 'center'), heading(o.code, 'center'), text(o.terms, 'center'), spacer('small')]));
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(spacer('medium')); b.push(text(o.note, 'center')); }
    return b;
  };

  // Plain letter: no picture, a few paragraphs and a sign-off.
  B.letter = function (o, p) {
    var b = [heading(o.title, 'left')];
    o.paras.forEach(function (t) { b.push(text(t, 'left')); });
    if (o.list) b.push(bullets(lines(o.list)));
    if (o.btn) { b.push(spacer('small')); b.push(button('left', false, o.btn)); }
    b.push(spacer('small'));
    b.push(text(o.sign || 'With thanks,\nAlex Morgan', 'left'));
    return b;
  };

  // A timetable: times down the side of a tinted panel, then speakers or hosts.
  B.agenda = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, 'left'));
    b.push(heading(o.title, 'left'));
    if (o.body) b.push(text(o.body, 'left'));
    b.push(soft(p, [heading(o.when, 'left', 'small'), bullets(lines(o.slots))]));
    if (o.people) { b.push(spacer('small')); b.push(heading(o.peopleTitle || 'Who is speaking', 'left', 'small')); b.push(bullets(lines(o.people))); }
    if (o.btn) { b.push(spacer('small')); b.push(button('left', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'left')); }
    return b;
  };

  // A question and answer buttons, one for each answer.
  B.poll = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, 'center'));
    b.push(heading(o.title, 'center'));
    if (o.body) b.push(text(o.body, 'center'));
    o.answers.forEach(function (a) { b.push(button('center', false, a)); });
    b.push(spacer('small'));
    if (o.note) b.push(text(o.note, 'center'));
    return b;
  };

  // Questions with short answers.
  B.faq = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    b.push(heading(o.title, 'left'));
    if (o.body) b.push(text(o.body, 'left'));
    o.qa.forEach(function (qa) { b.push(heading(qa[0], 'left', 'small')); b.push(text(qa[1], 'left')); });
    if (o.btn) { b.push(spacer('small')); b.push(button('left', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'left')); }
    return b;
  };

  // A short set of figures in a tinted panel, then what they mean.
  B.figures = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, 'center'));
    b.push(heading(o.title, 'center'));
    if (o.body) b.push(text(o.body, 'center'));
    b.push({ type: 'columns', left: o.figs[0], right: o.figs[1] });
    if (o.figs[2]) b.push({ type: 'columns', left: o.figs[2], right: o.figs[3] || ' ' });
    if (o.after) b.push(text(o.after, 'left'));
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'center')); }
    return b;
  };

  var X = { B: B, PAL: PAL, look: look, dark: dark, soft: soft, G: G, count: 0, ids: [] };

  X.add = function (id, name, group, summary, pal, over, builder, wording) {
    if (!B[builder]) throw new Error('No builder called ' + builder + ' for ' + id);
    if (!PAL[pal]) throw new Error('No palette called ' + pal + ' for ' + id);
    var keep = wording.keep === false ? [] : (wording.keep || (wording.note ? [wording.note] : []));
    MR.TEMPLATES.push({ id: id, name: name, category: group, summary: summary, style: look(pal, over),
      keep: keep, blocks: B[builder](wording, pal) });
    X.count += 1;
    X.ids.push(id);
  };
  MR.tplX = X;
})();
