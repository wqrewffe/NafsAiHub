import { readFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

const file = './public/sitemap.xml';
try {
  const xml = readFileSync(file, 'utf8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    allowBooleanAttributes: true,
  });
  const result = parser.parse(xml);
  console.log('XML parsed successfully. Root keys:', Object.keys(result));
} catch (err) {
  console.error('Failed to parse XML:', err.message);
  process.exit(1);
}
