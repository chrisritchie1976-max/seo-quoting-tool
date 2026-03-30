import React, { useState } from 'react';
import SUBURBS from '../data/suburbs';

const REGIONS = Object.keys(SUBURBS);

export default function StepSuburbs({ value, onChange, onNext, onBack }) {
  const [inputText, setInputText] = useState('');
  const [activeRegion, setActiveRegion] = useState(REGIONS[0]);

  const addSuburb = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const removeSuburb = (name) => {
    onChange(value.filter((v) => v !== name));
  };

  const handleInputAdd = () => {
    addSuburb(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputAdd();
    }
  };

  const toggleSuburbChip = (suburb) => {
    if (value.includes(suburb)) {
      removeSuburb(suburb);
    } else {
      addSuburb(suburb);
    }
  };

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Add Suburbs</h2>
        <p className="card-subtitle">
          Type a suburb name or browse by region below.
        </p>

        <div className="input-row">
          <input
            className="input"
            type="text"
            placeholder="Type a suburb name..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="btn btn-primary"
            onClick={handleInputAdd}
            disabled={!inputText.trim()}
          >
            Add
          </button>
        </div>

        {value.length > 0 && (
          <div className="tags">
            {value.map((suburb) => (
              <span key={suburb} className="tag">
                {suburb}
                <button
                  className="tag-remove"
                  onClick={() => removeSuburb(suburb)}
                  aria-label={`Remove ${suburb}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {value.length === 0 && (
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.75rem' }}>
            No suburbs selected yet.
          </p>
        )}
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>Browse by Region</h3>

        <div className="region-tabs">
          {REGIONS.map((region) => (
            <button
              key={region}
              className={`region-tab ${activeRegion === region ? 'active' : ''}`}
              onClick={() => setActiveRegion(region)}
            >
              {region}
            </button>
          ))}
        </div>

        <div className="suburb-chips">
          {SUBURBS[activeRegion].map((suburb) => (
            <button
              key={suburb}
              className={`suburb-chip ${value.includes(suburb) ? 'selected' : ''}`}
              onClick={() => toggleSuburbChip(suburb)}
            >
              {suburb}
            </button>
          ))}
        </div>
      </div>

      <div className="btn-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={value.length < 1}
        >
          Next: Keywords →
        </button>
      </div>
    </div>
  );
}
