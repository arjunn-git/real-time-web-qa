import React, { useState } from 'react';
import { 
  FileSearch, 
  MousePointer, 
  Link as LinkIcon, 
  Phone, 
  Search, 
  FormInput, 
  CheckCircle2,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import type { DeliveryQaReport, ContentDiscrepancyResult } from '../../server/services/deliveryQaEngine';

interface ChecklistSectionsProps {
  report: DeliveryQaReport;
}

export const ChecklistSections: React.FC<ChecklistSectionsProps> = ({ report }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('ALL');
  const [showOnlyChanges, setShowOnlyChanges] = useState<boolean>(true);

  // Filter out structural checks from the main content view
  const contentItems = report.contentDiscrepancies.filter(d => 
    !d.item.startsWith('Section Exists:') && 
    !d.item.startsWith('Page Exists:')
  );

  // Apply search/page filters
  const filtered = contentItems.filter(item => {
    // Apply changes-only toggle
    if (showOnlyChanges && item.type !== '❌ Missing') {
      return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return (
        (item.page || '').toLowerCase().includes(q) ||
        (item.item || '').toLowerCase().includes(q) ||
        (item.expected || '').toLowerCase().includes(q) ||
        (item.found || '').toLowerCase().includes(q)
      );
    }
    if (selectedPageFilter !== 'ALL' && (item.page || 'Home') !== selectedPageFilter) return false;
    return true;
  });

  // Group strictly by Page name
  const groupedByPage: Record<string, ContentDiscrepancyResult[]> = {};
  filtered.forEach(item => {
    const pageName = item.page || 'Home';
    if (!groupedByPage[pageName]) {
      groupedByPage[pageName] = [];
    }
    groupedByPage[pageName].push(item);
  });

  const uniquePages = Array.from(new Set(contentItems.map(d => d.page || 'Home'))).filter(Boolean);

  // Export filtered changes to CSV
  const handleExportExcel = () => {
    const headers = ['Page', 'Status', 'Expected in Document', 'Found on Website', 'Recommendation'];
    const rows = filtered.map(d => [
      d.page || 'Home',
      d.type,
      d.expected,
      d.found,
      d.recommendation || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qa_validation_changes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    window.print();
  };

  // Metrics counters
  const totalCorrect = report.summaryMetrics?.totalCorrect ?? report.contentDiscrepancies.filter(d => d.type === '✅ Correct').length;
  const totalMissing = report.contentDiscrepancies.filter(d => d.type === '❌ Missing' && !d.item.startsWith('Section Exists:') && !d.item.startsWith('Page Exists:')).length;
  const totalPages = report.summaryMetrics?.totalPagesChecked ?? 1;

  return (
    <div className="checklist-sections-container">
      {/* 2. STRICT PAGE -> SECTION -> COMPONENT CONTENT AUDIT REPORT */}
      <div className="qa-section-card">
        <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <FileSearch className="section-icon cyan" size={22} />
            <div>
              <h3>2. Website Content Changes Needed</h3>
              <p>Direct side-by-side comparison of document specifications and live website copy</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="option-tab-btn" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}>
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
            <button className="option-tab-btn" onClick={handleExportPdf} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}>
              <Printer size={15} />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Audit Metrics Dashboard Row */}
        <div className="link-counters-row" style={{ marginBottom: '18px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="link-counter green">
            <span className="count-num">✅ {totalCorrect}</span>
            <span className="count-label">Total Verified Matches</span>
          </div>
          <div className={`link-counter ${totalMissing > 0 ? 'red' : 'green'}`}>
            <span className="count-num">❌ {totalMissing}</span>
            <span className="count-label">Total Changes Needed</span>
          </div>
          <div className="link-counter blue">
            <span className="count-num">{totalPages}</span>
            <span className="count-label">Pages Checked</span>
          </div>
        </div>

        {/* Filters and search toolbar */}
        <div className="filters-toolbar" style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search text or pages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', margin: 0, fontSize: '0.8rem', height: '36px' }}
              />
            </div>

            {/* Page Filter */}
            <select className="input-field" value={selectedPageFilter} onChange={e => setSelectedPageFilter(e.target.value)} style={{ margin: 0, fontSize: '0.8rem', height: '36px' }}>
              <option value="ALL">All Pages</option>
              {uniquePages.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>

            {/* View Mode Toggle */}
            <div className="input-options-tabs" style={{ margin: 0, display: 'flex', height: '36px' }}>
              <button 
                type="button" 
                className={`option-tab-btn ${showOnlyChanges ? 'active' : ''}`}
                onClick={() => setShowOnlyChanges(true)}
                style={{ flex: 1, padding: '0 8px', fontSize: '0.75rem' }}
              >
                Errors Only
              </button>
              <button 
                type="button" 
                className={`option-tab-btn ${!showOnlyChanges ? 'active' : ''}`}
                onClick={() => setShowOnlyChanges(false)}
                style={{ flex: 1, padding: '0 8px', fontSize: '0.75rem' }}
              >
                Show All
              </button>
            </div>
          </div>
        </div>

        {/* Direct page level list of changes (no sections, no components) */}
        {Object.keys(groupedByPage).length === 0 ? (
          <div className="clean-passed-box">
            <CheckCircle2 size={20} />
            <span>✓ Excellent! All document content matches the website page(s) successfully. Zero discrepancies found.</span>
          </div>
        ) : (
          <div className="grouped-tree-container">
            {Object.keys(groupedByPage).map(pageName => {
              const items = groupedByPage[pageName];

              return (
                <div key={pageName} className="tree-page-group" style={{ marginBottom: '24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      📄 Page: {pageName}
                    </span>
                    <span style={{ fontSize: '0.8rem', background: showOnlyChanges ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.08)', color: showOnlyChanges ? '#f87171' : '#fff', padding: '3px 12px', borderRadius: '12px', fontWeight: 700 }}>
                      {items.length} {showOnlyChanges ? 'Changes Required' : 'Lines Displayed'}
                    </span>
                  </div>

                  {/* SIDE-BY-SIDE GRID VIEW */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🌐 Website Content (Actual / Wrong)
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📄 Document Content (Expected / Correct)
                      </div>
                    </div>

                    {/* Content Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {items.map((item, idx) => {
                        const isCorrect = item.type === '✅ Correct';
                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '1fr 1fr', 
                              gap: '20px', 
                              alignItems: 'stretch'
                            }}
                          >
                            {/* Left Side: Website Content */}
                            <div 
                              style={{
                                background: isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.05)',
                                border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)'}`,
                                borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
                                borderRadius: '8px',
                                padding: '12px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                            >
                              {isCorrect ? (
                                <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.4 }}>
                                  {item.found || item.expected}
                                </div>
                              ) : (
                                <div>
                                  <div style={{ color: '#f87171', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                                    ❌ Wrong / Missing
                                  </div>
                                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4 }}>
                                    Found: {item.found || 'None'}
                                  </div>
                                  {item.recommendation && (
                                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '4px', marginTop: '6px' }}>
                                      <strong>Fix:</strong> {item.recommendation}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Right Side: Document Content (Correct) */}
                            <div 
                              style={{
                                background: isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(245, 158, 11, 0.03)',
                                border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
                                borderLeft: `4px solid ${isCorrect ? '#10b981' : '#f59e0b'}`,
                                borderRadius: '8px',
                                padding: '12px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                              }}
                            >
                              <div style={{ color: isCorrect ? '#34d399' : '#facc15', fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>
                                {isCorrect ? '✓ Matched' : '★ Correct spec copy'}
                              </div>
                              <div style={{ color: '#fff', fontSize: '0.8rem', lineHeight: 1.4 }}>
                                {item.expected}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. BUTTON VALIDATION */}
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

      {/* 6. SEO QUICK CHECK */}
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
