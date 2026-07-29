import React, { useState } from 'react';
import { Copy, Check, Printer, FileText } from 'lucide-react';
import type { DeliveryQaReport } from '../../server/services/deliveryQaEngine';

interface ExportToolbarProps {
  report: DeliveryQaReport;
  documentTitle: string;
  websiteTitle: string;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  report,
  documentTitle,
  websiteTitle,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);

  const generateMarkdownSummary = () => {
    let md = `# PRE-CLIENT WEBSITE DELIVERY QA REPORT\n`;
    md += `**Website:** ${websiteTitle}\n`;
    md += `**Master Copy Doc:** ${documentTitle}\n`;
    md += `**Audit Date:** ${new Date().toLocaleString()}\n`;
    md += `**FINAL DELIVERY STATUS:** ${report.websiteDeliveryStatus}\n\n`;

    md += `## SUMMARY ISSUES OVERVIEW\n`;
    md += `- Total Issues Found: ${report.totalIssuesCount}\n`;
    md += `- Missing Content: ${report.counters.missingContent}\n`;
    md += `- Broken Links: ${report.counters.brokenLinks}\n`;
    md += `- Missing Buttons (#): ${report.counters.missingButtons}\n`;
    md += `- SEO Issues: ${report.counters.seoIssues}\n`;
    md += `- Contact Info Issues: ${report.counters.contactIssues}\n`;
    md += `- Form Issues: ${report.counters.formIssues}\n\n`;

    md += `## PAGE-WISE VALIDATION\n`;
    report.pageWiseReport.forEach((page) => {
      md += `### ${page.name} — Status: ${page.status}\n`;
      page.passedChecks.forEach((c) => (md += `- ✓ ${c}\n`));
      page.missingContent.forEach((m) => (md += `- ⚠ Missing: ${m}\n`));
      page.missingSections.forEach((s) => (md += `- ✗ Missing Section: ${s}\n`));
      md += `\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownSummary();
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="export-toolbar-container">
      <div className="export-info">
        <FileText size={18} />
        <span>Client Delivery QA Certificate</span>
      </div>

      <div className="export-buttons-group">
        <button className="export-btn print-btn" onClick={handlePrintPdf}>
          <Printer size={16} />
          <span>Save Client PDF Certificate</span>
        </button>

        <button className="export-btn md-btn" onClick={handleCopyMarkdown}>
          {copiedMd ? (
            <>
              <Check size={16} />
              <span>Copied Report!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copy Client Markdown Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
