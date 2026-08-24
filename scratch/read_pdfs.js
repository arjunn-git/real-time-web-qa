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
        const data = await pdfParse(buffer);
        if (data.text.includes('gmrdecorators') || data.text.includes('GMR Decorators')) {
          console.log(`FOUND GMR Decorators in PDF: ${file}`);
          console.log('--- FIRST 1500 CHARACTERS ---');
          console.log(data.text.substring(0, 1500));
          console.log('-----------------------------');
        }
      } catch (e) {
        // console.error(file, e.message);
      }
    }
  }
}

main();
