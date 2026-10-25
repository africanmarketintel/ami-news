/* ==========================================================================
   AMI Mailroom – the image library
   One dialog with three tabs: Your images (upload, or choose one already
   uploaded), Stock photos and GIFs.
   Files go to Supabase Storage under the account's own folder. The bucket is
   public to read, because an image in an email has to load in a mail app
   with no session, so each file is named with a random id.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR;
  if (!MR) return;

  var BUCKET = 'mailroom-images';
  var MAX_BYTES = 2 * 1024 * 1024;
  var TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

  MR.imageLimits = { maxBytes: MAX_BYTES, types: TYPES };

  MR.publicImageUrl = function (path) {
    return MR.cfg.url + '/storage/v1/object/public/' + BUCKET + '/' + path;
  };

  function randomName(ext) {
    var bytes = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    var hex = Array.prototype.map.call(bytes, function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
    return hex + '.' + ext;
  }

  // Checks the browser can make before anything is uploaded.
  MR.checkImageFile = function (file) {
    if (!file) return 'Choose a file';
    if (!TYPES[file.type]) return 'Images only: PNG, JPEG, GIF or WebP';
    if (file.size > MAX_BYTES) return 'That file is ' + Math.round(file.size / 1024) + 'KB. The limit is 2MB, and under 200KB is kinder to readers on mobile data.';
    return null;
  };

  MR.uploadImage = function (accountId, file, alt) {
    var problem = MR.checkImageFile(file);
    if (problem) return Promise.reject(new Error(problem));
    var path = accountId + '/' + randomName(TYPES[file.type]);
    var session = MR.auth.session();
    return fetch(MR.cfg.url + '/storage/v1/object/' + BUCKET + '/' + path, {
      method: 'POST',
      headers: {
        apikey: MR.cfg.key,
        Authorization: 'Bearer ' + ((session && session.access_token) || MR.cfg.key),
        'Content-Type': file.type,
        'x-upsert': 'false'
      },
      body: file
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          throw new Error(t && t.indexOf('row-level security') > -1
            ? 'That account cannot upload images.' : 'The upload failed.');
        });
      }
      return MR.api.insert('mailroom_images', {
        account_id: accountId, path: path, url: MR.publicImageUrl(path),
        alt: alt || '', bytes: file.size, mime: file.type, created_by: MR.auth.userId()
      });
    }).then(function (rows) { return rows[0]; });
  };

  /* ---------------- the picker ---------------- */
  MR.pickImage = function (accountId, onPick) {
    var back = document.activeElement;
    var dialog = MR.h('dialog', { class: 'mr-dialog mr-picker', 'aria-labelledby': 'mr-picker-h' });
    var grid = MR.h('div', { class: 'mr-image-grid' });
    var status = MR.h('p', { class: 'dr-small', role: 'status' });
    var saving = false;

    /* ---- header: title and a close button ---- */
    dialog.appendChild(MR.h('div', { class: 'mr-picker__head' },
      MR.h('h2', { id: 'mr-picker-h', text: 'Add an image' }),
      MR.h('button', { type: 'button', class: 'mr-picker__close', 'aria-label': 'Close', text: '×',
        onclick: function () { close(); } })));

    /* ---- tabs ---- */
    var TABS = [['mine', 'Your images'], ['photos', 'Stock photos'], ['gifs', 'GIFs']];
    var tablist = MR.h('div', { class: 'mr-picker__tabs', role: 'tablist', 'aria-label': 'Where to get the image' });
    var tabEls = [], panels = [];
    TABS.forEach(function (t, i) {
      var tab = MR.h('button', { type: 'button', class: 'mr-picker__tab', role: 'tab', id: 'mr-picker-t' + i,
        'aria-controls': 'mr-picker-p' + i, 'aria-selected': i === 0 ? 'true' : 'false', tabindex: i === 0 ? '0' : '-1', text: t[1] });
      tab.addEventListener('click', function () { show(i); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
        else if (e.key === 'ArrowLeft') n = (i + TABS.length - 1) % TABS.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = TABS.length - 1;
        if (n !== null) { e.preventDefault(); show(n, true); }
      });
      tabEls.push(tab); tablist.appendChild(tab);
    });
    dialog.appendChild(tablist);

    function show(n, focus) {
      tabEls.forEach(function (t, i) {
        t.setAttribute('aria-selected', i === n ? 'true' : 'false');
        t.setAttribute('tabindex', i === n ? '0' : '-1');
        panels[i].hidden = i !== n;
      });
      if (focus) tabEls[n].focus();
    }

    /* ---- tab 1: upload and the images already uploaded ---- */
    var fileInput = MR.h('input', { class: 'mr-picker__file', id: 'mr-image-file', type: 'file',
      accept: 'image/png,image/jpeg,image/gif,image/webp', tabindex: '-1', 'aria-hidden': 'true' });
    var uploadBtn = MR.h('button', { type: 'button', class: 'dr-button', text: 'Upload an image',
      onclick: function () { fileInput.click(); } });
    var drop = MR.h('div', { class: 'mr-picker__drop' }, uploadBtn,
      MR.h('p', { class: 'dr-small', text: 'or drag a file here. PNG, JPEG, GIF or WebP, up to 2MB. Aim for under 200KB.' }),
      fileInput);
    fileInput.addEventListener('change', function () { upload(fileInput.files && fileInput.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) upload(f);
    });
    var mine = MR.h('div', { class: 'mr-picker__panel' }, drop, status,
      MR.h('h3', { class: 'dr-h', text: 'Images you have uploaded' }), grid);

    /* ---- tabs 2 and 3: stock photos and GIFs ---- */
    panels.push(mine, stockPanel('photos'), stockPanel('gifs'));
    panels.forEach(function (p, i) {
      p.setAttribute('role', 'tabpanel'); p.id = 'mr-picker-p' + i;
      p.setAttribute('aria-labelledby', 'mr-picker-t' + i);
      p.hidden = i !== 0;
      dialog.appendChild(p);
    });

    document.body.appendChild(dialog);
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    dialog.addEventListener('cancel', function () { close(); });
    tabEls[0].focus();

    load();

    function close() {
      dialog.remove();
      if (back && back.focus) back.focus();
    }

    /* Photos and GIFs. The search runs on our side with the platform's own
       keys, so nobody has to register anywhere. Pexels and Unsplash pictures
       stay on the service's address and are not copied. Pixabay forbids
       permanent hotlinking, so the one chosen is copied into the account's own
       images. Each service is credited. */
    function stockPanel(source) {
      var page = 1;
      var isGif = source === 'gifs';
      var box = MR.h('section', { class: 'mr-picker__panel mr-stock' });
      var results = MR.h('div', { class: 'mr-image-grid' });
      var note = MR.h('p', { class: 'dr-small', role: 'status' });
      var credit = MR.h('p', { class: 'dr-small' });
      var qid = 'mr-stock-q-' + source;
      var q = MR.h('input', { class: 'dr-input', id: qid, type: 'search', autocomplete: 'off' });
      var more = MR.h('button', { type: 'button', class: 'dr-button dr-button--secondary', text: 'Show more', hidden: true,
        onclick: function () { page += 1; search(true); } });
      box.appendChild(MR.h('p', { class: 'dr-hint', text: isGif
        ? 'Add a moving picture. Search by feeling or action, such as “thank you” or “celebrate”.'
        : 'See your message with a real picture in it. Search by what the picture shows, such as “market stall” or “handshake”.' }));
      box.appendChild(MR.h('form', { class: 'mr-stock__form', onsubmit: function (e) { e.preventDefault(); page = 1; search(false); } },
        MR.h('label', { class: 'dr-label', for: qid, text: isGif ? 'Search GIFs' : 'Search stock photos' }), q,
        MR.h('button', { type: 'submit', class: 'dr-button', text: 'Search' })));
      box.appendChild(note); box.appendChild(results); box.appendChild(more); box.appendChild(credit);

      function message(code) {
        if (code === 'not_set_up') return 'Photo and GIF search is not switched on yet. You can still upload your own image.';
        if (code === 'busy' || code === 'slow_down') return 'Too many searches just now. Wait a minute and try again.';
        return 'The search did not work. Try again in a moment.';
      }

      function search(append) {
        if (MR.cfg.demo) { note.textContent = 'Preview only: search is switched off here.'; return; }
        note.textContent = 'Searching…';
        MR.fn('mailroom-media', { source: source, q: q.value.trim(), page: page }).then(function (r) {
          if (!append) results.textContent = '';
          note.textContent = (r.results || []).length || append ? '' : 'Nothing found. Try a simpler word.';
          (r.results || []).forEach(function (p) {
            results.appendChild(MR.h('button', { type: 'button', class: 'mr-image-tile',
              onclick: function () {
                // Pixabay does not allow permanent hotlinking, so its picture
                // is copied into this account's own images first.
                if (p.save) {
                  if (saving) return;
                  saving = true;
                  note.textContent = 'Saving the picture to your images…';
                  MR.fn('mailroom-media', { source: 'photos', save: { id: p.save, account_id: accountId } }).then(function (s) {
                    onPick({ url: s.url, alt: s.alt || p.alt || '', credit: s.credit || p.credit, credit_url: s.credit_url || p.credit_url, stock: true });
                    close();
                  }).catch(function (err) {
                    saving = false;
                    note.textContent = err && err.message === 'too_big'
                      ? 'That picture is over 2MB. Choose another.'
                      : 'The picture could not be saved. Try again or choose another.';
                  });
                  return;
                }
                if (p.track) MR.fn('mailroom-media', { source: 'photos', track: p.track }).catch(function () {});
                onPick({ url: p.url, alt: p.alt || '', credit: p.credit, credit_url: p.credit_url, stock: true }); close(); } },
              MR.h('img', { src: p.thumb, alt: p.alt || '', loading: 'lazy' }),
              MR.h('span', { class: 'dr-small', text: p.credit })));
          });
          more.hidden = (r.results || []).length < 24;
          credit.textContent = '';
          credit.appendChild(document.createTextNode(r.credit_name === 'GIPHY' ? 'Powered by ' : 'Pictures from '));
          credit.appendChild(MR.h('a', { href: r.credit_url, target: '_blank', rel: 'noopener', text: r.credit_name }));
          credit.appendChild(document.createTextNode(r.credit_name === 'GIPHY' ? '. Check the GIF suits your message before you send.' : '. Check the picture suits your message before you send.'));
        }).catch(function (err) {
          note.textContent = message(err && err.message);
        });
      }
      return box;
    }

    function load() {
      if (MR.cfg.demo) { draw(MR.sampleImages || []); return; }
      MR.api.select('mailroom_images?select=*&order=created_at.desc&limit=60')
        .then(draw)
        .catch(function () { status.textContent = 'Your images could not be loaded.'; });
    }

    function draw(images) {
      grid.textContent = '';
      if (!images.length) {
        grid.appendChild(MR.h('p', { class: 'dr-empty', text: 'No images yet. Upload one above.' }));
        return;
      }
      images.forEach(function (img) {
        grid.appendChild(MR.h('button', {
          type: 'button', class: 'mr-image-tile',
          onclick: function () { onPick(img); close(); }
        },
          MR.h('img', { src: img.url, alt: img.alt || '', loading: 'lazy' }),
          MR.h('span', { class: 'dr-small', text: img.alt || 'No default description' })));
      });
    }

    function upload(file) {
      var problem = MR.checkImageFile(file);
      if (problem) { status.textContent = problem; fileInput.value = ''; return; }
      if (MR.cfg.demo) { status.textContent = 'Preview only: nothing is uploaded.'; fileInput.value = ''; return; }
      uploadBtn.disabled = true;
      status.textContent = 'Uploading…';
      // The description is asked for when the image is used in the email.
      MR.uploadImage(accountId, file, '').then(function (row) {
        uploadBtn.disabled = false;
        status.textContent = 'Uploaded.';
        fileInput.value = '';
        onPick(row);
        close();
      }).catch(function (err) {
        uploadBtn.disabled = false;
        fileInput.value = '';
        status.textContent = MR.friendlyError(err, 'The upload failed. Try again.');
      });
    }
  };
})();
