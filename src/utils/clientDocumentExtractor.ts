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

export async function extractTextFromClientFile(file: File): Promise<{ title: string; rawText: string }> {
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'docx' || ext === 'doc') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const cleaned = cleanPdfBinaryNoise(result.value || '');
      if (cleaned && cleaned.length > 10) {
        return { title: name, rawText: cleaned };
      }
    } catch (e) {
      console.warn('Client mammoth extraction failed, falling back to text reader:', e);
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '').trim();
      const cleaned = cleanPdfBinaryNoise(text);
      resolve({ title: name, rawText: cleaned || `Content from ${name}` });
    };
    reader.onerror = () => {
      resolve({ title: name, rawText: `Content from ${name}` });
    };
    reader.readAsText(file);
  });
}
