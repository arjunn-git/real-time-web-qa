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
    const text = result.value ? result.value.trim() : '';
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
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text ? pdfData.text.trim() : '';
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
    const text = buffer.toString('utf-8').trim();
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
  const fallbackText = buffer.toString('utf-8').trim();
  if (!fallbackText || fallbackText.length < 5) {
    throw new Error(`Unsupported or unreadable file format "${ext}". Please upload a DOCX, PDF, TXT, or MD file.`);
  }

  return {
    title: filename,
    rawText: fallbackText,
    fileType: ext.toUpperCase() || 'FILE'
  };
}
