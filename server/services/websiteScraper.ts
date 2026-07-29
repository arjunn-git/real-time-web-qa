import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

function findLocalChromePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || process.env.CHROME_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || process.env.CHROME_PATH;
  }

  const projectCachePath = path.join(process.cwd(), '.cache', 'puppeteer', 'chrome');
  if (fs.existsSync(projectCachePath)) {
    try {
      const versions = fs.readdirSync(projectCachePath);
      for (const ver of versions) {
        const linuxBin = path.join(projectCachePath, ver, 'chrome-linux64', 'chrome');
        if (fs.existsSync(linuxBin)) return linuxBin;
        const winBin = path.join(projectCachePath, ver, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(winBin)) return winBin;
      }
    } catch (e) {}
  }

  const renderCachePath = '/opt/render/.cache/puppeteer/chrome';
  if (fs.existsSync(renderCachePath)) {
    try {
      const versions = fs.readdirSync(renderCachePath);
      for (const ver of versions) {
        const linuxBin = path.join(renderCachePath, ver, 'chrome-linux64', 'chrome');
        if (fs.existsSync(linuxBin)) return linuxBin;
      }
    } catch (e) {}
  }

  return undefined;
}

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
 * Scrapes full multi-page website with Wix SEO confidence verification & page deduplication
 */
export async function scrapeFullWebsite(targetUrl: string): Promise<FullWebsiteScrapeResult> {
  const cleanUrl = getCleanUrl(targetUrl);
  const parsedBase = new URL(cleanUrl);
  const origin = parsedBase.origin;

  let browser = null;

  try {
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--renderer-process-limit=1',
        '--no-first-run',
        '--ignore-certificate-errors',
        '--js-flags="--max-old-space-size=128"'
      ]
    };

    const detectedChrome = findLocalChromePath();
    if (detectedChrome) {
      launchOptions.executablePath = detectedChrome;
    }

    browser = await puppeteer.launch(launchOptions);

    const mainPage = await browser.newPage();
    await mainPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await mainPage.setViewport({ width: 1366, height: 768 });

    // Accelerate scraping speed by blocking heavy media assets
    await mainPage.setRequestInterception(true);
    mainPage.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'font'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const response = await mainPage.goto(cleanUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    if (!response) {
      throw new Error('Website failed to load or returned no response.');
    }
    if (response.status() === 403) {
      throw new Error('Website blocked automated access (403 Forbidden).');
    }
    if (response.status() === 404) {
      throw new Error('Website homepage not found (404 Error). Please check the URL.');
    }

    const mainTitle = await mainPage.title();

    // Discover internal links with strict deduplication
    const discoveredLinksStr = `
      ((siteOrigin) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const links = new Set();
        anchors.forEach(a => {
          const href = a.getAttribute('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            try {
              const absolute = new URL(href, siteOrigin).href;
              if (absolute.startsWith(siteOrigin)) {
                // Normalize URL to remove trailing slashes and hash fragments
                const cleanLink = absolute.split('#')[0].replace(/\\/$/, '');
                links.add(cleanLink);
              }
            } catch (e) {}
          }
        });
        return Array.from(links);
      })("${origin}")
    `;

    const discoveredLinks: string[] = await mainPage.evaluate(discoveredLinksStr as any);

    // Deduplicate URLs to inspect
    const urlsToInspect: string[] = [];
    const seenUrls = new Set<string>();

    const normClean = cleanUrl.split('#')[0].replace(/\/$/, '');
    seenUrls.add(normClean);
    urlsToInspect.push(cleanUrl);

    discoveredLinks.forEach(l => {
      const normL = l.split('#')[0].replace(/\/$/, '');
      if (!seenUrls.has(normL) && urlsToInspect.length < 8) {
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

    // Page inspection script with Wix Head SEO Hydration verification
    const pageInspectScript = `
      (() => {
        let seoExtractionSuccess = true;
        
        const h1s = Array.from(document.querySelectorAll('h1')).map(h => (h.textContent || '').trim()).filter(Boolean);
        const metaTitle = document.title || '';
        
        let metaDescription = '';
        const metaDescEl = document.querySelector('meta[name="description" i], meta[name="Description" i], meta[property="og:description" i], meta[property="og:Description" i], meta[name="twitter:description" i]');
        if (metaDescEl) {
          metaDescription = (metaDescEl.getAttribute('content') || '').trim();
        }
        if (!metaDescription) {
          const allMetas = Array.from(document.querySelectorAll('meta'));
          for (const m of allMetas) {
            const name = (m.getAttribute('name') || m.getAttribute('property') || '').toLowerCase();
            if (name.includes('description')) {
              const content = (m.getAttribute('content') || '').trim();
              if (content) { metaDescription = content; break; }
            }
          }
        }

        // If DOM document head is inaccessible or empty during SPA load
        if (!document.head || (document.head.children.length === 0 && !metaTitle)) {
          seoExtractionSuccess = false;
        }

        const imgs = Array.from(document.querySelectorAll('img'));
        const imagesTotal = imgs.length;
        const imagesMissingAlt = imgs.filter(img => !img.getAttribute('alt') || img.getAttribute('alt')?.trim() === '').length;

        function classifyButtonAction(el) {
          const href = (el.getAttribute('href') || el.getAttribute('data-href') || '').trim();
          const hrefLower = href.toLowerCase();
          const type = (el.getAttribute('type') || '').toLowerCase();
          const className = (el.className || '').toString().toLowerCase();
          const id = (el.getAttribute('id') || '').toLowerCase();
          const ariaHasPopup = el.getAttribute('aria-haspopup');
          const dataAction = (el.getAttribute('data-action') || el.getAttribute('data-popup') || el.getAttribute('data-lightbox') || '').toLowerCase();
          const textLower = (el.textContent || '').toLowerCase().trim();

          if (hrefLower.startsWith('tel:')) return { actionType: 'Phone Link', isValid: true, statusLabel: 'Phone Link (Valid)' };
          if (hrefLower.startsWith('mailto:')) return { actionType: 'Email Link', isValid: true, statusLabel: 'Email Link (Valid)' };

          const isFormElement = type === 'submit' || !!el.closest('form') || id.includes('submit') || className.includes('submit') || className.includes('form-button');
          if (isFormElement || textLower.includes('quote') || textLower.includes('submit') || textLower.includes('request free') || textLower.includes('send message')) {
            return { actionType: 'Opens Lead Form', isValid: true, statusLabel: 'Opens Lead Form (Valid)' };
          }

          const isPopup = ariaHasPopup === 'true' || ariaHasPopup === 'dialog' || dataAction.includes('popup') || dataAction.includes('lightbox') || className.includes('lightbox') || className.includes('popup') || className.includes('modal') || hrefLower.includes('lightbox') || hrefLower.includes('popup');
          if (isPopup || textLower.includes('find out more') || textLower.includes('learn more') || textLower.includes('view details')) {
            return { actionType: 'Opens Popup', isValid: true, statusLabel: 'Opens Popup (Valid)' };
          }

          if (hrefLower.startsWith('#') && hrefLower.length > 1) {
            return { actionType: 'Scrolls to Section', isValid: true, statusLabel: 'Scrolls to Section (Valid)' };
          }

          const isWixVelo = className.includes('wixui-button') || className.includes('wixui') || id.includes('comp-') || typeof el.onclick === 'function' || el.hasAttribute('data-action') || hrefLower.startsWith('javascript:');
          if (isWixVelo && (href === '#' || href === '' || hrefLower.startsWith('javascript:'))) {
            return { actionType: 'Velo Custom Action', isValid: true, statusLabel: 'Velo Action (Valid)' };
          }

          if (href && (href.startsWith('/') || href.startsWith('http'))) {
            if (href.includes(window.location.hostname) || href.startsWith('/')) {
              return { actionType: 'Internal Page Link', isValid: true, statusLabel: 'Internal Page Link (Valid)' };
            }
            return { actionType: 'External URL', isValid: true, statusLabel: 'External URL (Valid)' };
          }

          if (!href || href === '#' || href === '') {
            return { actionType: 'Missing Action', isValid: false, statusLabel: 'Missing Action' };
          }

          return { actionType: 'Internal Page Link', isValid: true, statusLabel: 'Internal Page Link (Valid)' };
        }

        function isActualButton(el) {
          const text = (el.textContent || el.getAttribute('aria-label') || '').trim();
          const tagName = el.tagName.toLowerCase();
          const role = (el.getAttribute('role') || '').toLowerCase();
          const type = (el.getAttribute('type') || '').toLowerCase();
          const className = (el.className || '').toString().toLowerCase();

          if (text.endsWith('?') || text.includes('?') || text.length > 80) return false;
          if (role === 'tab' || el.closest('.faq, [class*="faq"], [class*="accordion"], [class*="collapse"], [data-toggle="collapse"]')) return false;
          
          const ariaExpanded = el.getAttribute('aria-expanded');
          const ariaControls = el.getAttribute('aria-controls');
          if ((ariaExpanded !== null || ariaControls !== null) && !className.includes('btn') && !className.includes('cta')) return false;

          const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
          if (ariaLabel.includes('menu') || ariaLabel.includes('navigation') || className.includes('hamburger') || className.includes('nav-toggle')) return false;

          if (tagName === 'button' || (tagName === 'input' && (type === 'submit' || type === 'button' || type === 'reset'))) return true;
          if (role === 'button') return true;

          const buttonClassPattern = /(^|\\s|_|-)(btn|button|cta|action-btn|submit-btn|booking-btn|elementor-button|wixui-button|sqs-block-button-element|wp-block-button__link)($|\\s|_|-)/i;
          if (tagName === 'a' && buttonClassPattern.test(className)) return true;

          if (tagName === 'a' && typeof window.getComputedStyle === 'function') {
            try {
              const style = window.getComputedStyle(el);
              const bg = style.backgroundColor;
              const border = style.borderStyle;
              const borderRadius = parseFloat(style.borderRadius) || 0;
              const hasPadding = (parseFloat(style.paddingTop) || 0) >= 4 && (parseFloat(style.paddingLeft) || 0) >= 8;
              const hasBackground = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
              const hasBorder = border && border !== 'none' && border !== 'hidden';

              if (hasPadding && (hasBackground || hasBorder || borderRadius > 0)) return true;
            } catch (e) {}
          }
          return false;
        }

        const allInteractive = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"], a[href], a.btn, a.cta, a.button, [class*="wixui-button"]'));
        
        const actualButtonsData = [];
        const textLinksData = [];

        allInteractive.forEach(el => {
          const text = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('value') || '').replace(/\\s+/g, ' ').trim();
          const href = el.getAttribute('href') || el.getAttribute('data-href') || '';
          if (!text || text.length < 1) return;

          if (isActualButton(el)) {
            const classification = classifyButtonAction(el);
            actualButtonsData.push({
              text,
              href: href || '#',
              actionType: classification.actionType,
              isValid: classification.isValid,
              statusLabel: classification.statusLabel
            });
          } else {
            let isMissing = !href || href === '#' || href.trim() === '';
            textLinksData.push({
              text,
              href,
              type: (href.startsWith('http') && !href.includes(window.location.hostname)) ? 'external' : 'internal',
              isBroken: false,
              isMissing
            });
          }
        });

        const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'))
          .map(a => a.getAttribute('href').replace(/^tel:/i, '').trim())
          .filter(Boolean);

        const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'))
          .map(a => a.getAttribute('href').replace(/^mailto:/i, '').trim())
          .filter(Boolean);

        const allAnchors = Array.from(document.querySelectorAll('a[href]'));
        let instaFound = false;
        let linkedinFound = false;
        let fbFound = false;
        let twitterFound = false;

        allAnchors.forEach(a => {
          const href = (a.getAttribute('href') || '').toLowerCase();
          if (href.includes('instagram.com')) instaFound = true;
          if (href.includes('linkedin.com')) linkedinFound = true;
          if (href.includes('facebook.com') || href.includes('fb.com')) fbFound = true;
          if (href.includes('twitter.com') || href.includes('x.com')) twitterFound = true;
        });

        const formsEl = Array.from(document.querySelectorAll('form'));
        const formsData = formsEl.map(f => {
          const inputs = f.querySelectorAll('input, textarea, select');
          const submitBtn = f.querySelector('button[type="submit"], input[type="submit"], button');
          let status = submitBtn ? 'Passed' : 'Submit Button Missing';
          return {
            type: f.getAttribute('id') || f.getAttribute('name') || 'Contact Form',
            fieldsCount: inputs.length,
            hasSubmitButton: !!submitBtn,
            status
          };
        });

        const bodyText = document.body ? document.body.innerText || '' : '';
        const addressElText = Array.from(document.querySelectorAll('address, footer, div[class*="footer"], div[id*="footer"], header, div[class*="header"]'))
          .map(el => el.textContent || '').join(' ');

        return {
          seoExtractionSuccess,
          h1s,
          metaTitle,
          metaDescription,
          imagesTotal,
          imagesMissingAlt,
          buttonsData: actualButtonsData,
          linksData: textLinksData,
          formsData,
          telLinks,
          mailtoLinks,
          instaFound,
          linkedinFound,
          fbFound,
          twitterFound,
          bodyText,
          addressElText
        };
      })()
    `;

    // Process inspected pages with unique name deduplication
    const processedPageNames = new Set<string>();

    // Cap total pages to inspect to 4 pages max for super-fast cloud execution
    const cappedUrlsToInspect = urlsToInspect.slice(0, 4);

    for (const urlItem of cappedUrlsToInspect) {
      try {
        let inspectPage = mainPage;
        let isAccessible = true;

        if (urlItem !== cleanUrl) {
          inspectPage = await browser.newPage();
          await inspectPage.setRequestInterception(true);
          inspectPage.on('request', (req) => {
            if (['image', 'media', 'font'].includes(req.resourceType())) {
              req.abort();
            } else {
              req.continue();
            }
          });
          const pageRes = await inspectPage.goto(urlItem, { waitUntil: 'domcontentloaded', timeout: 10000 });
          if (!pageRes || pageRes.status() >= 400) {
            isAccessible = false;
          }
        }

        const currentUrlObj = new URL(urlItem);
        const pathName = currentUrlObj.pathname;

        let pageName = 'Homepage';
        const cleanPath = pathName.replace(/^\/(website|site|wixsite)-\d+\/?/i, '/').replace(/^\//, '');

        if (pathName === '/' || pathName === '' || cleanPath === '') {
          pageName = 'Homepage';
        } else if (cleanPath.toLowerCase().includes('about')) {
          pageName = 'About Us';
        } else if (cleanPath.toLowerCase().includes('service')) {
          pageName = 'Services';
        } else if (cleanPath.toLowerCase().includes('contact')) {
          pageName = 'Contact Us';
        } else if (cleanPath.toLowerCase().includes('faq')) {
          pageName = 'FAQs';
        } else if (cleanPath.toLowerCase().includes('privacy')) {
          pageName = 'Privacy Policy';
        } else if (cleanPath.toLowerCase().includes('term')) {
          pageName = 'Terms & Conditions';
        } else if (cleanPath.toLowerCase().includes('blog')) {
          pageName = 'Blog';
        } else {
          pageName = cleanPath
            .replace(/[-_/]/g, ' ')
            .replace(/\b(and|amp)\b/gi, '&')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
        }

        // Deduplicate page names to prevent duplicate entries
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
          bodyText: '',
          addressElText: ''
        };

        if (isAccessible) {
          try {
            pageDOM = await inspectPage.evaluate(pageInspectScript as any);
          } catch (e) {
            isAccessible = false;
          }
        }

        // Phone Parsing
        let foundPhone = pageDOM.telLinks.length > 0 ? pageDOM.telLinks[0] : '';
        if (!foundPhone && pageDOM.bodyText) {
          const phoneRegex = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}/g;
          const matches = pageDOM.bodyText.match(phoneRegex);
          if (matches) {
            const validMatch = matches.find((m: string) => m.replace(/\D/g, '').length >= 9 && m.replace(/\D/g, '').length <= 15);
            if (validMatch) foundPhone = validMatch.trim();
          }
        }

        // Email Parsing
        let foundEmail = pageDOM.mailtoLinks.length > 0 ? pageDOM.mailtoLinks[0] : '';
        if (!foundEmail && pageDOM.bodyText) {
          const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
          const match = pageDOM.bodyText.match(emailRegex);
          if (match) foundEmail = match[1].trim();
        }

        // Address Parsing
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
          visibleText: pageDOM.bodyText.replace(/\s+/g, ' ').trim()
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
        twitter: globalTwitter
      }
    };
  } catch (error: any) {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    throw error;
  }
}
