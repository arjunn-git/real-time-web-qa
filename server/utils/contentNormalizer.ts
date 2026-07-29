/**
 * Intelligent Content Normalizer & Semantic Equivalence Comparator
 * Handles phone numbers, emails, URLs, CTAs, and general website copy.
 */

/**
 * Normalizes phone numbers to clean digits for UK/US/Intl comparison
 * Handles +44 vs 0 UK conversion, removes spaces, brackets, hyphens, and tel:
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.toLowerCase().replace(/^tel:/i, '').trim();
  // Remove non-digit characters except leading +
  clean = clean.replace(/[\s\-\(\)\.\/]/g, '');

  // UK Country Code Normalization (+44 -> 0)
  if (clean.startsWith('+44')) {
    clean = '0' + clean.substring(3);
  } else if (clean.startsWith('44') && clean.length >= 11) {
    clean = '0' + clean.substring(2);
  }

  // Remove remaining leading +
  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }

  return clean;
}

export function arePhonesEquivalent(phone1: string, phone2: string): boolean {
  const norm1 = normalizePhoneNumber(phone1);
  const norm2 = normalizePhoneNumber(phone2);
  if (!norm1 || !norm2) return false;
  return norm1 === norm2 || norm1.endsWith(norm2) || norm2.endsWith(norm1);
}

/**
 * Normalizes email addresses (case insensitive, strips mailto:)
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().replace(/^mailto:/i, '').trim();
}

export function areEmailsEquivalent(email1: string, email2: string): boolean {
  return normalizeEmail(email1) === normalizeEmail(email2);
}

/**
 * Normalizes URLs (strips http/https, www, trailing slashes, hash fragments)
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.replace(/^www\./i, '');
  clean = clean.split('#')[0];
  clean = clean.replace(/\/$/, '');
  return clean;
}

export function areUrlsEquivalent(url1: string, url2: string): boolean {
  const norm1 = normalizeUrl(url1);
  const norm2 = normalizeUrl(url2);
  if (!norm1 || !norm2) return false;
  return norm1 === norm2;
}

/**
 * Calculates string similarity ratio (0 to 1) for fuzzy CTA text matching
 */
export function calculateTextSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '').trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });

  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
}

export type ContentMatchStatus =
  | 'Matched Content'
  | 'Minor Formatting Difference'
  | 'Partial Match'
  | 'Missing Content'
  | 'Additional Content'
  | 'Incorrect Content'
  | 'Unable to Validate';

/**
 * Intelligently compares CTA text or copy sections
 */
export function compareCtaOrCopy(
  expectedText: string,
  foundText: string
): { status: ContentMatchStatus; notes?: string } {
  if (!expectedText) return { status: 'Unable to Validate' };
  if (!foundText) return { status: 'Missing Content' };

  const expClean = expectedText.trim();
  const fndClean = foundText.trim();

  // Exact match
  if (expClean === fndClean) {
    return { status: 'Matched Content' };
  }

  // Case or punctuation difference
  if (expClean.toLowerCase() === fndClean.toLowerCase() ||
      expClean.replace(/[^\w]/g, '') === fndClean.replace(/[^\w]/g, '')) {
    return { status: 'Minor Formatting Difference', notes: 'Case/Punctuation variation' };
  }

  // Similarity check
  const similarity = calculateTextSimilarity(expClean, fndClean);
  if (similarity >= 0.7) {
    return { status: 'Minor Formatting Difference', notes: 'Minor wording variation' };
  }

  if (similarity >= 0.4 || expClean.toLowerCase().includes(fndClean.toLowerCase()) || fndClean.toLowerCase().includes(expClean.toLowerCase())) {
    return { status: 'Partial Match', notes: 'Partial text match' };
  }

  return { status: 'Incorrect Content', notes: 'Text content differs' };
}
