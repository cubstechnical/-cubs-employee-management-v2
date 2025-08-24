#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing Capacitor build...');

// Create a simple index.html for Capacitor
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CUBS Visa Management</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            flex-direction: column;
            background: #111827;
            color: white;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #374151;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
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
        // Redirect to the main app
        window.location.href = '/login';
    </script>
</body>
</html>`;

const nextDir = path.join(process.cwd(), '.next');
const capacitorDir = path.join(process.cwd(), 'capacitor-mobile');

// Create capacitor-mobile directory
if (fs.existsSync(capacitorDir)) {
    fs.rmSync(capacitorDir, { recursive: true, force: true });
}
fs.mkdirSync(capacitorDir, { recursive: true });

// Create index.html
fs.writeFileSync(path.join(capacitorDir, 'index.html'), indexHtml);

// Copy static assets from .next
if (fs.existsSync(nextDir)) {
    const staticSrc = path.join(nextDir, 'static');
    if (fs.existsSync(staticSrc)) {
        const staticDest = path.join(capacitorDir, '_next', 'static');
        fs.mkdirSync(path.dirname(staticDest), { recursive: true });
        fs.cpSync(staticSrc, staticDest, { recursive: true });
    }
}

// Copy public assets
const publicSrc = path.join(process.cwd(), 'public');
if (fs.existsSync(publicSrc)) {
    const publicDest = capacitorDir;
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

console.log('✅ Capacitor build prepared in ./capacitor-mobile');
console.log('📱 Update capacitor.config.ts to use webDir: "capacitor-mobile"');

// Update capacitor.config.ts temporarily
const configPath = path.join(process.cwd(), 'capacitor.config.ts');
if (fs.existsSync(configPath)) {
    let config = fs.readFileSync(configPath, 'utf8');
    config = config.replace(/webDir: '[^']*'/, "webDir: 'capacitor-mobile'");
    fs.writeFileSync(configPath, config);
    console.log('📝 Updated capacitor.config.ts to use capacitor-mobile directory');
}
