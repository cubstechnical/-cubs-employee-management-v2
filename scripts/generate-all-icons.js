const { execSync } = require('child_process');
const path = require('path');

console.log('🎨 Generating App Icons for Both Platforms...\n');

// Check if source icon exists
const sourceIcon = path.join(__dirname, '../assets/appicon.png');
const fs = require('fs');

if (!fs.existsSync(sourceIcon)) {
  console.error('❌ Source icon not found:', sourceIcon);
  console.error('Please ensure assets/appicon.png exists');
  process.exit(1);
}

console.log('✅ Source icon found:', sourceIcon);
console.log('📏 Icon size:', fs.statSync(sourceIcon).size, 'bytes\n');

try {
  // Generate Android icons
  console.log('🤖 Generating Android icons...');
  execSync('node scripts/generate-android-icons.js', { stdio: 'inherit' });
  console.log('✅ Android icons generated successfully!\n');
  
  // Generate iOS icons
  console.log('🍎 Generating iOS icons...');
  execSync('node scripts/generate-ios-icons.js', { stdio: 'inherit' });
  console.log('✅ iOS icons generated successfully!\n');
  
  console.log('🎉 All app icons generated successfully!');
  console.log('\n📱 Next Steps:');
  console.log('1. For Android: Run BUILD_FINAL_WORKING.bat to rebuild with new icons');
  console.log('2. For iOS: Run BUILD_iOS_PRODUCTION.sh (on macOS) to rebuild with new icons');
  console.log('\n✅ Both platforms now use your custom appicon.png!');
  
} catch (error) {
  console.error('❌ Error generating icons:', error.message);
  process.exit(1);
}





