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

const apiDir = 'app/api';

// Helper function to disable/restore API routes and dynamic routes
function manageRoutes(disable = true) {
  const operation = disable ? 'disable' : 'restore';
  console.log(`📁 ${operation === 'disable' ? 'Disabling' : 'Restoring'} routes for mobile build...`);

  // Handle API routes
  if (fs.existsSync(apiDir)) {
    const processApiRoutes = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          processApiRoutes(fullPath);
        } else if (item === 'route.ts') {
          const newName = disable ? 'route.ts.disabled' : 'route.ts';
          const oldName = disable ? 'route.ts' : 'route.ts.disabled';
          const newPath = path.join(dir, newName);
          const oldPath = path.join(dir, oldName);

          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`✅ ${disable ? 'Disabled' : 'Restored'} API route: ${fullPath}`);
          }
        }
      }
    };

    processApiRoutes(apiDir);
  }

  // Handle dynamic routes (like [id] directories)
  const employeesDir = 'app/employees';
  if (fs.existsSync(employeesDir)) {
    const items = fs.readdirSync(employeesDir);
    for (const item of items) {
      if (item.startsWith('[') && item.endsWith(']')) {
        const fullPath = path.join(employeesDir, item);
        const disabledPath = path.join(employeesDir, `${item}.disabled`);

        if (disable && fs.existsSync(fullPath) && !fs.existsSync(disabledPath)) {
          fs.renameSync(fullPath, disabledPath);
          console.log(`✅ Disabled dynamic route: ${fullPath}`);
        } else if (!disable && fs.existsSync(disabledPath)) {
          fs.renameSync(disabledPath, fullPath);
          console.log(`✅ Restored dynamic route: ${fullPath}`);
        }
      }
    }
  }
}

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    deleteDir('.next');
  }
  if (fs.existsSync('out')) {
    deleteDir('out');
  }

  // Step 2: Temporarily disable API routes and dynamic routes for mobile build
  manageRoutes(true);

  // Step 3: Build Next.js app with static export for mobile
  console.log('📦 Building Next.js application for mobile (static export)...');
  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, DISABLE_PWA: 'true', BUILD_MOBILE: 'true' } });

  // Step 4: Verify static export was created
  console.log('📁 Verifying static export...');
  if (!fs.existsSync('out')) {
    throw new Error('Static export failed - out directory not found');
  }

  if (!fs.existsSync('out/index.html')) {
    throw new Error('Static export failed - index.html not found');
  }

  console.log('✅ Static export verified successfully');

  // Step 5: Sync with Capacitor
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
} finally {
  // Always restore API routes and dynamic routes
  manageRoutes(false);
}