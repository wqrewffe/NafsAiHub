import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hostname = 'https://nafsaihub.vercel.app';
const links = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  // TODO: add more routes here or generate from your router if you have a routes list
];

// Produce a readable/prettified sitemap to avoid parser quirks
(async () => {
  try {
    const sitemapPath = resolve(__dirname, '..', 'public', 'sitemap.xml');
    // build minimal XML manually to control formatting
    const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const urlsetClose = '</urlset>\n';
    const urls = links.map(l => {
      return `  <url>\n    <loc>${hostname}${l.url}</loc>\n    <changefreq>${l.changefreq}</changefreq>\n    <priority>${l.priority}</priority>\n  </url>\n`;
    }).join('');
    const xml = header + urlsetOpen + urls + urlsetClose;
    await new Promise((res, rej) => {
      const ws = createWriteStream(sitemapPath, { encoding: 'utf8' });
      ws.write(xml, (err) => err ? rej(err) : res());
      ws.end();
    });
    console.log('pretty sitemap written to', sitemapPath);
  } catch (err) {
    console.error('Failed to generate sitemap', err);
    process.exit(1);
  }
})();
