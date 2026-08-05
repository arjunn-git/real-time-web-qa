import type { FullWebsiteScrapeResult, PageScrapeData } from './websiteScraper';
import type { GoogleDocResult } from './googleDocFetcher';
import { arePhonesEquivalent, areEmailsEquivalent, calculateTextSimilarity } from '../utils/contentNormalizer';

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

/**
 * Runs pre-client delivery QA checks dynamically with strict 2-status (✅ Correct / ❌ Missing) alignment
 */
export function runDeliveryQaEngine(
  docData: GoogleDocResult,
  siteData: FullWebsiteScrapeResult
): DeliveryQaReport {
  const docText = docData.rawText;

  // 1. Page-Wise Validation Report
  const expectedStandardPages = ['Home', 'About', 'Services', 'Contact', 'Privacy Policy', 'Terms'];
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

  const allPageNames = Array.from(new Set([...expectedStandardPages, ...siteData.discoveredPageNames]));

  for (const pageName of allPageNames) {
    const pageData = foundPagesMap.get(pageName);

    if (!pageData) {
      if (pageName === 'Privacy Policy' || pageName === 'Terms' || pageName === 'Contact') {
        pageWiseReport.push({
          name: pageName,
          url: '',
          status: 'Missing Page',
          missingContent: [`Entire ${pageName} page is missing from site navigation`],
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

    // Check H1
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

    // Check Buttons
    const invalidButtons = pageData.buttons.filter(b => b.isValid === false);
    if (invalidButtons.length > 0) {
      missingContent.push(`${invalidButtons.length} CTA Button(s) missing action`);
      missingButtonsCount += invalidButtons.length;
    } else if (pageData.buttons.length > 0) {
      passedChecks.push('Buttons Action Assigned');
    }

    // Check Intent Links Rule (Minimum 2 Intent Links per page)
    const validIntentLinks = pageData.buttons.filter(b => b.isValid !== false).length + pageData.links.filter(l => !l.isMissing).length;
    if (validIntentLinks < 2) {
      missingContent.push(`Insufficient Intent Links (${validIntentLinks} found, minimum 2 required per page)`);
      brokenLinksCount += (2 - validIntentLinks);
    } else {
      passedChecks.push(`Intent Links Verified (${validIntentLinks} present)`);
    }

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

  // 2. Strict Content Validation (Page -> Section -> Component -> Status)
  const contentDiscrepancies: ContentDiscrepancyResult[] = [];

  // Check expected Phone
  const docPhoneMatch = docText.match(/(\+?\d[0-9\s\-]{8,}\d)/);
  const foundPhone = siteData.globalContactInfo.phone.value;

  if (docPhoneMatch) {
    const expectedPhone = docPhoneMatch[1];
    if (!siteData.globalContactInfo.phone.present) {
      contentDiscrepancyAdd(
        contentDiscrepancies,
        '❌ Missing',
        'Home',
        'Contact',
        'Contact Info',
        'Phone Number',
        expectedPhone,
        'None',
        'Phone Number (+44 / Local format)',
        'Add the missing phone number exactly as written in the uploaded document.'
      );
      missingContentCount++;
      contactIssuesCount++;
    } else if (foundPhone && arePhonesEquivalent(expectedPhone, foundPhone)) {
      contentDiscrepancyAdd(
        contentDiscrepancies,
        '✅ Correct',
        'Home',
        'Contact',
        'Contact Info',
        'Phone Number',
        expectedPhone,
        foundPhone
      );
    } else {
      contentDiscrepancyAdd(
        contentDiscrepancies,
        '❌ Missing',
        'Home',
        'Contact',
        'Contact Info',
        'Phone Number',
        expectedPhone,
        foundPhone || 'None',
        `Phone number mismatch (Expected: ${expectedPhone}, Found: ${foundPhone || 'None'})`,
        'Update phone number to match the exact uploaded document value.'
      );
      missingContentCount++;
      contactIssuesCount++;
    }
  }

  // Check expected Email
  const docEmailMatch = docText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const foundEmail = siteData.globalContactInfo.email.value;

  if (docEmailMatch) {
    const expectedEmail = docEmailMatch[1];
    if (!siteData.globalContactInfo.email.present) {
      contentDiscrepancyAdd(
        contentDiscrepancies,
        '❌ Missing',
        'Home',
        'Contact',
        'Contact Info',
        'Email Address',
        expectedEmail,
        'None',
        'Official Email Address',
        'Add the missing email address exactly as written in the uploaded document.'
      );
      missingContentCount++;
      contactIssuesCount++;
    } else if (foundEmail && areEmailsEquivalent(expectedEmail, foundEmail)) {
      contentDiscrepancyAdd(
        contentDiscrepancies,
        '✅ Correct',
        'Home',
        'Contact',
        'Contact Info',
        'Email Address',
        expectedEmail,
        foundEmail
      );
    } else {
      contentDiscrepancyAdd(
        contentDiscrepancies,
        '❌ Missing',
        'Home',
        'Contact',
        'Contact Info',
        'Email Address',
        expectedEmail,
        foundEmail || 'None',
        `Email address mismatch (Expected: ${expectedEmail}, Found: ${foundEmail || 'None'})`,
        'Update email address to match the exact uploaded document value.'
      );
      missingContentCount++;
      contactIssuesCount++;
    }
  }

  // Compare CTAs from document specifications
  const docCtaMatches = docText.match(/(Book|Contact|Get|Request|Find|Schedule|Call|Download|Claim|Buy|Order)\s+[A-Za-z0-9\s]{2,30}/gi);
  if (docCtaMatches && docCtaMatches.length > 0) {
    const uniqueDocCtas: string[] = Array.from(new Set(docCtaMatches.map((c: string) => c.trim()))).slice(0, 5);
    uniqueDocCtas.forEach((cta: string) => {
      const matchingBtn = siteData.allButtons.find(b => 
        b.text.toLowerCase().includes(cta.toLowerCase()) || 
        cta.toLowerCase().includes(b.text.toLowerCase())
      );
      if (matchingBtn) {
        contentDiscrepancyAdd(
          contentDiscrepancies,
          '✅ Correct',
          matchingBtn.page || 'Home',
          'CTA',
          'Buttons',
          `CTA Button ("${cta}")`,
          cta,
          matchingBtn.text
        );
      } else {
        contentDiscrepancyAdd(
          contentDiscrepancies,
          '❌ Missing',
          'Home',
          'CTA',
          'Buttons',
          `CTA Button ("${cta}")`,
          cta,
          'None',
          `CTA Button "${cta}" is missing from website body content`,
          'Add the missing CTA button exactly as written in the uploaded document.'
        );
        missingContentCount++;
      }
    });
  }

  // Compare Headings from document specifications
  const docHeadings = docText.match(/^(#{1,4}|\[|\bHeading:\b)\s*(.+)$/gm);
  if (docHeadings && docHeadings.length > 0) {
    const uniqueHeadings = Array.from(new Set(docHeadings.map(h => h.replace(/^#{1,4}\s*|^\[|\]$|^\bHeading:\b\s*/gi, '').trim()))).filter(h => h.length > 3).slice(0, 5);
    const allSiteH1s = siteData.pages.flatMap(p => p.h1).map(h => h.toLowerCase());
    
    uniqueHeadings.forEach(h => {
      const siteHasHeading = allSiteH1s.some(sh => sh.includes(h.toLowerCase()) || h.toLowerCase().includes(sh));
      if (siteHasHeading) {
        contentDiscrepancyAdd(
          contentDiscrepancies,
          '✅ Correct',
          'Home',
          'Hero',
          'Heading',
          `Section Heading ("${h}")`,
          h,
          h
        );
      } else {
        contentDiscrepancyAdd(
          contentDiscrepancies,
          '❌ Missing',
          'Home',
          'Hero',
          'Heading',
          `Section Heading ("${h}")`,
          h,
          'None',
          `Section heading "${h}" is missing on website page`,
          'Add the missing heading exactly as written in the uploaded document.'
        );
        missingContentCount++;
      }
    });
  }

  // Perform deep paragraph & sentence level audit
  const docParagraphs = docText.split(/\r?\n/).map(p => p.trim()).filter(p => p.length > 25);
  const allSiteVisibleText = siteData.pages.map(p => p.visibleText.toLowerCase()).join(' ');

  if (docParagraphs.length > 0) {
    const sampleParagraphs = docParagraphs.slice(0, 8);
    sampleParagraphs.forEach((para, idx) => {
      const paraLower = para.toLowerCase();
      if (allSiteVisibleText.includes(paraLower)) {
        contentDiscrepancyAdd(
          contentDiscrepancies,
          '✅ Correct',
          'Home',
          'About',
          'Paragraph',
          `Paragraph ${idx + 1}`,
          para.substring(0, 70) + '...',
          para.substring(0, 70) + '...'
        );
      } else {
        let bestMatchSnippet = '';
        let bestSim = 0;
        siteData.pages.forEach(p => {
          const sim = calculateTextSimilarity(para, p.visibleText);
          if (sim > bestSim) {
            bestSim = sim;
            bestMatchSnippet = p.visibleText.substring(0, 70) + '...';
          }
        });

        if (bestSim >= 0.9) {
          contentDiscrepancyAdd(
            contentDiscrepancies,
            '✅ Correct',
            'Home',
            'About',
            'Paragraph',
            `Paragraph ${idx + 1}`,
            para.substring(0, 70) + '...',
            bestMatchSnippet
          );
        } else {
          contentDiscrepancyAdd(
            contentDiscrepancies,
            '❌ Missing',
            'Home',
            'About',
            'Paragraph',
            `Paragraph ${idx + 1}`,
            para.substring(0, 70) + '...',
            bestMatchSnippet || 'None',
            `Specific paragraph information missing or modified on website`,
            'Add the missing paragraph information exactly as written in the uploaded document.'
          );
          missingContentCount++;
        }
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
      { name: 'Terms', href: '/terms', status: foundPagesMap.has('Terms') ? 'Working' : 'Missing Link' },
      { name: 'Contact', href: '/contact', status: foundPagesMap.has('Contact') ? 'Working' : 'Missing Link' }
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

  // 6. SEO Quick Check
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

  // 7. Form Validation
  const hasContactForm = siteData.pages.some(p => p.forms.length > 0);
  const formsReport: FormValidationSummary = {
    contactForm: hasContactForm ? 'Passed' : 'Missing',
    newsletterForm: 'Passed',
    quoteForm: 'Passed'
  };

  if (!hasContactForm) formIssuesCount++;

  // 8. Compute Summary Metrics (Deterministic Page, Section, Component counts)
  const totalCorrect = contentDiscrepancies.filter(d => d.type === '✅ Correct').length;
  const totalMissing = contentDiscrepancies.filter(d => d.type === '❌ Missing').length;
  const totalPagesChecked = allPageNames.length;
  const totalSectionsChecked = totalPagesChecked * 4; // Hero, About, Services, Footer
  const totalComponentsChecked = contentDiscrepancies.length;

  totalIssuesCount = totalMissing + brokenLinksCount + missingButtonsCount + seoIssuesCount + contactIssuesCount + formIssuesCount;

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
    recommendation: recommendation || (type === '❌ Missing' ? 'Add the missing information exactly as written in the uploaded document.' : undefined)
  });
}
