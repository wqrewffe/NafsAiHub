import { writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hostname = 'https://nafsaihub.vercel.app';

// --- Helper: Extract paths using regex ---
function extractPathsFromFile(filePath, regex) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return Array.from(
      new Set(
        (content.match(regex) || []).map(m =>
          m.replace(/.*path\s*[:=]\s*['"`]/, '').replace(/['"`].*/, '')
        )
      )
    );
  } catch (err) {
    console.warn(`⚠️ Could not read ${filePath}:`, err.message);
    return [];
  }
}

// --- Helper: Recursively find all index.tsx files in a directory ---
function findIndexFiles(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(findIndexFiles(filePath));
    } else if (file === 'index.tsx') {
      results.push(filePath);
    }
  }
  return results;
}

// --- Step 1: Extract routes from root App.tsx ---
const appFile = resolve(__dirname, '..', 'App.tsx');
const appRoutes = extractPathsFromFile(appFile, /path\s*[:=]\s*['"`][^'"`]+['"`]/g);

// --- Step 2: Extract routes from tools/index.tsx and all tool subfolders ---
const toolsDir = resolve(__dirname, '..', 'tools');
const toolIndexFiles = [resolve(toolsDir, 'index.tsx'), ...findIndexFiles(toolsDir)];
let allToolPaths = [];

for (const file of toolIndexFiles) {
  const paths = extractPathsFromFile(file, /path\s*[:=]\s*['"`][^'"`]+['"`]/g);
  allToolPaths = allToolPaths.concat(paths);
}

// --- Step 3: Trainer modes ---
const trainerModes = [
  'select', 'lights-out', 'grid-reflex', 'precision-point', 'sequence', 'color-match',
  'peripheral-vision', 'dodge-and-click', 'auditory-reaction', 'cognitive-shift',
  'target-tracking', 'digit-span', 'visual-search'
];
const trainerRoutes = trainerModes.map(m => `/trainer/${m}`);

// --- Step 4: Combine and normalize all routes ---
const allRoutes = new Set([
  ...appRoutes,
  ...allToolPaths.map(p => (p.startsWith('/tool') ? p : `/tool${p.startsWith('/') ? p : '/' + p}`)),
  ...trainerRoutes
]);

// --- Step 5: Convert to hash-based URLs (/#/...) ---
const formattedUrls = Array.from(allRoutes).map(route => {
  if (!route.startsWith('/')) route = '/' + route;
  return `/#${route}`;
});

// --- Step 6: Build XML ---
const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
const urlsetClose = '</urlset>\n';
const now = new Date().toISOString();

const urlsXml = formattedUrls
  .map(
    u => `  <url>\n    <loc>${hostname}${u}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
  )
  .join('');

const xml = header + urlsetOpen + urlsXml + urlsetClose;

// --- Step 7: Write sitemap file ---
const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');

