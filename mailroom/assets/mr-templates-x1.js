/* More starter layouts, part 1: newsletters, announcements and events.
   Built with the builders in mr-templates-arch.js. The words, dates, places
   and prices are examples to replace. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX) return;
  var X = MR.tplX, G = X.G, add = X.add;
  var NEWS = G['Newsletters'], ANN = G['Announcements'], EVENT = G['Events'];
  var REPLY = 'Reply to this email at any time. A person reads it.';

  /* ================= Newsletters ================= */
  add('weekly-digest', 'Weekly digest', NEWS, 'Five short items, each with its own link, under one clear title.', 'cobalt', { t_font: 'sans', t_size: 28 }, 'digest', {
    kicker: 'THE WEEK IN BRIEF  |  Issue 41',
    title: 'Five things you may have missed',
    body: 'A quick read for Friday. Each item links to the full story.',
    pic: 'newsstand-hero',
    items: [
      ['Export rules for fresh produce change on 1 December', 'What exporters need to file and who it affects.'],
      ['Three new buyers join our directory', 'Two in Nairobi and one in Accra, all looking for packaged foods.'],
      ['A short guide to invoicing in two currencies', 'Worked examples, with a template to copy.'],
      ['Member question: how do I price a first order?', 'Our adviser answers in under 300 words.'],
      ['Next week: a free session on shipping documents', 'Wednesday at 13:00. Places are limited.']
    ],
    btn: 'Read everything online'
  });

  add('top-stories', 'Top stories', NEWS, 'One lead story with a photo, then three shorter ones.', 'sunset', {}, 'digest', {
    kicker: 'FROM THE NEWSROOM',
    title: 'How a small farm cooperative reached three new markets',
    body: 'Twelve growers pooled their harvest, shared one shipping contract and doubled their orders in a year. Our lead story this week looks at how they did it.',
    pic: 'harvest-hero',
    items: [
      ['Port fees fall by 8 per cent from January', 'The new tariff table, with examples.'],
      ['Mobile payments: what changes for small traders', 'A plain guide to the new limits.'],
      ['Reader photo of the week', 'A fabric stall in Kumasi at opening time.']
    ],
    btn: 'Read the lead story'
  });

  add('behind-the-scenes', 'Behind the scenes', NEWS, 'Show how something is made, with a photo beside a short passage.', 'sand', {}, 'side', {
    title: 'How we pack an order, from shelf to doorstep',
    body: 'Customers often ask where their order goes after they click the button. This month our packing team let us follow one parcel from start to finish.',
    pic: 'handmade-side',
    side: 'left',
    sideText: 'Step one\nEvery item is checked against the order, then wrapped in paper made from recycled card.',
    list: ['Orders placed before noon leave the same day', 'Each parcel is checked twice before it is sealed', 'Packaging can go straight into household recycling'],
    listTitle: 'What happens next',
    btn: 'Meet the team',
    note: REPLY
  });

  add('photo-story', 'Photo story', NEWS, 'One large photo and a short caption, for a story that tells itself.', 'berry', { t_font: 'sans', btn_radius: 24, t_size: 34 }, 'centre', {
    pic: 'market-stall-hero',
    kicker: 'PHOTO OF THE MONTH',
    title: 'Market morning in Kano',
    body: 'Stalls open at six and the best fabric is gone by nine. This photograph was taken by a member of our community on her way to work.',
    btn: 'See more photos',
    note: 'Send us your own photograph by replying to this email.'
  });

  add('data-snapshot', 'Data snapshot', NEWS, 'Four figures and what they mean, for a short, factual update.', 'ocean', { t_font: 'sans' }, 'figures', {
    kicker: 'THIS QUARTER IN NUMBERS',
    title: 'Four figures from our third quarter',
    body: 'A short summary of what changed, with the source of each figure given below.',
    figs: ['1,240\nnew members since July', '38\ncountries now represented', '212\nintroductions made to buyers', '94 per cent\nof introductions answered within a week'],
    after: 'Source: our own membership records, 1 July to 30 September. The introduction figures count only introductions we made ourselves.',
    btn: 'Read the full report',
    note: REPLY
  });

  add('long-read', 'Long read', NEWS, 'An essay with one photo, a pull quote and a link to read on.', 'plum', { p_font: 'serif', t_size: 34 }, 'quote', {
    pic: 'cityscape-hero',
    quote: 'Trade follows trust, and trust follows time spent in the same room.',
    who: 'Ngozi Adeyemi, speaking at our spring meeting',
    title: 'Why the best deals start with a conversation',
    body: 'Contracts matter, but the first order usually comes from a person who has met you or heard good things. This essay looks at three small businesses and how each won its first export customer.',
    btn: 'Read the full essay',
    note: REPLY
  });

  add('qa-digest', 'Questions answered', NEWS, 'Three reader questions with short answers and a link to ask your own.', 'teal', { t_font: 'sans' }, 'faq', {
    title: 'Your questions, answered',
    body: 'Every month we answer the questions you send us most often.',
    qa: [
      ['Can I invoice a customer in a different currency?', 'Yes. State the currency on the invoice and the date the exchange rate is fixed.'],
      ['How long should I keep export documents?', 'Check the rule for your country. As a guide, keep them for six years.'],
      ['Do I need insurance for a first shipment?', 'It is not always required, but it is worth asking your freight agent for a quote.']
    ],
    btn: 'Ask your own question'
  });

  add('podcast-episode', 'Podcast episode', NEWS, 'Announce a new episode with a photo, a summary and a play button.', 'violet', { t_font: 'sans', btn_radius: 30 }, 'side', {
    title: 'New episode: building a brand from a market stall',
    body: 'This week our host talks to the founder of a spice brand that started with one table and now sells in four countries.',
    pic: 'microphone-side',
    sideText: 'Episode 28  |  34 minutes\nPricing, packaging and the first big order.',
    list: ['02:10  How it started', '11:45  The first export order', '24:30  What she would do differently'],
    listTitle: 'In this episode',
    btn: 'Listen now',
    note: 'You can also find every episode on the podcast page.'
  });

  add('video-newsletter', 'Video update', NEWS, 'A large picture that links to a video, with a short summary underneath.', 'night', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    pic: 'studio-hero',
    kicker: 'WATCH',
    title: 'Our year in five minutes',
    body: 'A short film about what our members built this year, in their own words.',
    btn: 'Play the video',
    list: ['0:00  Opening', '1:20  Three new markets', '3:45  Looking ahead'],
    listTitle: 'Chapters',
    note: 'Prefer to read? A written summary is on our website.'
  });

  add('link-roundup', 'Link roundup', NEWS, 'A plain list of good reading, with one line on why each is worth it.', 'lime', { t_font: 'sans', btn_radius: 0 }, 'digest', {
    title: 'Worth reading this week',
    body: 'Six articles our team found useful. None of them is ours.',
    items: [
      ['How customs valuation works', 'A clear explanation, with a worked example.'],
      ['Ten questions to ask a freight agent', 'A short checklist before you sign anything.'],
      ['Mobile money in East Africa, explained', 'What it is and how businesses use it.'],
      ['A guide to reading a letter of credit', 'The terms that most often cause delays.'],
      ['Packaging that survives a long journey', 'Tests on five common materials.'],
      ['Small business loans: what lenders look for', 'Plain language, no jargon.']
    ],
    btn: 'Read more recommendations'
  });

  add('editors-picks', 'Editor’s picks', NEWS, 'Three stories chosen by one person, with a short note on why.', 'rose', { p_font: 'serif', btn_radius: 24 }, 'digest', {
    kicker: 'CHOSEN BY THE EDITOR',
    title: 'My three picks this month',
    body: 'Hello, and thank you for reading. These are the three pieces that stayed with me longest.',
    pic: 'reading-hero',
    items: [
      ['A year of running a shop on one phone', 'Practical, honest and surprisingly funny.'],
      ['The quiet return of the village market', 'Photographs and a short essay.'],
      ['What I learned from losing a big client', 'A founder’s account, with no spin.']
    ],
    btn: 'Read all three'
  });

  add('industry-brief', 'Industry brief', NEWS, 'Three changes to watch, each with a short plain-language summary.', 'slate', { t_font: 'sans', btn_radius: 0 }, 'steps', {
    title: 'Three changes to watch this quarter',
    body: 'What is happening in the market and what it may mean for your business.',
    steps: ['Currency: the local currency has moved 4 per cent against the pound since July, so check your price lists.', 'Shipping: two carriers have raised rates for November, so book early if you can.', 'Rules: a new labelling requirement starts in January for packaged food.'],
    btn: 'Read the full brief',
    note: REPLY
  });

  /* ================= Announcements ================= */
  add('new-location', 'We have moved', ANN, 'A new address, new opening hours and a map link.', 'sunset', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'shopfront-hero',
    kicker: 'NEW ADDRESS',
    title: 'We have moved to a bigger space',
    body: 'From Monday 2 November you can find us at our new address. Everything else stays the same.',
    facts: ['14 Harbour Road, Lagos', 'Open Monday to Saturday, 9:00 to 18:00', 'Phone number and email unchanged'],
    more: ['Step-free entrance at the front', 'Parking behind the building', 'A meeting room you can book for free'],
    btn: 'See the map',
    note: 'If you have a delivery coming, nothing changes. We will bring it to the new address.'
  });

  add('price-change', 'Change to our prices', ANN, 'Explain a price change plainly, with the date and the reason.', 'slate', { t_font: 'sans', btn_radius: 0 }, 'letter', {
    title: 'A change to our prices from 1 January',
    paras: [
      'From 1 January our prices will rise by an average of 6 per cent. We have held them since last March, and the cost of materials and shipping has risen since then.',
      'Orders placed before 31 December will be charged at the current price, even if they are delivered later.',
      'If you have a standing order, nothing needs to be done. The new price will apply from your first delivery in January.'
    ],
    list: ['Standard parcels: from £8.00 to £8.50', 'Large parcels: from £14.00 to £15.00', 'Subscriptions: unchanged until March'],
    btn: 'See the full price list',
    sign: 'Thank you for your support,\nAlex Morgan'
  });

  add('new-feature', 'New feature', ANN, 'Introduce one new thing, show it and say how to try it.', 'cobalt', { t_font: 'sans', btn_radius: 8 }, 'side', {
    title: 'Now you can pay in instalments',
    body: 'You asked for a way to spread the cost of larger orders. From today you can split any order over £100 into three payments.',
    pic: 'smartphone-side',
    sideText: 'How it works\nChoose Pay in three at checkout. The first payment is taken today and the rest follow each month.',
    list: ['No fee if you pay on time', 'Available on orders from £100 to £1,000', 'Cancel at any time before the second payment'],
    listTitle: 'Good to know',
    btn: 'Try it on your next order',
    note: REPLY
  });

  add('we-are-hiring', 'We are hiring', ANN, 'Open roles with a short line on each and a link to apply.', 'jade', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'team-meeting-hero',
    kicker: 'JOIN OUR TEAM',
    title: 'Three roles are open this month',
    body: 'We are a small team and every person makes a visible difference. If one of these sounds like you, we would like to hear from you.',
    facts: ['Operations coordinator, Lagos', 'Customer support adviser, remote', 'Part-time bookkeeper, Nairobi'],
    more: ['Closing date: Friday 20 November', 'Applications by email, with a short covering note', 'We reply to every application'],
    moreTitle: 'How to apply',
    btn: 'See all roles'
  });

  add('milestone', 'A milestone', ANN, 'Celebrate a number reached, with thanks and what comes next.', 'marigold', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'celebration-hero',
    kicker: 'THANK YOU',
    title: 'We have reached 5,000 members',
    body: 'Five years ago we had twelve. Every one of the people who joined since has made the community more useful for the next person.',
    list: ['5,000 members in 41 countries', 'More than 900 introductions made this year', 'A new member joins roughly every two hours'],
    listTitle: 'In numbers',
    btn: 'Read our story',
    note: 'Thank you for being one of them.'
  });

  add('service-update', 'Service update', ANN, 'A calm, factual notice about a change to a service, with what to do.', 'night', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    kicker: 'SERVICE UPDATE',
    title: 'Planned maintenance on Saturday 7 November',
    body: 'Our website and ordering system will be unavailable from 22:00 on Saturday until about 02:00 on Sunday while we make improvements.',
    btn: 'See what is affected',
    list: ['Orders placed before 22:00 are not affected', 'Phone support stays open as usual', 'We will email again when we are back'],
    listTitle: 'What this means for you',
    note: 'We are sorry for any inconvenience.'
  });

  add('policy-update', 'Policy update', ANN, 'Summarise a change to terms or rules, with the date it starts.', 'sage', { t_font: 'sans', btn_radius: 0 }, 'left', {
    kicker: 'CHANGES TO OUR TERMS',
    title: 'We have updated our terms of service',
    body: 'The new terms start on 1 December. They are shorter and use plainer language, and they change two things you should know about.',
    list: ['Refunds can now be requested within 30 days, up from 14', 'We no longer share contact details with other members unless you ask us to'],
    listTitle: 'What has changed',
    btn: 'Read the new terms',
    note: 'You do not need to do anything. By continuing to use the service you accept the new terms.'
  });

  add('new-team-member', 'Meet the newest member of our team', ANN, 'Introduce one person with a photo, a short story and what they will do.', 'clay', { t_size: 32, btn_radius: 24 }, 'side', {
    title: 'Please welcome Amara Okoye',
    body: 'Amara joined us this week as our new partnerships manager. She will be the first person to speak to you if you are interested in working with us.',
    pic: 'portrait-side',
    side: 'left',
    sideText: 'About Amara\nShe spent eight years in export finance and speaks English, Igbo and French.',
    list: ['Based in Lagos, travelling often', 'Can be reached on the usual email address', 'Away from 20 December to 4 January'],
    listTitle: 'Good to know',
    btn: 'Say hello',
    note: REPLY
  });

  add('temporary-closure', 'Temporary closure', ANN, 'Tell people when you are closed, when you reopen and who to contact.', 'scarlet', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    kicker: 'NOTICE',
    title: 'We are closed from 24 December to 2 January',
    body: 'Our office and warehouse close for the holidays. Orders placed during this time will be sent from Monday 4 January.',
    btn: 'See opening dates',
    list: ['Last dispatch: Wednesday 23 December', 'Reopening: Monday 4 January, 9:00', 'Urgent matters: email, and we will reply as soon as we can'],
    listTitle: 'Dates',
    note: 'Thank you for a busy year. We wish you a restful break.'
  });

  add('press-release', 'News release', ANN, 'A short, formal release for partners and the press.', 'ocean', { t_font: 'serif', p_font: 'serif', btn_radius: 0 }, 'letter', {
    title: 'Council opens a new export desk for small businesses',
    paras: [
      'FOR IMMEDIATE RELEASE  |  12 November',
      'The Trade Council today opened an export desk to help businesses with fewer than 50 staff sell to new markets. The desk offers free advice on paperwork, shipping and finding buyers.',
      'Members can book a 30-minute appointment online or by phone. The first appointments are available from Monday 16 November.',
      'For more information or to arrange an interview, contact the press office.'
    ],
    btn: 'Read the full release',
    sign: 'Press office\npress@example.com'
  });

  /* ================= Events ================= */
  add('conference-agenda', 'Conference agenda', EVENT, 'A full day, hour by hour, with the speakers listed underneath.', 'cobalt', { t_font: 'sans', btn_radius: 4 }, 'agenda', {
    pic: 'conference-hall-hero',
    kicker: 'ANNUAL CONFERENCE  |  14 NOVEMBER',
    title: 'The programme is now live',
    body: 'One day, three sessions and plenty of time to meet people. Here is how the day runs.',
    when: 'Saturday 14 November, Lagos',
    slots: ['9:00  Doors open and coffee', '10:00  Opening address', '11:00  Panel: financing a first export order', '13:00  Lunch and networking', '14:30  Workshops, choose one', '16:30  Closing remarks'],
    peopleTitle: 'Speakers',
    people: ['Ngozi Adeyemi, trade adviser', 'Kwame Mensah, freight director', 'Fatima Bello, founder, Bello Textiles'],
    btn: 'Reserve your place',
    note: 'Lunch is included in your ticket. Tell us about any dietary needs when you book.'
  });

  add('speaker-lineup', 'Speaker line-up', EVENT, 'Introduce the people who are speaking, one short story each.', 'plum', { btn_radius: 24 }, 'digest', {
    kicker: 'MEET THE SPEAKERS',
    title: 'Six voices you will hear in March',
    body: 'Each of them has built something and is willing to say what went wrong as well as what went right.',
    pic: 'speakers-hero',
    items: [
      ['Ngozi Adeyemi, trade adviser', 'Fifteen years helping small firms prepare for their first export.'],
      ['Kwame Mensah, freight director', 'Runs a shipping line between Tema and Rotterdam.'],
      ['Fatima Bello, founder', 'Started a textile company with one loom and now employs 40 people.'],
      ['Joseph Otieno, bank manager', 'Explains what lenders look for in a trade loan.']
    ],
    btn: 'Get your ticket'
  });

  add('early-bird', 'Early bird tickets', EVENT, 'A deadline, a lower price and one button to book.', 'sunset', { t_font: 'sans', btn_radius: 24, t_size: 34 }, 'code', {
    pic: 'crowd-lights-hero',
    kicker: 'EARLY BIRD PRICE',
    title: 'Book before Friday and save £40',
    body: 'Tickets for the spring summit are £95 until the end of this week. After that they rise to £135.',
    codeLabel: 'EARLY BIRD ENDS',
    code: 'Friday 20 November, 23:59',
    terms: 'Includes lunch, all sessions and the recordings.',
    btn: 'Book at the early price',
    note: 'Groups of five or more get one place free. Reply to ask how.'
  });

  add('last-chance-tickets', 'Last chance for tickets', EVENT, 'A short, urgent reminder with the number of places left.', 'scarlet', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    kicker: 'LAST CHANCE',
    title: 'Only 12 places left for Thursday',
    body: 'Booking closes tomorrow at noon. If you would like to be there, this is the moment to reserve a place.',
    btn: 'Reserve my place',
    list: ['Thursday 19 November, 18:30', 'The Garden Room, 14 Harbour Road', 'Free for members, £10 for guests'],
    listTitle: 'Details',
    note: 'Once the places are gone, we will start a waiting list.'
  });

  add('sold-out-waitlist', 'Sold out: join the waiting list', EVENT, 'Tell people the event is full and offer a place on the waiting list.', 'slate', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'crowd-lights-hero',
    kicker: 'SOLD OUT',
    title: 'Every place has been taken',
    body: 'Thank you for the response. We cannot fit more people in the room, but places are released when people cancel.',
    list: ['Join the waiting list and we will email you the moment a place opens', 'The session will be recorded, and members will get the link', 'The next event is on Wednesday 9 December'],
    listTitle: 'What you can do',
    btn: 'Join the waiting list'
  });

  add('virtual-summit', 'Virtual summit', EVENT, 'An online event, with how to join, the times and what you will get.', 'turquoise', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'virtual-hero',
    kicker: 'ONLINE  |  FREE',
    title: 'Join our two-day virtual summit',
    body: 'Sixteen speakers, live questions and a chat room, from wherever you are.',
    facts: ['Tuesday 17 and Wednesday 18 November', '13:00 to 17:00 (GMT) each day', 'Join on any device. No software needed.'],
    more: ['Live sessions with time for your questions', 'A private chat room for attendees', 'Recordings and slides sent within 48 hours'],
    btn: 'Register for free',
    note: 'Cannot attend live? Register anyway and we will send the recordings.'
  });

  add('open-day', 'Open day', EVENT, 'Invite people in to see your work, with a simple timetable.', 'lime', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'openday-hero',
    align: 'center',
    kicker: 'EVERYONE IS WELCOME',
    title: 'Come and see where it happens',
    body: 'Our doors are open on Saturday. Meet the team, try a demonstration and ask us anything.',
    facts: ['Saturday 28 November, 10:00 to 16:00', '14 Harbour Road, Lagos', 'Free entry, no booking needed'],
    more: ['Guided tours every hour', 'Demonstrations from 11:00', 'Refreshments and activities for children'],
    btn: 'Get directions',
    note: 'The building has step-free access throughout.'
  });

  add('charity-gala', 'Charity gala', EVENT, 'A formal invitation to a fundraising dinner, with the cause and the price.', 'berry', { t_size: 34, btn_radius: 0 }, 'dark', {
    pic: 'gala-hero',
    kicker: 'AN EVENING IN SUPPORT OF SCHOOL MEALS',
    title: 'You are invited to our annual dinner',
    body: 'Friday 4 December, 19:00 at the Grand Hall. A three-course dinner, live music and an auction.',
    btn: 'Book a table',
    list: ['Tables of ten from £800', 'Single places from £90', 'Every pound after costs pays for school meals'],
    listTitle: 'Tickets',
    note: 'Dress: formal or national dress.'
  });

  add('trade-fair-stand', 'Visit us at the fair', EVENT, 'Say where you will be at a trade fair, with the stand number and times.', 'ocean', { t_font: 'sans', btn_radius: 4 }, 'facts', {
    pic: 'fair-stand-hero',
    kicker: 'TRADE FAIR',
    title: 'Find us at stand B14',
    body: 'We are exhibiting at the Regional Food and Drink Fair. Come and taste the new range and talk to our buyers.',
    facts: ['Stand B14, Hall 2', 'Wednesday 18 to Friday 20 November', 'Open daily from 9:30 to 17:00'],
    more: ['Free samples of the new range', 'A short meeting with our export manager', 'A printed price list to take away'],
    btn: 'Book a time to meet',
    note: 'Cannot visit? Reply and we will post you a sample box.'
  });

  add('panel-discussion', 'Panel discussion', EVENT, 'A live discussion, with the panel, the chair and the questions it will answer.', 'gold', { t_font: 'serif', btn_radius: 4 }, 'agenda', {
    kicker: 'LIVE PANEL',
    title: 'Can small firms compete on price?',
    body: 'Four people who sell across borders discuss what works and what does not. You can send in questions before the event.',
    when: 'Thursday 26 November, 18:00 to 19:30',
    slots: ['18:00  Welcome', '18:10  Each speaker gives a three-minute view', '18:30  Discussion', '19:00  Questions from the audience', '19:25  Closing thoughts'],
    peopleTitle: 'On the panel',
    people: ['Ngozi Adeyemi, trade adviser (chair)', 'Kwame Mensah, freight director', 'Fatima Bello, founder', 'Joseph Otieno, bank manager'],
    btn: 'Save my seat'
  });

  add('fun-run', 'Charity run', EVENT, 'Invite people to take part, with the route, the cost and how to sponsor.', 'lime', { t_font: 'sans', btn_radius: 30 }, 'facts', {
    pic: 'runners-hero',
    kicker: 'SUNDAY 15 NOVEMBER',
    title: 'Run, jog or walk five kilometres with us',
    body: 'All ages and abilities are welcome. Every pound raised helps pay for books in rural schools.',
    facts: ['Start: 8:00 at Freedom Park', 'Entry: £12, children under 12 free', 'Medal for everyone who finishes'],
    more: ['A flat, marked route', 'Water stations every kilometre', 'Changing rooms and bag storage'],
    btn: 'Sign up to run',
    note: 'Cannot run? You can still sponsor a friend with the link they send you.'
  });

  add('farewell-party', 'Farewell and celebration', EVENT, 'A friendly invitation to say goodbye or mark a moment together.', 'rose', { t_font: 'serif', btn_radius: 30 }, 'centre', {
    pic: 'party-hero',
    kicker: 'COME AND JOIN US',
    title: 'After twelve years, we are having a party',
    body: 'Rosa is retiring at the end of the month. Come and say thank you, share a memory and have something to eat.',
    list: ['Friday 27 November, from 17:00', 'The Garden Room, 14 Harbour Road', 'Please bring a story or a photograph'],
    listTitle: 'Details',
    btn: 'Let us know you are coming',
    note: 'If you cannot come, you can send a message to be read out on the day.'
  });

  add('ticket-info', 'Your ticket and what to bring', EVENT, 'Confirm a booking and give everything needed for the day.', 'teal', { t_font: 'sans', btn_radius: 4 }, 'steps', {
    title: 'You are booked in. Here is what to do next.',
    body: 'We are looking forward to seeing you on Saturday 14 November.',
    steps: ['Save your ticket to your phone. You will need it at the door.', 'Arrive from 9:00. The first session starts at 10:00.', 'Bring a photo ID and a few business cards if you have them.', 'Tell us about any dietary needs before Wednesday.'],
    btn: 'Open my ticket',
    note: 'If your plans change, reply to this email and we will free up your place.'
  });

  add('event-rescheduled', 'New date for the event', EVENT, 'Explain a change of date calmly and say what happens to bookings.', 'night', { t_font: 'sans', btn_radius: 0 }, 'dark', {
    kicker: 'CHANGE OF DATE',
    title: 'The meeting has moved to Thursday 3 December',
    body: 'A venue problem means we cannot hold the event on the original date. The time and place stay the same.',
    btn: 'Confirm I can still come',
    list: ['Your booking is moved automatically', 'If the new date does not suit you, you can have a full refund', 'No action is needed if you can still come'],
    listTitle: 'What happens to your booking',
    note: 'We are sorry for the change and thank you for understanding.'
  });
})();
