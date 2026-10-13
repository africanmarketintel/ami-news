/* ==========================================================================
   AMI Mailroom – starter layouts
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
      name: 'Week in Review',
      summary: 'A dated briefing: a list of stories, then a coloured panel of what is coming up.',
      blocks: [
        { type: 'text', text: 'Monday, 1 January 2027', align: 'center' },
        { type: 'text', text: 'Your weekly update on what changed and what it means', align: 'center' },
        { type: 'heading', text: 'Week in Review', level: 'large', align: 'left' },
        { type: 'story', text: 'The first story headline', detail: 'One sentence saying what happened and what it is worth.', url: '', align: 'left', rule: true },
        { type: 'story', text: 'The second story headline', detail: 'One sentence saying what happened and what it is worth.', url: '', align: 'left', rule: true },
        { type: 'story', text: 'The third story headline', detail: 'One sentence saying what happened and what it is worth.', url: '', align: 'left', rule: true },
        { type: 'story', text: 'The fourth story headline', detail: 'One sentence saying what happened and what it is worth.', url: '', align: 'left', rule: true },
        { type: 'spacer', size: 'medium' },
        {
          type: 'panel', background: '#1e6b3c', text_colour: '#ffffff', link_colour: '#f9c53d',
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
})();
