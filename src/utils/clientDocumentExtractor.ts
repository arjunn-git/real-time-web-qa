import mammoth from 'mammoth';

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
 * Extracts real text strings from PDF Tj and TJ text stream operators
 */
export function extractPdfTextFromRawArrayBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    str += String.fromCharCode.apply(null, Array.from(chunk));
  }

  const textChunks: string[] = [];

  // Extract text inside (string) Tj or (string) TJ
  const tjRegex = /\(([^)]+)\)\s*T[jJ]/g;
  let match;
  while ((match = tjRegex.exec(str)) !== null) {
    const rawSnippet = match[1]
      .replace(/\\\( /g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .trim();
    if (rawSnippet && rawSnippet.length > 1 && !rawSnippet.startsWith('/')) {
      textChunks.push(rawSnippet);
    }
  }

  // Extract text inside array TJ: [ (text1) 12 (text2) ] TJ
  const arrayTjRegex = /\[\s*((?:\([^)]*\)\s*|-?\d+\s*)+)\]\s*TJ/gi;
  while ((match = arrayTjRegex.exec(str)) !== null) {
    const innerArray = match[1];
    const subMatches = innerArray.match(/\(([^)]+)\)/g);
    if (subMatches) {
      const combined = subMatches
        .map(m => m.slice(1, -1))
        .join('')
        .trim();
      if (combined && combined.length > 1) {
        textChunks.push(combined);
      }
    }
  }

  if (textChunks.length > 0) {
    return cleanPdfBinaryNoise(textChunks.join('\n'));
  }

  return cleanPdfBinaryNoise(str);
}

export function parseDocumentToHierarchyClient(rawText: string, html?: string): { pages: any[] } {
  const pages: any[] = [];

  // Parse HTML if available via browser DOMParser
  if (html && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      let currentPage: any = { name: 'Home', sections: [] };
      let currentSection: any = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };

      const commitSection = () => {
        if (currentSection.heading || currentSection.paragraphs.length > 0 || currentSection.lists.length > 0 || currentSection.buttons.length > 0) {
          currentPage.sections.push({ ...currentSection });
          currentSection = { name: 'General', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
        }
      };

      doc.body.childNodes.forEach((node) => {
        const el = node as HTMLElement;
        if (el.nodeType !== 1) return; // Only element nodes
        const tagName = el.tagName.toLowerCase();
        const textVal = (el.textContent || '').trim();

        if (tagName === 'hr') {
          commitSection();
          if (currentPage.sections.length > 0) {
            pages.push({ ...currentPage });
          }
          currentPage = { name: `Page ${pages.length + 1}`, sections: [] };
          currentSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
          return;
        }

        if (/^h[1-6]$/.test(tagName)) {
          commitSection();
          currentSection.name = textVal;
          currentSection.heading = textVal;
          return;
        }

        if (tagName === 'table') {
          const tableRows: string[][] = [];
          el.querySelectorAll('tr').forEach((tr) => {
            const rowData: string[] = [];
            tr.querySelectorAll('td, th').forEach((cell) => {
              rowData.push((cell.textContent || '').trim());
            });
            if (rowData.length > 0) tableRows.push(rowData);
          });
          currentSection.tables = currentSection.tables || [];
          currentSection.tables.push(tableRows);
          return;
        }

        if (tagName === 'ul' || tagName === 'ol') {
          el.querySelectorAll('li').forEach((li) => {
            currentSection.lists.push((li.textContent || '').trim());
          });
          return;
        }

        if (tagName === 'p' && textVal) {
          currentSection.paragraphs.push(textVal);
        }
      });

      commitSection();
      if (currentPage.sections.length > 0) {
        pages.push(currentPage);
      }

      if (pages.length > 0) return { pages };
    } catch (e) {
      console.warn('Frontend DOM parsing failed, falling back to text split', e);
    }
  }

  // Plaintext fallback splits by form feed (\f)
  const pdfPages = rawText.split(/\x0c|\f/);
  pdfPages.forEach((pageText, pIdx) => {
    const lines = pageText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const page: any = { name: pIdx === 0 ? 'Home' : `Page ${pIdx + 1}`, sections: [] };
    let currentSection: any = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };

    lines.forEach(line => {
      const headingMatch = line.match(/^#{1,6}\s*(.+)$/) || line.match(/^\[(.+)\]$/);
      const isHeading = headingMatch || (line.length < 50 && line === line.toUpperCase() && !line.match(/[.!?]$/));
      if (isHeading) {
        if (currentSection.heading || currentSection.paragraphs.length > 0 || currentSection.lists.length > 0 || currentSection.buttons.length > 0) {
          page.sections.push({ ...currentSection });
        }
        const headingVal = headingMatch ? headingMatch[1] : line;
        currentSection = { name: headingVal, heading: headingVal, paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
        return;
      }
      if (line.match(/^[-*•\d+.]\s*(.+)$/)) {
        currentSection.lists.push(line);
      } else {
        currentSection.paragraphs.push(line);
      }
    });

    if (currentSection.heading || currentSection.paragraphs.length > 0 || currentSection.lists.length > 0) {
      page.sections.push(currentSection);
    }
    pages.push(page);
  });

  return { pages };
}

export async function extractTextFromClientFile(file: File): Promise<{ title: string; rawText: string; structuredContent?: any }> {
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'docx' || ext === 'doc') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      
      const cleaned = cleanPdfBinaryNoise(textResult.value || '');
      const html = htmlResult.value || '';
      
      if (cleaned && cleaned.length > 5) {
        const structuredContent = parseDocumentToHierarchyClient(cleaned, html);
        return { title: name, rawText: cleaned, structuredContent };
      }
    } catch (e) {
      console.warn('Client mammoth extraction failed, falling back to text reader:', e);
    }
  }

  if (ext === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const extractedPdfText = extractPdfTextFromRawArrayBuffer(arrayBuffer);
      if (extractedPdfText && extractedPdfText.length > 5) {
        const structuredContent = parseDocumentToHierarchyClient(extractedPdfText);
        return { title: name, rawText: extractedPdfText, structuredContent };
      }
    } catch (e) {
      console.warn('Client PDF ArrayBuffer extraction failed:', e);
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '').trim();
      const cleaned = cleanPdfBinaryNoise(text);
      const structuredContent = parseDocumentToHierarchyClient(cleaned);
      resolve({ title: name, rawText: cleaned || `Content from ${name}`, structuredContent });
    };
    reader.onerror = () => {
      resolve({ title: name, rawText: `Content from ${name}` });
    };
    reader.readAsText(file);
  });
}
