/* ==========================================================================
   ABTA Deal Room v2 – review mode
   Sample listings and simulated API responses so the design and journeys
   can be reviewed without a live back end. Nothing is sent anywhere.
   All listings are fictional and labelled as sample data on screen.
   ========================================================================== */
(function () {
  'use strict';
  var DR = window.DR;
  if (!DR) return;

  var SAMPLE = [
    { id: 's1', published_ref: 'SAMPLE-001', deal_type: 'Equity Investment', sector: 'Clean Energy', region: 'East Africa', capital_range: 'USD 15m – 50m', published_at: '2026-09-02T09:00:00Z',
      teaser_headline: 'Sample: operating solar portfolio seeking growth equity',
      summary: 'Sample listing for design review. An independent power producer with operating solar assets under long-term offtake agreements is seeking a minority equity partner to fund a second phase of capacity.',
      highlights: ['Operating assets with contracted revenue', 'Second-phase sites identified and permitted', 'Management team with regional project delivery experience', 'Open to DFI co-investment'],
      secondary_facts: [{ label: 'Stake offered', value: 'Minority' }, { label: 'Stage', value: 'Growth' }] },
    { id: 's2', published_ref: 'SAMPLE-002', deal_type: 'Debt Financing', sector: 'Agriculture & Food', region: 'West Africa', capital_range: 'USD 5m – 15m', published_at: '2026-08-28T09:00:00Z',
      teaser_headline: 'Sample: agri-processor seeking working capital facility',
      summary: 'Sample listing for design review. A food processing business with export contracts is seeking a trade finance or working capital facility to support seasonal procurement from smallholder suppliers.',
      highlights: ['Export offtake contracts in place', 'Audited accounts for three years', 'Seasonal facility with asset security available'],
      secondary_facts: [{ label: 'Instrument', value: 'Working capital' }, { label: 'Tenor', value: '3 years' }] },
    { id: 's3', published_ref: 'SAMPLE-003', deal_type: 'Acquisition / Sale', sector: 'Financial Services', region: 'Southern Africa', capital_range: 'USD 15m – 50m', published_at: '2026-08-21T09:00:00Z',
      teaser_headline: 'Sample: regional microfinance lender available for acquisition',
      summary: 'Sample listing for design review. A shareholder group is considering the sale of a licensed lender with a diversified loan book and branch network across two markets.',
      highlights: ['Licensed and regulated in its markets', 'Diversified SME and consumer loan book', 'Experienced local management'],
      secondary_facts: [{ label: 'Stake offered', value: 'Majority' }, { label: 'Licence', value: 'In place' }] },
    { id: 's4', published_ref: 'SAMPLE-004', deal_type: 'Joint Venture', sector: 'Infrastructure', region: 'North Africa', capital_range: 'USD 50m – 150m', published_at: '2026-08-14T09:00:00Z',
      teaser_headline: 'Sample: logistics park developer seeking joint venture partner',
      summary: 'Sample listing for design review. A developer with secured land near a port is seeking a strategic or financial joint venture partner for a multi-phase logistics park.',
      highlights: ['Land secured with zoning approval', 'Senior debt discussions under way', 'Phased development reduces early capital need'],
      secondary_facts: [{ label: 'Structure', value: 'Project company' }] },
    { id: 's5', published_ref: 'SAMPLE-005', deal_type: 'Equity Investment', sector: 'Technology & Digital', region: 'Pan-African', capital_range: 'USD 5m – 15m', published_at: '2026-08-07T09:00:00Z',
      teaser_headline: 'Sample: B2B payments platform raising Series B',
      summary: 'Sample listing for design review. A business-to-business payments company operating in several markets is raising growth capital to expand its merchant network.',
      highlights: ['Revenue growth over three consecutive years', 'Licences held in operating markets', 'Existing institutional investors participating'],
      secondary_facts: [{ label: 'Round', value: 'Series B' }] },
    { id: 's6', published_ref: 'SAMPLE-006', deal_type: 'Debt Financing', sector: 'Healthcare', region: 'East Africa', capital_range: 'USD 5m – 15m', published_at: '2026-07-30T09:00:00Z',
      teaser_headline: 'Sample: diagnostics network seeking equipment finance',
      summary: 'Sample listing for design review. A network of diagnostic centres is seeking asset-backed finance for imaging and laboratory equipment across new sites.',
      highlights: ['Established network with recurring patient volumes', 'Equipment suppliers identified', 'Asset-backed structure proposed'],
      secondary_facts: [{ label: 'Instrument', value: 'Asset finance' }, { label: 'Tenor', value: '5 years' }] },
    { id: 's7', published_ref: 'SAMPLE-007', deal_type: 'Commercial Contract', sector: 'Mining & Resources', region: 'Central Africa', capital_range: 'USD 50m – 150m', published_at: '2026-07-22T09:00:00Z',
      teaser_headline: 'Sample: offtake partner sought for concentrate production',
      summary: 'Sample listing for design review. A producer with a permitted operation is seeking a long-term offtake partner, with the option of prepayment finance.',
      highlights: ['Permitted operation', 'Independent technical report available after introduction', 'Prepayment structure considered'],
      secondary_facts: [{ label: 'Contract', value: 'Offtake' }] },
    { id: 's8', published_ref: 'SAMPLE-008', deal_type: 'Equity Investment', sector: 'Real Estate', region: 'West Africa', capital_range: 'USD 15m – 50m', published_at: '2026-07-15T09:00:00Z',
      teaser_headline: 'Sample: student accommodation platform seeking co-investor',
      summary: 'Sample listing for design review. An operator of purpose-built student accommodation is seeking a co-investor for a pipeline of sites near universities.',
      highlights: ['Operating assets with high occupancy', 'Pipeline sites under option', 'Co-investment at asset or platform level'],
      secondary_facts: [{ label: 'Stake offered', value: 'Minority' }] }
  ];
  DR.SAMPLE = SAMPLE;

  DR.demoListings = function (f) {
    var rows = SAMPLE.filter(function (d) {
      if (f.type && d.deal_type !== f.type) return false;
      if (f.sector && d.sector !== f.sector) return false;
      if (f.region && d.region !== f.region) return false;
      if (f.capital && d.capital_range !== f.capital) return false;
      if (f.ref && d.published_ref !== f.ref) return false;
      if (f.id && d.id !== f.id) return false;
      if (f.keywords) {
        var k = f.keywords.toLowerCase();
        if ((d.teaser_headline + ' ' + d.summary + ' ' + d.sector + ' ' + d.region).toLowerCase().indexOf(k) === -1) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      if (f.sort === 'oldest') return a.published_at < b.published_at ? -1 : 1;
      if (f.sort === 'largest') return DR.capitalRank(b.capital_range) - DR.capitalRank(a.capital_range);
      if (f.sort === 'smallest') return DR.capitalRank(a.capital_range) - DR.capitalRank(b.capital_range);
      return a.published_at < b.published_at ? 1 : -1;
    });
    var limit = f.limit || 10, page = f.page || 1;
    return DR.demoDelay({ ok: true, rows: rows.slice((page - 1) * limit, page * limit), total: rows.length });
  };

  function ref(prefix) {
    var n = Math.floor(Date.now() / 1000) % 100000;
    return prefix + '-DEMO-' + String(n).padStart(5, '0');
  }

  DR.demoApi = function (name, o) {
    var body = o.body || {};
    var st = DR.store;
    var account = st.get('dr_demo_account', null);
    switch (name) {
      case 'deal-room-account': {
        var s = DR.session.get();
        if (!s.token) return DR.demoDelay({ ok: false, status: 401, data: { error: 'not_authenticated' } });
        var acc = account || { member: { full_name: 'Sample Member', organisation: 'Sample Capital Partners', role: 'Investment Director', email: s.email || 'member@example.com', status: 'active', payment_status: 'paid', verification_status: 'pending', paid_until: '2027-09-10T00:00:00Z', org_type: 'Private equity', agreement_version_current: true, agreement_id: 'AGR-DEMO-00001', renews: true } };
        return DR.demoDelay({ ok: true, data: {
          ok: true,
          member: acc.member,
          interests: st.get('dr_demo_interests', [
            { reference: 'INT-DEMO-00142', teaser_ref: 'SAMPLE-003', status: 'introduced', created_at: '2026-08-25T10:00:00Z', introduced_at: '2026-08-29T10:00:00Z' },
            { reference: 'INT-DEMO-00151', teaser_ref: 'SAMPLE-001', status: 'screening', created_at: '2026-09-04T10:00:00Z' }
          ]),
          submissions: st.get('dr_demo_submissions', []),
          bookmarks: st.get('dr_demo_bookmarks', [])
        } });
      }
      case 'deal-room-interest-gateway': {
        var r = ref('INT');
        var list = st.get('dr_demo_interests', []);
        list.unshift({ reference: r, teaser_ref: body.teaser_ref, status: 'submitted', created_at: new Date().toISOString() });
        st.set('dr_demo_interests', list);
        return DR.demoDelay({ ok: true, data: { ok: true, reference: r } });
      }
      case 'deal-room-submit-gateway': {
        var r2 = ref('SUB');
        var subs = st.get('dr_demo_submissions', []);
        subs.unshift({ reference: r2, deal_type: body.deal_type, sector: body.sector, status: 'pending', created_at: new Date().toISOString() });
        st.set('dr_demo_submissions', subs);
        return DR.demoDelay({ ok: true, data: { ok: true, reference: r2 } });
      }
      case 'deal-room-upload-url':
        return DR.demoDelay({ ok: true, data: { path: 'pending/demo/' + body.file_name, signedUrl: '', token: 'demo' } });
      case 'deal-room-anonymity-check':
        return DR.demoDelay({ ok: true, data: { ok: true, flags: /\b[A-Z][a-z]+ (Ltd|Limited|plc|SA)\b/.test(body.text || '') ? [{ text: 'company name', reason: 'Looks like a company name.' }] : [] } });
      case 'deal-room-agreement-gateway':
        st.set('dr_demo_account', { member: { full_name: body.full_name, organisation: body.organisation, role: body.role, email: body.email, status: 'pending_payment', payment_status: 'unpaid', verification_status: 'pending', org_type: body.org_type, agreement_version_current: true, agreement_id: 'AGR-DEMO-00001' } });
        return DR.demoDelay({ ok: true, data: { ok: true, agreement_id: ref('AGR'), signed_at: new Date().toISOString() } });
      case 'deal-room-checkout': {
        if (body.action === 'portal') return DR.demoDelay({ ok: true, data: { url: 'account.html?section=membership&portal=demo' } });
        var a = st.get('dr_demo_account', null);
        if (a) { a.member.status = 'active'; a.member.payment_status = 'paid'; a.member.paid_until = new Date(Date.now() + 365 * 864e5).toISOString(); st.set('dr_demo_account', a); }
        return DR.demoDelay({ ok: true, data: { url: 'create-account.html?step=confirmation&session_id=demo' } });
      }
      case 'deal-room-reveal':
        if (body.teaser_ref === 'SAMPLE-003') {
          return DR.demoDelay({ ok: true, data: { teaser_ref: body.teaser_ref, fields: [['Organisation', 'Sample Holdings (fictional)'], ['Contact', 'Sample Contact, Chief Financial Officer'], ['Email', 'contact@example.com'], ['Adviser', 'Sample Advisory (fictional)']] } });
        }
        return DR.demoDelay({ ok: false, status: 403, data: { error: 'introduction_required' } });
      case 'deal-room-preferences':
        if (o.body) { st.set('dr_demo_prefs', body); return DR.demoDelay({ ok: true, data: { ok: true } }); }
        return DR.demoDelay({ ok: true, data: st.get('dr_demo_prefs', { preferred_sectors: [], preferred_regions: [], digest_opt_in: false }) });
      case 'deal-room-qa':
        if (o.body) return DR.demoDelay({ ok: true, data: { ok: true, id: 'demo' } });
        return DR.demoDelay({ ok: true, data: { questions: [] } });
      default:
        return DR.demoDelay({ ok: false, status: 404, data: { error: 'not_available_in_review_mode' } });
    }
  };
})();
