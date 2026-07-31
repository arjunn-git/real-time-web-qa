import React, { useState } from 'react';
import { 
  FileSearch, 
  MousePointer, 
  Link as LinkIcon, 
  Phone, 
  Search, 
  FormInput, 
  CheckCircle2,
  Filter,
  Layers,
  Wrench
} from 'lucide-react';
import type { DeliveryQaReport, ContentDiscrepancyResult } from '../../server/services/deliveryQaEngine';

interface ChecklistSectionsProps {
  report: DeliveryQaReport;
}

export const ChecklistSections: React.FC<ChecklistSectionsProps> = ({ report }) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('ALL_PAGES');

  // Extract unique pages from discrepancies
  const availablePages = Array.from(
    new Set(
      report.contentDiscrepancies
        .map(d => d.page || 'Homepage')
        .filter(Boolean)
    )
  );

  // Filter discrepancies by Type and Page
  const filteredDiscrepancies = report.contentDiscrepancies.filter(item => {
    const matchesType = 
      selectedTypeFilter === 'ALL' ? true :
      selectedTypeFilter === 'MISSING' ? item.type === 'Missing Content' :
      selectedTypeFilter === 'INCORRECT' ? item.type === 'Incorrect Content' :
      selectedTypeFilter === 'FORMATTING' ? (item.type === 'Minor Formatting Difference' || item.type === 'Partial Match') :
      selectedTypeFilter === 'MATCHED' ? item.type === 'Matched Content' : true;

    const pageName = item.page || 'Homepage';
    const matchesPage = selectedPageFilter === 'ALL_PAGES' ? true : pageName === selectedPageFilter;

    return matchesType && matchesPage;
  });

  // Calculate counters
  const missingCount = report.contentDiscrepancies.filter(d => d.type === 'Missing Content').length;
  const incorrectCount = report.contentDiscrepancies.filter(d => d.type === 'Incorrect Content').length;
  const formattingCount = report.contentDiscrepancies.filter(d => d.type === 'Minor Formatting Difference' || d.type === 'Partial Match').length;
  const matchedCount = report.contentDiscrepancies.filter(d => d.type === 'Matched Content').length;

  const getActionableFix = (item: ContentDiscrepancyResult): string => {
    const pName = item.page || 'Website';
    if (item.type === 'Missing Content') {
      return `Add missing specification "${item.expected || item.item}" to ${pName}.`;
    }
    if (item.type === 'Incorrect Content') {
      return `Update ${item.item} on ${pName} from "${item.found}" to expected "${item.expected}".`;
    }
    if (item.type === 'Minor Formatting Difference' || item.type === 'Partial Match') {
      return `Align text formatting on ${pName} to match exact document wording.`;
    }
    return `Content verified on ${pName}.`;
  };

  return (
    <div className="checklist-sections-container">

      {/* 2. PAGE-WISE MISSING & INCORRECT CONTENT AUDIT MATRIX */}
      <div className="qa-section-card">
        <div className="section-title-row">
          <FileSearch className="section-icon cyan" size={20} />
          <div>
            <h3>2. Document vs Website Content Audit Matrix</h3>
            <p>Page-by-page breakdown of missing, incorrect, and matched document specifications</p>
          </div>
        </div>

        {/* Audit Metric Counters Bar */}
        <div className="link-counters-row" style={{ marginBottom: '18px' }}>
          <div className={`link-counter ${missingCount > 0 ? 'red' : 'green'}`}>
            <span className="count-num">{missingCount}</span>
            <span className="count-label">Missing Content Snippets</span>
          </div>
          <div className={`link-counter ${incorrectCount > 0 ? 'amber' : 'green'}`}>
            <span className="count-num">{incorrectCount}</span>
            <span className="count-label">Incorrect / Mismatched Snippets</span>
          </div>
          <div className="link-counter blue">
            <span className="count-num">{formattingCount}</span>
            <span className="count-label">Minor Wording Differences</span>
          </div>
          <div className="link-counter green">
            <span className="count-num">{matchedCount}</span>
            <span className="count-label">Matched Document Specs</span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="matrix-filter-controls" style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {/* Status Type Filters */}
          <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <div className="input-options-tabs" style={{ margin: 0 }}>
              <button 
                type="button" 
                className={`option-tab-btn ${selectedTypeFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedTypeFilter('ALL')}
              >
                All ({report.contentDiscrepancies.length})
              </button>
              <button 
                type="button" 
                className={`option-tab-btn ${selectedTypeFilter === 'MISSING' ? 'active' : ''}`}
                onClick={() => setSelectedTypeFilter('MISSING')}
              >
                Missing ({missingCount})
              </button>
              <button 
                type="button" 
                className={`option-tab-btn ${selectedTypeFilter === 'INCORRECT' ? 'active' : ''}`}
                onClick={() => setSelectedTypeFilter('INCORRECT')}
              >
                Incorrect ({incorrectCount})
              </button>
              <button 
                type="button" 
                className={`option-tab-btn ${selectedTypeFilter === 'FORMATTING' ? 'active' : ''}`}
                onClick={() => setSelectedTypeFilter('FORMATTING')}
              >
                Wording Diff ({formattingCount})
              </button>
            </div>
          </div>

          {/* Page Filters */}
          {availablePages.length > 0 && (
            <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              <Layers size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Page:</span>
              <select 
                value={selectedPageFilter} 
                onChange={(e) => setSelectedPageFilter(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL_PAGES">All Target Pages</option>
                {availablePages.map((pg, i) => (
                  <option key={i} value={pg}>{pg}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Matrix List / Table */}
        {filteredDiscrepancies.length === 0 ? (
          <div className="clean-passed-box">
            <CheckCircle2 size={20} />
            <span>✓ No content issues found for the selected page and filter criteria.</span>
          </div>
        ) : (
          <div className="discrepancies-list">
            {filteredDiscrepancies.map((item, idx) => {
              const statusSlug = item.type.toLowerCase().replace(/\s+/g, '-');
              const targetPage = item.page || 'Homepage';
              const fixInstruction = getActionableFix(item);

              return (
                <div key={idx} className={`discrepancy-item ${statusSlug}`} style={{ padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                  <div className="discrepancy-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span className={`type-badge ${statusSlug}`}>{item.type}</span>
                    <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                      Page: {targetPage}
                    </span>
                    <span className="item-title" style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.item}</span>
                  </div>

                  <div className="matrix-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                    <div className="detail-line">
                      <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '4px', fontSize: '0.78rem' }}>
                        📄 Approved Copy (Document Brief):
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{item.expected || 'Not Specified'}</span>
                    </div>

                    <div className="detail-line">
                      <strong style={{ color: item.type === 'Missing Content' ? '#f87171' : '#fbbf24', display: 'block', marginBottom: '4px', fontSize: '0.78rem' }}>
                        🌐 Live Website Value (Found):
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{item.found || 'Not Found on Page'}</span>
                    </div>
                  </div>

                  <div className="actionable-fix-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <Wrench size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span><strong>Recommended Fix:</strong> {fixInstruction}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. BUTTON VALIDATION (Wix & Interactive Actions Audit) */}
      <div className="qa-section-card">
        <div className="section-title-row">
          <MousePointer className="section-icon purple" size={20} />
          <div>
            <h3>3. Button Validation</h3>
            <p>Verification of Wix button actions (Page Links, Lead Forms, Popups, Lightboxes, Anchors & Velo Actions)</p>
          </div>
        </div>

        <div className="link-counters-row" style={{ marginBottom: '18px' }}>
          <div className="link-counter blue">
            <span className="count-num">{report.buttonsReport.totalCount}</span>
            <span className="count-label">Total Buttons Inspected</span>
          </div>
          <div className="link-counter green">
            <span className="count-num">{report.buttonsReport.validCount}</span>
            <span className="count-label">Valid Action Buttons</span>
          </div>
          {report.buttonsReport.missingActionCount > 0 && (
            <div className="link-counter amber">
              <span className="count-num">{report.buttonsReport.missingActionCount}</span>
              <span className="count-label">Missing Action Buttons</span>
            </div>
          )}
          {report.buttonsReport.brokenCount > 0 && (
            <div className="link-counter red">
              <span className="count-num">{report.buttonsReport.brokenCount}</span>
              <span className="count-label">Broken Link Buttons</span>
            </div>
          )}
        </div>

        {report.buttonsReport.items.length === 0 ? (
          <div className="clean-passed-box">
            <CheckCircle2 size={20} />
            <span>✓ No button issues found across detected website pages.</span>
          </div>
        ) : (
          <div className="buttons-grid">
            {report.buttonsReport.items.map((btn, idx) => (
              <div key={idx} className="button-item-card">
                <div className="btn-name-group">
                  <span className="btn-text">"{btn.name}"</span>
                  <span className="btn-page">({btn.page})</span>
                </div>
                <div className="btn-status-group">
                  <span className="btn-href">Target: {btn.href}</span>
                  <span className={`btn-status-pill ${btn.isValid ? 'working' : 'missing-link'}`}>
                    {btn.isValid ? `✓ ${btn.statusLabel}` : '⚠ Missing Action'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. LINK VALIDATION */}
      <div className="qa-section-card">
        <div className="section-title-row">
          <LinkIcon className="section-icon amber" size={20} />
          <div>
            <h3>4. Link Validation</h3>
            <p>Internal, External, Navigation, and Footer link integrity audit</p>
          </div>
        </div>

        <div className="link-counters-row">
          <div className="link-counter green">
            <span className="count-num">{report.linksReport.workingCount}</span>
            <span className="count-label">Working Links</span>
          </div>
          <div className="link-counter red">
            <span className="count-num">{report.linksReport.brokenCount}</span>
            <span className="count-label">Broken Links</span>
          </div>
          <div className="link-counter amber">
            <span className="count-num">{report.linksReport.missingCount}</span>
            <span className="count-label">Missing Links (#)</span>
          </div>
        </div>

        <div className="links-list">
          {report.linksReport.items.map((link, idx) => (
            <div key={idx} className="link-row-item">
              <span className="link-name">{link.name}</span>
              <span className="link-url">{link.href}</span>
              <span className={`link-status-badge ${link.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {link.status === 'Working' ? '✓ Working' : '✗ ' + link.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. CONTACT INFORMATION VALIDATION */}
      <div className="qa-section-card">
        <div className="section-title-row">
          <Phone className="section-icon green" size={20} />
          <div>
            <h3>5. Contact Information Validation</h3>
            <p>Verification of client phone, email, office address, and social links</p>
          </div>
        </div>

        <div className="contact-grid">
          <div className="contact-item-box">
            <span className="ci-label">Phone Number</span>
            <span className={`ci-value ${report.contactInfoReport.phone.status === 'Present' ? 'present' : 'missing'}`}>
              {report.contactInfoReport.phone.status === 'Present' ? `✓ Present (${report.contactInfoReport.phone.value})` : '✗ Missing'}
            </span>
          </div>

          <div className="contact-item-box">
            <span className="ci-label">Email Address</span>
            <span className={`ci-value ${report.contactInfoReport.email.status === 'Present' ? 'present' : 'missing'}`}>
              {report.contactInfoReport.email.status === 'Present' ? `✓ Present (${report.contactInfoReport.email.value})` : '✗ Missing'}
            </span>
          </div>

          <div className="contact-item-box">
            <span className="ci-label">Office Address</span>
            <span className={`ci-value ${report.contactInfoReport.address.status === 'Present' ? 'present' : 'missing'}`}>
              {report.contactInfoReport.address.status === 'Present' ? `✓ Present` : '✗ Missing'}
            </span>
          </div>

          <div className="contact-item-box">
            <span className="ci-label">Instagram Link</span>
            <span className={`ci-value ${report.contactInfoReport.instagram === 'Working' ? 'present' : 'missing'}`}>
              {report.contactInfoReport.instagram === 'Working' ? '✓ Working' : '✗ Missing'}
            </span>
          </div>

          <div className="contact-item-box">
            <span className="ci-label">LinkedIn Link</span>
            <span className={`ci-value ${report.contactInfoReport.linkedin === 'Working' ? 'present' : 'missing'}`}>
              {report.contactInfoReport.linkedin === 'Working' ? '✓ Working' : '✗ Missing'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. SEO QUICK CHECK (High Confidence Wix & Builder SEO Audit) */}
      <div className="qa-section-card">
        <div className="section-title-row">
          <Search className="section-icon cyan" size={20} />
          <div>
            <h3>6. SEO Quick Check</h3>
            <p>Pre-client delivery SEO validation for Meta Title, Meta Description, H1, and Alt Text</p>
          </div>
          <span className={`status-pill ${report.seoQuickCheck.overallStatus === 'Passed' ? 'working' : report.seoQuickCheck.overallStatus === 'Unable to Validate' ? 'unclear' : 'missing-link'}`} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
            Overall SEO: {report.seoQuickCheck.overallStatus}
          </span>
        </div>

        {/* Summary Pills */}
        <div className="seo-summary-row" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div className="seo-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span className="seo-label">Meta Title Status</span>
            <span className={`seo-val ${report.seoQuickCheck.metaTitle === 'Passed' ? 'passed' : report.seoQuickCheck.metaTitle === 'Unable to Validate' ? 'unable' : 'missing'}`}>
              {report.seoQuickCheck.metaTitle === 'Passed' ? '✓ Passed' : report.seoQuickCheck.metaTitle}
            </span>
          </div>

          <div className="seo-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span className="seo-label">Meta Description Status</span>
            <span className={`seo-val ${report.seoQuickCheck.metaDescription === 'Passed' ? 'passed' : report.seoQuickCheck.metaDescription === 'Unable to Validate' ? 'unable' : 'missing'}`}>
              {report.seoQuickCheck.metaDescription === 'Passed' ? '✓ Passed' : report.seoQuickCheck.metaDescription}
            </span>
          </div>

          <div className="seo-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span className="seo-label">H1 Heading Status</span>
            <span className={`seo-val ${report.seoQuickCheck.h1 === 'Passed' ? 'passed' : report.seoQuickCheck.h1 === 'Unable to Validate' ? 'unable' : 'missing'}`}>
              {report.seoQuickCheck.h1 === 'Passed' ? '✓ Passed' : report.seoQuickCheck.h1}
            </span>
          </div>

          <div className="seo-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span className="seo-label">Alt Text Status</span>
            <span className={`seo-val ${report.seoQuickCheck.altText === 'Passed' ? 'passed' : report.seoQuickCheck.altText === 'Unable to Validate' ? 'unable' : 'missing'}`}>
              {report.seoQuickCheck.altText === 'Passed' ? '✓ Passed' : report.seoQuickCheck.altText}
            </span>
          </div>
        </div>

        {/* Deduplicated Page-by-Page SEO List */}
        <div className="seo-pages-details-list">
          {report.seoQuickCheck.details.map((detail, idx) => (
            <div key={idx} className="seo-page-item">
              <span className="seo-page-name">{detail.page}</span>
              <div className="seo-page-badges" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`seo-badge ${detail.metaTitleStatus === 'Passed' ? 'passed' : detail.metaTitleStatus === 'Unable to Validate' ? 'unable' : 'missing'}`}>
                  Meta Title: {detail.metaTitleStatus}
                </span>
                <span className={`seo-badge ${detail.metaDescStatus === 'Passed' ? 'passed' : detail.metaDescStatus === 'Unable to Validate' ? 'unable' : 'missing'}`}>
                  Meta Description: {detail.metaDescStatus}
                </span>
                <span className={`seo-badge ${detail.h1Status === 'Passed' ? 'passed' : detail.h1Status === 'Unable to Validate' ? 'unable' : 'missing'}`}>
                  H1: {detail.h1Status}
                </span>
                <span className={`seo-badge ${detail.altTextStatus === 'Passed' ? 'passed' : detail.altTextStatus === 'Unable to Validate' ? 'unable' : 'missing'}`}>
                  Alt Text: {detail.altTextStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. FORM VALIDATION */}
      <div className="qa-section-card">
        <div className="section-title-row">
          <FormInput className="section-icon indigo" size={20} />
          <div>
            <h3>7. Form Validation</h3>
            <p>Verification of lead generation and contact forms</p>
          </div>
        </div>

        <div className="forms-grid">
          <div className="form-item-box">
            <span className="form-name">Contact Form</span>
            <span className={`form-status ${report.formsReport.contactForm === 'Passed' ? 'passed' : 'missing'}`}>
              {report.formsReport.contactForm === 'Passed' ? '✓ Passed (Fields & Submit Button Visible)' : '✗ Form or Submit Button Missing'}
            </span>
          </div>

          <div className="form-item-box">
            <span className="form-name">Newsletter Form</span>
            <span className={`form-status ${report.formsReport.newsletterForm === 'Passed' ? 'passed' : 'missing'}`}>
              {report.formsReport.newsletterForm === 'Passed' ? '✓ Passed' : '⚠ Submit button missing'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
