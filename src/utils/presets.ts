export interface QAPreset {
  id: string;
  name: string;
  description: string;
  documentTitle: string;
  documentUrl: string;
  documentContent: string;
  websiteTitle: string;
  websiteUrl: string;
  websiteContent: string;
}

export const PRESETS: QAPreset[] = [
  {
    id: 'loft-insulation',
    name: 'Loft Insulation Agency (Prompt Case)',
    description: 'Demonstrates exact prompt examples: missing thermal survey, incorrect phone & CTA, partial match on about text, and additional offer.',
    documentTitle: 'Loft Insulation Services Copy Spec v2.pdf',
    documentUrl: 'https://docs.google.com/document/d/1A2B3C4D_LoftInsulationSpec',
    documentContent: `# Hero Section
Book Your Free Consultation

# About Section
We provide professional loft insulation services across the UK.

# Services
- Thermal Imaging Survey
- Loft Insulation Installation
- Damp & Mold Control

# CTA Sections
Book Your Free Survey

# Contact Section
Phone Number: +44 123456789
Email: support@loftinsulation.co.uk

# FAQs
Q: How long does a loft survey take?
A: Our certified survey takes approximately 45 minutes.

# Footer
© 2026 Loft Insulation Experts UK. All rights reserved.`,
    websiteTitle: 'Loft Insulation UK Live Preview',
    websiteUrl: 'https://preview.loftinsulation.co.uk/staging',
    websiteContent: `<header>
  <nav>Home | Services | About | Contact</nav>
  <h1>Book Your Free Consultation</h1>
</header>
<section id="about">
  <h2>About Us</h2>
  <p>We provide loft insulation services.</p>
</section>
<section id="services">
  <h2>Our Services</h2>
  <ul>
    <li>Loft Insulation Installation</li>
    <li>Damp & Mold Control</li>
  </ul>
  <button class="cta">Book Survey</button>
  <div class="banner">Limited Time Offer</div>
</section>
<section id="contact">
  <h2>Contact Us</h2>
  <p>Phone Number: +44 987654321</p>
  <p>Email: support@loftinsulation.co.uk</p>
</section>
<section id="faq">
  <h3>Q: How long does a loft survey take?</h3>
  <p>A: Our certified survey takes approximately 45 minutes.</p>
</section>
<footer>
  <p>© 2026 Loft Insulation Experts UK. All rights reserved.</p>
</footer>`
  },
  {
    id: 'saas-launch',
    name: 'CloudSync SaaS Landing Page QA',
    description: 'Full SaaS product copy audit with missing feature highlights, altered pricing CTA, and extra footer links.',
    documentTitle: 'CloudSync Master Brand Messaging.gdoc',
    documentUrl: 'https://docs.google.com/document/d/9Z8Y7X6W_CloudSyncMasterDoc',
    documentContent: `# Hero Section
Supercharge Your Team Workflow with AI Automation

# About Section
CloudSync is the leading enterprise-grade workflow automation platform built for modern engineering teams.

# Services
- Real-Time Database Sync
- Autonomous AI Agent Workflows
- Enterprise Security & SOC2 Compliance

# CTA Sections
Start Your 14-Day Free Trial

# Contact Section
Phone Number: +1 800-555-0199
Email: sales@cloudsync.io

# FAQs
Q: Is there a setup fee?
A: No, CloudSync offers transparent month-to-month billing with no hidden fees.

# Footer
Built with precision. Privacy Policy | Terms of Service`,
    websiteTitle: 'CloudSync App Landing Page',
    websiteUrl: 'https://cloudsync.io/app-preview',
    websiteContent: `<header>
  <h1>Supercharge Your Team Workflow with AI Automation</h1>
</header>
<section id="about">
  <p>CloudSync is the leading workflow automation platform built for modern engineering teams.</p>
</section>
<section id="services">
  <h2>Key Features</h2>
  <ul>
    <li>Real-Time Database Sync</li>
    <li>Enterprise Security & SOC2 Compliance</li>
  </ul>
  <button>Start Free Trial</button>
  <p class="badge">Join 10,000+ Teams</p>
</section>
<section id="contact">
  <p>Phone Number: +1 800-555-0199</p>
  <p>Email: sales@cloudsync.io</p>
</section>
<footer>
  <p>Built with precision. Privacy Policy | Terms of Service</p>
</footer>`
  }
];
