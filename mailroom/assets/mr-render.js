/* ==========================================================================
   AMI Mailroom – email rendering
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
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
  };
  MR.FONTS = FONTS;

  var DEFAULT_BRAND = {
    logo_url: '', logo_alt: '', logo_width: 180,
    accent_colour: '#1e6b3c', button_colour: '#f9c53d', button_text: '#1a1208',
    font_family: 'sans', footer_note: '', social_links: []
  };
  MR.DEFAULT_BRAND = DEFAULT_BRAND;

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

  function align(value) {
    return ALIGN[String(value || '').toLowerCase()] || 'left';
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
      return { ink: INK, muted: MUTED, link: brand.accent_colour, rule: RULE, panel: false };
    }
    var ink = colour(panel.text_colour, '#ffffff');
    return {
      ink: ink,
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
    var brand = brandOf(opts.brand);
    var font = FONTS[campaign.font_family || brand.font_family] || FONTS.sans;
    var outlook = !!opts.outlook;
    var blocks = Array.isArray(campaign.body_blocks) ? campaign.body_blocks : [];
    var unsubscribe = opts.unsubscribeUrl || '#';
    var preferences = opts.preferencesUrl || '#';
    var ctx = context(brand, null);

    var body = blocks.map(function (b) {
      return renderBlock(b, font, outlook, brand, ctx);
    }).join('\n');

    return '<!doctype html>\n' +
'<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">\n' +
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
'  @media screen and (max-width:620px){\n' +
'    .rc-wrap{width:100% !important}\n' +
'    .rc-pad{padding-left:16px !important;padding-right:16px !important}\n' +
'    .rc-col{display:block !important;width:100% !important;max-width:100% !important;padding-left:0 !important;padding-right:0 !important}\n' +
'    .rc-col-gap{display:block !important;width:100% !important;height:16px !important}\n' +
'    .rc-col img{width:100% !important;max-width:100% !important}\n' +
'  }\n' +
'</style>\n' +
'</head>\n' +
'<body style="margin:0;padding:0;background-color:#f3f2f1">\n' +
'<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f3f2f1">' +
esc(campaign.preheader || '') + '&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>\n' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f2f1">\n' +
'<tr><td align="center" style="padding:16px">\n' +
browserLink(campaign, font, opts) +
'<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->\n' +
'<table role="presentation" class="rc-wrap" width="600" cellpadding="0" cellspacing="0" border="0" ' +
'style="width:600px;max-width:600px;background-color:#ffffff">\n' +
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
    return '<table role="presentation" class="rc-wrap" width="600" cellpadding="0" cellspacing="0" border="0" ' +
      'style="width:600px;max-width:600px">\n' +
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
      return '<tr><td class="rc-pad" align="center" style="padding:24px;background-color:' + band + '">' +
        inner + '</td></tr>\n';
    }
    return '<tr><td class="rc-pad" style="padding:24px 24px 0">\n' +
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
        return panel(b, font, outlook, brand);
      case 'heading':
        return heading(b, font, ctx);
      case 'story':
        return story(b, font, ctx);
      case 'button':
        return button(b, font, outlook, brand, ctx);
      case 'image':
        return row(image(b, 552), '8px 24px', align(b.align));
      case 'divider':
        return '<tr><td style="padding:8px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
          '<tr><td height="1" style="background-color:' + ctx.rule + ';line-height:1px;font-size:1px">&nbsp;</td></tr></table></td></tr>';
      case 'spacer':
        return spacer(b);
      case 'list':
        return row(list(b, font, ctx), '8px 24px', align(b.align));
      case 'columns':
        return columns(b, font, brand, ctx);
      case 'imagetext':
        return imageText(b, font, brand, ctx);
      case 'social':
        return social(b, font, brand, ctx);
      default:
        return row(paragraph(b.text, font, ctx), '8px 24px', align(b.align));
    }
  }

  function row(inner, padding, alignment) {
    var a = alignment || 'left';
    return '<tr><td class="rc-pad" align="' + a + '" style="padding:' + padding +
      ';text-align:' + a + '">' + inner + '</td></tr>';
  }

  // Links inside body text are written as [text](url), the one piece of
  // markup the editor accepts, because a member should not have to write HTML.
  function paragraph(text, font, ctx, size) {
    var s = size || { font: 16, line: 24 };
    var html = esc(text);
    html = html.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, labelText, url) {
      return '<a href="' + safeUrl(url) + '" style="color:' + ctx.link + '">' + labelText + '</a>';
    });
    return '<p style="margin:0;font-family:' + font + ';font-size:' + s.font + 'px;line-height:' + s.line + 'px;' +
      'mso-line-height-rule:exactly;color:' + ctx.ink + '">' + html.replace(/\n/g, '<br>') + '</p>';
  }

  function heading(b, font, ctx) {
    var small = b.level === 'small';
    var size = small ? 17 : 22;
    var line = small ? 24 : 28;
    return row('<h2 style="margin:0;font-family:' + font + ';font-size:' + size + 'px;line-height:' + line + 'px;' +
      'mso-line-height-rule:exactly;font-weight:bold;color:' + ctx.ink + '">' + esc(b.text) + '</h2>',
      small ? '16px 24px 4px' : '24px 24px 8px', align(b.align));
  }

  // One item in a list of stories: a headline, one line underneath, and a
  // hairline above it. Repeat it and you have a Week in Review.
  function story(b, font, ctx) {
    var url = String(b.url || '').trim();
    var title = esc(b.text || '');
    var head = url
      ? '<a href="' + safeUrl(url) + '" style="color:' + ctx.ink + ';text-decoration:none">' + title + '</a>'
      : title;
    var rule = b.rule === false ? '' : 'border-top:1px solid ' + ctx.rule + ';';
    var a = align(b.align);
    return '<tr><td class="rc-pad" align="' + a + '" style="' + rule + 'padding:14px 24px 12px;text-align:' + a + '">' +
      '<h3 style="margin:0 0 4px;font-family:' + font + ';font-size:16px;line-height:22px;' +
      'mso-line-height-rule:exactly;font-weight:bold;color:' + ctx.ink + '">' + head + '</h3>' +
      (b.detail ? '<p style="margin:0;font-family:' + font + ';font-size:13px;line-height:19px;' +
        'mso-line-height-rule:exactly;color:' + ctx.muted + '">' + esc(b.detail) + '</p>' : '') +
      '</td></tr>';
  }

  // A block of colour with other blocks inside it. One level deep: a panel
  // cannot hold another panel, which keeps the markup something Outlook can
  // still render.
  function panel(b, font, outlook, brand) {
    var bg = colour(b.background, brand.accent_colour);
    var ctx = context(brand, b);
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
    return '<ul style="margin:0;padding-left:22px;font-family:' + font + ';font-size:16px;line-height:24px;' +
      'mso-line-height-rule:exactly;color:' + ctx.ink + ';text-align:left">' +
      items.map(function (l) { return '<li style="margin:0 0 6px">' + esc(l.trim()) + '</li>'; }).join('') +
      '</ul>';
  }

  function columns(b, font, brand, ctx) {
    var left = paragraph(b.left, font, ctx);
    var right = paragraph(b.right, font, ctx);
    return '<tr><td class="rc-pad" style="padding:8px 24px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td class="rc-col" width="48%" valign="top" style="width:48%;vertical-align:top">' + left + '</td>' +
      '<td class="rc-col-gap" width="4%" style="width:4%;font-size:1px;line-height:1px">&nbsp;</td>' +
      '<td class="rc-col" width="48%" valign="top" style="width:48%;vertical-align:top">' + right + '</td>' +
      '</tr></table></td></tr>';
  }

  function imageText(b, font, brand, ctx) {
    var img = '<td class="rc-col" width="40%" valign="top" style="width:40%;vertical-align:top">' +
      image(b, 220) + '</td>';
    var txt = '<td class="rc-col" width="56%" valign="top" style="width:56%;vertical-align:top">' +
      paragraph(b.text, font, ctx) + '</td>';
    var gap = '<td class="rc-col-gap" width="4%" style="width:4%;font-size:1px;line-height:1px">&nbsp;</td>';
    // On a phone both cells stack, so the image always ends up above the text.
    var cells = b.side === 'right' ? txt + gap + img : img + gap + txt;
    return '<tr><td class="rc-pad" style="padding:8px 24px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      cells + '</tr></table></td></tr>';
  }

  function social(b, font, brand, ctx) {
    var links = Array.isArray(b.links) ? b.links : [];
    if (!links.length) return '';
    var a = align(b.align) === 'left' ? 'center' : align(b.align);
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
          ';font-family:' + font + ';font-size:14px;line-height:20px;text-decoration:underline">' +
          esc(l.label || l.url) + '</a>';
      }).join('<span style="color:' + ctx.muted + '"> &nbsp;&middot;&nbsp; </span>');
    }
    return '<tr><td class="rc-pad" align="' + a + '" style="padding:12px 24px;text-align:' + a + '">' + inner + '</td></tr>';
  }

  function button(b, font, outlook, brand, ctx) {
    var url = safeUrl(b.url);
    var labelText = esc(b.label || 'Read more');
    var radius = outlook ? '0' : '24px';
    var fill = colour(b.colour, brand.button_colour);
    var ink = colour(b.text_colour, brand.button_text);
    var vml = '<!--[if mso]>' +
      '<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" ' +
      'href="' + url + '" style="height:48px;v-text-anchor:middle;width:260px" arcsize="50%" ' +
      'strokecolor="' + fill + '" fillcolor="' + fill + '">' +
      '<w:anchorlock/><center style="color:' + ink + ';font-family:' + font + ';font-size:16px;font-weight:bold">' +
      labelText + '</center></v:roundrect><![endif]-->';
    var fallback = '<!--[if !mso]><!-- -->' +
      '<a href="' + url + '" style="background-color:' + fill + ';border:2px solid ' + fill +
      ';border-radius:' + radius + ';color:' + ink + ';display:inline-block;font-family:' + font +
      ';font-size:16px;font-weight:bold;line-height:44px;' +
      'mso-line-height-rule:exactly;text-align:center;text-decoration:none;width:260px">' + labelText + '</a>' +
      '<!--<![endif]-->';
    var a = align(b.align);
    return '<tr><td class="rc-pad" align="' + a + '" style="padding:16px 24px;text-align:' + a + '">' +
      (outlook ? vml.replace('<!--[if mso]>', '').replace('<![endif]-->', '') : vml + fallback) +
      '</td></tr>';
  }

  function footer(account, font, unsubscribe, preferences, brand) {
    var small = 'font-family:' + font + ';font-size:13px;line-height:20px;mso-line-height-rule:exactly;color:' + MUTED;
    var links = (brand.social_links || []).map(function (l) {
      return '<a href="' + safeUrl(l.url) + '" style="color:' + brand.accent_colour + '">' + esc(l.label || l.url) + '</a>';
    }).join(' &middot; ');
    return '<tr><td class="rc-pad" style="padding:24px">\n' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
      '<tr><td style="padding-top:14px;border-top:1px solid ' + RULE + ';' + small + '">\n' +
      '<p style="margin:0 0 8px">' + esc(account && account.name) + ', ' + esc(account && account.postal_address) + '</p>\n' +
      (links ? '<p style="margin:0 0 8px">' + links + '</p>\n' : '') +
      (brand.footer_note ? '<p style="margin:0 0 8px">' + esc(brand.footer_note) + '</p>\n' : '') +
      '<p style="margin:0 0 8px">You are receiving this because you subscribed to updates from ' +
      esc(account && account.name) + '.</p>\n' +
      '<p style="margin:0"><a href="' + preferences + '" style="color:' + brand.accent_colour + '">Choose what you receive</a> &middot; ' +
      '<a href="' + unsubscribe + '" style="color:' + brand.accent_colour + '">Unsubscribe</a></p>\n' +
      '<p style="margin:12px 0 0">Sent through AMI Mailroom, operated by African Business Trade Association Limited.</p>\n' +
      '</td></tr></table></td></tr>';
  }

  MR.renderText = function (campaign, account, unsubscribeUrl) {
    var blocks = Array.isArray(campaign.body_blocks) ? campaign.body_blocks : [];
    var body = blocks.map(one).filter(Boolean).join('\n\n');
    return (campaign.subject ? campaign.subject + '\n\n' : '') + body +
      '\n\n---\n' + (account && account.name) + ', ' + (account && account.postal_address) +
      '\nUnsubscribe: ' + (unsubscribeUrl || '') + '\nSent through AMI Mailroom.';

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
      if (b.type === 'social') {
        return (Array.isArray(b.links) ? b.links : [])
          .map(function (l) { return (l.label || '') + ': ' + (l.url || ''); }).join('\n');
      }
      return plain(b.text);
    }

    // [text](url) reads badly in plain text, so it becomes "text (url)".
    function plain(text) {
      return String(text || '').replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '$1 ($2)');
    }
  };
})();
