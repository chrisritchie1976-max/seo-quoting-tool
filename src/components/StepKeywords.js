import React, { useState, useEffect } from 'react';

function generateMockData(services, suburbs, keywords) {
  const mockKeywords = keywords.map((kw) => ({
    keyword: kw,
    volume: Math.floor(Math.random() * (3000 - 800 + 1)) + 800,
    kd: Math.floor(Math.random() * (55 - 20 + 1)) + 20,
    cpc: Math.floor(Math.random() * (2000 - 100 + 1)) + 100,
  }));

  const areaTypes = {};
  suburbs.forEach((s) => { areaTypes[s] = 'Metro'; });

  return {
    keywords: mockKeywords,
    areaTypes,
    ymyl: { isYMYL: false, reason: 'Demo mode' },
    benchmarks: {
      industry: services[0] || 'General',
      closeRate: 35,
      avgSaleValue: 2500,
      convRate: 3.0,
    },
  };
}

export default function StepKeywords({ services, suburbs, onNext, onBack, config }) {
  const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL;
  const isDemoMode = !webhookUrl;

  // Generate keyword pairs: service × suburb
  const allPairs = [];
  services.forEach((service) => {
    suburbs.forEach((suburb) => {
      allPairs.push(`${service} ${suburb}`);
    });
  });

  const [checked, setChecked] = useState(() => {
    const init = {};
    allPairs.forEach((kw) => { init[kw] = true; });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Re-sync checked state when pairs change (e.g. if navigating back/forward)
  useEffect(() => {
    setChecked((prev) => {
      const next = {};
      allPairs.forEach((kw) => {
        next[kw] = kw in prev ? prev[kw] : true;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.join(','), suburbs.join(',')]);

  const toggleAll = (val) => {
    const next = {};
    allPairs.forEach((kw) => { next[kw] = val; });
    setChecked(next);
  };

  const checkedKeywords = allPairs.filter((kw) => checked[kw]);

  const handleGenerate = async () => {
    if (checkedKeywords.length === 0) return;

    if (isDemoMode) {
      const mockData = generateMockData(services, suburbs, checkedKeywords);
      onNext(mockData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services,
          suburbs,
          keywords: checkedKeywords,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}`);
      }

      const data = await response.json();
      onNext(data);
    } catch (err) {
      setError(`Failed to fetch keyword data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading-state">
          <div className="spinner" />
          <p>Fetching keyword data from n8n...</p>
          <p style={{ fontSize: '0.8rem', color: '#475569' }}>This may take a few seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {isDemoMode && (
        <div className="banner banner-warning">
          <span>⚠</span>
          <span>
            <strong>Demo mode</strong> — configure <code>REACT_APP_N8N_WEBHOOK_URL</code> for real keyword data.
            Mock data will be used to generate the quote.
          </span>
        </div>
      )}

      {error && (
        <div className="banner banner-warning">
          <span>✕</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Keyword Pairs</h2>
        <p className="card-subtitle">
          {allPairs.length} keyword pairs generated from {services.length} service(s) × {suburbs.length} suburb(s).
          Uncheck any you want to exclude.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => toggleAll(true)}>
            Select All
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => toggleAll(false)}>
            Deselect All
          </button>
          <span style={{ color: '#64748b', fontSize: '0.82rem', alignSelf: 'center' }}>
            {checkedKeywords.length} / {allPairs.length} selected
          </span>
        </div>

        <div className="keywords-table-wrapper">
          <table className="keywords-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Keyword</th>
                <th>Service</th>
                <th>Suburb</th>
              </tr>
            </thead>
            <tbody>
              {allPairs.map((kw) => {
                // Parse back service and suburb from the pair
                const serviceMatch = services.find((s) => kw.startsWith(s + ' '));
                const suburb = serviceMatch ? kw.slice(serviceMatch.length + 1) : kw;
                return (
                  <tr key={kw}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!checked[kw]}
                        onChange={(e) => setChecked((prev) => ({ ...prev, [kw]: e.target.checked }))}
                        aria-label={`Include keyword: ${kw}`}
                      />
                    </td>
                    <td>{kw}</td>
                    <td>{serviceMatch || ''}</td>
                    <td>{suburb}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="btn-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={checkedKeywords.length === 0}
          >
            Generate Quote →
          </button>
        </div>
      </div>
    </div>
  );
}
