#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Analyzing and removing unused dependencies...');

// Read package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Dependencies that are likely unused based on analysis
const potentiallyUnusedDeps = [
  'archiver',
  'aws-sdk', 
  'backblaze-b2',
  'csv-parse',
  'exceljs',
  'firebase-admin',
  'jszip',
  'nodemailer',
  'string-similarity'
];

// Check which dependencies are actually unused
function checkDependencyUsage(depName) {
  const searchPatterns = [
    `import ${depName}`,
    `import {`,
    `from '${depName}'`,
    `require('${depName}')`,
    `require("${depName}")`,
    `import * as ${depName}`,
    `import ${depName} from`
  ];

  // Search in common directories
  const searchDirs = [
    'app',
    'components', 
    'lib',
    'hooks',
    'utils',
    'scripts'
  ];

  let isUsed = false;

  function searchInDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        searchInDirectory(fullPath);
      } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          for (const pattern of searchPatterns) {
            if (content.includes(pattern)) {
              isUsed = true;
              return;
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  searchDirs.forEach(dir => searchInDirectory(dir));
  return isUsed;
}

console.log('🔍 Checking dependency usage...');

const unusedDeps = [];
const usedDeps = [];

potentiallyUnusedDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    const isUsed = checkDependencyUsage(dep);
    
    if (isUsed) {
      usedDeps.push(dep);
      console.log(`✅ ${dep} - Used in codebase`);
    } else {
      unusedDeps.push(dep);
      console.log(`❌ ${dep} - Not used, can be removed`);
    }
  }
});

console.log(`\n📊 Analysis Results:`);
console.log(`   Used dependencies: ${usedDeps.length}`);
console.log(`   Unused dependencies: ${unusedDeps.length}`);

if (unusedDeps.length > 0) {
  console.log(`\n🗑️  Unused dependencies to remove:`);
  unusedDeps.forEach(dep => console.log(`   - ${dep}`));
  
  // Create removal script
  const removalScript = `#!/bin/bash

echo "🗑️  Removing unused dependencies..."

# Remove unused dependencies
npm uninstall ${unusedDeps.join(' ')}

echo "✅ Unused dependencies removed!"
echo "📦 Run 'npm install' to update package-lock.json"
`;

  fs.writeFileSync('scripts/remove-unused-deps.sh', removalScript);
  console.log(`\n📝 Created removal script: scripts/remove-unused-deps.sh`);
} else {
  console.log(`\n✅ No unused dependencies found!`);
}

// Check for other optimization opportunities
console.log(`\n🔍 Additional optimization opportunities:`);

// Check for duplicate dependencies
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
const duplicateCheck = {};

Object.keys(allDeps).forEach(dep => {
  const baseName = dep.replace(/^@[^/]+\//, '');
  if (duplicateCheck[baseName]) {
    console.log(`⚠️  Potential duplicate: ${dep} and ${duplicateCheck[baseName]}`);
  } else {
    duplicateCheck[baseName] = dep;
  }
});

// Check for heavy dependencies that could be optimized
const heavyDeps = {
  'apexcharts': '~50KB',
  'react-apexcharts': '~10KB', 
  'framer-motion': '~30KB',
  'react-window': '~15KB',
  '@supabase/supabase-js': '~40KB',
  '@tanstack/react-query': '~35KB'
};

console.log(`\n📊 Heavy dependencies analysis:`);
Object.keys(heavyDeps).forEach(dep => {
  if (allDeps[dep]) {
    console.log(`   ${dep}: ${heavyDeps[dep]} (${allDeps[dep]})`);
  }
});

console.log(`\n💡 Optimization recommendations:`);
console.log(`   1. ✅ Console logs cleaned up`);
console.log(`   2. 🔄 Remove unused dependencies: ${unusedDeps.length} packages`);
console.log(`   3. 🔄 Consider lazy loading for heavy components`);
console.log(`   4. 🔄 Implement tree shaking for better bundle optimization`);

console.log(`\n🎉 Dependency analysis complete!`);
