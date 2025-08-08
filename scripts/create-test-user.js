const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Create user using Supabase Auth API
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'test@cubstechnical.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('User ID:', user.user.id);
    console.log('Email:', user.user.email);
    
    // Try to create a profile record (optional)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.user.id,
          email: user.user.email,
          full_name: 'Test User',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.log('⚠️  Profile creation failed (this is optional):', profileError.message);
      } else {
        console.log('✅ Profile record created successfully!');
      }
    } catch (profileError) {
      console.log('⚠️  Profile table not found or error creating profile (this is optional)');
    }

    console.log('\n🎉 Test user setup complete!');
    console.log('Email: test@cubstechnical.com');
    console.log('Password: testpassword123');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser(); 
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Create user using Supabase Auth API
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'test@cubstechnical.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('User ID:', user.user.id);
    console.log('Email:', user.user.email);
    
    // Try to create a profile record (optional)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.user.id,
          email: user.user.email,
          full_name: 'Test User',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.log('⚠️  Profile creation failed (this is optional):', profileError.message);
      } else {
        console.log('✅ Profile record created successfully!');
      }
    } catch (profileError) {
      console.log('⚠️  Profile table not found or error creating profile (this is optional)');
    }

    console.log('\n🎉 Test user setup complete!');
    console.log('Email: test@cubstechnical.com');
    console.log('Password: testpassword123');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser(); 
 
 
 