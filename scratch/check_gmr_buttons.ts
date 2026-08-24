import axios from 'axios';
import * as cheerio from 'cheerio';

async function run() {
  try {
    const res = await axios.get('https://www.gmrdecorators.co.uk/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(res.data);
    
    console.log('=== Anchors with "Garden" or "Paving" in text ===');
    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      const dataHref = $(el).attr('data-href');
      const id = $(el).attr('id');
      const classes = $(el).attr('class');
      
      if (text.includes('Garden') || text.includes('Paving') || text.includes('Enquire') || text.includes('Contact')) {
        console.log({
          text,
          href,
          dataHref,
          id,
          classes
        });
      }
    });
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

run();
