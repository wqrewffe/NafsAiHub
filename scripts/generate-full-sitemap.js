import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hostname = 'https://nafsaihub.vercel.app';

// Routes discovered from App.tsx
const staticRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
  '/policies',
  '/support',
  '/contact',
  '/helpchat'
];

// Private but still publicly reachable pages we include (optional)
const optionalPublicRoutes = [
  '/badges',
  '/leaderboard',
  '/todo',
  '/notes',
  '/settings',
  '/referral'
];

// Trainer modes from App.tsx map
const trainerModes = [
  'select','lights-out','grid-reflex','precision-point','sequence','color-match','peripheral-vision',
  'dodge-and-click','auditory-reaction','cognitive-shift','target-tracking','digit-span','visual-search'
];

// Tools list will be read from tools/index.tsx by a simple regex require
import { readFileSync } from 'fs';
const toolsFile = resolve(__dirname, '..', 'tools', 'index.tsx');
let toolsContent = '';
try { toolsContent = readFileSync(toolsFile, 'utf8'); } catch (e) { console.error('Failed to read tools file', e); }
const pathMatches = Array.from(new Set((toolsContent.match(/path:\s*'([^']+)'/g) || []).map(m => m.replace(/path:\s*'/, '').replace(/'/, ''))));

const urls = new Set([...staticRoutes, ...optionalPublicRoutes, ...pathMatches]);
// add trainer routes
trainerModes.forEach(m => urls.add(`/trainer/${m}`));

// Build XML
const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
const urlsetClose = '</urlset>\n';
const now = new Date().toISOString();
const urlsXml = Array.from(urls).map(u => `  <url>\n    <loc>${hostname}${u}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`).join('');
const xml = header + urlsetOpen + urlsXml + urlsetClose;
const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log('full sitemap written to', outPath);
