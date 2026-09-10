/* Deal Room v2 – opportunity details (portal details page layout) */
(function () {
  'use strict';
  var DR = window.DR, h = DR.h;

  document.addEventListener('DOMContentLoaded', function () {
    var ref = (DR.params.get('ref') || '').slice(0, 40);
    var id = (DR.params.get('id') || '').slice(0, 60);
    var root = document.getElementById('detail');
    var back = DR.store.get('dr_results', '');
    if (back) {
      document.getElementById('back-to-results').href = back;
      document.getElementById('crumb-results').href = back;
    }
    if (!ref && !id) return notFound(root);

    Promise.all([DR.listings(ref ? { ref: ref, limit: 1 } : { id: id, limit: 1 }), DR.bookmarks()]).then(function (r) {
      var res = r[0], saved = r[1];
      if (!res.ok) { DR.clear(root).appendChild(h('p', { text: 'We could not load this opportunity. Try again later.' })); return; }
      if (!res.rows.length) return notFound(root);
      render(root, res.rows[0], saved);
    });
  });

  function notFound(root) {
    DR.setTitle('Opportunity not found');
    DR.clear(root).appendChild(h('div', { class: 'dr-narrow' },
      h('h1', { text: 'Opportunity not found' }),
      h('p', { text: 'This opportunity may have been withdrawn or the link may be wrong.' }),
      h('p', null, h('a', { href: 'opportunities.html', text: 'Browse current opportunities' }))));
  }

  function render(root, d, saved) {
    var sector = DR.sector(d.sector);
    var ref = d.published_ref || '';
    var title = d.teaser_headline || (DR.label(DR.DEAL_TYPES, d.deal_type) + ' in ' + sector.label.toLowerCase());
    DR.setTitle(title);
    document.getElementById('crumb-current').textContent = ref || 'Opportunity';

    var facts = [
      ['tag', 'Deal type', DR.label(DR.DEAL_TYPES, d.deal_type)],
      ['grid', 'Sector', sector.label],
      ['pin', 'Region', DR.label(DR.REGIONS, d.region)],
      ['money', 'Capital sought', d.capital_range ? DR.label(DR.CAPITAL, d.capital_range) : 'On request']
    ];
    (Array.isArray(d.secondary_facts) ? d.secondary_facts : []).slice(0, 4).forEach(function (f) {
      if (f && f.label && f.value) facts.push(['calendar', String(f.label), String(f.value)]);
    });
    var dl = h('dl', { class: 'dr-keyfacts' });
    facts.forEach(function (f) { dl.appendChild(h('div', null, h('dt', null, DR.icon(f[0]), f[1]), h('dd', { text: f[2] }))); });

    var highlights = (Array.isArray(d.highlights) ? d.highlights : []).filter(Boolean);

    var main = h('div', null,
      h('div', { class: 'dr-detail-visual', style: '--sector-bg:' + sector.bg },
        h('span', { class: 'dr-detail-visual__ref' }, sector.label, h('br'), 'Ref ' + ref),
        DR.icon(sector.icon)),
      h('div', { class: 'dr-detail-hero' },
        h('span', { class: 'dr-caption', text: d.published_at ? 'Listed on ' + DR.formatDate(d.published_at) : '' }),
        h('h1', { style: 'margin:0', text: title }),
        h('p', { class: 'dr-price' }, d.capital_range ? DR.label(DR.CAPITAL, d.capital_range) : 'Capital range on request', h('span', { class: 'dr-price__qualifier', text: 'Capital sought' })),
        h('div', null, h('span', { class: 'dr-tag dr-tag--green', text: 'ABTA screened' }), ' ', h('span', { class: 'dr-tag dr-tag--grey', text: 'Identity shared on introduction' })),
        h('p', { class: 'dr-mobile-only', style: 'margin:.75rem 0 0' }, h('a', { href: 'express-interest.html' + DR.qs({ ref: ref }), role: 'button', draggable: 'false', class: 'dr-button dr-button--full', style: 'margin-bottom:0', text: 'Express interest' }))),
      dl,
      highlights.length ? [h('h2', { text: 'Key features' }), h('ul', { class: 'dr-features' }, highlights.map(function (t) { return h('li', { text: String(t) }); }))] : null,
      h('h2', { text: 'About this opportunity' }),
      h('p', { style: 'white-space:pre-line', text: d.summary || '' }),
      h('h2', { text: 'What you can see now and after an introduction' }),
      h('table', { class: 'dr-table' },
        h('thead', null, h('tr', null, h('th', { scope: 'col', text: 'Information' }), h('th', { scope: 'col', text: 'When it is shared' }))),
        h('tbody', null,
          row('Sector, region, deal type, capital sought and summary', 'Now'),
          row('Answers to your questions from ABTA', 'After you ask, if you are a member'),
          row('Name of the business, contacts and advisers', 'In the Introduction Notice, if ABTA introduces you'),
          row('Supporting documents', 'After introduction, as agreed between the parties'))),
      questions(ref),
      h('div', { class: 'dr-inset' }, h('p', { text: 'This listing is a summary of information provided to ABTA. ABTA has not independently verified it and does not recommend this opportunity. Carry out your own due diligence and take independent advice.' })));

    var panel = h('aside', { 'aria-labelledby': 'panel-title' },
      h('div', { class: 'dr-contact-panel dr-sticky' },
        h('h2', { id: 'panel-title', text: 'Interested in this opportunity?' }),
        h('ol', { class: 'dr-steps' },
          h('li', { text: 'Tell ABTA why it fits your mandate.' }),
          h('li', { text: 'ABTA screens your request. We aim to reply within 5 business days.' }),
          h('li', { text: 'If suitable, ABTA sends an Introduction Notice to both parties.' })),
        h('a', { href: 'express-interest.html' + DR.qs({ ref: ref }), role: 'button', draggable: 'false', class: 'dr-button dr-button--full', text: 'Express interest' }),
        h('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap' },
          DR.saveButton(ref, title, saved.indexOf(ref) !== -1),
          h('span', { class: 'dr-secondary dr-small', text: 'Ref ' + ref })),
        h('p', { class: 'dr-small', style: 'margin-top:1rem' }, 'Not a member? ', h('a', { href: 'create-account.html', text: 'Join the Deal Room' })),
        h('p', { class: 'dr-small' }, h('a', { href: 'mailto:ami@abta.africa?subject=' + encodeURIComponent('Deal Room enquiry: ' + ref), text: 'Email ABTA about this opportunity' }))));

    var grid = h('div', { class: 'dr-grid dr-grid--two-thirds' }, main, panel);
    DR.clear(root).appendChild(grid);
    related(root, d).then(function () { similar(root, d); });
  }

  function row(a, b) { return h('tr', null, h('td', { text: a }), h('td', { text: b })); }

  function questions(ref) {
    var wrap = h('section', { 'aria-labelledby': 'qa-title' }, h('h2', { id: 'qa-title', text: 'Questions about this opportunity' }));
    if (!DR.session.active()) {
      wrap.appendChild(h('p', null, 'Members can ask ABTA questions before expressing interest. ', h('a', { href: 'sign-in.html' + DR.qs({ return: 'opportunity.html' + DR.qs({ ref: ref }) }), text: 'Sign in to ask a question' }), '.'));
      return wrap;
    }
    var list = h('div', { 'aria-live': 'polite' });
    var errorBox = h('div');
    var ta = h('textarea', { class: 'dr-textarea', id: 'qa-question', name: 'question', rows: '4', 'aria-describedby': 'qa-hint' });
    var group = h('div', { class: 'dr-form-group' },
      h('label', { class: 'dr-label', for: 'qa-question', text: 'Your question' }),
      h('div', { class: 'dr-hint', id: 'qa-hint', text: 'ABTA answers questions without revealing the identity of the business. Only you and ABTA can see your questions.' }),
      ta);
    var form = h('form', { novalidate: true },
      group,
      h('button', { type: 'submit', class: 'dr-button dr-button--secondary', text: 'Send question to ABTA' }));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      DR.clear(errorBox);
      group.className = 'dr-form-group';
      var old = group.querySelector('.dr-error-message'); if (old) old.remove();
      var q = ta.value.trim();
      if (!q) {
        group.className = 'dr-form-group dr-form-group--error';
        group.insertBefore(h('p', { class: 'dr-error-message', id: 'qa-error' }, h('span', { class: 'dr-visually-hidden', text: 'Error: ' }), 'Enter your question'), ta);
        ta.setAttribute('aria-describedby', 'qa-hint qa-error');
        ta.focus();
        return;
      }
      DR.fn('deal-room-qa', { body: { action: 'ask', teaser_ref: ref, question: q.slice(0, 2000) } }).then(function (res) {
        if (res.ok) {
          ta.value = '';
          DR.clear(errorBox).appendChild(h('div', { class: 'dr-banner', role: 'status' }, h('p', { class: 'dr-banner__title', text: 'Question sent' }), h('div', { class: 'dr-banner__content' }, h('p', { text: 'ABTA will answer here and email you when there is a reply.' }))));
          load();
        } else {
          var msg = res.data && res.data.error === 'not_a_member' ? 'You need an active membership to ask questions.' : 'Your question could not be sent. Try again.';
          DR.clear(errorBox).appendChild(h('p', { class: 'dr-error-message', role: 'alert', text: msg }));
        }
      });
    });
    function load() {
      DR.fn('deal-room-qa', { query: { teaser_ref: ref } }).then(function (res) {
        DR.clear(list);
        var qs = res.ok && Array.isArray(res.data.questions) ? res.data.questions : [];
        if (!qs.length) return;
        var dl = h('dl', { class: 'dr-summary-list' });
        qs.forEach(function (q) {
          var answers = Array.isArray(q.deal_answers) ? q.deal_answers : [];
          dl.appendChild(h('div', { class: 'dr-summary-list__row' },
            h('dt', { class: 'dr-summary-list__key', text: q.question }),
            h('dd', { class: 'dr-summary-list__value', text: answers.length ? answers.map(function (a) { return a.answer; }).join('\n\n') : 'Waiting for ABTA to answer' }),
            h('dd', { class: 'dr-summary-list__actions' }, h('span', { class: 'dr-tag ' + (answers.length ? 'dr-tag--green' : 'dr-tag--yellow'), text: answers.length ? 'Answered' : 'Open' }))));
        });
        list.appendChild(dl);
      });
    }
    load();
    wrap.appendChild(list);
    wrap.appendChild(errorBox);
    wrap.appendChild(h('details', { class: 'dr-details' }, h('summary', { class: 'dr-details__summary', text: 'Ask ABTA a question' }), h('div', { class: 'dr-details__text' }, form)));
    return wrap;
  }

  /* Related market intelligence: recent AMI articles tagged with this
     opportunity's region or sector (public articles table, same query
     as the previous deal detail page). Hidden when nothing matches. */
  function related(root, d) {
    if (DR.demo) return Promise.resolve();
    var like = function (col, term) { return col + '.ilike.*' + encodeURIComponent(term) + '*'; };
    var url = DR.config.url + '/rest/v1/articles?select=id,headline,section,published_date,hero_image'
      + '&is_published=eq.true'
      + '&or=(' + [like('tags', d.region), like('tags', d.sector), like('section', d.sector),
        like('headline', d.region), like('headline', d.sector), like('standfirst', d.region), like('standfirst', d.sector)].join(',') + ')'
      + '&order=published_date.desc&limit=4';
    return fetch(url, { headers: { apikey: DR.config.anon } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (articles) {
        if (!Array.isArray(articles) || !articles.length) return;
        var ul = h('ul', { class: 'dr-articles' });
        articles.forEach(function (a) {
          var img = null;
          if (a.hero_image && /^https:\/\//.test(a.hero_image)) {
            img = h('img', { src: a.hero_image, alt: '', loading: 'lazy', class: 'dr-article__img' });
            img.addEventListener('error', function () { img.remove(); });
          }
          ul.appendChild(h('li', { class: 'dr-article' },
            img,
            h('div', { class: 'dr-article__body' },
              h('span', { class: 'dr-article__kicker', text: a.section || 'AMI' }),
              h('h3', { class: 'dr-article__title' }, h('a', { href: '../article.html?id=' + encodeURIComponent(a.id), text: a.headline || 'Read article' })),
              a.published_date ? h('span', { class: 'dr-secondary dr-small', text: DR.formatDate(a.published_date) }) : null)));
        });
        root.appendChild(h('section', { 'aria-labelledby': 'related-title', style: 'margin-top:3rem' },
          h('h2', { id: 'related-title', text: 'Related market intelligence' }),
          h('p', { class: 'dr-secondary', text: 'Recent coverage from African Market Intelligence on this region and sector.' }),
          ul));
      })
      .catch(function () {});
  }

  function similar(root, d) {
    DR.listings({ sector: d.sector, limit: 4 }).then(function (res) {
      var rows = (res.rows || []).filter(function (x) { return x.published_ref !== d.published_ref; }).slice(0, 3);
      if (rows.length < 3) {
        return DR.listings({ region: d.region, limit: 4 }).then(function (res2) {
          (res2.rows || []).forEach(function (x) { if (x.published_ref !== d.published_ref && rows.every(function (y) { return y.published_ref !== x.published_ref; }) && rows.length < 3) rows.push(x); });
          return rows;
        });
      }
      return rows;
    }).then(function (rows) {
      if (!rows.length) return;
      var ul = h('ul', { class: 'dr-cards dr-grid dr-grid--thirds' });
      rows.forEach(function (x) { ul.appendChild(DR.card(x, { compact: true, saveButton: false })); });
      root.appendChild(h('section', { 'aria-labelledby': 'similar-title', style: 'margin-top:3rem' }, h('h2', { id: 'similar-title', text: 'Similar opportunities' }), ul));
    });
  }
})();
