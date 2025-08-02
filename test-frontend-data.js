const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testFrontendData() {
  console.log('🔍 Testing Frontend Data Fetching...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test 1: Check if we can fetch employees like the frontend does
    console.log('👥 Testing Employee Fetch (like frontend):');
    
    // Simulate the frontend query
    let query = supabase
      .from('employee_table')
      .select('*');

    // Apply pagination like frontend
    const page = 1;
    const pageSize = 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: employees, error } = await query;

    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Successfully fetched ${employees.length} employees`);
      console.log('  📋 Sample employees:');
      employees.slice(0, 3).forEach((emp, index) => {
        console.log(`    ${index + 1}. ${emp.name} (${emp.employee_id}) - ${emp.company_name}`);
      });
    }

    // Test 2: Check document folders like the frontend does
    console.log('\n📁 Testing Document Folders (like frontend):');
    
    const { data: companyDocs, error: docError } = await supabase
      .from('employee_documents')
      .select('file_path')
      .not('file_path', 'is', null);

    if (docError) {
      console.log(`  ❌ Error: ${docError.message}`);
    } else {
      const companyMap = new Map();
      companyDocs.forEach(doc => {
        const pathParts = doc.file_path.split('/');
        if (pathParts.length >= 2) {
          const companyName = pathParts[0];
          companyMap.set(companyName, (companyMap.get(companyName) || 0) + 1);
        }
      });

      console.log(`  ✅ Found ${companyMap.size} companies with documents`);
      console.log('  📋 Sample companies:');
      Array.from(companyMap.entries()).slice(0, 3).forEach(([company, count]) => {
        console.log(`    - ${company}: ${count} documents`);
      });
    }

    // Test 3: Check if environment variables are being read correctly
    console.log('\n🔧 Environment Variables Check:');
    console.log(`  Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Supabase Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`  URL starts with https://: ${supabaseUrl?.startsWith('https://') ? '✅ Yes' : '❌ No'}`);

    console.log('\n🎉 Frontend data test completed!');
    console.log('\n💡 If you see real data above, the issue might be:');
    console.log('  1. Browser cache - try hard refresh (Ctrl+F5)');
    console.log('  2. Development server not restarted - restart with npm run dev');
    console.log('  3. Environment variables not loaded - check .env file');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testFrontendData().then(() => {
  process.exit(0);
}); 