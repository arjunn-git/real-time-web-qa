import fs from 'fs';
import path from 'path';
import { parseDocumentToHierarchy } from '../server/utils/documentParser.ts';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const filePath = 'C:\\Users\\ambdpc11\\.gemini\\antigravity\\brain\\93f2382e-5965-4609-9368-25cbcdbf6972\\.user_uploaded\\media_1786359771998.pdf';

async function main() {
  const buffer = fs.readFileSync(filePath);
  try {
    const PDFParseClass = pdfParse.PDFParse || pdfParse;
    const parserInstance = new PDFParseClass({ data: buffer });
    const parseResult = await parserInstance.getText();
    const text = parseResult.text || '';
    
    console.log('--- PLAIN TEXT LENGTH ---', text.length);
    const result = parseDocumentToHierarchy(text);
    console.log('--- PARSED HIERARCHY ---');
    console.dir(result, { depth: null });
  } catch (e) {
    console.error(e);
  }
}

main();
