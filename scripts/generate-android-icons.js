const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Android icon sizes required
const androidIconSizes = [
  { name: 'ic_launcher.png', size: 72, density: 'mipmap-hdpi' },
  { name: 'ic_launcher.png', size: 48, density: 'mipmap-mdpi' },
  { name: 'ic_launcher.png', size: 96, density: 'mipmap-xhdpi' },
  { name: 'ic_launcher.png', size: 144, density: 'mipmap-xxhdpi' },
  { name: 'ic_launcher.png', size: 192, density: 'mipmap-xxxhdpi' },
  { name: 'ic_launcher_round.png', size: 72, density: 'mipmap-hdpi' },
  { name: 'ic_launcher_round.png', size: 48, density: 'mipmap-mdpi' },
  { name: 'ic_launcher_round.png', size: 96, density: 'mipmap-xhdpi' },
  { name: 'ic_launcher_round.png', size: 144, density: 'mipmap-xxhdpi' },
  { name: 'ic_launcher_round.png', size: 192, density: 'mipmap-xxxhdpi' },
  { name: 'ic_launcher_foreground.png', size: 108, density: 'mipmap-hdpi' },
  { name: 'ic_launcher_foreground.png', size: 72, density: 'mipmap-mdpi' },
  { name: 'ic_launcher_foreground.png', size: 144, density: 'mipmap-xhdpi' },
  { name: 'ic_launcher_foreground.png', size: 216, density: 'mipmap-xxhdpi' },
  { name: 'ic_launcher_foreground.png', size: 288, density: 'mipmap-xxxhdpi' }
];

async function generateAndroidIcons() {
  const sourceIcon = path.join(__dirname, '../assets/appicon.png');
  const androidResDir = path.join(__dirname, '../android/app/src/main/res');
  
  console.log('🎨 Generating Android app icons...');
  console.log(`Source: ${sourceIcon}`);
  console.log(`Output: ${androidResDir}`);
  
  // Ensure source icon exists
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ Source icon not found:', sourceIcon);
    return;
  }
  
  for (const icon of androidIconSizes) {
    const outputDir = path.join(androidResDir, icon.density);
    const outputPath = path.join(outputDir, icon.name);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      await sharp(sourceIcon)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${icon.density}/${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.density}/${icon.name}:`, error.message);
    }
  }
  
  // Also generate adaptive icon files
  await generateAdaptiveIcons(sourceIcon, androidResDir);
  
  console.log('🎉 Android icon generation complete!');
  console.log('📱 Icons are ready for Android build');
}

async function generateAdaptiveIcons(sourceIcon, androidResDir) {
  const adaptiveIconDir = path.join(androidResDir, 'mipmap-anydpi-v26');
  
  if (!fs.existsSync(adaptiveIconDir)) {
    fs.mkdirSync(adaptiveIconDir, { recursive: true });
  }
  
  // Generate ic_launcher.xml
  const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  
  fs.writeFileSync(path.join(adaptiveIconDir, 'ic_launcher.xml'), icLauncherXml);
  
  // Generate ic_launcher_round.xml
  const icLauncherRoundXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  
  fs.writeFileSync(path.join(adaptiveIconDir, 'ic_launcher_round.xml'), icLauncherRoundXml);
  
  // Generate background color
  const valuesDir = path.join(androidResDir, 'values');
  if (!fs.existsSync(valuesDir)) {
    fs.mkdirSync(valuesDir, { recursive: true });
  }
  
  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>`;
  
  fs.writeFileSync(path.join(valuesDir, 'colors.xml'), colorsXml);
  
  console.log('✅ Generated adaptive icon configuration');
}

generateAndroidIcons().catch(console.error);
