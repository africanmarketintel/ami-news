/* More starter layouts, part 3: fundraising and membership, feedback and
   updates, and product showcase. The words, dates, places and prices are
   examples to replace. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX) return;
  var X = MR.tplX, G = X.G, add = X.add;
  var RAISE = G['Fundraising and membership'], ASK = G['Feedback and updates'], SHOW = G['Product showcase'];
  var REPLY = 'Reply to this email at any time. A person reads it.';

  /* ================= Fundraising and membership ================= */
  add('monthly-giving', 'Give every month', RAISE, 'Ask for a small regular gift and show what it pays for.', 'rose', { t_font: 'sans', btn_radius: 30 }, 'steps', {
    pic: 'children-smiling-hero',
    title: 'A little each month adds up to a lot',
    body: 'A regular gift helps us plan ahead. Most of our supporters give between £5 and £20 a month.',
    steps: ['Choose an amount. £5 pays for a week of school meals for one child.', 'Set it up in two minutes with a card or direct debit.', 'Change or stop it at any time, with no questions.'],
    btn: 'Start a monthly gift',
    align: 'center',
    note: 'Your gift can be increased by the Gift Aid scheme if you pay UK tax.'
  });

  add('emergency-appeal', 'Emergency appeal', RAISE, 'A direct, urgent request after a flood, a fire or another sudden event.', 'scarlet', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    pic: 'rain-community-hero',
    kicker: 'URGENT APPEAL',
    title: 'Families need shelter after the floods',
    body: 'Heavy rain has left 2,400 families without a home. We are buying tents, blankets and clean water, and every donation helps today.',
    btn: 'Give now',
    list: ['£15 buys a family a blanket and a water filter', '£40 buys a tent for a family of five', '£100 supplies a week of food for a village'],
    listTitle: 'What your gift pays for',
    note: 'We will update you within a week on what your gift has done.'
  });

  add('giving-day', 'Giving day', RAISE, 'A one-day campaign with a target, a deadline and a running total.', 'violet', { t_font: 'sans', btn_radius: 30 }, 'figures', {
    pic: 'hands-together-hero',
    kicker: 'GIVING TUESDAY',
    title: 'Help us reach £20,000 by midnight',
    body: 'Every gift made today is matched by a local business, so each pound counts twice.',
    figs: ['£14,260\nraised so far today', '£20,000\nour target', '312\npeople have given', '5 hours\nleft to give'],
    after: 'The total above was correct when this email was sent.',
    btn: 'Give today',
    note: REPLY
  });

  add('legacy-giving', 'Leave a gift in your will', RAISE, 'A gentle, respectful message about leaving a gift in a will.', 'sand', { t_font: 'serif', p_font: 'serif', btn_radius: 4 }, 'letter', {
    title: 'A gift that lasts beyond a lifetime',
    paras: [
      'Many of our supporters tell us they would like to help for longer than a lifetime. A gift in a will is one way to do that.',
      'It does not have to be large. Any amount helps, and it is entirely your choice. You can change your mind at any time.',
      'If you would like to talk it over, we would be glad to help. There is no pressure and no obligation.'
    ],
    btn: 'Read our free guide',
    sign: 'With respect,\nAlex Morgan\nDirector'
  });

  add('donor-story', 'A story of impact', RAISE, 'One person’s story, in their words, and what a gift made possible.', 'turquoise', { btn_radius: 24 }, 'quote', {
    pic: 'portrait-smile-hero',
    quote: 'Before the loan I sold at the roadside. Now I have a shop with my name on it.',
    who: 'Esther, baker, Ibadan',
    title: 'What your gift made possible',
    body: 'Esther borrowed £300 from the fund last year and paid it back in eight months. She now employs two people and has asked to give something back.',
    list: ['Loan: £300', 'Repaid: in full, on time', 'Jobs created: two'],
    btn: 'Help the next person',
    note: REPLY
  });

  add('campaign-progress', 'Campaign progress', RAISE, 'Show how far a campaign has got, with what has been done and what remains.', 'lime', { t_font: 'sans', btn_radius: 24 }, 'figures', {
    kicker: 'HALFWAY THERE',
    title: 'We have raised £37,500 of £75,000',
    body: 'Thank you to everyone who has given. Here is where we are and what the money has done so far.',
    figs: ['£37,500\nraised', '50 per cent\nof our target', '14\nwells dug', '7\nvillages with clean water'],
    after: 'We have six weeks left to reach our target and 11 villages still waiting.',
    btn: 'Help us finish',
    note: REPLY
  });

  add('membership-renewal', 'Renew your membership', RAISE, 'A clear renewal notice with the date, the price and a one-click button.', 'ocean', { t_font: 'sans', btn_radius: 4 }, 'facts', {
    kicker: 'MEMBERSHIP',
    title: 'Your membership renews on 1 December',
    body: 'Thank you for being a member this year. To keep your benefits without a break, renew before the end of the month.',
    facts: ['Standard membership: £60 a year', 'Renewal date: 1 December', 'Your member number: 004217'],
    more: ['Access to the member directory', 'Free places at monthly sessions', 'A reduced rate for the annual conference'],
    moreTitle: 'What you keep',
    btn: 'Renew my membership',
    note: 'If your plans have changed, you can leave at any time from your account.'
  });

  add('membership-benefits', 'What members get', RAISE, 'Show a new reader what membership includes, to encourage them to join.', 'jade', { t_font: 'sans', btn_radius: 24 }, 'pair', {
    pic: 'community-hero',
    kicker: 'JOIN US',
    title: 'What you get when you join',
    body: 'A membership costs £5 a month. You can cancel whenever you like.',
    left: 'Connect\nA directory of 5,000 businesses, and a named contact who introduces you to the right people.',
    right: 'Learn\nA new guide every month, a monthly call and a recording of every session.',
    list: ['Early access to events', 'Discounts with partner firms', 'A say in what we do next'],
    listTitle: 'Also included',
    btn: 'Join today',
    note: REPLY
  });

  add('lapsed-member', 'Come back to us', RAISE, 'Invite a former member to return, with an offer and no pressure.', 'plum', { t_font: 'sans', btn_radius: 24 }, 'letter', {
    title: 'We would like you back',
    paras: [
      'Your membership ended in March, and we have missed having you with us. A lot has changed since then.',
      'If you would like to come back, we are offering your first three months at half price. There is no need to rejoin for the full year.',
      'If it is not the right time, we understand. You will still be welcome whenever you are ready.'
    ],
    list: ['A new member directory with more than 800 new businesses', 'A monthly clinic with our trade adviser', 'Lower fees for the annual conference'],
    btn: 'Rejoin at half price',
    sign: 'Best wishes,\nAlex Morgan'
  });

  add('corporate-membership', 'Corporate membership', RAISE, 'Offer a firm a team membership, with tiers and a clear price.', 'slate', { t_font: 'sans', btn_radius: 0 }, 'facts', {
    pic: 'team-meeting-hero',
    kicker: 'FOR BUSINESSES',
    title: 'Bring your whole team into the network',
    body: 'A corporate membership covers everyone in your organisation, with one invoice and one point of contact.',
    facts: ['Up to 10 people: £450 a year', 'Up to 50 people: £1,200 a year', 'Larger teams: please ask'],
    more: ['A named account manager', 'Your logo in our directory', 'Priority places at every event'],
    moreTitle: 'Included',
    btn: 'Talk to us',
    note: REPLY
  });

  add('fundraiser-pack', 'Raise money for us', RAISE, 'Ask supporters to fundraise in their own way, with three easy first steps.', 'sunset', { t_font: 'sans', btn_radius: 30 }, 'steps', {
    pic: 'bake-sale-hero',
    title: 'Fundraise your way',
    body: 'Run a bake sale, a quiz or a sponsored walk. However you do it, we will give you everything you need.',
    steps: ['Pick an idea and set a target, however small.', 'Download your free fundraising pack with posters and a sponsorship form.', 'Share your page with friends and family and watch the total grow.'],
    btn: 'Get my free pack',
    note: 'We can help with ideas. Reply and tell us what you are thinking of.'
  });

  add('volunteer-call', 'Volunteers wanted', RAISE, 'Ask for people’s time, with the tasks, the hours and the first date.', 'marigold', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'volunteers-hero',
    kicker: 'WE NEED YOU',
    title: 'Could you spare a few hours a month?',
    body: 'We are looking for friendly people to help at our monthly food distribution. No experience is needed.',
    facts: ['First Saturday of every month, 9:00 to 13:00', 'The Community Hall, 6 Market Street', 'Training is given on your first day'],
    more: ['Packing and handing out food parcels', 'Welcoming people at the door', 'Helping to set up and clear away'],
    moreTitle: 'What you would do',
    btn: 'Sign up to volunteer',
    note: 'Under 18? You can come with an adult.'
  });

  /* ================= Feedback and updates ================= */
  add('nps-survey', 'How likely are you to recommend us?', ASK, 'One question with a row of answers, to measure how people feel.', 'cobalt', { t_font: 'sans', btn_radius: 24 }, 'poll', {
    title: 'How likely are you to recommend us to a friend?',
    body: 'Click the answer that fits best. 1 means not at all likely and 5 means very likely.',
    answers: ['5  Very likely', '4  Likely', '3  Not sure', '2  Unlikely', '1  Not at all likely'],
    note: 'One click is all it takes. You can add a comment on the next page.'
  });

  add('event-feedback', 'How was the event?', ASK, 'Ask attendees how it went right after the event, in one tap.', 'teal', { t_font: 'sans', btn_radius: 24 }, 'poll', {
    pic: 'audience-smiling-hero',
    title: 'How did we do on Saturday?',
    body: 'Thank you for coming. One quick tap helps us make the next one better.',
    answers: ['It was excellent', 'It was good', 'It was fine', 'It could be better'],
    note: 'We read every reply.'
  });

  add('product-feedback', 'Tell us about your purchase', ASK, 'A short check-in after delivery, with an easy way to report a problem.', 'sage', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'unboxing-hero',
    kicker: 'TWO WEEKS ON',
    title: 'How are you getting on with your order?',
    body: 'Your order should have reached you by now. If everything is fine, a short review helps others. If not, we would like to put it right.',
    btn: 'Leave a review',
    note: 'If something is wrong, reply to this email and we will sort it out.'
  });

  add('support-follow-up', 'Did we solve it?', ASK, 'Follow up on a support request to check it was resolved.', 'slate', { t_font: 'sans', btn_radius: 0 }, 'letter', {
    title: 'Did we solve your problem?',
    paras: [
      'Last week you contacted us about a late delivery. We replaced the order and it should have arrived on Tuesday.',
      'We would like to know if everything is now in order. If not, we will keep working on it until it is.'
    ],
    btn: 'Yes, it is solved',
    sign: 'With thanks,\nTunde in customer support'
  });

  add('testimonial-request', 'May we quote you?', ASK, 'Ask a happy customer for a few words, and make it easy to say yes.', 'rose', { t_font: 'serif', btn_radius: 30 }, 'letter', {
    title: 'Would you share a few words about us?',
    paras: [
      'You told us recently how much our service helped your business. We were delighted to hear it.',
      'Would you let us share it? A sentence or two is plenty, and we will always send you a draft first.'
    ],
    list: ['Reply with your words, or click the button', 'We will show you exactly how it will appear', 'You can say no, or ask us to remove it, at any time'],
    btn: 'Share a few words',
    sign: 'With thanks,\nAlex Morgan'
  });

  add('reorder-reminder', 'Time to reorder?', ASK, 'Remind someone who is likely to run out soon, with a one-click reorder.', 'lime', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'pantry-hero',
    kicker: 'RUNNING LOW?',
    title: 'It may be time to reorder',
    body: 'Your last order was 30 days ago. At your usual pace, you may be running low.',
    list: ['Your usual order: 2 kg coffee, 1 kg tea', 'Delivered within three working days', 'Free delivery over £30'],
    listTitle: 'Your last order',
    btn: 'Reorder in one click',
    note: 'To change how often we remind you, reply to this email.'
  });

  add('renewal-reminder', 'Your service renews soon', ASK, 'A plain reminder of a renewal, with the date, the amount and how to change it.', 'gold', { t_font: 'sans', btn_radius: 4 }, 'facts', {
    title: 'Your plan renews in seven days',
    body: 'We will charge your card on the date below unless you tell us otherwise.',
    facts: ['Plan: Standard', 'Renewal date: Monday 9 November', 'Amount: £29.00'],
    more: ['Change your plan', 'Update your card', 'Cancel before the renewal date'],
    moreTitle: 'You can still',
    btn: 'Manage my plan',
    note: 'No action is needed if you want to keep your plan.'
  });

  add('account-details', 'Check your account', ASK, 'Ask someone to review and confirm what you hold about them.', 'ocean', { t_font: 'sans', btn_radius: 4 }, 'steps', {
    title: 'Please check that your details are right',
    body: 'We review our records once a year, and it takes about two minutes.',
    steps: ['Sign in to your account.', 'Check your name, address and phone number.', 'Choose which emails you want to receive.'],
    btn: 'Review my details',
    note: 'We will never ask you for your password by email.'
  });

  /* ================= Product showcase ================= */
  add('product-detail', 'One product in detail', SHOW, 'A single product, with a large photo, its features and a price.', 'sunset', { t_font: 'sans', btn_radius: 24 }, 'side', {
    title: 'Hand-poured soy candle in a clay pot',
    body: 'Made in small batches in Accra. Each candle burns for around 40 hours and the pot can be reused as a planter.',
    pic: 'candle-side',
    sideText: '£14.00\nThree scents: clove and orange, cedar or sea salt.',
    list: ['Burns for around 40 hours', 'Soy wax and a cotton wick', 'The clay pot is made by a local potter'],
    listTitle: 'Details',
    btn: 'Buy now',
    note: 'Free delivery on orders over £30.'
  });

  add('how-to-use', 'How to use it', SHOW, 'Three steps with a short introduction, for something people need guidance on.', 'jade', { t_font: 'sans', btn_radius: 8 }, 'steps', {
    pic: 'kitchen-hero',
    title: 'Getting the best from your spice mix',
    body: 'A small amount goes a long way. Here is how our customers use it.',
    steps: ['Add a teaspoon to the pan with the onions and cook for a minute.', 'Stir in the tomatoes and let them soften before adding stock.', 'Taste, then add a little more if you would like it hotter.'],
    btn: 'See more recipes',
    note: 'Store in a cool, dry place and use within six months.'
  });

  add('ingredient-story', 'Where it comes from', SHOW, 'Tell the story of an ingredient or material, with a photo of the place.', 'lime', { t_font: 'serif', btn_radius: 24 }, 'side', {
    title: 'Our honey, from forest to jar',
    body: 'We buy from 40 beekeepers in the forest reserve. They harvest twice a year and we pay them before the honey leaves the hive.',
    pic: 'honey-side',
    side: 'left',
    sideText: 'The harvest\nEach hive gives about 8 kg of honey in a good season.',
    list: ['Gathered by hand, never heated', 'Packed in glass jars that can be returned', 'A fair price paid before the harvest'],
    listTitle: 'What we promise',
    btn: 'Taste the difference',
    note: REPLY
  });

  add('maker-story', 'Meet the maker', SHOW, 'A portrait quote from the person who makes the product.', 'clay', { t_size: 34, btn_radius: 24 }, 'quote', {
    pic: 'weaver-hero',
    quote: 'I learned to weave from my grandmother. Every pattern is one she taught me.',
    who: 'Amina Yusuf, weaver, Kano',
    title: 'The hands behind our baskets',
    body: 'Amina leads a group of 12 women who weave in the dry season and farm in the wet. Each basket carries a small tag with the name of the person who made it.',
    btn: 'See her baskets',
    note: REPLY
  });

  add('size-guide', 'Size and fit guide', SHOW, 'Questions and answers on sizes, to cut down on returns.', 'berry', { t_font: 'sans', btn_radius: 4 }, 'faq', {
    title: 'Finding the right size',
    body: 'Most returns happen because of fit. These answers should help.',
    qa: [
      ['How do I measure?', 'Measure over light clothing, with the tape snug but not tight. Compare to the chart on each product page.'],
      ['What if I am between sizes?', 'Choose the larger size. Our fabrics are cut generously and most people prefer a looser fit.'],
      ['Can I swap if it does not fit?', 'Yes. Swaps are free within 30 days if the item is unworn.']
    ],
    btn: 'See the size chart'
  });

  add('gift-set', 'A gift set', SHOW, 'Present a ready-made gift with what is in it and a price.', 'rose', { t_font: 'serif', btn_radius: 30 }, 'centre', {
    pic: 'gift-box-hero',
    kicker: 'A READY-MADE GIFT',
    title: 'The Welcome Box',
    body: 'A thoughtful gift for a new home, a new job or a thank you. Packed by hand and wrapped in recycled paper.',
    list: ['One hand-poured candle', 'A jar of forest honey', 'A bar of shea butter soap', 'A handwritten card'],
    listTitle: 'Inside the box',
    btn: 'Send as a gift',
    note: 'Price: £38. Free delivery in the UK.'
  });

  add('restock', 'Back by popular demand', SHOW, 'Announce that a sold-out item is back, with a stock count.', 'sage', { t_font: 'sans', btn_radius: 24 }, 'products', {
    kicker: 'BACK IN STOCK',
    title: 'You asked, and it is back',
    body: 'The most requested item of the autumn is available again, in two colours.',
    items: [
      ['bag-product-1', 'Market tote, indigo', '£32.00', 'Back after six weeks. 40 in stock.', 'A bright indigo woven tote bag'],
      ['bag-product-2', 'Market tote, sunset', '£32.00', 'A new colour, with a deeper orange.', 'A woven tote bag in orange tones']
    ],
    btn: 'Shop now',
    note: 'Stock counts were correct when this email was written.'
  });

  add('seasonal-flavour', 'The seasonal special', SHOW, 'Announce something available for a short season, with a short description.', 'marigold', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'mango-hero',
    kicker: 'IN SEASON NOW',
    title: 'Mango season has arrived',
    body: 'Our mango jam and dried mango are made from this month’s harvest and will be available until the fruit runs out.',
    list: ['Mango jam, 250 g: £5.50', 'Dried mango, 150 g: £4.00', 'Mango chutney, 200 g: £5.00'],
    listTitle: 'This month',
    btn: 'Order now',
    note: 'Made in small batches while the fruit is at its best.'
  });

  add('care-guide', 'Looking after your purchase', SHOW, 'Help customers get the most out of what they bought.', 'teal', { t_font: 'sans', btn_radius: 8 }, 'steps', {
    title: 'How to care for your cotton',
    body: 'A few simple habits will keep the colours bright and the fabric soft for years.',
    steps: ['Wash on a cool cycle, inside out, with similar colours.', 'Dry in the shade. Strong sun can fade bright prints.', 'Iron on the reverse while the fabric is slightly damp.'],
    btn: 'See more care guides',
    note: REPLY
  });

  add('compare-two', 'Which one is right for you?', SHOW, 'Two options side by side, with a short line on who each is for.', 'ocean', { t_font: 'sans', btn_radius: 4 }, 'pair', {
    kicker: 'CHOOSING BETWEEN TWO',
    title: 'Standard or Plus?',
    body: 'Both plans do the same job. The difference is in how many people and how much support you need.',
    left: 'Standard, £20 a month\nFor one person. Email support and all the basic tools.',
    right: 'Plus, £45 a month\nFor teams of up to five. Phone support and shared folders.',
    list: ['You can switch between plans at any time', 'The first 30 days are free', 'No contract'],
    listTitle: 'Either way',
    btn: 'Compare in full'
  });
})();
