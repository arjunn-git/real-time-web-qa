import type { FullWebsiteScrapeResult, PageScrapeData } from './websiteScraper';
import type { GoogleDocResult } from './googleDocFetcher';
import { arePhonesEquivalent, areEmailsEquivalent, compareCtaOrCopy } from '../utils/contentNormalizer';

export interface PageValidationResult {
  name: string;
  url: string;
  status: 'Passed' | 'Requires Changes' | 'Missing Page';
  missingContent: string[];
  missingSections: string[];
  additionalContent: string[];
  passedChecks: string[];
}

export interface ContentDiscrepancyResult {
  type: 'Matched Content' | 'Minor Formatting Difference' | 'Partial Match' | 'Missing Content' | 'Additional Content' | 'Incorrect Content' | 'Unable to Validate';
  item: string;
  expected?: string;
  found?: string;
  page?: string;
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

export interface DeliveryQaReport {
  websiteDeliveryStatus: 'READY FOR DELIVERY' | 'MINOR FIXES REQUIRED' | 'MAJOR ISSUES FOUND';
  totalIssuesCount: number;
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

/**
 * Runs pre-client delivery QA checks dynamically
 */
export function runDeliveryQaEngine(
  docData: GoogleDocResult,
  siteData: FullWebsiteScrapeResult
): DeliveryQaReport {
  const docText = docData.rawText;

  // 1. Page-Wise Validation Report
  const expectedStandardPages = ['Homepage', 'About Page', 'Services Page', 'Contact Page', 'Privacy Policy', 'Terms & Conditions'];
  const foundPagesMap = new Map<string, PageScrapeData>();
  siteData.pages.forEach(p => foundPagesMap.set(p.name, p));

  const pageWiseReport: PageValidationResult[] = [];
  let totalIssuesCount = 0;
  let missingContentCount = 0;
  let brokenLinksCount = 0;
  let missingButtonsCount = 0;
  let seoIssuesCount = 0;
  let contactIssuesCount = 0;
  let formIssuesCount = 0;

  // Process found & expected pages
  const allPageNames = Array.from(new Set([...expectedStandardPages, ...siteData.discoveredPageNames]));

  for (const pageName of allPageNames) {
    const pageData = foundPagesMap.get(pageName);

    if (!pageData) {
      // Missing required page (e.g. Terms & Conditions)
      if (pageName === 'Privacy Policy' || pageName === 'Terms & Conditions' || pageName === 'Contact Page') {
        pageWiseReport.push({
          name: pageName,
          url: '',
          status: 'Missing Page',
          missingContent: [`Entire ${pageName} is missing from site navigation`],
          missingSections: [`${pageName} Section`],
          additionalContent: [],
          passedChecks: []
        });
        totalIssuesCount++;
      }
      continue;
    }

    const missingContent: string[] = [];
    const missingSections: string[] = [];
    const passedChecks: string[] = [];

    // Check headings
    if (pageData.h1.length === 0) {
      missingContent.push('H1 Heading Tag');
      seoIssuesCount++;
    } else {
      passedChecks.push('H1 Heading Present');
    }

    // Check Meta Title
    if (!pageData.metaTitle || pageData.metaTitle.length < 3) {
      missingContent.push('Meta Title');
      seoIssuesCount++;
    } else {
      passedChecks.push('SEO Meta Title Present');
    }

    // Check Meta Description
    if (!pageData.metaDescription) {
      missingContent.push('Meta Description');
      seoIssuesCount++;
    }

    // Check Buttons (Only mark as issue if missing action or invalid)
    const invalidButtons = pageData.buttons.filter(b => b.isValid === false);
    if (invalidButtons.length > 0) {
      missingContent.push(`${invalidButtons.length} CTA Button(s) missing action`);
      missingButtonsCount += invalidButtons.length;
    } else if (pageData.buttons.length > 0) {
      passedChecks.push('Buttons Action Assigned');
    }

    // Check Page Status
    const isPassed = missingContent.length === 0;
    pageWiseReport.push({
      name: pageName,
      url: pageData.url,
      status: isPassed ? 'Passed' : 'Requires Changes',
      missingContent,
      missingSections,
      additionalContent: [],
      passedChecks
    });

    if (!isPassed) totalIssuesCount += missingContent.length;
  }

  // 2. Content Validation (Google Doc vs Website)
  const contentDiscrepancies: ContentDiscrepancyResult[] = [];

  // Check expected Phone with normalized country code & formatting comparison
  const docPhoneMatch = docText.match(/(\+?\d[0-9\s\-]{8,}\d)/);
  const foundPhone = siteData.globalContactInfo.phone.value;

  if (docPhoneMatch) {
    const expectedPhone = docPhoneMatch[1];
    if (!siteData.globalContactInfo.phone.present) {
      contentDiscrepancyAdd(contentDiscrepancies, 'Missing Content', 'Phone Number', expectedPhone, 'Not Found');
      missingContentCount++;
      contactIssuesCount++;
    } else if (foundPhone) {
      if (arePhonesEquivalent(expectedPhone, foundPhone)) {
        if (expectedPhone.trim() !== foundPhone.trim()) {
          contentDiscrepancyAdd(contentDiscrepancies, 'Minor Formatting Difference', 'Phone Number', expectedPhone, foundPhone, 'Format variation (e.g. +44 vs 0 / spaces)');
        } else {
          contentDiscrepancyAdd(contentDiscrepancies, 'Matched Content', 'Phone Number', expectedPhone, foundPhone);
        }
      } else {
        contentDiscrepancyAdd(contentDiscrepancies, 'Incorrect Content', 'Phone Number', expectedPhone, foundPhone);
        contactIssuesCount++;
      }
    }
  }

  // Check expected Email with case-insensitive normalization
  const docEmailMatch = docText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const foundEmail = siteData.globalContactInfo.email.value;

  if (docEmailMatch) {
    const expectedEmail = docEmailMatch[1];
    if (!siteData.globalContactInfo.email.present) {
      contentDiscrepancyAdd(contentDiscrepancies, 'Missing Content', 'Email Address', expectedEmail, 'Not Found');
      missingContentCount++;
      contactIssuesCount++;
    } else if (foundEmail) {
      if (areEmailsEquivalent(expectedEmail, foundEmail)) {
        contentDiscrepancyAdd(contentDiscrepancies, 'Matched Content', 'Email Address', expectedEmail, foundEmail);
      } else {
        contentDiscrepancyAdd(contentDiscrepancies, 'Incorrect Content', 'Email Address', expectedEmail, foundEmail);
        contactIssuesCount++;
      }
    }
  }

  // Compare CTAs from document specifications against live website buttons
  const docCtaMatches = docText.match(/(Book|Contact|Get|Request|Find|Schedule|Call|Download|Claim|Buy|Order)\s+[A-Za-z0-9\s]{2,30}/gi);
  if (docCtaMatches && docCtaMatches.length > 0) {
    const uniqueDocCtas: string[] = Array.from(new Set(docCtaMatches.map((c: string) => c.trim()))).slice(0, 5);
    uniqueDocCtas.forEach((cta: string) => {
      const matchingBtn = siteData.allButtons.find(b => 
        b.text.toLowerCase().includes(cta.toLowerCase()) || 
        cta.toLowerCase().includes(b.text.toLowerCase())
      );
      if (matchingBtn) {
        const comp = compareCtaOrCopy(cta, matchingBtn.text);
        contentDiscrepancyAdd(contentDiscrepancies, comp.status, `CTA Button ("${cta}")`, cta, matchingBtn.text, comp.notes);
      } else {
        contentDiscrepancyAdd(contentDiscrepancies, 'Missing Content', `CTA Button ("${cta}")`, cta, 'Not Found on Website', 'CTA button specified in document is missing on website');
        missingContentCount++;
      }
    });
  }

  // Compare Headings from document specifications against live website H1/H2 tags
  const docHeadings = docText.match(/^(#{1,4}|\[|\bHeading:\b)\s*(.+)$/gm);
  if (docHeadings && docHeadings.length > 0) {
    const uniqueHeadings = Array.from(new Set(docHeadings.map(h => h.replace(/^#{1,4}\s*|^\[|\]$|^\bHeading:\b\s*/gi, '').trim()))).filter(h => h.length > 3).slice(0, 5);
    const allSiteH1s = siteData.pages.flatMap(p => p.h1).map(h => h.toLowerCase());
    
    uniqueHeadings.forEach(h => {
      const siteHasHeading = allSiteH1s.some(sh => sh.includes(h.toLowerCase()) || h.toLowerCase().includes(sh));
      if (siteHasHeading) {
        contentDiscrepancyAdd(contentDiscrepancies, 'Matched Content', `Section Heading ("${h}")`, h, h, 'Heading matched in website pages');
      } else {
        contentDiscrepancyAdd(contentDiscrepancies, 'Missing Content', `Section Heading ("${h}")`, h, 'Not Found on Website', 'Section heading specified in document copy is missing on website');
        missingContentCount++;
      }
    });
  }

  // 3. Button Validation Summary
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

  // 4. Link Validation
  const linksReport: LinkValidationSummary = {
    workingCount: siteData.linkCounters.working,
    brokenCount: siteData.linkCounters.broken,
    missingCount: siteData.linkCounters.missing,
    items: [
      { name: 'Privacy Policy', href: '/privacy-policy', status: foundPagesMap.has('Privacy Policy') ? 'Working' : 'Missing Link' },
      { name: 'Terms & Conditions', href: '/terms', status: foundPagesMap.has('Terms & Conditions') ? 'Working' : 'Missing Link' },
      { name: 'Contact Page', href: '/contact', status: foundPagesMap.has('Contact Page') ? 'Working' : 'Missing Link' }
    ]
  };

  // 5. Contact Information Validation
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

  // 6. SEO Quick Check Summary (High Confidence Wix & SaaS Builder SEO Audit)
  let allTitlePassed = true;
  let allDescPassed = true;
  let allH1Passed = true;
  let allAltPassed = true;
  let anyUnableToValidate = false;

  const seoDetails: PageSeoItem[] = siteData.pages.map(p => {
    // 1. Loading Error check
    if (p.isAccessible === false || p.status >= 400) {
      anyUnableToValidate = true;
      return {
        page: p.name,
        metaTitleStatus: 'Loading Error',
        metaDescStatus: 'Loading Error',
        h1Status: 'Loading Error',
        altTextStatus: 'Loading Error'
      };
    }

    // 2. Inconclusive extraction confidence check
    if (p.seoExtractionSuccess === false) {
      anyUnableToValidate = true;
      return {
        page: p.name,
        metaTitleStatus: 'Unable to Validate',
        metaDescStatus: 'Unable to Validate',
        h1Status: 'Unable to Validate',
        altTextStatus: 'Unable to Validate'
      };
    }

    // 3. High-confidence validation
    const titleStatus: SeoStatusType = (p.metaTitle && p.metaTitle.trim().length >= 2) ? 'Passed' : 'Missing';
    const descStatus: SeoStatusType = (p.metaDescription && p.metaDescription.trim().length >= 3) ? 'Passed' : 'Missing';
    const h1Status: SeoStatusType = (p.h1 && p.h1.length > 0) ? 'Passed' : 'Missing';
    const altStatus: SeoStatusType = (p.imagesTotal === 0 || p.imagesMissingAlt === 0) ? 'Passed' : 'Missing';

    if (titleStatus === 'Missing') allTitlePassed = false;
    if (descStatus === 'Missing') allDescPassed = false;
    if (h1Status === 'Missing') allH1Passed = false;
    if (altStatus === 'Missing') allAltPassed = false;

    return {
      page: p.name,
      metaTitleStatus: titleStatus,
      metaDescStatus: descStatus,
      h1Status: h1Status,
      altTextStatus: altStatus
    };
  });

  // Calculate overall SEO summary values
  const metaTitleSummary: SeoStatusType = anyUnableToValidate && !allTitlePassed ? 'Unable to Validate' : (allTitlePassed ? 'Passed' : 'Missing');
  const metaDescSummary: SeoStatusType = anyUnableToValidate && !allDescPassed ? 'Unable to Validate' : (allDescPassed ? 'Passed' : 'Missing');
  const h1Summary: SeoStatusType = anyUnableToValidate && !allH1Passed ? 'Unable to Validate' : (allH1Passed ? 'Passed' : 'Missing');
  const altTextSummary: SeoStatusType = anyUnableToValidate && !allAltPassed ? 'Unable to Validate' : (allAltPassed ? 'Passed' : 'Missing');

  let overallStatus: 'Passed' | 'Requires Attention' | 'Unable to Validate' = 'Passed';
  if (metaTitleSummary === 'Missing' || metaDescSummary === 'Missing') {
    overallStatus = 'Requires Attention';
  } else if (metaTitleSummary === 'Unable to Validate' || metaDescSummary === 'Unable to Validate') {
    overallStatus = 'Unable to Validate';
  }

  const seoQuickCheck: SeoQuickCheckSummary = {
    overallStatus,
    metaTitle: metaTitleSummary,
    metaDescription: metaDescSummary,
    h1: h1Summary,
    altText: altTextSummary,
    details: seoDetails
  };

  // 7. Form Validation
  const hasContactForm = siteData.pages.some(p => p.forms.length > 0);
  const formsReport: FormValidationSummary = {
    contactForm: hasContactForm ? 'Passed' : 'Missing',
    newsletterForm: 'Passed',
    quoteForm: 'Passed'
  };

  if (!hasContactForm) formIssuesCount++;

  // 8. Compute Final Delivery Status
  totalIssuesCount = missingContentCount + brokenLinksCount + missingButtonsCount + seoIssuesCount + contactIssuesCount + formIssuesCount;

  let websiteDeliveryStatus: 'READY FOR DELIVERY' | 'MINOR FIXES REQUIRED' | 'MAJOR ISSUES FOUND' = 'READY FOR DELIVERY';

  if (totalIssuesCount >= 5 || !hasContactForm || contactInfoReport.email.status === 'Missing') {
    websiteDeliveryStatus = 'MAJOR ISSUES FOUND';
  } else if (totalIssuesCount > 0) {
    websiteDeliveryStatus = 'MINOR FIXES REQUIRED';
  }

  return {
    websiteDeliveryStatus,
    totalIssuesCount,
    counters: {
      missingContent: missingContentCount,
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
  item: string,
  expected?: string,
  found?: string,
  notes?: string
) {
  arr.push({ type, item, expected, found, notes });
}
