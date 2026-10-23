/* ==========================================================================
   AMI Mailroom – sample data for preview mode
   Used only while no Supabase project is configured. Everything is invented.
   ========================================================================== */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};
  if (!MR.cfg || !MR.cfg.demo) return;

  function days(n) {
    var d = new Date(); d.setDate(d.getDate() + n);
    return d.toISOString();
  }

  // Preview mode only. ?plan=free on any page shows the free-plan version of
  // it, which is how the domain page's upgrade prompt is seen without a login.
  var previewFree = /[?&]plan=free\b/.test(location.search);

  MR.sampleAccount = {
    id: 'sample', name: 'Sample Member Ltd', status: 'active', trust_level: 2,
    sender_local: 'sample-member', timezone: 'Africa/Lagos',
    postal_address: '12 Example Road, London, EC1A 1AA, United Kingdom',
    max_subscribers: 500, monthly_send_limit: 1000,
    trial_ends_at: previewFree ? null : days(9),
    plan_code: previewFree ? 'free' : 'starter',
    allows_own_domain: !previewFree,
    allows_custom_footer: !previewFree
  };

  MR.sampleDomains = previewFree ? [] : [
    { id: 'd1', kind: 'own_domain', domain: 'news.example.com', from_local: 'hello',
      status: 'verified', is_default: true, sending_status: 'active',
      trust_level: 2, clean_campaigns: 4, records: [], verified_at: days(-20) },
    { id: 'd2', kind: 'own_domain', domain: 'updates.example.org', from_local: 'updates',
      status: 'pending', is_default: false, sending_status: 'active',
      trust_level: 1, clean_campaigns: 0, last_checked_at: days(0),
      records: [
        { record: 'DKIM', type: 'TXT', name: 'resend._domainkey', value: 'p=SAMPLE0000000000000000000000000000', priority: null, ttl: 'Auto' },
        { record: 'SPF', type: 'TXT', name: 'send', value: '"v=spf1 include:example.net ~all"', priority: null, ttl: 'Auto' },
        { record: 'SPF', type: 'MX', name: 'send', value: 'feedback-smtp.example.net', priority: 10, ttl: 'Auto' }
      ] }
  ];

  MR.sampleBrand = {
    logo_url: '', logo_alt: 'Sample Member Ltd', logo_width: 180,
    accent_colour: '#6b7280', button_colour: '#222222', button_text: '#ffffff',
    font_family: 'sans', footer_note: 'Registered in England and Wales, number 00000000.', footer_credit: '',
    social_links: [{ label: 'LinkedIn', url: 'https://example.com' }]
  };

  MR.sampleImages = [
    { id: 'i1', url: 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#e5e7eb"/>' +
        '<text x="160" y="105" font-family="Arial" font-size="18" text-anchor="middle" fill="#4b5563">Sample image</text></svg>'),
      alt: 'A placeholder standing in for one of your own images', bytes: 1200 }
  ];

  MR.sampleSavedBlocks = [
    { id: 's1', name: 'Our sign-off', blocks: [
      { type: 'divider' },
      { type: 'text', text: 'Thank you for reading.\nThe team at Sample Member Ltd' }
    ] }
  ];

  MR.sampleReplyAddresses = [
    { id: 'r1', email: 'news@example.com', status: 'verified' },
    { id: 'r2', email: 'press@example.com', status: 'pending' }
  ];

  MR.samplePlans = [
    { code: 'free', name: 'Free',
      summary: 'Send a real campaign and see how it works. No card needed.',
      price_minor: 0, currency: 'GBP', interval: 'month',
      monthly_send_limit: 1000, max_subscribers: 500 }
  ];

  MR.sampleForm = {
    slug: 'sample-member', name: 'Website footer', sender_name: 'Sample Member Ltd',
    headline: 'Trade updates, every Tuesday',
    blurb: 'Prices, tenders and market notes for the week ahead.',
    consent_wording: 'Yes, send me Sample Member Ltd trade updates by email. I can unsubscribe at any time.',
    ask_name: true, ask_organisation: true, ask_country: false,
    topics: ['prices', 'tenders']
  };

  MR.sampleForms = [
    { id: 'f1', list_id: 'l1', name: 'Website footer', slug: 'sample-member',
      headline: 'Trade updates, every Tuesday', is_active: true, submissions: 148,
      consent_wording: 'Yes, send me Sample Member Ltd trade updates by email. I can unsubscribe at any time.' }
  ];

  MR.sampleWelcomes = [{ id: 'w1', list_id: 'l1', subject: 'Welcome to Sample Member Ltd' }];

  MR.sampleHub = [
    { account_id: 'acc1', sender_name: 'Sample Member Ltd', list_name: 'Newsletter subscribers',
      topics: ['markets'], frequency: 'all', status: 'subscribed', subscribed_on: days(-120) },
    { account_id: 'acc2', sender_name: 'Accra Freight', list_name: 'Shipping updates',
      topics: [], frequency: 'weekly', status: 'subscribed', subscribed_on: days(-40) },
    { account_id: 'acc3', sender_name: 'Lagos Mills', list_name: 'Price list',
      topics: [], frequency: 'all', status: 'unsubscribed', subscribed_on: days(-300) }
  ];

  MR.sampleLists = [
    { id: 'l1', name: 'Newsletter subscribers', consent_status: 'declared',
      consent_source: 'Sign-up form on our website', subscribers: 2480, unsubscribed: 63 },
    { id: 'l2', name: 'Event attendees 2026', consent_status: 'unconfirmed',
      consent_source: null, subscribers: 410, unsubscribed: 4 }
  ];

  MR.sampleCampaigns = [
    { id: 'c1', ref: 'AMI-M1042', subject: 'Sample: March trade briefing', status: 'sent',
      sent_at: days(-6), updated_at: days(-6), recipients: 2411, delivered: 2388, bounced: 23, complained: 1,
      clicked: 412, unsubscribed: 9 },
    { id: 'c2', ref: null, subject: 'Sample: April market outlook', status: 'held',
      created_at: days(-1), updated_at: days(-1), recipients: 0, delivered: 0, bounced: 0, complained: 0, clicked: 0, unsubscribed: 0 },
    { id: 'c3', ref: null, subject: 'Sample: draft announcement', status: 'draft',
      created_at: days(0), updated_at: days(0), recipients: 0, delivered: 0, bounced: 0, complained: 0, clicked: 0, unsubscribed: 0 },
    { id: 'c4', ref: null, subject: 'Sample: May market outlook', status: 'scheduled',
      created_at: days(0), updated_at: days(0), scheduled_for: days(3), recipients: 0, delivered: 0,
      bounced: 0, complained: 0, clicked: 0, unsubscribed: 0 },
    { id: 'c5', ref: null, subject: '', status: 'draft',
      created_at: days(-2), updated_at: days(-2), recipients: 0, delivered: 0,
      bounced: 0, complained: 0, clicked: 0, unsubscribed: 0,
      body_blocks: [{ type: 'heading', text: 'Annual meeting 2027: save the date' }] },
    { id: 'c6', ref: null, subject: '', status: 'draft',
      created_at: days(-2), updated_at: days(-1), recipients: 0, delivered: 0,
      bounced: 0, complained: 0, clicked: 0, unsubscribed: 0,
      body_blocks: [{ type: 'heading', text: 'Trade mission to Nairobi' }] }
  ];

  MR.sampleArchive = [
    { ref: 'AMI-M1042', subject: 'Sample: March trade briefing', sender_name: 'Sample Member Ltd', sent_at: days(-6) },
    { ref: 'AMI-M1039', subject: 'Sample: February trade briefing', sender_name: 'Sample Member Ltd', sent_at: days(-34) }
  ];

  MR.sampleSubscriber = {
    email: 'reader@example.com', full_name: 'Sample Reader',
    topics: ['markets', 'events'], frequency: 'all', status: 'subscribed'
  };
})();
