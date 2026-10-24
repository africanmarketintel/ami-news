/* ==========================================================================
   AMI Mailroom – the image library
   Upload an image, choose one already uploaded, and give it a description.
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
    var dialog = MR.h('dialog', { class: 'mr-dialog', 'aria-label': 'Your images' });
    var grid = MR.h('div', { class: 'mr-image-grid' });
    var status = MR.h('p', { class: 'dr-small', role: 'status' });

    var fileInput = MR.h('input', {
      class: 'dr-file-upload', id: 'mr-image-file', type: 'file',
      accept: 'image/png,image/jpeg,image/gif,image/webp'
    });
    var altInput = MR.h('input', { class: 'dr-input', id: 'mr-image-alt', type: 'text' });
    var uploadBtn = MR.h('button', {
      type: 'button', class: 'dr-button', text: 'Upload',
      onclick: function () { upload(); }
    });

    dialog.appendChild(MR.h('h2', { text: 'Your images' }));
    dialog.appendChild(MR.h('div', { class: 'dr-form-group' },
      MR.h('label', { class: 'dr-label', for: 'mr-image-file', text: 'Upload an image' }),
      MR.h('span', { class: 'dr-hint', text: 'PNG, JPEG, GIF or WebP, up to 2MB. Aim for under 200KB.' }),
      fileInput));
    dialog.appendChild(MR.h('div', { class: 'dr-form-group' },
      MR.h('label', { class: 'dr-label', for: 'mr-image-alt', text: 'Default description (optional)' }),
      MR.h('span', { class: 'dr-hint', text: 'Filled in each time you use this image, and you can change it there. Leave it empty if the image is only decoration.' }),
      altInput));
    dialog.appendChild(MR.h('div', { class: 'dr-button-group' }, uploadBtn,
      MR.h('button', {
        type: 'button', class: 'dr-button dr-button--secondary', text: 'Close',
        onclick: function () { close(); }
      })));
    dialog.appendChild(status);
    dialog.appendChild(grid);
    document.body.appendChild(dialog);

    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    dialog.addEventListener('cancel', function () { close(); });
    fileInput.focus();

    load();

    function close() {
      dialog.remove();
      if (back && back.focus) back.focus();
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

    function upload() {
      var file = fileInput.files && fileInput.files[0];
      var problem = MR.checkImageFile(file);
      if (problem) { status.textContent = problem; return; }
      if (MR.cfg.demo) { status.textContent = 'Preview only: nothing is uploaded.'; return; }
      uploadBtn.disabled = true;
      status.textContent = 'Uploading…';
      MR.uploadImage(accountId, file, altInput.value.trim()).then(function (row) {
        uploadBtn.disabled = false;
        status.textContent = 'Uploaded.';
        fileInput.value = '';
        altInput.value = '';
        onPick(row);
        close();
      }).catch(function (err) {
        uploadBtn.disabled = false;
        status.textContent = MR.friendlyError(err, 'The upload failed. Try again.');
      });
    }
  };
})();
