#!/usr/bin/env node

/**
 * Script to replace console.log statements with production logger
 * This ensures logs are properly filtered in production
 */

const fs = require('fs');
const path = require('path');

// Files to process (exclude debug page which needs console logs)
const filesToProcess = [
  'app/page.tsx',
  'app/documents/page.tsx',
  'app/employees/page.tsx',
  'app/admin/users/page.tsx',
  'app/admin/settings/page.tsx',
  'app/employees/page-enhanced.tsx',
  'app/delete-account/page.tsx',
  'app/documents/page-optimized.tsx',
  'app/notifications/page.tsx',
  'app/login/page.tsx',
];

// Replacement patterns
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'log.info(',
    description: 'Replace console.log with log.info'
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'log.error(',
    description: 'Replace console.error with log.error'
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'log.warn(',
    description: 'Replace console.warn with log.warn'
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'log.info(',
    description: 'Replace console.info with log.info'
  },
];

// Check if logger import exists
function hasLoggerImport(content) {
  return /import.*\{.*log.*\}.*from.*['"]@\/lib\/utils\/productionLogger['"]/.test(content);
}

// Add logger import if missing
function addLoggerImport(content) {
  // Check if there are already imports
  const importMatch = content.match(/^(import[^;]+;?\n)+/m);
  
  if (importMatch) {
    // Add after existing imports
    const lastImportIndex = importMatch[0].length;
    return content.slice(0, lastImportIndex) + 
           "import { log } from '@/lib/utils/productionLogger';\n" +
           content.slice(lastImportIndex);
  } else {
    // Add at the beginning
    return "import { log } from '@/lib/utils/productionLogger';\n" + content;
  }
}

// Process a single file
function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return { processed: false, changes: 0 };
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      changes += matches.length;
      console.log(`   ✓ ${description}: ${matches.length} replacements`);
    }
  });

  // Add logger import if needed and changes were made
  if (changes > 0 && !hasLoggerImport(content)) {
    content = addLoggerImport(content);
    console.log(`   ✓ Added production logger import`);
  }

  // Write back to file
  if (changes > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Processed: ${filePath} (${changes} changes)`);
    return { processed: true, changes };
  } else {
    console.log(`⏭️  Skipped: ${filePath} (no console statements found)`);
    return { processed: false, changes: 0 };
  }
}

// Main execution
function main() {
  console.log('🧹 Console Log Cleanup Script\n');
  console.log('This script will replace console.* calls with production logger');
  console.log('The production logger automatically filters logs in production\n');
  console.log('━'.repeat(60));
  console.log('');

  let totalFiles = 0;
  let totalChanges = 0;

  filesToProcess.forEach(file => {
    const result = processFile(file);
    if (result.processed) {
      totalFiles++;
      totalChanges += result.changes;
    }
    console.log('');
  });

  console.log('━'.repeat(60));
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Total replacements: ${totalChanges}`);
  console.log('');

  if (totalChanges > 0) {
    console.log('✅ Cleanup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Review the changes: git diff');
    console.log('   2. Test the app: npm run build');
    console.log('   3. Commit: git add . && git commit -m "chore: replace console logs with production logger"');
  } else {
    console.log('ℹ️  No changes needed - all files are already clean!');
  }
}

// Run the script
main();
