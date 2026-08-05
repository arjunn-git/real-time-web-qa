import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export interface ExtractedDocumentData {
  title: string;
  rawText: string;
  fileType: string;
}

/**
 * Sanitizes PDF text to strip out raw binary PDF headers, metadata tags, and corrupt bytes
 */
export function cleanPdfBinaryNoise(text: string): string {
  if (!text) return '';
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      if (line.startsWith('%PDF')) return false;
      if (line.includes('Skia/PDF') || line.includes('Google Docs Renderer') || line.includes('pdf-parse')) return false;
      if (line.match(/^%[^\w\s]*/) || line.match(/^%\uFFFD+/)) return false;
      if (line.startsWith('/Producer') || line.startsWith('/CreationDate') || line.startsWith('/ModDate') || line.startsWith('/Creator') || line.startsWith('/Title')) return false;
      if (line.match(/^\/[A-Z][a-zA-Z0-9]*\b/)) return false;
      if (line.startsWith('<<') || line.endsWith('>>') || line.includes('endstream') || line.includes('endobj')) return false;
      if (line.match(/^[0-9]+\s+[0-9]+\s+obj/)) return false;
      if (line.match(/^xref\b/) || line.match(/^trailer\b/) || line.match(/^startxref\b/)) return false;
      const nonPrintableCount = (line.match(/[\uFFFD\x00-\x08\x0E-\x1F\x7F-\x9F]/g) || []).length;
      if (nonPrintableCount > line.length * 0.2) return false;
      return true;
    })
    .join('\n')
    .replace(/[\uFFFD\x00-\x08\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts plain text from uploaded DOCX, PDF, TXT, or MD file buffers
 */
export async function extractTextFromFileBuffer(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<ExtractedDocumentData> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (ext === 'docx' || mimetype.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer });
    const text = cleanPdfBinaryNoise(result.value ? result.value.trim() : '');
    if (!text || text.length < 5) {
      throw new Error(`The uploaded DOCX file "${filename}" appears to be empty or contains no readable text.`);
    }
    return {
      title: filename,
      rawText: text,
      fileType: 'DOCX'
    };
  }

  if (ext === 'pdf' || mimetype.includes('pdf')) {
    let rawPdfText = '';
    try {
      const pdfData = await pdfParse(buffer);
      rawPdfText = pdfData.text || '';
    } catch (e) {
      rawPdfText = buffer.toString('utf-8');
    }

    const text = cleanPdfBinaryNoise(rawPdfText);
    if (!text || text.length < 5) {
      throw new Error(`The uploaded PDF file "${filename}" appears to be empty or contains no readable text.`);
    }
    return {
      title: filename,
      rawText: text,
      fileType: 'PDF'
    };
  }

  if (ext === 'txt' || ext === 'md' || ext === 'markdown' || mimetype.includes('text/')) {
    const text = cleanPdfBinaryNoise(buffer.toString('utf-8').trim());
    if (!text || text.length < 5) {
      throw new Error(`The uploaded file "${filename}" appears to be empty.`);
    }
    return {
      title: filename,
      rawText: text,
      fileType: ext.toUpperCase()
    };
  }

  // Generic text fallback
  const fallbackText = cleanPdfBinaryNoise(buffer.toString('utf-8').trim());
  if (!fallbackText || fallbackText.length < 5) {
    throw new Error(`Unsupported or unreadable file format "${ext}". Please upload a DOCX, PDF, TXT, or MD file.`);
  }

  return {
    title: filename,
    rawText: fallbackText,
    fileType: ext.toUpperCase() || 'FILE'
  };
}
