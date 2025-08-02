const https = require('https');

async function checkSupabaseStatus() {
  const supabaseUrl = 'https://blbybcxkfcyxrwrlldtd.supabase.co';
  
  console.log('🔍 Checking Supabase project status...');
  console.log('URL:', supabaseUrl);
  console.log('');

  return new Promise((resolve) => {
    const req = https.get(supabaseUrl, (res) => {
      console.log('📡 Response Status:', res.statusCode);
      console.log('📡 Response Headers:', res.headers);
      
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('✅ Supabase project is accessible');
        resolve(true);
      } else if (res.statusCode === 503) {
        console.log('❌ Supabase project is unavailable (503)');
        console.log('💡 This usually means:');
        console.log('   - Project is suspended due to inactivity');
        console.log('   - Project has been deleted');
        console.log('   - Project is in maintenance mode');
        resolve(false);
      } else {
        console.log(`⚠️ Unexpected status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('❌ Connection error:', error.message);
      console.log('💡 This could mean:');
      console.log('   - Project URL is incorrect');
      console.log('   - Network connectivity issues');
      console.log('   - DNS resolution problems');
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log('⏰ Request timeout');
      req.destroy();
      resolve(false);
    });
  });
}

checkSupabaseStatus().then(isAccessible => {
  if (isAccessible) {
    console.log('\n🎉 Supabase project is active and accessible!');
    console.log('🔧 The issue might be with the API keys or authentication configuration.');
  } else {
    console.log('\n💥 Supabase project is not accessible.');
    console.log('🚨 You need to:');
    console.log('   1. Check your Supabase dashboard');
    console.log('   2. Verify the project is active');
    console.log('   3. Get the correct project URL and keys');
    console.log('   4. Create a new project if needed');
  }
  process.exit(isAccessible ? 0 : 1);
}); 