const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing YAML syntax error...');

// Read the original file
const codemagicPath = path.join(__dirname, '..', 'codemagic.yaml');
const content = fs.readFileSync(codemagicPath, 'utf8');

// Find the problematic build section (from line 29 to line 112)
const lines = content.split('\n');
const startLine = 29; // 0-indexed
const endLine = 112;  // 0-indexed

// Replace the problematic section
const before = lines.slice(0, startLine).join('\n');
const after = lines.slice(endLine + 1).join('\n');

const fixedContent = before + `        script: |
          echo "🏗️ Building Next.js production app for mobile deployment..."
          echo "🔧 Using existing build-mobile.js script..."
          node scripts/build-mobile.js
          echo "✅ Mobile build completed successfully"` + '\n' + after;

fs.writeFileSync(codemagicPath, fixedContent);

console.log('✅ YAML syntax error fixed!');
console.log('📱 Replaced inline HTML with proper script call');
console.log('🚀 Codemagic builds should now work!');
