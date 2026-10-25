/* ==========================================================================
   More starter layouts
   Loaded after mr-templates.js. These add to MR.TEMPLATES in the same form:
   ordinary blocks, a look of their own, finished writing with invented facts.
   Sending is held back until the facts have been replaced (MR.sampleTextLeft),
   except lines listed in `keep`, which are neutral and may stay.

   They are grouped by what a sender is trying to do (MR.TEMPLATE_GROUPS), not
   by how they look.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};
  var K = MR.tplKit;
  if (!K || !MR.TEMPLATES) return;
  var heading = K.heading, text = K.text, button = K.button, divider = K.divider, spacer = K.spacer,
      panel = K.panel, bullets = K.bullets, story = K.story, social = K.social, pic = K.pic,
      sidePic = K.sidePic, productWith = K.productWith;

  /* ---- colour sets: a page colour, an ink, a button, and two panel tints ---- */
  var PAL = {
    sage:  { page: '#e9efe6', ink: '#17301f', btn: '#1f5d3a', dark: '#173f2a', darkLink: '#b7e4c7', light: '#eaf3ec' },
    sand:  { page: '#f3ebdd', ink: '#2e2012', btn: '#8a4b14', dark: '#3b2410', darkLink: '#f0d3a8', light: '#f8f1e4' },
    ocean: { page: '#e6eef7', ink: '#0f2740', btn: '#124f8c', dark: '#0f2740', darkLink: '#bcd9f5', light: '#edf3fa' },
    plum:  { page: '#efe4ee', ink: '#3a1237', btn: '#6b1f63', dark: '#3a1237', darkLink: '#ecc8e7', light: '#f6eef6' },
    clay:  { page: '#f6e6df', ink: '#4a1d0f', btn: '#a8431f', dark: '#4a1d0f', darkLink: '#f5c5b0', light: '#fbefe9' },
    night: { page: '#1c2030', ink: '#1c2030', btn: '#2b3a8c', dark: '#1c2030', darkLink: '#f2c14e', light: '#eef0f8' },
    gold:  { page: '#f7f0d8', ink: '#2b2410', btn: '#7a5a00', dark: '#2b2410', darkLink: '#f0d27a', light: '#fbf6e3' },
    rose:  { page: '#f9e6ea', ink: '#4a1020', btn: '#a3153f', dark: '#4a1020', darkLink: '#f7b8c7', light: '#fdf0f3' },
    slate: { page: '#eceff1', ink: '#1c2a33', btn: '#263c4a', dark: '#1c2a33', darkLink: '#d8c58a', light: '#f3f5f6' },
    teal:  { page: '#def0ee', ink: '#0d3b3a', btn: '#0f6b66', dark: '#0d3b3a', darkLink: '#a8e0db', light: '#e9f6f4' },
    sun:   { page: '#fff3c4', ink: '#1a1208', btn: '#1a1208', dark: '#1a1208', darkLink: '#f2a900', light: '#fff8de' },
    coral: { page: '#ffe3d9', ink: '#1a1208', btn: '#c2410c', dark: '#1a1208', darkLink: '#ffb089', light: '#fff0ea' }
  };
  function look(p, o) {
    var c = PAL[p];
    return Object.assign({ _band: c.page, page: c.page, body: '#ffffff', p_font: 'sans', t_font: 'serif', p_size: 16, line: 'relaxed',
      t_size: 30, t_colour: c.ink, btn_bg: c.btn, btn_text: '#ffffff', btn_radius: 4, btn_border: 0, link_colour: c.btn, pad: 32 }, o || {});
  }
  function dark(p, blocks) { var c = PAL[p]; return panel('dark', blocks, { bg: c.dark, ink: '#ffffff', link: c.darkLink }); }
  function soft(p, blocks) { var c = PAL[p]; return panel('light', blocks, { bg: c.light, ink: c.ink, link: c.btn }); }
  function add(id, name, group, summary, pal, over, blocks, keep) {
    MR.TEMPLATES.push({ id: id, name: name, category: group, summary: summary, style: look(pal, over), keep: keep || [], blocks: blocks });
  }
  var G = MR.TEMPLATE_GROUPS.map(function (g) { return g.name; });
  var NEWS = G[0], ANN = G[1], EVENT = G[2], SALE = G[3], WELCOME = G[4], THANKS = G[5], RAISE = G[6], ASK = G[7];
  var REPLY = 'Reply to this email at any time. A person reads it.';

  /* ================= Newsletters ================= */
  add('monthly-roundup', 'Monthly roundup', NEWS, 'A short opening, one picture and four items, each with its own link.', 'sage', {}, [
    text('The October roundup', 'left'),
    heading('Four things worth your time this month', 'left'),
    sidePic('monthly-roundup-side', 'right', 'Start here\nOur new guide to reading a balance sheet in ten minutes has been downloaded more than any other this year.'),
    divider(),
    story('Export rules changed on 1 October', 'What the new paperwork asks for and who it affects.'),
    story('Three grants closing before the end of the month', 'Eligibility, amounts and deadlines in one place.'),
    story('Member profile: a bakery that went online', 'How it moved from one stall to three delivery routes.'),
    story('Recording: our September panel', 'Fifty minutes on pricing, with the slides attached.'),
    spacer('small'), button('left', false, 'Read everything online'),
    spacer('medium'), divider(), social()
  ]);

  add('member-spotlight', 'Member spotlight', NEWS, 'One member, one picture, a quote and what others can learn.', 'sand', {}, [
    pic('member-spotlight-hero'),
    text('MEMBER SPOTLIGHT', 'center'),
    heading('Amara runs a six-person print shop and has doubled her orders', 'center'),
    text('Amara Bello opened her shop in 2021 with one machine. She now prints for schools, churches and four local firms. We asked what changed.', 'center'),
    soft('sand', [heading('“I stopped waiting for customers and started asking the ones I had.”', 'center', 'small'), text('Amara Bello, owner', 'center')]),
    spacer('small'),
    heading('What you can take from it', 'left', 'small'),
    bullets('Ask every customer for one name they would recommend\nFollow up within a week of delivery\nPut prices on the website, not behind a phone call'),
    spacer('small'), button('left', false, 'Read the full interview')
  ]);

  add('market-brief', 'Market brief', NEWS, 'Three headline figures, what they mean and one thing to watch.', 'slate', { t_font: 'sans', btn_radius: 0 }, [
    text('WEEK 42  |  MARKET BRIEF', 'left'),
    heading('Prices eased, volumes held', 'left'),
    dark('slate', [
      heading('4.2%', 'center'), text('Average price change on the month', 'center'),
      heading('18,400', 'center'), text('Tonnes shipped this week', 'center'),
      text('Figures are examples. Replace them with your own and name the source.', 'center')
    ]),
    spacer('small'),
    text('Prices came down for a second month, but the volume moving through the main port did not fall with them. Buyers appear to be stocking up before the end of the quarter.', 'left'),
    heading('Watch next week', 'left', 'small'),
    bullets('The central bank meeting on Thursday\nFreight rates on the northern route\nThe harvest estimate due on Friday'),
    spacer('small'), button('left', false, 'Read the full brief')
  ]);

  add('weekly-three', 'Three things this week', NEWS, 'A short weekly note with three numbered items and no pictures to load.', 'ocean', { t_font: 'sans', t_size: 28 }, [
    pic('weekly-three-hero'),
    heading('Three things this week', 'left'),
    text('A two-minute read to start your week.', 'left'),
    divider(),
    text('1. A new rule on invoices\nFrom 1 November every invoice must show your tax number. A template is on our site.', 'left'),
    text('2. Training in November\nTwo half-day sessions on pricing, both free for members. Places are limited to 30.', 'left'),
    text('3. A reader question\nCan I sell to the public sector as a new business? Short answer: yes, and here is how.', 'left'),
    spacer('small'), button('left', false, 'Read more'), divider(),
    text('Know someone who would like this? Forward it to them.', 'left')
  ], ['Know someone who would like this? Forward it to them.']);

  add('editors-note', 'Letter from the editor', NEWS, 'A personal opening, one image, and a short list of what is inside.', 'plum', { t_size: 32 }, [
    pic('editors-note-hero'),
    text('Dear reader,', 'left'),
    text('This month we looked at why so many small firms struggle to get paid on time, and what the ones that do not struggle have in common. The answers surprised us.', 'left'),
    text('Inside this issue:', 'left'),
    bullets('Why late payment is a habit, not an accident\nA one-page payment terms template\nTwo members on how they chase a debt politely'),
    text('As always, tell us what you think by replying to this email.', 'left'),
    text('With best wishes,\nYour name\nEditor', 'left'),
    spacer('small'), button('left', false, 'Read this issue')
  ], ['As always, tell us what you think by replying to this email.']);

  add('interview', 'Interview', NEWS, 'A question-and-answer piece with a picture at the side.', 'clay', {}, [
    text('IN CONVERSATION', 'left'),
    heading('“The first year taught us what not to build”', 'left'),
    sidePic('interview-side', 'left', 'Who\nNneka Adeyemi founded a logistics start-up in 2022 and now manages 40 drivers across three cities.'),
    heading('What would you do differently?', 'left', 'small'),
    text('Start smaller. We opened in three cities at once and spent a year fixing mistakes in all of them.', 'left'),
    heading('What is the best advice you were given?', 'left', 'small'),
    text('Write down what you will stop doing, as well as what you will start.', 'left'),
    heading('What next?', 'left', 'small'),
    text('A drivers’ cooperative, if we can get the numbers to work.', 'left'),
    spacer('small'), button('left', false, 'Read the full interview')
  ]);

  /* ================= Announcements ================= */
  add('new-service', 'New service', ANN, 'A large picture, what is new, who it is for and one button.', 'teal', {}, [
    pic('new-service-hero'),
    text('NEW', 'center'),
    heading('Same-day quotes are now open to every member', 'center'),
    text('Until now, quotes took three working days. From today, send us your details before noon and you will have a price by the end of the day.', 'center'),
    button('center', false, 'Ask for a quote'),
    spacer('medium'),
    heading('How it works', 'left', 'small'),
    bullets('Fill in a short form with what you need\nWe reply by email before 17:00\nAccept the quote and we start the next day'),
    divider(), text('Questions? Reply to this email and we will help.', 'left')
  ], ['Questions? Reply to this email and we will help.']);

  add('new-hire', 'Meet a new colleague', ANN, 'Introduce a new person with a picture, a short bio and how to reach them.', 'rose', {}, [
    heading('Please welcome Tunde Okoye', 'left'),
    sidePic('new-hire-side', 'left', 'Joining us as head of partnerships\nTunde has spent ten years in trade finance and will lead our work with banks and chambers of commerce.'),
    text('He starts on Monday 2 November and will be meeting members over the following weeks.', 'left'),
    soft('rose', [heading('Say hello', 'left', 'small'), text('You can reach Tunde at the address below, or reply to this email and we will pass your message on.', 'left')]),
    spacer('small'), button('left', false, 'Meet the team')
  ]);

  add('partnership', 'Partnership announced', ANN, 'Two organisations, one agreement, and what it means for readers.', 'ocean', { t_font: 'sans' }, [
    pic('partnership-hero'),
    heading('We have teamed up with the Northern Trade Council', 'left'),
    text('From January, our members can use the Council’s export desk at no extra cost. It covers customs advice, documents and introductions to buyers in six markets.', 'left'),
    soft('ocean', [heading('What changes for you', 'left', 'small'), bullets('Free access to the export desk\nA named contact for your first shipment\nA joint workshop in February')]),
    spacer('small'), button('left', false, 'See the full details'),
    divider(), text('You do not need to do anything now. We will write again in December.', 'left')
  ], ['You do not need to do anything now. We will write again in December.']);

  add('opening-times', 'Change to opening times', ANN, 'A plain notice for hours, closures and holidays. No pictures.', 'slate', { t_font: 'sans', btn_radius: 0 }, [
    heading('Our hours are changing', 'left'),
    text('From Monday 2 November we will open one hour earlier and close one hour earlier, Monday to Friday.', 'left'),
    soft('slate', [heading('New hours', 'left', 'small'), bullets('Monday to Friday: 8:00 to 16:00\nSaturday: closed\nPublic holidays: closed')]),
    spacer('small'),
    text('The phone line follows the same hours. Email is read every day, including weekends.', 'left'),
    button('left', false, 'See holiday dates')
  ]);

  add('rebrand', 'We have a new look', ANN, 'Show a new name or identity and say what has not changed.', 'coral', { t_font: 'sans', btn_radius: 24 }, [
    pic('rebrand-hero'),
    heading('A new name, the same people', 'center'),
    text('After ten years we are changing our name and look. Our team, our prices and our email addresses stay exactly as they are.', 'center'),
    button('center', false, 'See the new site'),
    spacer('medium'),
    { type: 'columns', left: 'What is new\nOur name, logo and website.', right: 'What is the same\nYour account, your contact and your prices.' },
    divider(), text('If anything looks wrong, reply and tell us.', 'center')
  ], ['If anything looks wrong, reply and tell us.']);

  add('important-notice', 'Important notice', ANN, 'A serious, calm message on a dark panel, for changes people must act on.', 'night', { t_font: 'sans', btn_radius: 0 }, [
    dark('night', [
      spacer('small'),
      text('IMPORTANT', 'center'),
      heading('Action needed by 30 November', 'center'),
      text('We are closing the old payment portal. If you pay by direct debit through it, you need to set up the new one before the end of the month, or your next payment will fail.', 'center'),
      button('center', true, 'Set up the new portal'),
      spacer('small')
    ]),
    spacer('medium'),
    text('Setting up takes about five minutes. If you need help, reply to this email.', 'center')
  ], ['Setting up takes about five minutes. If you need help, reply to this email.']);

  /* ================= Events ================= */
  add('webinar', 'Webinar invitation', EVENT, 'Date, time, what you will learn and a link to register.', 'ocean', { t_font: 'sans' }, [
    pic('webinar-hero'),
    text('FREE WEBINAR', 'left'),
    heading('How to price your product for export', 'left'),
    soft('ocean', [bullets('Wednesday 18 November, 13:00 to 14:00 (GMT)\nOnline, with a recording sent afterwards\nFree for everyone')]),
    spacer('small'),
    heading('You will learn', 'left', 'small'),
    bullets('How to work out your real cost per unit\nWhat to add for shipping and duty\nWhen to say no to a price'),
    text('Your host is Folake Ade, who has priced exports for 15 years. There will be time for questions.', 'left'),
    button('left', false, 'Save my place')
  ]);

  add('save-the-date', 'Save the date', EVENT, 'Date first, details to follow. A short, bold first notice.', 'gold', { t_size: 36 }, [
    pic('save-the-date-hero'),
    text('SAVE THE DATE', 'center'),
    heading('Annual meeting: Saturday 12 December', 'center'),
    text('Please keep the day free. Full details, the agenda and how to book will follow in early November.', 'center'),
    button('center', false, 'Add it to my calendar'),
    spacer('medium'), divider(),
    text('Cannot come in person? There will be a way to join online.', 'center')
  ], ['Cannot come in person? There will be a way to join online.']);

  add('workshop-series', 'Workshop series', EVENT, 'Three sessions, each with its own date, and one way to sign up.', 'teal', {}, [
    heading('A three-part workshop on writing a business plan', 'left'),
    sidePic('workshop-series-side', 'right', 'For first-time founders\nSmall groups, a printed workbook and time to ask questions.'),
    soft('teal', [
      text('Session 1  |  Tuesday 3 November\nWhat you are selling and to whom', 'left'),
      text('Session 2  |  Tuesday 10 November\nMoney in, money out', 'left'),
      text('Session 3  |  Tuesday 17 November\nPutting it on one page', 'left')
    ]),
    spacer('small'),
    text('All three sessions run from 18:00 to 20:00 at the Central Library. £45 for the series, £30 for members.', 'left'),
    button('left', false, 'Book the series')
  ]);

  add('networking', 'Networking evening', EVENT, 'An informal invitation with the time, the place and what to bring.', 'plum', {}, [
    pic('networking-hero'),
    heading('Come and meet the people behind the businesses', 'center'),
    text('An informal evening for members and guests. No talks, no slides. Just a chance to meet people who do what you do, or what you need.', 'center'),
    soft('plum', [bullets('Thursday 26 November, from 18:30\nThe Garden Room, 14 Harbour Road\nLight food provided\nFree for members, £10 for guests')]),
    spacer('small'),
    heading('Bring', 'left', 'small'),
    bullets('A few business cards, or your phone with your details\nOne question you would like help with'),
    button('center', false, 'Reserve a place')
  ]);

  add('event-reminder', 'Event reminder', EVENT, 'A short reminder for tomorrow: time, place, how to get there.', 'sun', { t_font: 'sans', btn_radius: 0 }, [
    text('REMINDER', 'left'),
    heading('Tomorrow at 18:30: the open evening', 'left'),
    text('A quick note to say we are looking forward to seeing you.', 'left'),
    soft('sun', [bullets('Doors open at 18:15\nThe Old Library, 5 Church Street\nStep-free entrance on the left of the building')]),
    spacer('small'),
    heading('Getting there', 'left', 'small'),
    text('The nearest station is a seven-minute walk. There is bicycle parking at the front and a car park behind the building.', 'left'),
    button('left', false, 'Open the map'),
    divider(), text('Cannot make it now? Reply and let us know so we can free your place.', 'left')
  ], ['Cannot make it now? Reply and let us know so we can free your place.']);

  add('event-followup', 'Event follow-up', EVENT, 'Thanks, a link to the recording or slides, and what happens next.', 'teal', {}, [
    pic('event-followup-hero'),
    heading('Thank you for joining us', 'center'),
    text('It was good to see so many of you. Here is everything from the session, in one place.', 'center'),
    button('center', false, 'Watch the recording'),
    spacer('medium'),
    heading('Also from the session', 'left', 'small'),
    bullets('The slides, as a PDF\nA list of the questions we did not have time to answer\nThe reading list our speakers mentioned'),
    soft('teal', [heading('Coming up', 'left', 'small'), text('The next session is on Wednesday 9 December. We will send the details next week.', 'left')]),
    spacer('small'), text('Tell us how it went by replying to this email.', 'left')
  ], ['Tell us how it went by replying to this email.']);

  add('awards', 'Awards invitation', EVENT, 'A formal invitation to a dinner or ceremony, with dress and timings.', 'night', { t_size: 34, btn_radius: 0 }, [
    pic('awards-hero'),
    dark('night', [
      text('YOU ARE INVITED', 'center'),
      heading('The Small Business Awards 2026', 'center'),
      text('An evening to celebrate the people who keep our high streets and markets running. Finalists will be announced on the night.', 'center'),
      button('center', true, 'Confirm your attendance')
    ]),
    spacer('small'),
    soft('night', [bullets('Friday 4 December, 19:00 for 19:30\nThe Grand Hall, Station Road\nSmart dress\nA three-course meal is included')]),
    spacer('small'), text('Please reply by Friday 20 November so we can plan the tables.', 'center')
  ], ['Please reply by Friday 20 November so we can plan the tables.']);

  /* ================= Sales and offers ================= */
  add('weekend-sale', 'Weekend sale', SALE, 'A bold price message, a deadline and one place to shop.', 'sun', { t_font: 'sans', t_size: 38, btn_radius: 0 }, [
    pic('weekend-sale-hero'),
    text('THIS WEEKEND ONLY', 'center'),
    heading('Everything 25% off until Sunday midnight', 'center'),
    text('No code needed. The discount is taken at the checkout, on every full-price item in the shop.', 'center'),
    button('center', false, 'Shop the sale'),
    spacer('medium'),
    soft('sun', [text('Free delivery on orders over £40. Offer ends Sunday at 23:59.', 'center')]),
    spacer('small'), text('Sale items and gift cards are not included.', 'center')
  ], ['Sale items and gift cards are not included.']);

  add('new-arrivals', 'New arrivals', SALE, 'Two new products, each with a picture, a price and a button.', 'clay', {}, [
    heading('New in this week', 'center'),
    text('Two pieces that arrived on Monday and are already going fast.', 'center'),
    productWith('new-arrivals-product-1', 'Arch vase', '28.00', 'Hand-glazed stoneware, 24 cm tall.', 'Arch vase'),
    divider(),
    productWith('new-arrivals-product-2', 'Tile tray', '19.00', 'A small tray for keys, rings or loose change.', 'Tile tray'),
    spacer('small'), button('center', false, 'See everything new')
  ]);

  add('product-spotlight', 'Product spotlight', SALE, 'One product, its story, three reasons to buy and a button.', 'rose', {}, [
    pic('product-spotlight-hero'),
    text('IN FOCUS', 'center'),
    heading('The Bloom candle, poured by hand', 'center'),
    text('Each candle is poured in small batches in our workshop and burns for more than 40 hours.', 'center'),
    bullets('Soy wax and a cotton wick\nScented with essential oils\nRefill tins available'),
    button('center', false, 'Buy the Bloom candle'),
    spacer('small'), soft('rose', [text('£22.00  |  Free delivery on orders over £40', 'center')])
  ]);

  add('back-in-stock', 'Back in stock', SALE, 'Tell people the thing they asked about is available again.', 'sand', {}, [
    heading('It is back', 'left'),
    text('You asked, and we listened. The Field Satchel is back in stock in all three colours.', 'left'),
    productWith('back-in-stock-product-1', 'Field Satchel', '65.00', 'Waxed canvas, leather straps, fits a 13-inch laptop.', 'Field Satchel'),
    spacer('small'), button('left', false, 'Buy the satchel'),
    text('Last time they sold out in nine days, so we would not wait.', 'left')
  ], ['Last time they sold out in nine days, so we would not wait.']);

  add('gift-guide', 'Gift guide', SALE, 'A short guide with a picture and two ideas at different prices.', 'plum', {}, [
    pic('gift-guide-hero'),
    heading('Gifts that are easy to wrap and hard to forget', 'center'),
    text('Our short list, in two budgets. Order by 14 December for delivery before the holiday.', 'center'),
    heading('Under £25', 'left', 'small'),
    productWith('gift-guide-product-1', 'Pocket sketchbook', '12.00', 'Thick paper, a stitched spine and a cloth cover.', 'Pocket sketchbook'),
    heading('Under £60', 'left', 'small'),
    productWith('gift-guide-product-2', 'Writing set', '48.00', 'A pen, a notebook and a leather case.', 'Writing set'),
    button('center', false, 'See the full guide')
  ]);

  add('free-delivery', 'Free delivery week', SALE, 'One clear offer, the dates, and how it works.', 'coral', { t_font: 'sans', btn_radius: 24 }, [
    pic('free-delivery-hero'),
    heading('Free delivery on every order, all week', 'center'),
    text('From Monday 9 to Sunday 15 November. No minimum spend and no code to remember.', 'center'),
    button('center', false, 'Start shopping'),
    spacer('medium'),
    { type: 'columns', left: 'Order by 14:00\nWe send it the same day.', right: 'Delivered in 2 to 3 days\nTracked, to your door.' },
    divider(), text('Applies to deliveries within the country. Overseas orders are charged as usual.', 'center')
  ], ['Applies to deliveries within the country. Overseas orders are charged as usual.']);

  add('pre-order', 'Pre-order', SALE, 'Open orders before something is ready, with a date and a reason to book now.', 'night', { t_size: 34, btn_radius: 0 }, [
    pic('pre-order-hero'),
    text('PRE-ORDER NOW', 'center'),
    heading('The 2027 planner ships in January', 'center'),
    text('Order before 30 November and get the first print run at the launch price. After that it goes up by £5.', 'center'),
    button('center', false, 'Pre-order for £18'),
    spacer('medium'),
    heading('What you get', 'left', 'small'),
    bullets('A week-to-view layout with space for notes\nSewn binding that lies flat\nRecycled paper, printed locally'),
    soft('night', [text('You are only charged when it ships. Cancel any time before then.', 'center')])
  ], ['You are only charged when it ships. Cancel any time before then.']);

  add('last-chance', 'Last chance', SALE, 'A short, plain reminder on the final day. Text only, so it loads fast.', 'sun', { t_font: 'sans', btn_radius: 0 }, [
    dark('sun', [
      text('ENDS TONIGHT', 'center'),
      heading('Last chance: 20% off ends at midnight', 'center'),
      text('This is the final reminder. After 23:59 tonight the discount ends and prices go back up.', 'center'),
      button('center', true, 'Use my 20% off')
    ]),
    spacer('small'),
    text('Use the code LASTCALL at the checkout. One use per customer.', 'center')
  ]);

  add('bundle', 'Bundle offer', SALE, 'Two items sold together at a saving, with the saving spelled out.', 'slate', { t_font: 'sans' }, [
    heading('Buy the pair and save £15', 'left'),
    text('Our two best sellers, together, for less than buying them one at a time.', 'left'),
    productWith('bundle-product-1', 'Desk lamp', '45.00', 'Warm light, a dimmer and a weighted base.', 'Desk lamp'),
    productWith('bundle-product-2', 'Cable tidy', '10.00', 'Keeps four cables in place on your desk.', 'Cable tidy'),
    soft('slate', [heading('Together: £40', 'center', 'small'), text('You save £15. Both items are added to your basket with one click.', 'center')]),
    spacer('small'), button('center', false, 'Add the bundle')
  ]);

  /* ================= Welcome ================= */
  add('welcome-code', 'Welcome with a discount', WELCOME, 'A thank-you for joining, a first-order code and what to buy first.', 'coral', { t_font: 'sans', btn_radius: 24 }, [
    pic('welcome-code-hero'),
    heading('Welcome. Here is 10% off your first order', 'center'),
    text('Thank you for joining our list. Use the code below at the checkout. It works for 14 days.', 'center'),
    soft('coral', [text('Your code', 'center'), heading('WELCOME10', 'center')]),
    spacer('small'), button('center', false, 'Start shopping'),
    spacer('medium'),
    text('Once a week we will send you one short email about what is new. You can leave at any time with the link at the bottom.', 'center')
  ], ['Once a week we will send you one short email about what is new. You can leave at any time with the link at the bottom.']);

  add('welcome-expect', 'Welcome: what to expect', WELCOME, 'Says what you will send, how often, and how to change it.', 'sand', {}, [
    pic('welcome-expect-hero'),
    heading('You are on the list', 'center'),
    text('Thank you for signing up. So you know what to expect, here is what we send and when.', 'center'),
    { type: 'columns', left: 'Every Monday\nOne short note on what is new.', right: 'Once a month\nA longer piece with a guide or a story.' },
    spacer('small'),
    text('We never send more than that, and we never share your address.', 'center'),
    button('center', false, 'Choose what you receive'),
    divider(), text(REPLY, 'center')
  ], ['We never send more than that, and we never share your address.', REPLY]);

  add('welcome-founder', 'Welcome from the founder', WELCOME, 'A personal note with a picture. Reads like a letter, not an advert.', 'sage', { t_size: 28 }, [
    text('Hello,', 'left'),
    sidePic('welcome-founder-side', 'right', 'Why I started this\nI began this business at my kitchen table in 2019, because I could not find advice that spoke plainly. That is still what we try to do.'),
    text('Over the coming weeks I will send you a few things I wish I had known at the start. If you have a question, reply to this email. I read every reply.', 'left'),
    text('Thank you for being here.', 'left'),
    text('Your name\nFounder', 'left'),
    spacer('small'), button('left', false, 'Read our story')
  ], ['Thank you for being here.']);

  add('welcome-start', 'Welcome: getting started', WELCOME, 'Three steps to get the most out of an account, with one button per step.', 'teal', {}, [
    heading('Three steps to get started', 'left'),
    sidePic('welcome-start-side', 'right', 'Takes about ten minutes\nDo them in any order. You can stop and come back at any time.'),
    soft('teal', [
      text('1. Add your details\nYour name, your organisation and a contact address.', 'left'),
      text('2. Choose your interests\nSo we send you only what is useful.', 'left'),
      text('3. Say hello\nIntroduce yourself on the members’ page.', 'left')
    ]),
    spacer('small'), button('left', false, 'Go to my account'),
    divider(), text('Stuck? Reply to this email and we will walk you through it.', 'left')
  ], ['Stuck? Reply to this email and we will walk you through it.']);

  add('welcome-member', 'Welcome to membership', WELCOME, 'Confirms a new member, lists what they now have and what to do first.', 'gold', {}, [
    pic('welcome-member-hero'),
    heading('You are now a member', 'center'),
    text('Welcome, and thank you for joining. Your membership is active from today and runs for twelve months.', 'center'),
    soft('gold', [heading('What you now have', 'left', 'small'), bullets('Access to every guide and template\nMembers’ prices on events\nA monthly briefing in your inbox\nA named person to ask for help')]),
    spacer('small'), button('center', false, 'Open the members’ area'),
    divider(), text(REPLY, 'center')
  ], [REPLY]);

  /* ================= Thank you ================= */
  add('thanks-order', 'Thanks for your order', THANKS, 'Confirms the order was received and what happens next.', 'sage', {}, [
    pic('thanks-order-hero'),
    heading('Thank you for your order', 'center'),
    text('We have it and we are getting it ready. You will get another email with tracking details when it leaves us.', 'center'),
    soft('sage', [heading('What happens next', 'left', 'small'), bullets('We pack it within one working day\nYou get a tracking link by email\nIt arrives in 2 to 3 working days')]),
    spacer('small'), button('center', false, 'View my order'),
    divider(), text('If something is wrong with your order, reply to this email and we will put it right.', 'center')
  ], ['If something is wrong with your order, reply to this email and we will put it right.']);

  add('thanks-attending', 'Thanks for coming', THANKS, 'A warm thank-you to people who came, with a link to share feedback.', 'rose', {}, [
    pic('thanks-attending-hero'),
    heading('Thank you for being there', 'center'),
    text('Your time and your questions made the evening. We hope you left with a few good ideas and a few new contacts.', 'center'),
    button('center', false, 'Tell us how it went'),
    spacer('medium'),
    soft('rose', [heading('Next time', 'left', 'small'), text('Our next event is on 18 February. Members get first choice of seats.', 'left')]),
    spacer('small'), text('With thanks,\nYour name\nOn behalf of the team', 'center')
  ], ['With thanks,\nYour name\nOn behalf of the team']);

  add('thanks-gift', 'Thanks for your gift', THANKS, 'A plain letter that thanks a donor and says what the gift did. No pictures.', 'plum', { t_size: 26, btn_radius: 0 }, [
    text('Dear friend,', 'left'),
    text('Thank you for your gift of £40 on 3 October. I wanted to write myself to say how much it means.', 'left'),
    text('This month your gift, together with others, bought school books for 60 children. The first of them were handed out last Friday.', 'left'),
    text('Your receipt is attached to a separate email. If you have any questions, you can reply to this one and I will answer.', 'left'),
    text('With gratitude,\nYour name\nDirector', 'left')
  ]);

  add('thanks-volunteers', 'Thanks to volunteers', THANKS, 'Recognises the people who gave their time, with the figures and a date to remember.', 'sun', { t_font: 'sans', btn_radius: 24 }, [
    pic('thanks-volunteers-hero'),
    heading('You gave 1,240 hours this year', 'center'),
    text('That is thirty working weeks of time, given freely. Because of you, we ran 84 sessions and welcomed more than 900 visitors.', 'center'),
    soft('sun', [heading('Save the date', 'center', 'small'), text('A thank-you lunch for every volunteer: Saturday 5 December, 12:30, at the Community Hall.', 'center')]),
    spacer('small'), button('center', false, 'Let us know you are coming'),
    divider(), text('From all of us: thank you.', 'center')
  ], ['From all of us: thank you.']);

  /* ================= Fundraising and membership ================= */
  add('annual-appeal', 'Annual appeal', RAISE, 'A story, a clear ask, three suggested amounts and a deadline.', 'clay', {}, [
    pic('annual-appeal-hero'),
    heading('Help us reach 500 more families this winter', 'center'),
    text('Last winter we delivered food parcels to 1,200 families. This year the need is higher, and our stores are half what they were.', 'center'),
    soft('clay', [heading('What your gift does', 'left', 'small'), bullets('£15 feeds a family for a week\n£40 covers a family for a month\n£120 stocks a shelf for a whole week')]),
    spacer('small'), button('center', false, 'Give now'),
    spacer('small'), text('Please give before 31 December so that your gift reaches families in January.', 'center'),
    divider(), text('Registered charity number 000000. Replace with your own.', 'center')
  ]);

  add('matched-gifts', 'Matched giving', RAISE, 'Explains that gifts are doubled for a limited time, with a progress line.', 'gold', { t_size: 34 }, [
    pic('matched-gifts-hero'),
    heading('Your gift will be doubled until Friday', 'center'),
    text('A local firm has promised to match every gift up to £5,000 until Friday 20 November. That makes every pound count twice.', 'center'),
    dark('gold', [text('RAISED SO FAR', 'center'), heading('£3,160 of £5,000', 'center'), text('Figures are examples. Replace them with your own.', 'center')]),
    spacer('small'), button('center', false, 'Double my gift'),
    divider(), text('Thank you to the firm that made this possible.', 'center')
  ], ['Thank you to the firm that made this possible.']);

  add('join-member', 'Invite to join', RAISE, 'Persuades someone to become a member: benefits, price and one button.', 'ocean', {}, [
    pic('join-member-hero'),
    heading('Become a member for £60 a year', 'center'),
    text('Members get the guides, the events and a voice in what we do next. Join in under two minutes.', 'center'),
    { type: 'columns', left: 'Guides and templates\nEvery one we publish, free to download.', right: 'Events at members’ prices\nUsually 30% less than guests pay.' },
    spacer('small'),
    soft('ocean', [heading('“It paid for itself in the first month.”', 'center', 'small'), text('A member, Ibadan', 'center')]),
    spacer('small'), button('center', false, 'Join today')
  ]);

  add('renewal', 'Membership renewal', RAISE, 'A calm reminder with the renewal date, the price and a one-click link.', 'slate', { t_font: 'sans', btn_radius: 0 }, [
    heading('Your membership ends on 30 November', 'left'),
    text('Thank you for being a member this year. To keep your access without a break, please renew before the date above.', 'left'),
    soft('slate', [bullets('Renewal price: £60 for twelve months\nYour guides and events stay available\nNo change to your details unless you want one')]),
    spacer('small'), button('left', false, 'Renew my membership'),
    text('If you would prefer not to renew, you do not need to do anything. We would be grateful if you told us why by replying to this email.', 'left')
  ], ['If you would prefer not to renew, you do not need to do anything. We would be grateful if you told us why by replying to this email.']);

  add('impact-report', 'Impact report', RAISE, 'The year in figures, one story and a thank-you to supporters.', 'teal', {}, [
    pic('impact-report-hero'),
    heading('What your support did in 2026', 'center'),
    dark('teal', [heading('3,400', 'center'), text('People helped', 'center'), heading('62', 'center'), text('Workshops held', 'center'), text('Figures are examples. Replace them with your own.', 'center')]),
    spacer('small'),
    sidePic('impact-report-side', 'left', 'One story\nA tailor who joined our first workshop in March now employs two apprentices and sells to three shops in the city.'),
    heading('What comes next', 'left', 'small'),
    text('In 2027 we will open a second site and double the number of workshops.', 'left'),
    button('center', false, 'Read the full report')
  ]);

  add('sponsor-project', 'Sponsor a project', RAISE, 'Asks a business to back one named project, with what it will cost and return.', 'teal', {}, [
    pic('sponsor-project-hero'),
    text('SPONSORSHIP', 'left'),
    heading('Put your name on the 2027 youth training fund', 'left'),
    text('We are looking for three local firms to sponsor training places for 60 young people next year.', 'left'),
    soft('teal', [heading('What it involves', 'left', 'small'), bullets('£5,000 per sponsor, per year\nYour name on every certificate we issue\nA yearly report on where your money went')]),
    spacer('small'), button('left', false, 'Talk to us about sponsoring'),
    divider(), text('You can reply to this email and I will call you at a time that suits you.', 'left')
  ], ['You can reply to this email and I will call you at a time that suits you.']);

  /* ================= Feedback and updates ================= */
  add('review-request', 'Ask for a review', ASK, 'A short request a week after a purchase, with one button to the review page.', 'sun', { t_font: 'sans', btn_radius: 24 }, [
    pic('review-request-hero'),
    heading('How did we do?', 'center'),
    text('It has been a week since your order arrived. If you have a minute, a short review helps other people choose, and helps us get better.', 'center'),
    button('center', false, 'Leave a review'),
    spacer('medium'),
    text('It takes about one minute. Honest is best.', 'center')
  ], ['It takes about one minute. Honest is best.']);

  add('we-miss-you', 'We miss you', ASK, 'Reaches people who have gone quiet, with a reason to come back.', 'plum', {}, [
    pic('we-miss-you-hero'),
    heading('It has been a while', 'center'),
    text('We have not seen you for a few months, and a lot has changed. A few things you may have missed:', 'center'),
    bullets('A new guide to getting paid on time\nA monthly drop-in for members\nA simpler way to renew'),
    button('center', false, 'Come back and take a look'),
    spacer('medium'), divider(),
    text('If you would rather not hear from us, the link at the bottom of this email lets you leave in one click.', 'center')
  ], ['If you would rather not hear from us, the link at the bottom of this email lets you leave in one click.']);

  add('update-details', 'Check your details', ASK, 'Asks people to confirm their details or choose what they hear about.', 'slate', { t_font: 'sans', btn_radius: 0 }, [
    heading('Are we sending you the right things?', 'left'),
    text('We would like to be sure we have your details right and that you only get what is useful to you.', 'left'),
    soft('slate', [bullets('Check your name and organisation\nChoose the topics you want to hear about\nSet how often you hear from us')]),
    spacer('small'), button('left', false, 'Update my details'),
    text('It takes about a minute, and you can change it again at any time.', 'left')
  ], ['It takes about a minute, and you can change it again at any time.']);

  add('refer-friend', 'Refer a friend', ASK, 'Asks people to pass the word on, with a simple reward and one link to share.', 'coral', { t_font: 'sans', btn_radius: 24 }, [
    pic('refer-friend-hero'),
    heading('Know someone who would like this?', 'center'),
    text('Tell a friend or a colleague. When they join, you both get one month free.', 'center'),
    soft('coral', [text('Your personal link', 'center'), text('Paste your referral link here', 'center')]),
    spacer('small'), button('center', false, 'Share my link'),
    divider(), text('There is no limit to how many people you can refer.', 'center')
  ], ['There is no limit to how many people you can refer.']);

  if (MR.tplNormalise) MR.tplNormalise();
})();
