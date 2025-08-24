const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  // Apple App Store
  'apple-touch-icon': [180, 152, 120, 76],
  'apple-icon-1024': [1024],

  // Android Icons
  'android-icon-192': [192],
  'android-icon-144': [144],
  'android-icon-96': [96],
  'android-icon-72': [72],
  'android-icon-48': [48],
  'android-icon-36': [36],

  // Favicon
  'favicon': [32, 16],

  // General
  'icon-512': [512],
  'icon-256': [256],
  'icon-128': [128],
  'icon-64': [64]
};

async function generateIcons() {
  const inputIcon = 'public/assets/appicon.png';

  if (!fs.existsSync(inputIcon)) {
    console.error(`❌ Input icon not found: ${inputIcon}`);
    console.log('📝 Please ensure you have an appicon.png in the public/assets/ directory');
    return;
  }

  const outputDir = 'public/assets/generated-icons';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 Generating app store icons...\n');

  for (const [category, sizeArray] of Object.entries(sizes)) {
    for (const size of sizeArray) {
      const outputPath = path.join(outputDir, `${category}-${size}x${size}.png`);

      try {
        await sharp(inputIcon)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(outputPath);

        console.log(`✅ Generated: ${category}-${size}x${size}.png`);
      } catch (error) {
        console.error(`❌ Failed to generate ${category}-${size}x${size}.png:`, error.message);
      }
    }
  }

  console.log('\n📁 Generated icons are in: public/assets/generated-icons/');
  console.log('\n📋 Icon Requirements Summary:');
  console.log('   Apple App Store: 1024x1024px (required)');
  console.log('   Android: 512x512px (recommended)');
  console.log('   Favicon: 32x32px (standard)');
}

generateIcons().catch(console.error);
