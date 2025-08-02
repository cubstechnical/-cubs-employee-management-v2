const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testRealData() {
  console.log('🔍 Testing Real Data Integration...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test Employees
    console.log('👥 Testing Employees Data:');
    const { data: employees, error: empError } = await supabase
      .from('employee_table')
      .select('*')
      .limit(5);

    if (empError) {
      console.log(`  ❌ Error: ${empError.message}`);
    } else {
      console.log(`  ✅ Found ${employees.length} employees`);
      console.log('  📋 Sample employees:');
      employees.forEach((emp, index) => {
        console.log(`    ${index + 1}. ${emp.name} (${emp.employee_id}) - ${emp.company_name}`);
      });
    }

    // Test Documents
    console.log('\n📁 Testing Documents Data:');
    const { data: documents, error: docError } = await supabase
      .from('employee_documents')
      .select('*')
      .limit(5);

    if (docError) {
      console.log(`  ❌ Error: ${docError.message}`);
    } else {
      console.log(`  ✅ Found ${documents.length} documents`);
      console.log('  📋 Sample documents:');
      documents.forEach((doc, index) => {
        console.log(`    ${index + 1}. ${doc.file_name} - ${doc.file_path}`);
      });
    }

    // Test Company Extraction from Documents
    console.log('\n🏢 Testing Company Extraction:');
    const { data: allDocs, error: allDocsError } = await supabase
      .from('employee_documents')
      .select('file_path')
      .not('file_path', 'is', null);

    if (allDocsError) {
      console.log(`  ❌ Error: ${allDocsError.message}`);
    } else {
      const companyMap = new Map();
      allDocs.forEach(doc => {
        const pathParts = doc.file_path.split('/');
        if (pathParts.length >= 2) {
          const companyName = pathParts[0];
          companyMap.set(companyName, (companyMap.get(companyName) || 0) + 1);
        }
      });

      console.log(`  ✅ Found ${companyMap.size} companies with documents:`);
      Array.from(companyMap.entries()).forEach(([company, count]) => {
        console.log(`    - ${company}: ${count} documents`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testRealData().then(() => {
  console.log('\n🔍 Real data test completed!');
  process.exit(0);
}); 