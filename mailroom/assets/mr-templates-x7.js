/* More starter layouts, part 7: newsletter and update styles drawn from
   common practice: community voices, tips, a top ten, weekly picks, a memo,
   problem and solution, themed issues, values, a welcome after acceptance,
   plans and prices, and a weekly gathering. The words, dates, prices and
   places are examples to replace. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.tplX || !MR.tplX.B.blocks) return;
  var X = MR.tplX, G = X.G, add = X.add, B = X.B, K = MR.tplKit, PC = X.PASTEL;
  var NEWS = G['Newsletters'], ANN = G['Announcements'], SALE = G['Sales and offers'], SHOW = G['Product showcase'],
      STORY = G['Customer stories'], WELCOME = G['Welcome'], EVENTS = G['Events'];
  var heading = K.heading, text = K.text, button = K.button, divider = K.divider, spacer = K.spacer, bullets = K.bullets;

  // A memo: who it is to and from, a checklist of what is inside, and one question.
  B.memo = function (o, p) {
    var b = [heading(o.title, 'left'), text(o.head, 'left'), divider()];
    b.push(heading('In this issue', 'left', 'small'));
    b.push(bullets(o.checklist.join('\n')));
    b.push(divider());
    b.push(heading(o.question, 'left', 'small'));
    o.answers.forEach(function (a) { b.push(button('left', false, a)); });
    b.push(spacer('small'));
    if (o.note) b.push(text(o.note, 'left'));
    return b;
  };

  add('community-voices', 'Voices from our community', STORY, 'Three people each give a short quote about what an occasion means to them.', 'violet', { t_font: 'serif', btn_radius: 30 }, 'blocks', {
    kicker: 'THIS MONTH',
    title: 'Three people on what this month means to them',
    body: 'We asked members of our community to tell us in a few words.',
    sections: [
      { bg: PC.peach[0], ink: PC.peach[1], title: 'Amara, a baker', body: '“It reminds me that the work I do stands on the work of people before me.”', btn: 'Read Amara’s story' },
      { bg: PC.aqua[0], ink: PC.aqua[1], title: 'Tunde, a teacher', body: '“My pupils ask better questions every year. That gives me hope.”', btn: 'Read Tunde’s story' },
      { bg: PC.butter[0], ink: PC.butter[1], title: 'Efua, a designer', body: '“I want my work to be something my grandmother would recognise.”', btn: 'Read Efua’s story' }
    ],
    btn: 'Share your own words',
    keep: false
  });

  add('styling-tips', 'Styling tips', SHOW, 'Three practical tips for using what you sell, shown with a photograph.', 'rose', { t_font: 'serif', btn_radius: 30 }, 'steps', {
    pic: 'flowers-product-1',
    title: 'Three ways to arrange a bunch of flowers',
    body: 'You do not need a florist. These three habits make a bunch look arranged.',
    steps: ['Cut the stems at three different lengths so the flowers step down.', 'Mix two or three kinds of flower and one kind of leaf.', 'Change the water every two days and trim the stems each time.'],
    btn: 'Shop the vases',
    align: 'left',
    keep: false
  });

  add('new-on-menu', 'New on the menu', SALE, 'Introduce a new dish with a photograph, what is in it and a code for the first order.', 'clay', { t_font: 'serif', btn_radius: 30 }, 'shop', {
    pic: 'kitchen-hero',
    kicker: 'NEW DISH',
    title: 'Coconut and lentil curry',
    body: 'Slow-cooked red lentils in coconut milk with ginger and lime. Warm, mild and ready in four minutes.',
    lists: [['What is in it', ['Red lentils, coconut milk, ginger and lime', 'Served with rice and a flatbread', 'Ready in four minutes']]],
    codeLabel: 'YOUR CODE', code: 'NEWDISH', terms: 'Takes £3 off your next order. Valid until 30 April.',
    btn: 'Order it now',
    keep: false
  });

  add('top-ten', 'Our top ten', NEWS, 'A numbered list of ten short picks, each with one line on why.', 'ocean', { t_font: 'sans', t_size: 32, btn_radius: 4 }, 'digest', {
    kicker: 'THE MONTHLY LIST',
    title: 'Ten places we loved this month',
    body: 'Our picks, in no particular order, each with one line on why.',
    items: [
      ['1. The corner bakery', 'Bread that is still warm at nine.'], ['2. The Sunday market', 'The best mangoes in the city.'],
      ['3. The reading room', 'Quiet, free and open until nine.'], ['4. The tea stall by the station', 'Strong tea, fair prices.'],
      ['5. The repair café', 'They fixed a lamp in ten minutes.'], ['6. The riverside walk', 'Best at sunset.'],
      ['7. The print shop', 'Posters made while you wait.'], ['8. The seed library', 'Borrow seeds and bring some back.'],
      ['9. The night market', 'Lanterns, music and good food.'], ['10. The community garden', 'Open to everyone on Saturdays.']
    ],
    btn: 'See the full list online'
  });

  add('weekly-picks', 'Weekly picks', NEWS, 'A regular column on a set day with one read, one piece of news and one thing to try.', 'turquoise', { t_font: 'sans', t_size: 32, btn_radius: 8 }, 'blocks', {
    kicker: 'EVERY WEDNESDAY',
    title: 'Wednesday picks',
    body: 'One thing to read, one thing to know and one thing to try.',
    sections: [
      { bg: PC.butter[0], ink: PC.butter[1], title: 'One thing to read', body: 'A short history of the market stall, from the first traders to today.', btn: 'Read it' },
      { bg: PC.aqua[0], ink: PC.aqua[1], title: 'One thing to know', body: 'Market fees are going up by 5 per cent from 1 June.', btn: 'See the new fees' },
      { bg: PC.blush[0], ink: PC.blush[1], title: 'One thing to try', body: 'A five-minute stall layout that makes it easier to stop and look.', btn: 'Try it this week' }
    ],
    keep: false
  });

  add('memo', 'Memo', NEWS, 'A newsletter written as a memo, with a checklist of what is inside and one question to answer.', 'slate', { t_font: 'courier', p_font: 'courier', t_size: 28, btn_radius: 0 }, 'memo', {
    title: 'MEMO',
    head: 'To: Our readers\nFrom: The team\nSubject: What is in this issue',
    checklist: ['A short note on the new opening hours', 'Three questions we were asked this month', 'A discount for readers only'],
    question: 'One question: how often would you like to hear from us?',
    answers: ['Every week', 'Every month', 'Only when it matters'],
    note: 'Your answer takes one click and helps us plan.',
    keep: false
  });

  add('problem-solution', 'Problem and solution', ANN, 'Name a problem your readers have, offer a quick fix and back it with two results and a quote.', 'cobalt', { t_font: 'sans', t_size: 32, btn_radius: 8 }, 'shop', {
    kicker: 'A COMMON PROBLEM',
    title: 'Still updating your prices by hand?',
    body: 'Most small shops spend about two hours a week on price changes. There is a simpler way.',
    reasonsTitle: 'What changes',
    reasons: ['Change a price once and it updates everywhere', 'See every change in a simple list', 'Set up in an afternoon'],
    lists: [['Two results', ['A café saved six hours a month', 'A market stall stopped printing price lists']]],
    quote: 'It paid for itself in a month.',
    who: 'A shop owner, after three months',
    btn: 'See how it works',
    keep: false
  });

  add('one-theme', 'One theme, three articles', NEWS, 'A themed issue: three related articles and a link to a tool or product that helps.', 'jade', { t_font: 'sans', t_size: 32, btn_radius: 8 }, 'digest', {
    pic: 'laptop-colour-hero',
    kicker: 'THIS WEEK: YOUR FIRST STALL',
    title: 'Everything you need to plan a first market stall',
    body: 'Three short articles on one subject, so you can read them in one sitting.',
    items: [
      ['What to bring on the first day', 'A one-page checklist for the table, the cash box and the weather.'],
      ['How to price what you sell', 'A plain method that works for most small products.'],
      ['Five stalls worth copying', 'What they do well and how to do it too.']
    ],
    btn: 'Try our stall planner'
  });

  add('what-we-stand-for', 'What we stand for', ANN, 'Three promises, each with a short heading and two sentences, then one clear action.', 'sage', { t_font: 'serif', btn_radius: 4 }, 'faq', {
    title: 'Three promises we keep',
    body: 'We say them here so you can hold us to them.',
    qa: [
      ['Work with care', 'Every order is checked by a person before it leaves. If something is wrong, we put it right.'],
      ['Work with clarity', 'Our prices include everything. There are no extra charges at the checkout.'],
      ['Work with confidence', 'If you are not happy within 30 days, you can send it back for a full refund.']
    ],
    btn: 'Get started',
    keep: false
  });

  add('offer-accepted', 'You are in', WELCOME, 'Congratulate someone who has been accepted, with colour-coded sections for what comes next.', 'berry', { t_font: 'sans', t_size: 34, btn_radius: 30 }, 'blocks', {
    kicker: 'CONGRATULATIONS',
    title: 'You made it. Here is what happens next.',
    body: 'Four things to do before you start. Each one takes about ten minutes.',
    sections: [
      { bg: PC.butter[0], ink: PC.butter[1], title: 'Choose your courses', body: 'Pick your first three courses before 20 August.', btn: 'See the courses' },
      { bg: PC.blush[0], ink: PC.blush[1], title: 'Come to a welcome event', body: 'Meet other new students on 2 September at 18:00.', btn: 'Reserve a place' },
      { bg: PC.aqua[0], ink: PC.aqua[1], title: 'Check your funding', body: 'Find out which scholarships you can apply for.', btn: 'See the scholarships' },
      { bg: PC.lilac[0], ink: PC.lilac[1], title: 'Tell us your preferences', body: 'Choose how and how often we contact you.', btn: 'Set my preferences' }
    ],
    keep: false
  });

  add('plans-prices', 'Plans and prices', SALE, 'Three plans side by side, each on its own colour, with what is in it and a button.', 'plum', { t_font: 'sans', t_size: 32, btn_radius: 30 }, 'blocks', {
    kicker: 'PLANS',
    title: 'Pick the plan that suits you',
    body: 'Change or stop at any time. No contract.',
    sections: [
      { bg: PC.mint[0], ink: PC.mint[1], title: 'Starter: £5 a month', body: 'One workshop a month and the members’ newsletter.', btn: 'Choose Starter' },
      { bg: PC.butter[0], ink: PC.butter[1], title: 'Standard: £12 a month', body: 'Four workshops a month, a shared workspace and a monthly call with a mentor.', btn: 'Choose Standard' },
      { bg: PC.lilac[0], ink: PC.lilac[1], title: 'Full: £25 a month', body: 'Everything in Standard, plus a private desk and two guest passes.', btn: 'Choose Full' }
    ],
    note: 'Prices include VAT.',
    keep: false
  });

  add('weekly-gathering', 'This week’s gathering', EVENTS, 'Remind people of the time and place of a regular gathering and who is speaking this week.', 'gold', { t_font: 'serif', btn_radius: 30 }, 'agenda', {
    pic: 'audience-smiling-hero',
    kicker: 'THIS SUNDAY',
    title: 'Join us this Sunday',
    body: 'Everyone is welcome. Bring a friend.',
    when: 'Sunday 14 June',
    slots: ['9:00 Doors open and tea', '10:00 Gathering begins', '11:30 Tea and conversation'],
    peopleTitle: 'Who is speaking',
    people: ['Dr Ada Nwosu, on the first hundred days of a new project'],
    btn: 'Watch last week’s talk',
    keep: false
  });
})();
