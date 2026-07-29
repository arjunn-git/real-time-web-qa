import React from 'react';
import { Rocket, AlertTriangle, AlertCircle, FileX, Link2Off, MousePointerClick, Search, PhoneCall, FormInput } from 'lucide-react';
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
