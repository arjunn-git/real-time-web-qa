export type SectionType = 
  | 'Hero'
  | 'About'
  | 'Services'
  | 'Process'
  | 'CTA'
  | 'FAQs'
  | 'Testimonials'
  | 'Contact'
  | 'Footer'
  | 'Navigation'
  | 'Forms'
  | 'Buttons'
  | 'General';

export type CategoryType = 
  | 'CORRECT'
  | 'MISSING'
  | 'INCORRECT'
  | 'ADDITIONAL'
  | 'PARTIAL';

export type SubCategoryType =
  | 'Heading'
  | 'Paragraph'
  | 'CTA'
  | 'FAQ'
  | 'Service'
  | 'Contact Information'
  | 'Footer Content'
  | 'Navigation'
  | 'Form Field'
  | 'Button'
  | 'General';

export interface ParsedItem {
  id: string;
  section: SectionType;
  type: SubCategoryType;
  text: string;
  label?: string;
  rawHtml?: string;
}

export interface QAItemResult {
  id: string;
  section: SectionType;
  category: CategoryType;
  subCategory: SubCategoryType;
  expectedContent: string;
  foundContent: string;
  missingWords?: string[];
  suggestedFix: string;
  similarity?: number;
}

export interface QASummary {
  overallScore: number;
  contentMatchPercentage: number;
  correctCount: number;
  missingCount: number;
  incorrectCount: number;
  additionalCount: number;
  partialCount: number;
  totalItems: number;
  sectionScores: Record<string, { total: number; correct: number; score: number }>;
}

export interface InputSource {
  title: string;
  url?: string;
  rawText: string;
  html?: string;
}
