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
  const [showServiceDrop, setShowServiceDrop] = useState(false);
  const [showLocationDrop, setShowLocationDrop] = useState(false);

  const [removedKeywords, setRemovedKeywords] = useState(new Set());
  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

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

  const industryList = (config?.industries || []).map(i => i.industry);

  const serviceOptions = industryList
    .filter(s => s.toLowerCase().includes(serviceSearch.toLowerCase()) && !services.includes(s))
    .slice(0, 8);

  const locationOptions = ALL_LOCATIONS
    .filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase()) && !locations.includes(l.name))
    .slice(0, 8);

  const addService = (s) => { setServices(prev => [...prev, s]); setServiceSearch(''); setShowServiceDrop(false); };
  const addLocation = (l) => { setLocations(prev => [...prev, l]); setLocationSearch(''); setShowLocationDrop(false); };
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
      const industryData = config.industries.find(i => i.industry === services[0]) || {};
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

  // Compute quote outputs
  let quoteOutputs = null;
  if (quoteData) {
    const ts = calcTierScore({
      keywords: quoteData.keywords || [],
      suburbCount: locations.length,
      isYMYL: quoteData.ymyl?.isYMYL || false,
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
          Metrics Report
        </button>
        <button className={`tab-btn${activeTab === 'quote' ? ' active' : ''}`} onClick={() => setActiveTab('quote')}>
          Sales Quote
        </button>
      </div>

      {activeTab === 'metrics' && (
        <div className="page-content">
          <div className="header-card">
            <div className="header-text">
              <h1>Metrics Report</h1>
              <p>Connect Google Search Console to view performance data.</p>
            </div>
          </div>
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
                <div className="search-wrap">
                  <div className="search-input-box">
                    <svg className="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="9" r="6" /><path d="M15 15l-3-3" />
                    </svg>
                    <input
                      className="search-input"
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={e => { setServiceSearch(e.target.value); setShowServiceDrop(true); }}
                      onFocus={() => setShowServiceDrop(true)}
                      onBlur={() => setTimeout(() => setShowServiceDrop(false), 150)}
                    />
                  </div>
                  {showServiceDrop && serviceOptions.length > 0 && (
                    <div className="dropdown">
                      {serviceOptions.map(s => (
                        <div key={s} className="dropdown-item" onMouseDown={() => addService(s)}>{s}</div>
                      ))}
                    </div>
                  )}
                  <div className="input-hint">Search and select from the list</div>
                </div>
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
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={e => { setLocationSearch(e.target.value); setShowLocationDrop(true); }}
                      onFocus={() => setShowLocationDrop(true)}
                      onBlur={() => setTimeout(() => setShowLocationDrop(false), 150)}
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
                  <div className="input-hint">Search and select from the list</div>
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
            const { tier, pricing, mr, roi } = quoteOutputs;
            const maxPrice = pricing.max || Math.round(pricing.min * 1.5);
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
    </div>
  );
}
