import axios from 'axios';
import * as cheerio from 'cheerio';

export interface GoogleDocResult {
  docId: string;
  rawText: string;
  html?: string;
  title?: string;
  structuredContent?: any;
}

/**
 * Extracts Google Doc ID from various Google Doc URL formats
 */
export function extractGoogleDocId(url: string): { docId?: string; isPublished: boolean } {
  if (!url || typeof url !== 'string') return { isPublished: false };

  // Published doc e.g. https://docs.google.com/document/d/e/2PACX-.../pub
  if (url.includes('/d/e/')) {
    const pubMatch = url.match(/\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (pubMatch) {
      return { docId: pubMatch[1], isPublished: true };
    }
  }

  // Standard Google doc e.g. https://docs.google.com/document/d/1A2B3C4D.../edit
  const standardMatch = url.match(/\/d\/([a-zA-Z0-9-_]{15,})/);
  if (standardMatch) {
    return { docId: standardMatch[1], isPublished: false };
  }

  return { isPublished: false };
}

/**
 * Dynamically fetches Google Doc content via Google Docs Export API or Public HTML
 */
export async function fetchGoogleDocContent(url: string): Promise<GoogleDocResult> {
  const cleanUrl = url.trim();

  if (!cleanUrl.includes('docs.google.com/document')) {
    throw new Error('Invalid Google Doc URL. URL must be a valid Google Docs link (e.g., https://docs.google.com/document/d/.../edit).');
  }

  const { docId, isPublished } = extractGoogleDocId(cleanUrl);

  if (!docId) {
    throw new Error('Could not parse valid Document ID from the provided Google Docs URL.');
  }

  try {
    if (isPublished) {
      // Fetch published Google Doc HTML
      const pubUrl = cleanUrl.includes('/pub') ? cleanUrl : `https://docs.google.com/document/d/e/${docId}/pub`;
      const response = await axios.get(pubUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const title = $('title').text() || 'Google Doc';

      // Extract text content from published doc
      const bodyText = $('#contents, #hs-outer-container, body').text();
      const cleanText = bodyText.replace(/\s+/g, ' ').trim();

      if (!cleanText || cleanText.length < 5) {
        throw new Error('Google Doc contains no readable text content.');
      }

      return { docId, rawText: cleanText, html: response.data, title };
    } else {
      // Try TXT Export endpoint first: https://docs.google.com/document/d/{docId}/export?format=txt
      const exportTxtUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      
      const response = await axios.get(exportTxtUrl, {
        maxRedirects: 5,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: (status) => status < 500
      });

      // If redirected to Google Login page (302/401/403 or HTML response instead of TXT)
      const isHtmlResponse = typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>') && response.data.includes('ServiceLogin');
      
      if (response.status === 401 || response.status === 403 || isHtmlResponse) {
        throw new Error('Google Doc is private or restricted. Please set sharing permissions to "Anyone with the link can view".');
      }

      if (response.status === 404) {
        throw new Error('Google Doc not found (404). Please verify the document URL.');
      }

      const textData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      
      if (!textData || textData.trim().length < 5) {
        throw new Error('Google Doc is empty or contains no readable text content.');
      }

      return {
        docId,
        rawText: textData.trim(),
        title: `Google Doc (${docId.substring(0, 8)})`
      };
    }
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Google Doc is private or restricted. Please set sharing permissions to "Anyone with the link can view".');
    }
    if (error.response?.status === 404) {
      throw new Error('Google Doc not found (404). Please check the URL.');
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request to fetch Google Doc timed out after 15 seconds.');
    }
    throw error;
  }
}
