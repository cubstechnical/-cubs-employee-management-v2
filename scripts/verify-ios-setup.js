const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying iOS Setup for CUBS Visa Management...\n');

const checks = [
  {
    name: 'iOS Platform Directory',
    path: 'ios',
    type: 'directory'
  },
  {
    name: 'iOS App Directory',
    path: 'ios/App',
    type: 'directory'
  },
  {
    name: 'Xcode Project',
    path: 'ios/App/App.xcodeproj',
    type: 'directory'
  },
  {
    name: 'Podfile',
    path: 'ios/App/Podfile',
    type: 'file'
  },
  {
    name: 'AppDelegate.swift',
    path: 'ios/App/App/AppDelegate.swift',
    type: 'file'
  },
  {
    name: 'ViewController.swift',
    path: 'ios/App/App/ViewController.swift',
    type: 'file'
  },
  {
    name: 'Info.plist',
    path: 'ios/App/App/Info.plist',
    type: 'file'
  },
  {
    name: 'Assets.xcassets',
    path: 'ios/App/App/Assets.xcassets',
    type: 'directory'
  },
  {
    name: 'AppIcon.appiconset',
    path: 'ios/App/App/Assets.xcassets/AppIcon.appiconset',
    type: 'directory'
  },
  {
    name: 'LaunchScreen.storyboard',
    path: 'ios/App/App/Base.lproj/LaunchScreen.storyboard',
    type: 'file'
  },
  {
    name: 'AppTests',
    path: 'ios/App/AppTests',
    type: 'directory'
  },
  {
    name: 'AppUITests',
    path: 'ios/App/AppUITests',
    type: 'directory'
  }
];

let allPassed = true;

checks.forEach(check => {
  const fullPath = path.join(__dirname, '..', check.path);
  const exists = check.type === 'directory' ? 
    fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() :
    fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
  
  if (exists) {
    console.log(`✅ ${check.name}: Found`);
  } else {
    console.log(`❌ ${check.name}: Missing`);
    allPassed = false;
  }
});

// Check for app icons
const iconDir = path.join(__dirname, '..', 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
if (fs.existsSync(iconDir)) {
  const iconFiles = fs.readdirSync(iconDir).filter(file => file.endsWith('.png'));
  console.log(`✅ App Icons: ${iconFiles.length} files found`);
  
  if (iconFiles.length < 15) {
    console.log(`⚠️  Warning: Expected 15+ icon files, found ${iconFiles.length}`);
    allPassed = false;
  }
} else {
  console.log('❌ App Icons: Directory not found');
  allPassed = false;
}

// Check Capacitor config
const capacitorConfig = path.join(__dirname, '..', 'capacitor.config.ts');
if (fs.existsSync(capacitorConfig)) {
  const config = fs.readFileSync(capacitorConfig, 'utf8');
  if (config.includes('cubsgroups.com')) {
    console.log('✅ Capacitor Config: Production URL configured');
  } else {
    console.log('❌ Capacitor Config: Production URL not found');
    allPassed = false;
  }
} else {
  console.log('❌ Capacitor Config: File not found');
  allPassed = false;
}

console.log('\n📊 Summary:');
if (allPassed) {
  console.log('🎉 iOS setup is complete and ready for building!');
  console.log('\n📋 Next Steps:');
  console.log('1. On macOS: chmod +x BUILD_iOS_PRODUCTION.sh');
  console.log('2. On macOS: ./BUILD_iOS_PRODUCTION.sh');
  console.log('3. Open in Xcode: npx cap open ios');
  console.log('4. Build and run in Xcode');
} else {
  console.log('⚠️  iOS setup has issues that need to be resolved.');
  console.log('\n🔧 To fix:');
  console.log('1. Run: npx cap add ios');
  console.log('2. Run: node scripts/generate-ios-icons.js');
  console.log('3. Run: npx cap sync ios');
}

console.log('\n📚 For detailed instructions, see: IOS_BUILD_GUIDE.md');






