const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to delete directories recursively
function deleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  try {
    if (fs.rmSync) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } else {
      execSync(`npx rimraf "${dirPath}"`, { stdio: 'pipe' });
    }
  } catch (error) {
    console.warn(`Could not delete ${dirPath}:`, error.message);
  }
}

console.log('🚀 Starting mobile build process...');

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    deleteDir('.next');
  }
  if (fs.existsSync('out')) {
    deleteDir('out');
  }

  // Step 2: Build Next.js app with static export for mobile
  // Note: API routes are ignored via pageExtensions in next.config.js
  console.log('📦 Building Next.js application for mobile (static export)...');
  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, DISABLE_PWA: 'true', BUILD_MOBILE: 'true' } });

  // Step 3: Verify static export was created
  console.log('📁 Verifying static export...');
  if (!fs.existsSync('out')) {
    throw new Error('Static export failed - out directory not found');
  }

  if (!fs.existsSync('out/index.html')) {
    throw new Error('Static export failed - index.html not found');
  }

  console.log('✅ Static export verified successfully');

  // Step 4: Sync with Capacitor
  console.log('📱 Syncing with Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });

  console.log('✅ Mobile build completed successfully!');
  console.log('📱 You can now run:');
  console.log('   npm run cap:ios     - Open iOS project');
  console.log('   npm run cap:android - Open Android project');
  console.log('');
  console.log('✅ Mobile app is now fully functional with static files!');

} catch (error) {
  console.error('❌ Mobile build failed:', error.message);
  process.exit(1);
}