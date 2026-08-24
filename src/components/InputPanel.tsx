import React from 'react';
import { 
  FileText, 
  Globe, 
  Upload, 
  ArrowRight, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle,
  FileCode,
  Edit3
} from 'lucide-react';

interface InputPanelProps {
  selectedFile: File | null;
  onSelectFile: (file: File | null) => void;
  pastedText: string;
  onUpdatePastedText: (text: string) => void;
  isUsingPaste: boolean;
  onToggleUsePaste: (usePaste: boolean) => void;
  websiteUrl: string;
  onUpdateWebsiteUrl: (url: string) => void;
  onRunValidation: () => void;
  isAnalyzing: boolean;
  analysisStep: string;
  error: string | null;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  selectedFile,
  onSelectFile,
  pastedText,
  onUpdatePastedText,
  isUsingPaste,
  onToggleUsePaste,
  websiteUrl,
  onUpdateWebsiteUrl,
  onRunValidation,
  isAnalyzing,
  analysisStep,
  error,
}) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      onSelectFile(f);
    }
  };

  return (
    <div className="input-panel-container">
      {/* ERROR BANNER DISPLAY */}
      {/* ERROR BANNER DISPLAY */}
      {error && (
        <div className="error-banner">
          <ShieldAlert size={22} className="error-icon" />
          <div className="error-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4>Validation Failed / Crawl Interrupted</h4>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="run-qa-btn"
              onClick={onRunValidation}
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                height: 'auto',
                width: 'auto',
                margin: 0,
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)'
              }}
            >
              <RefreshCw size={14} style={{ marginRight: '6px' }} />
              Retry Inspection
            </button>
          </div>
        </div>
      )}

      <div className="input-grid">
        {/* DOCUMENT FILE UPLOAD CARD (PRIMARY INPUT) */}
        <div className="input-card doc-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon-badge doc-badge">
                <FileText size={20} />
              </div>
              <div>
                <h3>1. Upload Document File</h3>
                <p>Original approved website copy or client brief file</p>
              </div>
            </div>

            <button
              type="button"
              className="toggle-mode-btn"
              onClick={() => onToggleUsePaste(!isUsingPaste)}
            >
              {isUsingPaste ? <Upload size={14} /> : <Edit3 size={14} />}
              <span>{isUsingPaste ? 'Upload Document File' : 'Paste Copy Instead'}</span>
            </button>
          </div>

          <div className="card-body">
            {!isUsingPaste ? (
              <div className="file-upload-wrapper">
                <div className="file-drop-box">
                  <input
                    type="file"
                    accept=".docx,.doc,.pdf,.txt,.md,.markdown"
                    id="file-doc-upload"
                    onChange={handleFileChange}
                    disabled={isAnalyzing}
                  />
                  <label htmlFor="file-doc-upload" className="file-drop-label primary-drop">
                    <FileCode size={34} className="upload-icon" />
                    <span className="upload-primary-text">
                      {selectedFile ? `Selected File: ${selectedFile.name}` : 'Click to Upload Document File (.docx, .doc, .pdf, .txt, .md)'}
                    </span>
                    <span className="upload-sub-text">
                      <CheckCircle size={13} /> Automatic extraction of Headings, Paragraphs, Services, CTAs, FAQs & Contact Info
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="paste-wrapper">
                <label className="input-label">Paste Original Copy / Specifications:</label>
                <textarea
                  className="content-textarea"
                  placeholder="Paste approved website copy or client requirements here..."
                  value={pastedText}
                  onChange={(e) => onUpdatePastedText(e.target.value)}
                  disabled={isAnalyzing}
                  rows={6}
                />
              </div>
            )}
          </div>
        </div>

        {/* WEBSITE PREVIEW LINK INPUT CARD */}
        <div className="input-card web-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon-badge web-badge">
                <Globe size={20} />
              </div>
              <div>
                <h3>2. Website Preview Link</h3>
                <p>Wix Preview URL, Live Website, WordPress, Shopify, or Webflow</p>
              </div>
            </div>
            <span className="live-pill puppeteer">Playwright Dynamic Scraper</span>
          </div>

          <div className="card-body">
            <div className="url-input-wrapper">
              <label className="input-label">Target Website Preview URL:</label>
              <input
                type="text"
                className="input-field"
                placeholder="https://preview.yourwebsite.com or https://your-site.wixsite.com"
                value={websiteUrl}
                onChange={(e) => onUpdateWebsiteUrl(e.target.value)}
                disabled={isAnalyzing}
              />
              <span className="hint-text">
                <CheckCircle size={13} /> Audits pages, buttons, internal/external links, SEO tags, & contact details
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION & REAL-TIME PROGRESS BAR */}
      <div className="action-bar-container">
        {isAnalyzing ? (
          <div className="loading-progress-box glowing-scanner-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', width: '100%', padding: '20px 24px', background: 'var(--bg-card)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
              <RefreshCw className="spin" size={20} style={{ color: 'var(--accent-cyan)' }} />
              <span className="progress-title" style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>
                {analysisStep || 'Inspecting Website...'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', padding: '2px 10px', borderRadius: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {analysisStep.includes('1.') ? 'Step 1/3' : analysisStep.includes('2.') ? 'Step 2/3' : 'Step 3/3'}
              </span>
            </div>
            
            <span className="progress-sub" style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {analysisStep.includes('1.') 
                ? 'Decompressing document streams and constructing structured copy tree...' 
                : analysisStep.includes('2.') 
                  ? 'Crawling live sitemap, validating links, and extracting wix page hierarchy...' 
                  : 'Running bigram similarity matches and verifying meta & content copy...'}
            </span>

            {/* Glowing Modern Progress Bar */}
            <div className="modern-loading-bar-wrapper">
              <div 
                className="modern-loading-bar-fill" 
                style={{
                  width: analysisStep.includes('1.') ? '30%' : analysisStep.includes('2.') ? '65%' : '90%'
                }} 
              />
            </div>

            {/* Stepper Status Indicators */}
            <div className="loading-steps-row">
              <div className={`loading-step-item ${(analysisStep.includes('1.') || analysisStep.includes('2.') || analysisStep.includes('3.')) ? 'active' : ''}`}>
                <div className="loading-step-dot" />
                <span>1. Parse spec</span>
              </div>
              <div className={`loading-step-item ${(analysisStep.includes('2.') || analysisStep.includes('3.')) ? 'active' : ''}`}>
                <div className="loading-step-dot" />
                <span>2. Scrape Site</span>
              </div>
              <div className={`loading-step-item ${analysisStep.includes('3.') ? 'active' : ''}`}>
                <div className="loading-step-dot" />
                <span>3. QA Delivery</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            className="run-qa-btn"
            onClick={onRunValidation}
            disabled={
              !websiteUrl.trim() ||
              (!isUsingPaste && !selectedFile) ||
              (isUsingPaste && !pastedText.trim())
            }
          >
            <span>Run Website QA Check</span>
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
