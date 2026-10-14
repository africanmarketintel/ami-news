/* Deal Room v2 – home page: latest opportunities */
(function () {
  'use strict';
  var DR = window.DR, h = DR.h;
  document.addEventListener('DOMContentLoaded', function () {
    var list = document.getElementById('latest');
    var status = document.getElementById('latest-status');
    Promise.all([DR.listings({ limit: 3 }), DR.bookmarks()]).then(function (r) {
      var res = r[0], saved = r[1];
      if (!res.ok) { status.textContent = 'We could not load opportunities. Try again later.'; return; }
      if (!res.rows.length) { status.textContent = 'There are no opportunities listed at the moment. New listings are added on a rolling basis.'; return; }
      status.textContent = '';
      status.className = 'dr-visually-hidden';
      res.rows.forEach(function (d) { list.appendChild(DR.card(d, { saved: saved.indexOf(d.published_ref) !== -1 })); });
    });
    if (DR.params.get('signed_out') === '1') DR.announce('You have signed out');
  });
})();
