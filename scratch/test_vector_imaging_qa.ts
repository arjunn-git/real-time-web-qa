import { scrapeFullWebsite } from '../server/services/websiteScraper';
import { runDeliveryQaEngine } from '../server/services/deliveryQaEngine';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawText = `
Vector Imaging Limited
Unit 8, Langley Court, Langley Road, Burscough Ind Est, Ormskirk, L40 8JR
+441942943557
01942 943557
vectorimagingltd@gmail.com

Social Media
Facebook: https://www.facebook.com/people/Vector-Imaging/61571414773549/
Instagram: https://www.instagram.com/vectorimaginglimited/

Opening Hours
QA Feedback:
1.

SITE MAP:
Home
Custom Branded Workwear
DTF Printing
Teamwear & Uniforms
PPE & High-Vis Clothing
Logo Recreation
Clothing Printing
Contact Us

Notes for the QA:
Notes for the Designer:
1. Review Us: https://www.yell.com/reviews/places/addreview/id/vector-imaging-limited-ormskirk-901779699
Get In Touch

Home (Page 1)
Page/Meta Title: Branded Workwear Producers | Ormskirk | Vector Imaging Limited
Meta Description: Branded workwear producers in Ormskirk from Vector Imaging Limited. DTF printing, logo recreation and fast turnaround for businesses wth friendly help.
H1 (Hero image text): Branded workwear producers in Ormskirk with 3-day turnaround
DTF printing specialists. Logo recreation included. Nationwide shipping via DPD
Hero image button: Ask A Question > Link to
Note for the Designer: Text > page
Text > page

Why we excel
Friendly help from real people
You get direct, one-to-one support instead of being passed around. We keep things clear, practical, and easy to follow from the first enquiry.
Branding sorted from rough artwork
A blurry file or unfinished logo doesn't have to stop your order. We can recreate and prepare artwork so your branding is ready for print.
Flexible ordering as you grow
Small first runs make sense when your business is just getting started. We can also handle scheduled production and fulfilment when your order volumes grow.

H2
Workwear branding without the usual hustle
Starting a new business or trying to smarten up your team can feel like one more job on an already packed list. At Vector Imaging Limited, we keep it straightforward, helping you turn ideas, rough logos, and garment choices into branded clothing printing that actually looks the part. We focus on fast, friendly support because you shouldn't have to chase printers, guess sizes, or wonder if your design will come out right. With a typical 3-day turnaround and a one-to-one approach, we help you get moving without making a meal of it.

What we offer
Custom workwear
We brand workwear that helps your team look smart, consistent and ready for the job. It's a practical way to put your name in front of customers every day.
[Branded Workwear] > Custom Branded Workwear
Teamwear & uniforms
We create branded clothing that keeps your staff looking united. From busy trade teams to customer-facing businesses, we make it easier to present your brand properly.
[Teamwear & Uniforms] > Teamwear & Uniforms
DTF printing
Our direct-to-film printing gives you a sharp, durable finish that works brilliantly across a wide range of garments. It's ideal when you want strong colour and dependable results.
[DTF Printing] > DTF Printing

Why customers come to us
● Typical 3-day turnaround
● Print-ready artwork support
● Ideal for start-ups
● Local delivery in Ormskirk
● Consistent branding you can trust

The details that make the job easier
When your team needs to look professional fast, delays and messy artwork can slow everything down. We use DTF printing for a clean, durable finish, and at Vector Imaging Limited, we can recreate logos from images or AI-generated artwork when needed. That means you don't need to arrive with everything perfectly prepared before we can get started. We also support bulk fulfilment, local delivery and nationwide shipping, so your order can match the way your business actually runs.
[Contact Us Now] > Button
[Browse Our Products]

Testimonials (If available)
Absolutely brilliant service! From enquiring all the way through to the end result was fab! Nothing was/is too much trouble and trust me I put them through the paces with my questions & needs! The end product was amazing & is loved by all who received them! Thank you so much
- Jayne Ashcroft, Facebook
100% Recommend! Nick Does Exactly What He Advertises Which Is So Refreshing! Nick Is A Real Pleasure To Do Business With; He's Helpful, Gives Advice, DeliveredMy Products And Phoned Me To Keep Me Updated.
A Fast And Friendly Service, Exactly What Every Busy Person Needs When Running Their Own Business.
If You're In Formby Look Out For Me!In My Polo Tops, Hoody And Jacket Promoting My Professional Dog Walking & Petsitting Business.
- Priority Pets By Linda, Facebook

CTA
Make your brand part of every job
Call our branded workwear producers to get started.
Button: Enquire Now > Link to 000 000 000


Custom Branded Workwear (Page 2)
Page Title: Custom Branded Workwear | Ormskirk | Vector Imaging Limited
Meta Description: Custom branded workwear in Ormskirk from Vector Imaging Limited, helping with artwork, DTF printing, logo recreation and branded clothing for teams.
H1 (Hero image text): Custom branded workwear across Ormskirk
Professional printed garments. Logo recreation available. DTF printing specialists
Hero image button: Start Your Enquiry > Link to
Note for the Designer: Text > page
Text > page

What makes us different
We help with the artwork
Not every business has a perfect logo file ready to go. We can help recreate your design so your branding looks clean in print.
Made for working businesses
Our approach suits trades, local companies, and teams that need clothing they can actually use. You get branding that looks smart without losing the practical side of workwear.
A consistent look across your team
Matching branded clothing makes your staff easier to recognise on site and in public. It gives your business a steadier, more professional presence.

H2
Give your team a sharper look
Custom branded workwear gives your business a clear, professional image from the first handshake to the end of the job. We print and brand clothing for trades, small businesses and growing teams who want their staff to look consistent and easy to recognise. Brand recognition matters when your team is on site, on the road, or walking into a customer's premises, because your logo keeps working long after the van has left.
We also help with logo recreation when your artwork isn't quite ready, which can save you time and hassle before printing starts. You'll find us working with businesses who want practical clothing that also does a solid marketing job. Vector Imaging Limited keeps the process straightforward, so you can get branded kit sorted without turning it into a full-time project.

H2
Printing that works in the real world
Our DTF printing is a strong fit for businesses that need clear, durable branding on everyday garments. That matters when your workwear has to handle busy shifts, regular washing, and the odd hard day on site. If your logo only exists as an old file, a rough image, or something pulled from previous artwork, we can help recreate it into something print-ready.
Vector Imaging Limited supports firms that want branded clothing to look tidy, readable, and consistent from one member of staff to the next. Affordable marketing sounds like a big phrase, but in truth it's simple: your team wears your name where people can actually see it.

H2
What you can expect from this service
With Vector Imaging Limited, you can expect:
● Printed and branded workwear
● A professional image for your business
● Better day-to-day brand recognition
● A consistent look across your teamwear
● Affordable ongoing marketing
● DTF printing from specialists
● Logo recreation support available
[Contact Our Team] > Button
[Contact Us Today] > Button

FAQs
Can you recreate our logo if we only have an image?
Yes, we can help recreate logos from existing images so they're suitable for printing. That's useful if your current artwork is low quality, outdated, or not in a format that works well on workwear.
How long does a custom branded workwear order take?
A typical turnaround is around 3 days, although this can vary depending on the order size and artwork requirements. If your logo needs recreating before print, we'll let you know what to expect from the start.
What is DTF printing, and why is it used on workwear?
DTF stands for Direct to Film printing, a process we use to apply detailed designs onto garments. It's a popular choice for branded workwear because it can produce clear logos and strong colour on a wide range of clothing.

Testimonials
Thanks for the branded clothing for my neurofeedback practice. Very pleased with the results and delivery.
- betta brain training, Facebook

CTA
Get your team looking the part
Call us today and enquire about custom branded workwear
Button: Speak To Our Team > Link to 000 000 000


DTF Printing (Page 3)
Page Title: DTF Printing | Ormskirk | Vector Imaging Limited
Meta Description: DTF printing in Ormskirk from Vector Imaging Limited, for branded workwear, logo recreation, a finish that holds well and clear, and durable garment printing.
H1 (Hero image text): DTF printing in Ormskirk for clear branded workwear
Sharp logo detail on workwear. Artwork help available. A practical choice for trades and teams
Hero image button: Get Assistance > Link to
Note for the Designer: Text > page
Text > page

What sets us apart
Branding that looks the part
We help your clothing look professional from the start. You get branding that backs up the standard of your work.
Support from design to print
We can help if your logo needs recreating before print. That saves time and avoids the usual back and forth.
A finish that holds up well
DTF printing gives you clear detail and a durable result for everyday garments. Your branding stays neat across the clothing your team actually wears.

H2
Branded clothing that works hard for your business
DTF printing gives you a clean, durable way to brand workwear for your team, and it's a smart fit when you want your logo to look sharp on site, in the van, or on the job. We print branded clothing for businesses and trades, helping you create a more professional image and making your staff easier to recognise.
We also know that consistency counts, because matching printed uniforms help your business look organised from the first handshake. Vector Imaging Limited keeps the process straightforward, with support for logo recreation if your artwork isn't quite ready. Done well, printed workwear becomes affordable marketing you can wear every day.

H2
A practical choice for busy teams
Your branding needs to stay clear across real working clothing, not just look good on a screen, and that's where this print method earns its keep. We use DTF printing for workwear that needs strong detail and a neat finish, especially when logos have fine lines or multiple colours. For small businesses and start-ups, that can save a lot of fuss compared with trying to make different garments match by guesswork.
We've also built our service around a typical 3-day turnaround, because waiting around for uniforms rarely helps anybody. Our team at Vector Imaging Limited gives you one-to-one support with a focus on getting your branding right first time.

H2
What you can expect from our work
● Printed and branded workwear
● Ideal for businesses and trades
● Professional image for your team
● Stronger brand recognition on site
● Consistent look across staff clothing
● Affordable day-to-day marketing
● Logo recreation support available
● Custom PPE & High Vis Clothing
[Contact Us Now] > Button
[Contact Our Experts] > Button

FAQs
What is DTF printing?
DTF printing is a method that transfers your design onto clothing using a printed film. It's a good choice for detailed logos, bold colours, and branded workwear that needs a clean finish.
How long does a DTF printing order take?
Our typical turnaround is 3 days, although timing can vary with order size and artwork readiness. If you need branded clothing quickly, call us and we'll let you know what is realistic for your job.
Can you recreate a logo from an image before printing?
Yes, we can help with logo recreation if your artwork isn't print-ready. That's useful if you only have an image file and still want your branding to come out clear on your workwear.

Testimonials
Great service, quality workwear would highly recommend
- Damian Robinshaw, Facebook

CTA
Need your branding onto the workwear?
Call us now and enquire about reliable DTF printing solutions.
Button: Need Assistance?> Link to 000 000 000


Teamwear & Uniforms (Page 4)
Page Title: Custom Teamwear & Uniforms | Ormskirk | Vector Imaging Limited
Meta Description: Custom teamwear and uniforms in Ormskirk from Vector Imaging Limited, with DTF printing that suits work life and logo recreation for teams to look professional.
H1 (Hero image text): Custom teamwear and uniforms across Ormskirk with logo recreation
Professional branded clothing. DTF printed garments. Logo recreation available
Hero image button: Ready To Get Started? > Link to
Note for the Designer: Text > page
Text > page

Unmatched experience
A cleaner brand presence
Uniforms give your business a more polished look in everyday settings. You stand out more clearly when your team is dressed consistently.
Making artwork preparation easier
Not every business has print-ready files to hand. We can recreate your logo so your clothing is ready to move forward without delays.
Printing that suits working life
Our DTF printing is a practical choice for branded garments that need strong visual impact. It gives you crisp detail that helps your branding stay clear and readable.

H2
Help your team look the part
Custom teamwear and uniforms do more than put a logo on clothing. They help your staff look organised, professional, and ready for the day ahead. We create branded clothing for work teams and organisations that want a stronger identity in front of customers.
Businesses come to us when they need clothing that works hard on site, in the office, or out on deliveries. Vector Imaging Limited helps you turn everyday uniforms into something that feels consistent and recognisable. When your team looks united, your business often feels more established from the very first impression.

H2
Made for busy businesses
Your order needs to look right, but it also needs to be practical for daily wear. We use our DTF printing knowledge to produce branded workwear with clear detail and a sharp finish. If your artwork isn't ready to print, we can recreate your logo and get it prepared properly. Vector Imaging Limited works with trades, start-ups, and local companies that want clothing you'll actually wear with confidence. That means less guesswork for you and a smoother process from design to finished kit.
[] > Button

H2
Build a recognisable and professional team
A smart uniform can make introductions easier before a word is spoken. It helps customers quickly recognise who is part of your team, which is especially useful on busy sites or at public-facing events. Branded clothing also brings a sense of belonging. When everyone is dressed consistently, your team often feels more connected and your business looks better prepared.
[Contact Us] > Button
[Contact Us Today] > Button

FAQs
Can you recreate our logo if we only have an image?
Yes, we can help with logo recreation if you only have an existing image or non-print-ready artwork. We'll prepare it properly so it's suitable for your teamwear and uniform order.
How long does a custom teamwear order usually take?
A typical turnaround is around 3 days, depending on the size of the order and the artwork provided. If you need something specific, call us and we can talk you through the timescale.
What is DTF printing and why is it used on uniforms?
DTF stands for Direct to Film printing. It allows us to apply detailed designs and logos to clothing with a sharp finish, which makes it a strong option for branded uniforms and teamwear.

Testimonials
Great service! Made up with my hoodie. Exactly what I was after. Updates all the way through, quick turnaround and great quality. 100% recommend.
- Shannon Tedford, Facebook

CTA
Keep your team looking professional
Call us today and discuss your custom teamwear and uniform ideas.
Button: Ask A Question > Link to 000 000 000


PPE & High Vis Clothing (Page 5)
Page Title: Custom PPE And High-Vis Clothing | Ormskirk | Vector Imaging Limited
Meta Description: Custom PPE and high-vis clothing in Ormskirk from Vector Imaging Limited, with branded safety wear, logo recreation, and clothing that looks smarter on site.
H1 (Hero image text): Custom PPE and high-vis clothing across Ormskirk
Improved visibility on site. Branded clothing for a smarter look. Support for everyday compliance needs
Hero image button: Reach Your Local Expert > Link to
Note for the Designer: Text > page
Text > page

Our professional edge
A smarter look on site
Branded PPE helps your team look organised from starting. You come across as more established without making the clothing feel overdone.
Branded sitewear solutions
Branded sitewear designed for comfort, durability, and a professional appearance on every job.
Clothing that stays easy to recognise
Clear branding on high-vis garments helps your staff stand out for the right reasons. Your logo stays visible and readable on clothing.

H2
Safety clothing that works harder for your brand
Custom PPE and high-vis clothing do more than help you stay seen. It gives your team a sharper, more professional look while supporting day-to-day site safety. We brand protective clothing with your logo, helping your staff look consistent when they're working on busy jobs, visiting customers, or moving between sites. Improved visibility matters in low light, roadside, warehouse, and construction settings where being clearly seen can make a real difference.
We also help with logo recreation, which is handy if your artwork is old, incomplete, or stuck in the wrong file type. You'll get practical branded workwear from Vector Imaging Limited that looks the part and helps your business come across as organised from the first glance.

H2
Printed for clear identity and everyday use
Your safety wear still needs to feel like part of your business, not just a box-ticking exercise. We use DTF printing to apply branding to protective clothing with sharp detail and a clean finish. That makes a real difference when your logo needs to stay readable on high-vis garments where colour contrast matters.
We've set up this service for trades, local firms, and growing teams that want clothing people will actually wear with confidence. Vector Imaging Limited helps businesses turn essential PPE into something practical, presentable, and easy to recognise.
[] > Button

H2
Why branded PPE makes a difference
First impressions count, especially when your team is arriving on site or meeting customers face to face. Branded high-visibility clothing helps people identify your staff quickly and can make your business look more established. It also helps keep clothing consistent across different roles, which is useful when your team is growing. Our approach keeps safety wear practical while giving your branding a proper place on the job. Contact us today and discuss your workwear requirements.
[Contact Our Experts] > Button
[Contact Us Now] > Button

FAQs
Can you add our logo to high-visibility clothing?
Yes, we can apply your branding to PPE and high-visibility clothing using DTF printing. If your existing artwork isn't ready to print, we can also help with logo recreation.
Who is custom PPE and high-vis clothing suitable for?
It suits tradespeople, site teams, warehouses, delivery staff, and local businesses that need staff to be clearly identifiable. It's especially useful when you want safety clothing to support both visibility and a professional company image.
Why choose branded PPE instead of plain safety wear?
Plain PPE covers the basics, but branded clothing helps people recognise your team quickly and gives your business a more consistent appearance. It's a practical way to combine safety wear with everyday brand visibility.

Testimonials
brilliant service throughout! 100% Recommended!
- Ashby Fencing Supplies ltd, Facebook

CTA
Get your branded safety wear sorted.
Call us today to discuss your custom PPE and high-vis clothing workwear requirements
Button: Start Your Enquiry > Link to 000 000 000


Logo Recreation & Artwork (Page 6)
Page Title: Logo Recreation & Artwork | Ormskirk | Vector Imaging Limited
Meta Description: Logo recreation and artwork in Ormskirk from Vector Imaging Limited. We turn supplied logos and AI artwork into print-ready file and give a professional edge.
H1 (Hero image text): Logo recreation and artwork in Ormskirk with faster setup
No designer required. Print-ready artwork from your logo. Professional output for branded items
Hero image button: Get In Touch > Link to
Note for the Designer: Text > page
Text > page

Distinctive expertise
You can start with what you have
We can work from your supplied logo and AI-generated artwork. That means you don't need to source polished design files before getting started.
Less waiting around before print
We prepare artwork in a format that's ready for production. That helps move your order on faster and cuts down avoidable delays.
A more professional finish for your brand
We refine artwork so it looks cleaner when printed. Your logo has a better chance of appearing consistent across the items you order.

H2
Get your artwork ready for print
We turn your logo and AI-generated artwork into print-ready files that work properly in production. That saves you from chasing a designer when you just need your branding cleaned up and usable. Professional artwork matters because blurry edges, odd spacing, and poor file types can spoil the finish on workwear, signage, or promotional items.
We help businesses avoid those hold-ups by preparing artwork that is clear, practical, and ready to use. You might have a rough image from a phone, an old logo pulled from social media, or a concept made with AI that needs refining before print. We handle that process at Vector Imaging Limited, so your branding looks sharper and your order can move forward without the usual back and forth.

H2
A simpler route from rough file to finished branding
Your starting point doesn't need to be perfect for us to work with it. We recreate logos from supplied images and tidy up AI-generated artwork so it's suitable for professional clothing printing. That means cleaner lines, better consistency, and fewer surprises once your design goes onto garments or signage. Vector Imaging Limited keeps the process straightforward, which is especially useful when you're ordering branded items for staff and need everything to look consistent.
[] > Button

H2
Why clean artwork makes such a difference
Clear artwork helps print equipment reproduce your branding more accurately, especially on clothing and signage where fine details can easily get lost. It also reduces delays caused by unsuitable file types or poor-quality images. When your logo is prepared properly, colours, shapes, and lettering are easier to reproduce consistently. That gives you a more polished look across the items your customers and staff see every day. Get in touch with our team and get started.
[Contact Us] > Button
[Contact Us Today] > Button

FAQs
Can you recreate logos from AI images?
Yes, we can recreate logos from AI-generated images and turn them into print-ready artwork. We tidy up shapes, lines, and layout so the finished file is more suitable for professional printing.
Do I need a designer before placing an order?
No, you don't need to hire a designer first. We can work from the artwork you already have and prepare it for print, which helps keep the process simpler and quicker.
Why does artwork need to be print-ready?
Print-ready artwork helps avoid problems such as fuzzy edges, poor scaling, and inconsistent results on finished items. It gives us a cleaner file to work from, which usually leads to a more professional final look.

Testimonials
Placed our first order last week, got our uniforms today and we are very pleased with what we got, very professional, they even included instructions on how best to take care of the uniforms. 5 stars
- Greg David, Facebook

CTA
Get your logo cleaned up
Call us today and enquire about logo recreation & artwork.
Button: Ready To Get Started? > Link to 000 000 000


Clothing Printing (Page 7)
Page Title: Clothing Printing | Ormskirk | Vector Imaging Limited
Meta Description: Clothing printing in Ormskirk from Vector Imaging Limited, with low cost and clear branding across every jacket, hoodie, polo and cap for teams.
H1 (Hero image text): Clothing printing in Ormskirk for start-ups and teams
Low-cost branding for start-ups. Durable prints for teams and trades. Caps, jackets and hoodies for stronger visibility
Hero image button: Enquire Now > Link to
Note for the Designer: Text > page
Text > page

Defining our difference
A practical choice for new businesses
Low-cost branded t-shirts give you a straightforward way to get started. You can look organised early on without stretching your budget.
Clothing made for real working days
We focus on garments that suit teams, trades and outdoor jobs. That means your comfort, durability and branding are still looking the part.
Clear branding across every item
Matching prints across jackets, hoodies and caps help your team look consistent. Vector Imaging Limited keeps your branding looking joined up from one garment to the next.

H2
Printed workwear that gets your name seen
Clothing printing does more than put a logo on fabric. It gives your team a smart, consistent look and helps your business get noticed on site, on the road, and when you walk through a customer's door. We print workwear such as t-shirts, polo shirts, hoodies, jackets and caps using methods suited to clear, durable branding.
Vector Imaging Limited supports businesses with practical branded clothing that looks professional without making the process hard work. If you're launching a new firm, low-cost printed t-shirts can help you look established from day one. When your staff are dressed properly, your brand keeps working even when you're busy getting the job done.

H2
Workwear that suits how the job really looks
Your clothing needs to match the kind of day you actually have, not just look good in a photo. Printed polo shirts give you a neater finish for customer-facing roles, while hoodies are a comfortable choice for teams working through long shifts and colder mornings. Branded jackets add weather protection and a more polished appearance when you're outdoors or travelling between jobs.
Printed caps and headwear add one more visible touch that keeps your branding consistent. We've shaped our clothing printing service around trades, teams and small businesses that want kit you'll genuinely wear.
[] > Button

H2
What you can print for your team
For clothing printing, we can help with:
● Custom branded workwear t-shirts
● Low-cost options for start-ups
● Printed polos for a smarter appearance
● Hoodies for teams and trades
● Branded jackets for outdoor wear
● Printed caps for extra exposure
● Durable branding for daily use
● Workwears with DTF printing
[Contact Us] > Button
[Contact Us Now] > Button

FAQs
How long does clothing printing usually take?
Typical turnaround is around 3 days for many clothing printing orders. Timing can still depend on garment choice, artwork and quantity, so it's best to call us before ordering if you're working to a deadline.
What kind of businesses is clothing printing best for?
Clothing printing works well for tradespeople, start-ups, local companies and any team that wants a smart branded look. It's especially useful when you want staff to be easy to identify and your name to stay visible throughout the working day.
What clothing items can you print on?
We can print on t-shirts, polo shirts, hoodies, jackets and caps. That gives you a good mix of everyday workwear, warmer layers and extra branded items for a more consistent team appearance.

Testimonials
Nick had done some clothing for us including printing on 2 Armoured hoodies. great quality prints and garments supplied aswell. Highly recommend and will be returning for our company clothing wear from now on
- Kathryn Sharrock, Facebook

CTA
Get your branded clothing sorted
Call us and enquire about a clothing printing job.
Button: Enquire Today > Link to 000 000 000


Contact Us (Page 8)
Page Title: DTF Printing Company | Ormskirk | Vector Imaging Limited
Meta Description: Contact Vector Imaging Limited in Ormskirk, a DTF printing company offering branded workwear and logo recreation. Call us today on 01942 943557.
H1 (Hero image text): DTF printing company in Ormskirk with local delivery
As a DTF printing company based in Ormskirk, we provide custom branded workwear, logo recreation, signage and Direct-to-Film (DTF) printing for businesses. Our practical solutions help you create a professional image with quality clothing and graphics, supported by a friendly one-to-one service, local delivery and dependable advice from experienced DTF printing specialists.
Hero image button: Capital Case > Link to form/email
Note for the Designer: Text > page
Text > page

Get in touch with our team
Name*
Email*
Phone*
Which service are you interested in? * DROPDOWN
Custom Branded Workwear
DTF Printing
Teamwear & Uniforms
PPE & High-Vis Clothing
Logo Recreation
Clothing Printing
Message
[Submit] > vectorimagingltd@gmail.com

CONTACT FORM
Discuss your needs
How can we help?*
● Product enquiry
● Quotes & Costing
● Customer Support
● Other
`;

async function main() {
  const targetUrl = 'https://yelluk.wixsite.com/website-65497';
  console.log(`[Scraper Run] Crawling target website: ${targetUrl}`);
  
  try {
    const siteData = await scrapeFullWebsite(targetUrl);
    console.log(`[Scraper Success] Crawled ${siteData.pages.length} pages:`, siteData.pages.map(p => p.name));
    
    const docData = {
      docId: 'vector-imaging-spec',
      rawText,
      title: 'Vector Imaging Specification Document'
    };
    
    console.log('[QA Engine] Running matching engine audit...');
    const report = runDeliveryQaEngine(docData, siteData);
    
    const outputPath = path.join(__dirname, 'vector_imaging_report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`[QA Success] Generated report saved to: ${outputPath}`);
    
    // Write markdown report summary
    const mdPath = path.join(__dirname, 'vector_imaging_report_summary.md');
    let md = `# Vector Imaging Limited - Live QA Audit Findings\\n\\n`;
    md += `Target Wix Preview: [${targetUrl}](${targetUrl})\\n\\n`;
    md += `## Summary Indicators\\n`;
    md += `- **Delivery Readiness Status**: \`\${report.websiteDeliveryStatus}\`\\n`;
    md += `- **Copy Discrepancy Count**: \`\${report.contentDiscrepancies.filter(d => d.type.startsWith('❌')).length}\` issues found\\n`;
    md += `- **Phone Status**: \`\${report.contactInfoReport.phone.status}\` (Expected: \${report.contactInfoReport.phone.expected}, Found: \${report.contactInfoReport.phone.value})\\n`;
    md += `- **Email Status**: \`\${report.contactInfoReport.email.status}\` (Expected: \${report.contactInfoReport.email.expected}, Found: \${report.contactInfoReport.email.value})\\n`;
    md += `- **Socials Status**:\\n`;
    report.contactInfoReport.socials.forEach(s => {
      md += `  - **\${s.platform}**: \`\${s.status}\` (\${s.found})\\n`;
    });
    
    md += \`\\n## Copy Discrepancy Log (Errors Only)\\n\`;
    report.contentDiscrepancies.filter(d => d.type.startsWith('❌')).forEach(d => {
      md += \`### [\${d.page}] > [\${d.section}] (\${d.component})\\n\`;
      md += \`- **Item**: \${d.item}\\n\`;
      md += \`- **Expected**: \\\`\${d.expected}\\\`\\n\`;
      md += \`- **Found**: \\\`\${d.found}\\\`\\n\`;
      if (d.recommendation) md += \`- **Action**: *\${d.recommendation}*\\n\`;
      md += \`\\n\`;
    });

    md += \`\\n## Button Link Action Audits\\n\`;
    report.buttonsReport.items.forEach(b => {
      md += \`- **\${b.page}** > **\${b.name}**: links to \\\`\${b.href}\\\` (\${b.actionType})\\n\`;
    });

    fs.writeFileSync(mdPath, md, 'utf-8');
    console.log(`[QA Success] Markdown summary saved to: \${mdPath}`);
  } catch (e: any) {
    console.error('[Error running analysis]', e.message);
  }
}

main();
