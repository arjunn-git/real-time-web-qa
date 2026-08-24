import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\ambdpc11\\.gemini\\antigravity\\brain\\93f2382e-5965-4609-9368-25cbcdbf6972';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== '.git' && file !== 'node_modules' && file !== '.cache') {
        scanDir(fullPath);
      }
    } else {
      if (file.endsWith('.jsonl') || file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.txt')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('gmrdecorators')) {
            console.log(`FOUND in file: ${fullPath}`);
            // Find where it matches
            const idx = content.indexOf('gmrdecorators');
            console.log(content.substring(Math.max(0, idx - 300), Math.min(content.length, idx + 1000)));
            console.log('=============================');
          }
        } catch (e) {}
      }
    }
  }
}

scanDir(brainDir);
