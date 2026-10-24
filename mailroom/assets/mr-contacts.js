/* ==========================================================================
   AMI Mailroom – reading contacts from text, pasted spreadsheet cells and
   Excel files (import.html)

   One reader for every way a member can hand over addresses, so a file, a
   paste from a spreadsheet and a typed list behave the same way:

     MR.parseContacts(text)          CSV, TSV, TXT or free text, one contact a row
     MR.contactsFromCells(rows)      the same, from rows of cells (Excel)
     MR.readXlsx(arrayBuffer)        first sheet of an .xlsx, as rows of cells

   Each parse returns { rows, bad, header, columns }:
     rows     [{ email, full_name, organisation, country }]
     bad      text that was not an email address and was left out
     header   true if the first row was a heading row
     columns  the headings that were understood, in the order found

   A heading row is recognised by a column called email. With one, the
   columns name (or first and last name), organisation and country are read.
   Without one, the email is the cell that looks like an address, and the
   first other cell on the row is taken as the name.

   An .xlsx file is a zip of XML. It is read in the browser with the built-in
   DecompressionStream, so nothing is uploaded to be converted and no library
   is loaded. The old .xls format is not supported.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};

  var EMAIL_OK = /^[^@\s,;<>()"]+@[^@\s,;<>()"]+\.[^@\s,;<>()"]+$/;
  var NAMED = /^"?([^"<]*?)"?\s*<\s*([^\s<>]+)\s*>$/;
  var HEAD = {
    email: /^(e-?mail|e-?mail address|email_address|mail)$/,
    name: /^(name|full ?name|full_name|contact|contact name)$/,
    first: /^(first ?name|first_name|given name|forename)$/,
    last: /^(last ?name|last_name|surname|family name)$/,
    org: /^(organi[sz]ation|organi[sz]ation name|company|company name|org|employer)$/,
    country: /^country$/
  };

  function norm(h) { return String(h == null ? '' : h).trim().toLowerCase().replace(/\s+/g, ' '); }
  function clip(v, n) { v = String(v == null ? '' : v).trim(); return v ? v.slice(0, n) : null; }

  /* ---------------- text to rows of cells ---------------- */

  // Splits on one delimiter, keeping a quoted cell whole, quotes inside it
  // doubled, and line breaks inside quotes as part of the cell.
  function splitRows(text, delim) {
    var rows = [], row = [], cell = '', q = false, i, c;
    text = String(text).replace(/^﻿/, '');
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      if (q) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false;
        } else cell += c;
      } else if (c === '"' && cell === '') {
        q = true;
      } else if (c === delim) {
        row.push(cell); cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text.charAt(i + 1) === '\n') i++;
        row.push(cell); cell = ''; rows.push(row); row = [];
      } else cell += c;
    }
    row.push(cell); rows.push(row);
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }

  // A tab means cells pasted from a spreadsheet. Otherwise a comma, then a
  // semicolon, judged on the first line that has anything in it.
  function delimiterOf(text) {
    var first = String(text).replace(/^﻿/, '').split(/\r?\n/).filter(function (l) { return l.trim(); })[0] || '';
    if (first.indexOf('\t') > -1) return '\t';
    if (first.indexOf(',') > -1) return ',';
    if (first.indexOf(';') > -1) return ';';
    return ',';
  }

  /* ---------------- rows of cells to contacts ---------------- */

  MR.contactsFromCells = function (cells) {
    var out = { rows: [], bad: [], header: false, columns: [] };
    cells = (cells || []).filter(function (r) { return r && r.some(function (x) { return String(x == null ? '' : x).trim() !== ''; }); });
    if (!cells.length) return out;

    var head = cells[0].map(norm);
    var at = {};
    head.forEach(function (h, i) {
      Object.keys(HEAD).forEach(function (k) { if (at[k] === undefined && HEAD[k].test(h)) at[k] = i; });
    });

    if (at.email !== undefined) {
      out.header = true;
      out.columns = ['email'];
      if (at.name !== undefined || at.first !== undefined || at.last !== undefined) out.columns.push('name');
      if (at.org !== undefined) out.columns.push('organisation');
      if (at.country !== undefined) out.columns.push('country');
      cells.slice(1).forEach(function (r) {
        var raw = String(r[at.email] == null ? '' : r[at.email]).trim();
        if (!raw) return;
        var named = raw.match(NAMED);
        var email = named ? named[2] : raw;
        if (!EMAIL_OK.test(email)) { out.bad.push(raw); return; }
        var name = at.name !== undefined ? r[at.name]
          : [at.first !== undefined ? r[at.first] : '', at.last !== undefined ? r[at.last] : ''].join(' ');
        out.rows.push({
          email: email,
          full_name: clip(name, 120) || (named ? clip(named[1], 120) : null),
          organisation: at.org !== undefined ? clip(r[at.org], 160) : null,
          country: at.country !== undefined ? clip(r[at.country], 80) : null
        });
      });
      return out;
    }

    // No heading row. Every address on a row is a contact. A lone address with
    // other plain text beside it is "name, address", and the text is the name.
    cells.forEach(function (r) {
      var found = [], others = [];
      r.forEach(function (cell) {
        var c = String(cell == null ? '' : cell).trim();
        if (!c) return;
        var named = c.match(NAMED);
        if (named && EMAIL_OK.test(named[2])) { found.push({ email: named[2], name: clip(named[1], 120) }); return; }
        if (EMAIL_OK.test(c)) { found.push({ email: c, name: null }); return; }
        if (c.indexOf('@') > -1) {
          c.split(/[\s;,]+/).filter(Boolean).forEach(function (t) {
            if (EMAIL_OK.test(t)) found.push({ email: t, name: null }); else out.bad.push(t);
          });
          return;
        }
        others.push(c);
      });
      if (!found.length) { if (others.length) out.bad.push(others.join(' ')); return; }
      if (found.length === 1 && !found[0].name && others.length) found[0].name = clip(others[0], 120);
      found.forEach(function (f) {
        out.rows.push({ email: f.email, full_name: f.name, organisation: null, country: null });
      });
    });
    return out;
  };

  MR.parseContacts = function (text) {
    text = String(text == null ? '' : text);
    if (!text.trim()) return { rows: [], bad: [], header: false, columns: [] };
    return MR.contactsFromCells(splitRows(text, delimiterOf(text)));
  };

  /* ---------------- .xlsx ---------------- */

  var MAX_PART = 80 * 1024 * 1024;     // the most one unpacked part may be

  function u16(v, o) { return v.getUint16(o, true); }
  function u32(v, o) { return v.getUint32(o, true); }
  function utf8(bytes) { return new TextDecoder('utf-8').decode(bytes); }

  function inflate(bytes) {
    if (typeof DecompressionStream === 'undefined') {
      return Promise.reject(new Error('This browser cannot open Excel files. Save the sheet as CSV instead.'));
    }
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }

  // Lists the parts of the zip: name, method, sizes and where the data starts.
  function zipEntries(buffer) {
    var bytes = new Uint8Array(buffer), view = new DataView(buffer), i, eocd = -1;
    for (i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (u32(view, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('That does not look like an Excel file.');
    var count = u16(view, eocd + 10), p = u32(view, eocd + 16), list = {};
    for (i = 0; i < count; i++) {
      if (u32(view, p) !== 0x02014b50) throw new Error('That Excel file could not be read.');
      var nlen = u16(view, p + 28), elen = u16(view, p + 30), clen = u16(view, p + 32);
      var name = utf8(bytes.subarray(p + 46, p + 46 + nlen));
      list[name] = { method: u16(view, p + 10), csize: u32(view, p + 20), usize: u32(view, p + 24), offset: u32(view, p + 42) };
      p += 46 + nlen + elen + clen;
    }
    return { bytes: bytes, view: view, list: list };
  }

  function zipPart(zip, name) {
    var e = zip.list[name];
    if (!e) return Promise.resolve(null);
    if (e.usize > MAX_PART) return Promise.reject(new Error('That Excel file is too large to read here. Save the sheet as CSV instead.'));
    var o = e.offset;
    if (u32(zip.view, o) !== 0x04034b50) return Promise.reject(new Error('That Excel file could not be read.'));
    var start = o + 30 + u16(zip.view, o + 26) + u16(zip.view, o + 28);
    var data = zip.bytes.subarray(start, start + e.csize);
    if (e.method === 0) return Promise.resolve(utf8(data));
    if (e.method === 8) return inflate(data).then(utf8);
    return Promise.reject(new Error('That Excel file uses a compression this page cannot read.'));
  }

  function xml(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('That Excel file could not be read.');
    return doc;
  }

  function attr(el, local) {
    for (var i = 0; i < el.attributes.length; i++) if (el.attributes[i].localName === local) return el.attributes[i].value;
    return null;
  }

  function texts(el) {
    var out = '', t = el.getElementsByTagName('t');
    for (var i = 0; i < t.length; i++) out += t[i].textContent;
    return out;
  }

  function colIndex(ref) {
    var m = /^([A-Z]+)/i.exec(ref || ''), n = 0;
    if (!m) return -1;
    m[1].toUpperCase().split('').forEach(function (ch) { n = n * 26 + (ch.charCodeAt(0) - 64); });
    return n - 1;
  }

  // First sheet as rows of cells. Formulas give their last calculated value,
  // as Excel stored it.
  MR.readXlsx = function (buffer) {
    var zip;
    try { zip = zipEntries(buffer); } catch (e) { return Promise.reject(e); }
    var sheetName = '';
    return Promise.all([
      zipPart(zip, 'xl/workbook.xml'), zipPart(zip, 'xl/_rels/workbook.xml.rels'), zipPart(zip, 'xl/sharedStrings.xml')
    ]).then(function (parts) {
      if (!parts[0]) throw new Error('That does not look like an Excel file.');
      var target = 'xl/worksheets/sheet1.xml';
      var sheets = xml(parts[0]).getElementsByTagName('sheet');
      if (sheets.length) {
        sheetName = sheets[0].getAttribute('name') || '';
        var rid = attr(sheets[0], 'id');
        if (rid && parts[1]) {
          var rels = xml(parts[1]).getElementsByTagName('Relationship');
          for (var i = 0; i < rels.length; i++) {
            if (rels[i].getAttribute('Id') === rid) {
              var t = rels[i].getAttribute('Target') || '';
              target = t.charAt(0) === '/' ? t.slice(1) : 'xl/' + t;
            }
          }
        }
      }
      var shared = [];
      if (parts[2]) {
        var si = xml(parts[2]).getElementsByTagName('si');
        for (var j = 0; j < si.length; j++) shared.push(texts(si[j]));
      }
      return zipPart(zip, target).then(function (sheet) {
        if (!sheet) throw new Error('The first sheet of that Excel file could not be found.');
        var rows = [], rowEls = xml(sheet).getElementsByTagName('row');
        for (var r = 0; r < rowEls.length; r++) {
          var cells = rowEls[r].getElementsByTagName('c'), row = [];
          for (var c = 0; c < cells.length; c++) {
            var cell = cells[c], idx = colIndex(cell.getAttribute('r')), type = cell.getAttribute('t'), v = '';
            var ve = cell.getElementsByTagName('v')[0];
            if (type === 'inlineStr') v = texts(cell);
            else if (!ve) v = '';
            else if (type === 's') v = shared[parseInt(ve.textContent, 10)] || '';
            else if (type === 'e') v = '';
            else v = ve.textContent;
            if (idx < 0) idx = row.length;
            while (row.length < idx) row.push('');
            row[idx] = v;
          }
          rows.push(row);
        }
        return { cells: rows, sheet: sheetName };
      });
    });
  };
})();
