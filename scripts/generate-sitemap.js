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

(async () => {
  try {
    const sitemapPath = resolve(__dirname, '..', 'public', 'sitemap.xml');
    const stream = new SitemapStream({ hostname });
    const writeStream = createWriteStream(sitemapPath);
    stream.pipe(writeStream);
    links.forEach(l => stream.write(l));
    stream.end();
    await streamToPromise(stream);
    console.log('sitemap written to', sitemapPath);
  } catch (err) {
    console.error('Failed to generate sitemap', err);
    process.exit(1);
  }
})();
