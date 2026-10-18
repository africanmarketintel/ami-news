/* ==========================================================================
   Email rendering
   One renderer, used for the preview in the browser. The send function holds
   the same markup: if you change one, change the other. Both are marked
   "RENDERER" so they are easy to find, and the test in _build compares the
   two outputs character by character.

   The rules this markup follows, which is what stops a campaign looking right
   in the builder and breaking in Outlook:
     * tables for layout, never flexbox or grid
     * every colour and spacing value inline, on a td, never on a div
     * a fixed 600px content width, with a conditional wrapper for Outlook
     * bulletproof buttons: VML for Outlook, a padded anchor for everything else
     * web-safe font stacks only, so nothing depends on a font loading
     * mso-line-height-rule: exactly, or Outlook adds its own leading
     * images with a width attribute, display block and a description
     * columns as table cells that stack with a media query, so Outlook keeps
       them side by side and a phone does not
     * a panel is a table row with a background colour, and its children are
       rows inside it, so the colour fills the width in Outlook too
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};

  var FONTS = {
    sans: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    serif: "Georgia, 'Times New Roman', Times, serif",
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    verdana: "Verdana, Geneva, Tahoma, sans-serif",
    trebuchet: "'Trebuchet MS', 'Lucida Grande', Tahoma, sans-serif",
    tahoma: "Tahoma, Geneva, Verdana, sans-serif",
    courier: "'Courier New', Courier, monospace"
  };
  MR.FONTS = FONTS;

  var DEFAULT_BRAND = {
    logo_url: '', logo_alt: '', logo_width: 180,
    accent_colour: '#6b7280', button_colour: '#222222', button_text: '#ffffff',
    font_family: 'sans', footer_note: '', footer_credit: '', social_links: []
  };
  MR.DEFAULT_BRAND = DEFAULT_BRAND;

  // The line at the foot of every email. An account on a paid plan may replace
  // it with its own, through brand.footer_credit; the sending code only passes
  // that on when the plan allows it.
  var PLATFORM_CREDIT = 'Sent through AMI Mailroom, operated by African Business Trade Association Limited.';
  var PLATFORM_CREDIT_TEXT = 'Sent through AMI Mailroom.';

  var INK = '#1a1208';
  var MUTED = '#505a5f';
  var RULE = '#d8dadc';
  var SPACER = { small: 8, medium: 24, large: 48 };
  var ALIGN = { left: 'left', center: 'center', right: 'right' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Only a link a mail app will follow. Anything else becomes a dead anchor
  // rather than something that runs in the preview frame.
  function safeUrl(value) {
    var v = String(value == null ? '' : value).trim();
    if (/^(https?:|mailto:)/i.test(v)) return esc(v);
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v)) return esc('https://' + v);
    return '#';
  }

  function colour(value, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;
  }

  function rawAlign(value) {
    return ALIGN[String(value || '').toLowerCase()] || 'left';
  }

  // In a right-to-left email, left and right swap, so a block set to the
  // start of the line stays at the start of the line.
  function align(value) {
    var a = rawAlign(value);
    if (!ST.rtl) return a;
    return a === 'left' ? 'right' : (a === 'right' ? 'left' : a);
  }

  function startSide() {
    return ST.rtl ? 'right' : 'left';
  }

  /* ---------------- the look of one campaign ----------------
     campaign.style holds the choices made on the Style tab. Every value is
     checked here, so a stored value that is out of range, or not a colour,
     falls back to the default rather than reaching the markup. With nothing
     stored, every default is the value this file used before styles existed,
     so an unstyled campaign renders exactly as it always did. */
  var LINES = { compact: 1.3, normal: 1.5, relaxed: 1.75 };

  function num(v, min, max, fallback) {
    if (v === undefined || v === null || v === '') return fallback;
    var n = parseFloat(v);
    if (!isFinite(n)) return fallback;
    return Math.round(Math.max(min, Math.min(max, n)));
  }

  function flag(v, fallback) {
    if (v === true || v === 'true') return true;
    if (v === false || v === 'false') return false;
    return fallback;
  }

  function fontKey(v) {
    var k = String(v || '');
    return FONTS[k] ? k : '';
  }

  function resolveStyle(s) {
    s = s && typeof s === 'object' ? s : {};
    var width = num(s.width, 480, 700, 600);
    var pad = num(s.pad, 0, 48, 24);
    var inner = width - 2 * pad;
    var pSize = num(s.p_size, 11, 28, 16);
    var bgImage = String(s.bg_image || '').trim();
    // https only, and no character that could end the url() early.
    if (!/^https:\/\/[^\s'"()<>\\]+$/i.test(bgImage)) bgImage = '';
    var btnPct = num(s.btn_width, 10, 100, 0);
    return {
      width: width, pad: pad, inner: inner,
      page: colour(s.page, '#f3f2f1'), body: colour(s.body, '#ffffff'), bgImage: bgImage,
      pFont: fontKey(s.p_font), pSize: pSize,
      pLine: Math.round(pSize * (LINES[String(s.line || '')] || LINES.normal)),
      pColour: colour(s.p_colour, ''),
      tFont: fontKey(s.t_font), tSize: num(s.t_size, 16, 40, 22), tColour: colour(s.t_colour, ''),
      rtl: s.dir === 'rtl',
      linkColour: colour(s.link_colour, ''), linkBold: flag(s.link_bold, false),
      linkItalic: flag(s.link_italic, false), linkUnderline: flag(s.link_underline, true),
      btnFont: fontKey(s.btn_font), btnSize: num(s.btn_size, 11, 28, 16), btnColour: colour(s.btn_text, ''),
      btnBg: colour(s.btn_bg, ''), btnBold: flag(s.btn_bold, true), btnItalic: flag(s.btn_italic, false),
      btnUnderline: flag(s.btn_underline, false),
      btnPct: btnPct, btnWidth: btnPct ? Math.round(inner * btnPct / 100) : 260,
      btnRadius: num(s.btn_radius, 0, 50, 24), btnBorder: num(s.btn_border, 0, 6, 2),
      btnBorderColour: colour(s.btn_border_colour, '')
    };
  }

  var ST = resolveStyle(null);
  MR.resolveStyle = resolveStyle;

  // Padding for a row: top, the side padding from the style, then bottom.
  function px(top, bottom) {
    return top + 'px ' + ST.pad + 'px' + (bottom === undefined ? '' : ' ' + bottom + (bottom ? 'px' : ''));
  }

  // The same value on all four sides, written as short as it can be.
  function allPad(v) {
    return ST.pad === v ? v + 'px' : v + 'px ' + ST.pad + 'px';
  }

  function bodyFont(font) { return ST.pFont ? FONTS[ST.pFont] : font; }
  function titleFont(font) { return ST.tFont ? FONTS[ST.tFont] : font; }

  function linkCss(ctx) {
    return 'color:' + ctx.link + (ST.linkBold ? ';font-weight:bold' : '') +
      (ST.linkItalic ? ';font-style:italic' : '') + (ST.linkUnderline ? '' : ';text-decoration:none');
  }

  function brandOf(b) {
    var out = {};
    Object.keys(DEFAULT_BRAND).forEach(function (k) { out[k] = DEFAULT_BRAND[k]; });
    if (b) Object.keys(DEFAULT_BRAND).forEach(function (k) {
      if (b[k] !== null && b[k] !== undefined && b[k] !== '') out[k] = b[k];
    });
    out.accent_colour = colour(out.accent_colour, DEFAULT_BRAND.accent_colour);
    out.button_colour = colour(out.button_colour, DEFAULT_BRAND.button_colour);
    out.button_text = colour(out.button_text, DEFAULT_BRAND.button_text);
    out.logo_width = Math.max(60, Math.min(552, parseInt(out.logo_width, 10) || 180));
    if (!Array.isArray(out.social_links)) out.social_links = [];
    return out;
  }

  // What colour the text in a block should be. Outside a panel it is the
  // ordinary ink; inside one it is whatever the panel sets, so a dark panel
  // carries light text without every block having to be told.
  function context(brand, panel) {
    if (!panel) {
      var plain = ST.pColour || INK;
      return { ink: plain, title: ST.tColour || INK, muted: MUTED, link: ST.linkColour || brand.accent_colour, rule: RULE, panel: false };
    }
    var ink = colour(panel.text_colour, '#ffffff');
    return {
      ink: ink,
      title: ink,
      muted: colour(panel.muted_colour, ink),
      link: colour(panel.link_colour, brand.button_colour),
      // Six-digit hex only. Outlook ignores the eight-digit kind, so a rule
      // that looked faint everywhere else would simply disappear there.
      rule: colour(panel.rule_colour, ink),
      panel: true
    };
  }

  // opts: { outlook: true, brand: {...}, archiveUrl: '...' }
  MR.renderEmail = function (campaign, account, opts) {
    opts = opts || {};
    ST = resolveStyle(campaign.style);
    var brand = brandOf(opts.brand);
    var font = FONTS[campaign.font_family || brand.font_family] || FONTS.sans;
    var outlook = !!opts.outlook;
    var blocks = Array.isArray(campaign.body_blocks) ? campaign.body_blocks : [];
    var unsubscribe = opts.unsubscribeUrl || '#';
    var preferences = opts.preferencesUrl || '#';
    var ctx = context(brand, null);
    ctx.recipient = opts.recipient || null;

    var body = blocks.map(function (b) {
      return renderBlock(b, font, outlook, brand, ctx);
    }).join('\n');

    return '<!doctype html>\n' +
'<html lang="en"' + (ST.rtl ? ' dir="rtl"' : '') + ' xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">\n' +
'<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
'<meta name="x-apple-disable-message-reformatting">\n' +
'<meta name="color-scheme" content="light dark">\n' +
'<meta name="supported-color-schemes" content="light dark">\n' +
'<title>' + esc(campaign.subject) + '</title>\n' +
'<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch>' +
'</o:OfficeDocumentSettings></xml><![endif]-->\n' +
'<style>\n' +
'  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}\n' +
'  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}\n' +
'  img{-ms-interpolation-mode:bicubic}\n' +
'  @media screen and (max-width:' + (ST.width + 20) + 'px){\n' +
'    .rc-wrap{width:100% !important}\n' +
'    .rc-pad{padding-left:16px !important;padding-right:16px !important}\n' +
'    .rc-col{display:block !important;width:100% !important;max-width:100% !important;padding-left:0 !important;padding-right:0 !important}\n' +
'    .rc-col-gap{display:block !important;width:100% !important;height:16px !important}\n' +
'    .rc-col img{width:100% !important;max-width:100% !important}\n' +
(ST.btnPct ? '    .rc-btn{width:100% !important;max-width:100% !important;box-sizing:border-box !important}\n' : '') +
'  }\n' +
'</style>\n' +
'</head>\n' +
'<body style="margin:0;padding:0;background-color:' + ST.page + '">\n' +
'<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:' + ST.page + '">' +
esc(campaign.preheader || '') + '&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>\n' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:' + ST.page +
(ST.bgImage ? ';background-image:url(' + esc(ST.bgImage) + ');background-repeat:no-repeat;background-position:center top;background-size:cover' : '') + '">\n' +
'<tr><td align="center" style="padding:16px">\n' +
browserLink(campaign, font, opts) +
'<!--[if mso]><table role="presentation" width="' + ST.width + '" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->\n' +
'<table role="presentation" class="rc-wrap" width="' + ST.width + '" cellpadding="0" cellspacing="0" border="0"' +
(ST.rtl ? ' dir="rtl"' : '') + ' ' +
'style="width:' + ST.width + 'px;max-width:' + ST.width + 'px;background-color:' + ST.body + '">\n' +
header(account, font, brand, campaign) +
body + '\n' +
footer(account, font, unsubscribe, preferences, brand) +
'</table>\n' +
'<!--[if mso]></td></tr></table><![endif]-->\n' +
'</td></tr></table>\n' +
'</body></html>';
  };

  /* ---------------- the line above the email ---------------- */
  function browserLink(campaign, font, opts) {
    if (!campaign.show_browser_link) return '';
    var url = opts.archiveUrl ||
      (campaign.ref ? 'https://ami.abta.africa/mailroom/campaign-view.html?ref=' + esc(campaign.ref) : '#');
    return '<table role="presentation" class="rc-wrap" width="' + ST.width + '" cellpadding="0" cellspacing="0" border="0" ' +
      'style="width:' + ST.width + 'px;max-width:' + ST.width + 'px">\n' +
      '<tr><td align="right" style="padding:0 4px 8px;font-family:' + font + ';font-size:12px;line-height:18px;' +
      'mso-line-height-rule:exactly;color:' + MUTED + '">' +
      '<a href="' + url + '" style="color:' + MUTED + '">View in browser</a></td></tr>\n' +
      '</table>\n';
  }

  /* ---------------- header ---------------- */
  function header(account, font, brand, campaign) {
    var band = colour(campaign && campaign.header_colour, '');
    var inner;
    if (brand.logo_url) {
      inner = '<img src="' + safeUrl(brand.logo_url) + '" alt="' +
        esc(brand.logo_alt || (account && account.name) || '') + '" width="' + brand.logo_width + '" ' +
        'style="display:block;margin:0 auto;width:' + brand.logo_width + 'px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none">';
    } else {
      inner = '<span style="font-family:' + font + ';font-size:12px;line-height:16px;' +
        'mso-line-height-rule:exactly;letter-spacing:1px;text-transform:uppercase;color:' + MUTED + '">' +
        esc(account && account.name) + '</span>';
    }
    // With a band colour the header is a full-width strip, as most newsletters
    // have it. Without one it is a rule in the accent colour.
    if (band) {
      return '<tr><td class="rc-pad" align="center" style="padding:' + allPad(24) + ';background-color:' + band + '">' +
        inner + '</td></tr>\n';
    }
    return '<tr><td class="rc-pad" style="padding:' + px(24, 0) + '">\n' +
      '  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
      '  <tr><td style="padding-bottom:10px;border-bottom:4px solid ' + brand.accent_colour + '">' +
      inner + '</td></tr>\n' +
      '  </table>\n' +
      '</td></tr>\n';
  }

  /* ---------------- blocks ---------------- */
  function renderBlock(b, font, outlook, brand, ctx) {
    switch (b.type) {
      case 'panel':
        return panel(b, font, outlook, brand, ctx);
      case 'heading':
        return heading(b, font, ctx);
      case 'story':
        return story(b, font, ctx);
      case 'button':
        return button(b, font, outlook, brand, ctx);
      case 'image':
        return row(image(b, ST.inner), px(8), align(b.align));
      case 'divider':
        return '<tr><td style="padding:' + px(8) + '"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
          '<tr><td height="1" style="background-color:' + ctx.rule + ';line-height:1px;font-size:1px">&nbsp;</td></tr></table></td></tr>';
      case 'spacer':
        return spacer(b);
      case 'list':
        return row(list(b, font, ctx), px(8), align(b.align));
      case 'columns':
        return columns(b, font, brand, ctx);
      case 'imagetext':
        return imageText(b, font, brand, ctx);
      case 'social':
        return social(b, font, brand, ctx);
      case 'video':
        return video(b, font, ctx);
      case 'logo':
        return logoBlock(b, brand);
      case 'html':
        return htmlBlock(b, font, ctx);
      case 'product':
        return product(b, font, outlook, brand, ctx);
      case 'navigation':
        return navigation(b, font, ctx);
      case 'dynamic':
        return row(paragraph(merge(b.text, ctx.recipient), font, ctx), px(8), align(b.align));
      default:
        return row(paragraph(b.text, font, ctx), px(8), align(b.align));
    }
  }

  function row(inner, padding, alignment) {
    var a = alignment || align('left');
    return '<tr><td class="rc-pad" align="' + a + '" style="padding:' + padding +
      ';text-align:' + a + '">' + inner + '</td></tr>';
  }

  // Links inside body text are written as [text](url), the one piece of
  // markup the editor accepts, because a member should not have to write HTML.
  function paragraph(text, font, ctx, size) {
    var s = size || { font: ST.pSize, line: ST.pLine };
    var html = esc(text);
    html = html.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, labelText, url) {
      return '<a href="' + safeUrl(url) + '" style="' + linkCss(ctx) + '">' + labelText + '</a>';
    });
    return '<p style="margin:0;font-family:' + bodyFont(font) + ';font-size:' + s.font + 'px;line-height:' + s.line + 'px;' +
      'mso-line-height-rule:exactly;color:' + ctx.ink + '">' + html.replace(/\n/g, '<br>') + '</p>';
  }

  function heading(b, font, ctx) {
    var small = b.level === 'small';
    var size = small ? Math.max(12, ST.tSize - 5) : ST.tSize;
    var line = small ? size + 7 : size + 6;
    return row('<h2 style="margin:0;font-family:' + titleFont(font) + ';font-size:' + size + 'px;line-height:' + line + 'px;' +
      'mso-line-height-rule:exactly;font-weight:bold;color:' + ctx.title + '">' + esc(b.text) + '</h2>',
      small ? px(16, 4) : px(24, 8), align(b.align));
  }

  // One item in a list of stories: a headline, one line underneath, and a
  // hairline above it. Repeat it and you have a weekly briefing.
  function story(b, font, ctx) {
    var url = String(b.url || '').trim();
    var title = esc(b.text || '');
    var head = url
      ? '<a href="' + safeUrl(url) + '" style="color:' + ctx.title + ';text-decoration:none">' + title + '</a>'
      : title;
    var rule = b.rule === false ? '' : 'border-top:1px solid ' + ctx.rule + ';';
    var a = align(b.align);
    return '<tr><td class="rc-pad" align="' + a + '" style="' + rule + 'padding:' + px(14, 12) + ';text-align:' + a + '">' +
      '<h3 style="margin:0 0 4px;font-family:' + titleFont(font) + ';font-size:16px;line-height:22px;' +
      'mso-line-height-rule:exactly;font-weight:bold;color:' + ctx.title + '">' + head + '</h3>' +
      (b.detail ? '<p style="margin:0;font-family:' + bodyFont(font) + ';font-size:13px;line-height:19px;' +
        'mso-line-height-rule:exactly;color:' + ctx.muted + '">' + esc(b.detail) + '</p>' : '') +
      '</td></tr>';
  }

  // A block of colour with other blocks inside it. One level deep: a panel
  // cannot hold another panel, which keeps the markup something Outlook can
  // still render.
  function panel(b, font, outlook, brand, parent) {
    var bg = colour(b.background, brand.accent_colour);
    var ctx = context(brand, b);
    ctx.recipient = parent ? parent.recipient : null;
    var children = (Array.isArray(b.blocks) ? b.blocks : [])
      .filter(function (c) { return c && c.type !== 'panel'; })
      .map(function (c) { return renderBlock(c, font, outlook, brand, ctx); })
      .join('\n');
    return '<tr><td style="padding:0;background-color:' + bg + '">\n' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
      'style="background-color:' + bg + '">\n' +
      '<tr><td height="8" style="height:8px;line-height:8px;font-size:1px">&nbsp;</td></tr>\n' +
      children + '\n' +
      '<tr><td height="8" style="height:8px;line-height:8px;font-size:1px">&nbsp;</td></tr>\n' +
      '</table>\n</td></tr>';
  }

  function image(b, width) {
    return '<img src="' + safeUrl(b.url) + '" alt="' + esc(b.alt) + '" width="' + width + '" ' +
      'style="display:block;width:100%;max-width:' + width + 'px;height:auto;border:0;outline:none;text-decoration:none">';
  }

  function spacer(b) {
    var h = SPACER[b.size] || SPACER.medium;
    return '<tr><td height="' + h + '" style="height:' + h + 'px;line-height:' + h + 'px;font-size:1px">&nbsp;</td></tr>';
  }

  function list(b, font, ctx) {
    var items = String(b.text || '').split('\n').filter(function (l) { return l.trim(); });
    if (!items.length) items = [''];
    return '<ul style="margin:0;padding-' + startSide() + ':22px;font-family:' + bodyFont(font) + ';font-size:' + ST.pSize +
      'px;line-height:' + ST.pLine + 'px;mso-line-height-rule:exactly;color:' + ctx.ink + ';text-align:' + startSide() + '">' +
      items.map(function (l) { return '<li style="margin:0 0 6px">' + esc(l.trim()) + '</li>'; }).join('') +
      '</ul>';
  }

  function columns(b, font, brand, ctx) {
    var left = paragraph(b.left, font, ctx);
    var right = paragraph(b.right, font, ctx);
    return '<tr><td class="rc-pad" style="padding:' + px(8) + '">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td class="rc-col" width="48%" valign="top" style="width:48%;vertical-align:top">' + left + '</td>' +
      '<td class="rc-col-gap" width="4%" style="width:4%;font-size:1px;line-height:1px">&nbsp;</td>' +
      '<td class="rc-col" width="48%" valign="top" style="width:48%;vertical-align:top">' + right + '</td>' +
      '</tr></table></td></tr>';
  }

  function imageText(b, font, brand, ctx) {
    var img = '<td class="rc-col" width="40%" valign="top" style="width:40%;vertical-align:top">' +
      image(b, Math.round(ST.inner * 220 / 552)) + '</td>';
    var txt = '<td class="rc-col" width="56%" valign="top" style="width:56%;vertical-align:top">' +
      paragraph(b.text, font, ctx) + '</td>';
    var gap = '<td class="rc-col-gap" width="4%" style="width:4%;font-size:1px;line-height:1px">&nbsp;</td>';
    // On a phone both cells stack, so the image always ends up above the text.
    var cells = b.side === 'right' ? txt + gap + img : img + gap + txt;
    return '<tr><td class="rc-pad" style="padding:' + px(8) + '">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      cells + '</tr></table></td></tr>';
  }

  function social(b, font, brand, ctx) {
    var links = Array.isArray(b.links) ? b.links : [];
    if (!links.length) return '';
    var a = rawAlign(b.align) === 'left' ? 'center' : align(b.align);
    var inner;
    if (b.style === 'icons') {
      // Icons are images, and most mail apps block images by default, so the
      // description is what a reader sees first. It is required.
      inner = links.map(function (l) {
        return '<a href="' + safeUrl(l.url) + '" style="text-decoration:none">' +
          '<img src="' + safeUrl(l.icon) + '" alt="' + esc(l.label || '') + '" width="24" height="24" ' +
          'style="display:inline-block;width:24px;height:24px;border:0;outline:none;vertical-align:middle">' +
          '</a>';
      }).join('<span style="font-size:1px">&nbsp;&nbsp;&nbsp;</span>');
    } else {
      inner = links.map(function (l) {
        return '<a href="' + safeUrl(l.url) + '" style="color:' + ctx.link +
          ';font-family:' + bodyFont(font) + ';font-size:14px;line-height:20px;text-decoration:underline">' +
          esc(l.label || l.url) + '</a>';
      }).join('<span style="color:' + ctx.muted + '"> &nbsp;&middot;&nbsp; </span>');
    }
    return '<tr><td class="rc-pad" align="' + a + '" style="padding:' + px(12) + ';text-align:' + a + '">' + inner + '</td></tr>';
  }

  /* ---------------- video, logo, HTML, product, navigation, dynamic content ----------------
     Every one of these returns exactly one table row, even when it is empty,
     because the editor matches rows on the screen to blocks by position. */

  // Email cannot play video. A video block is a picture that opens the video
  // page, with a text link under it for readers who block images.
  function videoThumb(b) {
    var thumb = String(b.thumb || '').trim();
    if (thumb) return thumb;
    var m = String(b.url || '').match(/(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/i);
    return m ? 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg' : '';
  }

  function video(b, font, ctx) {
    var url = safeUrl(b.url);
    var thumb = videoThumb(b);
    var a = b.align ? align(b.align) : 'center';
    var pic = thumb
      ? '<a href="' + url + '" style="text-decoration:none"><img src="' + safeUrl(thumb) + '" alt="' + esc(b.alt) +
        '" width="' + ST.inner + '" style="display:block;width:100%;max-width:' + ST.inner + 'px;height:auto;border:0;outline:none;text-decoration:none"></a>'
      : '';
    var link = '<p style="margin:' + (pic ? '8px' : '0') + ' 0 0;font-family:' + bodyFont(font) + ';font-size:15px;line-height:22px;' +
      'mso-line-height-rule:exactly;text-align:' + a + '"><a href="' + url + '" style="' + linkCss(ctx) + '">&#9654; ' +
      esc(b.label || 'Watch the video') + '</a></p>';
    return row(pic + link, px(8), a);
  }

  // The logo saved with the brand, or one chosen for this block.
  function logoBlock(b, brand) {
    var src = String(b.url || '').trim() || brand.logo_url;
    if (!src) return spacer({ size: 'small' });
    var width = Math.max(40, Math.min(ST.inner, parseInt(b.width, 10) || brand.logo_width));
    var a = b.align ? align(b.align) : 'center';
    var margin = a === 'center' ? '0 auto' : (a === 'right' ? '0 0 0 auto' : '0');
    var img = '<img src="' + safeUrl(src) + '" alt="' + esc(b.alt || brand.logo_alt || '') + '" width="' + width + '" ' +
      'style="display:block;margin:' + margin + ';width:' + width + 'px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none">';
    var link = String(b.link || '').trim();
    if (link) img = '<a href="' + safeUrl(link) + '" style="text-decoration:none">' + img + '</a>';
    return row(img, px(16), a);
  }

  // Details from the reader's own record. {{first_name|there}} falls back to
  // the word after the bar. The value belongs to the subscriber, not to the
  // author, so the characters that make a link are taken out of it.
  function merge(text, recipient) {
    var r = recipient || {};
    return String(text || '').replace(/\{\{\s*(first_name|full_name|organisation|country)\s*(?:\|([^}]*))?\}\}/g,
      function (m, key, fallback) {
        var v = key === 'first_name'
          ? (String(r.full_name || '').trim().split(/\s+/)[0] || '')
          : String(r[key] || '').trim();
        v = v.replace(/[\[\]()]/g, '');
        return v || String(fallback || '').trim();
      });
  }

  // An HTML block is rebuilt, not passed through. Only the tags below survive,
  // each with its own inline styling and only the attributes listed, and
  // everything else is written out as plain text. Scripts, styles, forms and
  // frames are dropped with their contents.
  var HTML_TAGS = { p: 1, br: 1, strong: 1, b: 1, em: 1, i: 1, u: 1, a: 1, ul: 1, ol: 1, li: 1, h2: 1, h3: 1, img: 1 };

  function decodeEntities(v) {
    return String(v).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  function htmlAttr(attrs, name) {
    var m = new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', 'i').exec(attrs || '');
    return m ? decodeEntities(m[1] !== undefined ? m[1] : m[2]) : '';
  }

  function safeHtml(html, font, ctx) {
    var src = String(html == null ? '' : html).slice(0, 20000)
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|iframe|object|embed|svg|math|form|textarea|title|head|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, '');
    var base = 'font-family:' + bodyFont(font) + ';color:' + ctx.ink + ';mso-line-height-rule:exactly;';
    var block = base + 'font-size:' + ST.pSize + 'px;line-height:' + ST.pLine + 'px;';
    var head = 'font-family:' + titleFont(font) + ';color:' + ctx.title + ';mso-line-height-rule:exactly;';
    var side = startSide();
    var out = '';
    var open = [];
    var re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)|</g;
    var m;
    while ((m = re.exec(src)) !== null) {
      if (m[4] !== undefined) { out += esc(decodeEntities(m[4])); continue; }
      if (m[2] === undefined) { out += '&lt;'; continue; }
      var tag = m[2].toLowerCase();
      if (!HTML_TAGS[tag]) continue;
      if (m[1]) {
        var at = open.lastIndexOf(tag);
        if (at === -1) continue;
        while (open.length > at) out += '</' + open.pop() + '>';
        continue;
      }
      if (tag === 'br') { out += '<br>'; continue; }
      if (tag === 'img') {
        var w = Math.max(16, Math.min(ST.inner, parseInt(htmlAttr(m[3], 'width'), 10) || ST.inner));
        out += '<img src="' + safeUrl(htmlAttr(m[3], 'src')) + '" alt="' + esc(htmlAttr(m[3], 'alt')) + '" width="' + w +
          '" style="display:block;width:100%;max-width:' + w + 'px;height:auto;border:0;outline:none;text-decoration:none">';
        continue;
      }
      open.push(tag);
      if (tag === 'a') out += '<a href="' + safeUrl(htmlAttr(m[3], 'href')) + '" style="' + linkCss(ctx) + '">';
      else if (tag === 'p') out += '<p style="margin:0 0 12px;' + block + '">';
      else if (tag === 'h2') out += '<h2 style="margin:0 0 8px;' + head + 'font-size:' + ST.tSize + 'px;line-height:' + (ST.tSize + 6) + 'px;font-weight:bold">';
      else if (tag === 'h3') out += '<h3 style="margin:0 0 8px;' + head + 'font-size:' + Math.max(12, ST.tSize - 5) + 'px;line-height:' + (Math.max(12, ST.tSize - 5) + 7) + 'px;font-weight:bold">';
      else if (tag === 'ul' || tag === 'ol') out += '<' + tag + ' style="margin:0 0 12px;padding-' + side + ':22px;' + block + '">';
      else if (tag === 'li') out += '<li style="margin:0 0 6px">';
      else out += '<' + tag + '>';
    }
    while (open.length) out += '</' + open.pop() + '>';
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td style="' + block + 'text-align:' + side + '">' + out + '</td></tr></table>';
  }

  function htmlBlock(b, font, ctx) {
    return row(safeHtml(b.html, font, ctx), px(8), align('left'));
  }

  // The same markup with the tags taken out, for the plain text version.
  function htmlToText(html) {
    return decodeEntities(String(html == null ? '' : html).slice(0, 20000)
      .replace(/<(script|style|iframe|object|embed|svg|math|form|textarea|title|head|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<a\b[^>]*href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, function (m, href, text) {
        return /^(https?:|mailto:)/i.test(href) ? text + ' (' + href + ')' : text;
      })
      .replace(/<br\s*\/?>|<\/(p|li|h2|h3|ul|ol)>/gi, '\n')
      .replace(/<[^>]*>/g, '')).replace(/\n{3,}/g, '\n\n').trim();
  }

  // Image on top, then name, price, a short description and a button.
  function product(b, font, outlook, brand, ctx) {
    var a = align(b.align);
    var rows = '';
    if (b.url) rows += '<tr><td class="rc-pad" align="' + a + '" style="padding:' + px(8, 0) + '">' + image(b, ST.inner) + '</td></tr>';
    if (b.name) {
      rows += '<tr><td class="rc-pad" align="' + a + '" style="padding:' + px(12, 0) + ';text-align:' + a + '">' +
        '<h3 style="margin:0;font-family:' + titleFont(font) + ';font-size:18px;line-height:24px;mso-line-height-rule:exactly;' +
        'font-weight:bold;color:' + ctx.title + '">' + esc(b.name) + '</h3></td></tr>';
    }
    if (b.price) {
      rows += '<tr><td class="rc-pad" align="' + a + '" style="padding:' + px(4, 0) + ';text-align:' + a + '">' +
        '<p style="margin:0;font-family:' + bodyFont(font) + ';font-size:' + ST.pSize + 'px;line-height:' + ST.pLine + 'px;mso-line-height-rule:exactly;' +
        'font-weight:bold;color:' + ctx.ink + '">' + esc(b.price) + '</p></td></tr>';
    }
    if (b.description) {
      rows += '<tr><td class="rc-pad" align="' + a + '" style="padding:' + px(8, 0) + ';text-align:' + a + '">' +
        paragraph(b.description, font, ctx) + '</td></tr>';
    }
    if (b.link) rows += button({ label: b.label || 'Buy now', url: b.link, align: b.align, colour: b.colour, text_colour: b.text_colour }, font, outlook, brand, ctx);
    if (!rows) rows = '<tr><td height="8" style="height:8px;line-height:8px;font-size:1px">&nbsp;</td></tr>';
    return '<tr><td style="padding:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
      rows + '</table></td></tr>';
  }

  // A row of links, as at the top of a website.
  function navigation(b, font, ctx) {
    var links = (Array.isArray(b.links) ? b.links : []).filter(function (l) { return l && String(l.label || '').trim(); });
    if (!links.length) return spacer({ size: 'small' });
    var a = b.align ? align(b.align) : 'center';
    var inner = links.map(function (l) {
      return '<a href="' + safeUrl(l.url) + '" style="color:' + ctx.link + ';font-family:' + bodyFont(font) +
        ';font-size:14px;line-height:20px;font-weight:bold;text-decoration:none">' + esc(l.label) + '</a>';
    }).join('<span style="color:' + ctx.muted + '"> &nbsp;|&nbsp; </span>');
    return '<tr><td class="rc-pad" align="' + a + '" style="padding:' + px(12) + ';text-align:' + a + '">' + inner + '</td></tr>';
  }

  function button(b, font, outlook, brand, ctx) {
    var url = safeUrl(b.url);
    var labelText = esc(b.label || 'Read more');
    var radius = outlook ? '0' : ST.btnRadius + 'px';
    var fill = colour(b.colour, ST.btnBg || brand.button_colour);
    var ink = colour(b.text_colour, ST.btnColour || brand.button_text);
    var edge = ST.btnBorderColour || fill;
    var face = ST.btnFont ? FONTS[ST.btnFont] : font;
    var weight = ST.btnBold ? 'bold' : 'normal';
    var italic = ST.btnItalic ? 'font-style:italic;' : '';
    var arc = Math.min(50, Math.round(ST.btnRadius / 48 * 100));
    var stroke = ST.btnBorder === 2 ? '' : (ST.btnBorder ? ' strokeweight="' + ST.btnBorder + 'px"' : ' stroked="f"');
    var fit = ST.btnPct ? ';max-width:100%;box-sizing:border-box' : '';
    var vml = '<!--[if mso]>' +
      '<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" ' +
      'href="' + url + '" style="height:48px;v-text-anchor:middle;width:' + ST.btnWidth + 'px" arcsize="' + arc + '%" ' +
      'strokecolor="' + edge + '" fillcolor="' + fill + '"' + stroke + '>' +
      '<w:anchorlock/><center style="color:' + ink + ';font-family:' + face + ';font-size:' + ST.btnSize +
      'px;font-weight:' + weight + (ST.btnItalic ? ';font-style:italic' : '') + '">' +
      labelText + '</center></v:roundrect><![endif]-->';
    var fallback = '<!--[if !mso]><!-- -->' +
      '<a href="' + url + '"' + (ST.btnPct ? ' class="rc-btn"' : '') + ' style="background-color:' + fill + ';border:' + ST.btnBorder + 'px solid ' + edge +
      ';border-radius:' + radius + ';color:' + ink + ';display:inline-block;font-family:' + face +
      ';font-size:' + ST.btnSize + 'px;font-weight:' + weight + ';' + italic + 'line-height:' + (48 - 2 * ST.btnBorder) + 'px;' +
      'mso-line-height-rule:exactly;text-align:center;text-decoration:' + (ST.btnUnderline ? 'underline' : 'none') +
      ';width:' + ST.btnWidth + 'px' + fit + '">' + labelText + '</a>' +
      '<!--<![endif]-->';
    var a = align(b.align);
    return '<tr><td class="rc-pad" align="' + a + '" style="padding:' + px(16) + ';text-align:' + a + '">' +
      (outlook ? vml.replace('<!--[if mso]>', '').replace('<![endif]-->', '') : vml + fallback) +
      '</td></tr>';
  }

  function footer(account, font, unsubscribe, preferences, brand) {
    var small = 'font-family:' + font + ';font-size:13px;line-height:20px;mso-line-height-rule:exactly;color:' + MUTED;
    var links = (brand.social_links || []).map(function (l) {
      return '<a href="' + safeUrl(l.url) + '" style="color:' + brand.accent_colour + '">' + esc(l.label || l.url) + '</a>';
    }).join(' &middot; ');
    return '<tr><td class="rc-pad" style="padding:' + allPad(24) + '">\n' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
      '<tr><td style="padding-top:14px;border-top:1px solid ' + RULE + ';' + small + '">\n' +
      '<p style="margin:0 0 8px">' + esc(account && account.name) + ', ' + esc(account && account.postal_address) + '</p>\n' +
      (links ? '<p style="margin:0 0 8px">' + links + '</p>\n' : '') +
      (brand.footer_note ? '<p style="margin:0 0 8px">' + esc(brand.footer_note) + '</p>\n' : '') +
      '<p style="margin:0 0 8px">You are receiving this because you subscribed to updates from ' +
      esc(account && account.name) + '.</p>\n' +
      '<p style="margin:0"><a href="' + preferences + '" style="color:' + brand.accent_colour + '">Choose what you receive</a> &middot; ' +
      '<a href="' + unsubscribe + '" style="color:' + brand.accent_colour + '">Unsubscribe</a></p>\n' +
      '<p style="margin:12px 0 0">' + esc(brand.footer_credit || PLATFORM_CREDIT) + '</p>\n' +
      '</td></tr></table></td></tr>';
  }

  MR.renderText = function (campaign, account, unsubscribeUrl, recipient, brand) {
    var blocks = Array.isArray(campaign.body_blocks) ? campaign.body_blocks : [];
    var body = blocks.map(one).filter(Boolean).join('\n\n');
    return (campaign.subject ? campaign.subject + '\n\n' : '') + body +
      '\n\n---\n' + (account && account.name) + ', ' + (account && account.postal_address) +
      '\nUnsubscribe: ' + (unsubscribeUrl || '') + '\n' + (brandOf(brand).footer_credit || PLATFORM_CREDIT_TEXT);

    function one(b) {
      if (b.type === 'panel') {
        return (Array.isArray(b.blocks) ? b.blocks : []).map(one).filter(Boolean).join('\n\n');
      }
      if (b.type === 'story') {
        return String(b.text || '').toUpperCase() +
          (b.detail ? '\n' + b.detail : '') + (b.url ? '\n' + b.url : '');
      }
      if (b.type === 'button') return (b.label || 'Read more') + ': ' + (b.url || '');
      if (b.type === 'image') return b.alt ? '[' + b.alt + ']' : '';
      if (b.type === 'divider') return '---';
      if (b.type === 'spacer') return '';
      if (b.type === 'heading') return String(b.text || '').toUpperCase();
      if (b.type === 'list') {
        return String(b.text || '').split('\n').filter(function (l) { return l.trim(); })
          .map(function (l) { return '* ' + l.trim(); }).join('\n');
      }
      if (b.type === 'columns') return plain(b.left) + '\n\n' + plain(b.right);
      if (b.type === 'imagetext') return (b.alt ? '[' + b.alt + ']\n' : '') + plain(b.text);
      if (b.type === 'social' || b.type === 'navigation') {
        return (Array.isArray(b.links) ? b.links : [])
          .map(function (l) { return (l.label || '') + ': ' + (l.url || ''); }).join('\n');
      }
      if (b.type === 'video') return (b.label || 'Watch the video') + ': ' + (b.url || '');
      if (b.type === 'logo') return '';
      if (b.type === 'html') return htmlToText(b.html);
      if (b.type === 'product') {
        return [b.name, b.price, plain(b.description), b.link ? (b.label || 'Buy now') + ': ' + b.link : '']
          .filter(function (l) { return l; }).join('\n');
      }
      if (b.type === 'dynamic') return plain(merge(b.text, recipient));
      return plain(b.text);
    }

    // [text](url) reads badly in plain text, so it becomes "text (url)".
    function plain(text) {
      return String(text || '').replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '$1 ($2)');
    }
  };
})();
