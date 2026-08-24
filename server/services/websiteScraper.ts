import { chromium } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedButtonData {
  text: string;
  href: string;
  actionType: string;
  isValid: boolean;
  statusLabel: string;
}

export interface PageScrapeData {
  name: string;
  url: string;
  path: string;
  status: number;
  isAccessible: boolean;
  seoExtractionSuccess: boolean;
  h1: string[];
  metaTitle: string;
  metaDescription: string;
  imagesTotal: number;
  imagesMissingAlt: number;
  buttons: ScrapedButtonData[];
  links: Array<{ text: string; href: string; type: 'internal' | 'external'; isBroken: boolean; isMissing: boolean }>;
  forms: Array<{ type: string; fieldsCount: number; hasSubmitButton: boolean; status: 'Passed' | 'Submit Button Missing' | 'Failed' }>;
  contactInfo: {
    phones: string[];
    emails: string[];
    addresses: string[];
    socials: {
      instagram?: 'Working' | 'Missing';
      linkedin?: 'Working' | 'Missing';
      facebook?: 'Working' | 'Missing';
      twitter?: 'Working' | 'Missing';
    };
  };
  visibleText: string;
  structuredContent?: {
    name: string;
    sections: Array<{
      name: string;
      heading?: string;
      paragraphs: string[];
      lists: string[];
      buttons: string[];
      tables?: string[][][];
      forms?: string[];
      footer?: string;
    }>;
  };
}

export interface FullWebsiteScrapeResult {
  baseUrl: string;
  siteTitle: string;
  pages: PageScrapeData[];
  discoveredPageNames: string[];
  allButtons: Array<{ page: string; text: string; href: string; actionType: string; isValid: boolean; statusLabel: string }>;
  linkCounters: { working: number; broken: number; missing: number };
  globalContactInfo: {
    phone: { present: boolean; value?: string };
    email: { present: boolean; value?: string };
    address: { present: boolean; value?: string };
    instagram: 'Working' | 'Missing';
    linkedin: 'Working' | 'Missing';
    facebook: 'Working' | 'Missing';
    twitter: 'Working' | 'Missing';
    socialLinks?: Array<{ platform: string; href: string }>;
  };
}

function getCleanUrl(urlStr: string): string {
  let clean = urlStr.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
}

/**
 * Scrapes full multi-page website using Playwright with page traversal and structured hierarchy extraction.
 */
export async function scrapeFullWebsite(targetUrl: string): Promise<FullWebsiteScrapeResult> {
  const cleanUrl = getCleanUrl(targetUrl);
  const parsedBase = new URL(cleanUrl);
  const origin = parsedBase.origin;

  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });

    // Block image, font, and media assets for high performance
    await context.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'media', 'font'].includes(type)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    const page = await context.newPage();
    const response = await page.goto(cleanUrl, { waitUntil: 'load', timeout: 30000 });

    if (!response) {
      throw new Error('Website failed to load or returned no response.');
    }
    if (response.status() === 403) {
      throw new Error('Website blocked automated access (403 Forbidden).');
    }
    if (response.status() === 404) {
      throw new Error('Website homepage not found (404 Error).');
    }

    // Wait for dynamic Wix state rendering to settle
    await page.waitForTimeout(4000);

    const mainTitle = await page.title();

    // Discover internal links with strict origin restrictions
    const discoveredLinks: string[] = await page.$$eval('a[href]', (anchors, baseOrigin) => {
      const links = new Set<string>();
      anchors.forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          try {
            const absolute = new URL(href, baseOrigin).href;
            if (absolute.startsWith(baseOrigin)) {
              const cleanLink = absolute.split('#')[0].replace(/\/$/, '');
              links.add(cleanLink);
            }
          } catch (e) {}
        }
      });
      return Array.from(links);
    }, origin);

    const urlsToInspect: string[] = [];
    const seenUrls = new Set<string>();

    const normClean = cleanUrl.split('#')[0].replace(/\/$/, '');
    seenUrls.add(normClean);
    urlsToInspect.push(cleanUrl);

    discoveredLinks.forEach(l => {
      const normL = l.split('#')[0].replace(/\/$/, '');
      if (!seenUrls.has(normL) && urlsToInspect.length < 10) {
        seenUrls.add(normL);
        urlsToInspect.push(l);
      }
    });

    const pagesData: PageScrapeData[] = [];
    const allButtonsAcc: Array<{ page: string; text: string; href: string; actionType: string; isValid: boolean; statusLabel: string }> = [];

    let totalWorkingLinks = 0;
    let totalBrokenLinks = 0;
    let totalMissingLinks = 0;

    let globalPhone = { present: false, value: '' };
    let globalEmail = { present: false, value: '' };
    let globalAddress = { present: false, value: '' };
    let globalInsta: 'Working' | 'Missing' = 'Missing';
    let globalLinkedIn: 'Working' | 'Missing' = 'Missing';
    let globalFB: 'Working' | 'Missing' = 'Missing';
    let globalTwitter: 'Working' | 'Missing' = 'Missing';
    let globalSocialLinks: Array<{ platform: string; href: string }> = [];

    // Core page element and structured hierarchy extractor script
    const pageInspectScript = `
      (() => {
        let seoExtractionSuccess = true;
        const h1s = Array.from(document.querySelectorAll('h1')).map(h => (h.textContent || '').trim()).filter(Boolean);
        const metaTitle = document.title || '';
        
        let metaDescription = '';
        const metaDescEl = document.querySelector('meta[name="description" i], meta[property="og:description" i]');
        if (metaDescEl) metaDescription = (metaDescEl.getAttribute('content') || '').trim();

        const imgs = Array.from(document.querySelectorAll('img'));
        const imagesTotal = imgs.length;
        const imagesMissingAlt = imgs.filter(img => !img.getAttribute('alt')?.trim()).length;

        // Button action classifier
        function classifyButtonAction(el) {
          const href = (el.getAttribute('href') || el.getAttribute('data-href') || '').trim();
          const hrefLower = href.toLowerCase();
          const type = (el.getAttribute('type') || '').toLowerCase();
          const className = (el.className || '').toString().toLowerCase();
          const id = (el.getAttribute('id') || '').toLowerCase();

          if (hrefLower.startsWith('tel:')) return { actionType: 'Phone Link', isValid: true, statusLabel: 'Phone Link (Valid)' };
          if (hrefLower.startsWith('mailto:')) return { actionType: 'Email Link', isValid: true, statusLabel: 'Email Link (Valid)' };
          if (type === 'submit' || !!el.closest('form') || id.includes('submit')) {
            return { actionType: 'Opens Lead Form', isValid: true, statusLabel: 'Opens Lead Form (Valid)' };
          }
          if (hrefLower.startsWith('#') && hrefLower.length > 1) {
            return { actionType: 'Scrolls to Section', isValid: true, statusLabel: 'Scrolls to Section (Valid)' };
          }
          if (href && (href.startsWith('/') || href.startsWith('http'))) {
            if (href.startsWith('/') || href.includes(window.location.hostname)) {
              return { actionType: 'Internal Page Link', isValid: true, statusLabel: 'Internal Page Link (Valid)' };
            }
            return { actionType: 'External URL', isValid: true, statusLabel: 'External URL (Valid)' };
          }
          if (!href || href === '#' || href === '') {
            return { actionType: 'Missing Action', isValid: false, statusLabel: 'Missing Action' };
          }
          return { actionType: 'Internal Page Link', isValid: true, statusLabel: 'Internal Page Link (Valid)' };
        }

        // Element type checks
        function isButton(el) {
          const tagName = el.tagName.toLowerCase();
          const role = (el.getAttribute('role') || '').toLowerCase();
          const className = (el.className || '').toString().toLowerCase();
          if (tagName === 'button' || role === 'button') return true;
          if (tagName === 'a' && (className.includes('btn') || className.includes('button') || className.includes('cta'))) return true;
          return false;
        }

        const allInteractive = Array.from(document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"]'));
        const buttonsData = [];
        const linksData = [];

        allInteractive.forEach(el => {
          let text = (el.textContent || el.getAttribute('value') || '').trim();
          // Normalize spaces and double spaces inside text
          text = text.replace(/\s+/g, ' ');
          const href = el.getAttribute('href') || '';
          if (!text || text.length < 1) return;

          if (isButton(el)) {
            // Ignore card containers that wrap long paragraph text blocks
            if (text.length > 50) {
              // Push as standard internal link instead of CTA button
              linksData.push({
                text: text.substring(0, 40) + '...',
                href,
                type: (href.startsWith('http') && !href.includes(window.location.hostname)) ? 'external' : 'internal',
                isBroken: false,
                isMissing: !href || href === '#'
              });
              return;
            }
            const cl = classifyButtonAction(el);
            buttonsData.push({ text, href, actionType: cl.actionType, isValid: cl.isValid, statusLabel: cl.statusLabel });
          } else {
            linksData.push({
              text,
              href,
              type: (href.startsWith('http') && !href.includes(window.location.hostname)) ? 'external' : 'internal',
              isBroken: false,
              isMissing: !href || href === '#'
            });
          }
        });

        // Social links
        let instaFound = false, linkedinFound = false, fbFound = false, twitterFound = false;
        const socialLinks = [];
        Array.from(document.querySelectorAll('a[href]')).forEach(a => {
          const href = (a.getAttribute('href') || '').trim();
          const hrefLower = href.toLowerCase();
          if (hrefLower.includes('instagram.com')) {
            instaFound = true;
            socialLinks.push({ platform: 'instagram', href });
          } else if (hrefLower.includes('linkedin.com')) {
            linkedinFound = true;
            socialLinks.push({ platform: 'linkedin', href });
          } else if (hrefLower.includes('facebook.com')) {
            fbFound = true;
            socialLinks.push({ platform: 'facebook', href });
          } else if (hrefLower.includes('twitter.com') || hrefLower.includes('x.com')) {
            twitterFound = true;
            socialLinks.push({ platform: 'twitter', href });
          } else if (hrefLower.includes('wa.me') || hrefLower.includes('whatsapp.com') || hrefLower.startsWith('whatsapp:')) {
            socialLinks.push({ platform: 'whatsapp', href });
          }
        });

        // Form elements
        const formsData = Array.from(document.querySelectorAll('form')).map(f => ({
          type: f.getAttribute('id') || f.getAttribute('name') || 'Form',
          fieldsCount: f.querySelectorAll('input, textarea, select').length,
          hasSubmitButton: !!f.querySelector('button, input[type="submit"]'),
          status: f.querySelector('button, input[type="submit"]') ? 'Passed' : 'Submit Button Missing'
        }));

        // Document hierarchy traversal in reading order
        const sections = [];
        let currentSection = { name: 'Hero', heading: '', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };

        function classifySectionName(str) {
          const t = str.toLowerCase().trim();
          if (t.match(/\\b(hero|welcome|banner|home)\\b/i)) return 'Hero';
          if (t.match(/\\b(about|who we are|story|company)\\b/i)) return 'About';
          if (t.match(/\\b(service|what we do|solutions|capabilities)\\b/i)) return 'Services';
          if (t.match(/\\b(process|how we work)\\b/i)) return 'Process';
          if (t.match(/\\b(faq|questions|q&a)\\b/i)) return 'FAQs';
          if (t.match(/\\b(testimonial|reviews|feedback)\\b/i)) return 'Testimonials';
          if (t.match(/\\b(contact|get in touch|reach us)\\b/i)) return 'Contact';
          if (t.match(/\\b(footer|copyright|privacy)\\b/i)) return 'Footer';
          if (t.match(/\\b(cta|call to action|book)\\b/i)) return 'CTA';
          return 'General';
        }

        function commitSection() {
          if (currentSection.heading || currentSection.paragraphs.length > 0 || currentSection.lists.length > 0 || currentSection.buttons.length > 0 || currentSection.tables.length > 0) {
            sections.push({ ...currentSection });
            currentSection = { name: 'General', heading: '', paragraphs: [], lists: [], buttons: [], tables: [], forms: [] };
          }
        }

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
        let node = walker.currentNode;
        while (node) {
          const el = node;
          const tagName = el.tagName.toLowerCase();
          const textVal = (el.textContent || '').trim();

          if (tagName === 'section' || tagName === 'header' || tagName === 'footer') {
            commitSection();
            currentSection.name = classifySectionName(el.className + ' ' + el.id + ' ' + tagName);
          }
          if (/^h[1-6]$/.test(tagName) && textVal) {
            commitSection();
            currentSection.name = classifySectionName(textVal);
            currentSection.heading = textVal;
          }
          if ((tagName === 'ul' || tagName === 'ol') && textVal) {
            el.querySelectorAll('li').forEach(li => {
              const liText = (li.textContent || '').trim();
              if (liText) currentSection.lists.push(liText);
            });
          }
          if (tagName === 'table') {
            const tableRows = [];
            el.querySelectorAll('tr').forEach(tr => {
              const row = Array.from(tr.querySelectorAll('td, th')).map(c => (c.textContent || '').trim());
              if (row.length > 0) tableRows.push(row);
            });
            if (tableRows.length > 0) currentSection.tables.push(tableRows);
          }
          if (isButton(el) && textVal && textVal.length < 50) {
            currentSection.buttons.push(textVal);
          }
          if (tagName === 'form') {
            currentSection.forms.push(el.getAttribute('id') || el.getAttribute('name') || 'Form');
          }
          if (tagName === 'p' && textVal && textVal.length > 10 && !isButton(el)) {
            currentSection.paragraphs.push(textVal);
          }

          node = walker.nextNode();
        }
        commitSection();

        const bodyText = document.body ? document.body.innerText || '' : '';
        const addressElText = Array.from(document.querySelectorAll('address, footer, header')).map(el => el.textContent || '').join(' ');

        return {
          seoExtractionSuccess,
          h1s,
          metaTitle,
          metaDescription,
          imagesTotal,
          imagesMissingAlt,
          buttonsData,
          linksData,
          formsData,
          telLinks: Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => a.getAttribute('href').replace(/^tel:/i, '')),
          mailtoLinks: Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(a => a.getAttribute('href').replace(/^mailto:/i, '')),
          instaFound,
          linkedinFound,
          fbFound,
          twitterFound,
          socialLinks,
          bodyText,
          addressElText,
          sections
        };
      })()
    `;

    const processedPageNames = new Set<string>();

    for (const urlItem of urlsToInspect) {
      try {
        let inspectPage = page;
        let isAccessible = true;

        if (urlItem !== cleanUrl) {
          inspectPage = await context.newPage();
          const pageRes = await inspectPage.goto(urlItem, { waitUntil: 'load', timeout: 20000 });
          if (!pageRes || pageRes.status() >= 400) {
            isAccessible = false;
          }
          await inspectPage.waitForTimeout(3000);
        }

        const currentUrlObj = new URL(urlItem);
        const pathName = currentUrlObj.pathname;

        let pageName = 'Home';
        const cleanPath = pathName.replace(/^\/(website|site|wixsite)-\d+\/?/i, '/').replace(/^\//, '');

        if (pathName === '/' || pathName === '' || cleanPath === '') {
          pageName = 'Home';
        } else if (cleanPath.toLowerCase().includes('about')) {
          pageName = 'About';
        } else if (cleanPath.toLowerCase().includes('service')) {
          pageName = 'Services';
        } else if (cleanPath.toLowerCase().includes('contact')) {
          pageName = 'Contact';
        } else if (cleanPath.toLowerCase().includes('faq')) {
          pageName = 'FAQs';
        } else if (cleanPath.toLowerCase().includes('privacy')) {
          pageName = 'Privacy Policy';
        } else if (cleanPath.toLowerCase().includes('term')) {
          pageName = 'Terms';
        } else {
          pageName = cleanPath
            .replace(/[-_/]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
        }

        if (processedPageNames.has(pageName.toLowerCase())) {
          if (urlItem !== cleanUrl) await inspectPage.close();
          continue;
        }
        processedPageNames.add(pageName.toLowerCase());

        let pageDOM: any = {
          seoExtractionSuccess: false,
          h1s: [],
          metaTitle: '',
          metaDescription: '',
          imagesTotal: 0,
          imagesMissingAlt: 0,
          buttonsData: [],
          linksData: [],
          formsData: [],
          telLinks: [],
          mailtoLinks: [],
          instaFound: false,
          linkedinFound: false,
          fbFound: false,
          twitterFound: false,
          socialLinks: [],
          bodyText: '',
          addressElText: '',
          sections: []
        };

        if (isAccessible) {
          try {
            pageDOM = await inspectPage.evaluate(pageInspectScript as any);
          } catch (e) {
            isAccessible = false;
          }
        }

        // Parse Phones
        let foundPhone = pageDOM.telLinks.length > 0 ? pageDOM.telLinks[0] : '';
        if (!foundPhone && pageDOM.bodyText) {
          const phoneRegex = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}/g;
          const matches = pageDOM.bodyText.match(phoneRegex);
          if (matches) {
            const validMatch = matches.find((m: string) => m.replace(/\D/g, '').length >= 9 && m.replace(/\D/g, '').length <= 15);
            if (validMatch) foundPhone = validMatch.trim();
          }
        }

        // Parse Emails
        let foundEmail = pageDOM.mailtoLinks.length > 0 ? pageDOM.mailtoLinks[0] : '';
        if (!foundEmail && pageDOM.bodyText) {
          const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
          const match = pageDOM.bodyText.match(emailRegex);
          if (match) foundEmail = match[1].trim();
        }

        // Parse Address
        let foundAddress = '';
        const combinedAddressText = pageDOM.addressElText + ' ' + pageDOM.bodyText;
        const ukPostcodeMatch = combinedAddressText.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
        const streetMatch = combinedAddressText.match(/(Suite|Unit|Building|House|Street|St\.|Road|Rd\.|Avenue|Ave\.|Boulevard|Blvd\.|Way|Drive|Dr\.|Lane|Ln\.|Court|Ct\.)\s+[A-Za-z0-9\s,#.-]+/i);

        if (ukPostcodeMatch) {
          foundAddress = `Postcode: ${ukPostcodeMatch[1].toUpperCase()}`;
        } else if (streetMatch) {
          foundAddress = streetMatch[0].trim().substring(0, 60);
        }

        if (foundPhone && !globalPhone.present) globalPhone = { present: true, value: foundPhone };
        if (foundEmail && !globalEmail.present) globalEmail = { present: true, value: foundEmail };
        if (foundAddress && !globalAddress.present) globalAddress = { present: true, value: foundAddress };

        if (pageDOM.instaFound) globalInsta = 'Working';
        if (pageDOM.linkedinFound) globalLinkedIn = 'Working';
        if (pageDOM.fbFound) globalFB = 'Working';
        if (pageDOM.twitterFound) globalTwitter = 'Working';

        if (pageDOM.socialLinks && pageDOM.socialLinks.length > 0) {
          pageDOM.socialLinks.forEach((sl: any) => {
            if (!globalSocialLinks.some(s => s.platform === sl.platform && s.href === sl.href)) {
              globalSocialLinks.push(sl);
            }
          });
        }

        pageDOM.linksData.forEach((l: any) => {
          if (l.isMissing) totalMissingLinks++;
          else totalWorkingLinks++;
        });

        pageDOM.buttonsData.forEach((b: any) => {
          allButtonsAcc.push({
            page: pageName,
            text: b.text,
            href: b.href,
            actionType: b.actionType,
            isValid: b.isValid,
            statusLabel: b.statusLabel
          });
          if (!b.isValid) totalMissingLinks++;
        });

        pagesData.push({
          name: pageName,
          url: urlItem,
          path: pathName,
          status: isAccessible ? 200 : 404,
          isAccessible,
          seoExtractionSuccess: pageDOM.seoExtractionSuccess && isAccessible,
          h1: pageDOM.h1s,
          metaTitle: pageDOM.metaTitle,
          metaDescription: pageDOM.metaDescription,
          imagesTotal: pageDOM.imagesTotal,
          imagesMissingAlt: pageDOM.imagesMissingAlt,
          buttons: pageDOM.buttonsData,
          links: pageDOM.linksData,
          forms: pageDOM.formsData,
          contactInfo: {
            phones: foundPhone ? [foundPhone] : [],
            emails: foundEmail ? [foundEmail] : [],
            addresses: foundAddress ? [foundAddress] : [],
            socials: {
              instagram: globalInsta,
              linkedin: globalLinkedIn,
              facebook: globalFB,
              twitter: globalTwitter
            }
          },
          visibleText: pageDOM.bodyText.replace(/\s+/g, ' ').trim(),
          structuredContent: {
            name: pageName,
            sections: pageDOM.sections
          }
        });

        if (urlItem !== cleanUrl) {
          await inspectPage.close();
        }
      } catch (errPage) {
        console.warn(`Failed to inspect page ${urlItem}:`, errPage);
      }
    }

    await browser.close();

    return {
      baseUrl: cleanUrl,
      siteTitle: mainTitle || cleanUrl,
      pages: pagesData,
      discoveredPageNames: pagesData.map(p => p.name),
      allButtons: allButtonsAcc,
      linkCounters: {
        working: totalWorkingLinks,
        broken: totalBrokenLinks,
        missing: totalMissingLinks
      },
      globalContactInfo: {
        phone: globalPhone,
        email: globalEmail,
        address: globalAddress,
        instagram: globalInsta,
        linkedin: globalLinkedIn,
        facebook: globalFB,
        twitter: globalTwitter,
        socialLinks: globalSocialLinks
      }
    };
  } catch (error: any) {
    console.warn('[Playwright Scraper Error - Falling back to Cheerio]:', error.message);
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    return scrapeWebsiteStaticFallback(targetUrl);
  }
}

async function scrapeWebsiteStaticFallback(targetUrl: string): Promise<FullWebsiteScrapeResult> {
  const cleanUrl = getCleanUrl(targetUrl);
  const parsedBase = new URL(cleanUrl);
  const origin = parsedBase.origin;

  const pagesData: PageScrapeData[] = [];
  const processedUrls = new Set<string>();
  const urlsToInspect: string[] = [cleanUrl];

  let mainTitle = '';
  let globalPhone = { present: false, value: '' };
  let globalEmail = { present: false, value: '' };
  let globalAddress = { present: false, value: '' };
  let globalInsta: 'Working' | 'Missing' = 'Missing';
  let globalLinkedIn: 'Working' | 'Missing' = 'Missing';
  let globalFB: 'Working' | 'Missing' = 'Missing';
  let globalTwitter: 'Working' | 'Missing' = 'Missing';
  const globalSocialLinks: Array<{ platform: string; href: string }> = [];

  let totalWorkingLinks = 0;
  let totalMissingLinks = 0;
  const allButtonsAcc: Array<{ page: string; text: string; href: string; actionType: string; isValid: boolean; statusLabel: string }> = [];

  try {
    // 1. Fetch homepage first to discover other pages
    const homeRes = await axios.get(cleanUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $home = cheerio.load(homeRes.data);
    mainTitle = $home('title').text().trim() || cleanUrl;

    // Discover internal links
    $home('a[href]').each((_, el) => {
      const href = $home(el).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          const absolute = new URL(href, cleanUrl).href;
          if (absolute.startsWith(origin)) {
            const normalized = absolute.split('#')[0].replace(/\/$/, '');
            if (!processedUrls.has(normalized) && urlsToInspect.length < 15) {
              urlsToInspect.push(absolute);
              processedUrls.add(normalized);
            }
          }
        } catch (e) {}
      }
    });
  } catch (err: any) {
    console.error('Failed to parse base page for internal link discovery:', err.message);
  }

  // Deduplicate and process each url
  const uniqueUrls = Array.from(new Set(urlsToInspect));

  for (const urlItem of uniqueUrls) {
    try {
      const res = await axios.get(urlItem, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const $ = cheerio.load(res.data);
      const title = $('title').text().trim() || urlItem;
      const h1s = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
      const metaTitle = title;
      const metaDescription = $('meta[name="description" i], meta[property="og:description" i]').attr('content') || '';

      const currentUrlObj = new URL(urlItem);
      const pathName = currentUrlObj.pathname;
      let pageName = 'Home';
      const cleanPath = pathName.replace(/^\/(website|site|wixsite)-\d+\/?/i, '/').replace(/^\//, '');

      if (pathName === '/' || pathName === '' || cleanPath === '') {
        pageName = 'Home';
      } else {
        pageName = cleanPath
          .replace(/[-_/]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
          .trim();
      }

      // Buttons Data
      const buttonsData: ScrapedButtonData[] = [];

      $('a, button, input[type="submit"], input[type="button"]').each((_, el) => {
        const val = $(el).val();
        const valStr = Array.isArray(val) ? val.join(' ') : (val || '');
        let text = ($(el).text().trim() || valStr || $(el).attr('aria-label') || '').trim();
        text = text.replace(/\s+/g, ' ');
        const href = $(el).attr('href') || '#';

        if (text && text.length < 60 && !text.includes('?')) {
          let actionType = 'Internal Page Link';
          if (href.startsWith('mailto:')) actionType = 'Email Link';
          else if (href.startsWith('tel:')) actionType = 'Phone Link';
          else if (href.startsWith('#')) actionType = 'Opens Lead Form';
          else if (href.startsWith('http')) actionType = 'External URL';

          const btnObj = { text, href, actionType, isValid: href !== '#', statusLabel: href !== '#' ? `${actionType} (Valid)` : 'Missing Action' };
          buttonsData.push(btnObj);
          allButtonsAcc.push({ page: pageName, ...btnObj });
          if (href === '#') totalMissingLinks++;
          else totalWorkingLinks++;
        }
      });

      // Phones and Emails
      const fullHtml = String(res.data);
      const phoneMatch = fullHtml.match(/(\+?\d[0-9\s\-]{8,}\d)/);
      const emailMatch = fullHtml.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

      let foundPhone = phoneMatch ? phoneMatch[1] : '';
      let foundEmail = emailMatch ? emailMatch[1] : '';

      if (foundPhone && !globalPhone.present) globalPhone = { present: true, value: foundPhone };
      if (foundEmail && !globalEmail.present) globalEmail = { present: true, value: foundEmail };

      // Address
      const combinedText = $('address').text() || $('footer').text() || $('body').text();
      const postcodeMatch = combinedText.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
      if (postcodeMatch && !globalAddress.present) {
        globalAddress = { present: true, value: `Postcode: ${postcodeMatch[1].toUpperCase()}` };
      }

      // Socials
      $('a[href]').each((_, el) => {
        const href = ($(el).attr('href') || '').trim();
        const hrefLower = href.toLowerCase();
        if (hrefLower.includes('instagram.com')) {
          globalInsta = 'Working';
          if (!globalSocialLinks.some(s => s.platform === 'instagram')) globalSocialLinks.push({ platform: 'instagram', href });
        } else if (hrefLower.includes('linkedin.com')) {
          globalLinkedIn = 'Working';
          if (!globalSocialLinks.some(s => s.platform === 'linkedin')) globalSocialLinks.push({ platform: 'linkedin', href });
        } else if (hrefLower.includes('facebook.com')) {
          globalFB = 'Working';
          if (!globalSocialLinks.some(s => s.platform === 'facebook')) globalSocialLinks.push({ platform: 'facebook', href });
        } else if (hrefLower.includes('twitter.com') || hrefLower.includes('x.com')) {
          globalTwitter = 'Working';
          if (!globalSocialLinks.some(s => s.platform === 'twitter')) globalSocialLinks.push({ platform: 'twitter', href });
        } else if (hrefLower.includes('wa.me') || hrefLower.includes('whatsapp.com')) {
          if (!globalSocialLinks.some(s => s.platform === 'whatsapp')) globalSocialLinks.push({ platform: 'whatsapp', href });
        }
      });

      // Build sections fallback
      const sections: any[] = [];
      h1s.forEach(h => {
        sections.push({ name: 'General', heading: h, paragraphs: [], lists: [], buttons: [], tables: [], forms: [] });
      });
      $('p').each((_, el) => {
        const txt = $(el).text().trim();
        if (txt.length > 20) {
          if (sections.length === 0) {
            sections.push({ name: 'Hero', heading: '', paragraphs: [txt], lists: [], buttons: [], tables: [], forms: [] });
          } else {
            sections[sections.length - 1].paragraphs.push(txt);
          }
        }
      });

      pagesData.push({
        name: pageName,
        url: urlItem,
        path: pathName,
        status: 200,
        isAccessible: true,
        seoExtractionSuccess: true,
        h1: h1s,
        metaTitle,
        metaDescription,
        imagesTotal: $('img').length,
        imagesMissingAlt: $('img:not([alt])').length,
        buttons: buttonsData,
        links: [],
        forms: [],
        contactInfo: {
          phones: foundPhone ? [foundPhone] : [],
          emails: foundEmail ? [foundEmail] : [],
          addresses: [],
          socials: { instagram: globalInsta, linkedin: globalLinkedIn, facebook: globalFB, twitter: globalTwitter }
        },
        visibleText: $('body').text().replace(/\s+/g, ' ').trim(),
        structuredContent: {
          name: pageName,
          sections
        }
      });
    } catch (errPage: any) {
      console.warn(`Fallback scrape failed for page ${urlItem}:`, errPage.message);
    }
  }

  return {
    baseUrl: cleanUrl,
    siteTitle: mainTitle || cleanUrl,
    pages: pagesData,
    discoveredPageNames: pagesData.map(p => p.name),
    allButtons: allButtonsAcc,
    linkCounters: {
      working: totalWorkingLinks,
      broken: 0,
      missing: totalMissingLinks
    },
    globalContactInfo: {
      phone: globalPhone,
      email: globalEmail,
      address: globalAddress,
      instagram: globalInsta,
      linkedin: globalLinkedIn,
      facebook: globalFB,
      twitter: globalTwitter,
      socialLinks: globalSocialLinks
    }
  };
}
