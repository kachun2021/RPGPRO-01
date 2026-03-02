import fs from 'fs';
import path from 'path';

function extractText(html) {
      return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/ig, ' ')
            .replace(/\s+/g, ' ')
            .trim();
}

const mixMonDir = 'D:/AI-RPGGAME/chm_extracted/MixMon';
const files = fs.readdirSync(mixMonDir).filter(f => f.endsWith('.htm'));

for (const file of files) {
      const content = fs.readFileSync(path.join(mixMonDir, file), 'utf-8');
      const trs = content.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      console.log(`\n### ${file} (${trs.length} rows)`);
      for (let i = 0; i < Math.min(5, trs.length); i++) {
            const tr = trs[i];
            const tds = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
            const row = tds.map(td => extractText(td)).join(' | ');
            console.log(row);
      }
      break; // Just test the first file
}

const mapMonDir = 'D:/AI-RPGGAME/chm_extracted/MapMon';
const mapFiles = fs.readdirSync(mapMonDir).filter(f => f.endsWith('.htm'));

for (const file of mapFiles) {
      const content = fs.readFileSync(path.join(mapMonDir, file), 'utf-8');
      const trs = content.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      console.log(`\n### ${file} (${trs.length} rows)`);
      for (let i = 0; i < Math.min(5, trs.length); i++) {
            const tr = trs[i];
            const tds = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
            const row = tds.map(td => extractText(td)).join(' | ');
            console.log(row);
      }
      break; // Just test the first map file
}
