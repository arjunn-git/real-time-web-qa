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
          <div className="logo-icon-wrapper">
            <ShieldCheck className="logo-icon" size={26} />
          </div>
          <div>
            <div className="brand-title">
              Real-Time Web QA Validator <span className="version-badge">Live API Engine</span>
            </div>
            <div className="brand-subtitle">
              Automated Real-Time Google Doc & Puppeteer Scraping Auditor
            </div>
          </div>
        </div>

        <div className="navbar-controls">
          <button className="reset-btn" onClick={onReset}>
            <RotateCcw size={16} />
            <span>Reset URLs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
