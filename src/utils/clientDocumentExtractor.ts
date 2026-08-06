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
 * Extracts decompressed text page-by-page from PDF files using PDF.js
 */
export async function extractPdfTextViaPdfJs(file: File): Promise<string> {
  const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
  if (!pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF.js CDN'));
      document.head.appendChild(script);
    });
  }

  const pdfjs = (window as any)['pdfjs-dist/build/pdf'];
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Sort text blocks by transform coordinates to preserve reading order: Top-to-Bottom, Left-to-Right
    const items: any[] = textContent.items;
    items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff; // Different line
      return a.transform[4] - b.transform[4]; // Same line, sort left-to-right
    });

    const pageText = items.map(item => item.str).join('\n');
    fullText += pageText + '\n\f';
  }
  return fullText;
}

/**
 * Checks if a text line is a designer brief instruction or metadata block rather than website page body copy
 */
export function isButtonLine(line: string): boolean {
  const clean = line.toLowerCase().trim();
  if (clean.includes('hero image button:')) return true;
  if (clean.startsWith('button:')) return true;
  if (clean.includes('] >') && clean.startsWith('[')) return true;
  if (clean.includes('> link to')) return true;
  return false;
}

export function isMetadataOrInstructionLine(line: string): boolean {
  const clean = line.toLowerCase().trim();
  if (!clean) return true;

  // Exclude page meta descriptors, SEO requirements, and layout instructions
  if (clean.includes('page/meta title') || clean.includes('page title')) return true;
  if (clean.includes('meta description')) return true;
  if (clean.includes('h1 (hero') || clean.includes('h1:')) return true;
  if (clean.includes('note for the designer') || clean.includes('notes for the designer')) return true;
  if (clean.includes('notes for the qa') || clean.includes('notes for qa')) return true;
  
  // Exclude navigation/design action notations like "Text > page"
  if (clean.includes('text > page')) return true;
  if (clean.includes('yell.com/reviews')) return true;
  if (clean.match(/^notes?\s+for\s+/i)) return true;
  if (clean.includes('site map:')) return true;
  if (clean.includes('google my business:')) return true;
  if (clean.includes('review us:')) return true;
  if (clean.includes('enquire now')) return true;

  // Exclude contact headers if they are just labeled fields:
  if (clean.startsWith('company name:')) return true;
  if (clean.startsWith('main address')) return true;
  if (clean.startsWith('social media')) return true;
  if (clean.startsWith('open 24/7')) return true;

  // Exclude CTA fields
  if (clean.startsWith('title:') && clean.length < 120) return true;
  if (clean.startsWith('text:') && clean.length < 200) return true;
  
  return false;
}

export function parseDocumentToHierarchyClient(rawText: string, html?: string): { pages: any[] } {
  const pages: any[] = [];

  // Parse HTML if available via browser DOMParser
  if (html && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      let currentPage: any = null;
      let currentSection: any = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };

      const commitSection = () => {
        if (!currentPage) return;
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

        // Check for page divider, e.g. "Home (Page 1)"
        const pageMatch = textVal.match(/^(.*?)\s*\(Page\s*(\d+)\)$/i);
        if (pageMatch) {
          if (currentPage) {
            commitSection();
            if (currentPage.sections.length > 0) {
              pages.push({ ...currentPage });
            }
          }
          currentPage = { name: pageMatch[1].trim(), sections: [] };
          currentSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
          return;
        }

        if (tagName === 'hr') {
          if (currentPage) {
            commitSection();
            if (currentPage.sections.length > 0) {
              pages.push({ ...currentPage });
            }
            currentPage = { name: `Page ${pages.length + 1}`, sections: [] };
            currentSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
          }
          return;
        }

        if (!currentPage) return; // Skip content before first page division

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
            const liText = (li.textContent || '').trim();
            if (liText && !isMetadataOrInstructionLine(liText)) {
              currentSection.lists.push(liText);
            }
          });
          return;
        }

        if (tagName === 'p' && textVal) {
          if (isMetadataOrInstructionLine(textVal)) return;
          if (isButtonLine(textVal)) {
            currentSection.buttons.push(textVal);
          } else {
            currentSection.paragraphs.push(textVal);
          }
        }
      });

      if (currentPage) {
        commitSection();
        if (currentPage.sections.length > 0) {
          pages.push(currentPage);
        }
      }

      if (pages.length > 0) return { pages };
    } catch (e) {
      console.warn('Frontend DOM parsing failed, falling back to text split', e);
    }
  }

  // Plaintext fallback splits by custom Page dividers
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let currentPage: any = null;
  let currentSection: any = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };

  const commitSectionText = () => {
    if (!currentPage) return;
    if (currentSection.heading || currentSection.paragraphs.length > 0 || currentSection.lists.length > 0 || currentSection.buttons.length > 0) {
      currentPage.sections.push({ ...currentSection });
    }
  };

  const commitPageText = () => {
    if (currentPage) {
      commitSectionText();
      if (currentPage.sections.length > 0) {
        pages.push(currentPage);
      }
    }
  };

  lines.forEach(line => {
    const pageMatch = line.match(/^(.*?)\s*\(Page\s*(\d+)\)$/i);
    if (pageMatch) {
      commitPageText();
      const pageName = pageMatch[1].trim();
      currentPage = { name: pageName, sections: [] };
      currentSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
      return;
    }

    if (!currentPage) return; // Skip global brief parameters

    if (isMetadataOrInstructionLine(line)) return;

    if (isButtonLine(line)) {
      currentSection.buttons.push(line);
      return;
    }

    const headingMatch = line.match(/^#{1,6}\s*(.+)$/) || line.match(/^\[(.+)\]$/);
    const isHeading = headingMatch || (line.length < 50 && line === line.toUpperCase() && !line.match(/[.!?]$/));
    if (isHeading) {
      commitSectionText();
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

  commitPageText();

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
      const extractedPdfText = await extractPdfTextViaPdfJs(file);
      if (extractedPdfText && extractedPdfText.length > 5) {
        const structuredContent = parseDocumentToHierarchyClient(extractedPdfText);
        return { title: name, rawText: extractedPdfText, structuredContent };
      }
    } catch (e) {
      console.warn('Client PDF extraction using PDF.js failed, falling back to FileReader:', e);
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
