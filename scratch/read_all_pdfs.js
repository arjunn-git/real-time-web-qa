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
        const parseFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || require('pdf-parse');
        const data = await parseFn(buffer);
        console.log(`File: ${file} | Length: ${data.text.length}`);
        console.log(data.text.substring(0, 500).replace(/\n/g, ' '));
        console.log('-----------------------------');
      } catch (e) {
        console.error(file, e.message);
      }
    }
  }
}

main();
