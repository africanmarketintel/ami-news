/* More starter layouts, part 4: customer stories, questions and polls, and
   learning and courses. The words, dates, places and prices are examples to
   replace. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX) return;
  var X = MR.tplX, G = X.G, add = X.add;
  var STORY = G['Customer stories'], POLL = G['Questions and polls'], LEARN = G['Learning and courses'];
  var REPLY = 'Reply to this email at any time. A person reads it.';

  /* ================= Customer stories ================= */
  add('customer-spotlight', 'Customer spotlight', STORY, 'One customer, in their words, with a photo and what they achieved.', 'sunset', { t_font: 'serif', btn_radius: 24 }, 'quote', {
    pic: 'shop-owner-hero',
    quote: 'We started with one oven. Last year we opened our third bakery.',
    who: 'Bisi Alade, owner, Sweet Crust Bakery, Ibadan',
    title: 'How a family bakery tripled its orders',
    body: 'Bisi joined us two years ago to find larger customers. Her story shows what a clear price list and a regular delivery can do.',
    list: ['Orders up from 40 to 130 a week', 'Two new employees', 'A contract with a hotel group'],
    btn: 'Read Bisi’s story',
    note: REPLY
  });

  add('five-star-review', 'Five-star review', STORY, 'Put one strong review at the centre, with a button to read more.', 'marigold', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'quote', {
    quote: 'The best decision we made this year. Orders arrive on time and the team is always helpful.',
    who: 'Five stars, from Samuel K., Nairobi',
    title: 'Why customers keep coming back',
    body: 'We read every review. This one arrived on Monday, and we thought you would like to see it.',
    btn: 'Read more reviews',
    note: 'Your own review helps other people. You can leave one at any time.'
  });

  add('case-study', 'Case study', STORY, 'A problem, a solution and a result, in that order.', 'slate', { t_font: 'sans', btn_radius: 0 }, 'steps', {
    pic: 'warehouse-hero',
    title: 'How one exporter cut delays from ten days to three',
    body: 'A mid-sized food exporter was losing sales to late deliveries. This is what changed.',
    steps: ['The problem: shipments waited a week for customs paperwork.', 'The change: the firm sent all documents in one batch, two days before loading.', 'The result: average delays fell from ten days to three, and repeat orders rose by a fifth.'],
    btn: 'Read the full case study',
    note: 'The figures come from the firm’s own records for January to June.'
  });

  add('before-after', 'Before and after', STORY, 'Two columns that show what changed, with a short conclusion.', 'turquoise', { t_font: 'sans', btn_radius: 24 }, 'pair', {
    pic: 'workshop-hero',
    kicker: 'THE DIFFERENCE A YEAR MAKES',
    title: 'From one stall to a workshop',
    body: 'Here is how Ada’s business looked a year ago and how it looks today.',
    left: 'A year ago\nOne stall, two staff and orders by phone only.',
    right: 'Today\nA workshop, nine staff and an online shop.',
    list: ['Sales up fourfold', 'Delivery now to six countries', 'Plans for a second workshop'],
    listTitle: 'What changed',
    btn: 'Read Ada’s story'
  });

  add('review-roundup', 'What people are saying', STORY, 'Four short reviews in a row, each with a name and a place.', 'berry', { t_font: 'sans', btn_radius: 24 }, 'digest', {
    kicker: 'REVIEWS',
    title: 'What customers said this month',
    body: 'Short, honest words from the people who use us. We have printed them as they were sent.',
    items: [
      ['“Fast, friendly and the prices are fair.”', 'Chinedu, Lagos'],
      ['“They fixed my problem in an hour.”', 'Abena, Accra'],
      ['“I have recommended them to three friends.”', 'Wanjiru, Nairobi'],
      ['“Clear instructions and no hidden fees.”', 'Tariq, London']
    ],
    btn: 'Read all reviews'
  });

  add('results-numbers', 'Our results', STORY, 'Four results, plainly stated, with where the numbers come from.', 'cobalt', { t_font: 'sans', btn_radius: 4 }, 'figures', {
    pic: 'handshake-hero',
    kicker: 'RESULTS',
    title: 'What our clients achieved this year',
    body: 'Figures from 86 clients we worked with between January and September.',
    figs: ['74\nclients grew their sales', '31\nopened a new market', '19 per cent\naverage rise in orders', '26\nnew jobs created'],
    after: 'Source: our client survey, September. 86 of 112 clients replied.',
    btn: 'See how we did it',
    note: REPLY
  });

  add('member-success', 'Member success story', STORY, 'A member’s progress, with a photo and a short list of what they did.', 'jade', { t_font: 'sans', btn_radius: 24 }, 'side', {
    title: 'From first call to first order in 90 days',
    body: 'Kemi Oladipo joined in July with a product and no buyers. By October she had signed her first supplier in Germany.',
    pic: 'portrait-side',
    sideText: 'Kemi Oladipo\nFounder, Kemi’s Kitchen, Abuja',
    list: ['Week 2: joined the directory', 'Week 5: met three buyers at a networking evening', 'Week 12: shipped her first pallet'],
    listTitle: 'Her 90 days',
    btn: 'Read her story',
    note: REPLY
  });

  add('partner-story', 'Partner story', STORY, 'Tell the story of a partnership from both sides.', 'plum', { t_font: 'serif', btn_radius: 4 }, 'quote', {
    pic: 'two-people-hero',
    quote: 'We trusted each other from the first meeting. That is why it worked.',
    who: 'Amara and Kwame, business partners',
    title: 'Two firms, one shipment a week',
    body: 'A farm in Ghana and a restaurant group in London now trade every week. They met at one of our events two years ago.',
    btn: 'Read the full story',
    note: REPLY
  });

  add('community-photos', 'From our community', STORY, 'Share a photo sent in by a customer, with the story behind it.', 'coral', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'customer-photo-hero',
    kicker: 'SENT IN BY YOU',
    title: 'Your photos make our day',
    body: 'This month’s photo is from Funmi, who sent us her first batch of hand-dyed cloth drying in the sun.',
    btn: 'See the gallery',
    note: 'Want to see yours here? Reply with a photograph and a few words.'
  });

  add('recognition', 'We were recognised', STORY, 'Share an award or mention, and thank those who made it possible.', 'gold', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'award-hero',
    kicker: 'THANK YOU',
    title: 'We have been named a finalist',
    body: 'We are one of five finalists in the Small Business Awards for customer service. The result is announced on 8 December.',
    list: ['Finalists chosen from 340 entries', 'Judged on customer reviews and responses', 'Winners announced online on 8 December'],
    listTitle: 'About the award',
    btn: 'Read the shortlist',
    note: 'Thank you to everyone who took the time to write a review.'
  });

  /* ================= Questions and polls ================= */
  add('quick-poll', 'Quick poll', POLL, 'One question, three answer buttons. Results are shared next week.', 'cobalt', { t_font: 'sans', btn_radius: 24 }, 'poll', {
    kicker: 'ONE QUESTION',
    title: 'When should we hold our next event?',
    body: 'Click the option that suits you best. We will share the results next week.',
    answers: ['A weekday evening', 'A weekend morning', 'An online session'],
    note: 'Your answer takes one click and is anonymous.'
  });

  add('this-or-that', 'This or that', POLL, 'A light choice between two options, with a photo for each.', 'sunset', { t_font: 'sans', btn_radius: 30 }, 'poll', {
    pic: 'two-choices-hero',
    kicker: 'YOU DECIDE',
    title: 'Which colour for the new tote?',
    body: 'We are making one more colour of the market tote. The most popular choice goes into production.',
    answers: ['Indigo blue', 'Sunset orange'],
    note: 'Voting closes on Friday. We will share the winner on Monday.'
  });

  add('quiz-time', 'Quiz', POLL, 'A fun question with four answers and the answer revealed later.', 'violet', { t_font: 'sans', btn_radius: 24 }, 'poll', {
    kicker: 'TEST YOUR KNOWLEDGE',
    title: 'How many countries do our members live in?',
    body: 'Pick your answer below. We will reveal the correct one in next week’s email.',
    answers: ['About 20', 'About 30', 'About 40', 'About 50'],
    note: 'There is no prize, only bragging rights.'
  });

  add('reader-question', 'A question for you', POLL, 'An open question that asks for a reply, written like a letter.', 'sand', { p_font: 'serif', btn_radius: 4 }, 'letter', {
    title: 'What is the hardest part of exporting?',
    paras: [
      'We are writing a guide for people who are about to send their first shipment. Before we start, we would like to hear from people who have done it.',
      'What was the hardest part? Reply to this email with a few words. There are no wrong answers.',
      'We will read every reply and share the common themes next month.'
    ],
    sign: 'Thank you,\nThe editorial team'
  });

  add('vote-next', 'Vote for what comes next', POLL, 'Let readers choose the next topic, project or product.', 'jade', { t_font: 'sans', btn_radius: 24 }, 'poll', {
    pic: 'ballot-hero',
    kicker: 'HAVE YOUR SAY',
    title: 'What should our next guide cover?',
    body: 'We have room for one more guide this quarter. The topic with the most votes wins.',
    answers: ['Pricing for export', 'Shipping documents', 'Getting paid on time', 'Finding buyers'],
    note: 'Voting closes at midnight on Sunday.'
  });

  add('name-vote', 'Help us pick a name', POLL, 'Ask people to choose between names for a new product or project.', 'rose', { t_font: 'serif', btn_radius: 30 }, 'poll', {
    pic: 'notebook-colour-hero',
    kicker: 'NAME THE NEW RANGE',
    title: 'Which name do you prefer?',
    body: 'We are launching a new range in the spring and cannot agree on the name. Tell us which one you like best.',
    answers: ['Harmattan', 'Sahel', 'Baobab', 'Savannah'],
    note: 'The name with the most votes will be announced in our next email.'
  });

  add('survey-short', 'A two-minute survey', POLL, 'Introduce a short survey, say how long it takes and why it matters.', 'teal', { t_font: 'sans', btn_radius: 4 }, 'facts', {
    kicker: 'HELP US PLAN',
    title: 'Two minutes to shape our year',
    body: 'We are planning next year’s programme and your answers will help us decide where to put our time.',
    facts: ['Seven questions', 'Takes about two minutes', 'Answers are anonymous'],
    more: ['We will share the results in January', 'You can skip any question', 'Your answers are not shared with anyone else'],
    moreTitle: 'Good to know',
    btn: 'Start the survey',
    note: 'The survey closes on Friday 27 November.'
  });

  add('ask-me-anything', 'Ask me anything', POLL, 'Invite questions for a live or written session with a named person.', 'plum', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'microphone-hero',
    kicker: 'OPEN QUESTIONS',
    title: 'Ask our trade adviser anything',
    body: 'Ngozi Adeyemi has helped 300 firms with their first export. On Thursday she will answer your questions live.',
    list: ['Thursday 19 November, 13:00 (GMT)', 'Send your question in advance, or ask on the day', 'A written summary goes out afterwards'],
    listTitle: 'How it works',
    btn: 'Send my question',
    note: 'No question is too small or too basic.'
  });

  add('predict-result', 'Make your prediction', POLL, 'A playful question about what will happen next, with a reveal date.', 'lime', { t_font: 'sans', btn_radius: 24 }, 'poll', {
    kicker: 'MAKE YOUR GUESS',
    title: 'How many members will we have by December?',
    body: 'We have 4,820 today. Choose the range you think is right. We will reveal the answer on 1 December.',
    answers: ['Under 5,000', '5,000 to 5,200', 'Over 5,200'],
    note: 'No prize, but you might surprise yourself.'
  });

  add('feedback-wall', 'Tell us in one word', POLL, 'Ask people to describe something in one word, with buttons to start them off.', 'coral', { t_font: 'sans', btn_radius: 30 }, 'poll', {
    kicker: 'ONE WORD',
    title: 'How would you describe our service?',
    body: 'Choose the word that fits best, or reply with your own.',
    answers: ['Helpful', 'Fast', 'Friendly', 'Could be better'],
    note: 'Your answer helps us see what to keep and what to change.'
  });

  /* ================= Learning and courses ================= */
  add('course-launch', 'Course launch', LEARN, 'Announce a new course with its dates, price, what you will learn and a button.', 'cobalt', { t_font: 'sans', btn_radius: 8 }, 'facts', {
    pic: 'classroom-hero',
    kicker: 'NEW COURSE',
    title: 'Export basics: six weeks to your first order',
    body: 'A practical course for anyone who wants to sell across borders and does not know where to begin.',
    facts: ['Starts Monday 2 November', 'Six weeks, two evenings a week', '£180, or £150 for members'],
    more: ['How to price for export', 'Documents you need and how to fill them in', 'How to find and talk to buyers'],
    moreTitle: 'You will learn',
    btn: 'Save my place',
    note: 'Classes are small, with a maximum of 20 people.'
  });

  add('free-lesson', 'A free lesson', LEARN, 'Offer a free first lesson so people can try before they commit.', 'lime', { t_font: 'sans', btn_radius: 24 }, 'side', {
    title: 'Try the first lesson free',
    body: 'You do not need to enrol to see whether the course is right for you. The first lesson is free and takes 20 minutes.',
    pic: 'laptop-learning-side',
    sideText: 'Lesson one\nHow to work out what it costs you to make one unit.',
    list: ['Watch at your own pace', 'Includes a worksheet to print', 'No card needed'],
    listTitle: 'What you get',
    btn: 'Start the free lesson',
    note: REPLY
  });

  add('five-day-challenge', 'Five-day challenge', LEARN, 'A short daily task for a week, to build a habit or learn a skill.', 'violet', { t_font: 'sans', btn_radius: 30 }, 'steps', {
    pic: 'notebook-colour-hero',
    title: 'The five-day pricing challenge',
    body: 'Spend ten minutes a day for five days and finish with a price list you can stand behind.',
    steps: ['Monday: list everything that goes into one product.', 'Tuesday: add up what it costs you to make and send.', 'Wednesday: look at three competitors’ prices.', 'Thursday: choose a price and a lowest price.', 'Friday: write your price list and share it with us.'],
    btn: 'Join the challenge',
    note: 'It is free, and you will get one email each morning.'
  });

  add('tips-weekly', 'Tips of the week', LEARN, 'Five short, practical tips with a link to read more on each.', 'turquoise', { t_font: 'sans', btn_radius: 8 }, 'digest', {
    kicker: 'FIVE QUICK TIPS',
    title: 'Five ways to get paid faster',
    body: 'Small changes that make a real difference to how quickly customers pay.',
    items: [
      ['Put the due date at the top of every invoice', 'People look there first.'],
      ['Send it the day you deliver', 'Not at the end of the month.'],
      ['Offer one easy way to pay', 'A link beats a bank form.'],
      ['Follow up three days before the due date', 'A short, friendly reminder is enough.'],
      ['Ask for part-payment up front on big orders', 'A third at the start is common.']
    ],
    btn: 'Read the full guide'
  });

  add('guide-download', 'Download our guide', LEARN, 'Offer a free guide in exchange for a click, with what it covers.', 'sage', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'guide-cover-hero',
    kicker: 'FREE GUIDE',
    title: 'The first-time exporter’s guide',
    body: '32 pages in plain language, written by people who have done it. Read it in an hour.',
    list: ['Pricing and costs', 'Documents and customs', 'Choosing a shipping partner', 'Getting paid safely'],
    listTitle: 'Inside',
    btn: 'Download the free guide',
    note: 'The guide is a PDF. It is free and you do not need an account.'
  });

  add('cheat-sheet', 'One-page cheat sheet', LEARN, 'A short, printable summary, with the key points shown in the email itself.', 'gold', { t_font: 'sans', btn_radius: 4 }, 'steps', {
    title: 'A cheat sheet for your first shipment',
    body: 'Print it and keep it by your desk. Here are the five things to check before the lorry leaves.',
    steps: ['The invoice shows the right currency and the buyer’s full address.', 'The packing list matches what is in the boxes.', 'The goods are labelled with the country of origin.', 'Insurance covers the full value of the load.', 'The buyer has confirmed the delivery date.'],
    btn: 'Download the printable version'
  });

  add('webinar-replay', 'Watch the replay', LEARN, 'Share a recording, with chapters so people can jump to what they need.', 'ocean', { t_font: 'sans', btn_radius: 24 }, 'centre', {
    pic: 'virtual-hero',
    kicker: 'MISSED IT?',
    title: 'The recording is ready',
    body: 'Thank you to everyone who joined. If you could not, the full session is below, with the slides.',
    list: ['0:00  Welcome', '4:30  How to price an export order', '28:15  Your questions answered', '44:00  What to do next'],
    listTitle: 'Chapters',
    btn: 'Watch the replay',
    note: 'The recording will be available for 90 days.'
  });

  add('course-certificate', 'Well done: your certificate', LEARN, 'Congratulate someone on finishing a course and give their certificate link.', 'marigold', { t_font: 'serif', t_size: 36, btn_radius: 30 }, 'centre', {
    pic: 'graduation-hero',
    kicker: 'WELL DONE',
    title: 'You have finished the course',
    body: 'You completed all six weeks and passed the final test. We hope it was useful.',
    list: ['Download your certificate', 'Share it on your professional profile', 'Join our alumni group for monthly sessions'],
    listTitle: 'What next',
    btn: 'Download my certificate',
    note: 'Tell us how it went by replying to this email.'
  });

  add('reading-list', 'Reading list', LEARN, 'A short, annotated list of books and articles on one topic.', 'rose', { p_font: 'serif', btn_radius: 4 }, 'digest', {
    kicker: 'WORTH YOUR TIME',
    title: 'Five books for people starting a business',
    body: 'Chosen by our own members. Each comes with a line on why they liked it.',
    items: [
      ['A practical guide to pricing', 'By Chinedu Okafor. A step-by-step way to set a price you can defend.'],
      ['Selling across borders', 'By Abena Mensah. What to know before your first export order.'],
      ['Negotiating without losing the relationship', 'By Tariq Rahman. Short chapters and real examples.'],
      ['Why small firms get stuck', 'By Wanjiru Kamau. How to move from doing everything to leading.'],
      ['Keeping the books straight', 'By Kemi Oladipo. A simple way to manage money each week.']
    ],
    btn: 'See the full list'
  });

  add('mentor-programme', 'Mentor programme', LEARN, 'Invite people to take part in a mentoring scheme, as mentor or mentee.', 'teal', { t_font: 'sans', btn_radius: 24 }, 'facts', {
    pic: 'two-people-hero',
    kicker: 'MENTORING',
    title: 'Get matched with someone who has been there',
    body: 'Our six-month programme pairs new business owners with people who have grown their own. Both sides learn.',
    facts: ['Applications close Friday 4 December', 'First meeting in January', 'One hour a month, online or in person'],
    more: ['A mentor who matches your sector', 'A short guide for both of you', 'A certificate at the end'],
    moreTitle: 'What you get',
    btn: 'Apply to take part',
    note: 'Would you rather be a mentor? Reply and we will send you the details.'
  });
})();
