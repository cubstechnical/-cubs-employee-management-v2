const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testEmployees() {
  console.log('🔍 Testing Employee Data Fetch...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test basic employee fetch
    console.log('📊 Fetching first 5 employees...');
    const { data: employees, error, count } = await supabase
      .from('employee_table')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Successfully fetched ${employees.length} employees`);
    console.log(`📊 Total count: ${count}`);
    
    if (employees && employees.length > 0) {
      console.log('\n📋 Sample employee data:');
      employees.forEach((emp, index) => {
        console.log(`\nEmployee ${index + 1}:`);
        console.log(`  ID: ${emp.employee_id}`);
        console.log(`  Name: ${emp.name}`);
        console.log(`  Company: ${emp.company_name}`);
        console.log(`  Trade: ${emp.trade}`);
        console.log(`  Status: ${emp.status}`);
        console.log(`  Visa Status: ${emp.visa_status}`);
      });
    }

    // Test with filters
    console.log('\n🔍 Testing with company filter...');
    const { data: filteredEmployees, error: filterError } = await supabase
      .from('employee_table')
      .select('*')
      .eq('company_name', 'AL ASHBAL AJMAN')
      .limit(3);

    if (filterError) {
      console.error('❌ Filter error:', filterError.message);
    } else {
      console.log(`✅ Found ${filteredEmployees.length} employees from AL ASHBAL AJMAN`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testEmployees().then(() => {
  console.log('\n🔍 Employee test completed!');
  process.exit(0);
}); 