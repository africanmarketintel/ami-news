/* Deal Room v2 – search results */
(function () {
  'use strict';
  var DR = window.DR, h = DR.h;
  var PAGE_SIZE = 10;

  document.addEventListener('DOMContentLoaded', function () {
    var p = DR.params;
    var filters = {
      keywords: (p.get('keywords') || '').slice(0, 80),
      type: p.get('type') || '',
      sector: p.get('sector') || '',
      region: p.get('region') || '',
      capital: p.get('capital') || '',
      sort: ['newest', 'oldest', 'largest', 'smallest'].indexOf(p.get('sort')) !== -1 ? p.get('sort') : 'newest',
      page: Math.max(1, parseInt(p.get('page') || '1', 10) || 1),
      limit: PAGE_SIZE
    };

    // Reflect current filters in the form controls.
    [['f-keywords', 'keywords'], ['f-type', 'type'], ['f-sector', 'sector'], ['f-region', 'region'], ['f-capital', 'capital'], ['sort', 'sort']].forEach(function (pair) {
      var el = document.getElementById(pair[0]); if (el) el.value = filters[pair[1]];
    });
    // The filter bar was cut to a keyword box and a region select on
    // 14 October 2026, so the sort control, the sort form and the Create
    // alert link are no longer on the page. Deal type, sector and capital
    // still work when they arrive in the URL, which is why the filters
    // object and the chips below still carry them.
    var sortHidden = document.getElementById('f-sort-hidden');
    if (sortHidden) sortHidden.value = filters.sort === 'newest' ? '' : filters.sort;

    // Remember this search for "Back to results".
    DR.store.set('dr_results', 'opportunities.html' + location.search);

    renderActiveFilters(filters);

    var count = document.getElementById('results-count');
    var list = document.getElementById('results');
    Promise.all([DR.listings(filters), DR.bookmarks()]).then(function (r) {
      var res = r[0], saved = r[1];
      DR.clear(list);
      if (!res.ok) {
        count.textContent = 'We could not load opportunities';
        list.appendChild(h('li', { class: 'dr-empty' }, h('p', { text: 'Try again later. If the problem continues, email ami@abta.africa.' })));
        return;
      }
      // Mono count line, to the mockup: "24 OPEN OPPORTUNITIES, PAGE 1 OF 3".
      // The page clause is dropped when there is only one page.
      var pages = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
      count.textContent = res.total + (res.total === 1 ? ' open opportunity' : ' open opportunities')
        + (pages > 1 ? ', page ' + filters.page + ' of ' + pages : '');
      DR.setTitle('Investment opportunities' + (filters.page > 1 ? ' (page ' + filters.page + ')' : ''));
      if (!res.rows.length) {
        list.appendChild(h('li', { class: 'dr-empty' },
          h('h2', { class: 'dr-h3', style: 'margin-top:0', text: 'No opportunities match your search' }),
          h('p', { text: 'Try removing a filter or searching for a different keyword. New opportunities are added on a rolling basis.' })));
        return;
      }
      res.rows.forEach(function (d) { list.appendChild(DR.card(d, { saved: saved.indexOf(d.published_ref) !== -1, headingLevel: 'h2' })); });
      renderPagination(filters, res.total);
    });
  });

  function renderActiveFilters(f) {
    var ul = document.getElementById('active-filters');
    var map = [
      ['keywords', function (v) { return '“' + v + '”'; }],
      ['type', function (v) { return DR.label(DR.DEAL_TYPES, v); }],
      ['sector', function (v) { return DR.label(DR.SECTORS, v); }],
      ['region', function (v) { return DR.label(DR.REGIONS, v); }],
      ['capital', function (v) { return DR.label(DR.CAPITAL, v); }]
    ];
    var any = false;
    map.forEach(function (m) {
      var v = f[m[0]];
      if (!v) return;
      any = true;
      var rest = {}; ['keywords', 'type', 'sector', 'region', 'capital'].forEach(function (k) { if (k !== m[0]) rest[k] = f[k]; });
      if (f.sort !== 'newest') rest.sort = f.sort;
      ul.appendChild(h('li', null, h('a', { href: 'opportunities.html' + DR.qs(rest) }, h('span', { class: 'dr-visually-hidden', text: 'Remove filter ' }), m[1](v))));
    });
    if (any) ul.appendChild(h('li', null, h('a', { href: 'opportunities.html', class: 'dr-link', style: 'border:0', text: 'Clear all filters' })));
    else ul.hidden = true;
  }

  function renderPagination(f, total) {
    var pages = Math.ceil(total / PAGE_SIZE);
    var nav = document.getElementById('pagination');
    if (pages <= 1) return;
    nav.hidden = false;
    var base = {}; ['keywords', 'type', 'sector', 'region', 'capital'].forEach(function (k) { base[k] = f[k]; });
    if (f.sort !== 'newest') base.sort = f.sort;
    function link(page) { return 'opportunities.html' + DR.qs(Object.assign({}, base, { page: page > 1 ? page : '' })); }
    if (f.page > 1) nav.appendChild(h('a', { class: 'dr-pagination__link', href: link(f.page - 1), rel: 'prev' }, 'Previous', h('span', { class: 'dr-visually-hidden', text: ' page' })));
    var ul = h('ul', { class: 'dr-pagination__list' });
    for (var i = 1; i <= pages; i++) {
      if (pages > 7 && i !== 1 && i !== pages && Math.abs(i - f.page) > 1) {
        if (i === 2 || i === pages - 1) ul.appendChild(h('li', { class: 'dr-pagination__link', text: '…' }));
        continue;
      }
      ul.appendChild(h('li', null, h('a', { class: 'dr-pagination__link', href: link(i), 'aria-label': 'Page ' + i, 'aria-current': i === f.page ? 'page' : null, text: String(i) })));
    }
    nav.appendChild(ul);
    if (f.page < pages) nav.appendChild(h('a', { class: 'dr-pagination__link', href: link(f.page + 1), rel: 'next' }, 'Next', h('span', { class: 'dr-visually-hidden', text: ' page' })));
  }
})();
