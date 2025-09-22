#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * 
 * This script analyzes the Next.js bundle to identify optimization opportunities.
 * Run with: node scripts/analyze-bundle.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 Bundle Analysis Script');
console.log('========================');

async function analyzeBundle() {
  try {
    console.log('\n🔍 Building application with bundle analysis...');
    
    // Set environment variable to enable bundle analyzer
    process.env.ANALYZE = 'true';
    
    // Build the application
    execSync('npm run build', { 
      stdio: 'inherit',
      env: { ...process.env, ANALYZE: 'true' }
    });
    
    console.log('\n✅ Bundle analysis complete!');
    console.log('📁 Check the .next/analyze/ directory for detailed reports');
    
    // Check if analysis files exist
    const analyzeDir = path.join(process.cwd(), '.next', 'analyze');
    if (fs.existsSync(analyzeDir)) {
      const files = fs.readdirSync(analyzeDir);
      console.log('\n📋 Generated analysis files:');
      files.forEach(file => {
        console.log(`  • ${file}`);
      });
    }
    
    // Provide optimization recommendations
    console.log('\n🎯 Bundle Optimization Recommendations:');
    console.log('  • Use dynamic imports for heavy components (charts, document viewer)');
    console.log('  • Tree-shake unused Lucide icons (import specific icons)');
    console.log('  • Split Supabase client initialization');
    console.log('  • Implement route-based code splitting');
    console.log('  • Use next/dynamic for admin-only components');
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

// Run the analysis
analyzeBundle();
