import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fetchGoogleDocContent } from './services/googleDocFetcher';
import { scrapeFullWebsite } from './services/websiteScraper';
import { extractTextFromFileBuffer } from './services/fileDocumentExtractor';
import { runDeliveryQaEngine } from './services/deliveryQaEngine';

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB limit

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Endpoint 1: Google Doc Link + Website URL
app.post('/api/validate-urls', async (req, res) => {
  const { documentUrl, websiteUrl } = req.body;

  if (!documentUrl || !documentUrl.trim()) {
    return res.status(400).json({ success: false, error: 'Please provide a valid Google Doc Link.' });
  }
  if (!websiteUrl || !websiteUrl.trim()) {
    return res.status(400).json({ success: false, error: 'Please provide a valid Website Preview Link.' });
  }

  try {
    console.log(`[QA Engine - URL] Doc="${documentUrl}", Web="${websiteUrl}"`);

    const [docResult, siteData] = await Promise.all([
      fetchGoogleDocContent(documentUrl),
      scrapeFullWebsite(websiteUrl)
    ]);

    const qaReport = runDeliveryQaEngine(docResult, siteData);

    return res.json({
      success: true,
      document: { title: docResult.title || 'Google Doc Specification', url: documentUrl },
      website: { title: siteData.siteTitle || 'Website Preview', url: websiteUrl, pageCount: siteData.pages.length },
      report: qaReport
    });
  } catch (error: any) {
    console.error('[QA URL Error]', error.message);
    return res.status(422).json({ success: false, error: error.message || 'An unexpected error occurred during QA inspection.' });
  }
});

// Endpoint 2: Document File Upload (DOCX, PDF, TXT, MD) + Website URL
app.post('/api/validate-upload', upload.single('documentFile'), async (req, res) => {
  const { websiteUrl } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, error: 'Please select a document file to upload (.docx, .pdf, .txt, or .md).' });
  }
  if (!websiteUrl || !websiteUrl.trim()) {
    return res.status(400).json({ success: false, error: 'Please provide a valid Website Preview Link.' });
  }

  try {
    console.log(`[QA Engine - Upload] File="${file.originalname}", Mime="${file.mimetype}", Web="${websiteUrl}"`);

    // Extract text from DOCX, PDF, TXT, MD
    const fileDocResult = await extractTextFromFileBuffer(file.buffer, file.originalname, file.mimetype);

    // Scrape website
    const siteData = await scrapeFullWebsite(websiteUrl);

    // Format doc result for QA engine
    const docFormat = { docId: file.originalname, rawText: fileDocResult.rawText, title: file.originalname };
    const qaReport = runDeliveryQaEngine(docFormat, siteData);

    return res.json({
      success: true,
      document: { title: file.originalname, fileType: fileDocResult.fileType },
      website: { title: siteData.siteTitle || 'Website Preview', url: websiteUrl, pageCount: siteData.pages.length },
      report: qaReport
    });
  } catch (error: any) {
    console.error('[QA Upload Error]', error.message);
    return res.status(422).json({ success: false, error: error.message || 'Failed to process document file upload.' });
  }
});

// Endpoint 3: Pasted Copy Text + Website URL
app.post('/api/validate-paste', async (req, res) => {
  const { pastedContent, websiteUrl } = req.body;

  if (!pastedContent || !pastedContent.trim() || pastedContent.trim().length < 10) {
    return res.status(400).json({ success: false, error: 'Please paste the original website content into the editor (minimum 10 characters).' });
  }
  if (!websiteUrl || !websiteUrl.trim()) {
    return res.status(400).json({ success: false, error: 'Please provide a valid Website Preview Link.' });
  }

  try {
    console.log(`[QA Engine - Paste] ContentLength=${pastedContent.length}, Web="${websiteUrl}"`);

    const siteData = await scrapeFullWebsite(websiteUrl);
    const docFormat = { docId: 'pasted-content', rawText: pastedContent.trim(), title: 'Pasted Master Content' };

    const qaReport = runDeliveryQaEngine(docFormat, siteData);

    return res.json({
      success: true,
      document: { title: 'Pasted Master Copy Spec' },
      website: { title: siteData.siteTitle || 'Website Preview', url: websiteUrl, pageCount: siteData.pages.length },
      report: qaReport
    });
  } catch (error: any) {
    console.error('[QA Paste Error]', error.message);
    return res.status(422).json({ success: false, error: error.message || 'An unexpected error occurred during QA inspection.' });
  }
});

import path from 'path';

// Serve built frontend SPA static files in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback SPA middleware for non-API requests (Express v5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Client Delivery QA Validation Server running on port ${PORT}`);
});
