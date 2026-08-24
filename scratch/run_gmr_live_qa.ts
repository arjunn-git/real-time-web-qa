import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDocumentToHierarchy } from '../server/utils/documentParser.ts';
import { scrapeFullWebsite } from '../server/services/websiteScraper.ts';
import { runDeliveryQaEngine } from '../server/services/deliveryQaEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Loading GMR Decorators spec file...');
  const specPath = path.join(__dirname, 'gmr_spec.txt');
  const specText = fs.readFileSync(specPath, 'utf8');

  console.log('🔍 Parsing spec text to hierarchy...');
  const structuredContent = parseDocumentToHierarchy(specText);
  console.log(`Parsed ${structuredContent.pages.length} pages from specification document.`);

  const docFormat = {
    docId: 'gmr_spec.txt',
    rawText: specText,
    title: 'GMR Decorators Master Specification',
    structuredContent
  };

  const targetWebsite = 'https://www.gmrdecorators.co.uk/';
  console.log(`🌐 Scrape and validate live website: ${targetWebsite}...`);
  
  try {
    const siteData = await scrapeFullWebsite(targetWebsite);
    console.log(`Scraped ${siteData.pages.length} pages from website.`);

    console.log('⚡ Running Delivery QA Engine comparison...');
    const report = runDeliveryQaEngine(docFormat, siteData);

    const reportPath = path.join(__dirname, 'gmr_live_qa_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`✅ Saved full report to: ${reportPath}`);

    // Generate markdown summary
    let mdSummary = `# 📄 GMR Decorators QA Content Validation Report\n\n`;
    mdSummary += `**Website URL**: ${targetWebsite}\n`;
    mdSummary += `**Pages Checked**: ${siteData.pages.length} pages\n`;
    mdSummary += `**Overall Delivery Status**: \`${report.websiteDeliveryStatus}\`\n\n`;

    mdSummary += `## 1. Discrepancies Summary\n`;
    const missing = report.contentDiscrepancies.filter(d => d.type === '❌ Missing');
    const correct = report.contentDiscrepancies.filter(d => d.type === '✅ Correct');
    
    mdSummary += `* **Total Matches**: ${correct.length}\n`;
    mdSummary += `* **Total Mismatches / Typos**: ${missing.length}\n\n`;

    if (missing.length > 0) {
      mdSummary += `### ❌ List of Content Discrepancies & Recommendations:\n`;
      missing.forEach(d => {
        mdSummary += `#### Page: \`${d.page}\` | Section: \`${d.section}\` (${d.component})\n`;
        mdSummary += `* **Expected (Spec)**: \`${d.expected}\`\n`;
        mdSummary += `* **Found (Web)**: \`${d.found}\`\n`;
        if (d.recommendation) {
          mdSummary += `* **Recommendation**: ${d.recommendation}\n`;
        }
        mdSummary += `\n`;
      });
    } else {
      mdSummary += `✅ No discrepancies found! The website copy perfectly matches the specification document.\n\n`;
    }

    mdSummary += `## 2. Contact Information Audit\n`;
    mdSummary += `* **Phone**: Expected \`${report.contactInfoReport.phone.expected}\` | Found \`${report.contactInfoReport.phone.found}\` | Status: **${report.contactInfoReport.phone.status}**\n`;
    mdSummary += `* **Email**: Expected \`${report.contactInfoReport.email.expected}\` | Found \`${report.contactInfoReport.email.found}\` | Status: **${report.contactInfoReport.email.status}**\n`;
    mdSummary += `* **Address**: Expected \`${report.contactInfoReport.address.expected}\` | Found \`${report.contactInfoReport.address.found}\` | Status: **${report.contactInfoReport.address.status}**\n\n`;

    mdSummary += `### Social Media Channels:\n`;
    report.contactInfoReport.socials.forEach(s => {
      mdSummary += `* **${s.platform}**: Expected \`${s.expected}\` | Found \`${s.found}\` | Status: **${s.status}**\n`;
    });

    mdSummary += `\n## 3. Buttons & Navigation Check\n`;
    mdSummary += `* **Total Buttons Found**: ${report.buttonsReport.totalCount}\n`;
    mdSummary += `* **Valid Actions**: ${report.buttonsReport.validCount}\n`;
    mdSummary += `* **Missing Actions**: ${report.buttonsReport.missingActionCount}\n`;
    mdSummary += `* **Broken Links**: ${report.buttonsReport.brokenCount}\n\n`;

    const summaryPath = path.join(__dirname, 'gmr_live_qa_summary.md');
    fs.writeFileSync(summaryPath, mdSummary, 'utf8');
    console.log(`✅ Saved markdown summary report to: ${summaryPath}`);

    console.log('\n--- REPORT SUMMARY ---');
    console.log(`Status: ${report.websiteDeliveryStatus}`);
    console.log(`Matches: ${correct.length} | Discrepancies: ${missing.length}`);
    console.log('----------------------');

  } catch (err) {
    console.error('Fatal execution error:', err);
  }
}

main();
