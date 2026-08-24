import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const specPath = path.join(__dirname, 'gmr_spec.txt');
  const specText = fs.readFileSync(specPath, 'utf8');

  console.log('Sending validation request to remote Render backend...');
  try {
    const res = await axios.post('https://real-time-web-qa.onrender.com/api/validate-paste', {
      pastedContent: specText,
      websiteUrl: 'https://www.gmrdecorators.co.uk/'
    });

    console.log('STATUS:', res.status);
    console.log('SUCCESS:', res.data.success);
    const report = res.data.report;
    console.log('REPORT SUMMARY STATUS:', report.websiteDeliveryStatus);
    
    // Find if H1 Hero Heading discrepancy is in the report
    const h1Disc = report.contentDiscrepancies.find((d: any) => d.item === 'H1 Hero Heading' || d.expected === 'Property maintenance in Sudbury,');
    if (h1Disc) {
      console.log('✅ FOUND H1 DISCREPANCY ON REMOTE RENDER SERVER!');
      console.dir(h1Disc);
    } else {
      console.log('❌ H1 DISCREPANCY NOT FOUND ON REMOTE RENDER SERVER.');
      console.log('Discrepancies found:', report.contentDiscrepancies.map((d: any) => d.item).slice(0, 10));
    }
  } catch (err: any) {
    console.error('Remote request failed:', err.message);
    if (err.response) {
      console.log('Error Data:', err.response.data);
    }
  }
}

main();
