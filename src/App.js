import React, { useState } from 'react';
import StepServices from './components/StepServices';
import StepSuburbs from './components/StepSuburbs';
import StepKeywords from './components/StepKeywords';
import StepQuote from './components/StepQuote';
import useConfig from './hooks/useConfig';
import './App.css';

const STEP_LABELS = ['Services', 'Suburbs', 'Keywords', 'Quote'];

function App() {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [suburbs, setSuburbs] = useState([]);
  const [, setKeywords] = useState([]);
  const [quoteData, setQuoteData] = useState(null);
  const { config, loading } = useConfig();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">SEO Quote Generator</h1>
        <div className="step-indicator">
          {STEP_LABELS.map((label, i) => (
            <div
              key={i}
              className={`step-pill ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            >
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="app-main">
        {step === 0 && (
          <StepServices
            value={services}
            onChange={setServices}
            onNext={() => setStep(1)}
            config={config}
          />
        )}
        {step === 1 && (
          <StepSuburbs
            value={suburbs}
            onChange={setSuburbs}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepKeywords
            services={services}
            suburbs={suburbs}
            onNext={(data) => {
              setQuoteData(data);
              setStep(3);
            }}
            onBack={() => setStep(1)}
            config={config}
          />
        )}
        {step === 3 && (
          <StepQuote
            services={services}
            suburbs={suburbs}
            quoteData={quoteData}
            config={config}
            onBack={() => setStep(2)}
            onReset={() => {
              setStep(0);
              setServices([]);
              setSuburbs([]);
              setKeywords([]);
              setQuoteData(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
