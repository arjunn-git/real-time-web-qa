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
  metaTitle?: string;
  metaDescription?: string;
  h1?: string;
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

/**
 * Core dynamic document hierarchy parser
 */
export function parseDocumentToHierarchy(rawText: string, html?: string): StructuredDocument {
  const pages: StructuredPage[] = [];

  // 1. Process via HTML (Mammoth HTML structure) if available
  if (html && html.trim().length > 0) {
    try {
      const $ = cheerio.load(html);
      let currentPage: any = null;
      let currentSection: StructuredSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };

      // Helper to push current section
      const commitCurrentSection = () => {
        if (!currentPage) return;
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

        // Check if paragraph contains page marker, e.g. "Home (Page 1)"
        const pageMatch = textVal.match(/^(.*?)\s*\(Page\s*(\d+)\)$/i);
        if (pageMatch) {
          if (currentPage) {
            commitCurrentSection();
            if (currentPage.sections.length > 0) {
              pages.push({ ...currentPage });
            }
          }
          currentPage = { name: pageMatch[1].trim(), sections: [] };
          currentSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
          return;
        }

        // Handle page break or horizontal rule splits
        if (tagName === 'hr' || $el.css('page-break-before') === 'always') {
          if (currentPage) {
            commitCurrentSection();
            if (currentPage.sections.length > 0) {
              pages.push({ ...currentPage });
            }
            currentPage = { name: `Page ${pages.length + 1}`, sections: [] };
            currentSection = { name: 'Hero', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
          }
          return;
        }

        if (!currentPage) return; // Skip content before first page division

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
              if (isMetadataOrInstructionLine(liText)) return;
              currentSection.lists.push(liText);
            }
          });
          return;
        }

        // Paragraphs, buttons, and contact info
        if (tagName === 'p') {
          if (!textVal) return;

          // Extract page metadata
          const normLine = textVal.replace(/\s+/g, ' ').trim();
          const titleMatch = normLine.match(/^(?:page\/meta title|page title)\s*[:|]?\s*(.+)/i);
          if (titleMatch) {
            currentPage.metaTitle = titleMatch[1].trim();
          }
          const descMatch = normLine.match(/^meta description\s*[:|]?\s*(.+)/i);
          if (descMatch) {
            currentPage.metaDescription = descMatch[1].trim();
          }
          const h1Match = normLine.match(/^(?:h1\s*\(hero image text\)|h1\s*\(hero\)|h1)\s*[:|]?\s*(.+)/i);
          if (h1Match) {
            currentPage.h1 = h1Match[1].trim();
          }

          if (isMetadataOrInstructionLine(textVal)) return;

          // Check if this looks like a button/CTA
          if (isButtonLine(textVal)) {
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
      if (currentPage) {
        commitCurrentSection();
        if (currentPage.sections.length > 0) {
          pages.push(currentPage);
        }
      }

      if (pages.length > 0) {
        return cleanEmptyPagesAndSections({ pages });
      }
    } catch (e) {
      console.warn('HTML Parsing failed, falling back to plaintext parsing:', e);
    }
  }

  // 2. Process via Plaintext (PDF parsing & plaintext fallbacks)
  const lines = rawText
    .split(/\r?\n/)
    .map(l => normalizeString(l))
    .filter(Boolean);

  let currentPage: StructuredPage | null = null;
  let currentSection: StructuredSection = {
    name: 'Hero',
    paragraphs: [],
    lists: [],
    buttons: [],
    tables: [],
    forms: []
  };

  const commitSection = () => {
    if (!currentPage) return;
    if (
      currentSection.heading ||
      currentSection.paragraphs.length > 0 ||
      currentSection.lists.length > 0 ||
      currentSection.buttons.length > 0 ||
      (currentSection.tables && currentSection.tables.length > 0) ||
      (currentSection.forms && currentSection.forms.length > 0)
    ) {
      currentPage.sections.push({ ...currentSection });
    }
  };

  const commitPage = () => {
    if (currentPage) {
      commitSection();
      if (currentPage.sections.length > 0) {
        pages.push(currentPage);
      }
    }
  };

  lines.forEach((line) => {
    // Check if the line is a page divider, e.g. "Home (Page 1)"
    const pageMatch = line.match(/^(.*?)\s*\(Page\s*(\d+)\)$/i);
    if (pageMatch) {
      commitPage();
      const pageName = pageMatch[1].trim();
      currentPage = { name: pageName, sections: [] };
      currentSection = {
        name: 'Hero',
        paragraphs: [],
        lists: [],
        buttons: [],
        tables: [],
        forms: []
      };
      return;
    }

    if (!currentPage) {
      // Ignore global document metadata/briefing lines before the first page division
      return;
    }

    // Extract page metadata
    const normLine = line.replace(/\s+/g, ' ').trim();
    const titleMatch = normLine.match(/^(?:page\/meta title|page title)\s*[:|]?\s*(.+)/i);
    if (titleMatch) {
      currentPage.metaTitle = titleMatch[1].trim();
    }
    const descMatch = normLine.match(/^meta description\s*[:|]?\s*(.+)/i);
    if (descMatch) {
      currentPage.metaDescription = descMatch[1].trim();
    }
    const h1Match = normLine.match(/^(?:h1\s*\(hero image text\)|h1\s*\(hero\)|h1)\s*[:|]?\s*(.+)/i);
    if (h1Match) {
      currentPage.h1 = h1Match[1].trim();
    }

    if (isMetadataOrInstructionLine(line)) return;

    // 1. CTA Buttons (Check BEFORE headings to prevent [Button] > Link matching heading pattern)
    if (isButtonLine(line)) {
      currentSection.buttons.push(line);
      return;
    }

    // 2. Detect Headings
    const headingMatch = line.match(/^#{1,6}\s*(.+)$/) || line.match(/^\[(.+)\]$/);
    const isHeadingMatch = headingMatch || (line.length < 50 && !line.match(/[.!?]$/) && line.toUpperCase() === line);

    if (isHeadingMatch) {
      commitSection();
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

    // 3. Lists (starts with list bullet or number)
    const listMatch = line.match(/^[-*•\d+.]\s*(.+)$/);
    if (listMatch) {
      currentSection.lists.push(listMatch[1]);
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

  commitPage();

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
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        h1: p.h1,
        sections: cleanedSections
      });
    }
  });

  return { pages: cleanedPages };
}
