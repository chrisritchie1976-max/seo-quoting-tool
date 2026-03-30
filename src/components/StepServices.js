import React, { useState } from 'react';

const MAX_SERVICES = 3;

export default function StepServices({ value, onChange, onNext, config }) {
  const [search, setSearch] = useState('');

  const industries = config?.industries || [];

  const filtered = industries.filter((ind) =>
    ind.industry.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (industryName) => {
    if (value.includes(industryName)) {
      onChange(value.filter((v) => v !== industryName));
    } else {
      if (value.length >= MAX_SERVICES) return;
      onChange([...value, industryName]);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Select Services</h2>
      <p className="card-subtitle">
        Choose up to {MAX_SERVICES} industries for this quote.
      </p>

      <div className="selection-count">
        <span>{value.length}</span> / {MAX_SERVICES} selected
      </div>

      <div className="search-box">
        <input
          className="input"
          type="text"
          placeholder="Search industries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="industry-grid">
        {filtered.map((ind) => {
          const isSelected = value.includes(ind.industry);
          const isDisabled = !isSelected && value.length >= MAX_SERVICES;
          return (
            <div
              key={ind.industry}
              className={`industry-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && toggle(ind.industry)}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) toggle(ind.industry);
              }}
              aria-pressed={isSelected}
            >
              <span className="industry-name">{ind.industry}</span>
              {ind.ymyl && <span className="ymyl-badge">YMYL</span>}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p style={{ color: '#64748b', gridColumn: '1 / -1', padding: '0.5rem 0' }}>
            No industries match "{search}".
          </p>
        )}
      </div>

      {value.length > 0 && (
        <div className="tags" style={{ marginTop: '1rem' }}>
          {value.map((v) => (
            <span key={v} className="tag">
              {v}
              <button
                className="tag-remove"
                onClick={() => onChange(value.filter((s) => s !== v))}
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="btn-actions">
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={value.length === 0}
        >
          Next: Add Suburbs →
        </button>
      </div>
    </div>
  );
}
