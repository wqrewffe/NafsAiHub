// optimize-imports.js
// Run this to identify and fix unused imports

const fs = require('fs');
const path = require('path');

const COMPONENT_DIR = path.join(__dirname, '../components');
const PAGES_DIR = path.join(__dirname, '../pages');

// Files to analyze
const filesToCheck = [
  path.join(COMPONENT_DIR, 'HomePage.tsx'),
  path.join(PAGES_DIR, 'HomePage.tsx'),
];

function analyzeImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract all imports
    const importRegex = /import\s+(?:{[^}]+}|.*?)\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    console.log(`\n📊 Imports in ${path.basename(filePath)}:`);
    console.log('==========================================');
    
    // Check for duplicates
    const duplicates = imports.filter((item, index) => imports.indexOf(item) !== index);
    if (duplicates.length > 0) {
      console.log(`⚠️  Duplicate imports found: ${[...new Set(duplicates)].join(', ')}`);
    }
    
    // List all imports
    const uniqueImports = [...new Set(imports)];
    uniqueImports.forEach(imp => {
      console.log(`  • ${imp}`);
    });
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('  1. Check if all @heroicons/react icons are used');
    console.log('  2. Check if lottie-react and @lottiefiles are both needed');
    console.log('  3. Consider lazy loading heavy libraries');
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
  }
}

console.log('🔍 Analyzing imports for optimization...\n');
filesToCheck.forEach(analyzeImports);

console.log('\n✅ Analysis complete!');
console.log('📝 Next steps:');
console.log('  1. Remove unused imports');
console.log('  2. Combine similar imports');
console.log('  3. Lazy load heavy libraries');
console.log('  4. Run: npm run build && npm run preview');
console.log('  5. Check Lighthouse score improvement');
