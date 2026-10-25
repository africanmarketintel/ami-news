/* More starter layouts, part 2: sales and offers, welcome and thank you.
   The words, dates, places and prices are examples to replace. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX) return;
  var X = MR.tplX, G = X.G, add = X.add;
  var SALE = G['Sales and offers'], WELCOME = G['Welcome'], THANKS = G['Thank you'];
  var REPLY = 'Reply to this email at any time. A person reads it.';

  /* ================= Sales and offers ================= */
  add('flash-sale', 'Flash sale', SALE, 'A short, bold sale with one deadline and one button.', 'scarlet', { t_font: 'sans', t_size: 38, btn_radius: 0 }, 'dark', {
    pic: 'shopping-bags-hero',
    kicker: '24 HOURS ONLY',
    title: '30 per cent off everything',
    body: 'The sale starts at 9:00 tomorrow and ends at 9:00 the next day. No code is needed.',
    btn: 'Shop the sale',
    list: ['Starts: Friday 20 November, 9:00', 'Ends: Saturday 21 November, 9:00', 'Applies to all items in stock'],
    listTitle: 'Dates',
    note: 'Sale prices cannot be combined with other offers.'
  });

  add('black-friday', 'Black Friday', SALE, 'A dark, high-contrast sale email with a code and a deadline.', 'night', { t_font: 'sans', t_size: 40, btn_radius: 0 }, 'code', {
    pic: 'neon-sale-hero',
    kicker: 'BLACK FRIDAY',
    title: 'Our lowest prices of the year',
    body: 'Up to 40 per cent off a selected range, for one weekend only.',
    codeLabel: 'USE CODE',
    code: 'FRIDAY40',
    terms: 'Valid from Friday 27 November to Monday 30 November, 23:59.',
    btn: 'Start shopping',
    note: 'Stock is limited and some items will sell out.'
  });

  add('cyber-monday', 'Cyber Monday', SALE, 'An online-only offer with a bold headline and three reasons to act.', 'cobalt', { t_font: 'sans', t_size: 36, btn_radius: 8 }, 'centre', {
    pic: 'laptop-colour-hero',
    kicker: 'MONDAY ONLY  |  ONLINE',
    title: 'Cyber Monday deals are live',
    body: 'One day, online only. Free delivery on every order, and extra savings on the items below.',
    list: ['Free delivery on all orders', 'Up to 35 per cent off selected lines', 'Extra 5 per cent off if you pay today'],
    listTitle: 'Today only',
    btn: 'See today’s deals',
    note: 'Offer ends at midnight tonight.'
  });

  add('bundle-save', 'Bundle and save', SALE, 'Three products sold together at a lower price, each shown with a price.', 'sunset', { t_font: 'sans', btn_radius: 24 }, 'products', {
    kicker: 'THE STARTER SET',
    title: 'Buy all three and save £12',
    body: 'Our three most popular items, together at a special price.',
    items: [
      ['soap-product-1', 'Shea butter soap', '£6.00', 'Hand-made in small batches. Gentle on skin.', 'A block of cream shea butter soap'],
      ['honey-product-1', 'Wild forest honey', '£9.00', 'Gathered by a village cooperative.', 'A jar of golden honey'],
      ['spices-product-1', 'Pepper and spice mix', '£5.00', 'A blend for rice, stews and grills.', 'Small bowls of ground spices']
    ],
    btn: 'Buy the set for £20',
    note: 'The set is available while stocks last.'
  });

  add('loyalty-rewards', 'Rewards for loyal customers', SALE, 'Explain a points scheme in three steps and show the balance.', 'marigold', { t_font: 'sans', btn_radius: 30 }, 'steps', {
    pic: 'gift-ribbon-hero',
    title: 'Thank you for coming back. Here is your reward.',
    body: 'You have earned 120 points, which is worth £12 off your next order.',
    steps: ['Every £1 you spend earns you one point.', 'At 100 points you can claim £10 off.', 'Points never expire while you are a customer.'],
    btn: 'Use my points',
    align: 'center',
    note: 'You can see your points balance at any time by signing in to your account.'
  });

  add('abandoned-cart', 'You left something behind', SALE, 'A gentle reminder about an unfinished order, with the item shown.', 'sand', { t_font: 'sans', btn_radius: 24 }, 'products', {
    title: 'Still thinking it over?',
    body: 'You left an item in your basket. We have kept it for you for the next 48 hours.',
    items: [['fabric-product-1', 'Ankara cotton, 6 yards', '£28.00', 'Bold printed cotton, ready to sew.', 'A folded length of colourful printed cotton']],
    btn: 'Go back to my basket',
    note: 'If you had a problem at checkout, reply and we will help.'
  });

  add('price-drop', 'Price drop', SALE, 'Tell people that something they looked at is now cheaper.', 'jade', { t_font: 'sans', btn_radius: 8 }, 'products', {
    kicker: 'PRICE DROP',
    title: 'Two favourites are now cheaper',
    body: 'Prices on these two items have been lowered until the end of the month.',
    items: [
      ['basket-product-1', 'Hand-woven basket', '£18.00', 'Was £24.00. Strong and light, made by hand.', 'A round woven basket in natural colours'],
      ['jewellery-product-1', 'Beaded necklace', '£22.00', 'Was £30.00. Each piece is slightly different.', 'A necklace of bright glass beads']
    ],
    btn: 'See the new prices'
  });

  add('new-collection', 'New collection', SALE, 'Launch a season’s range with a hero photo and three featured items.', 'berry', { t_size: 34, btn_radius: 0 }, 'products', {
    kicker: 'THE NEW SEASON',
    title: 'The Harmattan collection is here',
    body: 'Warm colours and soft cotton, designed for the cooler months.',
    items: [
      ['bag-product-1', 'Market tote', '£32.00', 'Roomy and strong, with an inside pocket.', 'A bright woven tote bag'],
      ['fabric-product-1', 'Cotton wrap', '£26.00', 'Light enough for evening, warm enough for morning.', 'A folded cotton wrap in warm colours'],
      ['candle-product-1', 'Spice candle', '£14.00', 'Smells of cloves and orange peel.', 'A candle in a clay pot']
    ],
    btn: 'Shop the collection'
  });

  add('limited-stock', 'Almost gone', SALE, 'Tell buyers that stock is running low, with the number left.', 'clay', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    pic: 'pottery-hero',
    kicker: 'ONLY 9 LEFT',
    title: 'The last hand-made pots of the year',
    body: 'We make each pot by hand and we will not make more until spring. When these are gone, they are gone.',
    btn: 'Get one while you can',
    list: ['9 pots left at the time of writing', 'Each one is slightly different', 'Delivery before 24 December if you order by Monday'],
    listTitle: 'Good to know',
    note: 'The number above was correct when this email was written.'
  });

  add('clearance', 'End of season clearance', SALE, 'Clear the shelves with a short list of reductions and a deadline.', 'sun', { t_font: 'sans', btn_radius: 0 }, 'centre', {
    pic: 'sale-rack-hero',
    kicker: 'MAKING ROOM',
    title: 'Everything must go by Sunday',
    body: 'We are making space for new stock. Last season’s lines are reduced by up to 60 per cent.',
    list: ['Summer fabrics from £8 a yard', 'Hand-made bags from £15', 'Odd sizes and last pieces at half price'],
    listTitle: 'Examples',
    btn: 'Browse the clearance',
    note: 'All sales are final on clearance items.'
  });

  add('subscription-box', 'Subscription box', SALE, 'Sell a monthly box, with what comes in it and how to start.', 'violet', { t_font: 'sans', btn_radius: 30 }, 'steps', {
    pic: 'gift-box-hero',
    title: 'A box of something new, every month',
    body: 'Each month we choose five products from small makers and send them to your door.',
    steps: ['Choose a plan: monthly, or every three months.', 'We pack and post your first box within five days.', 'Pause, skip or cancel at any time from your account.'],
    btn: 'Start my subscription',
    note: 'The monthly price is £24, including delivery.'
  });

  add('coupon-code', 'Discount code', SALE, 'A code shown large, with the saving, the dates and the conditions.', 'coral', { t_font: 'sans', btn_radius: 24, t_size: 34 }, 'code', {
    pic: 'coupon-hero',
    kicker: 'JUST FOR YOU',
    title: '15 per cent off your next order',
    body: 'Enter this code at the checkout. It works on everything in the shop.',
    codeLabel: 'YOUR CODE',
    code: 'THANKS15',
    terms: 'Valid until 30 November. One use per customer.',
    btn: 'Use my code',
    note: 'The code cannot be used with other offers.'
  });

  add('free-gift', 'Free gift with your order', SALE, 'Offer a free item when someone spends over a set amount.', 'rose', { t_font: 'serif', btn_radius: 30 }, 'centre', {
    pic: 'gift-ribbon-hero',
    kicker: 'A LITTLE EXTRA',
    title: 'Spend £50 and choose a free gift',
    body: 'Add any three items to your basket and pick a free gift at checkout. This week only.',
    list: ['A mini jar of honey', 'A bar of shea butter soap', 'A sachet of our spice mix'],
    listTitle: 'Choose one',
    btn: 'Start shopping',
    note: 'One free gift per order. While stocks last.'
  });

  add('birthday-offer', 'Happy birthday', SALE, 'A personal birthday message with a small gift and a code.', 'marigold', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'code', {
    pic: 'birthday-hero',
    kicker: 'HAPPY BIRTHDAY',
    title: 'A little something from us',
    body: 'We hope you have a lovely day. To say thank you for being with us, here is a gift you can use any time this month.',
    codeLabel: 'YOUR BIRTHDAY GIFT',
    code: '£10 off',
    terms: 'On any order over £40. Use the code BIRTHDAY10 at checkout.',
    btn: 'Treat myself',
    note: 'The code is valid for 30 days.'
  });

  add('member-exclusive', 'Members only', SALE, 'An early-access offer for members, with a short, private tone.', 'slate', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    kicker: 'MEMBERS ONLY',
    title: 'You can shop 24 hours before everyone else',
    body: 'As a member you see the new range first. The public sale opens on Saturday.',
    btn: 'Shop early',
    list: ['Early access opens Friday at 9:00', 'Free delivery on all member orders', 'Your member discount applies as normal'],
    listTitle: 'Your member benefits',
    note: 'Please do not forward this email. The link is personal to you.'
  });

  add('last-minute-deal', 'Last-minute deal', SALE, 'A place, a date and a price for something that must be booked soon.', 'turquoise', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'beach-hero',
    kicker: 'LAST-MINUTE OFFER',
    title: 'Three nights by the sea for £210',
    body: 'We have two rooms free next weekend and would rather they were used. A small hotel, a short walk from the beach.',
    facts: ['Arrive Friday 27 November, leave Monday 30 November', 'Breakfast included', 'Price for two people sharing'],
    more: ['Free parking', 'Late checkout on Monday', 'Free cancellation until Wednesday'],
    moreTitle: 'Included',
    btn: 'Book now',
    note: 'Only two rooms are available at this price.'
  });

  /* ================= Welcome ================= */
  add('welcome-newsletter', 'Welcome to the newsletter', WELCOME, 'A first message that says what to expect and how often.', 'sage', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'welcome-sunrise-hero',
    kicker: 'THANKS FOR SUBSCRIBING',
    title: 'Welcome. You are on the list.',
    body: 'Every Friday we send one short email with the best of what we have seen that week.',
    list: ['One email a week, never more', 'Short reads you can finish in five minutes', 'One click to leave if it is not for you'],
    listTitle: 'What to expect',
    btn: 'Read the latest issue',
    note: REPLY
  });

  add('welcome-discount', 'Welcome offer', WELCOME, 'Thank a new subscriber with a first-order code.', 'sunset', { t_font: 'sans', btn_radius: 24 }, 'code', {
    pic: 'welcome-gift-hero',
    kicker: 'WELCOME',
    title: 'Here is 10 per cent off your first order',
    body: 'Thank you for joining us. To say hello, here is a code for your first purchase.',
    codeLabel: 'YOUR CODE',
    code: 'WELCOME10',
    terms: 'Valid for 14 days on a first order over £25.',
    btn: 'Start shopping',
    note: REPLY
  });

  add('welcome-what-next', 'What happens next', WELCOME, 'Three steps for a new customer, so they know exactly what to do.', 'cobalt', { t_font: 'sans', btn_radius: 8 }, 'steps', {
    pic: 'handshake-hero',
    title: 'You are in. Here is how to get started.',
    body: 'It takes about ten minutes to set up your account and make your first introduction.',
    steps: ['Complete your profile so people know what you do.', 'Browse the directory and save three businesses that interest you.', 'Send your first introduction. We will help if you want a hand.'],
    btn: 'Open my account',
    note: REPLY
  });

  add('welcome-community', 'Welcome to the community', WELCOME, 'Greet a new member, give the house rules and three places to start.', 'jade', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'community-hero',
    align: 'center',
    kicker: 'WELCOME',
    title: 'You are now part of the community',
    body: 'More than 5,000 people use this community to share advice and make introductions.',
    facts: ['Be kind and be useful', 'Say what you do and what you need', 'Keep private matters private'],
    more: ['Introduce yourself in the welcome thread', 'Join one topic group that matches your work', 'Come to our next monthly call'],
    moreTitle: 'Three places to start',
    btn: 'Go to the community',
    note: REPLY
  });

  add('welcome-app', 'Download the app', WELCOME, 'Welcome a new user and point them to the app, with a short picture.', 'violet', { t_font: 'sans', btn_radius: 24 }, 'side', {
    title: 'Everything in your pocket',
    body: 'Your account is ready. For the quickest way to place orders and track deliveries, install our app.',
    pic: 'smartphone-side',
    sideText: 'What you can do\nTrack a delivery, reorder in two taps and message us from the same screen.',
    list: ['Works on most phones, including older ones', 'Uses very little data', 'Works offline for browsing'],
    listTitle: 'Why people use it',
    btn: 'Get the app',
    note: REPLY
  });

  add('welcome-team', 'Meet the team', WELCOME, 'Put a face to the name. A short introduction to the people behind the service.', 'clay', { t_font: 'serif', btn_radius: 24 }, 'side', {
    title: 'Hello from all of us',
    body: 'You are now on our list, so we thought we should introduce ourselves.',
    pic: 'team-side',
    side: 'left',
    sideText: 'Who we are\nFive people in two offices, and one very patient dog.',
    list: ['Amara, partnerships', 'Tunde, customer support', 'Grace, finance', 'Chidi, deliveries'],
    listTitle: 'The people you may hear from',
    btn: 'Say hello back',
    note: REPLY
  });

  add('welcome-preferences', 'Tell us what you like', WELCOME, 'Ask a new subscriber to choose a topic, one button for each.', 'lime', { t_font: 'sans', btn_radius: 24 }, 'poll', {
    title: 'What would you like to hear about?',
    body: 'Choose one topic and we will tailor what we send. You can change it at any time.',
    answers: ['Exporting and trade', 'Starting a business', 'Money and funding', 'Technology and tools'],
    note: 'Choosing takes five seconds. You can pick again later.'
  });

  add('welcome-back', 'Welcome back', WELCOME, 'Greet someone who has returned after a break, with what is new.', 'plum', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'sunrise-hero',
    kicker: 'GOOD TO SEE YOU AGAIN',
    title: 'Welcome back',
    body: 'It has been a while. A few things have changed since your last visit, and we think you will like them.',
    list: ['A simpler, faster checkout', 'A new section for members’ stories', 'Lower delivery charges'],
    listTitle: 'What is new',
    btn: 'See what has changed',
    note: REPLY
  });

  /* ================= Thank you ================= */
  add('thanks-donation-receipt', 'Thank you and receipt', THANKS, 'A formal thank-you for a donation, with the receipt details.', 'sage', { p_font: 'serif', btn_radius: 4 }, 'letter', {
    title: 'Thank you for your gift',
    paras: [
      'Your donation of £50 was received on 12 November. It will help us give 100 children a hot meal at school.',
      'This email is your receipt. Please keep it for your records.'
    ],
    list: ['Amount: £50.00', 'Date: 12 November', 'Reference: ABC-1234'],
    btn: 'See what your gift does',
    sign: 'With thanks,\nAlex Morgan\nDirector'
  });

  add('thanks-feedback', 'Thanks for your feedback', THANKS, 'Thank someone for answering a survey and say what happens next.', 'teal', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'listening-hero',
    kicker: 'WE HEARD YOU',
    title: 'Thank you for telling us what you think',
    body: 'Your answers will shape what we do next year. We will share a summary in the new year.',
    list: ['We read every answer', 'Three clear themes have already come out', 'The first change will be made next month'],
    listTitle: 'What happens next',
    btn: 'See what we are changing',
    note: REPLY
  });

  add('thanks-partner', 'Thank you to a partner', THANKS, 'A personal letter of thanks to a partner or supplier.', 'ocean', { t_font: 'serif', p_font: 'serif', btn_radius: 0 }, 'letter', {
    title: 'Thank you for a good year of working together',
    paras: [
      'As the year closes, I wanted to write personally to say thank you. Your support made a real difference to what we achieved.',
      'Together we delivered 214 orders on time, opened two new routes and trained eight new staff. None of it would have happened without you.',
      'We look forward to planning next year with you. If it suits you, I would like to arrange a call in January.'
    ],
    btn: 'Book a call in January',
    sign: 'With thanks,\nAlex Morgan'
  });

  add('thanks-anniversary', 'Thank you on your anniversary', THANKS, 'Mark the time someone has been a member or customer.', 'gold', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'anniversary-hero',
    kicker: 'ONE YEAR TOGETHER',
    title: 'Thank you for a year with us',
    body: 'It was twelve months ago that you joined. Here is what you have been part of.',
    list: ['More than 900 introductions made', 'Four member meetings in three cities', 'A new guide published every month'],
    listTitle: 'This year',
    btn: 'See your year',
    note: 'We would love to hear what you would like from us next.'
  });

  add('thanks-team', 'Thank you to the team', THANKS, 'An internal note of thanks, plain and personal.', 'sun', { t_font: 'sans', btn_radius: 0 }, 'letter', {
    title: 'Thank you, everyone',
    paras: [
      'This has been our busiest quarter, and you all handled it with patience and good humour.',
      'Three things I noticed: how quickly you helped each other, how carefully you looked after customers, and how many of you stayed late without being asked.',
      'The office will close at 14:00 on Friday. Please go home and rest.'
    ],
    sign: 'Thank you again,\nAlex'
  });

  add('thanks-sponsors', 'Thank you to our sponsors', THANKS, 'Name the people and firms who backed an event or a project.', 'gold', { t_font: 'sans', btn_radius: 4 }, 'digest', {
    kicker: 'WITH THANKS TO',
    title: 'The firms that made it possible',
    body: 'The event raised £14,200. Every one of these sponsors made that possible.',
    pic: 'celebration-hero',
    items: [
      ['Bello Textiles', 'Headline sponsor and the first to say yes.'],
      ['Mensah Freight', 'Paid for the venue and the sound system.'],
      ['Otieno and Partners', 'Funded the refreshments and the printing.'],
      ['Adeyemi Consulting', 'Gave their time and skills to run the day.']
    ],
    btn: 'Read the full report'
  });

  add('thanks-speakers', 'Thank you to our speakers', THANKS, 'A warm letter to speakers, with a link to the photos and recording.', 'plum', { p_font: 'serif', btn_radius: 4 }, 'letter', {
    title: 'Thank you for speaking',
    paras: [
      'You gave our members a clear, honest and useful hour, and we are grateful.',
      'The recording and a folder of photographs are ready for you to look at. If there is anything you would like us to change before we share them, please say by Friday.'
    ],
    list: ['Recording: ready to watch', 'Photographs: 42 from the day', 'Feedback: 94 per cent of attendees rated the session good or excellent'],
    btn: 'See the photographs',
    sign: 'With thanks,\nThe events team'
  });

  add('thanks-review', 'Thank you for your review', THANKS, 'Thank someone for a review and offer a small reward.', 'rose', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'smile-hero',
    kicker: 'THANK YOU',
    title: 'Your review helps other people choose',
    body: 'We read every review, and yours made our week. As a small thank you, here is something for your next order.',
    list: ['Free delivery on your next order', 'No code needed. It is added automatically.', 'Valid for 60 days'],
    listTitle: 'Your thank-you gift',
    btn: 'Shop now',
    note: REPLY
  });
})();
