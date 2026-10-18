/* ==========================================================================
   Starter layouts
   A campaign begins from one of these rather than an empty page. They are
   ordinary blocks, so everything can be changed or thrown away afterwards.
   The words are prompts, not filler to be sent as they are.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};

  MR.TEMPLATES = [
    {
      id: 'blank',
      name: 'Blank',
      summary: 'Start with one empty paragraph.',
      blocks: [{ type: 'text', text: '' }]
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      summary: 'A lead story, two shorter items side by side, and a link to more.',
      blocks: [
        { type: 'heading', text: 'The headline of this issue' },
        { type: 'text', text: 'One paragraph on the main story. Say what happened and why it matters to this reader.' },
        { type: 'image', url: '', alt: '' },
        { type: 'button', label: 'Read the full piece', url: '' },
        { type: 'divider' },
        { type: 'heading', text: 'Also this month' },
        { type: 'columns', left: 'A second item, in two or three sentences.', right: 'A third item. Keep both short: this is the part people skim.' },
        { type: 'spacer', size: 'medium' },
        { type: 'text', text: 'A closing line, and what is coming next month.' }
      ]
    },
    {
      id: 'week-in-review',
      name: 'Weekly briefing',
      summary: 'A dated briefing: a list of stories, then a coloured panel of what is coming up.',
      blocks: [
        { type: 'text', text: 'Monday, 1 January 2027', align: 'center' },
        { type: 'text', text: 'Your weekly update on what changed and what it means', align: 'center' },
        { type: 'heading', text: 'This week in brief', level: 'large', align: 'left' },
        { type: 'story', text: 'The first story headline', detail: 'One sentence saying what happened and what it is worth.', url: '', align: 'left', rule: true },
        { type: 'story', text: 'The second story headline', detail: 'One sentence saying what happened and what it is worth.', url: '', align: 'left', rule: true },
        { type: 'story', text: 'The third story headline', detail: 'One sentence saying what happened and what it is worth.', url: '', align: 'left', rule: true },
        { type: 'story', text: 'The fourth story headline', detail: 'One sentence saying what happened and what it is worth.', url: '', align: 'left', rule: true },
        { type: 'spacer', size: 'medium' },
        {
          type: 'panel', background: '#1b4332', text_colour: '#ffffff', link_colour: '#b7e4c7',
          blocks: [
            { type: 'heading', text: 'Upcoming events', level: 'large', align: 'left' },
            { type: 'text', text: 'Monday 12 October 2027, 09:00', align: 'left' },
            { type: 'story', text: 'The name of the first event', detail: 'A line on who it is for and why it is worth the morning.', url: '', align: 'left', rule: false },
            { type: 'spacer', size: 'small' },
            { type: 'text', text: 'Tuesday 13 October 2027, 09:00', align: 'left' },
            { type: 'story', text: 'The name of the second event', detail: 'A line on who it is for and why it is worth the morning.', url: '', align: 'left', rule: false }
          ]
        },
        { type: 'spacer', size: 'medium' },
        { type: 'text', text: 'Follow us', align: 'center' },
        { type: 'social', style: 'text', align: 'center', links: [
          { label: 'LinkedIn', url: '' }, { label: 'Website', url: '' }
        ] }
      ]
    },
    {
      id: 'announcement',
      name: 'Announcement',
      summary: 'One thing to say, said once, with a single action.',
      blocks: [
        { type: 'heading', text: 'What you are announcing' },
        { type: 'text', text: 'The announcement in two or three sentences. What has changed, when it takes effect, and what the reader has to do, if anything.' },
        { type: 'button', label: 'Find out more', url: '' },
        { type: 'spacer', size: 'medium' },
        { type: 'text', text: 'If you have questions, reply to this email.' }
      ]
    },
    {
      id: 'event',
      name: 'Event invitation',
      summary: 'The details first, the argument second, one way to register.',
      blocks: [
        { type: 'heading', text: 'The name of the event' },
        { type: 'list', text: 'Date and time, with the time zone\nWhere it is, or the platform\nWho it is for\nWhat it costs, or that it is free' },
        { type: 'imagetext', url: '', alt: '', side: 'left', text: 'Two or three sentences on why it is worth someone\'s afternoon. Name the speakers if that is the draw.' },
        { type: 'button', label: 'Register', url: '' },
        { type: 'divider' },
        { type: 'text', text: 'Cannot make it? Reply and we will send the write-up.' }
      ]
    },
    {
      id: 'update',
      name: 'Product or service update',
      summary: 'What changed, what it means, where to read the detail.',
      blocks: [
        { type: 'heading', text: 'What has changed' },
        { type: 'text', text: 'The change in plain words, and the date it happens.' },
        { type: 'list', text: 'The first thing that is different\nThe second\nThe third' },
        { type: 'text', text: 'What you need to do: usually nothing, but say so if that is the case.' },
        { type: 'button', label: 'Read the detail', url: '' }
      ]
    },
    {
      id: 'digest',
      name: 'Links digest',
      summary: 'Several short items, each with its own link.',
      blocks: [
        { type: 'heading', text: 'This week' },
        { type: 'text', text: 'One line on what is in this issue.' },
        { type: 'divider' },
        { type: 'text', text: '[The first item](https://example.com)\nA sentence on why it is here.' },
        { type: 'text', text: '[The second item](https://example.com)\nA sentence on why it is here.' },
        { type: 'text', text: '[The third item](https://example.com)\nA sentence on why it is here.' },
        { type: 'divider' },
        { type: 'social', links: [{ label: 'LinkedIn', url: '' }, { label: 'Website', url: '' }] }
      ]
    },
    {
      id: 'letter',
      name: 'Plain letter',
      summary: 'No images, no buttons. Often the one that gets read.',
      blocks: [
        { type: 'text', text: 'Dear reader,' },
        { type: 'text', text: 'What you want to say, in your own words. A plain letter from a named person outperforms a designed template more often than people expect.' },
        { type: 'text', text: 'Best wishes,\nYour name' }
      ]
    }
  ];

  MR.templateBlocks = function (id) {
    var t = MR.TEMPLATES.filter(function (x) { return x.id === id; })[0];
    if (!t) return [{ type: 'text', text: '' }];
    return JSON.parse(JSON.stringify(t.blocks));
  };

  /* ---------------- sections ----------------
     Smaller than a layout: one part of an email, made of ordinary blocks,
     dropped in wherever it is needed. Pictures are left empty on purpose, so
     the sending checks ask for a real picture and a description. */
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
  function button(align, onDark) {
    return { type: 'button', label: 'Call to action', url: '', align: align || 'center',
      colour: onDark ? C.btnOnDark : C.btn, text_colour: onDark ? C.btnInkOnDark : C.btnInk };
  }
  function product() {
    return { type: 'product', url: '', alt: '', name: 'Product name', price: '00.00', description: 'A short description of the product.',
      label: 'Buy now', link: '', align: 'left', colour: C.btn, text_colour: C.btnInk };
  }
  function logo(align) { return { type: 'logo', url: '', alt: '', width: 160, link: '', align: align || 'center' }; }
  function divider() { return { type: 'divider' }; }
  function spacer(size) { return { type: 'spacer', size: size || 'medium' }; }
  function panel(kind, blocks) {
    return kind === 'dark'
      ? { type: 'panel', background: C.darkBg, text_colour: C.darkInk, link_colour: C.darkLink, blocks: blocks }
      : { type: 'panel', background: C.lightBg, text_colour: C.lightInk, link_colour: C.lightLink, blocks: blocks };
  }
  var TITLE = 'Some title here';
  var SENTENCE = 'A sentence or two about this. Say what it is and why it matters to the reader.';

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
    return found ? JSON.parse(JSON.stringify(found.blocks)) : MR.templateBlocks(id);
  };
})();
