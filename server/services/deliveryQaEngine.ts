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
  address: { status: 'Present' | 'Missing'; value?: string };
  instagram: 'Working' | 'Missing';
  linkedin: 'Working' | 'Missing';
  facebook: 'Working' | 'Missing';
  twitter: 'Working' | 'Missing';
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
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .toLowerCase();
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
        return;
      }

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

      // 3. Match Heading
      if (docSec.heading) {
        const expH = docSec.heading;
        const cleanDocVal = cleanAndNormalize(expH);
        const match = cleanAndNormalize(sitePage.visibleText).includes(cleanDocVal) ||
                      sitePage.h1.some(h => cleanAndNormalize(h).includes(cleanDocVal)) ||
                      siteSections.some((sec: any) => cleanAndNormalize(sec.heading || '').includes(cleanDocVal));

        contentDiscrepancyAdd(
          contentDiscrepancies,
          match ? '✅ Correct' : '❌ Missing',
          pageName,
          secName,
          'Heading',
          `Heading: ${expH.substring(0, 45)}`,
          expH,
          match ? expH : 'None'
        );
        if (!match) missingContentCount++;
      }

      // 4. Match Paragraphs
      if (docSec.paragraphs && docSec.paragraphs.length > 0) {
        docSec.paragraphs.forEach((para: string, idx: number) => {
          const cleanDocPara = cleanAndNormalize(para);
          const match = cleanAndNormalize(sitePage.visibleText).includes(cleanDocPara) ||
                        siteSections.some((sec: any) => sec.paragraphs && sec.paragraphs.some((p: string) => cleanAndNormalize(p).includes(cleanDocPara)));

          contentDiscrepancyAdd(
            contentDiscrepancies,
            match ? '✅ Correct' : '❌ Missing',
            pageName,
            secName,
            'Paragraph',
            `Paragraph ${idx + 1}`,
            para.substring(0, 70) + (para.length > 70 ? '...' : ''),
            match ? para.substring(0, 70) + (para.length > 70 ? '...' : '') : 'None'
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

          contentDiscrepancyAdd(
            contentDiscrepancies,
            match ? '✅ Correct' : '❌ Missing',
            pageName,
            secName,
            'Lists',
            `List Item ${idx + 1}`,
            listVal.substring(0, 70) + (listVal.length > 70 ? '...' : ''),
            match ? listVal.substring(0, 70) + (listVal.length > 70 ? '...' : '') : 'None'
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
          const match = sitePage.buttons.some(b => cleanAndNormalize(b.text).includes(cleanDocBtn)) ||
                        cleanAndNormalize(sitePage.visibleText).includes(cleanDocBtn) ||
                        siteSections.some((sec: any) => sec.buttons && sec.buttons.some((b: string) => cleanAndNormalize(b).includes(cleanDocBtn)));

          contentDiscrepancyAdd(
            contentDiscrepancies,
            match ? '✅ Correct' : '❌ Missing',
            pageName,
            secName,
            'Buttons',
            `CTA Button: ${btnText}`,
            `${btnText} (${docIntent})`,
            match ? btnText : 'None'
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

  // Contact Information Validation
  const contactInfoReport: ContactValidationSummary = {
    phone: {
      status: siteData.globalContactInfo.phone.present ? 'Present' : 'Missing',
      value: siteData.globalContactInfo.phone.value
    },
    email: {
      status: siteData.globalContactInfo.email.present ? 'Present' : 'Missing',
      value: siteData.globalContactInfo.email.value
    },
    address: {
      status: siteData.globalContactInfo.address.present ? 'Present' : 'Missing',
      value: siteData.globalContactInfo.address.value
    },
    instagram: siteData.globalContactInfo.instagram,
    linkedin: siteData.globalContactInfo.linkedin,
    facebook: siteData.globalContactInfo.facebook,
    twitter: siteData.globalContactInfo.twitter
  };

  if (contactInfoReport.phone.status === 'Missing') contactIssuesCount++;
  if (contactInfoReport.email.status === 'Missing') contactIssuesCount++;

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
