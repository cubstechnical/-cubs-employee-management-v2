const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment readiness...');

try {
  // Check if out directory exists
  if (!fs.existsSync('out')) {
    console.error('❌ out directory not found!');
    console.log('💡 Run: npm run build:mobile');
    process.exit(1);
  }

  // Check if index.html exists
  const indexPath = path.join('out', 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in out directory!');
    console.log('💡 Run: npm run build:mobile');
    process.exit(1);
  }

  // Check if _next directory exists
  const nextPath = path.join('out', '_next');
  if (!fs.existsSync(nextPath)) {
    console.error('❌ _next directory not found in out!');
    console.log('💡 Run: npm run build:mobile');
    process.exit(1);
  }

  // Check if Capacitor config exists
  if (fs.existsSync('capacitor.config.ts')) {
    console.log('✅ Capacitor config found');
  }

  // Check if iOS and Android directories exist
  const iosExists = fs.existsSync('ios');
  const androidExists = fs.existsSync('android');

  console.log('📱 Platform status:');
  console.log(`   iOS: ${iosExists ? '✅' : '❌'} Available`);
  console.log(`   Android: ${androidExists ? '✅' : '❌'} Available`);

  console.log('📊 Build artifacts:');
  const outStats = fs.statSync('out');
  console.log(`   out directory: ${outStats.isDirectory() ? '✅' : '❌'} Valid`);

  const indexStats = fs.statSync(indexPath);
  console.log(`   index.html: ${(indexStats.size / 1024).toFixed(1)} KB`);

  const nextStats = fs.statSync(nextPath);
  console.log(`   _next directory: ${nextStats.isDirectory() ? '✅' : '❌'} Valid`);

  // List key files
  console.log('📋 Key files in out directory:');
  const outFiles = fs.readdirSync('out');
  outFiles.slice(0, 10).forEach(file => {
    const filePath = path.join('out', file);
    const stats = fs.statSync(filePath);
    const size = stats.isDirectory() ? '[DIR]' : `${(stats.size / 1024).toFixed(1)} KB`;
    console.log(`   ${file} - ${size}`);
  });

  console.log('✅ Deployment verification completed successfully!');
  console.log('🚀 Ready for CodeMagic iOS deployment');

} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}
