import React from 'react';
import { 
  Rocket, 
  AlertTriangle, 
  AlertCircle, 
  FileX, 
  Link2Off, 
  MousePointerClick, 
  Search, 
  PhoneCall, 
  FormInput,
  FileCheck
} from 'lucide-react';
import type { DeliveryQaReport } from '../../server/services/deliveryQaEngine';

interface DeliveryStatusBannerProps {
  report: DeliveryQaReport;
  documentTitle: string;
  websiteTitle: string;
}

export const DeliveryStatusBanner: React.FC<DeliveryStatusBannerProps> = ({
  report,
  documentTitle,
  websiteTitle,
}) => {
  const getBannerConfig = (status: DeliveryQaReport['websiteDeliveryStatus']) => {
    switch (status) {
      case 'READY FOR DELIVERY':
        return {
          icon: <Rocket size={32} />,
          title: 'READY FOR DELIVERY',
          subtitle: 'All key content, buttons, links, forms, and SEO checks have passed.',
          className: 'banner-ready'
        };
      case 'MINOR FIXES REQUIRED':
        return {
          icon: <AlertTriangle size={32} />,
          title: 'MINOR FIXES REQUIRED',
          subtitle: `${report.totalIssuesCount} minor issue(s) detected. Fix missing links/CTAs before sending to client.`,
          className: 'banner-minor'
        };
      case 'MAJOR ISSUES FOUND':
        return {
          icon: <AlertCircle size={32} />,
          title: 'MAJOR ISSUES FOUND',
          subtitle: `Critical issues detected (${report.totalIssuesCount} total). Missing core content, pages, or contact info.`,
          className: 'banner-major'
        };
    }
  };

  const config = getBannerConfig(report.websiteDeliveryStatus);

  const metrics = report.summaryMetrics || {
    totalPagesChecked: report.pageWiseReport.length,
    totalSectionsChecked: report.pageWiseReport.length * 4,
    totalComponentsChecked: report.contentDiscrepancies.length,
    totalCorrect: report.contentDiscrepancies.filter(d => d.type === '✅ Correct').length,
    totalMissing: report.contentDiscrepancies.filter(d => d.type === '❌ Missing').length
  };

  return (
    <div className="delivery-summary-container">
      {/* HIGH-IMPACT STATUS BANNER */}
      <div className={`delivery-status-card ${config.className}`}>
        <div className="status-header-content">
          <div className="status-icon-wrapper">{config.icon}</div>
          <div className="status-text">
            <span className="meta-site-tag">{websiteTitle} vs {documentTitle}</span>
            <h2 className="status-title">{config.title}</h2>
            <p className="status-subtitle">{config.subtitle}</p>
          </div>
        </div>

        <div className="total-issues-pill">
          <span className="issues-count">{report.totalIssuesCount}</span>
          <span className="issues-label">Total Issues</span>
        </div>
      </div>

      {/* FINAL REPORT SUMMARY METRICS SCORECARD */}
      <div className="content-coverage-scorecard" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={22} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Deterministic QA Audit Summary
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Strict Document vs Website Comparison Results
              </p>
            </div>
          </div>
        </div>

        {/* 5 Deterministic Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Total Pages Checked</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#38bdf8' }}>{metrics.totalPagesChecked} Pages</span>
          </div>

          <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #c084fc' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Total Sections Checked</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#c084fc' }}>{metrics.totalSectionsChecked} Sections</span>
          </div>

          <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #facc15' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Total Components Checked</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#facc15' }}>{metrics.totalComponentsChecked} Items</span>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Total Correct</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#34d399' }}>✅ {metrics.totalCorrect} Correct</span>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Total Missing</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f87171' }}>❌ {metrics.totalMissing} Missing</span>
          </div>
        </div>
      </div>

      {/* SUMMARY OVERVIEW METRICS */}
      <div className="delivery-metrics-grid">
        <div className="delivery-metric-card">
          <div className="metric-icon red"><FileX size={18} /></div>
          <div>
            <span className="metric-num">{report.counters.missingContent}</span>
            <span className="metric-title">Missing Content</span>
          </div>
        </div>

        <div className="delivery-metric-card">
          <div className="metric-icon amber"><Link2Off size={18} /></div>
          <div>
            <span className="metric-num">{report.counters.brokenLinks}</span>
            <span className="metric-title">Broken Links</span>
          </div>
        </div>

        <div className="delivery-metric-card">
          <div className="metric-icon purple"><MousePointerClick size={18} /></div>
          <div>
            <span className="metric-num">{report.counters.missingButtons}</span>
            <span className="metric-title">Missing Buttons (#)</span>
          </div>
        </div>

        <div className="delivery-metric-card">
          <div className="metric-icon cyan"><Search size={18} /></div>
          <div>
            <span className="metric-num">{report.counters.seoIssues}</span>
            <span className="metric-title">SEO Issues</span>
          </div>
        </div>

        <div className="delivery-metric-card">
          <div className="metric-icon green"><PhoneCall size={18} /></div>
          <div>
            <span className="metric-num">{report.counters.contactIssues}</span>
            <span className="metric-title">Contact Info Issues</span>
          </div>
        </div>

        <div className="delivery-metric-card">
          <div className="metric-icon indigo"><FormInput size={18} /></div>
          <div>
            <span className="metric-num">{report.counters.formIssues}</span>
            <span className="metric-title">Form Issues</span>
          </div>
        </div>
      </div>
    </div>
  );
};
