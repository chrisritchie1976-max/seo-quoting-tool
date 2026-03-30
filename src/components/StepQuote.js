import React from 'react';
import { calcTierScore, scoreToTier, calcMonthlyRevenue, calcROI } from '../utils/scoring';

function fmtAUD(val) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return '$' + Math.round(val).toLocaleString('en-AU');
}

function fmtNum(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Math.round(val).toLocaleString('en-AU');
}

function fmtROI(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Math.round(val).toLocaleString('en-AU') + '%';
}

export default function StepQuote({ services, suburbs, quoteData, config, onBack, onReset }) {
  if (!quoteData || !quoteData.keywords) {
    return (
      <div className="card">
        <p style={{ color: '#94a3b8' }}>No quote data available. Please go back and generate a quote.</p>
        <div className="btn-actions">
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        </div>
      </div>
    );
  }

  const { keywords, areaTypes, ymyl, benchmarks } = quoteData;

  // 1. Tier score
  const tierScore = calcTierScore({
    keywords,
    suburbCount: suburbs.length,
    isYMYL: ymyl?.isYMYL || false,
  });

  // 2. Tier
  const tier = scoreToTier(tierScore.score);

  // 3. Pricing
  const tierPricing = config?.tiers?.[tier] || { min: 499, max: 999, cost: 250 };
  const retainerMax = tierPricing.max !== null ? tierPricing.max : tierPricing.min * 1.5;

  // 4. Monthly revenue
  const monthlyRev = calcMonthlyRevenue({
    volume:       tierScore.avgVolume,
    convRate:     benchmarks?.convRate     || config?.defaultConvRate || 2.5,
    closeRate:    benchmarks?.closeRate    || 35,
    avgSaleValue: benchmarks?.avgSaleValue || 2000,
  });

  // 5. ROI
  const roi = calcROI({
    monthlyRevenue: monthlyRev.revenue,
    retainerMin:    tierPricing.min,
    retainerMax,
  });

  const isDemoMode = !process.env.REACT_APP_N8N_WEBHOOK_URL;

  return (
    <div>
      {isDemoMode && (
        <div className="banner banner-info">
          <span>ℹ</span>
          <span>
            <strong>Demo mode</strong> — figures below use mock keyword data.
            Connect n8n for real Ahrefs data.
          </span>
        </div>
      )}

      {/* Tier & Price */}
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Recommended Package
        </p>
        <div className={`tier-badge tier-${tier}`}>{tier}</div>

        <div className="price-range" style={{ marginTop: '1rem' }}>
          AUD {fmtAUD(tierPricing.min)} – {fmtAUD(retainerMax)}
        </div>
        <div className="price-label">per month (retainer)</div>

        {/* Tier score bar */}
        <div style={{ maxWidth: 320, margin: '0 auto', marginBottom: '0.5rem' }}>
          <div className="tier-score-bar-wrap">
            <div className="tier-score-bar" style={{ width: `${tierScore.score}%` }} />
          </div>
          <div className="score-label">Complexity score: {tierScore.score}/100</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="card">
        <div className="section-title">Key Metrics</div>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{fmtNum(tierScore.avgVolume)}</div>
            <div className="metric-label">Avg Monthly Search Volume</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{Math.round(tierScore.avgKD)}/100</div>
            <div className="metric-label">Avg Keyword Difficulty</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{suburbs.length}</div>
            <div className="metric-label">Suburbs Targeted</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{keywords.length}</div>
            <div className="metric-label">Keywords Analysed</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{ymyl?.isYMYL ? 'Yes' : 'No'}</div>
            <div className="metric-label">YMYL Industry</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{benchmarks?.industry || services[0] || '—'}</div>
            <div className="metric-label">Primary Industry</div>
          </div>
        </div>
      </div>

      {/* ROI Projection */}
      <div className="card">
        <div className="section-title">ROI Projection</div>
        <div className="roi-grid">
          <div className="roi-card">
            <div className="roi-value">{fmtAUD(monthlyRev.revenue)}</div>
            <div className="roi-label">Est. Monthly Revenue</div>
          </div>
          <div className="roi-card">
            <div className="roi-value">{fmtAUD(roi.annualRevenue)}</div>
            <div className="roi-label">Est. Annual Revenue</div>
          </div>
          <div className="roi-card">
            <div className="roi-value">{fmtAUD(roi.annualCost)}</div>
            <div className="roi-label">Annual Retainer Cost</div>
          </div>
          <div className="roi-card">
            <div className="roi-value" style={{ color: roi.roi >= 0 ? '#22c55e' : '#f87171' }}>
              {fmtROI(roi.roi)}
            </div>
            <div className="roi-label">Projected ROI</div>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.5rem' }}>
          Based on avg. {benchmarks?.convRate || config?.defaultConvRate}% conversion rate,{' '}
          {benchmarks?.closeRate || 35}% close rate,{' '}
          {fmtAUD(benchmarks?.avgSaleValue || 2000)} avg. sale value.
        </div>
      </div>

      {/* Keyword Data Table */}
      <div className="card">
        <div className="section-title">Keyword Data</div>
        <div className="keywords-table-wrapper">
          <table className="keywords-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Volume</th>
                <th>KD</th>
                <th>CPC ($/click)</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw, i) => (
                <tr key={i}>
                  <td>{kw.keyword}</td>
                  <td>{fmtNum(kw.volume)}</td>
                  <td>{kw.kd !== undefined ? `${Math.round(kw.kd)}/100` : '—'}</td>
                  <td>
                    {kw.cpc !== undefined
                      ? `$${(kw.cpc / 100).toFixed(2)}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Area Classification */}
      {areaTypes && Object.keys(areaTypes).length > 0 && (
        <div className="card">
          <div className="section-title">Area Classification</div>
          <div className="keywords-table-wrapper">
            <table className="keywords-table">
              <thead>
                <tr>
                  <th>Suburb</th>
                  <th>Classification</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(areaTypes).map(([suburb, type]) => (
                  <tr key={suburb}>
                    <td>{suburb}</td>
                    <td>{type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* YMYL note */}
      {ymyl?.reason && (
        <div className="banner banner-info" style={{ marginTop: '1rem' }}>
          <span>ℹ</span>
          <span><strong>YMYL:</strong> {ymyl.reason}</span>
        </div>
      )}

      <div className="btn-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Adjust
        </button>
        <button className="btn btn-danger" onClick={onReset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
