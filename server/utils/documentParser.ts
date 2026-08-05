import * as cheerio from 'cheerio';

export interface StructuredSection {
  name: string;
  heading?: string;
  paragraphs: string[];
  lists: string[];
  buttons: string[];
  tables?: string[][][];
  forms?: string[];
  footer?: string;
}

export interface StructuredPage {
  name: string;
  sections: StructuredSection[];
}

export interface StructuredDocument {
  pages: StructuredPage[];
}

/**
 * Standard list of section type recognizers
 */
function classifySection(title: string): string {
  const t = title.toLowerCase().trim();
  if (t.match(/\b(hero|welcome|main banner|banner|headline|home)\b/i)) return 'Hero';
  if (t.match(/\b(about|who we are|our story|company|mission|vision)\b/i)) return 'About';
  if (t.match(/\b(service|services|what we do|solutions|offerings|capabilities|survey|surveys)\b/i)) return 'Services';
  if (t.match(/\b(process|how it works|steps|workflow|how we work|procedure)\b/i)) return 'Process';
  if (t.match(/\b(faq|faqs|frequently asked|questions|q&a)\b/i)) return 'FAQs';
  if (t.match(/\b(testimonial|testimonials|reviews|what clients say|feedback)\b/i)) return 'Testimonials';
  if (t.match(/\b(contact|get in touch|reach us|address|phone|email)\b/i)) return 'Contact';
  if (t.match(/\b(footer|copyright|all rights reserved|terms|privacy)\b/i)) return 'Footer';
  if (t.match(/\b(cta|call to action|book now|schedule|get started|claim)\b/i)) return 'CTA';
  return 'General';
}

/**
 * Standard list of CTA button phrase recognizers
 */
function isCtaText(text: string): boolean {
  const clean = text.trim();
  if (clean.length > 40 || clean.length < 2) return false;
  const lower = clean.toLowerCase();
  return !!lower.match(/^(book|schedule|get|claim|call|contact|start|submit|download|request|order|buy|enquire|estimate|find)\b/i) ||
         !!lower.match(/\b(now|free|survey|quote|today|consultation)\b/i);
}

/**
 * Normalizes double spaces, non-breaking spaces, and empty content
 */
function normalizeString(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Core dynamic document hierarchy parser
 */
export function parseDocumentToHierarchy(rawText: string, html?: string): StructuredDocument {
  const pages: StructuredPage[] = [];

  // 1. Process via HTML (Mammoth HTML structure) if available
  if (html && html.trim().length > 0) {
    try {
      const $ = cheerio.load(html);
      let currentPage: StructuredPage = { name: 'Home', sections: [] };
      let currentSection: StructuredSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };

      // Helper to push current section
      const commitCurrentSection = () => {
        if (
          currentSection.heading ||
          currentSection.paragraphs.length > 0 ||
          currentSection.lists.length > 0 ||
          currentSection.buttons.length > 0 ||
          (currentSection.tables && currentSection.tables.length > 0) ||
          (currentSection.forms && currentSection.forms.length > 0)
        ) {
          currentPage.sections.push({ ...currentSection });
          currentSection = { name: 'General', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
        }
      };

      // Traverse all top-level children elements
      $('body > *').each((_, el) => {
        const $el = $(el);
        const tagName = el.tagName.toLowerCase();
        const textVal = normalizeString($el.text());

        // Handle page break or horizontal rule splits
        if (tagName === 'hr' || $el.css('page-break-before') === 'always') {
          commitCurrentSection();
          if (currentPage.sections.length > 0) {
            pages.push({ ...currentPage });
          }
          currentPage = { name: `Page ${pages.length + 1}`, sections: [] };
          currentSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
          return;
        }

        // Headings (H1 to H6 equivalent)
        if (/^h[1-6]$/.test(tagName)) {
          commitCurrentSection();
          currentSection.name = classifySection(textVal);
          currentSection.heading = textVal;
          return;
        }

        // Tables
        if (tagName === 'table') {
          const tableRows: string[][] = [];
          $el.find('tr').each((_, tr) => {
            const rowData: string[] = [];
            $(tr).find('td, th').each((_, cell) => {
              rowData.push(normalizeString($(cell).text()));
            });
            if (rowData.length > 0) {
              tableRows.push(rowData);
            }
          });
          if (tableRows.length > 0) {
            currentSection.tables = currentSection.tables || [];
            currentSection.tables.push(tableRows);
          }
          return;
        }

        // Lists (ul, ol, li)
        if (tagName === 'ul' || tagName === 'ol') {
          $el.find('li').each((_, li) => {
            const liText = normalizeString($(li).text());
            if (liText) {
              currentSection.lists.push(liText);
            }
          });
          return;
        }

        // Paragraphs, buttons, and contact info
        if (tagName === 'p') {
          if (!textVal) return;

          // Check if this looks like a button/CTA
          if (isCtaText(textVal)) {
            currentSection.buttons.push(textVal);
          } else if (textVal.toLowerCase().includes('form') && (textVal.includes(':') || textVal.includes('input'))) {
            currentSection.forms = currentSection.forms || [];
            currentSection.forms.push(textVal);
          } else {
            currentSection.paragraphs.push(textVal);
          }
        }
      });

      // Commit last remaining section & page
      commitCurrentSection();
      if (currentPage.sections.length > 0) {
        pages.push(currentPage);
      }

      if (pages.length > 0) {
        return cleanEmptyPagesAndSections({ pages });
      }
    } catch (e) {
      console.warn('HTML Parsing failed, falling back to plaintext parsing:', e);
    }
  }

  // 2. Process via Plaintext (PDF parsing & plaintext fallbacks)
  const pdfPages = rawText.split(/\x0c|\f/); // Split on form-feed character
  pdfPages.forEach((pageText, pIdx) => {
    const lines = pageText
      .split(/\r?\n/)
      .map(l => normalizeString(l))
      .filter(Boolean);

    if (lines.length === 0) return;

    const pageName = pIdx === 0 ? 'Home' : `Page ${pIdx + 1}`;
    const page: StructuredPage = { name: pageName, sections: [] };

    let currentSection: StructuredSection = {
      name: 'Hero',
      paragraphs: [],
      lists: [],
      buttons: [],
      tables: [],
      forms: []
    };

    lines.forEach((line) => {
      // 1. Detect Headings
      const headingMatch = line.match(/^#{1,6}\s*(.+)$/) || line.match(/^\[(.+)\]$/);
      const isHeadingMatch = headingMatch || (line.length < 50 && !line.match(/[.!?]$/) && line.toUpperCase() === line);

      if (isHeadingMatch) {
        // Commit current section
        if (
          currentSection.heading ||
          currentSection.paragraphs.length > 0 ||
          currentSection.lists.length > 0 ||
          currentSection.buttons.length > 0
        ) {
          page.sections.push({ ...currentSection });
        }

        const headingVal = headingMatch ? headingMatch[1] : line;
        currentSection = {
          name: classifySection(headingVal),
          heading: headingVal,
          paragraphs: [],
          lists: [],
          buttons: [],
          tables: [],
          forms: []
        };
        return;
      }

      // 2. Lists (starts with list bullet or number)
      const listMatch = line.match(/^[-*•\d+.]\s*(.+)$/);
      if (listMatch) {
        currentSection.lists.push(listMatch[1]);
        return;
      }

      // 3. CTA Buttons
      if (isCtaText(line)) {
        currentSection.buttons.push(line);
        return;
      }

      // 4. Forms description
      if (line.toLowerCase().includes('form:') || line.toLowerCase().startsWith('form ')) {
        currentSection.forms = currentSection.forms || [];
        currentSection.forms.push(line);
        return;
      }

      // 5. Default to Paragraph
      currentSection.paragraphs.push(line);
    });

    // Commit last section
    if (
      currentSection.heading ||
      currentSection.paragraphs.length > 0 ||
      currentSection.lists.length > 0 ||
      currentSection.buttons.length > 0
    ) {
      page.sections.push(currentSection);
    }

    if (page.sections.length > 0) {
      pages.push(page);
    }
  });

  return cleanEmptyPagesAndSections({ pages });
}

/**
 * Post-processing step: Remove duplicates, filter empty fields, and assign footers if found
 */
function cleanEmptyPagesAndSections(doc: StructuredDocument): StructuredDocument {
  const cleanedPages: StructuredPage[] = [];

  doc.pages.forEach(p => {
    const cleanedSections: StructuredSection[] = [];
    p.sections.forEach(s => {
      // Remove duplicate entries
      const uniqueParagraphs = Array.from(new Set(s.paragraphs.filter(Boolean)));
      const uniqueLists = Array.from(new Set(s.lists.filter(Boolean)));
      const uniqueButtons = Array.from(new Set(s.buttons.filter(Boolean)));

      if (s.heading || uniqueParagraphs.length > 0 || uniqueLists.length > 0 || uniqueButtons.length > 0) {
        const cleanSection: StructuredSection = {
          name: s.name,
          heading: s.heading,
          paragraphs: uniqueParagraphs,
          lists: uniqueLists,
          buttons: uniqueButtons,
          tables: s.tables,
          forms: s.forms
        };

        // Classify footer content directly
        if (s.name === 'Footer') {
          cleanSection.footer = uniqueParagraphs.join('\n');
        }

        cleanedSections.push(cleanSection);
      }
    });

    if (cleanedSections.length > 0) {
      cleanedPages.push({
        name: p.name,
        sections: cleanedSections
      });
    }
  });

  return { pages: cleanedPages };
}
