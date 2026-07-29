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
      {error && (
        <div className="error-banner">
          <ShieldAlert size={22} className="error-icon" />
          <div className="error-content">
            <h4>Validation Failed</h4>
            <p>{error}</p>
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
            <span className="live-pill puppeteer">Puppeteer Multi-Page Scraper</span>
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
          <div className="loading-progress-box">
            <RefreshCw className="spin" size={24} />
            <div className="progress-text-group">
              <span className="progress-title">{analysisStep || 'Inspecting Website...'}</span>
              <span className="progress-sub">Extracting document file content & auditing live website pages</span>
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
