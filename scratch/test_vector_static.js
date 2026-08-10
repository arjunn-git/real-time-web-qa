import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesToScrape = [
  { name: 'Home', url: 'https://yelluk.wixsite.com/website-65497' },
  { name: 'Custom Branded Workwear', url: 'https://yelluk.wixsite.com/website-65497/custom-branded-workwear' },
  { name: 'DTF Printing', url: 'https://yelluk.wixsite.com/website-65497/dtf-printing' },
  { name: 'Teamwear & Uniforms', url: 'https://yelluk.wixsite.com/website-65497/teamware-and-uniforms' },
  { name: 'PPE & High-Vis Clothing', url: 'https://yelluk.wixsite.com/website-65497/ppe-and-high-vis-clothing' },
  { name: 'Logo Recreation', url: 'https://yelluk.wixsite.com/website-65497/logo-recreation-and-artwork' },
  { name: 'Clothing Printing', url: 'https://yelluk.wixsite.com/website-65497/clothing-printing' },
  { name: 'Contact Us', url: 'https://yelluk.wixsite.com/website-65497/contact-us' }
];

const docSpec = {
  'Home': {
    metaTitle: 'Branded Workwear Producers | Ormskirk | Vector Imaging Limited',
    metaDesc: 'Branded workwear producers in Ormskirk from Vector Imaging Limited. DTF printing, logo recreation and fast turnaround for businesses wth friendly help.',
    h1: 'Branded workwear producers in Ormskirk with 3-day turnaround',
    paragraphs: [
      'DTF printing specialists. Logo recreation included. Nationwide shipping via DPD',
      'Starting a new business or trying to smarten up your team can feel like one more job on an already packed list. At Vector Imaging Limited, we keep it straightforward, helping you turn ideas, rough logos, and garment choices into branded clothing printing that actually looks the part. We focus on fast, friendly support because you shouldn\'t have to chase printers, guess sizes, or wonder if your design will come out right. With a typical 3-day turnaround and a one-to-one approach, we help you get moving without making a meal of it.',
      'We brand workwear that helps your team look smart, consistent and ready for the job. It\'s a practical way to put your name in front of customers every day.',
      'We create branded clothing that keeps your staff looking united. From busy trade teams to customer-facing businesses, we make it easier to present your brand properly.',
      'Our direct-to-film printing gives you a sharp, durable finish that works brilliantly across a wide range of garments. It\'s ideal when you want strong colour and dependable results.',
      'When your team needs to look professional fast, delays and messy artwork can slow everything down. We use DTF printing for a clean, durable finish, and at Vector Imaging Limited, we can recreate logos from images or AI-generated artwork when needed. That means you don\'t need to arrive with everything perfectly prepared before we can get started. We also support bulk fulfilment, local delivery and nationwide shipping, so your order can match the way your business actually runs.'
    ],
    headings: ['Why we excel', 'Friendly help from real people', 'Branding sorted from rough artwork', 'Flexible ordering as you grow', 'Workwear branding without the usual hustle', 'What we offer', 'Why customers come to us', 'The details that make the job easier', 'Make your brand part of every job'],
    lists: ['Typical 3-day turnaround', 'Print-ready artwork support', 'Ideal for start-ups', 'Local delivery in Ormskirk', 'Consistent branding you can trust']
  },
  'Custom Branded Workwear': {
    metaTitle: 'Custom Branded Workwear | Ormskirk | Vector Imaging Limited',
    metaDesc: 'Custom branded workwear in Ormskirk from Vector Imaging Limited, helping with artwork, DTF printing, logo recreation and branded clothing for teams.',
    h1: 'Custom branded workwear across Ormskirk',
    paragraphs: [
      'Professional printed garments. Logo recreation available. DTF printing specialists',
      'Custom branded workwear gives your business a clear, professional image from the first handshake to the end of the job. We print and brand clothing for trades, small businesses and growing teams who want their staff to look consistent and easy to recognise. Brand recognition matters when your team is on site, on the road, or walking into a customer\'s premises, because your logo keeps working long after the van has left.',
      'We also help with logo recreation when your artwork isn\'t quite ready, which can save you time and hassle before printing starts. You\'ll find us working with businesses who want practical clothing that also does a solid marketing job. Vector Imaging Limited keeps the process straightforward, so you can get branded kit sorted without turning it into a full-time project.',
      'Our DTF printing is a strong fit for businesses that need clear, durable branding on everyday garments. That matters when your workwear has to handle busy shifts, regular washing, and the odd hard day on site. If your logo only exists as an old file, a rough image, or something pulled from previous artwork, we can help recreate it into something print-ready.',
      'Vector Imaging Limited supports firms that want branded clothing to look tidy, readable, and consistent from one member of staff to the next. Affordable marketing sounds like a big phrase, but in truth it\'s simple: your team wears your name where people can actually see it.',
      'We help with the artwork. Not every business has a perfect logo file ready to go. We can help recreate your design so your branding looks clean in print.',
      'Made for working businesses. Our approach suits trades, local companies, and teams that need clothing they can actually use. You get branding that looks smart without losing the practical side of workwear.',
      'A consistent look across your team. Matching branded clothing makes your staff easier to recognise on site and in public. It gives your business a steadier, more professional presence.'
    ],
    headings: ['Give your team a sharper look', 'Printing that works in the real world', 'What makes us different', 'What you can expect from this service', 'Get your team looking the part'],
    lists: [
      'Printed and branded workwear',
      'A professional image for your business',
      'Better day-to-day brand recognition',
      'A consistent look across your teamwear',
      'Affordable ongoing marketing',
      'DTF printing from specialists',
      'Logo recreation support available'
    ]
  },
  'DTF Printing': {
    metaTitle: 'DTF Printing | Ormskirk | Vector Imaging Limited',
    metaDesc: 'DTF printing in Ormskirk from Vector Imaging Limited, for branded workwear, logo recreation, a finish that holds well and clear, and durable garment printing.',
    h1: 'DTF printing in Ormskirk for clear branded workwear',
    paragraphs: [
      'Sharp logo detail on workwear. Artwork help available. A practical choice for trades and teams',
      'DTF printing gives you a clean, durable way to brand workwear for your team, and it\'s a smart fit when you want your logo to look sharp on site, in the van, or on the job. We print branded clothing for businesses and trades, helping you create a more professional image and making your staff easier to recognise.',
      'We also know that consistency counts, because matching printed uniforms help your business look organised from the first handshake. Vector Imaging Limited keeps the process straightforward, with support for logo recreation if your artwork isn\'t quite ready. Done well, printed workwear becomes affordable marketing you can wear every day.',
      'Your branding needs to stay clear across real working clothing, not just look good on a screen, and that\'s where this print method earns its keep. We use DTF printing for workwear that needs strong detail and a neat finish, especially when logos have fine lines or multiple colours. For small businesses and start-ups, that can save a lot of fuss compared with trying to make different garments match by guesswork.',
      'We\'ve also built our service around a typical 3-day turnaround, because waiting around for uniforms rarely helps anybody. Our team at Vector Imaging Limited gives you one-to-one support with a focus on getting your branding right first time.',
      'Branding that looks the part. We help your clothing look professional from the start. You get branding that backs up the standard of your work.',
      'Support from design to print. We can help if your logo needs recreating before print. That saves time and avoids the usual back and forth.',
      'A finish that holds up well. DTF printing gives you clear detail and a durable result for everyday garments. Your branding stays neat across the clothing your team actually wears.'
    ],
    headings: ['Branded clothing that works hard for your business', 'A practical choice for busy teams', 'What sets us apart', 'What you can expect from our work', 'Need your branding onto the workwear?'],
    lists: [
      'Printed and branded workwear',
      'Ideal for businesses and trades',
      'Professional image for your team',
      'Stronger brand recognition on site',
      'Consistent look across staff clothing',
      'Affordable day-to-day marketing',
      'Logo recreation support available',
      'Custom PPE & High Vis Clothing'
    ]
  },
  'Teamwear & Uniforms': {
    metaTitle: 'Custom Teamwear & Uniforms | Ormskirk | Vector Imaging Limited',
    metaDesc: 'Custom teamwear and uniforms in Ormskirk from Vector Imaging Limited, with DTF printing that suits work life and logo recreation for teams to look professional.',
    h1: 'Custom teamwear and uniforms across Ormskirk with logo recreation',
    paragraphs: [
      'Professional branded clothing. DTF printed garments. Logo recreation available',
      'Custom teamwear and uniforms do more than put a logo on clothing. They help your staff look organised, professional, and ready for the day ahead. We create branded clothing for work teams and organisations that want a stronger identity in front of customers.',
      'Businesses come to us when they need clothing that works hard on site, in the office, or out on deliveries. Vector Imaging Limited helps you turn everyday uniforms into something that feels consistent and recognisable. When your team looks united, your business often feels more established from the very first impression.',
      'Your order needs to look right, but it also needs to be practical for daily wear. We use our DTF printing knowledge to produce branded workwear with clear detail and a sharp finish. If your artwork isn\'t ready to print, we can recreate your logo and get it prepared properly. Vector Imaging Limited works with trades, start-ups, and local companies that want clothing you\'ll actually wear with confidence. That means less guesswork for you and a smoother process from design to finished kit.',
      'A smart uniform can make introductions easier before a word is spoken. It helps customers quickly recognise who is part of your team, which is especially useful on busy sites or at public-facing events. Branded clothing also brings a sense of belonging. When everyone is dressed consistently, your team often feels more connected and your business looks better prepared.',
      'A cleaner brand presence. Uniforms give your business a more polished look in everyday settings. You stand out more clearly when your team is dressed consistently.',
      'Making artwork preparation easier. Not every business has print-ready files to hand. We can recreate your logo so your clothing is ready to move forward without delays.',
      'Printing that suits working life. Our DTF printing is a practical choice for branded garments that need strong visual impact. It gives you crisp detail that helps your branding stay clear and readable.'
    ],
    headings: ['Help your team look the part', 'Made for busy businesses', 'Build a recognisable and professional team', 'Unmatched experience', 'Keep your team looking professional'],
    lists: []
  },
  'PPE & High-Vis Clothing': {
    metaTitle: 'Custom PPE And High-Vis Clothing | Ormskirk | Vector Imaging Limited',
    metaDesc: 'Custom PPE and high-vis clothing in Ormskirk from Vector Imaging Limited, with branded safety wear, logo recreation, and clothing that looks smarter on site.',
    h1: 'Custom PPE and high-vis clothing across Ormskirk',
    paragraphs: [
      'Improved visibility on site. Branded clothing for a smarter look. Support for everyday compliance needs',
      'Custom PPE and high-vis clothing do more than help you stay seen. It gives your team a sharper, more professional look while supporting day-to-day site safety. We brand protective clothing with your logo, helping your staff look consistent when they\'re working on busy jobs, visiting customers, or moving between sites. Improved visibility matters in low light, roadside, warehouse, and construction settings where being clearly seen can make a real difference.',
      'We also help with logo recreation, which is handy if your artwork is old, incomplete, or stuck in the wrong file type. You\'ll get practical branded workwear from Vector Imaging Limited that looks the part and helps your business come across as organised from the first glance.',
      'Your safety wear still needs to feel like part of your business, not just a box-ticking exercise. We use DTF printing to apply branding to protective clothing with sharp detail and a clean finish. That makes a real difference when your logo needs to stay readable on high-vis garments where colour contrast matters.',
      'We\'ve set up this service for trades, local firms, and growing teams that want clothing people will actually wear with confidence. Vector Imaging Limited helps businesses turn essential PPE into something practical, presentable, and easy to recognise.',
      'First impressions count, especially when your team is arriving on site or meeting customers face to face. Branded high-visibility clothing helps people identify your staff quickly and can make your business look more established. It also helps keep clothing consistent across different roles, which is useful when your team is growing. Our approach keeps safety wear practical while giving your branding a proper place on the job. Contact us today and discuss your workwear requirements.',
      'A smarter look on site. Branded PPE helps your team look organised from starting. You come across as more established without making the clothing feel overdone.',
      'Branded sitewear solutions. Branded sitewear designed for comfort, durability, and a professional appearance on every job.',
      'Clothing that stays easy to recognise. Clear branding on high-vis garments helps your staff stand out for the right reasons. Your logo stays visible and readable on clothing.'
    ],
    headings: ['Safety clothing that works harder for your brand', 'Printed for clear identity and everyday use', 'Why branded PPE makes a difference', 'Our professional edge', 'Get your branded safety wear sorted.'],
    lists: []
  },
  'Logo Recreation': {
    metaTitle: 'Logo Recreation & Artwork | Ormskirk | Vector Imaging Limited',
    metaDesc: 'Logo recreation and artwork in Ormskirk from Vector Imaging Limited. We turn supplied logos and AI artwork into print-ready file and give a professional edge.',
    h1: 'Logo recreation and artwork in Ormskirk with faster setup',
    paragraphs: [
      'No designer required. Print-ready artwork from your logo. Professional output for branded items',
      'We turn your logo and AI-generated artwork into print-ready files that work properly in production. That saves you from chasing a designer when you just need your branding cleaned up and usable. Professional artwork matters because blurry edges, odd spacing, and poor file types can spoil the finish on workwear, signage, or promotional items.',
      'We help businesses avoid those hold-ups by preparing artwork that is clear, practical, and ready to use. You might have a rough image from a phone, an old logo pulled from social media, or a concept made with AI that needs refining before print. We handle that process at Vector Imaging Limited, so your branding looks sharper and your order can move forward without the usual back and forth.',
      'Your starting point doesn\'t need to be perfect for us to work with it. We recreate logos from supplied images and tidy up AI-generated artwork so it\'s suitable for professional clothing printing. That means cleaner lines, better consistency, and fewer surprises once your design goes onto garments or signage. Vector Imaging Limited keeps the process straightforward, which is especially useful when you\'re ordering branded items for staff and need everything to look consistent.',
      'Clear artwork helps print equipment reproduce your branding more accurately, especially on clothing and signage where fine details can easily get lost. It also reduces delays caused by unsuitable file types or poor-quality images. When your logo is prepared properly, colours, shapes, and lettering are easier to reproduce consistently. That gives you a more polished look across the items your customers and staff see every day. Get in touch with our team and get started.',
      'You can start with what you have. We can work from your supplied logo and AI-generated artwork. That means you don\'t need to source polished design files before getting started.',
      'Less waiting around before print. We prepare artwork in a format that\'s ready for production. That helps move your order on faster and cuts down avoidable delays.',
      'A more professional finish for your brand. We refine artwork so it looks cleaner when printed. Your logo has a better chance of appearing consistent across the items you order.'
    ],
    headings: ['Get your artwork ready for print', 'A simpler route from rough file to finished branding', 'Why clean artwork makes such a difference', 'Distinctive expertise', 'Get your logo cleaned up'],
    lists: []
  },
  'Clothing Printing': {
    metaTitle: 'Clothing Printing | Ormskirk | Vector Imaging Limited',
    metaDesc: 'Clothing printing in Ormskirk from Vector Imaging Limited, with low cost and clear branding across every jacket, hoodie, polo and cap for teams.',
    h1: 'Clothing printing in Ormskirk for start-ups and teams',
    paragraphs: [
      'Low-cost branding for start-ups. Durable prints for teams and trades. Caps, jackets and hoodies for stronger visibility',
      'Clothing printing does more than put a logo on fabric. It gives your team a smart, consistent look and helps your business get noticed on site, on the road, and when you walk through a customer\'s door. We print workwear such as t-shirts, polo shirts, hoodies, jackets and caps using methods suited to clear, durable branding.',
      'Vector Imaging Limited supports businesses with practical branded clothing that looks professional without making the process hard work. If you\'re launching a new firm, low-cost printed t-shirts can help you look established from day one. When your staff are dressed properly, your brand keeps working even when you\'re busy getting the job done.',
      'Your clothing needs to match the kind of day you actually have, not just look good in a photo. Printed polo shirts give you a neater finish for customer-facing roles, while hoodies are a comfortable choice for teams working through long shifts and colder mornings. Branded jackets add weather protection and a more polished appearance when you\'re outdoors or travelling between jobs.',
      'Printed caps and headwear add one more visible touch that keeps your branding consistent. We\'ve shaped our clothing printing service around trades, teams and small businesses that want kit you\'ll genuinely wear.',
      'A practical choice for new businesses. Low-cost branded t-shirts give you a straightforward way to get started. You can look organised early on without stretching your budget.',
      'Clothing made for real working days. We focus on garments that suit teams, trades and outdoor jobs. That means your comfort, durability and branding are still looking the part.',
      'Clear branding across every item. Matching prints across jackets, hoodies and caps help your team look consistent. Vector Imaging Limited keeps your branding looking joined up from one garment to the next.'
    ],
    headings: ['Printed workwear that gets your name seen', 'Workwear that suits how the job really looks', 'Defining our difference', 'What you can print for your team', 'Get your branded clothing sorted'],
    lists: []
  },
  'Contact Us': {
    metaTitle: 'DTF Printing Company | Ormskirk | Vector Imaging Limited',
    metaDesc: 'Contact Vector Imaging Limited in Ormskirk, a DTF printing company offering branded workwear and logo recreation. Call us today on 01942 943557.',
    h1: 'DTF printing company in Ormskirk with local delivery',
    paragraphs: [
      'As a DTF printing company based in Ormskirk, we provide custom branded workwear, logo recreation, signage and Direct-to-Film (DTF) printing for businesses. Our practical solutions help you create a professional image with quality clothing and graphics, supported by a friendly one-to-one service, local delivery and dependable advice from experienced DTF printing specialists.',
      'Get in touch with our team'
    ],
    headings: [],
    lists: []
  }
};

function norm(s) {
  if (!s) return '';
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '').trim();
}

async function checkPageContent(page) {
  const spec = docSpec[page.name];
  if (!spec) return { status: 'Missing Spec', name: page.name };

  const results = {
    pageName: page.name,
    url: page.url,
    metaTitle: { expected: spec.metaTitle, found: '', status: '❌ Missing' },
    metaDesc: { expected: spec.metaDesc, found: '', status: '❌ Missing' },
    h1: { expected: spec.h1, found: '', status: '❌ Missing' },
    paragraphs: [],
    headings: []
  };

  try {
    console.log(`[Scraping URL] ${page.url}`);
    const response = await axios.get(page.url);
    const $ = cheerio.load(response.data);

    // Meta Title
    const titleText = $('title').text().trim();
    results.metaTitle.found = titleText;
    if (norm(titleText).includes(norm(spec.metaTitle)) || norm(spec.metaTitle).includes(norm(titleText))) {
      results.metaTitle.status = '✅ Correct';
    }

    // Meta Desc
    const descText = $('meta[name="description" i], meta[property="og:description" i]').attr('content')?.trim() || '';
    results.metaDesc.found = descText;
    if (norm(descText).includes(norm(spec.metaDesc)) || norm(spec.metaDesc).includes(norm(descText))) {
      results.metaDesc.status = '✅ Correct';
    }

    const bodyText = $('body').text();
    const cleanBodyText = norm(bodyText);

    // H1 check
    const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
    const cleanH1s = h1s.map(h => norm(h));
    const cleanExpH1 = norm(spec.h1);
    
    results.h1.found = h1s.join(' | ');
    if (cleanH1s.some(h => h.includes(cleanExpH1) || cleanExpH1.includes(h))) {
      results.h1.status = '✅ Correct';
    }

    // Paragraph checks
    spec.paragraphs.forEach(p => {
      const cleanP = norm(p);
      const matched = cleanBodyText.includes(cleanP);
      results.paragraphs.push({
        text: p,
        status: matched ? '✅ Correct' : '❌ Missing'
      });
    });

    // Heading checks
    spec.headings.forEach(h => {
      const cleanH = norm(h);
      const matched = cleanBodyText.includes(cleanH);
      results.headings.push({
        text: h,
        status: matched ? '✅ Correct' : '❌ Missing'
      });
    });

  } catch (err) {
    console.error(`Failed to scrape ${page.name}:`, err.message);
  }

  return results;
}

async function main() {
  const auditResults = [];
  for (const page of pagesToScrape) {
    const res = await checkPageContent(page);
    auditResults.push(res);
  }

  const logPath = path.join(__dirname, 'vector_imaging_all_content_report.json');
  fs.writeFileSync(logPath, JSON.stringify(auditResults, null, 2), 'utf-8');
  console.log(`[Success] Audit saved to: ${logPath}`);

  // Print summary directly to standard output
  let summary = '';
  auditResults.forEach(r => {
    summary += `PAGE: ${r.pageName}\n`;
    summary += `- Meta Title: ${r.metaTitle.status} (Expected: "${r.metaTitle.expected}", Found: "${r.metaTitle.found}")\n`;
    summary += `- Meta Description: ${r.metaDesc.status} (Expected: "${r.metaDesc.expected}", Found: "${r.metaDesc.found}")\n`;
    summary += `- H1 Header: ${r.h1.status} (Expected: "${r.h1.expected}", Found: "${r.h1.found}")\n`;
    
    const missingP = r.paragraphs.filter(p => p.status.startsWith('❌'));
    const missingH = r.headings.filter(h => h.status.startsWith('❌'));
    
    if (missingP.length > 0) {
      summary += `- Missing Paragraphs:\n`;
      missingP.forEach(p => {
        summary += `  * "${p.text.substring(0, 80)}..."\n`;
      });
    } else {
      summary += `- All ${r.paragraphs.length} Paragraphs Matched ✅\n`;
    }

    if (missingH.length > 0) {
      summary += `- Missing Headings:\n`;
      missingH.forEach(h => {
        summary += `  * "${h.text}"\n`;
      });
    } else {
      summary += `- All ${r.headings.length} Headings Matched ✅\n`;
    }
    summary += '\n';
  });

  const mdPath = path.join(__dirname, 'vector_imaging_full_content_summary.md');
  fs.writeFileSync(mdPath, summary, 'utf-8');
  console.log(`[Success] Written markdown summary to: ${mdPath}`);
}

main();
