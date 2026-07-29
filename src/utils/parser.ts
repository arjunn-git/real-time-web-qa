import type { ParsedItem, SectionType, SubCategoryType } from '../types/qa';

/**
 * Detects section type from text heading or tag attributes
 */
export function detectSection(headingText: string, context: string = ''): SectionType {
  const combined = (headingText + ' ' + context).toLowerCase();

  if (combined.match(/\b(hero|welcome|main banner|banner|headline)\b/i)) return 'Hero';
  if (combined.match(/\b(about|about us|who we are|our story|company|mission|vision)\b/i)) return 'About';
  if (combined.match(/\b(service|services|what we do|solutions|offerings|capabilities|survey|surveys)\b/i)) return 'Services';
  if (combined.match(/\b(process|how it works|steps|workflow|how we work|procedure)\b/i)) return 'Process';
  if (combined.match(/\b(faq|faqs|frequently asked|questions|q&a)\b/i)) return 'FAQs';
  if (combined.match(/\b(testimonial|testimonials|reviews|what clients say|feedback)\b/i)) return 'Testimonials';
  if (combined.match(/\b(contact|contact us|get in touch|reach us|address|phone|email)\b/i)) return 'Contact';
  if (combined.match(/\b(footer|copyright|all rights reserved|terms|privacy)\b/i)) return 'Footer';
  if (combined.match(/\b(nav|navigation|menu|header menu)\b/i)) return 'Navigation';
  if (combined.match(/\b(form|forms|inquiry form|booking form)\b/i)) return 'Forms';
  if (combined.match(/\b(cta|call to action|book now|schedule|get started|claim|survey)\b/i)) return 'CTA';

  return 'General';
}

/**
 * Categorizes a string item into SubCategoryType
 */
export function categorizeItem(text: string, currentSection: SectionType, isHeading: boolean = false): SubCategoryType {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Contact details
  if (lower.match(/(\+?\d[\d\s\-]{8,}\d)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|phone:|email:|address:/i)) {
    return 'Contact Information';
  }

  // FAQ detection (contains question mark or Q:)
  if (lower.startsWith('q:') || lower.endsWith('?') || currentSection === 'FAQs') {
    return 'FAQ';
  }

  // CTA detection
  if (lower.match(/^(book|schedule|get|claim|call|contact|start|submit|download|request|order|buy)\b/i) || clean.length < 35 && lower.match(/\b(now|free|survey|quote|today|consultation)\b/i)) {
    return 'CTA';
  }

  // Service detection
  if (currentSection === 'Services') {
    return 'Service';
  }

  // Footer detection
  if (currentSection === 'Footer' || lower.match(/(copyright|privacy policy|terms & conditions|all rights reserved)/i)) {
    return 'Footer Content';
  }

  if (isHeading) {
    return 'Heading';
  }

  return 'Paragraph';
}

/**
 * Normalizes text for comparison (lowercasing, single spacing, trimming smart quotes)
 */
export function normalizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses raw document text/markdown into structured ParsedItem array
 */
export function parseDocumentContent(rawContent: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let currentSection: SectionType = 'Hero';
  let itemIdCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading detection (#, ##, Section:, [Section])
    const sectionMatch = line.match(/^#{1,6}\s*(.+)$/) || 
                         line.match(/^\[(.+)\]$/) || 
                         line.match(/^(section|category):\s*(.+)$/i);

    if (sectionMatch) {
      const headingTitle = sectionMatch[1] || sectionMatch[2];
      currentSection = detectSection(headingTitle);
      
      const subCat = categorizeItem(headingTitle, currentSection, true);
      items.push({
        id: `doc-head-${itemIdCounter++}`,
        section: currentSection,
        type: subCat,
        text: normalizeText(headingTitle),
        label: `${currentSection} Heading`
      });
      continue;
    }

    // Key-value contact lines e.g. "Phone: +44 123456789"
    const kvMatch = line.match(/^(phone|email|address|tel|mobile):\s*(.+)$/i);
    if (kvMatch) {
      const key = kvMatch[1];
      const val = kvMatch[2];
      items.push({
        id: `doc-kv-${itemIdCounter++}`,
        section: 'Contact',
        type: 'Contact Information',
        text: normalizeText(`${key}: ${val}`),
        label: `Contact ${key}`
      });
      continue;
    }

    // Bullet points / lists
    const listMatch = line.match(/^[-*•\d+.]\s*(.+)$/);
    const itemText = listMatch ? listMatch[1] : line;

    // Detect if this line looks like a standalone header line (ends without punctuation and is short)
    const isHeaderLine = !listMatch && itemText.length < 50 && !itemText.match(/[.!?]$/) && i < lines.length - 1;

    if (isHeaderLine) {
      const detectedSec = detectSection(itemText, currentSection);
      if (detectedSec !== 'General') {
        currentSection = detectedSec;
      }
      const subCat = categorizeItem(itemText, currentSection, true);
      items.push({
        id: `doc-linehead-${itemIdCounter++}`,
        section: currentSection,
        type: subCat,
        text: normalizeText(itemText),
        label: `${currentSection} Subheading`
      });
    } else {
      const subCat = categorizeItem(itemText, currentSection, false);
      items.push({
        id: `doc-item-${itemIdCounter++}`,
        section: currentSection,
        type: subCat,
        text: normalizeText(itemText)
      });
    }
  }

  return items;
}

/**
 * Parses Website HTML or text content into structured ParsedItem array
 */
export function parseWebsiteContent(htmlOrText: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  let itemIdCounter = 1;

  // Try HTML parsing if valid HTML string is provided
  if (typeof DOMParser !== 'undefined' && htmlOrText.includes('<')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlOrText, 'text/html');

      // Helper to process element
      const processElements = (elements: NodeListOf<Element>, defaultSection: SectionType) => {
        elements.forEach(el => {
          const text = normalizeText(el.textContent || '');
          if (!text || text.length < 2) return;

          // Determine parent section context if inside section tag
          let section = defaultSection;
          const parentSection = el.closest('section, header, footer, nav, article, div[id], div[class]');
          if (parentSection) {
            const idOrClass = (parentSection.id + ' ' + parentSection.className).toLowerCase();
            section = detectSection(idOrClass, defaultSection);
          }

          const tagName = el.tagName.toLowerCase();
          let subCat: SubCategoryType = 'Paragraph';

          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            subCat = 'Heading';
          } else if (['button', 'a'].includes(tagName) || el.classList.contains('btn') || el.classList.contains('cta')) {
            subCat = 'CTA';
          } else if (el.closest('form')) {
            subCat = 'Form Field';
          } else {
            subCat = categorizeItem(text, section, false);
          }

          items.push({
            id: `web-dom-${itemIdCounter++}`,
            section,
            type: subCat,
            text,
            rawHtml: el.outerHTML
          });
        });
      };

      // Query headings, paragraphs, buttons, links, list items
      const elements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a.btn, button, li, address, span.cta, footer p');
      processElements(elements, 'General');

      if (items.length > 0) return items;
    } catch (e) {
      console.warn('DOM parsing fallback to text parsing', e);
    }
  }

  // Fallback text parser for plain text website inputs
  return parseDocumentContent(htmlOrText);
}
