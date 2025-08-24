#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building app for Capacitor...');

// Step 1: Build Next.js normally
console.log('📦 Building Next.js app...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Next.js build failed');
  process.exit(1);
}

// Step 2: Create a standalone export
console.log('📁 Creating Capacitor-compatible files...');

const nextDir = path.join(process.cwd(), '.next');
const outDir = path.join(process.cwd(), 'capacitor-build');

// Create output directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Copy static files from .next/static
const staticSrc = path.join(nextDir, 'static');
const staticDest = path.join(outDir, '_next', 'static');
if (fs.existsSync(staticSrc)) {
  fs.mkdirSync(path.dirname(staticDest), { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true });
}

// Create a basic index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CUBS Visa Management</title>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .loading { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            flex-direction: column; 
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <p>Loading CUBS Admin...</p>
    </div>
    <script>
        // For mobile app, redirect to the appropriate starting page
        window.location.href = '/login';
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

// Copy public assets
const publicSrc = path.join(process.cwd(), 'public');
const publicDest = outDir;
if (fs.existsSync(publicSrc)) {
  const items = fs.readdirSync(publicSrc);
  items.forEach(item => {
    const srcPath = path.join(publicSrc, item);
    const destPath = path.join(publicDest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

console.log('✅ Capacitor build files created in ./capacitor-build');
console.log('🔧 Run "npx cap sync" to update mobile projects');
