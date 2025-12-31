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

// Helper function to load environment variables from file
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const envVars = {};
  const content = fs.readFileSync(filePath, 'utf8');

  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Parse KEY=VALUE format
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      envVars[key] = value;
    }
  });

  return envVars;
}

console.log('🚀 Starting mobile build process...');

try {
  // Step 1: Load environment variables
  console.log('🔧 Loading environment variables...');

  // Try .env.local first, then .env.production
  let envVars = {};
  const envFiles = ['.env.local', '.env.production', '.env'];

  for (const envFile of envFiles) {
    const filePath = path.join(process.cwd(), envFile);
    if (fs.existsSync(filePath)) {
      console.log(`📄 Loading environment from ${envFile}...`);
      envVars = { ...envVars, ...loadEnvFile(filePath) };
      break;
    }
  }

  // Validate required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missing = requiredVars.filter(varName => !envVars[varName] && !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables for mobile build:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('');
    console.error('Please create a .env.local or .env.production file with these variables.');
    console.error('See .env.mobile.example for a template.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
  console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '(from process.env)'}`);
  console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '(from process.env)'}`);

  // Step 2: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    deleteDir('.next');
  }
  if (fs.existsSync('out')) {
    deleteDir('out');
  }

  // Step 3: Build Next.js app with static export for mobile
  // Note: API routes are ignored via pageExtensions in next.config.js
  console.log('📦 Building Next.js application for mobile (static export)...');

  // Merge environment variables with process.env
  const buildEnv = {
    ...process.env,
    ...envVars,
    DISABLE_PWA: 'true',
    BUILD_MOBILE: 'true',
    NODE_ENV: 'production'
  };

  execSync('npm run build', { stdio: 'inherit', env: buildEnv });

  // Step 4: Verify static export was created
  console.log('📁 Verifying static export...');
  if (!fs.existsSync('out')) {
    throw new Error('Static export failed - out directory not found');
  }

  if (!fs.existsSync('out/index.html')) {
    throw new Error('Static export failed - index.html not found');
  }

  console.log('✅ Static export verified successfully');
  console.log('✅ Environment variables embedded in build');

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
  process.exit(1);
}