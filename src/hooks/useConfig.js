import { useState, useEffect } from 'react';

const BUILT_IN_DEFAULTS = {
  targetMargin: 40,
  valueShareMin: 10,
  valueShareMax: 20,
  defaultConvRate: 2.5,
  tiers: {
    Basic:        { min: 499,  max: 999,  cost: 250  },
    Intermediate: { min: 1099, max: 1499, cost: 450  },
    Advanced:     { min: 1599, max: 2099, cost: 700  },
    Pro:          { min: 2199, max: 3000, cost: 1100 },
    Enterprise:   { min: 3000, max: null, cost: 1800 },
  },
  industries: [
    { industry: 'Plumber',              ymyl: false, closeRate: 35, avgSaleValue: 850,   convRate: 3.0 },
    { industry: 'Electrician',          ymyl: false, closeRate: 40, avgSaleValue: 950,   convRate: 3.0 },
    { industry: 'Builder',              ymyl: false, closeRate: 25, avgSaleValue: 45000, convRate: 1.5 },
    { industry: 'Roofer',               ymyl: false, closeRate: 30, avgSaleValue: 8000,  convRate: 2.0 },
    { industry: 'Landscaper',           ymyl: false, closeRate: 35, avgSaleValue: 3500,  convRate: 2.5 },
    { industry: 'Painter',              ymyl: false, closeRate: 40, avgSaleValue: 2500,  convRate: 3.0 },
    { industry: 'Concreter',            ymyl: false, closeRate: 35, avgSaleValue: 4500,  convRate: 2.5 },
    { industry: 'Carpenter',            ymyl: false, closeRate: 40, avgSaleValue: 3000,  convRate: 2.5 },
    { industry: 'Tiler',                ymyl: false, closeRate: 40, avgSaleValue: 2000,  convRate: 3.0 },
    { industry: 'Cleaner',              ymyl: false, closeRate: 50, avgSaleValue: 250,   convRate: 4.0 },
    { industry: 'Removalist',           ymyl: false, closeRate: 45, avgSaleValue: 1200,  convRate: 3.5 },
    { industry: 'Mechanic',             ymyl: false, closeRate: 55, avgSaleValue: 600,   convRate: 4.0 },
    { industry: 'Pest Control',         ymyl: false, closeRate: 50, avgSaleValue: 350,   convRate: 4.0 },
    { industry: 'Locksmith',            ymyl: false, closeRate: 60, avgSaleValue: 250,   convRate: 5.0 },
    { industry: 'Air Conditioning',     ymyl: false, closeRate: 40, avgSaleValue: 3500,  convRate: 3.0 },
    { industry: 'Solar',                ymyl: false, closeRate: 25, avgSaleValue: 12000, convRate: 2.0 },
    { industry: 'Pool Builder',         ymyl: false, closeRate: 20, avgSaleValue: 55000, convRate: 1.5 },
    { industry: 'Dentist',              ymyl: true,  closeRate: 60, avgSaleValue: 500,   convRate: 5.0 },
    { industry: 'Physiotherapist',      ymyl: true,  closeRate: 65, avgSaleValue: 120,   convRate: 5.5 },
    { industry: 'Chiropractor',         ymyl: true,  closeRate: 60, avgSaleValue: 100,   convRate: 5.0 },
    { industry: 'Psychologist',         ymyl: true,  closeRate: 55, avgSaleValue: 200,   convRate: 4.5 },
    { industry: 'GP / Doctor',          ymyl: true,  closeRate: 70, avgSaleValue: 80,    convRate: 6.0 },
    { industry: 'Lawyer',               ymyl: true,  closeRate: 25, avgSaleValue: 8000,  convRate: 2.0 },
    { industry: 'Accountant',           ymyl: true,  closeRate: 35, avgSaleValue: 3500,  convRate: 3.0 },
    { industry: 'Financial Planner',    ymyl: true,  closeRate: 30, avgSaleValue: 5000,  convRate: 2.5 },
    { industry: 'Mortgage Broker',      ymyl: true,  closeRate: 35, avgSaleValue: 3000,  convRate: 3.0 },
    { industry: 'Real Estate Agent',    ymyl: false, closeRate: 20, avgSaleValue: 18000, convRate: 1.5 },
    { industry: 'Vet',                  ymyl: true,  closeRate: 65, avgSaleValue: 350,   convRate: 5.0 },
    { industry: 'Optometrist',          ymyl: true,  closeRate: 70, avgSaleValue: 400,   convRate: 5.5 },
    { industry: 'Restaurant',           ymyl: false, closeRate: 70, avgSaleValue: 80,    convRate: 6.0 },
    { industry: 'Cafe',                 ymyl: false, closeRate: 75, avgSaleValue: 30,    convRate: 7.0 },
    { industry: 'Gym / Fitness',        ymyl: false, closeRate: 40, avgSaleValue: 1200,  convRate: 3.5 },
    { industry: 'Personal Trainer',     ymyl: false, closeRate: 45, avgSaleValue: 800,   convRate: 4.0 },
    { industry: 'Tutor',                ymyl: false, closeRate: 50, avgSaleValue: 600,   convRate: 4.5 },
    { industry: 'Wedding Photographer', ymyl: false, closeRate: 35, avgSaleValue: 3500,  convRate: 3.0 },
    { industry: 'Florist',              ymyl: false, closeRate: 55, avgSaleValue: 250,   convRate: 5.0 },
    { industry: 'Driving School',       ymyl: false, closeRate: 55, avgSaleValue: 600,   convRate: 4.5 },
  ],
};

function parseDefaults(rows) {
  const map = {};
  rows.forEach(([key, val]) => {
    if (key && val !== undefined) map[key.trim().toLowerCase()] = val;
  });
  return {
    targetMargin:    parseFloat(map['target margin %'])        || BUILT_IN_DEFAULTS.targetMargin,
    valueShareMin:   parseFloat(map['value share % min'])      || BUILT_IN_DEFAULTS.valueShareMin,
    valueShareMax:   parseFloat(map['value share % max'])      || BUILT_IN_DEFAULTS.valueShareMax,
    defaultConvRate: parseFloat(map['default conv rate %'])    || BUILT_IN_DEFAULTS.defaultConvRate,
  };
}

function parseTiers(rows) {
  const tiers = { ...BUILT_IN_DEFAULTS.tiers };
  rows.forEach(([name, minP, maxP, cost]) => {
    if (!name) return;
    const n = name.trim();
    tiers[n] = {
      min:  parseFloat(minP)  || 0,
      max:  maxP ? parseFloat(maxP) : null,
      cost: parseFloat(cost)  || 0,
    };
  });
  return tiers;
}

function parseIndustries(rows) {
  return rows
    .filter(([industry]) => industry && industry.trim())
    .map(([industry, ymylStr, closeRate, avgSaleValue, convRate]) => ({
      industry:     industry.trim(),
      ymyl:         ymylStr?.trim().toLowerCase() === 'yes',
      closeRate:    parseFloat(closeRate)    || 35,
      avgSaleValue: parseFloat(avgSaleValue) || 2000,
      convRate:     parseFloat(convRate)     || 2.5,
    }));
}

export default function useConfig() {
  const [config, setConfig]   = useState(BUILT_IN_DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const apiKey  = process.env.REACT_APP_SHEETS_API_KEY;
    const sheetId = process.env.REACT_APP_SHEET_ID;

    if (!apiKey || !sheetId) {
      // No credentials — use built-in defaults immediately
      return;
    }

    setLoading(true);

    const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`;

    const fetchRange = (range) =>
      fetch(`${base}/${range}?key=${apiKey}`)
        .then((r) => {
          if (!r.ok) throw new Error(`Sheets API error: ${r.status}`);
          return r.json();
        })
        .then((d) => d.values || []);

    Promise.all([
      fetchRange('defaults!A:B'),
      fetchRange('tier_costs!A:D'),
      fetchRange('industry_benchmarks!A:E'),
    ])
      .then(([defaultRows, tierRows, industryRows]) => {
        // Skip header rows
        const defaults   = parseDefaults(defaultRows.slice(1));
        const tiers      = parseTiers(tierRows.slice(1));
        const industries = parseIndustries(industryRows.slice(1));

        setConfig({
          ...BUILT_IN_DEFAULTS,
          ...defaults,
          tiers,
          industries: industries.length ? industries : BUILT_IN_DEFAULTS.industries,
        });
      })
      .catch((err) => {
        console.warn('Failed to load config from Google Sheets, using built-in defaults.', err);
        setError(err.message);
        setConfig(BUILT_IN_DEFAULTS);
      })
      .finally(() => setLoading(false));
  }, []);

  return { config, loading, error };
}
