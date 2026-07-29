import type { CategoryType, ParsedItem, QAItemResult, QASummary, SectionType, SubCategoryType } from '../types/qa';

/**
 * Calculates word-level similarity and extracts missing words
 */
export function compareWords(expectedStr: string, foundStr: string) {
  const cleanExp = expectedStr.toLowerCase().replace(/[^\w\s]/g, '');
  const cleanFnd = foundStr.toLowerCase().replace(/[^\w\s]/g, '');

  const expWords = cleanExp.split(/\s+/).filter(Boolean);
  const fndWords = cleanFnd.split(/\s+/).filter(Boolean);

  if (expWords.length === 0 || fndWords.length === 0) {
    return { similarity: 0, missingWords: expWords, extraWords: fndWords };
  }

  const fndSet = new Set(fndWords);
  const missingWords = expWords.filter(w => !fndSet.has(w));
  const expSet = new Set(expWords);
  const extraWords = fndWords.filter(w => !expSet.has(w));

  const matchedCount = expWords.length - missingWords.length;
  const similarity = Math.round((matchedCount / expWords.length) * 100);

  return { similarity, missingWords, extraWords };
}

/**
 * Generates an actionable suggested fix based on issue type and section
 */
export function generateSuggestedFix(
  category: CategoryType,
  subCategory: SubCategoryType,
  section: SectionType,
  expected: string,
  found: string,
  missingWords: string[] = []
): string {
  switch (category) {
    case 'MISSING':
      if (subCategory === 'Contact Information') {
        return `Add missing contact detail "${expected}" to the ${section} section.`;
      }
      if (subCategory === 'CTA') {
        return `Insert CTA button with text "${expected}" in the ${section} section.`;
      }
      if (subCategory === 'Heading') {
        return `Add section heading "${expected}" to the ${section} section.`;
      }
      if (subCategory === 'Service') {
        return `Add "${expected}" to the ${section} section list.`;
      }
      if (subCategory === 'FAQ') {
        return `Include question/answer "${expected}" in the FAQ section.`;
      }
      return `Add "${expected}" to the ${section} section.`;

    case 'INCORRECT':
      if (subCategory === 'Contact Information') {
        return `Update contact detail in ${section} section from "${found}" to expected "${expected}".`;
      }
      if (subCategory === 'CTA') {
        return `Update CTA button text from "${found}" to expected "${expected}".`;
      }
      return `Replace found content "${found}" with expected content "${expected}" in the ${section} section.`;

    case 'PARTIAL':
      if (missingWords.length > 0) {
        return `Update ${section} content to include missing word(s): "${missingWords.join(', ')}". Full expected text: "${expected}".`;
      }
      return `Adjust text in ${section} section to match full expected wording: "${expected}".`;

    case 'ADDITIONAL':
      return `Review extra item "${found}" in ${section} section; remove or add to baseline documentation if intended.`;

    default:
      return 'No action required.';
  }
}

/**
 * Executes full section-by-section Dynamic Content QA Validation
 */
export function runQAValidation(documentItems: ParsedItem[], websiteItems: ParsedItem[]): {
  results: QAItemResult[];
  summary: QASummary;
} {
  const results: QAItemResult[] = [];
  const processedWebItemIds = new Set<string>();

  // Map to track section stats
  const sectionStats: Record<string, { total: number; correct: number; score: number }> = {};

  // 1. Process Document Items against Website Items
  for (const docItem of documentItems) {
    const docText = docItem.text;
    const docTextLower = docText.toLowerCase();

    // Search for best candidate match in website items (preferably same section or type)
    let bestMatchItem: ParsedItem | null = null;
    let bestSimilarity = 0;
    let bestWordComparison: ReturnType<typeof compareWords> | null = null;

    for (const webItem of websiteItems) {
      const webText = webItem.text;
      const webTextLower = webText.toLowerCase();

      // Exact match
      if (docTextLower === webTextLower) {
        bestMatchItem = webItem;
        bestSimilarity = 100;
        bestWordComparison = { similarity: 100, missingWords: [], extraWords: [] };
        break;
      }

      // Check similarity
      const wordComp = compareWords(docText, webText);
      const isSameSectionOrType = webItem.section === docItem.section || webItem.type === docItem.type;
      const effectiveSim = isSameSectionOrType ? wordComp.similarity : wordComp.similarity * 0.8;

      if (effectiveSim > bestSimilarity) {
        bestSimilarity = effectiveSim;
        bestMatchItem = webItem;
        bestWordComparison = wordComp;
      }
    }

    let category: CategoryType = 'MISSING';
    let foundContent = 'Not Found';
    let missingWordsList: string[] = [];
    let similarityScore = 0;

    // Check contact mismatch specifically (e.g. phone/email key match with different value)
    if (docItem.type === 'Contact Information') {
      const docPhone = docText.match(/(\+?\d[\d\s\-]{8,}\d)/);
      if (docPhone) {
        const foundWebPhone = websiteItems.find(w => w.text.match(/(\+?\d[\d\s\-]{8,}\d)/) && w.text !== docText);
        if (foundWebPhone && bestSimilarity < 90) {
          category = 'INCORRECT';
          foundContent = foundWebPhone.text;
          processedWebItemIds.add(foundWebPhone.id);
          bestMatchItem = foundWebPhone;
        }
      }
    }

    if (category !== 'INCORRECT') {
      if (bestMatchItem && bestSimilarity >= 95) {
        category = 'CORRECT';
        foundContent = bestMatchItem.text;
        similarityScore = 100;
        processedWebItemIds.add(bestMatchItem.id);
      } else if (bestMatchItem && bestSimilarity >= 50) {
        // High similarity but modified wording or missing words
        processedWebItemIds.add(bestMatchItem.id);
        foundContent = bestMatchItem.text;
        similarityScore = bestSimilarity;

        // Is it incorrect (e.g., CTA mismatch like "Book Survey" vs "Book Your Free Survey") or Partial?
        if (docItem.type === 'CTA' || docItem.type === 'Heading' || docItem.type === 'Contact Information') {
          // If key words are modified or key numbers/terms differ, mark INCORRECT
          if (bestSimilarity < 75) {
            category = 'INCORRECT';
          } else {
            category = 'PARTIAL';
            missingWordsList = bestWordComparison?.missingWords || [];
          }
        } else {
          category = 'PARTIAL';
          missingWordsList = bestWordComparison?.missingWords || [];
        }
      } else if (bestMatchItem && bestSimilarity >= 30 && (docItem.type === 'CTA' || docItem.type === 'Contact Information')) {
        // Mismatched CTA or Contact detail
        processedWebItemIds.add(bestMatchItem.id);
        category = 'INCORRECT';
        foundContent = bestMatchItem.text;
        similarityScore = bestSimilarity;
      } else {
        category = 'MISSING';
        foundContent = 'Not Found';
        similarityScore = 0;
      }
    }

    const subCategory = docItem.type;
    const suggestedFix = generateSuggestedFix(
      category,
      subCategory,
      docItem.section,
      docText,
      foundContent,
      missingWordsList
    );

    results.push({
      id: `res-doc-${docItem.id}`,
      section: docItem.section,
      category,
      subCategory,
      expectedContent: docText,
      foundContent,
      missingWords: missingWordsList.length > 0 ? missingWordsList : undefined,
      suggestedFix,
      similarity: similarityScore
    });
  }

  // 2. Identify Additional Content on Website (items on website not matched to any doc item)
  for (const webItem of websiteItems) {
    if (!processedWebItemIds.has(webItem.id)) {
      // Check if it's significant (ignore tiny nav tags or boilerplate privacy terms if unlisted)
      if (webItem.text.length > 3) {
        const suggestedFix = generateSuggestedFix(
          'ADDITIONAL',
          webItem.type,
          webItem.section,
          'Not in Document',
          webItem.text
        );

        results.push({
          id: `res-web-${webItem.id}`,
          section: webItem.section,
          category: 'ADDITIONAL',
          subCategory: webItem.type,
          expectedContent: 'Not in Document',
          foundContent: webItem.text,
          suggestedFix,
          similarity: 0
        });
      }
    }
  }

  // 3. Compute Dynamic Summary Statistics
  let correctCount = 0;
  let missingCount = 0;
  let incorrectCount = 0;
  let additionalCount = 0;
  let partialCount = 0;

  results.forEach(res => {
    if (res.category === 'CORRECT') correctCount++;
    else if (res.category === 'MISSING') missingCount++;
    else if (res.category === 'INCORRECT') incorrectCount++;
    else if (res.category === 'ADDITIONAL') additionalCount++;
    else if (res.category === 'PARTIAL') partialCount++;

    // Track per section
    if (!sectionStats[res.section]) {
      sectionStats[res.section] = { total: 0, correct: 0, score: 0 };
    }
    sectionStats[res.section].total += 1;
    if (res.category === 'CORRECT') sectionStats[res.section].correct += 1;
    else if (res.category === 'PARTIAL') sectionStats[res.section].correct += 0.5;
  });

  const totalItems = results.length;
  const matchPoints = correctCount + (partialCount * 0.5);
  const contentMatchPercentage = totalItems > 0 ? Math.round((matchPoints / totalItems) * 100) : 100;

  // Compute Overall QA Score out of 100 considering penalties for missing/incorrect items
  // Formula: Base score from match percentage minus weighted penalties
  const penalty = (missingCount * 10) + (incorrectCount * 15) + (additionalCount * 3);
  const rawScore = Math.max(0, contentMatchPercentage - (penalty / (totalItems || 1)));
  const overallScore = Math.min(100, Math.round(rawScore));

  // Update section score percentages
  Object.keys(sectionStats).forEach(sec => {
    const stat = sectionStats[sec];
    stat.score = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 100;
  });

  return {
    results,
    summary: {
      overallScore,
      contentMatchPercentage,
      correctCount,
      missingCount,
      incorrectCount,
      additionalCount,
      partialCount,
      totalItems,
      sectionScores: sectionStats
    }
  };
}
