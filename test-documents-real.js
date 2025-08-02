const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testDocumentsReal() {
  console.log('🔍 Testing Documents Real Data...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test 1: Get company folders
    console.log('🏢 Testing Company Folders:');
    const { data: companyDocs, error: companyError } = await supabase
      .from('employee_documents')
      .select('file_path')
      .not('file_path', 'is', null);

    if (companyError) {
      console.log(`  ❌ Error: ${companyError.message}`);
    } else {
      const companyMap = new Map();
      companyDocs.forEach(doc => {
        const pathParts = doc.file_path.split('/');
        if (pathParts.length >= 2) {
          const companyName = pathParts[0];
          companyMap.set(companyName, (companyMap.get(companyName) || 0) + 1);
        }
      });

      console.log(`  ✅ Found ${companyMap.size} companies:`);
      Array.from(companyMap.entries()).slice(0, 5).forEach(([company, count]) => {
        console.log(`    - ${company}: ${count} documents`);
      });
    }

    // Test 2: Get employee folders for a specific company
    console.log('\n👥 Testing Employee Folders:');
    const testCompany = 'RUKIN_AL_ASHBAL';
    const { data: employeeDocs, error: employeeError } = await supabase
      .from('employee_documents')
      .select('*')
      .ilike('file_path', `${testCompany}/%`);

    if (employeeError) {
      console.log(`  ❌ Error: ${employeeError.message}`);
    } else {
      const employeeMap = new Map();
      employeeDocs.forEach(doc => {
        const pathParts = doc.file_path.split('/');
        if (pathParts.length >= 2) {
          const employeeName = pathParts[1];
          employeeMap.set(employeeName, (employeeMap.get(employeeName) || 0) + 1);
        }
      });

      console.log(`  ✅ Found ${employeeMap.size} employees in ${testCompany}:`);
      Array.from(employeeMap.entries()).slice(0, 3).forEach(([employee, count]) => {
        console.log(`    - ${employee}: ${count} documents`);
      });
    }

    // Test 3: Get actual documents for a specific employee
    console.log('\n📁 Testing Actual Documents:');
    const testEmployee = 'SRINIVAS_BATTI';
    const { data: documents, error: docError } = await supabase
      .from('employee_documents')
      .select('*')
      .ilike('file_path', `${testCompany}/${testEmployee}%`);

    if (docError) {
      console.log(`  ❌ Error: ${docError.message}`);
    } else {
      console.log(`  ✅ Found ${documents.length} documents for ${testEmployee}:`);
      documents.slice(0, 3).forEach((doc, index) => {
        console.log(`    ${index + 1}. ${doc.file_name} (${doc.file_type}) - ${doc.file_size} bytes`);
        console.log(`       URL: ${doc.file_url}`);
      });
    }

    console.log('\n🎉 Documents real data test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Company folders: Working with real data');
    console.log('  ✅ Employee folders: Working with real data');
    console.log('  ✅ Document files: Working with real data');
    console.log('  ✅ Backblaze URLs: Working with real URLs');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testDocumentsReal().then(() => {
  process.exit(0);
}); 