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
  Printer,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { DeliveryQaReport, ContentDiscrepancyResult } from '../../server/services/deliveryQaEngine';

interface ChecklistSectionsProps {
  report: DeliveryQaReport;
}

export const ChecklistSections: React.FC<ChecklistSectionsProps> = ({ report }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [selectedComponentFilter, setSelectedComponentFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});

  // Toggle path visibility
  const togglePath = (path: string) => {
    setExpandedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Expand / Collapse all
  const setAllExpanded = (value: boolean) => {
    const next: Record<string, boolean> = {};
    if (value) {
      report.contentDiscrepancies.forEach(d => {
        const pageName = d.page || 'Home';
        const secName = d.section || 'Hero';
        const compName = d.component || 'Paragraph';
        next[`page:${pageName}`] = true;
        next[`sec:${pageName}:${secName}`] = true;
        next[`comp:${pageName}:${secName}:${compName}`] = true;
      });
    }
    setExpandedPaths(next);
  };

  // Get unique lists for filter options
  const uniquePages = Array.from(new Set(report.contentDiscrepancies.map(d => d.page || 'Home'))).filter(Boolean);
  const uniqueSections = Array.from(new Set(report.contentDiscrepancies.map(d => d.section || 'Hero'))).filter(Boolean);
  const uniqueComponents = Array.from(new Set(report.contentDiscrepancies.map(d => d.component || 'Paragraph'))).filter(Boolean);

  // Apply filters and search
  const filtered = report.contentDiscrepancies.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchSearch = 
        (item.page || '').toLowerCase().includes(q) ||
        (item.section || '').toLowerCase().includes(q) ||
        (item.component || '').toLowerCase().includes(q) ||
        (item.item || '').toLowerCase().includes(q) ||
        (item.expected || '').toLowerCase().includes(q) ||
        (item.found || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    if (selectedPageFilter !== 'ALL' && (item.page || 'Home') !== selectedPageFilter) return false;
    if (selectedSectionFilter !== 'ALL' && (item.section || 'Hero') !== selectedSectionFilter) return false;
    if (selectedComponentFilter !== 'ALL' && (item.component || 'Paragraph') !== selectedComponentFilter) return false;
    
    if (selectedStatusFilter !== 'ALL') {
      const isCorrect = item.type === '✅ Correct' || (item.type as string) === 'Matched Content';
      if (selectedStatusFilter === 'CORRECT' && !isCorrect) return false;
      if (selectedStatusFilter === 'MISSING' && isCorrect) return false;
    }

    return true;
  });

  // Group filtered results: Page -> Section -> Component
  const grouped: Record<string, Record<string, Record<string, ContentDiscrepancyResult[]>>> = {};
  filtered.forEach(item => {
    const pageName = item.page || 'Home';
    const secName = item.section || 'Hero';
    const compName = item.component || 'Paragraph';

    if (!grouped[pageName]) grouped[pageName] = {};
    if (!grouped[pageName][secName]) grouped[pageName][secName] = {};
    if (!grouped[pageName][secName][compName]) grouped[pageName][secName][compName] = [];

    grouped[pageName][secName][compName].push(item);
  });

  // Export to CSV / Excel
  const handleExportExcel = () => {
    const headers = ['Page', 'Section', 'Component', 'Status', 'Item', 'Expected', 'Found', 'Recommendation'];
    const rows = filtered.map(d => [
      d.page || 'Home',
      d.section || 'Hero',
      d.component || 'Paragraph',
      d.type,
      d.item,
      d.expected,
      d.found,
      d.recommendation || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qa_validation_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (browser print)
  const handleExportPdf = () => {
    window.print();
  };

  // Metric counts strictly mapped
  const totalCorrect = report.summaryMetrics?.totalCorrect ?? report.contentDiscrepancies.filter(d => d.type === '✅ Correct').length;
  const totalMissing = report.summaryMetrics?.totalMissing ?? report.contentDiscrepancies.filter(d => d.type === '❌ Missing').length;
  const totalPages = report.summaryMetrics?.totalPagesChecked ?? uniquePages.length;
  const totalSections = report.summaryMetrics?.totalSectionsChecked ?? 24;
  const totalComponents = report.summaryMetrics?.totalComponentsChecked ?? report.contentDiscrepancies.length;

  return (
    <div className="checklist-sections-container">
      {/* 2. STRICT PAGE -> SECTION -> COMPONENT CONTENT AUDIT REPORT */}
      <div className="qa-section-card">
        <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <FileSearch className="section-icon cyan" size={22} />
            <div>
              <h3>2. Strict Page & Section Content Audit Report</h3>
              <p>Deterministic verification compared by Page → Section → Component</p>
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
        <div className="link-counters-row" style={{ marginBottom: '18px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <div className="link-counter green">
            <span className="count-num">✅ {totalCorrect}</span>
            <span className="count-label">Total Correct</span>
          </div>
          <div className={`link-counter ${totalMissing > 0 ? 'red' : 'green'}`}>
            <span className="count-num">❌ {totalMissing}</span>
            <span className="count-label">Total Missing</span>
          </div>
          <div className="link-counter blue">
            <span className="count-num">{totalPages}</span>
            <span className="count-label">Pages Checked</span>
          </div>
          <div className="link-counter purple">
            <span className="count-num">{totalSections}</span>
            <span className="count-label">Sections Checked</span>
          </div>
          <div className="link-counter amber">
            <span className="count-num">{totalComponents}</span>
            <span className="count-label">Components Checked</span>
          </div>
        </div>

        {/* Toolbar with Search, Filters, Accordion actions */}
        <div className="filters-toolbar" style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search specs, pages, text..."
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

            {/* Section Filter */}
            <select className="input-field" value={selectedSectionFilter} onChange={e => setSelectedSectionFilter(e.target.value)} style={{ margin: 0, fontSize: '0.8rem', height: '36px' }}>
              <option value="ALL">All Sections</option>
              {uniqueSections.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>

            {/* Component Filter */}
            <select className="input-field" value={selectedComponentFilter} onChange={e => setSelectedComponentFilter(e.target.value)} style={{ margin: 0, fontSize: '0.8rem', height: '36px' }}>
              <option value="ALL">All Components</option>
              {uniqueComponents.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>

            {/* Status Filter */}
            <select className="input-field" value={selectedStatusFilter} onChange={e => setSelectedStatusFilter(e.target.value)} style={{ margin: 0, fontSize: '0.8rem', height: '36px' }}>
              <option value="ALL">All Statuses</option>
              <option value="CORRECT">✅ Correct</option>
              <option value="MISSING">❌ Missing</option>
            </select>
          </div>

          {/* Accordion Expand / Collapse controls */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', fontSize: '0.8rem' }}>
            <button className="toggle-mode-btn" onClick={() => setAllExpanded(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)' }}>
              <Maximize2 size={13} />
              <span>Expand All</span>
            </button>
            <button className="toggle-mode-btn" onClick={() => setAllExpanded(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
              <Minimize2 size={13} />
              <span>Collapse All</span>
            </button>
          </div>
        </div>

        {/* Tree Accordion Render */}
        {Object.keys(grouped).length === 0 ? (
          <div className="clean-passed-box">
            <CheckCircle2 size={20} />
            <span>✓ No validation items found matching the current search & filters.</span>
          </div>
        ) : (
          <div className="grouped-tree-container">
            {Object.keys(grouped).map(pageName => {
              const pageKey = `page:${pageName}`;
              const pageExpanded = expandedPaths[pageKey] ?? true;

              return (
                <div key={pageName} className="tree-page-group" style={{ marginBottom: '14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div 
                    onClick={() => togglePath(pageKey)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {pageExpanded ? <ChevronDown size={16} style={{ color: 'var(--accent-cyan)' }} /> : <ChevronRight size={16} style={{ color: 'var(--accent-cyan)' }} />}
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>📄 Page: {pageName}</span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        {Object.keys(grouped[pageName]).length} Sections
                      </span>
                    </div>
                  </div>

                  {pageExpanded && (
                    <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.keys(grouped[pageName]).map(secName => {
                        const secKey = `sec:${pageName}:${secName}`;
                        const secExpanded = expandedPaths[secKey] ?? true;

                        return (
                          <div key={secName} style={{ borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '12px' }}>
                            <div 
                              onClick={() => togglePath(secKey)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', cursor: 'pointer', userSelect: 'none' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {secExpanded ? <ChevronDown size={14} style={{ color: '#c084fc' }} /> : <ChevronRight size={14} style={{ color: '#c084fc' }} />}
                                <span style={{ fontWeight: 700, color: '#c084fc', fontSize: '0.84rem' }}>🧩 Section: {secName}</span>
                                <span style={{ fontSize: '0.68rem', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', padding: '1px 6px', borderRadius: '8px' }}>
                                  {Object.keys(grouped[pageName][secName]).length} Components
                                </span>
                              </div>
                            </div>

                            {secExpanded && (
                              <div style={{ paddingLeft: '8px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.keys(grouped[pageName][secName]).map(compName => {
                                  const compKey = `comp:${pageName}:${secName}:${compName}`;
                                  const compExpanded = expandedPaths[compKey] ?? false; // Collapsed by default
                                  const items = grouped[pageName][secName][compName];
                                  const hasMissing = items.some(item => item.type === '❌ Missing');

                                  return (
                                    <div key={compName} style={{ background: 'rgba(0, 0, 0, 0.1)', padding: '6px 12px', borderRadius: '8px' }}>
                                      <div 
                                        onClick={() => togglePath(compKey)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', padding: '2px 0' }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {compExpanded ? <ChevronDown size={13} style={{ color: '#cbd5e1' }} /> : <ChevronRight size={13} style={{ color: '#cbd5e1' }} />}
                                          <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>🔘 Component: {compName}</span>
                                          <span style={{
                                            fontSize: '0.62rem',
                                            padding: '1px 6px',
                                            borderRadius: '6px',
                                            fontWeight: 700,
                                            background: hasMissing ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                            color: hasMissing ? '#f87171' : '#34d399'
                                          }}>
                                            {hasMissing ? '❌ Issues Found' : '✅ Correct'}
                                          </span>
                                        </div>
                                      </div>

                                      {compExpanded && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingLeft: '12px' }}>
                                          {items.map((item, idx) => {
                                            const isCorrect = item.type === '✅ Correct';
                                            return (
                                              <div 
                                                key={idx}
                                                style={{
                                                  background: 'rgba(0, 0, 0, 0.25)',
                                                  border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                                                  borderRadius: '8px',
                                                  padding: '10px 14px'
                                                }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isCorrect ? '#34d399' : '#f87171' }}>
                                                    {item.type}
                                                  </span>
                                                  <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{item.item}</span>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.78rem', background: 'rgba(0, 0, 0, 0.15)', padding: '8px 12px', borderRadius: '6px' }}>
                                                  <div>
                                                    <span style={{ color: 'var(--accent-cyan)', display: 'block', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.5px' }}>EXPECTED:</span>
                                                    <span style={{ color: '#f1f5f9' }}>{item.expected || 'None'}</span>
                                                  </div>
                                                  <div>
                                                    <span style={{ color: isCorrect ? '#34d399' : '#f87171', display: 'block', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.5px' }}>FOUND:</span>
                                                    <span style={{ color: '#f1f5f9' }}>{item.found || 'None'}</span>
                                                  </div>
                                                </div>

                                                {!isCorrect && (
                                                  <div style={{ marginTop: '8px', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #ef4444', fontSize: '0.74rem', color: '#cbd5e1' }}>
                                                    <span style={{ color: '#f87171', fontWeight: 700 }}>RECOMMENDATION:</span> {item.recommendation}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
