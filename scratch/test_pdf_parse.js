import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const uploadDir = 'C:\\Users\\ambdpc11\\.gemini\\antigravity\\brain\\93f2382e-5965-4609-9368-25cbcdbf6972\\.user_uploaded';

async function main() {
  const files = fs.readdirSync(uploadDir);
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const filePath = path.join(uploadDir, file);
      const buffer = fs.readFileSync(filePath);
      try {
        const PDFParseClass = pdfParse.PDFParse || pdfParse;
        const parserInstance = new PDFParseClass({ data: buffer });
        const parseResult = await parserInstance.getText();
        const text = parseResult.text || '';
        console.log(`SUCCESS parsing ${file} with pdf-parse PDFParse constructor! Length: ${text.length}`);
        console.log('--- PREVIEW ---');
        console.log(text.substring(0, 800));
        console.log('-----------------------------');
      } catch (e) {
        console.error(`FAILED parsing ${file}:`, e.message);
      }
    }
  }
}

main();
