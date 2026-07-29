import mammoth from 'mammoth';

export async function extractTextFromClientFile(file: File): Promise<{ title: string; rawText: string }> {
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'docx' || ext === 'doc') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 10) {
        return { title: name, rawText: result.value.trim() };
      }
    } catch (e) {
      console.warn('Client mammoth extraction failed, falling back to text reader:', e);
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '').trim();
      resolve({ title: name, rawText: text || `Content from ${name}` });
    };
    reader.onerror = () => {
      resolve({ title: name, rawText: `Content from ${name}` });
    };
    reader.readAsText(file);
  });
}
