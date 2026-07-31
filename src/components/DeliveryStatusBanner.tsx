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
  PieChart
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

  // Content Coverage Calculations
  const totalSpecs = report.contentDiscrepancies.length;
  const missingCount = report.contentDiscrepancies.filter(d => d.type === 'Missing Content').length;
  const matchedCount = report.contentDiscrepancies.filter(d => d.type === 'Matched Content').length;
  const formattingCount = report.contentDiscrepancies.filter(d => d.type === 'Minor Formatting Difference' || d.type === 'Partial Match').length;
  const incorrectCount = report.contentDiscrepancies.filter(d => d.type === 'Incorrect Content').length;

  const presentCount = matchedCount + formattingCount;
  const presentPercent = totalSpecs > 0 ? Math.round((presentCount / totalSpecs) * 100) : 100;
  const missingPercent = 100 - presentPercent;

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

      {/* WHOLE WEBSITE CONTENT COVERAGE & COMPLETION SCORECARD */}
      <div className="content-coverage-scorecard" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieChart size={22} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Whole Website Content Coverage Audit
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Total Document Specifications vs Live Website Content Breakdown
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '6px 14px', borderRadius: '10px', textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Content Present</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>{presentPercent}%</span>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '6px 14px', borderRadius: '10px', textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Content Missing</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f87171' }}>{missingPercent}%</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{ height: '14px', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '8px', overflow: 'hidden', display: 'flex', marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ width: `${(matchedCount / (totalSpecs || 1)) * 100}%`, background: '#10b981' }} title="Matched Content" />
          <div style={{ width: `${(formattingCount / (totalSpecs || 1)) * 100}%`, background: '#3b82f6' }} title="Wording Differences" />
          <div style={{ width: `${(incorrectCount / (totalSpecs || 1)) * 100}%`, background: '#f59e0b' }} title="Incorrect Content" />
          <div style={{ width: `${(missingCount / (totalSpecs || 1)) * 100}%`, background: '#ef4444' }} title="Missing Content" />
        </div>

        {/* Breakdown Stats Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Exact Matched Specs</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{matchedCount} / {totalSpecs} Items</span>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Wording / Formatting Diff</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>{formattingCount} Items</span>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Missing Content Specs</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>{missingCount} / {totalSpecs} Items</span>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Incorrect / Mismatched</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>{incorrectCount} Items</span>
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
