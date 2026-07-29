import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Layout } from 'lucide-react';
import type { PageValidationResult } from '../../server/services/deliveryQaEngine';

interface PageWiseReportProps {
  pages: PageValidationResult[];
}

export const PageWiseReport: React.FC<PageWiseReportProps> = ({ pages }) => {
  const getStatusBadge = (status: PageValidationResult['status']) => {
    switch (status) {
      case 'Passed':
        return { label: '✓ Passed', className: 'status-passed' };
      case 'Requires Changes':
        return { label: '⚠ Requires Changes', className: 'status-warning' };
      case 'Missing Page':
        return { label: '✗ Missing Page', className: 'status-missing' };
    }
  };

  return (
    <div className="page-report-container">
      <div className="section-header-title">
        <Layout size={22} className="section-icon" />
        <div>
          <h3>1. Page-Wise Content Validation</h3>
          <p>Automatic inspection across all detected website pages</p>
        </div>
      </div>

      <div className="pages-grid">
        {pages.map((page, idx) => {
          const badge = getStatusBadge(page.status);
          return (
            <div key={idx} className={`page-card ${badge.className}`}>
              <div className="page-card-header">
                <h4 className="page-title">{page.name}</h4>
                <span className={`page-status-badge ${badge.className}`}>{badge.label}</span>
              </div>

              <div className="page-checklist">
                {/* PASSED CHECKS */}
                {page.passedChecks.map((item, i) => (
                  <div key={i} className="check-line passed">
                    <CheckCircle2 size={15} />
                    <span>{item}</span>
                  </div>
                ))}

                {/* MISSING CONTENT / WARNINGS */}
                {page.missingContent.map((item, i) => (
                  <div key={i} className="check-line warning">
                    <AlertTriangle size={15} />
                    <span>Missing: {item}</span>
                  </div>
                ))}

                {/* MISSING SECTIONS */}
                {page.missingSections.map((item, i) => (
                  <div key={i} className="check-line error">
                    <XCircle size={15} />
                    <span>Missing Section: {item}</span>
                  </div>
                ))}

                {/* IF COMPLETELY PASSED */}
                {page.status === 'Passed' && page.missingContent.length === 0 && (
                  <>
                    <div className="check-line passed">
                      <CheckCircle2 size={15} />
                      <span>Content Complete</span>
                    </div>
                    <div className="check-line passed">
                      <CheckCircle2 size={15} />
                      <span>Buttons Working</span>
                    </div>
                    <div className="check-line passed">
                      <CheckCircle2 size={15} />
                      <span>SEO Passed</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
