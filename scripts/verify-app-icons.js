const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying App Icons for Both Platforms...\n');

// Check source icon
const sourceIcon = path.join(__dirname, '../assets/appicon.png');
if (!fs.existsSync(sourceIcon)) {
  console.error('❌ Source icon not found:', sourceIcon);
  process.exit(1);
}

console.log('✅ Source icon found:', sourceIcon);
console.log('📏 Size:', fs.statSync(sourceIcon).size, 'bytes\n');

// Check Android icons
console.log('🤖 Checking Android icons...');
const androidIconDirs = [
  'mipmap-hdpi',
  'mipmap-mdpi', 
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi'
];

let androidIconsFound = 0;
androidIconDirs.forEach(dir => {
  const iconPath = path.join(__dirname, '../android/app/src/main/res', dir, 'ic_launcher.png');
  if (fs.existsSync(iconPath)) {
    androidIconsFound++;
    console.log(`✅ ${dir}/ic_launcher.png: Found`);
  } else {
    console.log(`❌ ${dir}/ic_launcher.png: Missing`);
  }
});

// Check iOS icons
console.log('\n🍎 Checking iOS icons...');
const iosIconDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
if (fs.existsSync(iosIconDir)) {
  const iosIcons = fs.readdirSync(iosIconDir).filter(file => file.endsWith('.png'));
  console.log(`✅ iOS icons found: ${iosIcons.length} files`);
  
  if (iosIcons.length >= 15) {
    console.log('✅ All required iOS icon sizes present');
  } else {
    console.log(`⚠️  Warning: Expected 15+ iOS icons, found ${iosIcons.length}`);
  }
} else {
  console.log('❌ iOS icon directory not found');
}

// Check adaptive icon configuration
console.log('\n🔧 Checking Android adaptive icon configuration...');
const adaptiveIconDir = path.join(__dirname, '../android/app/src/main/res/mipmap-anydpi-v26');
if (fs.existsSync(adaptiveIconDir)) {
  const adaptiveIcons = fs.readdirSync(adaptiveIconDir).filter(file => file.endsWith('.xml'));
  console.log(`✅ Adaptive icon configs: ${adaptiveIcons.length} files`);
} else {
  console.log('❌ Adaptive icon directory not found');
}

// Check colors.xml
const colorsPath = path.join(__dirname, '../android/app/src/main/res/values/colors.xml');
if (fs.existsSync(colorsPath)) {
  console.log('✅ Android colors.xml: Found');
} else {
  console.log('❌ Android colors.xml: Missing');
}

console.log('\n📊 Summary:');
if (androidIconsFound === androidIconDirs.length) {
  console.log('✅ Android: All icon sizes generated correctly');
} else {
  console.log(`⚠️  Android: ${androidIconsFound}/${androidIconDirs.length} icon directories have icons`);
}

console.log('\n📋 To regenerate all icons:');
console.log('node scripts/generate-all-icons.js');
console.log('\n📋 To rebuild apps with new icons:');
console.log('• Android: BUILD_FINAL_WORKING.bat');
console.log('• iOS: BUILD_iOS_PRODUCTION.sh (on macOS)');
