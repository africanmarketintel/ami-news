/* Home page: draws the layout cards and the animated example with the real
   layouts, so they show the same photographs as the Templates page. If this
   file or the layouts fail to load, the saved pictures in each card stay. */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR || !MR.templatePreviewHtml || !MR.TEMPLATES) return;
  var FRAME_W = 700, FRAME_H = 1500;

  function fit(shot) {
    var frame = shot.querySelector('iframe');
    if (!frame) return;
    var w = shot.clientWidth, h = shot.clientHeight;
    if (!w) return;
    var scale = (w * 0.74) / FRAME_W;
    frame.style.transform = 'scale(' + scale + ')';
    frame.style.left = ((w - FRAME_W * scale) / 2) + 'px';
    frame.style.top = (h * 0.075) + 'px';
  }

  function build(shot) {
    var id = shot.getAttribute('data-home-layout');
    var html = MR.templatePreviewHtml(id);
    if (!html) return;
    var frame = document.createElement('iframe');
    frame.className = 'hm-shot__frame';
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('sandbox', '');
    frame.setAttribute('title', '');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('loading', 'lazy');
    frame.srcdoc = html;
    shot.insertBefore(frame, shot.firstChild);
    var fallback = shot.querySelector('img');
    if (fallback) fallback.hidden = true;
    shot.classList.add('is-live');
    fit(shot);
  }

  var shots = [].slice.call(document.querySelectorAll('[data-home-layout]'));
  shots.forEach(build);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (e) { fit(e.target); }); });
    shots.forEach(function (s) { ro.observe(s); });
  } else {
    window.addEventListener('resize', function () { shots.forEach(fit); });
  }
})();
