/* ==========================================================================
   Starter layouts
   A campaign begins from one of these rather than an empty page. They are
   ordinary blocks, so everything can be changed or thrown away afterwards.
   The words are prompts, not filler to be sent as they are.

   Each layout also carries a look of its own (page and body colour, type,
   button shape), set in the same style fields a member can change on the
   Style panel. Pictures are left empty on purpose: the sending checks ask for
   a real picture and a description before anything goes out.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};

  function heading(text, align, level) { return { type: 'heading', text: text, level: level || 'large', align: align || 'left' }; }
  function text(t, align) { return { type: 'text', text: t, align: align || 'left' }; }
  function image() { return { type: 'image', url: '', alt: '', align: 'left' }; }
  // The colours of the sections. Buttons are charcoal with white text, or
  // white with dark text on a dark panel; panels are deep green or a pale
  // green-grey; links are green, or pale green on the dark panel. All of them
  // are set on the blocks, so each can be changed from its own settings.
  var C = {
    darkBg: '#1b4332', darkInk: '#ffffff', darkLink: '#b7e4c7',
    lightBg: '#eef5f0', lightInk: '#1a1208', lightLink: '#1e6b3c',
    btn: '#222222', btnInk: '#ffffff', btnOnDark: '#ffffff', btnInkOnDark: '#1a1208'
  };
  // Off a dark panel the button takes the colours of the layout's own look
  // (Style panel). On a dark panel it is white so it stays visible.
  function button(align, onDark, label) {
    var b = { type: 'button', label: label || 'Read more', url: '', align: align || 'center' };
    if (onDark) { b.colour = C.btnOnDark; b.text_colour = C.btnInkOnDark; }
    return b;
  }
  function product() {
    return { type: 'product', url: '', alt: '', name: 'Product name', price: '00.00', description: 'A short description of the product.',
      label: 'Buy now', link: '', align: 'left' };
  }
  function logo(align) { return { type: 'logo', url: '', alt: '', width: 160, link: '', align: align || 'center' }; }
  function divider() { return { type: 'divider' }; }
  function spacer(size) { return { type: 'spacer', size: size || 'medium' }; }
  // tint overrides the panel colours, so a layout with its own look is not
  // forced into the default green.
  function panel(kind, blocks, tint) {
    var p = kind === 'dark'
      ? { type: 'panel', background: C.darkBg, text_colour: C.darkInk, link_colour: C.darkLink, blocks: blocks }
      : { type: 'panel', background: C.lightBg, text_colour: C.lightInk, link_colour: C.lightLink, blocks: blocks };
    if (tint) { p.background = tint.bg; p.text_colour = tint.ink; p.link_colour = tint.link; }
    return p;
  }
  var T = {
    black: { bg: '#111111', ink: '#ffffff', link: '#ffffff' },
    warmLight: { bg: '#fbf3ea', ink: '#3b1d0e', link: '#9a3412' },
    paperLight: { bg: '#f4efe6', ink: '#1a1208', link: '#1e6b3c' },
    greyLight: { bg: '#f1f1ef', ink: '#1a1208', link: '#1e6b3c' }
  };
  var TITLE = 'Some title here';
  var SENTENCE = 'A sentence or two about this. Say what it is and why it matters to the reader.';


  function story(t, d, rule) { return { type: 'story', text: t, detail: d, url: '', align: 'left', rule: rule !== false }; }
  function bullets(t, align) { return { type: 'list', text: t, align: align || 'left' }; }
  function social() { return { type: 'social', style: 'text', align: 'center', links: [{ label: 'LinkedIn', url: '' }, { label: 'Website', url: '' }] }; }

  // The looks. Colours are chosen so text on each background passes 4.5:1.
  var LOOK = {
    paper:  { _band: '#f4efe6', page: '#f4efe6', body: '#ffffff', p_font: 'sans', t_font: 'serif', p_size: 16, line: 'relaxed', t_size: 30, t_colour: '#1a1208', btn_bg: '#1a1208', btn_text: '#ffffff', btn_radius: 2, btn_border: 0, link_colour: '#1e6b3c', pad: 32 },
    forest: { _band: '#e8efe9', page: '#e8efe9', body: '#ffffff', p_font: 'sans', t_font: 'sans',  p_size: 16, line: 'relaxed', t_size: 28, t_colour: '#14301f', btn_bg: '#1b4332', btn_text: '#ffffff', btn_radius: 4, btn_border: 0, link_colour: '#1e6b3c', pad: 32 },
    ink:    { _band: '#f1f1ef', page: '#111111', body: '#ffffff', p_font: 'sans', t_font: 'sans',  p_size: 16, line: 'relaxed', t_size: 32, t_colour: '#111111', btn_bg: '#111111', btn_text: '#ffffff', btn_radius: 0, btn_border: 0, link_colour: '#0b5cad', pad: 36 },
    clean:  { _band: '#f6f6f4', page: '#f6f6f4', body: '#ffffff', p_font: 'sans', t_font: 'sans',  p_size: 16, line: 'normal',  t_size: 26, t_colour: '#1a1208', btn_bg: '#222222', btn_text: '#ffffff', btn_radius: 24, btn_border: 0, link_colour: '#1e6b3c', pad: 28 },
    warm:   { _band: '#fbf3ea', page: '#fbf3ea', body: '#ffffff', p_font: 'sans', t_font: 'serif', p_size: 17, line: 'relaxed', t_size: 32, t_colour: '#3b1d0e', btn_bg: '#9a3412', btn_text: '#ffffff', btn_radius: 30, btn_border: 0, link_colour: '#9a3412', pad: 36 },
    plain:  { _band: '', page: '#ffffff', body: '#ffffff', p_font: 'serif', t_font: 'serif', p_size: 17, line: 'relaxed', t_size: 24, t_colour: '#1a1208', btn_bg: '#1a1208', btn_text: '#ffffff', btn_radius: 0, btn_border: 0, link_colour: '#1e6b3c', pad: 40, width: 560 }
  };
  function look(k, extra) { return Object.assign({}, LOOK[k], extra || {}); }

  /* Pictures that come with the layouts. They are drawings made for the
     Mailroom, kept in assets/templates on this site, and marked as
     decoration so no description is needed. A member can replace any of them.
     An email needs a full web address, so the name is turned into one when
     the layout is used. */
  var IMAGE_BASE = 'https://ami.abta.africa/mailroom/assets/templates/';
  function pic(name) { return { type: 'image', url: 'tpl:' + name + '.png', alt: '', decorative: true }; }
  function sidePic(name, side, t) { return { type: 'imagetext', url: 'tpl:' + name + '.png', alt: '', decorative: true, side: side, text: t }; }
  function productWith(name, label, price, desc, alt) {
    var p = product(); p.url = 'tpl:' + name + '.png'; p.alt = alt; p.name = label; p.price = price; p.description = desc; p.link = ''; return p;
  }

  /* Every layout is finished writing, not prompts, so it reads as a real email
     the moment it is chosen. The facts in it (dates, places, prices) are
     invented. Sending is held back until the member has replaced them: see
     MR.sampleTextLeft. Lines listed in `keep` are neutral and may stay. */
  /* What a sender is trying to do. The picker groups layouts by these, in this
     order, and the first word of each description says what the group is for. */
  MR.TEMPLATE_GROUPS = [
    { name: 'Newsletters', about: 'Regular updates to your list' },
    { name: 'Announcements', about: 'Say that something is new or has changed' },
    { name: 'Events', about: 'Invite, remind and follow up' },
    { name: 'Sales and offers', about: 'Sell a product, a service or a place' },
    { name: 'Welcome', about: 'Greet new subscribers and members' },
    { name: 'Thank you', about: 'Thank customers, donors and volunteers' },
    { name: 'Fundraising and membership', about: 'Appeals, joining and renewals' },
    { name: 'Feedback and updates', about: 'Ask for a review, a reply or fresh details' }
  ];

  MR.TEMPLATES = [
    { id: 'blank', name: 'Blank', summary: 'Start with one empty paragraph.',
      blocks: [{ type: 'text', text: '' }] },

    { id: 'newsletter', name: 'Newsletter', category: 'Newsletters',
      summary: 'A lead story with a picture, two shorter items side by side, and a link to more.',
      style: look('paper'),
      keep: ['Thank you for reading. If there is something you would like us to cover, reply to this email.'],
      blocks: [
        text('Spring update  |  Issue 12', 'center'),
        heading('What we learned from our first full year', 'center'),
        text('Twelve months ago we set out to make it easier for small teams to share what they know. This issue looks at what worked, what did not, and what we are changing next.', 'center'),
        pic('newsletter-hero'),
        button('center', false, 'Read the full story'),
        spacer('medium'), divider(), spacer('small'),
        heading('Also this month', 'left', 'small'),
        { type: 'columns', left: 'New opening hours\nFrom 1 April the office opens at 8:30 and closes at 5:30, Monday to Friday.', right: 'Volunteer evening\nJoin us on the first Thursday of the month for supper and a short talk.' },
        spacer('medium'),
        text('Thank you for reading. If there is something you would like us to cover, reply to this email.', 'left'),
        divider(), social()
      ] },

    { id: 'feature', name: 'Feature story', category: 'Newsletters',
      summary: 'One story told at length: a large picture, a short introduction, a pull quote and a button.',
      style: look('clean', { t_font: 'serif', t_size: 30 }),
      keep: ['Thank you for reading.'],
      blocks: [
        text('Case study  |  5 minute read', 'left'),
        heading('How one small bakery halved its food waste', 'left'),
        text('By your name, your role', 'left'),
        pic('story-hero'),
        text('When the bakery on Mill Lane started counting what it threw away, the total was higher than anyone expected. Six months later the figure had halved. This is how it was done.', 'left'),
        panel('light', [heading('“We stopped guessing and started writing it down.”', 'left', 'small'), text('Sam Okafor, owner', 'left')], T.greyLight),
        spacer('small'),
        heading('What changed', 'left', 'small'),
        bullets('Baking to the previous week’s sales, not to habit\nSelling day-old bread at half price after 4 pm\nPassing unsold loaves to a local food bank on Fridays'),
        spacer('small'),
        button('left', false, 'Read the full story'),
        spacer('medium'), divider(),
        text('Thank you for reading.', 'left')
      ] },

    { id: 'announcement', name: 'Announcement', category: 'Announcements',
      summary: 'One thing to say, said once, on a dark panel with a single action.',
      style: look('ink'),
      keep: ['Questions? Reply to this email and a member of the team will help.'],
      blocks: [
        panel('dark', [
          spacer('small'),
          text('ANNOUNCEMENT', 'center'),
          heading('We are moving to a new address', 'center'),
          text('From Monday 4 May our team will work from 12 Mill Street. Phone numbers and email addresses stay the same, and deliveries will be accepted from 8:00.', 'center'),
          button('center', true, 'See the new location'),
          spacer('small')
        ], T.black),
        spacer('medium'),
        text('Questions? Reply to this email and a member of the team will help.', 'center')
      ] },

    { id: 'event', name: 'Event invitation', category: 'Events',
      summary: 'The details first, the argument second, one way to register.',
      style: look('forest'),
      keep: ['Cannot make it? Reply and we will send you the notes.'],
      blocks: [
        pic('event-hero'),
        heading('Open evening: meet the team', 'left'),
        panel('light', [bullets('Thursday 14 May, 18:30 to 20:30\nThe Old Library, 5 Church Street\nOpen to everyone\nFree, with refreshments')]),
        spacer('small'),
        sidePic('event-side', 'left', 'What to expect\nA short talk at 19:00, then time to talk with the people behind the work. Step-free access and a quiet room are available.'),
        button('left', false, 'Reserve a place'),
        spacer('medium'), divider(),
        text('Cannot make it? Reply and we will send you the notes.', 'left')
      ] },

    { id: 'update', name: 'Product or service update', category: 'Announcements',
      summary: 'What changed, what it means, where to read the detail.',
      style: look('clean'),
      keep: [],
      blocks: [
        heading('Changes to our delivery times', 'left'),
        text('From 1 June we will deliver on Tuesdays and Fridays instead of Mondays and Thursdays. Orders placed before 14:00 are dispatched the same day.', 'left'),
        panel('light', [heading('In short', 'left', 'small'), bullets('Deliveries on Tuesday and Friday\nOrder by 14:00 for same-day dispatch\nNo change to prices')], T.greyLight),
        spacer('small'),
        text('You do not need to do anything. If you have a regular order, we have moved it for you.', 'left'),
        button('left', false, 'See the full schedule')
      ] },

    { id: 'digest', name: 'Links digest', category: 'Newsletters',
      summary: 'Several short items, each with its own link.',
      style: look('clean', { t_font: 'sans', btn_radius: 4 }),
      keep: [],
      blocks: [
        heading('Worth reading this week', 'left'),
        text('Four pieces we found useful, with a line on why.', 'left'),
        divider(),
        story('How small teams run better meetings', 'A practical checklist you can use on Monday morning.'),
        story('A short guide to accessible email', 'Colour, contrast and picture descriptions, in plain words.'),
        story('What the new data rules mean for charities', 'Which parts apply to you, and which you can ignore.'),
        story('Writing a thank-you that gets a reply', 'Three examples, and what they have in common.'),
        spacer('small'), social()
      ] },

    { id: 'letter', name: 'Plain letter', category: 'Newsletters',
      summary: 'No images, no buttons. Often the one that gets read.',
      style: look('plain'),
      keep: [],
      blocks: [
        text('Dear friend,', 'left'),
        text('I wanted to write to you personally to say thank you for your support this year. Because of you we opened two new sites and welcomed 140 new members.', 'left'),
        text('Next year we plan to open on Saturdays and to start a small grants fund. If you would like to talk about any of it, reply to this email and I will answer myself.', 'left'),
        text('With best wishes,\nAlex Morgan\nDirector', 'left')
      ] },

    { id: 'welcome', name: 'Welcome', category: 'Welcome',
      summary: 'Thanks the new reader, says what to expect, and gives three first steps.',
      style: look('warm'),
      keep: ['Welcome. We are glad you are here.', 'Thanks for joining. Once a month we send one short email about what we are working on and how you can get involved.',
        'Three places to start', '1. Read our story\nHow we began and what we care about.', '2. Meet the team\nThe people who answer your emails.',
        '3. Choose your interests\nTell us what you want to hear about and we will send only that.', 'Reply to this email at any time. A person reads it.'],
      blocks: [
        pic('welcome-hero'),
        heading('Welcome. We are glad you are here.', 'center'),
        text('Thanks for joining. Once a month we send one short email about what we are working on and how you can get involved.', 'center'),
        button('center', false, 'Start here'),
        spacer('medium'),
        heading('Three places to start', 'center', 'small'),
        { type: 'columns', left: '1. Read our story\nHow we began and what we care about.', right: '2. Meet the team\nThe people who answer your emails.' },
        text('3. Choose your interests\nTell us what you want to hear about and we will send only that.', 'center'),
        spacer('small'), divider(),
        text('Reply to this email at any time. A person reads it.', 'center')
      ] },

    { id: 'offer', name: 'Offer or sale', category: 'Sales and offers',
      summary: 'An offer, the code, two products and the date it ends.',
      style: look('ink', { btn_bg: '#b42318', btn_radius: 0, t_size: 36 }),
      keep: [],
      blocks: [
        panel('dark', [
          text('OFFER ENDS SUNDAY 31 MAY', 'center'),
          heading('Spring sale: 20% off everything', 'center'),
          text('Our lightest, longest-lasting pieces, now with a fifth off. No minimum spend.', 'center'),
          button('center', true, 'Shop the sale')
        ], T.black),
        panel('light', [text('Use this code at checkout', 'center'), heading('SPRING20', 'center')], T.greyLight),
        spacer('small'),
        productWith('offer-product-1', 'Linen tote bag', '24.00', 'Hand-finished, with an inside pocket.', 'Linen tote bag'),
        divider(),
        productWith('offer-product-2', 'Canvas apron', '32.00', 'Heavy cotton, with two deep pockets.', 'Canvas apron'),
        spacer('small'),
        text('Offer valid until 23:59 on 31 May. Cannot be combined with other offers.', 'center')
      ] },

    { id: 'launch', name: 'Product launch', category: 'Sales and offers',
      summary: 'A large picture, what it is, what it does, and where to get it.',
      style: look('clean', { t_font: 'sans', t_size: 34, btn_radius: 0 }),
      keep: [],
      blocks: [
        pic('launch-hero'),
        text('NEW', 'center'),
        heading('Meet the Field Notebook', 'center'),
        text('A pocket notebook for people who think on paper. It lies flat, takes ink and is made to last the whole project.', 'center'),
        button('center', false, 'See it in detail'),
        spacer('medium'),
        heading('What it does', 'left', 'small'),
        bullets('Lies flat at any page\nPaper that takes fountain pen ink\nRefillable cover'),
        sidePic('launch-side', 'right', 'How it works\nSlide the pages into the cover, fold and write. When the pages run out, buy a refill, not a new book.'),
        panel('light', [heading('Available from 1 June', 'center', 'small'), button('center', false, 'Order now')], T.greyLight)
      ] },

    { id: 'thanks', name: 'Thank you', category: 'Thank you',
      summary: 'A short, warm thank-you after a purchase, a gift or an event.',
      style: look('warm', { t_size: 34 }),
      keep: ['Thank you'],
      blocks: [
        spacer('small'),
        heading('Thank you', 'center'),
        text('Your gift of £25 last month paid for 50 meals. We could not have done it without you, and we wanted you to know it made a difference.', 'center'),
        pic('thanks-hero'),
        text('You will get your receipt by email within a day. We will write again in June with an update on where the money went.', 'center'),
        button('center', false, 'See what your gift did'),
        spacer('medium'),
        text('With thanks,\nAlex Morgan\nDirector', 'center')
      ] },

    { id: 'survey', name: 'Feedback request', category: 'Feedback and updates',
      summary: 'Asks one thing, says how long it takes, and links to the form.',
      style: look('clean', { btn_radius: 6 }),
      keep: [],
      blocks: [
        heading('Can we ask you something?', 'left'),
        text('We are planning next year’s programme and would like your view. Your answers shape what we do, and we will share what we find.', 'left'),
        panel('light', [text('It takes 2 minutes. There are 5 questions.', 'center'), button('center', false, 'Start the survey')], T.greyLight),
        spacer('small'),
        text('If the button does not work, copy this link into your browser:', 'left'),
        text('Paste your survey link here', 'left'),
        divider(),
        text('Thank you for your time.\nAlex Morgan', 'left')
      ] }
  ];

  // The strip colour at the top goes with the look. Run again after more
  // layouts are added (mr-templates-more.js); it only touches ones not done.
  MR.tplNormalise = function () {
    MR.TEMPLATES.forEach(function (t) {
      if (t.style && '_band' in t.style) { t.header_colour = t.style._band || null; delete t.style._band; }
    });
  };
  MR.tplNormalise();

  // The pieces the extra layouts are built from.
  MR.tplKit = { heading: heading, text: text, button: button, divider: divider, spacer: spacer, panel: panel,
    bullets: bullets, story: story, social: social, pic: pic, sidePic: sidePic, productWith: productWith };

  // The base for the drawings. Tests and previews may point it elsewhere.
  function imageBase() { return (typeof window !== 'undefined' && window.MR_TEMPLATE_IMAGE_BASE) || IMAGE_BASE; }
  function resolveImages(blocks) {
    blocks.forEach(function (b) {
      ['url', 'thumb'].forEach(function (k) {
        if (typeof b[k] === 'string' && b[k].indexOf('tpl:') === 0) {
          // Each drawing has a photograph of the same name in assets/templates/photos.
          // The photograph is used unless MR.templatePhotos has been set to false.
          b[k] = (MR.templatePhotos !== false && /\.png$/.test(b[k]))
            ? MR.templatePhotoUrl(b[k].slice(4).replace(/\.png$/, ''))
            : imageBase() + b[k].slice(4);
        }
      });
      if (b.blocks) resolveImages(b.blocks);
    });
    return blocks;
  }

  // Sections. A block gets a section tag when it comes from a layout or a
  // ready-made section, so the editor can set one font for the whole section.
  // The tag is a label only: the email renderer ignores it, and a block can be
  // moved or given a font of its own without losing it. A ready-made section is
  // one section. A layout is split at each colour panel and each divider: a
  // panel is a section by itself, and the blocks between two of them are one.
  var sectionCount = 0;
  function newSectionTag() {
    sectionCount += 1;
    return 'sec' + Date.now().toString(36) + sectionCount.toString(36) + Math.floor(Math.random() * 1296).toString(36);
  }
  MR.tagSections = function (blocks, whole) {
    var tag = newSectionTag();
    blocks.forEach(function (b, i) {
      if (!b || typeof b !== 'object') return;
      if (!whole) {
        if (b.type === 'divider') { tag = newSectionTag(); return; }
        if (b.type === 'panel') { tag = newSectionTag(); b.section = tag; tag = newSectionTag(); return; }
      }
      b.section = tag;
    });
    return blocks;
  };

  MR.templateBlocks = function (id) {
    var t = MR.TEMPLATES.filter(function (x) { return x.id === id; })[0];
    if (!t) return [{ type: 'text', text: '' }];
    return MR.tagSections(resolveImages(JSON.parse(JSON.stringify(t.blocks))), false);
  };

  /* ---------------- sample text ----------------
     A layout is written out in full, with invented facts. Before anything is
     sent, every line still word for word as it came in the layout is listed,
     so a made-up date or price cannot reach a real list by mistake. The
     layout's own name is kept in the campaign style (style.template). */
  var TEXT_KEYS = ['text', 'detail', 'left', 'right', 'name', 'price', 'description'];
  // Each text field, whole. A field counts as changed as soon as any
  // character of it is.
  function textsOf(blocks, out) {
    blocks.forEach(function (b) {
      TEXT_KEYS.forEach(function (k) {
        if (typeof b[k] === 'string' && b[k].trim().length > 3) out[b[k].trim()] = true;
      });
      if (Array.isArray(b.blocks)) textsOf(b.blocks, out);
    });
    return out;
  }
  MR.sampleTextLeft = function (campaign) {
    var id = campaign && campaign.style && campaign.style.template;
    var t = id && MR.TEMPLATES.filter(function (x) { return x.id === id; })[0];
    if (!t) return [];
    var samples = textsOf(t.blocks, {});
    (t.keep || []).forEach(function (k) { delete samples[k]; });
    var found = [];
    (campaign.body_blocks || []).forEach(function (b, i) {
      var hit = null;
      (function walk(x) {
        TEXT_KEYS.forEach(function (k) {
          if (!hit && typeof x[k] === 'string' && samples[x[k].trim()]) hit = x[k].trim().split('\n')[0];
        });
        if (!hit && Array.isArray(x.blocks)) x.blocks.forEach(walk);
      })(b);
      if (hit) found.push({ path: String(i), text: hit.length > 60 ? hit.slice(0, 57) + '...' : hit, layout: t.name });
    });
    return found;
  };

  /* ---------------- previews ----------------
     A picture of each layout, drawn by the same renderer that makes the real
     email, with stand-in pictures so the design can be judged. The stand-ins
     exist only in this preview and are never part of a campaign. */
  var STAND_IN_URL = 'https://preview.invalid/stand-in.svg';
  function standInSvg(w, h, a, b) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>' +
      '<rect width="100%" height="100%" fill="url(#g)"/></svg>';
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }
  function standIns(blocks, n) {
    var pal = [['#1b4332', '#52b788'], ['#3b1d0e', '#d97706'], ['#14301f', '#95d5b2'], ['#374151', '#9ca3af']];
    blocks.forEach(function (b) {
      if (['image', 'imagetext', 'product', 'video', 'logo'].indexOf(b.type) !== -1 && !(b.url || b.thumb)) {
        var k = '?' + (n.i++);
        if (b.type === 'video') { b.thumb = STAND_IN_URL + k; b.alt = 'Preview'; }
        else { b.url = STAND_IN_URL + k; b.alt = 'Preview'; }
        n.map[STAND_IN_URL + k] = standInSvg(b.type === 'product' ? 400 : 1200, b.type === 'product' ? 400 : 560, pal[n.i % pal.length][0], pal[n.i % pal.length][1]);
      }
      if (b.blocks) standIns(b.blocks, n);
    });
  }
  /* Real photographs. tools/get-template-photos.sh puts one photograph beside
     every drawing, in assets/templates/photos, under the same name. A layout
     uses the photograph. Setting MR.templatePhotos to false brings the
     drawings back (the tests do this). */
  var PHOTO_BASE = 'https://ami.abta.africa/mailroom/assets/templates/photos/';
  MR.templatePhotoUrl = function (name) { return (window.MR_TEMPLATE_PHOTO_BASE || PHOTO_BASE) + name + '.jpg'; };
  MR.templatePhotos = true;

  MR.templatePreviewHtml = function (id, account) {
    if (!MR.renderEmail) return '';
    var t = MR.TEMPLATES.filter(function (x) { return x.id === id; })[0];
    if (!t) return '';
    var blocks = MR.templateBlocks(id);
    var n = { i: 0, map: {} };
    standIns(blocks, n);
    var html = MR.renderEmail({
      subject: t.name, from_name: (account && account.name) || 'Your organisation', body_blocks: blocks,
      style: MR.templateStyle(id) || {}, header_colour: MR.templateHeader(id)
    }, account || { name: 'Your organisation', postal_address: 'Your postal address' }, { noPlaceholders: true });
    Object.keys(n.map).forEach(function (k) { html = html.split(k).join(n.map[k]); });
    return html;
  };

  MR.templateHeader = function (id) {
    var t = MR.TEMPLATES.filter(function (x) { return x.id === id; })[0];
    return (t && t.header_colour) || null;
  };

  // The look that goes with a layout, as a copy nobody else holds.
  MR.templateStyle = function (id) {
    var t = MR.TEMPLATES.filter(function (x) { return x.id === id; })[0];
    return t && t.style ? JSON.parse(JSON.stringify(t.style)) : null;
  };

  /* ---------------- sections ----------------
     Smaller than a layout: one part of an email, made of ordinary blocks,
     dropped in wherever it is needed. Pictures are left empty on purpose, so
     the sending checks ask for a real picture and a description. */
  MR.SECTIONS = [
    {
      id: 'text-images', name: 'Text and images', items: [
        { id: 's-banner', name: 'Banner image, title and button', blocks: [image(), heading(TITLE, 'center'), text(SENTENCE, 'center'), button('center')] },
        { id: 's-image-left', name: 'Image on the left, text on the right', blocks: [
          { type: 'imagetext', url: '', alt: '', side: 'left', text: TITLE + '\n' + SENTENCE }, button('left')] },
        { id: 's-image-right', name: 'Image on the right, text on the left', blocks: [
          { type: 'imagetext', url: '', alt: '', side: 'right', text: TITLE + '\n' + SENTENCE }, button('left')] },
        { id: 's-image-panel', name: 'Image on a dark panel', blocks: [
          panel('dark', [image(), heading(TITLE, 'center'), text(SENTENCE, 'center'), button('center', true)])] },
        { id: 's-two-stories', name: 'Two short items side by side', blocks: [
          { type: 'columns', left: TITLE + '\n' + SENTENCE, right: TITLE + '\n' + SENTENCE }] },
        { id: 's-video', name: 'Title, video and text', blocks: [
          heading(TITLE, 'left'), { type: 'video', url: '', thumb: '', alt: '', label: 'Watch the video', align: 'center' }, text(SENTENCE, 'left')] }
      ]
    },
    {
      id: 'text', name: 'Text', items: [
        { id: 's-byline', name: 'Title with a byline', blocks: [heading(TITLE, 'left'), text('By your name, your role', 'left'), text(SENTENCE, 'left')] },
        { id: 's-title-text', name: 'Title and paragraph', blocks: [heading(TITLE, 'left'), text(SENTENCE, 'left')] },
        { id: 's-columns', name: 'Two columns of text', blocks: [
          { type: 'columns', left: TITLE + '\n' + SENTENCE, right: TITLE + '\n' + SENTENCE }] },
        { id: 's-dark-text', name: 'Text on a dark panel', blocks: [
          panel('dark', [heading(TITLE, 'left'), text(SENTENCE, 'left'), button('left', true)])] },
        { id: 's-code', name: 'Code or offer', blocks: [
          panel('light', [text('Use this code at checkout', 'center'), heading('YOURCODE', 'center')])] },
        { id: 's-steps', name: 'Four steps', blocks: [
          { type: 'columns', left: 'Step 1.\nA sentence about the first step.', right: 'Step 2.\nA sentence about the second step.' },
          { type: 'columns', left: 'Step 3.\nA sentence about the third step.', right: 'Step 4.\nA sentence about the fourth step.' }] },
        { id: 's-numbered', name: 'Numbered points', blocks: [
          text('1. The first point, in a sentence.\n2. The second point.\n3. The third point.\n4. The fourth point.', 'left')] },
        { id: 's-bullets', name: 'Heading and bullet list', blocks: [
          heading('Some heading here', 'left', 'small'), { type: 'list', text: 'The first point\nThe second point\nThe third point', align: 'left' }] },
        { id: 's-quote', name: 'Quotation', blocks: [
          panel('light', [heading('A short quotation goes here.', 'center', 'small'), text('Name, role', 'center')])] },
        { id: 's-announce', name: 'Announcement bar', blocks: [
          panel('dark', [text('A short announcement goes here.', 'center')])] }
      ]
    },
    {
      id: 'images', name: 'Images', items: [
        { id: 's-full-image', name: 'Full-width image', blocks: [image()] },
        { id: 's-caption', name: 'Image with a caption', blocks: [image(), text('A caption that describes the image.', 'center')] },
        { id: 's-image-button', name: 'Image with a button', blocks: [image(), button('center')] },
        { id: 's-video-only', name: 'Video', blocks: [{ type: 'video', url: '', thumb: '', alt: '', label: 'Watch the video', align: 'center' }] },
        { id: 's-product', name: 'Product', blocks: [
          product()] },
        { id: 's-two-products', name: 'Two products', blocks: [product(), divider(), product()] }
      ]
    },
    {
      id: 'headers', name: 'Headers', items: [
        { id: 's-head-logo', name: 'Logo and rule', blocks: [logo('center'), divider()] },
        { id: 's-head-social', name: 'Logo and social links', blocks: [
          logo('center'), { type: 'social', style: 'text', align: 'center', links: [{ label: 'LinkedIn', url: '' }, { label: 'Website', url: '' }] }] },
        { id: 's-head-nav', name: 'Logo and page links', blocks: [
          logo('center'),
          { type: 'navigation', align: 'center', links: [{ label: 'Home', url: '' }, { label: 'About', url: '' }, { label: 'Contact', url: '' }] },
          divider()] }
      ]
    },
    {
      id: 'footers', name: 'Footers and sign-offs', items: [
        { id: 's-foot-social', name: 'Social links and address', blocks: [
          divider(), { type: 'social', style: 'text', align: 'center', links: [{ label: 'LinkedIn', url: '' }, { label: 'Website', url: '' }] },
          text('Your organisation\n00 Street name, City, Country', 'center')] },
        { id: 's-foot-contact', name: 'Contact details on a grey panel', blocks: [
          panel('light', [heading('Your organisation', 'left', 'small'), text('Email address\nTelephone number\n00 Street name, City, Country', 'left'),
            { type: 'navigation', align: 'left', links: [{ label: 'Privacy', url: '' }, { label: 'Contact us', url: '' }] }])] },
        { id: 's-signoff', name: 'Sign-off', blocks: [divider(), text('Kind regards,\nYour name\nYour role', 'left')] }
      ]
    },
    {
      id: 'containers', name: 'Empty panels and spacing', items: [
        { id: 's-empty-light', name: 'Empty light panel', blocks: [panel('light', [text('', 'left')])] },
        { id: 's-empty-dark', name: 'Empty dark panel', blocks: [panel('dark', [text('', 'left')])] },
        { id: 's-space', name: 'Space and rule', blocks: [spacer('large'), divider(), spacer('large')] }
      ]
    }
  ];

  // Blocks for a section or a whole layout, as a copy nobody else holds.
  MR.sectionBlocks = function (id) {
    var found = null;
    MR.SECTIONS.forEach(function (g) {
      g.items.forEach(function (x) { if (x.id === id) found = x; });
    });
    return found ? MR.tagSections(JSON.parse(JSON.stringify(found.blocks)), true) : MR.templateBlocks(id);
  };
})();
