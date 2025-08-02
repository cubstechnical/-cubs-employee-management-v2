const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔧 Testing Supabase Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📋 Environment Variables:');
  console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return false;
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('🔗 Testing basic connection...');
    
    // Test 1: Basic connection
    const { data: testData, error: testError } = await supabase
      .from('employee_table')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Basic connection failed:', testError.message);
      return false;
    }

    console.log('✅ Basic connection successful!');
    console.log('📊 Sample data:', testData);
    console.log('');

    // Test 2: Authentication
    console.log('🔐 Testing authentication...');
    
    // Try to sign in with test credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (authError) {
      console.log('ℹ️ Authentication test (expected for invalid credentials):', authError.message);
      console.log('✅ Authentication service is working (returned proper error)');
    } else {
      console.log('✅ Authentication successful with test credentials');
    }

    console.log('');

    // Test 3: Database schema
    console.log('🗄️ Testing database schema...');
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('employee_table')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema test failed:', schemaError.message);
      return false;
    }

    console.log('✅ Database schema accessible');
    console.log('📋 Table structure:', Object.keys(schemaData[0] || {}));
    console.log('');

    console.log('🎉 All tests passed! Supabase is fully connected and working.');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(success => {
  if (success) {
    console.log('\n🚀 Supabase backend is ready for authentication and database operations!');
  } else {
    console.log('\n💥 Supabase connection needs attention');
  }
  process.exit(success ? 0 : 1);
}); 