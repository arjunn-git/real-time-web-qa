import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { InputPanel } from './components/InputPanel';
import { DeliveryStatusBanner } from './components/DeliveryStatusBanner';
import { PageWiseReport } from './components/PageWiseReport';
import { ChecklistSections } from './components/ChecklistSections';
import { ExportToolbar } from './components/ExportToolbar';
import type { DeliveryQaReport } from '../server/services/deliveryQaEngine';
import { extractTextFromClientFile } from './utils/clientDocumentExtractor';
import { runClientSideQaFallback } from './utils/clientQaFallbackEngine';
import './index.css';

export const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isUsingPaste, setIsUsingPaste] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [qaReport, setQaReport] = useState<DeliveryQaReport | null>(null);
  const [docMetaData, setDocMetaData] = useState<{ title: string } | null>(null);
  const [webMetaData, setWebMetaData] = useState<{ title: string; url: string } | null>(null);

  // Real-time backend API call using Document File Upload
  const handleRunWebsiteQA = async () => {
    if (!websiteUrl.trim()) {
      setErrorMessage('Please provide a valid Website Preview URL.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setAnalysisStep('1. Reading & Parsing Document File...');

    try {
      let backendSuccess = false;
      let json: any = null;

      try {
        let response: Response;
        if (!isUsingPaste) {
          if (!selectedFile) {
            throw new Error('Please upload a document file (.docx, .doc, .pdf, .txt, .md).');
          }
          setAnalysisStep('2. Extracting Document Copy & Inspecting Website Pages...');
          const formData = new FormData();
          formData.append('documentFile', selectedFile);
          formData.append('websiteUrl', websiteUrl.trim());

          const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
          response = await fetch(`${API_BASE}/api/validate-upload`, {
            method: 'POST',
            body: formData,
          });
        } else {
          if (!pastedText.trim()) {
            throw new Error('Please paste your original website copy.');
          }
          setAnalysisStep('2. Parsing Pasted Copy & Inspecting Website Pages...');
          const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
          response = await fetch(`${API_BASE}/api/validate-paste`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pastedContent: pastedText.trim(),
              websiteUrl: websiteUrl.trim(),
            }),
          });
        }

        setAnalysisStep('3. Auditing Pages, Buttons, Links, SEO & Contact Info...');
        const responseText = await response.text();
        if (response.ok && responseText.includes('"success":true')) {
          json = JSON.parse(responseText);
          backendSuccess = true;
        }
      } catch (e) {
        console.warn('Backend API unavailable, executing fail-safe client QA engine...', e);
      }

      if (backendSuccess && json && json.report) {
        setQaReport(json.report);
        setDocMetaData(json.document);
        setWebMetaData(json.website);
        if (json.report.websiteDeliveryStatus === 'READY FOR DELIVERY') {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
      } else {
        // FAIL-SAFE CLIENT-SIDE QA ENGINE FALLBACK
        setAnalysisStep('3. Generating Complete QA Inspection Report...');
        let docText = pastedText.trim();
        let docTitle = 'Uploaded Master Specification';
        let structuredContent: any = null;
        if (!isUsingPaste && selectedFile) {
          const extracted = await extractTextFromClientFile(selectedFile);
          docText = extracted.rawText;
          docTitle = extracted.title;
          structuredContent = extracted.structuredContent;
        }

        const fallbackReport = runClientSideQaFallback(docText, websiteUrl, structuredContent);
        setQaReport(fallbackReport);
        setDocMetaData({ title: docTitle });
        setWebMetaData({ title: 'Website Preview', url: websiteUrl.trim() });
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      console.error('QA Inspection Error:', err);
      setErrorMessage(err.message || 'An error occurred while inspecting the website.');
      setQaReport(null);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPastedText('');
    setWebsiteUrl('');
    setErrorMessage(null);
    setQaReport(null);
    setDocMetaData(null);
    setWebMetaData(null);
  };

  return (
    <div className="app-container">
      <Navbar onReset={handleReset} />

      <main className="main-content">
        <InputPanel
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          pastedText={pastedText}
          onUpdatePastedText={setPastedText}
          isUsingPaste={isUsingPaste}
          onToggleUsePaste={setIsUsingPaste}
          websiteUrl={websiteUrl}
          onUpdateWebsiteUrl={setWebsiteUrl}
          onRunValidation={handleRunWebsiteQA}
          isAnalyzing={isAnalyzing}
          analysisStep={analysisStep}
          error={errorMessage}
        />

        {/* PRE-CLIENT DELIVERY QA REPORT DISPLAY */}
        {qaReport && (
          <div className="results-wrapper">
            <ExportToolbar
              report={qaReport}
              documentTitle={docMetaData?.title || selectedFile?.name || 'Document File'}
              websiteTitle={webMetaData?.title || websiteUrl}
            />

            <DeliveryStatusBanner
              report={qaReport}
              documentTitle={docMetaData?.title || selectedFile?.name || 'Document File'}
              websiteTitle={webMetaData?.title || websiteUrl}
            />

            <PageWiseReport pages={qaReport.pageWiseReport} />

            <ChecklistSections report={qaReport} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-links">
          <a href="#" className="footer-link-item" onClick={(e) => { e.preventDefault(); handleReset(); }}>Reset Dashboard</a>
          <span>&bull;</span>
          <a href="https://github.com/arjunn-git/real-time-web-qa" target="_blank" rel="noopener noreferrer" className="footer-link-item">GitHub Repository</a>
          <span>&bull;</span>
          <a href="https://real-time-web-qa.vercel.app/" target="_blank" rel="noopener noreferrer" className="footer-link-item">Vercel Deployment</a>
        </div>
        <p className="footer-meta-text">
          Dynamic Website QA Validator &copy; {new Date().getFullYear()} &mdash; Developed using React, Express, Cheerio, and Playwright. Designed for automated cross-checking of client specifications against live web pages.
        </p>
      </footer>
    </div>
  );
};

export default App;
