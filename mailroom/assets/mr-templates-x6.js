/* More starter layouts, part 6: shop and product emails. Discount, product,
   new product, sale and follow-up layouts for a shop. The words, prices,
   addresses and codes are examples to replace. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX) return;
  var X = MR.tplX, G = X.G, add = X.add, B = X.B, K = MR.tplKit;
  var SALE = G['Sales and offers'], SHOW = G['Product showcase'], EVENTS = G['Events'];
  var heading = K.heading, text = K.text, button = K.button, divider = K.divider, spacer = K.spacer,
      bullets = K.bullets, story = K.story, pic = K.pic, sidePic = K.sidePic, productWith = K.productWith;
  function lines(a) { return (a || []).join('\n'); }

  /* A shop email assembled from the parts a shop uses: products, a code,
     a review, a sale panel, reasons to buy, lists and a note from the owner. */
  B.shop = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, 'center'));
    b.push(heading(o.title, 'center'));
    if (o.body) b.push(text(o.body, 'center'));
    (o.items || []).forEach(function (it) { b.push(productWith(it[0], it[1], it[2], it[3], it[4])); });
    if (o.sale) b.push(X.dark(p, [K.spacer('small'), text(o.sale.kicker, 'center'), heading(o.sale.title, 'center'), text(o.sale.body, 'center'), button('center', true, o.sale.btn), spacer('small')]));
    if (o.code) b.push(X.dark(p, [spacer('small'), text(o.codeLabel, 'center'), heading(o.code, 'center'), text(o.terms, 'center'), spacer('small')]));
    if (o.quote) b.push(X.soft(p, [text('“' + o.quote + '”', 'center'), text(o.who, 'center')]));
    if (o.reasons) b.push(X.soft(p, [heading(o.reasonsTitle || 'Why shop with us', 'left', 'small'), bullets(lines(o.reasons))]));
    (o.lists || []).forEach(function (l) { b.push(heading(l[0], 'left', 'small')); b.push(bullets(lines(l[1]))); });
    if (o.reads) { b.push(heading(o.readsTitle || 'From the blog', 'left', 'small')); o.reads.forEach(function (it) { b.push(story(it[0], it[1])); }); }
    if (o.owner) {
      b.push(divider()); b.push(heading(o.owner.title, 'left', 'small'));
      o.owner.paras.forEach(function (t) { b.push(text(t, 'left')); });
      b.push(text(o.owner.sign, 'left'));
    }
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'center')); }
    return b;
  };

  // Products shown a row at a time, picture and words side by side, in groups.
  B.shopgrid = function (o, p) {
    var b = [];
    if (o.kicker) b.push(text(o.kicker, 'center'));
    b.push(heading(o.title, 'center'));
    if (o.body) b.push(text(o.body, 'center'));
    o.groups.forEach(function (g) {
      b.push(heading(g.title, 'left', 'small'));
      g.rows.forEach(function (r, i) { b.push(sidePic(r[0], i % 2 ? 'right' : 'left', r[1])); });
    });
    if (o.code) b.push(X.soft(p, [text(o.codeLabel, 'center'), heading(o.code, 'center'), text(o.terms, 'center')]));
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'center')); }
    return b;
  };

  // A book: the cover beside a blurb, where to buy, the author, a review.
  B.book = function (o, p) {
    var b = [heading(o.title, 'left'), text(o.body, 'left'), sidePic(o.pic, 'left', o.sideText)];
    b.push(heading('Where to buy', 'left', 'small')); b.push(bullets(lines(o.where)));
    b.push(heading(o.authorTitle, 'left', 'small')); b.push(text(o.author, 'left'));
    b.push(X.soft(p, [text('“' + o.quote + '”', 'center'), text(o.who, 'center')]));
    if (o.related) { b.push(heading('Also available', 'left', 'small')); b.push(bullets(lines(o.related))); }
    if (o.btn) { b.push(spacer('small')); b.push(button('left', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'left')); }
    return b;
  };

  // Each section sits on its own pastel colour, so the eye moves down the page.
  B.blocks = function (o, p) {
    var b = [];
    if (o.pic) b.push(pic(o.pic));
    if (o.kicker) b.push(text(o.kicker, 'left'));
    b.push(heading(o.title, 'left'));
    if (o.body) b.push(text(o.body, 'left'));
    o.sections.forEach(function (s) {
      var inner = [];
      if (s.item) inner.push(productWith(s.item[0], s.item[1], s.item[2], s.item[3], s.item[4]));
      else if (s.pic) inner.push(pic(s.pic));
      if (!s.item) { inner.push(heading(s.title, 'left', 'small')); inner.push(text(s.body, 'left')); }
      if (s.btn) inner.push(button('left', false, s.btn));
      b.push(K.panel('light', inner, { bg: s.bg, ink: s.ink, link: s.ink }));
    });
    if (o.btn) { b.push(spacer('small')); b.push(button('center', false, o.btn)); }
    if (o.note) { b.push(divider()); b.push(text(o.note, 'left')); }
    return b;
  };
  X.PASTEL = { peach: ['#ffe3d9', '#4a1d0f'], aqua: ['#dffaf8', '#053b3f'], lilac: ['#f0e9ff', '#26064a'], butter: ['#fff3c4', '#2b2410'], mint: ['#e4f7ef', '#06352a'], blush: ['#fde8f3', '#4a0d34'] };
  var PC = X.PASTEL;

  /* ================= Discounts and product promotion ================= */
  add('recommended', 'Recommended for you', SALE, 'Two products picked from what a customer bought before, with a code and four reasons to buy.', 'ocean', { t_font: 'sans', btn_radius: 24 }, 'shop', {
    kicker: 'PICKED FOR YOU',
    title: 'Two things we think you will like',
    body: 'You bought a candle from us in the spring. These two go well with it.',
    items: [
      ['mug-product-1', 'Speckled stoneware mug', '£12.00', 'Holds 350 ml. Safe in the dishwasher.', 'A cream mug with brown speckles'],
      ['candle-product-1', 'Soy wax candle', '£14.00', 'Burns for about 40 hours.', 'Three candles in glass jars']
    ],
    codeLabel: 'YOUR CODE', code: 'PICKED10', terms: 'Takes 10 per cent off. Valid for seven days. One use per customer.',
    reasons: ['Free delivery on orders over £40', 'Returns within 30 days', 'Packed by hand in small batches', 'Questions answered by a person'],
    lists: [['Shop by type', ['Kitchen', 'Home', 'Gifts under £20']]],
    btn: 'See more picked for you',
    keep: false
  });

  add('our-favourites', 'Our favourites', SHOW, 'Three best-loved products with a customer review underneath.', 'sage', { t_font: 'serif', btn_radius: 4 }, 'shop', {
    kicker: 'CUSTOMER FAVOURITES',
    title: 'The three things people buy again',
    body: 'These are the products customers reorder most often.',
    items: [
      ['soap-product-1', 'Shea butter soap', '£6.00', 'Hand-made in small batches. Gentle on skin.', 'A block of cream shea butter soap'],
      ['basket-product-1', 'Woven storage basket', '£24.00', 'Made by a weaving group and sold in three sizes.', 'A round woven basket in bright colours'],
      ['scarf-product-1', 'Knitted scarf', '£18.00', 'Soft wool in four colours.', 'A folded knitted scarf']
    ],
    quote: 'I have bought the soap four times now. It lasts and it smells lovely.',
    who: 'Amara, a customer since 2023',
    lists: [['Find more', ['All products', 'Gift sets', 'Our story']]],
    btn: 'Shop the favourites',
    keep: false
  });

  add('product-benefits', 'One product, three benefits', SHOW, 'One product with a large picture, three plain benefits and a discount link.', 'clay', { t_font: 'sans', btn_radius: 30 }, 'shop', {
    pic: 'tote-product-1',
    kicker: 'NEW',
    title: 'Meet the everyday tote',
    body: 'A bag that holds what you carry and still looks good at the end of the day.',
    reasonsTitle: 'What it does',
    reasons: ['Roomy: holds a laptop, a lunch box and a water bottle', 'Light: weighs 380 g when empty', 'Easy to clean: wipe it with a damp cloth'],
    sale: { kicker: 'FIRST ORDER', title: '15 per cent off the tote', body: 'Use the button below. The price is taken off at the checkout.', btn: 'Get the tote with 15 per cent off' },
    keep: false
  });

  add('new-book', 'New book', SHOW, 'A new book with the cover beside the blurb, where to buy, the author and a review.', 'sand', { t_font: 'serif', btn_radius: 2 }, 'book', {
    title: 'The Twelve-Month Stall is out now',
    body: 'A diary of a year at a market stall, told one week at a time, with the stories and the practical lessons that came with it.',
    pic: 'new-book-side',
    sideText: 'The Twelve-Month Stall\nPaperback, 240 pages\n£12.99',
    where: ['Our online shop', 'Your local bookshop', 'Any large online bookseller'],
    authorTitle: 'About the author',
    author: 'Ngozi Bello has run a market stall for eighteen years. This is her first book.',
    quote: 'Warm and funny, and full of useful detail.',
    who: 'A reader from the book club',
    related: ['A companion notebook, £8', 'The audio edition, £10'],
    btn: 'Order your copy',
    keep: false
  });

  add('best-sellers', 'Best sellers', SALE, 'Three products customers buy most, and the pages people read before buying.', 'gold', { t_font: 'serif', btn_radius: 4 }, 'shop', {
    kicker: 'BEST SELLERS',
    title: 'What our customers buy most',
    body: 'These three sold the most over the past month.',
    items: [
      ['coffee-product-1', 'Ground coffee, 250 g', '£7.50', 'Roasted in small batches every week.', 'A bag of ground coffee'],
      ['spices-product-1', 'Pepper and spice mix', '£5.00', 'A blend for rice, stews and grills.', 'Small bowls of ground spices'],
      ['tea-product-1', 'Loose leaf tea', '£6.50', 'Three blends in a tin.', 'Colourful tins of loose leaf tea']
    ],
    reads: [['How to store coffee so it keeps its taste', 'Four simple habits that make a bag last.'], ['Five dinners with one spice mix', 'Recipes that take less than 30 minutes.']],
    readsTitle: 'Read before you buy',
    lists: [['Follow us', ['Instagram', 'Facebook', 'Pinterest']]],
    btn: 'See all best sellers',
    keep: false
  });

  add('product-newsletter', 'Product newsletter', SHOW, 'Announce a new product with a large picture, a short description, a review and links to collections.', 'plum', { t_font: 'serif', btn_radius: 0 }, 'shop', {
    pic: 'gift-box-hero',
    kicker: 'JUST LAUNCHED',
    title: 'The new gift box is here',
    body: 'Six small things, wrapped in recycled paper and tied with ribbon. Ready to give, and ready to post.',
    quote: 'The nicest present I was sent this year.',
    who: 'A first customer',
    lists: [['Shop by collection', ['For the kitchen', 'For the home', 'Gifts under £20']]],
    btn: 'See the gift box',
    keep: false
  });

  /* ================= New products and sales ================= */
  add('new-kit', 'New kit for the season', SALE, 'Sports or activity gear: a bold picture, a sale panel and three reasons to buy.', 'cobalt', { t_font: 'sans', t_size: 36, btn_radius: 0 }, 'shop', {
    pic: 'kit-hero',
    kicker: 'THE NEW SEASON',
    title: 'Kit for running, studio and gym',
    body: 'Lighter fabrics and brighter colours for the months ahead.',
    lists: [['Shop by activity', ['Running', 'Studio', 'Gym']]],
    sale: { kicker: 'LAST SEASON', title: 'Up to 30 per cent off', body: 'The last of the old range is on sale until the end of the month.', btn: 'Shop the sale' },
    reasons: ['Free delivery on orders over £50', 'Free returns within 30 days', 'Secure payment by card or bank transfer'],
    keep: false
  });

  add('two-collections', 'Two collections', SHOW, 'Eight products in two groups, each shown with a picture, a price and a line of text.', 'turquoise', { t_font: 'sans', btn_radius: 8 }, 'shopgrid', {
    kicker: 'NEW IN',
    title: 'Two collections to start the year',
    body: 'Everything for the studio and everything for the gym.',
    groups: [
      { title: 'The studio collection', rows: [
        ['gym-c-side', 'Yoga mat\n£28.00\nNon-slip and 5 mm thick.'],
        ['gym-d-side', 'Steel water bottle\n£16.00\nKeeps drinks cold for 12 hours.']] },
      { title: 'The gym collection', rows: [
        ['gym-a-side', 'Kettlebell, 8 kg\n£24.00\nA flat base and a wide grip.'],
        ['gym-b-side', 'Resistance bands, set of three\n£12.00\nLight, medium and strong.']] }
    ],
    codeLabel: 'YOUR CODE', code: 'MOVE10', terms: 'Takes 10 per cent off your first order.',
    btn: 'Shop both collections',
    keep: false
  });

  add('new-season', 'New season', SALE, 'Mark a change of season with two products, an offer and the address of the shop.', 'sunset', { t_font: 'serif', btn_radius: 30 }, 'shop', {
    pic: 'autumn-hero',
    kicker: 'THE AUTUMN RANGE',
    title: 'Warm colours for cooler days',
    body: 'The new season is in the shop and online.',
    items: [
      ['scarf-product-1', 'Knitted scarf', '£18.00', 'Soft wool in four colours.', 'A folded knitted scarf'],
      ['fabric-product-1', 'Wax print throw', '£35.00', 'Bright cotton for the sofa or the bed.', 'A folded wax print fabric']
    ],
    lists: [['Visit the shop', ['14 Station Road', 'Open Monday to Saturday, 9:00 to 17:30', 'Free parking behind the shop']]],
    btn: 'Shop the autumn range',
    keep: false
  });

  add('anniversary-sale', 'Anniversary sale', SALE, 'Celebrate a milestone with an offer and a personal note from the owner.', 'berry', { t_font: 'serif', btn_radius: 30 }, 'shop', {
    pic: 'anniversary-hero',
    kicker: 'FIVE YEARS',
    title: 'Five years, and a thank you',
    body: 'We opened five years ago this week. To say thank you, there is an offer for everyone.',
    reasonsTitle: 'This week only',
    reasons: ['20 per cent off everything in the shop', 'A free gift with orders over £30', 'Free delivery on every order'],
    lists: [['Where to start', ['Our best sellers', 'New in', 'Gift sets']]],
    owner: { title: 'A note from the owner', paras: ['When I started, I sold from a table in my front room. I did not expect to be here five years later.', 'Thank you for every order and every kind message.'], sign: 'Alex Morgan\nFounder' },
    btn: 'Shop the anniversary sale',
    keep: false
  });

  add('summer-sale', 'Summer sale', SALE, 'A bright seasonal sale with a code for a further saving and three reasons to buy.', 'marigold', { t_font: 'sans', t_size: 38, btn_radius: 30 }, 'shop', {
    pic: 'summer-sale-hero',
    kicker: 'SUMMER SALE',
    title: 'Up to 40 per cent off',
    body: 'Summer favourites at lower prices, until the end of August.',
    lists: [['Shop the sale', ['Clothing', 'Bags and hats', 'Home and garden']]],
    codeLabel: 'EXTRA SAVING', code: 'SUMMER10', terms: 'Takes a further 10 per cent off sale items. Ends 31 August.',
    reasons: ['Free delivery on orders over £40', 'Free returns within 30 days', 'Secure payment'],
    btn: 'Shop the summer sale',
    keep: false
  });

  /* ================= Nurture and follow-up ================= */
  add('benefits-recipe', 'From our kitchen', SHOW, 'Share a simple recipe that uses what you sell, with what you need and the steps.', 'lime', { t_font: 'serif', btn_radius: 4 }, 'facts', {
    pic: 'smoothie-hero',
    kicker: 'FROM OUR KITCHEN',
    title: 'A fruit breakfast bowl in five minutes',
    body: 'Three ingredients and no cooking. It works with any ripe fruit.',
    facts: ['Serves two', 'Takes five minutes', 'Needs no cooking'],
    moreTitle: 'What you need',
    more: ['2 ripe mangoes, peeled and cut up', '200 g of plain yoghurt', '4 tablespoons of oats'],
    btn: 'Read the full recipe',
    keep: false
  });

  add('why-shop-with-us', 'Why shop with us', SALE, 'Four plain promises about delivery, returns, payment and service.', 'jade', { t_font: 'sans', btn_radius: 8 }, 'figures', {
    pic: 'unboxing-hero',
    kicker: 'OUR PROMISES',
    title: 'Four things you can count on',
    body: 'We keep these the same all year, whatever the season.',
    figs: ['Free delivery\nOn orders over £40', 'Easy returns\nWithin 30 days of delivery', 'Secure payment\nBy card or bank transfer', 'Real people\nReply to any of our emails'],
    btn: 'Start shopping',
    keep: false
  });

  add('visit-our-shop', 'Visit our shop', SALE, 'Tell people where the shop is, when it is open and how to get there.', 'sand', { t_font: 'serif', btn_radius: 4 }, 'facts', {
    pic: 'shopfront-hero',
    kicker: 'COME AND SEE US',
    title: 'Our shop is open to everyone',
    body: 'Come and look at the full range, and ask us anything.',
    facts: ['Where: 14 Station Road, two minutes from the bus stop', 'Open: Monday to Saturday, 9:00 to 17:30', 'Parking: free for two hours behind the shop'],
    moreTitle: 'What to expect',
    more: ['The whole range on the shelves', 'Staff who can help you choose', 'A free sample with every visit'],
    btn: 'Get directions',
    keep: false
  });

  add('gift-card', 'Give a gift card', SALE, 'Explain a gift card in three steps, with the amounts and the dates.', 'rose', { t_font: 'serif', btn_radius: 30 }, 'steps', {
    pic: 'welcome-code-hero',
    title: 'Let them choose',
    body: 'A gift card from £10 to £100, sent by email in minutes and valid for 12 months.',
    steps: ['Choose an amount from £10 to £100.', 'Add a short message.', 'We send it by email on the day you pick.'],
    btn: 'Buy a gift card',
    align: 'center',
    keep: false
  });

  add('saved-item', 'Something you saved is on sale', SALE, 'Tell a customer that an item on their wish list now costs less.', 'violet', { t_font: 'sans', btn_radius: 24 }, 'shop', {
    kicker: 'ON YOUR WISH LIST',
    title: 'An item you saved is cheaper',
    body: 'The price has dropped, and we have only a few left.',
    items: [['bag-product-2', 'Orange leather handbag', '£34.00 (was £42.00)', 'Soft leather with two inside pockets.', 'An orange leather handbag']],
    btn: 'See it now',
    keep: false
  });

  add('free-sample', 'Try a free sample', SALE, 'Offer a free sample with the next order, with three to choose from.', 'clay', { t_font: 'serif', btn_radius: 30 }, 'centre', {
    pic: 'sample-hero',
    kicker: 'ON US',
    title: 'Try before you buy',
    body: 'Choose one sample to go with your next order. There is nothing to pay.',
    list: ['Pepper and spice mix', 'Wild forest honey', 'Shea butter soap'],
    listTitle: 'Choose one',
    btn: 'Choose a sample',
    note: 'One sample for each order.',
    keep: false
  });

  add('market-stall', 'Find us at the market', EVENTS, 'Tell people where your stall will be this weekend, with times and what you are bringing.', 'coral', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'market-stall-hero',
    kicker: 'THIS WEEKEND',
    title: 'Come and say hello at the market',
    body: 'We have a stall at the Saturday market, with the full range and some things you cannot buy online.',
    facts: ['When: Saturday, 8:00 to 14:00', 'Where: Stall 21, the main market hall', 'Pay: cash or card'],
    moreTitle: 'What we are bringing',
    more: ['The full range', 'Samples to try', 'A market-day discount code'],
    btn: 'See the market map',
    keep: false
  });

  /* ================= Newsletter styles ================= */
  var NEWS = G['Newsletters'];
  add('short-simple', 'Short and simple', NEWS, 'The main point first, one picture, one button and a closing quote. Quick to read.', 'sage', { t_font: 'sans', t_size: 30, btn_radius: 4 }, 'shop', {
    pic: 'opening-hero',
    kicker: 'MARCH UPDATE',
    title: 'Our new workshop opens on 4 April',
    body: 'It has twice the space and a room for classes. You can visit from the first day.',
    lists: [['What else is new', ['Evening classes start on 11 April', 'Our shop is open on Sundays', 'The loyalty card is now free']]],
    quote: 'Small steps, taken every week, add up.',
    who: 'Our motto since day one',
    btn: 'Book a place on a class',
    keep: false
  });

  add('teaser', 'Teaser', NEWS, 'Build curiosity with a dark panel, one line and a single bright button. Reveal later.', 'night', { t_font: 'sans', t_size: 40, btn_radius: 0 }, 'dark', {
    pic: 'studio-hero',
    kicker: 'COMING FRIDAY',
    title: 'Something new is almost ready',
    body: 'We have been working on it for months. On Friday at 10:00 we will show you.',
    btn: 'Remind me on Friday',
    note: 'Only people on this list will see it first.',
    keep: false
  });

  add('words-only', 'Words only', NEWS, 'A newsletter with no pictures, carried by short, lively writing and four items.', 'slate', { t_font: 'serif', t_size: 28, btn_radius: 0, p_font: 'serif' }, 'digest', {
    kicker: 'THE FRIDAY NOTE',
    title: 'Four things worth your five minutes',
    body: 'No pictures this week. Just four short pieces and why each one matters.',
    items: [
      ['The shop that stayed open through the flood', 'How a family kept 300 neighbours supplied for nine days.'],
      ['Why the price of rice moved twice in a week', 'A plain explanation of a confusing few days.'],
      ['A small change that saved one café £90 a month', 'It involved a timer and a kettle.'],
      ['The question we get asked most often', 'And the answer, in two sentences.']
    ],
    btn: 'Read this week’s pieces online'
  });

  add('colour-blocks', 'Colour blocks', NEWS, 'Each section on its own pastel colour, with a picture, a short text and a button.', 'berry', { t_font: 'sans', t_size: 32, btn_radius: 30 }, 'blocks', {
    kicker: 'THIS MONTH',
    title: 'Three things, three colours',
    body: 'A quick look at what happened in the shop in April.',
    sections: [
      { bg: PC.peach[0], ink: PC.peach[1], pic: 'weaver-hero', title: 'Meet the weavers', body: 'Twelve women make our baskets. This month we visited their workshop.', btn: 'Meet the weavers' },
      { bg: PC.aqua[0], ink: PC.aqua[1], pic: 'mango-hero', title: 'The mango season is here', body: 'Fresh mangoes arrive every Tuesday until the end of May.', btn: 'See what is in' },
      { bg: PC.lilac[0], ink: PC.lilac[1], pic: 'flowers-product-1', title: 'Flowers for Mother’s Day', body: 'Order by Wednesday and we will deliver on Saturday.', btn: 'Order flowers' }
    ],
    btn: 'Visit the shop',
    keep: false
  });

  add('pastel-products', 'Pastel product blocks', NEWS, 'Three products, each on its own pastel colour, with a short line and a button.', 'plum', { t_font: 'sans', t_size: 32, btn_radius: 30 }, 'blocks', {
    kicker: 'NEW IN',
    title: 'Three new things, one at a time',
    body: 'Each one is in the shop from today.',
    sections: [
      { bg: PC.butter[0], ink: PC.butter[1], item: ['bag-product-2', 'Orange leather handbag', '£42.00', 'Soft leather with two inside pockets.', 'An orange leather handbag'], title: 'The handbag', body: 'Light enough for every day and roomy enough for a book.', btn: 'See the handbag' },
      { bg: PC.mint[0], ink: PC.mint[1], item: ['scarf-product-1', 'Knitted scarf', '£18.00', 'Soft wool in four colours.', 'A folded knitted scarf'], title: 'The scarf', body: 'Four colours, all made from the same soft wool.', btn: 'See the scarf' },
      { bg: PC.blush[0], ink: PC.blush[1], item: ['plant-product-1', 'Potted plant', '£15.00', 'Easy to care for. Comes in a clay pot.', 'A small green plant in a clay pot'], title: 'The plant', body: 'Easy to look after, and it comes in a clay pot.', btn: 'See the plant' }
    ],
    btn: 'See everything new',
    keep: false
  });
})();
