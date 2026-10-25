/* More starter layouts, part 9: sales, welcome, thank-you and newsletter layouts
   built from colour bands, full-width pictures and short letters. Each layout is
   a list of parts (a picture, a band of colour, a heading, a letter paragraph,
   a list). The words, prices, dates and places are examples to replace. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX || !MR.tplX.BLEED) return;
  var X = MR.tplX, G = X.G, add = X.add, B = X.B, K = MR.tplKit, C = X.BLEED;
  var SALE = G['Sales and offers'], WELCOME = G['Welcome'], THANKS = G['Thank you'], NEWS = G['Newsletters'],
      SHOW = G['Product showcase'], LEARN = G['Learning and courses'], EVENTS = G['Events'],
      FEED = G['Feedback and updates'], ANN = G['Announcements'];
  var heading = K.heading, text = K.text, button = K.button, divider = K.divider, spacer = K.spacer,
      bullets = K.bullets, story = K.story, pic = K.pic, sidePic = K.sidePic, panel = K.panel;

  /* More colour bands. Every pair that carries text is at least 4.5 to 1
     (checked by the build tests). */
  Object.assign(C, {
    mint:   { bg: '#86efac', ink: '#052e16' },
    blush:  { bg: '#fbe4e4', ink: '#4a1020' },
    maroon: { bg: '#4a0d1e', ink: '#ffffff' },
    terra:  { bg: '#a8431f', ink: '#ffffff' },
    slate:  { bg: '#93a8c4', ink: '#0b1a2e' },
    yellow: { bg: '#facc15', ink: '#1a1208' },
    pink:   { bg: '#f4b6cc', ink: '#3a0a1d' },
    teal:   { bg: '#0f6b66', ink: '#ffffff' },
    forest: { bg: '#14532d', ink: '#ffffff' },
    peach:  { bg: '#fed7aa', ink: '#431407' },
    sage:   { bg: '#d9e4d3', ink: '#1b2e1b' },
    bone:   { bg: '#f5f0e8', ink: '#2b2118' },
    navy:   { bg: '#172554', ink: '#ffffff' },
    white:  { bg: '#ffffff', ink: '#1a1208' }
  });

  function band(c, blocks) { return panel('dark', blocks, { bg: c.bg, ink: c.ink, link: c.ink }); }
  function full(name) { var p = pic(name); p.full = true; return p; }
  function sized(t, size, align, upper) { var h = heading(t, align || 'center'); h.size = size; if (upper) { h.tcase = 'upper'; h.lspace = 1; } return h; }
  function btn(align, c, label) { return button(align, c.ink === '#ffffff', label); }

  /* One part of a layout, as a list of blocks. */
  function part(p) {
    var k = p[0];
    if (k === 'pic') return [full(p[1])];
    if (k === 'ipic') return [pic(p[1])];
    if (k === 'h') { var h = heading(p[1], p[2] || 'center', p[3] || 'large'); if (p[4]) h.size = p[4]; return [h]; }
    if (k === 't') return [text(p[1], p[2] || 'center')];
    if (k === 'btn') return [button(p[2] || 'center', false, p[1])];
    if (k === 'list') return [bullets(p[1], p[2] || 'left')];
    if (k === 'side') return [sidePic(p[1], p[2], p[3])];
    if (k === 'story') return [story(p[1], p[2])];
    if (k === 'div') return [divider()];
    if (k === 'sp') return [spacer('small')];
    if (k === 'quote') { var qc = C[p[1]]; return [band(qc, [text(p[2], 'center'), text(p[3], 'center')])]; }
    if (k === 'sideband') { var sc = C[p[1]]; return [band(sc, [spacer('small'), sidePic(p[2], p[3], p[4]), spacer('small')])]; }
    if (k === 'band') {
      var c = C[p[1]], o = p[2] || {}, al = o.left ? 'left' : 'center', inner = [spacer('small')];
      if (o.k) inner.push(text(o.k, al));
      if (o.t) { for (var i = 0; i < (o.rep || 1); i++) inner.push(o.plain ? sized(o.t, o.size || 34, al, false) : sized(o.t, o.size || 48, al, true)); }
      if (o.b) inner.push(text(o.b, al));
      if (o.list) inner.push(bullets(o.list, 'left'));
      if (o.btn) inner.push(btn(al, c, o.btn));
      inner.push(spacer('small'));
      return [band(c, inner)];
    }
    throw new Error('Unknown part ' + k);
  }
  B.compose = function (o) {
    var out = [];
    o.parts.forEach(function (p) { out = out.concat(part(p)); });
    return out;
  };
  function lay(id, name, group, summary, pal, over, parts) { add(id, name, group, summary, pal, over, 'compose', { parts: parts, keep: false }); }
  var SANS = { t_font: 'sans', btn_radius: 0 }, SERIF = { t_font: 'serif', btn_radius: 0 }, ROUND = { t_font: 'sans', btn_radius: 24 };

  /* ---- sales and offers ---- */
  lay('big-number-sale', 'Big number sale', SALE, 'A very large percentage on a dark band, a full-width picture and one button.', 'night', SANS, [
    ['band', 'night', { t: '30% off', size: 60, b: 'Everything in the shop until Sunday night.', btn: 'Shop now' }],
    ['pic', 'neon-sale-hero'],
    ['t', 'Applies to full-price items. Cannot be used with other offers.']]);
  lay('store-wide-sale', 'Store-wide sale', SALE, 'Four bands of colour: a name, a picture, the offer and a button.', 'coral', SANS, [
    ['band', 'sun', { k: 'THE SPRING SALE' }],
    ['pic', 'shopping-bags-hero'],
    ['band', 'orange', { t: '30% off the entire store', size: 36 }],
    ['band', 'sky', { b: 'Shop now, or regret it later.', btn: 'Shop now' }]]);
  lay('deadline-sale', 'Sale with a deadline', SALE, 'A full-width picture, then the offer with the closing time in large type.', 'lime', SANS, [
    ['pic', 'weekend-sale-hero'],
    ['band', 'lime', { k: 'ENDS FRIDAY AT 18:00', t: 'Thirty per cent off', size: 40, b: 'Choose any three items and the discount is taken off at the checkout.', btn: 'Shop the sale' }],
    ['t', 'The sale closes at 18:00 on Friday. Delivery is free on orders over £40.']]);
  lay('offer-deadline-price', 'Offer with old and new price', SALE, 'A headline about the time left, the old price crossed out in words and the new price.', 'sage', SERIF, [
    ['h', 'Only a few hours left to save £50', 'center', 'large', 34],
    ['t', 'For a limited time you can book ten classes for £199 instead of £249. The offer closes tonight at midnight.'],
    ['band', 'bone', { t: 'Was £249. Now £199.', plain: true, size: 30, btn: 'Get the deal' }],
    ['t', 'Classes can be used at any time in the next six months.']]);
  lay('big-word-sale', 'Big word sale', SALE, 'The word sale repeated in very large type on a pale band, then a picture and a button.', 'coral', SANS, [
    ['band', 'peach', { t: 'Sale', rep: 3, size: 60 }],
    ['pic', 'summer-sale-hero'],
    ['band', 'peach', { b: 'Up to 40 per cent off candles, ceramics and linen until the end of the month.', btn: 'See the sale' }]]);
  lay('first-to-hear', 'First to hear', SALE, 'A friendly headline, a full-width picture and a short note about an early offer.', 'sage', SERIF, [
    ['h', 'You are the first to hear about this one', 'center', 'large', 30],
    ['pic', 'sample-hero'],
    ['t', 'Our new collection goes on sale to everyone on Friday. Because you are on this list, you can shop it two days early.'],
    ['btn', 'Shop early']]);
  lay('dark-frame-sale', 'Dark frame sale', SALE, 'A dark frame around a tall picture, with the offer in a band below.', 'night', SANS, [
    ['band', 'night', { k: 'NEW SALE' }],
    ['pic', 'pottery-hero'],
    ['band', 'night', { t: 'Up to 40 per cent off', size: 30, b: 'Home pieces in stone, glass and clay. While stocks last.', btn: 'Shop the sale' }]]);
  lay('multi-offer-sale', 'Multi-offer sale', SALE, 'A bold headline on colour, a picture and three offers, each with a small picture.', 'violet', ROUND, [
    ['band', 'lilac', { t: 'Sale sale sale', size: 40 }],
    ['pic', 'colour-band-sale-full'],
    ['side', 'multi-offer-a-side', 'left', 'LIP BALM\nNow £9, down from £14\nShop it'],
    ['side', 'multi-offer-b-side', 'right', 'FACE OIL\nNow £16, down from £24\nShop it'],
    ['side', 'multi-offer-c-side', 'left', 'BODY BUTTER\nNow £12, down from £18\nShop it']]);
  lay('soft-sale-announcement', 'Sale announcement', SALE, 'A full-width picture, then a pale band with a short headline and a button.', 'rose', SERIF, [
    ['pic', 'sale-rack-hero'],
    ['band', 'blush', { t: 'Our spring sale starts today', plain: true, size: 34, b: 'Up to a third off for one week. Everything is made by hand.', btn: 'Shop the sale' }],
    ['t', 'Delivery is free on orders over £40.']]);
  lay('course-sale', 'Course sale', SALE, 'A bold heading on a pale band, a picture on a deep colour and a button.', 'clay', SANS, [
    ['band', 'cream', { t: 'Course sale', size: 40, b: 'Twenty per cent off every online course until Friday.' }],
    ['pic', 'notebook-colour-hero'],
    ['band', 'terra', { b: 'Learn at your own pace. Lessons stay in your account for a year.', btn: 'Browse the courses' }]]);
  lay('numbered-picks', 'Numbered picks', SALE, 'A large number, a short promise and a list of picks, each with a small picture.', 'sand', SERIF, [
    ['band', 'brown', { t: '6', size: 60, plain: true, b: 'Kitchen tools worth owning, chosen by professional cooks.' }],
    ['pic', 'pantry-hero'],
    ['side', 'numbered-a-side', 'left', '1\nA good knife\nSee it'],
    ['side', 'numbered-b-side', 'right', '2\nA heavy pan\nSee it'],
    ['side', 'numbered-c-side', 'left', '3\nA wooden spoon set\nSee it']]);
  lay('early-bird-sale', 'Early bird pricing', SALE, 'Bold type on bright green, a full-width picture and a button.', 'jade', SANS, [
    ['band', 'mint', { t: 'Early bird pricing', size: 44, b: 'From today until the end of the week, get half off our floral styling course.', btn: 'Save my place' }],
    ['pic', 'spring-flowers-hero'],
    ['t', 'The course starts on Monday 2 November and runs for six weeks.']]);
  lay('social-proof-sale', 'Offer with a review', SALE, 'A large offer headline, a short pitch and a review with stars.', 'sun', SERIF, [
    ['h', '30% off my coaching package', 'left', 'large', 40],
    ['t', 'For three days only, you can work with me one to one for twelve weeks at a lower price. I will help you plan your year and keep to it.', 'left'],
    ['quote', 'cream', '“Since we started, my bookings have doubled and I finally take weekends off.”', '★★★★★  A client'],
    ['btn', 'Book a call']]);
  lay('educator-offer', 'Educator’s offer', SALE, 'A friendly letter from the teacher, a portrait, a review and a button.', 'berry', SERIF, [
    ['h', 'A note from your teacher', 'left', 'large', 30],
    ['t', 'Hey friend,', 'left'],
    ['t', 'How has your week been? Better yet, how has your year been? If it has not gone how you hoped, my short course can help you reset.', 'left'],
    ['pic', 'educator-hero'],
    ['quote', 'cream', '“I started the course feeling stuck and finished it with a plan I could follow.”', '★★★★★  A student'],
    ['btn', 'See the course']]);
  lay('creator-sale', 'Creator sale', SALE, 'A short greeting, a picture, a sale headline on a band and a list of what is included.', 'sand', SERIF, [
    ['t', 'Hey friend, just a reminder that today is the last day to get this offer.'],
    ['pic', 'portrait-smile-hero'],
    ['band', 'sun', { t: '25% off my branding suite', plain: true, size: 32, b: 'Today only.' }],
    ['h', 'What is included', 'left', 'small'],
    ['list', 'A logo and colour palette\nThree social media templates\nA one-page style guide\nA short video walk-through'],
    ['btn', 'Get the suite']]);
  lay('digital-download', 'Digital download', SALE, 'A dark band with the offer, a picture of the product and a list of what you get.', 'night', SERIF, [
    ['band', 'navy', { k: '40% OFF TODAY ONLY', t: 'The illustrated tarot deck, digital download', plain: true, size: 32, btn: 'Get the deck' }],
    ['pic', 'digital-full'],
    ['h', 'What you get', 'left', 'small'],
    ['list', '78 illustrated cards as image files\nA short guide to each card\nA printable spread sheet']]);
  lay('coupon-big-word', 'Big word coupon', SALE, 'Large type on blue, a picture and a code on a dark band.', 'cobalt', SANS, [
    ['band', 'sky', { t: 'Sale', rep: 2, size: 56 }],
    ['pic', 'coupon-hero'],
    ['band', 'night', { k: 'YOUR CODE', t: 'SAVE20', size: 40, b: '20 per cent off until Sunday.', btn: 'Shop now' }]]);
  lay('service-pitch', 'Service pitch', SALE, 'A dark band with a headline in large serif type, a full-width picture and a button.', 'night', SERIF, [
    ['band', 'night', { t: 'Your list cannot wait another minute', plain: true, size: 38, b: 'Get £175 off my email set-up package and start sending this week.', btn: 'Claim the offer' }],
    ['pic', 'laptop-colour-hero'],
    ['t', 'The offer is open until Friday 20 November.']]);
  lay('cookbook-preorder', 'Cookbook pre-order', SALE, 'A bold title on a warm band, the cover as a full-width picture and a pre-order button.', 'clay', SERIF, [
    ['band', 'terra', { k: 'PRE-ORDER NOW', t: 'Gather round', plain: true, size: 44, b: 'My next cookbook is out in November. Pre-order a copy and get a signed bookplate.', btn: 'Pre-order now' }],
    ['pic', 'cookbook-full'],
    ['t', 'The book is published on 5 November and ships the same week.']]);
  lay('showcase-one-picture', 'One picture showcase', SHOW, 'A short heading, one large picture and a single line with a button.', 'sage', SERIF, [
    ['h', 'Autumn at the table', 'center', 'large', 34],
    ['pic', 'showcase-full'],
    ['t', 'Plates, glasses and linen in the colours of the season.'],
    ['btn', 'Shop the collection']]);
  lay('product-spotlight-band', 'Product spotlight band', SHOW, 'A full-width picture of the product, then a pink band with the story and a button.', 'berry', SERIF, [
    ['pic', 'lip-balm-full'],
    ['band', 'pink', { t: 'Soft lips, all winter', plain: true, size: 36, b: 'Our balm is made with shea butter and beeswax. One tin lasts about three months.', btn: 'Shop the balm' }],
    ['t', 'Free delivery on orders over £25.']]);
  lay('expert-roundup', 'Expert roundup', SHOW, 'A deep band with a headline and a paragraph from the founder, then a picture and a button.', 'plum', SERIF, [
    ['band', 'maroon', { t: 'My must-have moisture treatments', plain: true, size: 32, b: 'I love personalised treatments, but there is one thing every client needs more of: hydration. Here is what I recommend to bring back bounce and shine.' }],
    ['pic', 'bundle-product-2'],
    ['band', 'blush', { btn: 'See the treatments' }]]);
  lay('new-menu-band', 'New dishes on a band', SALE, 'A band with a large headline, a full-width picture of the food and a button.', 'clay', SANS, [
    ['band', 'brown', { t: 'Getting warmer', size: 44, b: 'Four new hot dishes join the menu this week.' }],
    ['pic', 'menu-full'],
    ['band', 'brown', { btn: 'See the menu' }]]);
  lay('open-house', 'Open house', EVENTS, 'A dark band with the date and place, a picture of the building and a booking button.', 'night', SERIF, [
    ['band', 'night', { t: 'Open house', size: 56, b: 'Saturday 14 November, 11:00 to 15:00', list: '24 Hill Road, London\nFour bedrooms and a garden\nLight refreshments' }],
    ['pic', 'open-house-full'],
    ['band', 'night', { btn: 'Book a viewing' }]]);
  lay('tips-roundup-band', 'Tips on a band', NEWS, 'A headline on a warm band, a picture and three short tips.', 'clay', SERIF, [
    ['band', 'terra', { t: 'Make sure your home is ready to show', plain: true, size: 32 }],
    ['pic', 'tips-full'],
    ['story', 'Clear the surfaces', 'Fewer things on show makes each room look larger.'],
    ['story', 'Let in the light', 'Open the curtains and clean the windows before every viewing.'],
    ['story', 'Add one touch of colour', 'A bowl of fruit or a vase of flowers is enough.']]);
  lay('join-waitlist', 'Join the waitlist', SALE, 'A picture, then a pale band with an invitation and a button.', 'sun', SERIF, [
    ['pic', 'new-service-hero'],
    ['band', 'sun', { t: 'An invitation to transform your brand', plain: true, size: 34, b: 'Our next group opens in January. Join the waitlist to hear first.', btn: 'Join the waitlist' }],
    ['t', 'There is no charge to join the waitlist.']]);

  /* ---- newsletters ---- */
  lay('blog-roundup', 'Blog roundup', NEWS, 'A blog name, one large picture and three posts with a line each.', 'sage', SERIF, [
    ['h', 'The blog for food lovers', 'center', 'large', 30],
    ['pic', 'blog-full'],
    ['story', 'Make it in ten minutes', 'A lunch from the cupboard, with no shopping.'],
    ['story', 'How to season a pan', 'Why food sticks and what to do about it.'],
    ['story', 'Five things to do with squash', 'It is in season now and it is cheap.'],
    ['btn', 'Read the blog']]);
  lay('seasonal-updates', 'Seasonal updates', NEWS, 'A small heading, a calm picture and three updates for the season.', 'sand', SERIF, [
    ['t', 'UPCOMING NEWS AND EVENTS'],
    ['pic', 'autumn-hero'],
    ['h', 'Autumn at the studio', 'center', 'large', 32],
    ['t', 'The clocks go back soon and we are settling into the new season.'],
    ['story', 'New opening hours', 'From 1 November we open at 10:00.'],
    ['story', 'Workshop on 21 November', 'Make a bowl from clay. Places are limited.'],
    ['story', 'A new pottery book', 'On our shelves from next week.']]);
  lay('dear-subscriber', 'Dear subscriber', NEWS, 'A plain letter on a grey page: a greeting, four short paragraphs and a name.', 'slate', SERIF, [
    ['h', 'A note for you', 'center', 'large', 30],
    ['t', 'Dear friend,', 'left'],
    ['t', 'Over the past few weeks I have thrown myself back into making things. With the days getting shorter, a warm drink and an empty notebook are just what I need to let ideas take shape.', 'left'],
    ['t', 'While sitting down to plan, I found a way to help you too. Today I am launching a small guide, written from the heart.', 'left'],
    ['t', 'I would love to share it with you. Reply to this email and tell me what you are working on.', 'left'],
    ['t', 'With thanks,\nAlex', 'left']]);
  lay('storyteller-intro', 'Storyteller’s newsletter', NEWS, 'A large portrait, a warm hello in the writer’s own voice and a link to the latest story.', 'sand', SERIF, [
    ['pic', 'story-hero'],
    ['h', 'Hello, and welcome', 'left', 'large', 32],
    ['t', 'I write about food, family and the places in between. Once or twice a month I send a letter with the best of what I have been cooking and reading.', 'left'],
    ['btn', 'Read the latest story', 'left']]);
  lay('client-update', 'Client update', ANN, 'A calm letter to clients with a short plan in clear headings.', 'slate', SERIF, [
    ['h', 'An update for our clients', 'left', 'large', 30],
    ['t', 'Dear friend,', 'left'],
    ['t', 'We wanted to write to you personally to explain what we are doing about the current disruption and how it affects you.', 'left'],
    ['h', 'Working remotely', 'left', 'small'],
    ['t', 'Our team is working from home and has everything it needs to give you the same service.', 'left'],
    ['h', 'Your health comes first', 'left', 'small'],
    ['t', 'If you or your team are unwell, please tell us. We will move any meeting without a charge.', 'left'],
    ['h', 'Looking after each other', 'left', 'small'],
    ['t', 'We will give 5 per cent of our fees next month to a local charity.', 'left'],
    ['t', 'Please reply if you have any questions.', 'left']]);
  lay('featured-this-week', 'Featured this week', NEWS, 'A band naming the week’s feature, a full-width picture and three stories.', 'teal', SERIF, [
    ['band', 'forest', { k: 'FEATURED THIS WEEK', t: 'Coastal comfort food', plain: true, size: 34, b: 'Recipes and workshops' }],
    ['pic', 'featured-full'],
    ['story', 'Fish pie, the easy way', 'Ready in an hour with one dish to wash.'],
    ['story', 'Join a workshop', 'Learn to make fresh pasta on Saturday.'],
    ['btn', 'See all the recipes']]);
  lay('top-five-edit', 'Top five edit', NEWS, 'A headline on slate, a picture and five numbered picks.', 'ocean', SERIF, [
    ['band', 'slate', { t: 'Sharing this season’s top five', plain: true, size: 34 }],
    ['pic', 'kitchen-hero'],
    ['story', '1. A recipe for gnocchi', 'Soft, light and easy to make at home.'],
    ['story', '2. A new bakery', 'Open on the high street from Monday.'],
    ['story', '3. A film worth the trip', 'Showing at the local cinema all month.'],
    ['story', '4. A podcast about food', 'Twenty minutes, once a week.'],
    ['story', '5. A book to give', 'Short stories to read in one sitting.']]);
  lay('about-me-newsletter', 'About me newsletter', NEWS, 'A portrait beside a short hello and a list of what you will receive.', 'berry', SERIF, [
    ['h', 'Hi there, I am Alex', 'left', 'large', 32],
    ['side', 'portrait-side', 'left', 'I am a recipe developer and food writer in Leeds. I specialise in simple, easy recipes.'],
    ['h', 'What you will get', 'left', 'small'],
    ['list', 'One new recipe every week\nA short note on what is in season\nFirst notice of my classes'],
    ['btn', 'Read my latest recipe', 'left']]);
  lay('multi-part-newsletter', 'Multi-part newsletter', NEWS, 'Three items, each with a small picture on its own full-width band.', 'clay', SERIF, [
    ['h', 'This month from the kitchen', 'center', 'large', 30],
    ['sideband', 'terra', 'impact-report-side', 'left', 'FROM THE BLOG\nThe post everyone is talking about\nRead it'],
    ['sideband', 'night', 'workshop-series-side', 'right', 'ONLY 3 SEATS LEFT\nThe food styling workshop\nBook a seat'],
    ['sideband', 'cream', 'multi-c-side', 'left', 'NEW IN THE SHOP\nA set of linen napkins\nShop now']]);
  lay('resources-roundup', 'Wellness resources roundup', NEWS, 'Two items, each with a picture on a band of colour, under a short welcome.', 'plum', SERIF, [
    ['h', 'Two things worth your time', 'center', 'large', 30],
    ['sideband', 'night', 'roundup-a-side', 'left', 'NEW ON THE BLOG\nThe mind and body connection\nRead it'],
    ['sideband', 'lime', 'roundup-b-side', 'right', 'GET COOKING\nEasy, balanced dinner ideas\nSee the recipes'],
    ['t', 'Both are free to read and use.']]);
  lay('inspiration-delivered', 'Inspiration, delivered', NEWS, 'A heading and three pictures with a line each, like a mood board.', 'sand', SERIF, [
    ['h', 'Inspiration, delivered', 'center', 'large', 32],
    ['side', 'mood-a-side', 'left', 'COLOUR\nWarm clay and soft blue'],
    ['side', 'mood-b-side', 'right', 'MOVEMENT\nStretching at the start of the day'],
    ['side', 'mood-c-side', 'left', 'STYLE\nBright shoes with a plain outfit'],
    ['t', 'Each month I share a few pictures that made me stop and look.']]);
  lay('share-news', 'Share your news', NEWS, 'A question as the headline, then two items on pale bands.', 'rose', SERIF, [
    ['h', 'Wondering what I have been up to?', 'center', 'large', 30],
    ['sideband', 'blush', 'share-a-side', 'left', 'PERSONAL LIFE\nAnswering the question I am asked most\nRead it'],
    ['sideband', 'peach', 'share-b-side', 'right', 'LIFESTYLE\nMy top ten favourite staycations\nRead it']]);
  lay('wellness-welcome-resources', 'Welcome with resources', WELCOME, 'A headline in green, a calm picture and three useful links.', 'sage', SERIF, [
    ['band', 'bone', { t: 'Start your week well', plain: true, size: 34, b: 'A few things to help you begin.' }],
    ['pic', 'welcome-resources-full'],
    ['story', 'A ten minute morning stretch', 'Follow along at home.'],
    ['story', 'Three breakfasts for busy days', 'Ready in five minutes.'],
    ['story', 'Our weekly planner', 'Free to download.']]);

  /* ---- welcome ---- */
  lay('welcome-gift-list', 'A gift for joining', WELCOME, 'A pale band with a short headline, a picture of the gift and a button.', 'sand', SANS, [
    ['band', 'bone', { t: 'A gift of thanks for joining the list', plain: true, size: 30, left: true }],
    ['pic', 'welcome-gift-hero'],
    ['t', 'Here is a free guide to making the most of your first month. We hope it helps.'],
    ['btn', 'Get the guide']]);
  lay('personal-welcome-picture', 'We are official', WELCOME, 'A warm, short headline on a pale band, a picture and a button.', 'rose', SERIF, [
    ['band', 'blush', { t: 'We are official, friend', plain: true, size: 38 }],
    ['pic', 'welcome-expect-hero'],
    ['t', 'You are on the list. Every Friday you will hear from us with something worth your time.'],
    ['btn', 'Read the latest']]);
  lay('dark-welcome', 'Dark welcome', WELCOME, 'One large word on a dark band, a picture and a short note.', 'night', SERIF, [
    ['band', 'night', { t: 'Welcome', plain: true, size: 60 }],
    ['pic', 'women-business-hero'],
    ['t', 'Thank you for joining. Here is what to expect: one short email each week and nothing more.'],
    ['btn', 'Start reading']]);
  lay('minimal-welcome', 'Minimal welcome', WELCOME, 'A picture, two short words and a button, with a lot of space.', 'sand', SERIF, [
    ['pic', 'welcome-sunrise-hero'],
    ['h', 'Welcome, friend', 'center', 'large', 34],
    ['t', 'We are so glad you are here.'],
    ['btn', 'Come in']]);
  lay('welcome-small-gift', 'Small gift welcome', WELCOME, 'A portrait beside a few words about a small gift and a button.', 'berry', SERIF, [
    ['h', 'A little welcome gift', 'center', 'large', 30],
    ['side', 'welcome-founder-side', 'left', 'Just a little gift from me to you.\nA short guide to getting started, free for new subscribers.\nGet the guide'],
    ['t', 'Reply any time and say hello.']]);
  lay('collage-welcome', 'Picture collage welcome', WELCOME, 'A welcome headline with two pictures side by side and a button.', 'sand', SERIF, [
    ['h', 'Welcome to the studio', 'center', 'large', 32],
    ['side', 'handmade-side', 'left', 'WHAT WE DO\nHand-made ceramics and small classes.'],
    ['side', 'honey-side', 'right', 'WHAT YOU GET\nA short letter each month.'],
    ['btn', 'Look around']]);
  lay('welcome-card-on-picture', 'Welcome note on a picture', WELCOME, 'A full-width picture, then a pale band with a short thank you.', 'slate', SERIF, [
    ['pic', 'sunrise-hero'],
    ['band', 'bone', { t: 'Words cannot express how grateful I am to have you on my list', plain: true, size: 26 }],
    ['t', 'You are now in the know. Here is what to look out for in your inbox.'],
    ['story', 'Fresh ideas every week', 'On Friday morning.'],
    ['story', 'First notice of sales', 'Before anyone else.']]);
  lay('freebie-is-here', 'The freebie is here', WELCOME, 'A short note that the download has arrived, a picture and a button.', 'sand', SERIF, [
    ['h', 'Your freebie is here', 'center', 'large', 32],
    ['t', 'I saved all the good things for you.'],
    ['pic', 'guide-cover-hero'],
    ['t', 'The styling guide I promised has arrived. It is free and it is yours to keep.'],
    ['btn', 'Get the guide']]);
  lay('welcome-thank-you-blocks', 'Welcome and thank you', WELCOME, 'Short words stacked on blocks of colour around a picture.', 'rose', SANS, [
    ['band', 'blush', { t: 'Welcome', plain: true, size: 32, left: true }],
    ['band', 'night', { t: 'And thank you', plain: true, size: 32, left: true }],
    ['pic', 'smile-hero'],
    ['band', 'white', { t: 'For being here', plain: true, size: 32, left: true, btn: 'Look around' }]]);
  lay('welcome-you-made-it', 'You made it', WELCOME, 'A large picture and a warm welcome headline with a button.', 'sand', SERIF, [
    ['pic', 'welcome-member-hero'],
    ['band', 'bone', { t: 'You made it', plain: true, size: 40, b: 'Welcome to the list. Here is a little something to get you started.', btn: 'Take a look' }],
    ['t', 'Reply to this email and say hello. A person reads every reply.']]);
  lay('welcome-friend', 'Welcome, friend', WELCOME, 'A short headline, a bright picture and a lilac band with a button.', 'violet', SERIF, [
    ['h', 'Welcome, friend', 'center', 'large', 34],
    ['pic', 'welcome-hero'],
    ['band', 'lilac', { b: 'Thank you for subscribing. Here is a first look at what we are making.', btn: 'See the latest' }]]);
  lay('welcome-discount-portrait', 'Welcome offer with a portrait', WELCOME, 'A full-width portrait, then a brown band with the first-order offer.', 'clay', SERIF, [
    ['pic', 'welcome-discount-full'],
    ['band', 'brown', { k: 'STARTING THINGS OFF WITH A SPECIAL OFFER', t: '10% off your first order', plain: true, size: 34, b: 'Use the code HELLO10 at the checkout.', btn: 'Start shopping' }],
    ['t', 'The code is valid for 30 days and can be used once.']]);
  lay('course-welcome', 'Welcome to a course', LEARN, 'A yellow band, a bright picture and the first three steps.', 'marigold', SANS, [
    ['pic', 'classroom-hero'],
    ['band', 'yellow', { t: 'Welcome to the course', plain: true, size: 34, list: 'Log in to your account\nWatch the first lesson\nJoin the group chat', btn: 'Start lesson one' }],
    ['t', 'Questions? Reply to this email and we will help.']]);
  lay('invite-register', 'Invitation to register', LEARN, 'A pale lilac band with an invitation, a picture and a button to register.', 'violet', SERIF, [
    ['band', 'lilac', { t: 'Come and learn with me', plain: true, size: 34 }],
    ['pic', 'webinar-hero'],
    ['t', 'My four-week workshop begins on 4 November. It runs online, on Wednesday evenings.'],
    ['btn', 'Register']]);
  lay('join-us-event', 'Join us', EVENTS, 'A full-width picture, then a deep band with the date and a registration button.', 'teal', SANS, [
    ['pic', 'event-hero'],
    ['band', 'teal', { t: 'Join us', size: 56, b: 'An evening of talks and food. Thursday 26 November, 18:30 to 21:00.', btn: 'Register' }],
    ['t', 'Doors open at 18:00. Food and drink are included.']]);

  /* ---- thank you and feedback ---- */
  lay('deliver-freebie', 'Deliver your freebie', WELCOME, 'A short promise as the headline, a picture of the download and a button.', 'sand', SERIF, [
    ['h', 'About that freebie I promised…', 'center', 'large', 30],
    ['pic', 'guide-cover-hero'],
    ['t', 'It is here. Four pages, all in plain words, and free to keep.'],
    ['btn', 'Download it']]);
  lay('personal-note', 'On a personal note', WELCOME, 'A portrait beside the start of a letter, with a short note underneath.', 'sand', SERIF, [
    ['h', 'A note from me', 'left', 'large', 30],
    ['side', 'welcome-start-side', 'left', 'Well, now that you are here, we can finally begin.\nHi, my name is Talia and I am so excited you are here.'],
    ['t', 'I am thrilled that you are interested in hearing more from me. I cannot wait to start sharing with you. Reply any time and tell me about you.', 'left']]);
  lay('gift-of-thanks', 'A little gift to thank you', THANKS, 'A picture of a gift and a short thank you on a pale green band.', 'sage', SERIF, [
    ['pic', 'gift-thanks-full'],
    ['band', 'sage', { t: 'A little gift to thank you', plain: true, size: 32, b: 'Thank you for being a part of what we do. Here is 15 per cent off your next order.', btn: 'Use my gift' }],
    ['t', 'The code is valid for 30 days.']]);
  lay('deep-gratitude', 'With deep gratitude', THANKS, 'A large heading and a long letter in short parts.', 'sand', SANS, [
    ['h', 'My gratitude runs deep', 'left', 'large', 44],
    ['t', 'Hi friend,', 'left'],
    ['t', 'I wanted to take a moment to thank you for being a member of the family. I have poured my heart and soul into every part of this business and it means a lot to have your support.', 'left'],
    ['h', 'The journey', 'left', 'small'],
    ['t', 'When I first started, I dreamed of building a brand that made a difference. Years later, you are a part of that story.', 'left'],
    ['h', 'What I am doing for you', 'left', 'small'],
    ['t', 'Each person who raised a hand to cheer me on is part of the story. As a thank you, there is a gift for you below.', 'left'],
    ['btn', 'Get my gift', 'left']]);
  lay('grateful-picture', 'Grateful for your support', THANKS, 'A large portrait and a deep band with a short thank you.', 'night', SERIF, [
    ['pic', 'grateful-full'],
    ['band', 'night', { t: 'Thank you', plain: true, size: 52, b: 'We are grateful for your support this year.', btn: 'Read our year' }],
    ['t', 'Thank you for being with us.']]);
  lay('big-deal-thanks', 'A big deal', THANKS, 'A warm headline on a pale band, a picture and a thank you.', 'sand', SERIF, [
    ['band', 'bone', { t: 'You are a pretty big deal around here', plain: true, size: 34 }],
    ['pic', 'thanks-hero'],
    ['t', 'Thank you for reading, replying and sharing. Every one of you makes this worth doing.'],
    ['btn', 'Share with a friend']]);
  lay('invite-reply', 'Invite a reply', FEED, 'A picture with a short note of thanks and a button that asks for an answer.', 'night', SERIF, [
    ['pic', 'listening-hero'],
    ['band', 'night', { t: 'I am so very grateful for you, friend', plain: true, size: 30, b: 'Hit reply and tell me one thing you would like to see from us next year.', btn: 'Write back' }],
    ['t', 'Every reply is read by a person.']]);
  lay('review-request-letter', 'Review request letter', FEED, 'A short letter asking for a review, with one button.', 'slate', SERIF, [
    ['h', 'Could you write us a review?', 'left', 'large', 30],
    ['t', 'Hi friend,', 'left'],
    ['t', 'Truth be told, you are the kind of customer we hoped to find when we started. To keep working with people like you, we have a small favour to ask.', 'left'],
    ['t', 'Could you write a few lines about your experience? A kind review makes a big difference to a small business like ours.', 'left'],
    ['btn', 'Leave a review', 'left'],
    ['t', 'Thank you so much for your support.', 'left']]);
})();
