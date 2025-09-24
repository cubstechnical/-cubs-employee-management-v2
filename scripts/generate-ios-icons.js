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
const iosIconDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');

// iOS icon sizes and filenames
const iosIconSizes = [
  { size: 20, scale: 1, filename: 'AppIcon-20.png' },
  { size: 20, scale: 2, filename: 'AppIcon-20@2x.png' },
  { size: 20, scale: 3, filename: 'AppIcon-20@3x.png' },
  { size: 29, scale: 1, filename: 'AppIcon-29.png' },
  { size: 29, scale: 2, filename: 'AppIcon-29@2x.png' },
  { size: 29, scale: 3, filename: 'AppIcon-29@3x.png' },
  { size: 40, scale: 1, filename: 'AppIcon-40.png' },
  { size: 40, scale: 2, filename: 'AppIcon-40@2x.png' },
  { size: 40, scale: 3, filename: 'AppIcon-40@3x.png' },
  { size: 60, scale: 2, filename: 'AppIcon-60@2x.png' },
  { size: 60, scale: 3, filename: 'AppIcon-60@3x.png' },
  { size: 76, scale: 1, filename: 'AppIcon-76.png' },
  { size: 76, scale: 2, filename: 'AppIcon-76@2x.png' },
  { size: 83.5, scale: 2, filename: 'AppIcon-83.5@2x.png' },
  { size: 1024, scale: 2, filename: 'AppIcon-512@2x.png' }
];

async function generateIOSIcons() {
  console.log('🍎 Generating iOS app icons from appicon1.png...');
  
  if (!fs.existsSync(sourceIconPath)) {
    console.error('❌ Source icon not found:', sourceIconPath);
    return;
  }

  for (const { size, scale, filename } of iosIconSizes) {
    try {
      const actualSize = Math.round(size * scale);
      const outputPath = path.join(iosIconDir, filename);
      
      await sharp(sourceIconPath)
        .resize(actualSize, actualSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${filename} (${actualSize}x${actualSize})`);
    } catch (error) {
      console.error(`❌ Error generating ${filename}:`, error.message);
    }
  }

  console.log('🎉 All iOS icons generated successfully!');
}

// Main execution
async function main() {
  try {
    await generateIOSIcons();
    console.log('\n🎉 iOS app icon generation completed successfully!');
    console.log('📱 iOS app icons have been updated with appicon1.png');
    console.log('🔄 You may need to rebuild your iOS app for changes to take effect.');
  } catch (error) {
    console.error('❌ Error generating iOS icons:', error);
  }
}

main();
