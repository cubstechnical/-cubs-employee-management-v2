const fs = require('fs');
const path = require('path');

// Check if sharp is available, if not provide instructions
try {
  const sharp = require('sharp');
  
  async function resizeAppIcon() {
    const inputPath = path.join(__dirname, '../assets/appicon.png');
    const outputPath = path.join(__dirname, '../assets/appicon-512x512.png');
    
    try {
      // Resize the image to exactly 512x512 pixels
      await sharp(inputPath)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);
      
      console.log('✅ App icon resized to 512x512 pixels successfully!');
      console.log(`📁 Output file: ${outputPath}`);
      
      // Get file size
      const stats = fs.statSync(outputPath);
      const fileSizeInKB = Math.round(stats.size / 1024);
      console.log(`📏 File size: ${fileSizeInKB} KB`);
      
    } catch (error) {
      console.error('❌ Error resizing app icon:', error.message);
    }
  }
  
  resizeAppIcon();
  
} catch (error) {
  console.log('❌ Sharp library not found. Installing...');
  console.log('📦 Run: npm install sharp');
  console.log('🔄 Then run: node scripts/resize-app-icon.js');
}
