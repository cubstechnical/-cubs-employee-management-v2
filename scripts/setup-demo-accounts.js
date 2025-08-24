const { createClient } = require('@supabase/supabase-js');

// Demo account credentials for app store reviewers
const DEMO_ACCOUNTS = [
  {
    email: 'demo.admin@cubstechnical.com',
    password: 'DemoAdmin123!',
    role: 'admin',
    profile: {
      full_name: 'Demo Admin',
      role: 'Administrator',
      company: 'CUBS Technical'
    }
  },
  {
    email: 'demo.employee@cubstechnical.com',
    password: 'DemoEmployee123!',
    role: 'employee',
    profile: {
      full_name: 'Demo Employee',
      role: 'Electrician',
      company: 'CUBS Technical'
    }
  }
];

async function setupDemoAccounts() {
  console.log('🎭 Setting up demo accounts for app store reviewers...\n');

  // Note: You'll need to replace these with your actual Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please set:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  for (const account of DEMO_ACCOUNTS) {
    try {
      console.log(`📧 Creating account: ${account.email}`);

      // Create the user account
      const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Skip email confirmation for demo accounts
        user_metadata: {
          full_name: account.profile.full_name,
          role: account.role,
          company: account.profile.company
        }
      });

      if (createError) {
        if (createError.message.includes('already registered')) {
          console.log(`✅ Account already exists: ${account.email}`);
          continue;
        }
        throw createError;
      }

      console.log(`✅ Created account: ${account.email} (${user.user.id})`);

      // Add some sample data for the admin account
      if (account.role === 'admin') {
        await addSampleData(supabase, user.user.id);
      }

    } catch (error) {
      console.error(`❌ Failed to create account ${account.email}:`, error.message);
    }
  }

  console.log('\n🎉 Demo accounts setup complete!');
  console.log('\n📋 Demo Credentials for App Store Reviewers:');
  console.log('==========================================');
  console.log('\n🔑 ADMIN ACCOUNT:');
  console.log('   Email: demo.admin@cubstechnical.com');
  console.log('   Password: DemoAdmin123!');
  console.log('   Role: Full administrative access');
  console.log('\n🔑 EMPLOYEE ACCOUNT:');
  console.log('   Email: demo.employee@cubstechnical.com');
  console.log('   Password: DemoEmployee123!');
  console.log('   Role: Limited employee access');
  console.log('\n⚠️  IMPORTANT: These accounts should only be used for app store review');
  console.log('   They contain sample data and should be disabled after review approval');
}

async function addSampleData(supabase, userId) {
  try {
    // Add sample employees
    const sampleEmployees = [
      {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@sample.com',
        phone: '+971-50-123-4567',
        trade: 'Electrician',
        nationality: 'Indian',
        company: 'ABC Construction LLC',
        created_by: userId
      },
      {
        name: 'Mohammed Ali',
        email: 'mohammed.ali@sample.com',
        phone: '+971-50-234-5678',
        trade: 'Plumber',
        nationality: 'Pakistani',
        company: 'XYZ Engineering',
        created_by: userId
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@sample.com',
        phone: '+971-50-345-6789',
        trade: 'Carpenter',
        nationality: 'Indian',
        company: 'DEF Builders',
        created_by: userId
      }
    ];

    const { error: employeesError } = await supabase
      .from('employees')
      .insert(sampleEmployees);

    if (employeesError) {
      console.warn('⚠️  Could not add sample employees:', employeesError.message);
    } else {
      console.log('✅ Added sample employees');
    }

    // Add sample documents
    const sampleDocuments = [
      {
        employee_id: 1, // Will be updated with actual IDs
        document_type: 'passport',
        file_name: 'passport_sample.pdf',
        file_url: '/demo/passport.pdf',
        file_size: 245760,
        file_type: 'application/pdf',
        uploaded_by: userId,
        is_active: true,
        notes: 'Sample passport document'
      },
      {
        employee_id: 2,
        document_type: 'visa',
        file_name: 'visa_sample.pdf',
        file_url: '/demo/visa.pdf',
        file_size: 184320,
        file_type: 'application/pdf',
        uploaded_by: userId,
        is_active: true,
        notes: 'Sample visa document'
      }
    ];

    const { error: documentsError } = await supabase
      .from('documents')
      .insert(sampleDocuments);

    if (documentsError) {
      console.warn('⚠️  Could not add sample documents:', documentsError.message);
    } else {
      console.log('✅ Added sample documents');
    }

  } catch (error) {
    console.warn('⚠️  Could not add sample data:', error.message);
  }
}

// Run the setup
setupDemoAccounts().catch(console.error);
