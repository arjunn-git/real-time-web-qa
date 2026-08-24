import React from 'react';
import { ShieldCheck, RotateCcw } from 'lucide-react';

interface NavbarProps {
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset }) => {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="brand-logo" onClick={onReset} style={{ cursor: 'pointer' }}>
          <div className="logo-icon-wrapper" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)', boxShadow: '0 4px 20px rgba(56, 189, 248, 0.25)' }}>
            <ShieldCheck className="logo-icon" size={24} style={{ color: '#fff' }} />
          </div>
          <div>
            <div className="brand-title" style={{ gap: '8px', fontSize: '1.25rem', fontWeight: 850, display: 'flex', alignItems: 'center' }}>
              <span className="gradient-text">Real-Time Web QA</span> Validator 
              <span className="version-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.66rem', padding: '3px 10px', borderRadius: '12px' }}>
                <span className="pulsing-dot" /> Live Engine
              </span>
            </div>
            <div className="brand-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
              Automated Real-Time Master Specification & Puppeteer Scraper Auditor
            </div>
          </div>
        </div>

        <div className="navbar-controls">
          <button 
            className="reset-btn" 
            onClick={onReset}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <RotateCcw size={14} />
            <span>Reset URLs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
