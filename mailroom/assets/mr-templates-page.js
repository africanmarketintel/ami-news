/* ==========================================================================
   The public Templates page (templates.html)
   Shows every starter layout without a sign-in. Choosing one opens the
   editor with that layout, after sign-in if the visitor is signed out.
   The words and facts in a preview are examples.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.getElementById('mr-templates-page');
    if (!wrap || !MR.templateGallery) return;
    var all = (MR.TEMPLATES || []).filter(function (t) { return t.id !== 'blank'; });
    var account = MR.sampleAccount || { name: 'Your organisation', postal_address: '1 Example Road, London, United Kingdom' };
    var signedIn = !!(MR.cfg && MR.cfg.demo) || !!(MR.auth && MR.auth.signedIn && MR.auth.signedIn());
    MR.templateGallery({
      root: wrap,
      account: account,
      hrefFor: function (t) {
        var target = 'campaign.html?template=' + encodeURIComponent(t.id);
        return signedIn ? target : 'sign-in.html?next=' + encodeURIComponent(target);
      }
    });
  });
})();
