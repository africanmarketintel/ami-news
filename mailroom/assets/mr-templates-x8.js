/* More starter layouts, part 8: full-width layouts. The pictures and colour
   bands run from one edge of the email to the other, with a large headline in
   a band of colour. Each picture uses the "Full width" setting, which a member
   can switch off in the editor. The words, prices and places are examples to
   replace. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX || !MR.tplX.B.shop) return;
  var X = MR.tplX, G = X.G, add = X.add, B = X.B, K = MR.tplKit;
  var SALE = G['Sales and offers'], WELCOME = G['Welcome'], NEWS = G['Newsletters'], LEARN = G['Learning and courses'];
  var heading = K.heading, text = K.text, button = K.button, divider = K.divider, spacer = K.spacer, pic = K.pic, sidePic = K.sidePic, panel = K.panel;

  /* Colour bands. Every pair that carries text is at least 4.5 to 1 (checked by
     the build tests). */
  var C = X.BLEED = {
    royal:  { bg: '#1d4ed8', ink: '#ffffff' },
    night:  { bg: '#111827', ink: '#ffffff' },
    orange: { bg: '#f97316', ink: '#1a1208' },
    sky:    { bg: '#bfdbfe', ink: '#0b1f5c' },
    plum:   { bg: '#3b1235', ink: '#ffffff' },
    lime:   { bg: '#e6f5b8', ink: '#1f2a05' },
    clay:   { bg: '#9a3412', ink: '#ffffff' },
    cream:  { bg: '#fdf0e3', ink: '#3b1d0e' },
    purple: { bg: '#4c3a8f', ink: '#ffffff' },
    lilac:  { bg: '#d9ccff', ink: '#26064a' },
    grey:   { bg: '#e5e7eb', ink: '#1f2937' },
    brown:  { bg: '#4a2c1a', ink: '#ffffff' },
    sun:    { bg: '#fde68a', ink: '#1a1208' }
  };
  function band(c, blocks) { return panel(c.bg === '#ffffff' ? 'light' : 'dark', blocks, { bg: c.bg, ink: c.ink, link: c.ink }); }
  function full(name) { var p = pic(name); p.full = true; return p; }
  // A large headline: capitals, a big size, centred.
  function big(t, size, align) { var h = heading(t, align || 'center'); h.size = size || 48; h.tcase = 'upper'; h.lspace = 1; return h; }
  function btn(align, c, label) { return button(align, c.ink === '#ffffff', label); }

  B.bold = function (o, p) {
    var c = C[o.band];
    return [
      band(c, [spacer('small'), big(o.title, o.size), text(o.body, 'center'), btn('center', c, o.btn), spacer('small')]),
      full(o.pic),
      text(o.note, 'center')
    ];
  };

  B.stack = function (o, p) {
    var b = [], lead = o.lead || 0;
    if (!lead) b.push(full(o.pic));
    o.bands.forEach(function (s, i) {
      if (lead && i === lead) b.push(full(o.pic));
      var c = C[s[0]], inner = [spacer('small')];
      if (s[1]) inner.push(big(s[1], s[2]));
      if (s[3]) inner.push(text(s[3], 'center'));
      if (s[4]) inner.push(btn('center', c, s[4]));
      inner.push(spacer('small'));
      b.push(band(c, inner));
    });
    if (o.note) { b.push(spacer('small')); b.push(text(o.note, 'center')); }
    return b;
  };

  // Rows of a picture beside words, each on its own full-width colour.
  B.rows = function (o, p) {
    var b = [];
    if (o.title) b.push(heading(o.title, 'center'));
    if (o.body) b.push(text(o.body, 'center'));
    o.rows.forEach(function (r, i) {
      var c = C[r[0]];
      b.push(band(c, [spacer('small'), sidePic(r[1], i % 2 ? 'right' : 'left', r[2]), spacer('small')]));
    });
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'center')); }
    return b;
  };

  add('bold-sale', 'Bold sale', SALE, 'A big headline on a band of colour, a full-width picture and one button.', 'cobalt', { t_font: 'sans', btn_radius: 0 }, 'bold', {
    band: 'royal', size: 52, title: 'Flash sale', body: 'Everything is half price until midnight on Sunday.', btn: 'Shop the sale',
    pic: 'bold-sale-full', note: 'Applies to full-price items only. Cannot be used with other offers.', keep: false
  });

  add('colour-band-sale', 'Colour band sale', SALE, 'A full-width picture with the offer on one band and the button on another.', 'coral', { t_font: 'sans', btn_radius: 0 }, 'stack', {
    pic: 'colour-band-sale-full',
    bands: [['orange', 'Thirty per cent off the whole shop', 34, '', ''], ['sky', '', 0, 'Offer ends Sunday at 23:59.', 'Shop now']],
    keep: false
  });

  add('surprise-sale', 'Surprise sale', SALE, 'A dark band with a large headline, then a full-width picture and a button.', 'night', { t_font: 'serif', btn_radius: 0 }, 'bold', {
    band: 'night', size: 56, title: 'Surprise sale', body: 'For the next three days, book a place on our flower arranging class for half price. Only 12 places are left.', btn: 'Book a place',
    pic: 'surprise-sale-full', note: 'The class lasts two hours. Flowers and vases are provided.', keep: false
  });

  add('roundup-colour', 'Roundup on colour', NEWS, 'Two items, each with a picture and words on its own full-width colour.', 'plum', { t_font: 'serif', btn_radius: 0 }, 'rows', {
    title: 'Two things worth your time', body: 'One to read and one to cook.',
    rows: [
      ['plum', 'roundup-a-side', 'NEW ARTICLE\nThe quiet benefits of a regular walk\nRead it'],
      ['lime', 'roundup-b-side', 'GET COOKING\nEasy dinners for busy weeks\nSee the recipes']
    ],
    btn: 'See everything this week', keep: false
  });

  add('first-order', 'First order welcome', WELCOME, 'Welcome a new customer with a full-width picture and a code on a band of colour.', 'clay', { t_font: 'sans', btn_radius: 0 }, 'stack', {
    pic: 'first-order-full',
    bands: [['clay', 'Welcome', 40, 'Here is 10 per cent off your first order. Use this code at the checkout.', ''], ['cream', 'WELCOME10', 36, 'Valid for 30 days. One use per customer.', 'Start shopping']],
    keep: false
  });

  add('welcome-with-note', 'Welcome with a note', WELCOME, 'A pastel band, a full-width picture and a short personal note.', 'cobalt', { t_font: 'serif', btn_radius: 0 }, 'stack', {
    pic: 'welcome-note-full', lead: 1,
    bands: [['sky', 'We are glad you are here', 36, 'A short note from me, and then you can look around.', ''], ['brown', '', 0, 'Reply to this email and say hello. A person reads every reply.', '']],
    note: 'Alex Morgan, founder', keep: false
  });

  add('roundup-freebie', 'Roundup with a freebie', NEWS, 'Two full-width blocks: a service on a strong colour and a free download on grey.', 'cobalt', { t_font: 'sans', btn_radius: 4 }, 'rows', {
    title: 'By designers, for designers', body: 'This month’s news, and something free.',
    rows: [
      ['royal', 'freebie-a-side', 'NOW AVAILABLE\nLet our team review your portfolio and suggest improvements\nBook a session'],
      ['grey', 'freebie-b-side', 'FREE CHECKLIST\nTen things to check before you publish\nDownload it']
    ],
    keep: false
  });

  add('promote-class', 'Promote a class', LEARN, 'A deep colour band with a large headline, a full-width picture and a button on a pale band.', 'violet', { t_font: 'serif', btn_radius: 0 }, 'stack', {
    pic: 'class-full', lead: 1,
    bands: [['purple', 'Join the Saturday class', 44, 'Ready to get moving? The next session is at 10:00 on Saturday. Bring a mat and some water.', ''], ['lilac', '', 0, 'Beginners are welcome. Places are limited to 20.', 'Reserve a mat']],
    keep: false
  });
})();
