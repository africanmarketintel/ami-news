/* More starter layouts, part 5: seasonal and holidays, and trade and business.
   The words, dates, places and prices are examples to replace. Dates of
   religious festivals are left out on purpose, as they change each year. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX) return;
  var X = MR.tplX, G = X.G, add = X.add;
  var SEASON = G['Seasonal and holidays'], TRADE = G['Trade and business'];
  var REPLY = 'Reply to this email at any time. A person reads it.';

  /* ================= Seasonal and holidays ================= */
  add('ramadan-greeting', 'Ramadan greeting', SEASON, 'A respectful message at the start of the month, with any change to opening hours.', 'night', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'dark', {
    pic: 'lanterns-hero',
    kicker: 'RAMADAN KAREEM',
    title: 'Wishing you a peaceful month',
    body: 'From everyone at our company, we wish those observing a blessed and peaceful Ramadan.',
    btn: 'See our opening hours',
    list: ['Shorter opening hours during the month', 'Evening deliveries are available after sunset', 'Our team is happy to adjust meeting times'],
    listTitle: 'During Ramadan',
    note: REPLY
  });

  add('eid-greeting', 'Eid greeting', SEASON, 'A warm, short greeting for Eid, with a small offer if you wish.', 'jade', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'celebration-hero',
    kicker: 'EID MUBARAK',
    title: 'Wishing you joy with family and friends',
    body: 'Thank you for being part of our year. We hope the days ahead are full of good company and good food.',
    list: ['Our office is closed for the holiday', 'Orders will be sent when we reopen', 'Urgent matters: email us and we will reply'],
    listTitle: 'Holiday hours',
    btn: 'See our holiday hours',
    note: 'With best wishes from all of us.'
  });

  add('christmas-greeting', 'Christmas greeting', SEASON, 'A seasonal thank-you with the dates you are closed.', 'scarlet', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'festive-lights-hero',
    kicker: 'SEASON’S GREETINGS',
    title: 'Thank you for a good year',
    body: 'It has been a pleasure to work with you. We wish you a happy and restful holiday.',
    list: ['Last dispatch: Wednesday 23 December', 'Closed from 24 December to 2 January', 'Reopening: Monday 4 January'],
    listTitle: 'Our holiday dates',
    btn: 'See what is new for January',
    note: 'With warm wishes from all of us.'
  });

  add('christmas-offer', 'Christmas gift offer', SEASON, 'A festive offer with a deadline for delivery by Christmas Eve.', 'sunset', { t_font: 'sans', t_size: 36, btn_radius: 24 }, 'code', {
    pic: 'gift-ribbon-hero',
    kicker: 'GIFTS FOR EVERYONE',
    title: 'Order by 18 December for delivery before Christmas',
    body: 'Hand-wrapped gifts from small makers, with free delivery on orders over £40.',
    codeLabel: 'USE CODE',
    code: 'GIFTS15',
    terms: '15 per cent off gift sets until Friday 18 December.',
    btn: 'Find a gift',
    note: 'Last order date for Christmas delivery: Friday 18 December.'
  });

  add('new-year-greeting', 'Happy New Year', SEASON, 'A short, hopeful message for the first week of January.', 'cobalt', { t_font: 'serif', t_size: 38, btn_radius: 30 }, 'centre', {
    pic: 'fireworks-hero',
    kicker: 'HAPPY NEW YEAR',
    title: 'Here is to a good one',
    body: 'Thank you for being with us last year. We have some plans for this one, and we would like to share them with you soon.',
    list: ['New sessions every month', 'A new directory in March', 'Our biggest conference in November'],
    listTitle: 'What to look forward to',
    btn: 'See the year ahead',
    note: REPLY
  });

  add('year-in-review', 'Our year in review', SEASON, 'Five figures and three highlights from the year, with thanks.', 'gold', { t_font: 'serif', btn_radius: 4 }, 'figures', {
    pic: 'year-review-hero',
    kicker: 'THE YEAR IN REVIEW',
    title: 'What we did together in 2026',
    body: 'A look back at what you helped make possible this year.',
    figs: ['1,240\nnew members', '38\ncountries', '212\nintroductions made', '16\nevents held'],
    after: 'Highlights: our first conference in Lagos, a new guide for first-time exporters and a record number of introductions in October.',
    btn: 'Read the full review',
    note: 'Thank you for a year of support.'
  });

  add('easter-greeting', 'Easter greeting', SEASON, 'A friendly greeting with the dates of the holiday and any special hours.', 'lime', { t_font: 'serif', btn_radius: 30 }, 'centre', {
    pic: 'spring-flowers-hero',
    kicker: 'HAPPY EASTER',
    title: 'Wishing you a happy long weekend',
    body: 'We hope you get a few days to rest, spend time with family and enjoy the spring.',
    list: ['Closed over the Easter weekend', 'Reopening on Tuesday at 9:00', 'Orders placed over the weekend are sent on Tuesday'],
    listTitle: 'Opening hours',
    btn: 'See our hours',
    note: 'With best wishes from all of us.'
  });

  add('diwali-greeting', 'Diwali greeting', SEASON, 'A warm greeting for the festival of lights.', 'marigold', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'diya-lights-hero',
    kicker: 'HAPPY DIWALI',
    title: 'Wishing you light and happiness',
    body: 'To everyone celebrating, we send our warmest wishes for the festival and the year ahead.',
    list: ['We will be closed on the main day of the festival', 'Orders will be sent the day after', 'Our team is available by email throughout'],
    listTitle: 'Holiday hours',
    btn: 'See our holiday hours',
    note: REPLY
  });

  add('mothers-day', 'Mother’s Day', SEASON, 'A gift-focused message with an order-by date for delivery on the day.', 'rose', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'products', {
    kicker: 'FOR MOTHER’S DAY',
    title: 'Something she will really use',
    body: 'Order by Wednesday for delivery in time. Every gift is wrapped for free.',
    items: [
      ['flowers-product-1', 'Fresh flower bundle', '£24.00', 'Seasonal flowers, hand-tied and delivered in water.', 'A bundle of colourful flowers'],
      ['candle-product-1', 'Hand-poured candle', '£14.00', 'A calming scent in a reusable clay pot.', 'A candle in a clay pot']
    ],
    btn: 'Shop gifts for mums',
    note: 'Order by Wednesday for delivery on Sunday.'
  });

  add('fathers-day', 'Father’s Day', SEASON, 'Gift ideas for fathers, grandfathers and the people who fill that role.', 'ocean', { t_font: 'sans', btn_radius: 4 }, 'products', {
    kicker: 'FOR FATHER’S DAY',
    title: 'Gifts for the person who has everything',
    body: 'Practical, long-lasting and made by small makers. Free delivery on orders over £30.',
    items: [
      ['coffee-product-1', 'Whole bean coffee, 500 g', '£12.00', 'Roasted last week and ground to order.', 'A bag of whole coffee beans'],
      ['bag-product-1', 'Leather weekend bag', '£85.00', 'Hand-stitched, with a lifetime repair offer.', 'A brown leather weekend bag']
    ],
    btn: 'See all gifts',
    note: 'Order by Thursday for delivery before Sunday.'
  });

  add('valentines', 'Valentine’s Day', SEASON, 'A warm message for 14 February, with gift ideas and a delivery deadline.', 'berry', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'roses-hero',
    kicker: 'FOR SOMEONE SPECIAL',
    title: 'Say it with something thoughtful',
    body: 'Gifts that mean something, from small makers. Free card and gift wrap on every order.',
    list: ['Order by Thursday 11 February for delivery on the day', 'Same-day delivery in Lagos until noon on the 14th', 'Free handwritten message with every gift'],
    listTitle: 'Good to know',
    btn: 'Find a gift',
    note: REPLY
  });

  add('national-day', 'National day', SEASON, 'A short, proud greeting for a national holiday, with opening hours.', 'sage', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'flags-hero',
    kicker: 'HAPPY INDEPENDENCE DAY',
    title: 'Celebrating a country we are proud to work in',
    body: 'Today we mark the day with our team and our neighbours. We wish everyone a peaceful and joyful holiday.',
    list: ['Our offices are closed today', 'Online orders continue to be taken', 'We reopen tomorrow at 8:00'],
    listTitle: 'Holiday hours',
    btn: 'See what we are doing today',
    note: REPLY
  });

  add('back-to-school', 'Back to school', SEASON, 'A list of what is needed for the new term, with a clear deadline.', 'sun', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'school-supplies-hero',
    kicker: 'NEW TERM',
    title: 'Ready for the first day',
    body: 'Everything for the new term in one place, with free delivery on orders over £25.',
    list: ['Exercise books and pens', 'Uniform and shoes', 'Lunch boxes and water bottles', 'Calculators and geometry sets'],
    listTitle: 'On the list',
    btn: 'Shop for school',
    note: 'Order by Friday for delivery before the term starts on Monday.'
  });

  add('harvest-festival', 'Harvest and gratitude', SEASON, 'Thank growers, customers or members at harvest time.', 'lime', { t_font: 'serif', btn_radius: 30 }, 'quote', {
    pic: 'harvest-hero',
    quote: 'We plant in hope and harvest in company.',
    who: 'A saying from our community',
    title: 'Thank you for a good harvest',
    body: 'This season 210 growers delivered more than 400 tonnes. We want to thank every one of them, and everyone who bought from them.',
    list: ['210 growers took part', 'More than 400 tonnes delivered', 'Every grower was paid within seven days'],
    btn: 'Meet the growers',
    note: REPLY
  });

  add('womens-day', 'International Women’s Day', SEASON, 'Celebrate women in your community and share their stories.', 'violet', { t_font: 'sans', btn_radius: 24 }, 'digest', {
    pic: 'women-business-hero',
    kicker: '8 MARCH',
    title: 'Five women building businesses we admire',
    body: 'On International Women’s Day we are sharing the stories of five members and what they have learned.',
    items: [
      ['Ada Nwosu, textile designer, Enugu', 'From a market stall to a workshop with nine staff.'],
      ['Fatima Bello, founder, Kano', 'Built a leather goods firm that ships to four countries.'],
      ['Wanjiru Kamau, farmer, Nyeri', 'Leads a cooperative of 60 women growers.'],
      ['Abena Mensah, caterer, Accra', 'Serves 300 meals a day to local schools.']
    ],
    btn: 'Read all five stories'
  });

  add('heritage-month', 'Heritage month', SEASON, 'Mark a heritage or history month with a story, an event and a reading list.', 'sunset', { t_font: 'serif', btn_radius: 4 }, 'facts', {
    pic: 'drums-hero',
    kicker: 'HERITAGE MONTH',
    title: 'Stories from our community this month',
    body: 'Throughout October we are sharing stories of people and businesses that have shaped our community.',
    facts: ['A new story every Monday', 'An open evening on Friday 23 October', 'A reading list at the end of the month'],
    more: ['Our members’ own stories', 'A talk from a local historian', 'A display at the library'],
    moreTitle: 'This month',
    btn: 'Read the first story',
    note: 'Have a story of your own? Reply and tell us.'
  });

  /* ================= Trade and business ================= */
  add('market-report', 'Market report', TRADE, 'A short summary of a market, with four figures and what they mean.', 'cobalt', { t_font: 'sans', btn_radius: 4 }, 'figures', {
    pic: 'port-hero',
    kicker: 'MARKET REPORT  |  THIRD QUARTER',
    title: 'West African cocoa: what changed',
    body: 'A short summary for buyers and exporters, with the sources listed below.',
    figs: ['+6 per cent\nexport volume', '−3 per cent\naverage price', '12\nnew buyers in our directory', '4 weeks\naverage time to deliver'],
    after: 'Sources: customs data for July to September and our own member survey. Figures are rounded.',
    btn: 'Read the full report',
    note: REPLY
  });

  add('export-alert', 'Export alert', TRADE, 'A short, serious notice for exporters about a rule or a delay.', 'scarlet', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    kicker: 'EXPORT ALERT',
    title: 'New labelling rules start on 1 January',
    body: 'From 1 January all packaged food exported to the region must carry the country of origin and a batch number on the label.',
    btn: 'Read the guidance',
    list: ['Check your labels now', 'Order new labels before the end of November', 'Goods without the right label may be held at the border'],
    listTitle: 'What to do',
    note: 'We will email again if the date changes.'
  });

  add('trade-mission', 'Trade mission', TRADE, 'Invite members on a trip to meet buyers, with dates, cost and what is included.', 'ocean', { t_font: 'sans', btn_radius: 4 }, 'facts', {
    pic: 'cityscape-hero',
    kicker: 'TRADE MISSION',
    title: 'Meet buyers in Nairobi in March',
    body: 'A four-day visit for 20 members, with meetings arranged in advance with buyers in your sector.',
    facts: ['Monday 8 to Thursday 11 March', 'Nairobi, Kenya', '£1,450 per person, flights not included'],
    more: ['Pre-arranged buyer meetings', 'A briefing before you travel', 'Two evening receptions with local firms'],
    moreTitle: 'Included',
    btn: 'Apply for a place',
    note: 'Applications close on Friday 4 December. Places are limited to 20.'
  });

  add('supplier-call', 'Call for suppliers', TRADE, 'Tell suppliers what you are looking for, how to apply and by when.', 'sage', { t_font: 'sans', btn_radius: 4 }, 'left', {
    kicker: 'CALL FOR SUPPLIERS',
    title: 'We are looking for new suppliers of packaged foods',
    body: 'A group of retailers in the United Kingdom wants to add products from West Africa to its range next year.',
    list: ['Shelf-stable foods with at least 12 months of life', 'Certification such as HACCP or equivalent', 'Able to supply at least 1,000 units a month'],
    listTitle: 'What buyers need',
    btn: 'Submit your products',
    note: 'The closing date is Friday 11 December.'
  });

  add('tender-notice', 'Tender notice', TRADE, 'A formal call for bids, with the scope, the deadline and how to apply.', 'slate', { t_font: 'serif', p_font: 'serif', btn_radius: 0 }, 'letter', {
    title: 'Invitation to tender: freight services for 2027',
    paras: [
      'We invite freight firms to bid for a two-year contract to carry our members’ goods between Tema and Rotterdam.',
      'The contract is worth an estimated £400,000 a year. Bids must include prices, transit times and insurance terms.',
      'The closing date is Friday 15 January at 17:00. Late bids cannot be considered.'
    ],
    list: ['Tender documents: available to download below', 'Questions: by email until 8 January', 'Decision: announced by the end of February'],
    btn: 'Download the tender pack',
    sign: 'Procurement team\nprocurement@example.com'
  });

  add('investor-update', 'Investor update', TRADE, 'A clear, honest update for people who have backed you.', 'night', { t_font: 'sans', btn_radius: 0 }, 'figures', {
    kicker: 'QUARTERLY UPDATE',
    title: 'Third quarter: what went well and what did not',
    body: 'Thank you for your continued backing. Here is where we are.',
    figs: ['£412,000\nrevenue, up 18 per cent', '£58,000\noperating loss, down from £71,000', '14 months\ncash in the bank', '37\nstaff, up from 31'],
    after: 'What did not go well: two large orders were delayed by a customs hold and moved into the fourth quarter. We expect them to be fulfilled in November.',
    btn: 'Read the full update',
    note: 'Questions are welcome. Just reply to this email.'
  });

  add('deal-announcement', 'Deal announced', TRADE, 'Announce a signed deal, with who is involved and what happens next.', 'jade', { t_font: 'sans', btn_radius: 4 }, 'centre', {
    pic: 'handshake-hero',
    kicker: 'DEAL SIGNED',
    title: 'A three-year supply agreement is in place',
    body: 'Two member firms have agreed a supply deal worth an estimated £2 million over three years. We helped to make the introduction.',
    list: ['Supplier: Bello Textiles, Kano', 'Buyer: Mensah Retail, Accra', 'First delivery: January'],
    listTitle: 'The parties',
    btn: 'Read the full story',
    note: 'The terms of the deal are private to the two firms.'
  });

  add('new-route', 'A new trade route', TRADE, 'Announce a new shipping route or service, with the schedule.', 'turquoise', { t_font: 'sans', btn_radius: 4 }, 'side', {
    title: 'A direct weekly sailing from Tema to Rotterdam',
    body: 'From January there will be a direct sailing every Thursday. It takes 14 days, four fewer than the current route.',
    pic: 'containers-side',
    sideText: 'The schedule\nDeparts Tema every Thursday. Arrives in Rotterdam 14 days later.',
    list: ['Space for standard and refrigerated containers', 'Booking opens on 1 December', 'Introductory rates for the first three sailings'],
    listTitle: 'Good to know',
    btn: 'Request a quote',
    note: REPLY
  });

  add('policy-brief', 'Policy brief', TRADE, 'Three changes in policy, with the effect on your business.', 'sand', { t_font: 'serif', p_font: 'sans', btn_radius: 4 }, 'steps', {
    title: 'Three policy changes to know about',
    body: 'A plain summary of what has changed in the past month and what it means for exporters.',
    steps: ['A new tariff table lowers duty on packaged foods by 5 per cent from 1 January.', 'Exporters must now register online before shipping, which takes about 15 minutes.', 'A new support fund opens in February for firms with fewer than 50 staff.'],
    btn: 'Read the full brief',
    note: 'This summary is not legal advice. Check the original documents before you act.'
  });

  add('currency-update', 'Currency update', TRADE, 'A short note on exchange rates for exporters, with the figures and the date.', 'gold', { t_font: 'sans', btn_radius: 4 }, 'figures', {
    kicker: 'EXCHANGE RATES  |  FRIDAY CLOSE',
    title: 'What this week’s rates mean for your prices',
    body: 'A short summary for exporters and importers. Rates are indicative, not an offer.',
    figs: ['£1 = 1,820 naira\n+1.2 per cent this week', '£1 = 17.6 cedis\n−0.4 per cent this week', '£1 = 168 shillings\nunchanged', '£1 = 1.25 dollars\n−0.3 per cent this week'],
    after: 'Check your price lists if you quote in a currency other than your own. Rates move daily.',
    btn: 'Use our price calculator',
    note: 'This is general information and not financial advice.'
  });

  add('buyer-wanted', 'Buyer wanted', TRADE, 'A request from a buyer, with the product, the quantity and the terms.', 'plum', { t_font: 'sans', btn_radius: 4 }, 'facts', {
    pic: 'market-stall-hero',
    kicker: 'BUYER REQUEST',
    title: 'A London retailer wants 2,000 jars of shea butter a month',
    body: 'A buyer has asked us to find suppliers who can meet the following needs.',
    facts: ['Product: unrefined shea butter, 250 g jars', 'Quantity: 2,000 a month, from January', 'Price: to be agreed. Delivery to London.'],
    more: ['Certificates of origin', 'Samples sent before the first order', 'Payment terms of 30 days'],
    moreTitle: 'The buyer also needs',
    btn: 'Respond to this request',
    note: 'Replies close on Friday 27 November.'
  });

  add('introductions', 'Introductions this month', TRADE, 'List the introductions made this month, with a line on each.', 'teal', { t_font: 'sans', btn_radius: 4 }, 'digest', {
    kicker: 'MATCHED THIS MONTH',
    title: 'Four introductions we made in October',
    body: 'Each of these was made by our team after a short call with both sides.',
    items: [
      ['A Kenyan tea grower and a Hamburg importer', 'Sample shipment agreed.'],
      ['A Ghanaian furniture maker and a Dubai hotel group', 'Quote requested for 120 rooms.'],
      ['A Nigerian fabric designer and a London retailer', 'Two lines selected.'],
      ['A Senegalese fisheries firm and a French wholesaler', 'First order placed.']
    ],
    btn: 'Request an introduction'
  });

  add('regulation-change', 'A rule has changed', TRADE, 'Explain a regulatory change, who it affects and the date it starts.', 'clay', { t_font: 'sans', btn_radius: 0 }, 'left', {
    kicker: 'RULE CHANGE',
    title: 'New customs form from 1 February',
    body: 'A new electronic form replaces the paper customs declaration for goods worth more than £1,000.',
    list: ['Applies to all exports to the region', 'Replaces form C-12', 'Can be filled in online in about ten minutes'],
    listTitle: 'What you need to know',
    btn: 'See the new form',
    note: 'This summary is not legal advice. Check the official guidance before you act.'
  });

  add('delegation-visit', 'Delegation visit', TRADE, 'Announce a visiting delegation, with the programme and how to meet them.', 'cobalt', { t_font: 'sans', btn_radius: 4 }, 'agenda', {
    pic: 'cityscape-hero',
    kicker: 'VISITING DELEGATION',
    title: 'A group of Kenyan buyers is coming to London',
    body: 'Eight buyers from the food and drink sector will be in London next month. You can request a meeting with any of them.',
    when: 'Tuesday 17 to Thursday 19 November',
    slots: ['Tuesday: arrival and welcome dinner', 'Wednesday: meetings with exporters, 9:00 to 16:00', 'Thursday: site visits and departure'],
    peopleTitle: 'Who is coming',
    people: ['Grace Wambui, retail buyer', 'Peter Otieno, hotel group', 'Nuru Hassan, wholesale distributor'],
    btn: 'Request a meeting',
    note: 'Meetings are 30 minutes and are allocated in order of request.'
  });

  add('partnership-offer', 'Partnership opportunity', TRADE, 'An invitation to work together, with what each side brings and a next step.', 'lime', { t_font: 'serif', p_font: 'serif', btn_radius: 4 }, 'letter', {
    title: 'An opportunity to work together',
    paras: [
      'We have been following your work for some time and think there is a good fit between what you do and what our members need.',
      'We would like to propose a six-month pilot. You would offer our members a discount, and we would introduce your services to our list of 5,000 businesses.',
      'If this is of interest, we would be glad to arrange a short call to talk it through.'
    ],
    list: ['A six-month pilot, with a review at three months', 'No fee on either side', 'Either of us can stop at any time'],
    btn: 'Arrange a call',
    sign: 'Yours sincerely,\nAlex Morgan'
  });

  add('quarter-update', 'Quarterly update', TRADE, 'A letter to members or partners on what has happened and what is next.', 'ocean', { t_font: 'sans', btn_radius: 4 }, 'letter', {
    title: 'Where we stand at the end of the quarter',
    paras: [
      'Thank you for your support over the past three months. This is a short account of what we did, and what we plan to do next.',
      'We held six events, welcomed 310 new members and made 84 introductions between buyers and sellers. Two programmes ran over time, and we have changed how we plan them.',
      'Next quarter our priorities are a new member directory, a longer programme for first-time exporters and a trade mission in March.'
    ],
    list: ['Events held: 6', 'New members: 310', 'Introductions made: 84'],
    btn: 'Read the full update',
    sign: 'With thanks,\nAlex Morgan\nDirector'
  });
})();
