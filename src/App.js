import React, { useState, useEffect } from 'react';
import useConfig from './hooks/useConfig';
import { calcMonthlyRevenue, calcTierScore, scoreToTier, calcROI } from './utils/scoring';
import SUBURBS_DATA from './data/suburbs';
import './App.css';

const ALL_LOCATIONS = Object.entries(SUBURBS_DATA).flatMap(([region, suburbs]) =>
  suburbs.map(s => ({ name: s, region }))
);

function fmtAUD(n) {
  if (!n && n !== 0) return '$0';
  return '$' + Math.round(n).toLocaleString('en-AU');
}

export default function App() {
  const { config, loading } = useConfig();
  const [activeTab, setActiveTab] = useState('quote');

  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDrop, setShowLocationDrop] = useState(false);

  const [removedKeywords, setRemovedKeywords] = useState(new Set());
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [domain, setDomain] = useState('');
  const [metricsData, setMetricsData] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [selectedMetricKws, setSelectedMetricKws] = useState(new Set());
  const [metricsIndustry, setMetricsIndustry] = useState('');

  // ── Paid Ads state ──
  const [paBusinessName, setPaBusinessName] = useState('');
  const [paOwnerName, setPaOwnerName] = useState('');
  const [paPhone, setPaPhone] = useState('');
  const [paEmail, setPaEmail] = useState('');
  const [paIndustry, setPaIndustry] = useState('');
  const [paLocation, setPaLocation] = useState('');
  const [paServices, setPaServices] = useState([]);
  const [paServiceInput, setPaServiceInput] = useState('');
  const [paServiceAreas, setPaServiceAreas] = useState('');
  const [paGoals, setPaGoals] = useState('');
  const [paChallenges, setPaChallenges] = useState('');
  const [paPromotions, setPaPromotions] = useState('');
  const [paUSPs, setPaUSPs] = useState('');
  const [paNotes, setPaNotes] = useState('');
  const [paShowOptional, setPaShowOptional] = useState(false);
  const [paBudget, setPaBudget] = useState('');
  const [paBudgetMode, setPaBudgetMode] = useState('monthly');
  const [paKeywords, setPaKeywords] = useState([]);
  const [paKwInput, setPaKwInput] = useState('');
  const [paCpcInput, setPaCpcInput] = useState('');
  const [paCvrLow, setPaCvrLow] = useState('');
  const [paCvrMid, setPaCvrMid] = useState('');
  const [paCvrHigh, setPaCvrHigh] = useState('');
  const [paCloseRate, setPaCloseRate] = useState('');
  const [paJobValue, setPaJobValue] = useState('');
  const [paAvgProfit, setPaAvgProfit] = useState('');

  const allKeywords = services.flatMap(s =>
    locations.map(l => `${s.toLowerCase()} ${l.toLowerCase()}`)
  );
  const activeKeywords = allKeywords.filter(k => !removedKeywords.has(k));

  // Keep removed set tidy when services/locations change
  useEffect(() => {
    setRemovedKeywords(prev => new Set([...prev].filter(k => allKeywords.includes(k))));
  }, [services, locations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset quote when inputs change
  useEffect(() => { setQuoteData(null); }, [services, locations]);

  const locationOptions = ALL_LOCATIONS
    .filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase()) && !locations.includes(l.name))
    .slice(0, 8);

  const addService = (s) => {
    const trimmed = s.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices(prev => [...prev, trimmed]);
    }
    setServiceSearch('');
  };
  const addLocation = (l) => {
    const trimmed = l.trim();
    if (trimmed && !locations.includes(trimmed)) {
      setLocations(prev => [...prev, trimmed]);
    }
    setLocationSearch('');
    setShowLocationDrop(false);
  };
  const removeService = (s) => setServices(prev => prev.filter(x => x !== s));
  const removeLocation = (l) => setLocations(prev => prev.filter(x => x !== l));

  const toggleKeyword = (k) => {
    setRemovedKeywords(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const generateQuote = async () => {
    if (activeKeywords.length === 0) return;
    setQuoteLoading(true);

    const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL;
    const isDemo = !webhookUrl || webhookUrl.includes('YOUR_N8N');

    if (isDemo) {
      await new Promise(r => setTimeout(r, 900));
      const mockKeywords = activeKeywords.map(k => ({
        keyword: k,
        volume: Math.floor(Math.random() * 2500) + 400,
        kd: Math.floor(Math.random() * 40) + 20,
        cpc: Math.floor(Math.random() * 1500) + 150,
      }));
      const svcLower = (services[0] || '').toLowerCase();
      const industryData = config.industries.find(i =>
        i.industry.toLowerCase().includes(svcLower) || svcLower.includes(i.industry.toLowerCase())
      ) || {};
      setQuoteData({
        keywords: mockKeywords,
        areaTypes: Object.fromEntries(locations.map(l => [l, 'Metro'])),
        ymyl: { isYMYL: industryData.ymyl || false, reason: 'Demo mode' },
        benchmarks: {
          industry: services[0],
          closeRate: industryData.closeRate || 35,
          avgSaleValue: industryData.avgSaleValue || 2500,
          convRate: industryData.convRate || 3.0,
        },
        demoMode: true,
      });
    } else {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ services, suburbs: locations, keywords: activeKeywords }),
        });
        setQuoteData(await res.json());
      } catch (err) {
        console.error('n8n error:', err);
      }
    }
    setQuoteLoading(false);
  };

  const fetchMetrics = async () => {
    if (!domain.trim()) return;
    setMetricsLoading(true);
    setMetricsError(null);
    setMetricsData(null);
    setSelectedMetricKws(new Set());
    const webhookUrl = process.env.REACT_APP_N8N_METRICS_URL;
    if (!webhookUrl || webhookUrl.includes('YOUR_N8N')) {
      setMetricsError('Metrics webhook not configured. Add REACT_APP_N8N_METRICS_URL to your environment variables.');
      setMetricsLoading(false);
      return;
    }
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();
      setMetricsData(data);
    } catch (err) {
      setMetricsError('Failed to fetch metrics. Check the webhook URL and try again.');
      console.error('metrics error:', err);
    }
    setMetricsLoading(false);
  };

  // Compute quote outputs
  let quoteOutputs = null;
  if (quoteData) {
    const ts = calcTierScore({
      keywords: quoteData.keywords || [],
      suburbCount: locations.length,
      isYMYL: quoteData.ymyl?.isYMYL || false,
      areaTypes: quoteData.areaTypes || {},
    });
    const tier = scoreToTier(ts.score);
    const pricing = config.tiers?.[tier] || { min: 1599, max: 2099 };
    const bench = quoteData.benchmarks || {};
    const mr = calcMonthlyRevenue({
      volume: ts.avgVolume,
      convRate: bench.convRate || config.defaultConvRate || 2.5,
      closeRate: bench.closeRate || 35,
      avgSaleValue: bench.avgSaleValue || 2000,
    });
    const roi = calcROI({
      monthlyRevenue: mr.revenue,
      retainerMin: pricing.min,
      retainerMax: pricing.max || pricing.min * 1.5,
    });
    quoteOutputs = { ts, tier, pricing, mr, roi };
  }

  // ── Domain Analysis: opportunity scoring & ROI ──
  const oppScore = (kw) => Math.round((kw.volume || 0) * (100 - (kw.keyword_difficulty || 0)) / 100);
  const sortedMetricsKws = metricsData?.keywords
    ? [...metricsData.keywords].sort((a, b) => oppScore(b) - oppScore(a))
    : [];
  const toggleMetricKw = (keyword) => {
    setSelectedMetricKws(prev => {
      const next = new Set(prev);
      next.has(keyword) ? next.delete(keyword) : next.add(keyword);
      return next;
    });
  };
  const selectedKwData = sortedMetricsKws.filter(k => selectedMetricKws.has(k.keyword));

  // Fuzzy-match typed industry name against config benchmarks
  const findIndustryData = (name) => {
    if (!name) return {};
    const lower = name.toLowerCase();
    return (config?.industries || []).find(i =>
      i.industry.toLowerCase().includes(lower) || lower.includes(i.industry.toLowerCase())
    ) || {};
  };

  let metricsQuoteOutputs = null;
  if (selectedKwData.length > 0 && metricsIndustry) {
    const kwForScoring = selectedKwData.map(k => ({
      keyword: k.keyword, volume: k.volume || 0, kd: k.keyword_difficulty || 0, cpc: k.cpc || 0,
    }));
    const industryData = findIndustryData(metricsIndustry);
    const mts = calcTierScore({ keywords: kwForScoring, suburbCount: 1, isYMYL: industryData.ymyl || false, areaTypes: {} });
    const mTier = scoreToTier(mts.score);
    const mPricing = config.tiers?.[mTier] || { min: 1599, max: 2099 };
    const mMr = calcMonthlyRevenue({
      volume: mts.avgVolume,
      convRate: industryData.convRate || config.defaultConvRate || 2.5,
      closeRate: industryData.closeRate || 35,
      avgSaleValue: industryData.avgSaleValue || 2000,
    });
    const mRoi = calcROI({ monthlyRevenue: mMr.revenue, retainerMin: mPricing.min, retainerMax: mPricing.max || mPricing.min * 1.5 });
    metricsQuoteOutputs = { ts: mts, tier: mTier, pricing: mPricing, mr: mMr, roi: mRoi };
  }

  // ── Paid Ads helpers ──
  const addPaService = (s) => {
    const t = s.trim();
    if (t && !paServices.includes(t)) setPaServices(prev => [...prev, t]);
    setPaServiceInput('');
  };
  const addPaKeyword = () => {
    const kw = paKwInput.trim();
    const cpc = parseFloat(paCpcInput);
    if (!kw || isNaN(cpc) || cpc <= 0) return;
    if (!paKeywords.find(k => k.keyword === kw)) {
      setPaKeywords(prev => [...prev, { keyword: kw, cpc }]);
    }
    setPaKwInput(''); setPaCpcInput('');
  };
  const removePaKeyword = (kw) => setPaKeywords(prev => prev.filter(k => k.keyword !== kw));

  // ── Paid Ads computation ──
  const paMonthlyBudget = paBudgetMode === 'daily'
    ? parseFloat(paBudget || 0) * 30
    : parseFloat(paBudget || 0);
  const paAdSpend = paMonthlyBudget * 0.75;
  const paMgmtFee = paMonthlyBudget * 0.25;
  const paAvgCpc = paKeywords.length > 0
    ? paKeywords.reduce((s, k) => s + k.cpc, 0) / paKeywords.length
    : 0;
  const paClicks = paAvgCpc > 0 ? paAdSpend / paAvgCpc : 0;
  const paDetailedMode = parseFloat(paAvgProfit) > 0;
  const paReady = paMonthlyBudget > 0 && paAvgCpc > 0 &&
    parseFloat(paCvrLow) > 0 && parseFloat(paCvrMid) > 0 && parseFloat(paCvrHigh) > 0 &&
    parseFloat(paCloseRate) > 0 && parseFloat(paJobValue) > 0;
  const paScenarios = ['Low', 'Mid', 'High'].map((label, i) => {
    const cvr = parseFloat([paCvrLow, paCvrMid, paCvrHigh][i] || 0) / 100;
    const cr = parseFloat(paCloseRate || 0) / 100;
    const leads = paClicks * cvr;
    const jobs = leads * cr;
    const revenue = jobs * parseFloat(paJobValue || 0);
    const costPerLead = leads > 0 ? paAdSpend / leads : 0;
    const costPerJob = jobs > 0 ? paAdSpend / jobs : 0;
    const roas = paAdSpend > 0 && revenue > 0 ? revenue / paAdSpend : 0;
    const profit = paDetailedMode ? jobs * parseFloat(paAvgProfit) - paAdSpend : null;
    return { label, leads, jobs, revenue, costPerLead, costPerJob, roas, profit };
  });

  const step2Active = allKeywords.length > 0;
  const step3Active = !!quoteData;

  if (loading) {
    return <div className="app-loading"><div className="spinner" /></div>;
  }

  return (
    <div className="app">
      {/* Tab bar */}
      <div className="tab-bar">
        <button className={`tab-btn${activeTab === 'metrics' ? ' active' : ''}`} onClick={() => setActiveTab('metrics')}>
          Domain Analysis
        </button>
        <button className={`tab-btn${activeTab === 'quote' ? ' active' : ''}`} onClick={() => setActiveTab('quote')}>
          SEO Quote
        </button>
        <button className={`tab-btn${activeTab === 'paidads' ? ' active' : ''}`} onClick={() => setActiveTab('paidads')}>
          Paid Ads Quote
        </button>
      </div>

      {activeTab === 'metrics' && (
        <div className="page-content">
          <div className="header-card">
            <div className="header-text">
              <h1>Domain Analysis</h1>
              <p>Analyse a client's domain, identify keyword opportunities and estimate ROI</p>
            </div>
          </div>

          {/* ── Step 1: Setup ── */}
          <div className="section-card">
            <div className="section-header">
              <div className="section-num">1</div>
              <div>
                <div className="section-title">Client Setup</div>
                <div className="section-sub">Enter the domain and industry to analyse</div>
              </div>
            </div>
            <div className="two-col">
              <div>
                <div className="col-label">Client Domain</div>
                <div className="col-hint">Website to pull organic keywords from</div>
                <div className="search-input-box">
                  <svg className="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c-2 2.5-2 11.5 0 14M10 3c2 2.5 2 11.5 0 14"/>
                  </svg>
                  <input
                    className="search-input"
                    placeholder="e.g. melbourneplumber.com.au"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchMetrics()}
                  />
                </div>
              </div>
              <div>
                <div className="col-label">Target Service</div>
                <div className="col-hint">Used to estimate revenue &amp; ROI</div>
                <div className="search-input-box">
                  <svg className="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="9" r="6"/><path d="M15 15l-3-3"/>
                  </svg>
                  <input
                    className="search-input"
                    placeholder="e.g. Plumbing Services, Roofer, Dentist"
                    value={metricsIndustry}
                    onChange={e => setMetricsIndustry(e.target.value)}
                  />
                </div>
                <div className="input-hint">Type any service — benchmarks auto-matched where possible</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button className="regen-btn" onClick={fetchMetrics} disabled={!domain.trim() || metricsLoading}>
                {metricsLoading ? <><span className="btn-spinner" /> Pulling data...</> : <>⚡ Analyse Domain</>}
              </button>
            </div>
            {metricsError && <div className="metrics-error">{metricsError}</div>}
          </div>

          {/* ── Step 2: Keywords ── */}
          {sortedMetricsKws.length > 0 && (
            <div className="section-card">
              <div className="section-header">
                <div className="section-num">2</div>
                <div style={{ flex: 1 }}>
                  <div className="section-title">Keyword Opportunities</div>
                  <div className="section-sub">{domain} · sorted by opportunity score (high volume, low difficulty)</div>
                </div>
                {selectedMetricKws.size > 0
                  ? <div className="active-badge">{selectedMetricKws.size} selected</div>
                  : <div className="active-badge">{sortedMetricsKws.length} keywords</div>
                }
              </div>
              <p className="keywords-instruction">
                <strong>Click keywords to select them</strong> — selected keywords will drive the ROI estimate below.
              </p>
              <div className="kw-table-wrap">
                <table className="kw-table">
                  <thead>
                    <tr>
                      <th>Keyword</th>
                      <th className="num-col">Opp ↓</th>
                      <th className="num-col">Pos</th>
                      <th className="num-col">Volume</th>
                      <th className="num-col">KD</th>
                      <th className="num-col">CPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMetricsKws.map((kw, i) => {
                      const selected = selectedMetricKws.has(kw.keyword);
                      return (
                        <tr key={i} className={`kw-row-selectable${selected ? ' kw-row-selected' : ''}`} onClick={() => toggleMetricKw(kw.keyword)}>
                          <td className="kw-cell">
                            <span className={`kw-select-dot${selected ? ' kw-select-dot-on' : ''}`} />
                            {kw.keyword}
                          </td>
                          <td className="num-col"><span className="opp-score">{oppScore(kw).toLocaleString()}</span></td>
                          <td className="num-col"><span className={`pos-badge ${kw.best_position <= 3 ? 'pos-top3' : kw.best_position <= 10 ? 'pos-top10' : 'pos-other'}`}>{kw.best_position}</span></td>
                          <td className="num-col">{(kw.volume || 0).toLocaleString()}</td>
                          <td className="num-col">{kw.keyword_difficulty ?? '—'}</td>
                          <td className="num-col">{kw.cpc ? '$' + (kw.cpc / 100).toFixed(2) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Step 3: ROI Estimate ── */}
          {metricsQuoteOutputs && (() => {
            const { ts, tier, pricing, mr, roi } = metricsQuoteOutputs;
            const maxPrice = pricing.max || Math.round(pricing.min * 1.5);
            return (
              <div className="quote-card">
                <div className="quote-header">
                  <div className="section-num-light">3</div>
                  <div style={{ flex: 1 }}>
                    <div className="quote-title">ROI Estimate</div>
                    <div className="quote-sub">{selectedMetricKws.size} keyword{selectedMetricKws.size !== 1 ? 's' : ''} selected · {metricsIndustry} · {domain}</div>
                  </div>
                  <div className="check-circle">✓</div>
                </div>
                <div className="quote-metrics">
                  <div className="metric-card">
                    <div className="metric-icon-circle">◎</div>
                    <div className="metric-label">RECOMMENDED PACKAGE</div>
                    <div className="metric-value tier-val">{tier}</div>
                    <div className="metric-sub">Score: {ts.score}/100</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-icon-dollar">$</div>
                    <div className="metric-label">MONTHLY INVESTMENT</div>
                    <div className="metric-value price-val">{fmtAUD(pricing.min)}–<br />{fmtAUD(maxPrice)}</div>
                    <div className="metric-sub">per month</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-trend">↗</div>
                    <div className="metric-label">EST. MONTHLY REVENUE</div>
                    <div className="metric-value revenue-val">{fmtAUD(mr.revenue)}</div>
                    <div className="metric-sub">{selectedMetricKws.size} keyword{selectedMetricKws.size !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-trend">↗</div>
                    <div className="metric-label">ESTIMATED ROI</div>
                    <div className="metric-value roi-val">{Math.round(roi.roi)}%</div>
                    <div className="metric-sub roi-range">✓ Target range: 200–400%</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {sortedMetricsKws.length > 0 && selectedMetricKws.size > 0 && !metricsIndustry && (
            <div className="metrics-error" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
              Select an industry above to see the ROI estimate
            </div>
          )}
        </div>
      )}

      {activeTab === 'quote' && (
        <div className="page-content">

          {/* ── Header ── */}
          <div className="header-card">
            <div className="header-text">
              <h1>SEO Quote Generator</h1>
              <p>Generate a package recommendation and ROI estimate for your client</p>
            </div>
            <div className="step-track">
              <div className="step-node active">
                <div className="step-circle">1</div>
                <span>Client<br />Details</span>
              </div>
              <div className="step-line" />
              <div className={`step-node${step2Active ? ' active' : ''}`}>
                <div className="step-circle">2</div>
                <span>Keywords</span>
              </div>
              <div className="step-line" />
              <div className={`step-node${step3Active ? ' active' : ''}`}>
                <div className="step-circle">3</div>
                <span>Quote</span>
              </div>
            </div>
          </div>

          {/* ── Step 1: Client Details ── */}
          <div className="section-card">
            <div className="section-header">
              <div className="section-num">1</div>
              <div>
                <div className="section-title">Client Details</div>
                <div className="section-sub">What does the client do, and where?</div>
              </div>
            </div>

            <div className="two-col">
              {/* Services */}
              <div className="input-col">
                <div className="col-label">Target Services</div>
                <div className="col-hint">What services does the client want to rank for on Google?</div>
                <div className="chip-list">
                  {services.map(s => (
                    <span key={s} className="chip chip-service">
                      {s} <button onClick={() => removeService(s)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="search-input-box">
                  <svg className="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="9" r="6" /><path d="M15 15l-3-3" />
                  </svg>
                  <input
                    className="search-input"
                    placeholder="e.g. Plumbing Services — press Enter to add"
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addService(serviceSearch); } }}
                    onBlur={() => { if (serviceSearch.trim()) addService(serviceSearch); }}
                  />
                </div>
                <div className="input-hint">Type any service name and press Enter to add</div>
              </div>

              {/* Locations */}
              <div className="input-col">
                <div className="col-label">Target Locations</div>
                <div className="col-hint">Which cities or suburbs should they appear in?</div>
                <div className="chip-list">
                  {locations.map(l => (
                    <span key={l} className="chip chip-location">
                      {l} <button onClick={() => removeLocation(l)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="search-wrap">
                  <div className="search-input-box">
                    <svg className="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="9" r="6" /><path d="M15 15l-3-3" />
                    </svg>
                    <input
                      className="search-input"
                      placeholder="Search or type any location..."
                      value={locationSearch}
                      onChange={e => { setLocationSearch(e.target.value); setShowLocationDrop(true); }}
                      onFocus={() => setShowLocationDrop(true)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (locationSearch.trim()) { addLocation(locationSearch.trim()); } } }}
                      onBlur={() => { setTimeout(() => setShowLocationDrop(false), 150); if (locationSearch.trim()) addLocation(locationSearch.trim()); }}
                    />
                  </div>
                  {showLocationDrop && locationOptions.length > 0 && (
                    <div className="dropdown">
                      {locationOptions.map(l => (
                        <div key={l.name} className="dropdown-item" onMouseDown={() => addLocation(l.name)}>
                          {l.name}
                          <span className="dropdown-region">{l.region}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="input-hint">Search the list or type any location and click away to add</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Step 2: Keyword Pairs ── */}
          {step2Active && (
            <div className="section-card">
              <div className="section-header">
                <div className="section-num">2</div>
                <div style={{ flex: 1 }}>
                  <div className="section-title">Keyword Pairs</div>
                  <div className="section-sub">Review and remove any that aren't relevant</div>
                </div>
                <div className="active-badge">{activeKeywords.length} of {allKeywords.length} active</div>
              </div>
              <p className="keywords-instruction">
                These are the search terms we'll optimise for.{' '}
                <strong>Click any keyword to remove it</strong> from the quote if it's not relevant.
              </p>
              <div className="keyword-chips">
                {allKeywords.map(k => (
                  <span
                    key={k}
                    className={`chip chip-keyword${removedKeywords.has(k) ? ' removed' : ''}`}
                    onClick={() => toggleKeyword(k)}
                  >
                    {k}{!removedKeywords.has(k) && <span className="chip-x">×</span>}
                  </span>
                ))}
              </div>
              <button className="regen-btn" onClick={generateQuote} disabled={activeKeywords.length === 0 || quoteLoading}>
                {quoteLoading ? (
                  <><span className="btn-spinner" /> Generating...</>
                ) : (
                  <>⚡ Regenerate Quote</>
                )}
              </button>
            </div>
          )}

          {/* ── Step 3: Quote ── */}
          {quoteData && quoteOutputs && (() => {
            const { ts, tier, pricing, mr, roi } = quoteOutputs;
            const maxPrice = pricing.max || Math.round(pricing.min * 1.5);
            const areaTypes = quoteData.areaTypes || {};
            const areaEntries = Object.entries(areaTypes);
            const metroCount = areaEntries.filter(([, v]) => v === 'Metro').length;
            const regionalCount = areaEntries.length - metroCount;
            return (
              <div className="quote-card">
                <div className="quote-header">
                  <div className="section-num-light">3</div>
                  <div style={{ flex: 1 }}>
                    <div className="quote-title">Quote &amp; ROI Estimate</div>
                    <div className="quote-sub">
                      {activeKeywords.length} keyword{activeKeywords.length !== 1 ? 's' : ''} · {services.join(', ')} · {locations.join(', ')}
                    </div>
                  </div>
                  <div className="check-circle">✓</div>
                </div>

                <div className="quote-metrics">
                  <div className="metric-card">
                    <div className="metric-icon-circle">◎</div>
                    <div className="metric-label">RECOMMENDED PACKAGE</div>
                    <div className="metric-value tier-val">{tier}</div>
                    <div className="metric-sub">Score: {ts.score}/100</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-icon-dollar">$</div>
                    <div className="metric-label">MONTHLY INVESTMENT</div>
                    <div className="metric-value price-val">
                      {fmtAUD(pricing.min)}–<br />{fmtAUD(maxPrice)}
                    </div>
                    <div className="metric-sub">per month</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-trend">↗</div>
                    <div className="metric-label">EST. MONTHLY REVENUE</div>
                    <div className="metric-value revenue-val">{fmtAUD(mr.revenue)}</div>
                    <div className="metric-sub">{activeKeywords.length} keyword{activeKeywords.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-trend">↗</div>
                    <div className="metric-label">ESTIMATED ROI</div>
                    <div className="metric-value roi-val">{Math.round(roi.roi)}%</div>
                    <div className="metric-sub roi-range">✓ Target range: 200–400%</div>
                  </div>
                </div>

                {areaEntries.length > 0 && (
                  <div className="quote-detail-row">
                    <span className="detail-label">Area type:</span>
                    {metroCount > 0 && <span className="detail-badge detail-metro">{metroCount} Metro</span>}
                    {regionalCount > 0 && <span className="detail-badge detail-regional">{regionalCount} Regional</span>}
                    {quoteData.ymyl?.isYMYL && <span className="detail-badge detail-ymyl">YMYL</span>}
                    <span className="detail-sep">·</span>
                    <span className="detail-label">Avg volume:</span>
                    <span className="detail-val">{Math.round(ts.avgVolume).toLocaleString()}/mo</span>
                    <span className="detail-sep">·</span>
                    <span className="detail-label">Avg KD:</span>
                    <span className="detail-val">{Math.round(ts.avgKD)}</span>
                  </div>
                )}

                {quoteData.keywords?.length > 0 && (
                  <div className="kw-table-wrap kw-table-quote">
                    <table className="kw-table">
                      <thead>
                        <tr>
                          <th>Keyword</th>
                          <th className="num-col">Volume</th>
                          <th className="num-col">KD</th>
                          <th className="num-col">CPC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quoteData.keywords.map((kw, i) => (
                          <tr key={i} className={removedKeywords.has(kw.keyword) ? 'kw-row-removed' : ''}>
                            <td className="kw-cell">{kw.keyword}</td>
                            <td className="num-col">{(kw.volume || 0).toLocaleString()}</td>
                            <td className="num-col">{kw.kd ?? '—'}</td>
                            <td className="num-col">{kw.cpc ? '$' + (kw.cpc / 100).toFixed(2) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {quoteData.demoMode && (
                  <div className="demo-banner">
                    ⚠️ Demo mode — add your n8n webhook URL in Vercel environment variables for real keyword data
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {/* ── Paid Ads Tab ── */}
      {activeTab === 'paidads' && (
        <div className="page-content">
          <div className="header-card">
            <div className="header-text">
              <h1>Paid Ads Quote</h1>
              <p>Build a Google Ads proposal with projected leads, jobs and ROI for your client</p>
            </div>
          </div>

          {/* ── Step 1: Business Insights ── */}
          <div className="section-card">
            <div className="section-header">
              <div className="section-num">1</div>
              <div>
                <div className="section-title">Business Insights</div>
                <div className="section-sub">Client details and context — the more captured here, the stronger the campaign</div>
              </div>
            </div>

            <div className="pa-form-grid">
              <div className="pa-field">
                <div className="col-label">Business Name</div>
                <input className="pa-input" placeholder="e.g. Sydney Plumbing Co" value={paBusinessName} onChange={e => setPaBusinessName(e.target.value)} />
              </div>
              <div className="pa-field">
                <div className="col-label">Owner Name</div>
                <input className="pa-input" placeholder="e.g. John Smith" value={paOwnerName} onChange={e => setPaOwnerName(e.target.value)} />
              </div>
              <div className="pa-field">
                <div className="col-label">Phone</div>
                <input className="pa-input" placeholder="e.g. 0400 000 000" value={paPhone} onChange={e => setPaPhone(e.target.value)} />
              </div>
              <div className="pa-field">
                <div className="col-label">Email</div>
                <input className="pa-input" placeholder="e.g. john@business.com.au" value={paEmail} onChange={e => setPaEmail(e.target.value)} />
              </div>
              <div className="pa-field">
                <div className="col-label">Industry</div>
                <input className="pa-input" placeholder="e.g. Plumbing, Electrical, Dental" value={paIndustry} onChange={e => setPaIndustry(e.target.value)} />
              </div>
              <div className="pa-field">
                <div className="col-label">Location</div>
                <input className="pa-input" placeholder="e.g. Sydney NSW" value={paLocation} onChange={e => setPaLocation(e.target.value)} />
              </div>
            </div>

            <div className="pa-field" style={{ marginTop: '1rem' }}>
              <div className="col-label">Top Services</div>
              <div className="chip-list">
                {paServices.map(s => (
                  <span key={s} className="chip chip-service">
                    {s} <button onClick={() => setPaServices(prev => prev.filter(x => x !== s))}>×</button>
                  </span>
                ))}
              </div>
              <div className="search-input-box">
                <input
                  className="search-input"
                  placeholder="e.g. Emergency Plumbing — press Enter to add"
                  value={paServiceInput}
                  onChange={e => setPaServiceInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addPaService(paServiceInput); } }}
                  onBlur={() => { if (paServiceInput.trim()) addPaService(paServiceInput); }}
                />
              </div>
            </div>

            <div className="pa-field" style={{ marginTop: '1rem' }}>
              <div className="col-label">Service Areas</div>
              <input className="pa-input" placeholder="e.g. Sydney CBD, Inner West, North Shore" value={paServiceAreas} onChange={e => setPaServiceAreas(e.target.value)} />
            </div>

            <button className="pa-optional-toggle" onClick={() => setPaShowOptional(v => !v)}>
              {paShowOptional ? '▲ Hide' : '▼ Show'} optional fields (goals, challenges, promotions, USPs)
            </button>

            {paShowOptional && (
              <div className="pa-form-grid" style={{ marginTop: '1rem' }}>
                <div className="pa-field">
                  <div className="col-label">Goals</div>
                  <textarea className="pa-textarea" placeholder="What does the client want to achieve?" value={paGoals} onChange={e => setPaGoals(e.target.value)} />
                </div>
                <div className="pa-field">
                  <div className="col-label">Challenges / Blockers</div>
                  <textarea className="pa-textarea" placeholder="Current pain points or blockers" value={paChallenges} onChange={e => setPaChallenges(e.target.value)} />
                </div>
                <div className="pa-field">
                  <div className="col-label">Promotions</div>
                  <textarea className="pa-textarea" placeholder="Any offers or seasonal promotions" value={paPromotions} onChange={e => setPaPromotions(e.target.value)} />
                </div>
                <div className="pa-field">
                  <div className="col-label">USPs</div>
                  <textarea className="pa-textarea" placeholder="What makes this business stand out?" value={paUSPs} onChange={e => setPaUSPs(e.target.value)} />
                </div>
                <div className="pa-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="col-label">Additional Notes</div>
                  <textarea className="pa-textarea" placeholder="Anything else the strategist should know" value={paNotes} onChange={e => setPaNotes(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* ── Step 2: Campaign Numbers ── */}
          <div className="section-card">
            <div className="section-header">
              <div className="section-num">2</div>
              <div>
                <div className="section-title">Campaign Numbers</div>
                <div className="section-sub">Budget, keywords and conversion assumptions — all fields required to generate output</div>
              </div>
            </div>

            {/* Budget */}
            <div className="pa-field">
              <div className="col-label">Monthly Ad Budget (total package)</div>
              <div className="pa-budget-row">
                <div className="pa-budget-toggle">
                  <button className={paBudgetMode === 'monthly' ? 'active' : ''} onClick={() => setPaBudgetMode('monthly')}>Monthly</button>
                  <button className={paBudgetMode === 'daily' ? 'active' : ''} onClick={() => setPaBudgetMode('daily')}>Daily</button>
                </div>
                <div className="pa-prefix-input">
                  <span className="pa-prefix">$</span>
                  <input
                    className="pa-input pa-input-num"
                    type="number"
                    min="0"
                    placeholder={paBudgetMode === 'daily' ? 'e.g. 50' : 'e.g. 1500'}
                    value={paBudget}
                    onChange={e => setPaBudget(e.target.value)}
                  />
                </div>
              </div>
              {paMonthlyBudget > 0 && (
                <div className="pa-split-bar">
                  <div className="pa-split-seg pa-split-spend" style={{ width: '75%' }}>
                    Ad Spend 75% — {fmtAUD(paAdSpend)}/mo
                  </div>
                  <div className="pa-split-seg pa-split-fee" style={{ width: '25%' }}>
                    Mgmt 25% — {fmtAUD(paMgmtFee)}/mo
                  </div>
                </div>
              )}
            </div>

            {/* Keywords + CPC */}
            <div className="pa-field" style={{ marginTop: '1.25rem' }}>
              <div className="col-label">Keywords &amp; CPC</div>
              <div className="col-hint">Enter each keyword you plan to target and its estimated CPC (from Google Keyword Planner)</div>
              {paKeywords.length > 0 && (
                <div className="kw-table-wrap" style={{ marginBottom: '0.75rem' }}>
                  <table className="kw-table">
                    <thead>
                      <tr>
                        <th>Keyword</th>
                        <th className="num-col">CPC</th>
                        <th className="num-col"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paKeywords.map((k, i) => (
                        <tr key={i}>
                          <td className="kw-cell">{k.keyword}</td>
                          <td className="num-col">${k.cpc.toFixed(2)}</td>
                          <td className="num-col">
                            <button className="pa-kw-remove" onClick={() => removePaKeyword(k.keyword)}>×</button>
                          </td>
                        </tr>
                      ))}
                      {paKeywords.length > 1 && (
                        <tr style={{ borderTop: '2px solid #f1f5f9' }}>
                          <td className="kw-cell" style={{ color: '#64748b', fontSize: '0.8rem' }}>Avg CPC</td>
                          <td className="num-col" style={{ fontWeight: 700 }}>${paAvgCpc.toFixed(2)}</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="pa-kw-add-row">
                <input
                  className="pa-input pa-kw-input"
                  placeholder="Keyword"
                  value={paKwInput}
                  onChange={e => setPaKwInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPaKeyword()}
                />
                <div className="pa-prefix-input">
                  <span className="pa-prefix">$</span>
                  <input
                    className="pa-input pa-input-num"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="CPC"
                    value={paCpcInput}
                    onChange={e => setPaCpcInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPaKeyword()}
                  />
                </div>
                <button className="regen-btn pa-add-btn" onClick={addPaKeyword}>Add</button>
              </div>
            </div>

            {/* CVR + Close Rate + Job Value */}
            <div className="pa-form-grid pa-form-grid-3" style={{ marginTop: '1.25rem' }}>
              <div className="pa-field">
                <div className="col-label">CVR — Low %</div>
                <div className="col-hint">Conservative conversion rate</div>
                <div className="pa-prefix-input">
                  <input className="pa-input pa-input-num" type="number" min="0" max="100" placeholder="e.g. 5" value={paCvrLow} onChange={e => setPaCvrLow(e.target.value)} />
                  <span className="pa-suffix">%</span>
                </div>
              </div>
              <div className="pa-field">
                <div className="col-label">CVR — Mid %</div>
                <div className="col-hint">Expected conversion rate</div>
                <div className="pa-prefix-input">
                  <input className="pa-input pa-input-num" type="number" min="0" max="100" placeholder="e.g. 10" value={paCvrMid} onChange={e => setPaCvrMid(e.target.value)} />
                  <span className="pa-suffix">%</span>
                </div>
              </div>
              <div className="pa-field">
                <div className="col-label">CVR — High %</div>
                <div className="col-hint">Optimistic conversion rate</div>
                <div className="pa-prefix-input">
                  <input className="pa-input pa-input-num" type="number" min="0" max="100" placeholder="e.g. 15" value={paCvrHigh} onChange={e => setPaCvrHigh(e.target.value)} />
                  <span className="pa-suffix">%</span>
                </div>
              </div>
            </div>

            <div className="pa-form-grid" style={{ marginTop: '1rem' }}>
              <div className="pa-field">
                <div className="col-label">Close Rate %</div>
                <div className="col-hint">Lead to booked job conversion</div>
                <div className="pa-prefix-input">
                  <input className="pa-input pa-input-num" type="number" min="0" max="100" placeholder="e.g. 30" value={paCloseRate} onChange={e => setPaCloseRate(e.target.value)} />
                  <span className="pa-suffix">%</span>
                </div>
              </div>
              <div className="pa-field">
                <div className="col-label">Avg Job Value</div>
                <div className="col-hint">Revenue per booked job</div>
                <div className="pa-prefix-input">
                  <span className="pa-prefix">$</span>
                  <input className="pa-input pa-input-num" type="number" min="0" placeholder="e.g. 800" value={paJobValue} onChange={e => setPaJobValue(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="pa-field" style={{ marginTop: '1rem' }}>
              <div className="col-label">Avg Profit per Job <span className="pa-optional-label">optional — unlocks detailed output</span></div>
              <div className="pa-prefix-input" style={{ maxWidth: '200px' }}>
                <span className="pa-prefix">$</span>
                <input className="pa-input pa-input-num" type="number" min="0" placeholder="e.g. 300" value={paAvgProfit} onChange={e => setPaAvgProfit(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Step 3: Output ── */}
          {paReady && (
            <div className="quote-card">
              <div className="quote-header">
                <div className="section-num-light">3</div>
                <div style={{ flex: 1 }}>
                  <div className="quote-title">Campaign Projection</div>
                  <div className="quote-sub">
                    {fmtAUD(paMonthlyBudget)}/mo total · {fmtAUD(paAdSpend)} ad spend · {fmtAUD(paMgmtFee)} mgmt fee
                    {paKeywords.length > 0 && ` · ${paKeywords.length} keyword${paKeywords.length !== 1 ? 's' : ''} · avg CPC $${paAvgCpc.toFixed(2)}`}
                  </div>
                </div>
                <div className="check-circle">✓</div>
              </div>

              {/* Budget split visual */}
              <div className="pa-split-bar pa-split-bar-output">
                <div className="pa-split-seg pa-split-spend" style={{ width: '75%' }}>Ad Spend — {fmtAUD(paAdSpend)}</div>
                <div className="pa-split-seg pa-split-fee" style={{ width: '25%' }}>Mgmt — {fmtAUD(paMgmtFee)}</div>
              </div>

              {/* Scenario table */}
              <div className="kw-table-wrap" style={{ marginTop: '1rem' }}>
                <table className="kw-table">
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th className="num-col">Est. Clicks</th>
                      <th className="num-col">Est. Leads</th>
                      <th className="num-col">Est. Jobs</th>
                      <th className="num-col">Cost/Lead</th>
                      <th className="num-col">Cost/Job</th>
                      {paDetailedMode && <th className="num-col">Revenue</th>}
                      {paDetailedMode && <th className="num-col">ROAS</th>}
                      {paDetailedMode && <th className="num-col">Profit</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paScenarios.map(s => (
                      <tr key={s.label} className={`pa-scenario-row pa-scenario-${s.label.toLowerCase()}`}>
                        <td><span className={`pa-scenario-badge pa-scenario-badge-${s.label.toLowerCase()}`}>{s.label}</span></td>
                        <td className="num-col">{Math.round(paClicks).toLocaleString()}</td>
                        <td className="num-col">{Math.round(s.leads).toLocaleString()}</td>
                        <td className="num-col">{s.jobs.toFixed(1)}</td>
                        <td className="num-col">{fmtAUD(s.costPerLead)}</td>
                        <td className="num-col">{fmtAUD(s.costPerJob)}</td>
                        {paDetailedMode && <td className="num-col">{fmtAUD(s.revenue)}</td>}
                        {paDetailedMode && <td className="num-col">{s.roas > 0 ? s.roas.toFixed(1) + 'x' : '—'}</td>}
                        {paDetailedMode && <td className="num-col" style={{ color: s.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmtAUD(s.profit)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pa-output-note">
                Projections based on {fmtAUD(paAdSpend)}/mo ad spend ÷ ${paAvgCpc.toFixed(2)} avg CPC = ~{Math.round(paClicks).toLocaleString()} clicks/mo.
                Leads = clicks × CVR. Jobs = leads × {paCloseRate}% close rate.
                {paDetailedMode && ' Revenue and profit use avg job value and profit figures entered above.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
