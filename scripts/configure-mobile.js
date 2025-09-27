const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const mode = args[0] || 'development';

console.log(`🔧 Configuring Capacitor for ${mode} mode...`);

const configPath = path.join(__dirname, '..', 'capacitor.config.ts');
let config = fs.readFileSync(configPath, 'utf8');

if (mode === 'development') {
  // Development: Use local dev server
  config = config.replace(
    /\/\/ url: 'http:\/\/localhost:3000'.*$/m,
    "url: 'http://localhost:3000', // Development: local server"
  );
  config = config.replace(
    /url: 'https:\/\/.*$/m,
    "// url: 'https://your-deployed-app.vercel.app', // Production URL"
  );
  config = config.replace(
    /cleartext: false/,
    'cleartext: true // Allow localhost for development'
  );
  console.log('✅ Configured for development (localhost:3000)');
  
} else if (mode === 'production') {
  const productionUrl = args[1];
  if (!productionUrl) {
    console.error('❌ Production URL required: npm run configure:mobile production https://your-app.com');
    process.exit(1);
  }
  
  // Production: Use deployed web app
  config = config.replace(
    /url: 'http:\/\/localhost:3000'.*$/m,
    "// url: 'http://localhost:3000', // Development mode"
  );
  config = config.replace(
    /\/\/ url: 'https:\/\/.*$/m,
    `url: '${productionUrl}', // Production: deployed app`
  );
  config = config.replace(
    /cleartext: true.*$/m,
    'cleartext: false // Production security'
  );
  console.log(`✅ Configured for production (${productionUrl})`);
}

fs.writeFileSync(configPath, config);

console.log('🚀 Run "npx cap sync" to apply changes');
console.log('📱 Then test in mobile app - should work exactly like web!');
