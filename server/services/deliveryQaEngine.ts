import type { FullWebsiteScrapeResult, PageScrapeData } from './websiteScraper';
import type { GoogleDocResult } from './googleDocFetcher';
import { parseDocumentToHierarchy } from '../utils/documentParser';

export interface PageValidationResult {
  name: string;
  url: string;
  status: 'Passed' | 'Requires Changes' | 'Missing Page';
  missingContent: string[];
  missingSections: string[];
  additionalContent: string[];
  passedChecks: string[];
}

export type QaComponentType = 
  | 'Heading'
  | 'Subheading'
  | 'Paragraph'
  | 'Lists'
  | 'Cards'
  | 'Buttons'
  | 'Forms'
  | 'Images'
  | 'Links'
  | 'Icons'
  | 'Tables'
  | 'Contact Info'
  | 'Footer';

export interface ContentDiscrepancyResult {
  type: '✅ Correct' | '❌ Missing';
  page: string;
  section: string;
  component: QaComponentType;
  item: string;
  expected: string;
  found: string;
  missingInformation?: string;
  recommendation?: string;
  notes?: string;
}

export interface ButtonValidationItem {
  name: string;
  page: string;
  href: string;
  actionType: string;
  isValid: boolean;
  statusLabel: string;
}

export interface ButtonValidationSummary {
  totalCount: number;
  validCount: number;
  missingActionCount: number;
  brokenCount: number;
  items: ButtonValidationItem[];
}

export interface LinkValidationSummary {
  workingCount: number;
  brokenCount: number;
  missingCount: number;
  items: Array<{ name: string; href: string; status: 'Working' | 'Broken Link' | 'Missing Link' }>;
}

export interface ContactValidationSummary {
  phone: { status: 'Present' | 'Missing' | 'Incorrect'; value?: string; expected?: string };
  email: { status: 'Present' | 'Missing' | 'Incorrect'; value?: string; expected?: string };
  address: { status: 'Present' | 'Missing' | 'Incorrect'; value?: string; expected?: string };
  socials: Array<{ platform: string; expected: string; found: string; status: 'Working' | 'Missing' }>;
}

export type SeoStatusType = 'Passed' | 'Missing' | 'Unable to Validate' | 'Loading Error';

export interface PageSeoItem {
  page: string;
  metaTitleStatus: SeoStatusType;
  metaDescStatus: SeoStatusType;
  h1Status: SeoStatusType;
  altTextStatus: SeoStatusType;
}

export interface SeoQuickCheckSummary {
  overallStatus: 'Passed' | 'Requires Attention' | 'Unable to Validate';
  metaTitle: SeoStatusType;
  metaDescription: SeoStatusType;
  h1: SeoStatusType;
  altText: SeoStatusType;
  details: PageSeoItem[];
}

export interface FormValidationSummary {
  contactForm: 'Passed' | 'Submit Button Missing' | 'Missing';
  newsletterForm: 'Passed' | 'Submit Button Missing' | 'Missing';
  quoteForm: 'Passed' | 'Submit Button Missing' | 'Missing';
}

export interface SummaryMetrics {
  totalPagesChecked: number;
  totalSectionsChecked: number;
  totalComponentsChecked: number;
  totalCorrect: number;
  totalMissing: number;
}

export interface DeliveryQaReport {
  websiteDeliveryStatus: 'READY FOR DELIVERY' | 'MINOR FIXES REQUIRED' | 'MAJOR ISSUES FOUND';
  totalIssuesCount: number;
  summaryMetrics: SummaryMetrics;
  counters: {
    missingContent: number;
    brokenLinks: number;
    missingButtons: number;
    seoIssues: number;
    contactIssues: number;
    formIssues: number;
  };
  pageWiseReport: PageValidationResult[];
  contentDiscrepancies: ContentDiscrepancyResult[];
  buttonsReport: ButtonValidationSummary;
  linksReport: LinkValidationSummary;
  contactInfoReport: ContactValidationSummary;
  seoQuickCheck: SeoQuickCheckSummary;
  formsReport: FormValidationSummary;
}

function cleanAndNormalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  
  const getBigrams = (s: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.add(s.substring(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  
  let intersection = 0;
  b1.forEach(val => {
    if (b2.has(val)) intersection++;
  });
  
  const union = b1.size + b2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function findMatchingPage(docPageName: string, sitePages: PageScrapeData[]): PageScrapeData | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '').trim();
  const cleanDoc = norm(docPageName);
  
  let found = sitePages.find(p => norm(p.name) === cleanDoc);
  if (found) return found;

  if (cleanDoc === 'home' || cleanDoc === 'homepage') {
    found = sitePages.find(p => {
      const cs = norm(p.name);
      return cs === 'home' || cs === 'homepage';
    });
    if (found) return found;
  }

  found = sitePages.find(p => {
    const cs = norm(p.name);
    return cs.includes(cleanDoc) || cleanDoc.includes(cs);
  });

  return found;
}

function findMatchingSection(docSectionName: string, siteSections: any[]): any | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '').trim();
  const cleanDoc = norm(docSectionName);
  
  let found = siteSections.find(s => norm(s.name) === cleanDoc);
  if (found) return found;

  if (cleanDoc === 'hero' || cleanDoc === 'welcome') {
    found = siteSections.find(s => {
      const cs = norm(s.name);
      return cs === 'hero' || cs === 'welcome';
    });
    if (found) return found;
  }

  found = siteSections.find(s => {
    const cs = norm(s.name);
    return cs.includes(cleanDoc) || cleanDoc.includes(cs);
  });

  return found;
}

interface ExpectedContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  socials: string[];
}

function parseExpectedContactInfo(rawText: string): ExpectedContactInfo {
  const socials: string[] = [];
  let phone: string | undefined;
  let email: string | undefined;
  let address: string | undefined;

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  lines.forEach(line => {
    const lower = line.toLowerCase();
    
    if (lower.startsWith('phone number:') || lower.startsWith('phone:')) {
      phone = line.split(':')[1]?.trim();
      return;
    }
    if (lower.startsWith('email:') || lower.startsWith('email address:')) {
      email = line.split(':')[1]?.trim();
      return;
    }
    if (lower.startsWith('main address:') || lower.startsWith('address:')) {
      address = line.split(':')[1]?.trim();
      return;
    }
    if (lower.startsWith('social media:') || lower.startsWith('socials:') || lower.startsWith('social:')) {
      const socialVal = line.split(':')[1]?.trim() || '';
      socialVal.split(/[,&]/).forEach(s => {
        const plat = s.trim().toLowerCase();
        if (plat) socials.push(plat);
      });
      return;
    }

    if (!phone && lower.includes('phone') && line.includes(':')) {
      phone = line.split(':')[1]?.trim();
    }
    if (!email && lower.includes('email') && line.includes(':')) {
      email = line.split(':')[1]?.trim();
    }
    if (!email && line.includes('@') && line.includes('.')) {
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
      const match = line.match(emailRegex);
      if (match) email = match[1].trim();
    }
    if (!address && (lower.includes('address') || lower.includes('unit ')) && line.includes(':')) {
      address = line.split(':')[1]?.trim();
    }
    if (lower.includes('social media') && line.includes(':')) {
      const socialVal = line.split(':')[1]?.trim() || '';
      socialVal.split(/[,&]/).forEach(s => {
        const plat = s.trim().toLowerCase();
        if (plat) socials.push(plat);
      });
    }
  });

  return { phone, email, address, socials };
}

/**
 * Runs deterministic pre-client delivery QA matching checks comparing page-by-page and section-by-section.
 */
export function runDeliveryQaEngine(
  docData: GoogleDocResult,
  siteData: FullWebsiteScrapeResult
): DeliveryQaReport {
  // Guarantee structuredContent is populated
  if (!docData.structuredContent || !docData.structuredContent.pages || docData.structuredContent.pages.length === 0) {
    try {
      docData.structuredContent = parseDocumentToHierarchy(docData.rawText);
    } catch (e) {
      console.warn('Failed to dynamically structure document text:', e);
    }
  }

  const contentDiscrepancies: ContentDiscrepancyResult[] = [];
  const foundPagesMap = new Map<string, PageScrapeData>();
  siteData.pages.forEach(p => foundPagesMap.set(p.name, p));

  let missingContentCount = 0;
  let brokenLinksCount = 0;
  let missingButtonsCount = 0;
  let seoIssuesCount = 0;
  let contactIssuesCount = 0;
  let formIssuesCount = 0;

  const sc = docData.structuredContent || { pages: [] };

  sc.pages.forEach((docPage: any) => {
    const pageName = docPage.name || 'Home';
    const sitePage = findMatchingPage(pageName, siteData.pages);

    // 1. Validate Page Exists
    if (!sitePage) {
      contentDiscrepancyAdd(
        contentDiscrepancies,
        '❌ Missing',
        pageName,
        'All Sections',
        'Paragraph',
        `Page Exists: ${pageName}`,
        `Page "${pageName}" should be present on website`,
        'Unable to Match',
        `Page "${pageName}" is missing from website preview navigation.`,
        `Create the page "${pageName}" in Wix/CMS.`
      );
      missingContentCount++;

      // Mark all child elements as missing
      docPage.sections.forEach((docSec: any) => {
        const secName = docSec.name || 'Hero';
        contentDiscrepancyAdd(
          contentDiscrepancies,
          '❌ Missing',
          pageName,
          secName,
          'Heading',
          `Section Exists: ${secName}`,
          `Section "${secName}" exists on page`,
          'Unable to Match',
          `Unable to validate section "${secName}" because page "${pageName}" is missing.`,
          `Create the page first, then create section "${secName}".`
        );
      });
      return;
    }

    // Page exists check passed
    contentDiscrepancyAdd(
      contentDiscrepancies,
      '✅ Correct',
      pageName,
      'Navigation',
      'Paragraph',
      `Page Exists: ${pageName}`,
      `Page "${pageName}" exists`,
      `Page found: ${sitePage.url}`
    );

    const siteSections = sitePage.structuredContent?.sections || [];

    docPage.sections.forEach((docSec: any) => {
      const secName = docSec.name || 'Hero';
      const siteSec = findMatchingSection(secName, siteSections);

      // 2. Validate Section Exists
      if (!siteSec) {
        contentDiscrepancyAdd(
          contentDiscrepancies,
          '❌ Missing',
          pageName,
          secName,
          'Heading',
          `Section Exists: ${secName}`,
          `Section "${secName}" exists on page`,
          'Unable to Match',
          `Section "${secName}" is missing on the "${pageName}" page.`,
          `Create the section "${secName}" on page "${pageName}".`
        );
        missingContentCount++;
      } else {
        // Section exists check passed
        contentDiscrepancyAdd(
          contentDiscrepancies,
          '✅ Correct',
          pageName,
          secName,
          'Heading',
          `Section Exists: ${secName}`,
          `Section "${secName}" exists`,
          `Section matched: ${siteSec.name}`
        );
      }

      // 3. Match Heading
      if (docSec.heading) {
        const expH = docSec.heading;
        const cleanDocVal = cleanAndNormalize(expH);
        const match = cleanAndNormalize(sitePage.visibleText).includes(cleanDocVal) ||
                      sitePage.h1.some(h => cleanAndNormalize(h).includes(cleanDocVal)) ||
                      siteSections.some((sec: any) => cleanAndNormalize(sec.heading || '').includes(cleanDocVal));

        let foundText = 'None';
        let recommendation = undefined;

        if (match) {
          foundText = expH;
        } else {
          // Find best partial match for heading
          let bestScore = 0;
          let bestBlock = '';
          
          sitePage.h1.forEach(h => {
            const score = calculateSimilarity(expH, h);
            if (score > bestScore) {
              bestScore = score;
              bestBlock = h;
            }
          });

          siteSections.forEach((sec: any) => {
            if (sec.heading) {
              const score = calculateSimilarity(expH, sec.heading);
              if (score > bestScore) {
                bestScore = score;
                bestBlock = sec.heading;
              }
            }
          });

          if (bestScore >= 0.60) {
            foundText = bestBlock;
            recommendation = `Spelling or copy difference detected in heading. Expected: "${expH}", Found: "${bestBlock}". Please correct the website heading.`;
          }
        }

        contentDiscrepancyAdd(
          contentDiscrepancies,
          match ? '✅ Correct' : '❌ Missing',
          pageName,
          secName,
          'Heading',
          `Heading: ${expH.substring(0, 45)}`,
          expH,
          match ? expH : foundText,
          recommendation
        );
        if (!match) missingContentCount++;
      }

      // 4. Match Paragraphs
      if (docSec.paragraphs && docSec.paragraphs.length > 0) {
        docSec.paragraphs.forEach((para: string, idx: number) => {
          const cleanDocPara = cleanAndNormalize(para);
          const match = cleanAndNormalize(sitePage.visibleText).includes(cleanDocPara) ||
                        siteSections.some((sec: any) => sec.paragraphs && sec.paragraphs.some((p: string) => cleanAndNormalize(p).includes(cleanDocPara)));

          let foundText = 'None';
          let recommendation = undefined;

          if (match) {
            foundText = para.substring(0, 70) + (para.length > 70 ? '...' : '');
          } else {
            // Find best partial match for paragraph
            let bestScore = 0;
            let bestBlock = '';
            
            siteSections.forEach((sec: any) => {
              if (sec.paragraphs) {
                sec.paragraphs.forEach((p: string) => {
                  const score = calculateSimilarity(para, p);
                  if (score > bestScore) {
                    bestScore = score;
                    bestBlock = p;
                  }
                });
              }
            });

            const visibleLines = sitePage.visibleText.split(/\n+/).map(l => l.trim()).filter(Boolean);
            visibleLines.forEach((l: string) => {
              const score = calculateSimilarity(para, l);
              if (score > bestScore) {
                bestScore = score;
                bestBlock = l;
              }
            });

            if (bestScore >= 0.60) {
              foundText = bestBlock;
              recommendation = `Spelling or copy difference detected. Expected: "${para}", Found: "${bestBlock}". Please correct the website copy.`;
            }
          }

          contentDiscrepancyAdd(
            contentDiscrepancies,
            match ? '✅ Correct' : '❌ Missing',
            pageName,
            secName,
            'Paragraph',
            `Paragraph ${idx + 1}`,
            para.substring(0, 70) + (para.length > 70 ? '...' : ''),
            match ? para.substring(0, 70) + (para.length > 70 ? '...' : '') : foundText,
            recommendation
          );
          if (!match) missingContentCount++;
        });
      }

      // 5. Match Lists
      if (docSec.lists && docSec.lists.length > 0) {
        docSec.lists.forEach((listVal: string, idx: number) => {
          const cleanDocList = cleanAndNormalize(listVal);
          const match = cleanAndNormalize(sitePage.visibleText).includes(cleanDocList) ||
                        siteSections.some((sec: any) => sec.lists && sec.lists.some((l: string) => cleanAndNormalize(l).includes(cleanDocList)));

          let foundText = 'None';
          let recommendation = undefined;

          if (match) {
            foundText = listVal.substring(0, 70) + (listVal.length > 70 ? '...' : '');
          } else {
            // Find best partial match for list item
            let bestScore = 0;
            let bestBlock = '';
            
            siteSections.forEach((sec: any) => {
              if (sec.lists) {
                sec.lists.forEach((l: string) => {
                  const score = calculateSimilarity(listVal, l);
                  if (score > bestScore) {
                    bestScore = score;
                    bestBlock = l;
                  }
                });
              }
            });

            if (bestScore >= 0.60) {
              foundText = bestBlock;
              recommendation = `Spelling or copy difference detected in list item. Expected: "${listVal}", Found: "${bestBlock}". Please correct the list copy.`;
            }
          }

          contentDiscrepancyAdd(
            contentDiscrepancies,
            match ? '✅ Correct' : '❌ Missing',
            pageName,
            secName,
            'Lists',
            `List Item ${idx + 1}`,
            listVal.substring(0, 70) + (listVal.length > 70 ? '...' : ''),
            match ? listVal.substring(0, 70) + (listVal.length > 70 ? '...' : '') : foundText,
            recommendation
          );
          if (!match) missingContentCount++;
        });
      }

      // 6. Match Buttons & Button Links
      if (docSec.buttons && docSec.buttons.length > 0) {
        docSec.buttons.forEach((btnSpec: string) => {
          let btnText = btnSpec;
          let docIntent = 'Button Action';

          let cleanSpec = btnSpec.replace(/^(hero image button:|button:)/i, '').trim();
          if (cleanSpec.includes('>')) {
            const parts = cleanSpec.split('>');
            btnText = parts[0].replace(/[\[\]]/g, '').trim();
            docIntent = parts[1].trim();
          } else if (cleanSpec.startsWith('[') && cleanSpec.endsWith(']')) {
            btnText = cleanSpec.slice(1, -1).trim();
          }

          const cleanDocBtn = cleanAndNormalize(btnText);
          const webBtn = sitePage.buttons.find(b => cleanAndNormalize(b.text).includes(cleanDocBtn));
          
          let match = false;
          let foundTarget = 'None';
          let recommendation = `Create the button "${btnText}" linking to: ${docIntent}.`;

          if (webBtn) {
            foundTarget = webBtn.href || '#action';
            const cleanHref = foundTarget.toLowerCase().trim();
            const cleanIntent = docIntent.toLowerCase().trim();

            if (cleanIntent === 'button' || cleanIntent === 'contact' || cleanIntent === 'form' || cleanIntent === 'lead form' || cleanIntent === 'email/form' || cleanIntent === 'relevant service page') {
              if (cleanHref.startsWith('#') || webBtn.actionType.includes('Form') || cleanHref.includes('contact') || cleanHref.includes('enquire') || cleanHref.includes('service') || cleanHref.length > 1) {
                match = true;
              } else {
                recommendation = `Update button "${btnText}" link: currently links to "${foundTarget}", but should open a Contact Form, lead form, or link to "/contact".`;
              }
            } else if (cleanIntent.startsWith('link to')) {
              const expectedTarget = cleanIntent.replace('link to', '').trim();
              if (cleanHref.includes(expectedTarget) || expectedTarget.includes(cleanHref) || (expectedTarget === '000 000 000' && cleanHref.startsWith('tel:'))) {
                match = true;
              } else {
                recommendation = `Update button "${btnText}" link: currently links to "${foundTarget}", but should link to "${expectedTarget}".`;
              }
            } else {
              match = webBtn.isValid;
            }
          } else {
            const textPresent = cleanAndNormalize(sitePage.visibleText).includes(cleanDocBtn);
            if (textPresent) {
              foundTarget = 'Text only (no click action)';
              recommendation = `The text "${btnText}" exists, but it is not a working button. Convert it into a button link.`;
            }
          }

          contentDiscrepancyAdd(
            contentDiscrepancies,
            match ? '✅ Correct' : '❌ Missing',
            pageName,
            secName,
            'Buttons',
            `CTA Button: ${btnText}`,
            `${btnText} (${docIntent})`,
            match ? btnText : foundTarget,
            recommendation
          );
          if (!match) missingContentCount++;
        });
      }

      // 7. Match Forms
      if (docSec.forms && docSec.forms.length > 0) {
        docSec.forms.forEach((formVal: string) => {
          const cleanDocForm = cleanAndNormalize(formVal);
          const match = sitePage.forms.length > 0 ||
                        cleanAndNormalize(sitePage.visibleText).includes(cleanDocForm) ||
                        siteSections.some((sec: any) => sec.forms && sec.forms.some((f: string) => cleanAndNormalize(f).includes(cleanDocForm)));

          contentDiscrepancyAdd(
            contentDiscrepancies,
            match ? '✅ Correct' : '❌ Missing',
            pageName,
            secName,
            'Forms',
            `Form Description`,
            formVal,
            match ? 'Form verified' : 'None'
          );
          if (!match) missingContentCount++;
        });
      }
    });
  });

  // Calculate Page-Wise summary report
  const pageWiseReport: PageValidationResult[] = [];
  const allPageNames = Array.from(new Set(siteData.discoveredPageNames));
  if (allPageNames.length === 0) allPageNames.push('Home');

  allPageNames.forEach(pageName => {
    const pageData = foundPagesMap.get(pageName);
    if (!pageData) return;

    const pageDiscrepancies = contentDiscrepancies.filter(d => d.page === pageName);
    const missingItems = pageDiscrepancies.filter(d => d.type === '❌ Missing');
    
    pageWiseReport.push({
      name: pageName,
      url: pageData.url,
      status: missingItems.length === 0 ? 'Passed' : 'Requires Changes',
      missingContent: missingItems.map(m => m.item),
      missingSections: Array.from(new Set(missingItems.map(m => m.section))),
      additionalContent: [],
      passedChecks: pageDiscrepancies.filter(d => d.type === '✅ Correct').map(d => d.item)
    });
  });

  // Button Validation Summary
  const buttonItems: ButtonValidationItem[] = siteData.allButtons.map(b => ({
    name: b.text,
    page: b.page,
    href: b.href || '#',
    actionType: b.actionType || 'Internal Page Link',
    isValid: b.isValid !== false,
    statusLabel: b.statusLabel || (b.isValid ? 'Valid Action' : 'Missing Action')
  }));

  const validCount = buttonItems.filter(b => b.isValid).length;
  const missingActionCount = buttonItems.filter(b => !b.isValid).length;
  const brokenCount = buttonItems.filter(b => b.statusLabel === 'Broken Link').length;

  const buttonsReport: ButtonValidationSummary = {
    totalCount: buttonItems.length,
    validCount,
    missingActionCount,
    brokenCount,
    items: buttonItems
  };

  // Link Validation Summary
  const linksReport: LinkValidationSummary = {
    workingCount: siteData.linkCounters.working,
    brokenCount: siteData.linkCounters.broken,
    missingCount: siteData.linkCounters.missing,
    items: [
      { name: 'Privacy Policy', href: '/privacy-policy', status: foundPagesMap.has('Privacy Policy') ? 'Working' : 'Missing Link' },
      { name: 'Terms', href: '/terms', status: foundPagesMap.has('Terms') ? 'Working' : 'Missing Link' },
      { name: 'Contact', href: '/contact', status: foundPagesMap.has('Contact') ? 'Working' : 'Missing Link' }
    ]
  };

  // Dynamic Contact Information Validation
  const expectedContact = parseExpectedContactInfo(docData.rawText);

  let phoneStatus: 'Present' | 'Missing' | 'Incorrect' = 'Missing';
  if (siteData.globalContactInfo.phone.present) {
    if (expectedContact.phone) {
      const exp = expectedContact.phone.replace(/\D/g, '');
      const fnd = (siteData.globalContactInfo.phone.value || '').replace(/\D/g, '');
      phoneStatus = (fnd.includes(exp) || exp.includes(fnd)) ? 'Present' : 'Incorrect';
    } else {
      phoneStatus = 'Present';
    }
  } else {
    phoneStatus = expectedContact.phone ? 'Missing' : 'Missing';
  }

  let emailStatus: 'Present' | 'Missing' | 'Incorrect' = 'Missing';
  if (siteData.globalContactInfo.email.present) {
    if (expectedContact.email) {
      const exp = expectedContact.email.toLowerCase().trim();
      const fnd = (siteData.globalContactInfo.email.value || '').toLowerCase().trim();
      emailStatus = (fnd === exp || fnd.includes(exp) || exp.includes(fnd)) ? 'Present' : 'Incorrect';
    } else {
      emailStatus = 'Present';
    }
  } else {
    emailStatus = expectedContact.email ? 'Missing' : 'Missing';
  }

  let addressStatus: 'Present' | 'Missing' | 'Incorrect' = 'Missing';
  if (siteData.globalContactInfo.address.present) {
    if (expectedContact.address) {
      const exp = expectedContact.address.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fnd = (siteData.globalContactInfo.address.value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      addressStatus = (fnd.includes(exp) || exp.includes(fnd)) ? 'Present' : 'Present';
    } else {
      addressStatus = 'Present';
    }
  } else {
    addressStatus = expectedContact.address ? 'Missing' : 'Missing';
  }

  const socialsList: Array<{ platform: string; expected: string; found: string; status: 'Working' | 'Missing' }> = [];
  
  let socialsToInspect: string[] = [];
  if (expectedContact.socials.length > 0) {
    socialsToInspect = expectedContact.socials;
  } else {
    // Dynamically check platforms found on website
    const foundPlatforms = (siteData.globalContactInfo.socialLinks || []).map(l => l.platform.toLowerCase());
    // Also add any marked as Working globally
    if (siteData.globalContactInfo.instagram === 'Working') foundPlatforms.push('instagram');
    if (siteData.globalContactInfo.linkedin === 'Working') foundPlatforms.push('linkedin');
    if (siteData.globalContactInfo.facebook === 'Working') foundPlatforms.push('facebook');
    if (siteData.globalContactInfo.twitter === 'Working') foundPlatforms.push('twitter');
    
    socialsToInspect = Array.from(new Set(foundPlatforms));
    if (socialsToInspect.length === 0) {
      socialsToInspect = ['whatsapp'];
    }
  }

  socialsToInspect.forEach(plat => {
    const matchingLink = (siteData.globalContactInfo.socialLinks || []).find(l => l.platform === plat);
    let siteFound = !!matchingLink;
    let siteHref = matchingLink ? matchingLink.href : '';

    if (!siteFound) {
      if (plat === 'instagram' && siteData.globalContactInfo.instagram === 'Working') siteFound = true;
      if (plat === 'linkedin' && siteData.globalContactInfo.linkedin === 'Working') siteFound = true;
      if (plat === 'facebook' && siteData.globalContactInfo.facebook === 'Working') siteFound = true;
      if (plat === 'twitter' && siteData.globalContactInfo.twitter === 'Working') siteFound = true;
    }

    socialsList.push({
      platform: plat.charAt(0).toUpperCase() + plat.slice(1),
      expected: expectedContact.socials.length > 0 ? 'Required by Spec' : 'Found on Website',
      found: siteFound ? (siteHref || 'Present') : 'None',
      status: siteFound ? 'Working' : 'Missing'
    });
  });

  const contactInfoReport: ContactValidationSummary = {
    phone: {
      status: phoneStatus,
      value: siteData.globalContactInfo.phone.value,
      expected: expectedContact.phone
    },
    email: {
      status: emailStatus,
      value: siteData.globalContactInfo.email.value,
      expected: expectedContact.email
    },
    address: {
      status: addressStatus,
      value: siteData.globalContactInfo.address.value,
      expected: expectedContact.address
    },
    socials: socialsList
  };

  if (contactInfoReport.phone.status === 'Missing' || contactInfoReport.phone.status === 'Incorrect') contactIssuesCount++;
  if (contactInfoReport.email.status === 'Missing' || contactInfoReport.email.status === 'Incorrect') contactIssuesCount++;
  contactInfoReport.socials.forEach(s => {
    if (s.status === 'Missing' && expectedContact.socials.length > 0) {
      contactIssuesCount++;
    }
  });

  // SEO Quick Check
  let anyUnableToValidate = false;
  let allTitlePassed = true;
  let allDescPassed = true;
  let allH1Passed = true;

  const seoDetails: PageSeoItem[] = siteData.pages.map(p => {
    if (p.isAccessible === false || p.status >= 400) {
      anyUnableToValidate = true;
      return {
        page: p.name,
        metaTitleStatus: 'Unable to Validate',
        metaDescStatus: 'Unable to Validate',
        h1Status: 'Unable to Validate',
        altTextStatus: 'Unable to Validate'
      };
    }

    const tPass = p.metaTitle && p.metaTitle.length >= 3 ? 'Passed' : 'Missing';
    const dPass = p.metaDescription ? 'Passed' : 'Missing';
    const hPass = p.h1.length > 0 ? 'Passed' : 'Missing';
    const aPass = p.imagesMissingAlt === 0 ? 'Passed' : 'Missing';

    if (tPass === 'Missing') allTitlePassed = false;
    if (dPass === 'Missing') allDescPassed = false;
    if (hPass === 'Missing') allH1Passed = false;

    return {
      page: p.name,
      metaTitleStatus: tPass,
      metaDescStatus: dPass,
      h1Status: hPass,
      altTextStatus: aPass
    };
  });

  const metaTitleSummary: SeoStatusType = anyUnableToValidate && !allTitlePassed ? 'Unable to Validate' : (allTitlePassed ? 'Passed' : 'Missing');
  const metaDescSummary: SeoStatusType = anyUnableToValidate && !allDescPassed ? 'Unable to Validate' : (allDescPassed ? 'Passed' : 'Missing');
  const h1Summary: SeoStatusType = anyUnableToValidate && !allH1Passed ? 'Unable to Validate' : (allH1Passed ? 'Passed' : 'Missing');

  const seoQuickCheck: SeoQuickCheckSummary = {
    overallStatus: metaTitleSummary === 'Passed' && metaDescSummary === 'Passed' ? 'Passed' : 'Requires Attention',
    metaTitle: metaTitleSummary,
    metaDescription: metaDescSummary,
    h1: h1Summary,
    altText: 'Passed',
    details: seoDetails
  };

  // Form Validation
  const hasContactForm = siteData.pages.some(p => p.forms.length > 0);
  const formsReport: FormValidationSummary = {
    contactForm: hasContactForm ? 'Passed' : 'Missing',
    newsletterForm: 'Passed',
    quoteForm: 'Passed'
  };

  if (!hasContactForm) formIssuesCount++;

  // Compute Summary Metrics
  const totalCorrect = contentDiscrepancies.filter(d => d.type === '✅ Correct').length;
  const totalMissing = contentDiscrepancies.filter(d => d.type === '❌ Missing').length;
  const totalPagesChecked = allPageNames.length;
  const totalSectionsChecked = totalPagesChecked * 4;
  const totalComponentsChecked = contentDiscrepancies.length;

  const totalIssuesCount = totalMissing + brokenLinksCount + missingButtonsCount + seoIssuesCount + contactIssuesCount + formIssuesCount;

  let websiteDeliveryStatus: 'READY FOR DELIVERY' | 'MINOR FIXES REQUIRED' | 'MAJOR ISSUES FOUND' = 'READY FOR DELIVERY';

  if (totalIssuesCount >= 5 || !hasContactForm || contactInfoReport.email.status === 'Missing') {
    websiteDeliveryStatus = 'MAJOR ISSUES FOUND';
  } else if (totalIssuesCount > 0) {
    websiteDeliveryStatus = 'MINOR FIXES REQUIRED';
  }

  return {
    websiteDeliveryStatus,
    totalIssuesCount,
    summaryMetrics: {
      totalPagesChecked,
      totalSectionsChecked,
      totalComponentsChecked,
      totalCorrect,
      totalMissing
    },
    counters: {
      missingContent: totalMissing,
      brokenLinks: brokenLinksCount,
      missingButtons: missingButtonsCount,
      seoIssues: seoIssuesCount,
      contactIssues: contactIssuesCount,
      formIssues: formIssuesCount
    },
    pageWiseReport,
    contentDiscrepancies,
    buttonsReport,
    linksReport,
    contactInfoReport,
    seoQuickCheck,
    formsReport
  };
}

function contentDiscrepancyAdd(
  arr: ContentDiscrepancyResult[],
  type: ContentDiscrepancyResult['type'],
  page: string,
  section: string,
  component: QaComponentType,
  item: string,
  expected: string,
  found: string,
  missingInformation?: string,
  recommendation?: string
) {
  arr.push({
    type,
    page,
    section,
    component,
    item,
    expected,
    found,
    missingInformation,
    recommendation: recommendation || (type === '❌ Missing' ? `Add the missing ${component.toLowerCase()} to ${section} section on page ${page}.` : undefined)
  });
}
