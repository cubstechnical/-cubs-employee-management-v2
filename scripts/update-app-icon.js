const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp is available, if not install it
try {
  require('sharp');
} catch (error) {
  console.log('Installing sharp for image processing...');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
}

const sharp = require('sharp');

const sourceIconPath = path.join(__dirname, '../public/assets/appicon1.png');
const outputDir = path.join(__dirname, '../public/assets/generated-icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Android icon sizes
const androidSizes = [
  { size: 36, name: 'android-icon-36-36x36.png' },
  { size: 48, name: 'android-icon-48-48x48.png' },
  { size: 72, name: 'android-icon-72-72x72.png' },
  { size: 96, name: 'android-icon-96-96x96.png' },
  { size: 144, name: 'android-icon-144-144x144.png' },
  { size: 192, name: 'android-icon-192-192x192.png' }
];

// iOS icon sizes
const iosSizes = [
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 1024, name: 'apple-icon-1024-1024x1024.png' }
];

// Other sizes
const otherSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 64, name: 'icon-64-64x64.png' },
  { size: 128, name: 'icon-128-128x128.png' },
  { size: 256, name: 'icon-256-256x256.png' },
  { size: 512, name: 'icon-512-512x512.png' }
];

async function generateIcons() {
  console.log('🎨 Generating app icons from appicon1.png...');
  
  if (!fs.existsSync(sourceIconPath)) {
    console.error('❌ Source icon not found:', sourceIconPath);
    return;
  }

  const allSizes = [...androidSizes, ...iosSizes, ...otherSizes];
  
  for (const { size, name } of allSizes) {
    try {
      await sharp(sourceIconPath)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(outputDir, name));
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }

  console.log('🎉 All icons generated successfully!');
}

// Copy the main icon to the root assets directory
async function copyMainIcon() {
  try {
    await sharp(sourceIconPath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(__dirname, '../public/assets/appicon.png'));
    
    console.log('✅ Updated main appicon.png');
  } catch (error) {
    console.error('❌ Error updating main appicon.png:', error.message);
  }
}

// Update Android icons
async function updateAndroidIcons() {
  console.log('🤖 Updating Android icons...');
  
  const androidIconSizes = [
    { size: 48, density: 'mdpi' },
    { size: 72, density: 'hdpi' },
    { size: 96, density: 'xhdpi' },
    { size: 144, density: 'xxhdpi' },
    { size: 192, density: 'xxxhdpi' }
  ];

  for (const { size, density } of androidIconSizes) {
    try {
      const outputPath = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}/ic_launcher.png`);
      const outputPathRound = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`);
      const outputPathForeground = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`);
      
      await sharp(sourceIconPath)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(outputPath);
      
      // Copy to round and foreground versions
      fs.copyFileSync(outputPath, outputPathRound);
      fs.copyFileSync(outputPath, outputPathForeground);
      
      console.log(`✅ Updated Android ${density} icons (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error updating Android ${density} icons:`, error.message);
    }
  }
}

// Update iOS icons
async function updateIOSIcons() {
  console.log('🍎 Updating iOS icons...');
  
  try {
    const iosIconPath = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
    
    await sharp(sourceIconPath)
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(iosIconPath);
    
    console.log('✅ Updated iOS AppIcon-512@2x.png');
  } catch (error) {
    console.error('❌ Error updating iOS icons:', error.message);
  }
}

// Main execution
async function main() {
  try {
    await generateIcons();
    await copyMainIcon();
    await updateAndroidIcons();
    await updateIOSIcons();
    
    console.log('\n🎉 App icon update completed successfully!');
    console.log('📱 Both Android and iOS icons have been updated with appicon1.png');
    console.log('🔄 You may need to rebuild your app for changes to take effect.');
  } catch (error) {
    console.error('❌ Error updating app icons:', error);
  }
}

main();
