const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tndfjsjemqjgagtsqudr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGZqc2plbXFqZ2FndHNxdWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODQ1MDMsImV4cCI6MjA2NTQ2MDUwM30.jcPuX4IVgeCIwHuc53RiXhIm9yzMXYepgSzZ8QYu1iA'
);

async function testAllCompanies() {
  try {
    console.log('🔍 Testing all company prefixes...\n');

    // Test 1: Get all documents with increased limit
    const { data: allData, error: allError } = await supabase
      .from('employee_documents')
      .select('file_path')
      .not('file_path', 'is', null)
      .limit(2000);

    if (allError) {
      console.error('Error:', allError);
      return;
    }

    console.log(`📊 Total documents fetched: ${allData.length}`);

    // Extract all company prefixes
    const prefixes = new Set();
    allData.forEach(doc => {
      if (doc.file_path) {
        const parts = doc.file_path.split('/');
        if (parts[0]) prefixes.add(parts[0]);
      }
    });

    console.log('\n🏢 All company prefixes found:');
    const sorted = Array.from(prefixes).sort();
    sorted.forEach(p => console.log(`- ${p}`));
    console.log(`Total: ${prefixes.size}`);

    // Test 2: Check specific companies
    console.log('\n🔍 Checking specific companies:');
    
    const companiesToCheck = [
      'ASHBAL AL KHALEEJ',
      'Company Documents',
      'AL HANA TOURS & TRAVELS',
      'EMP_COMPANY_DOCS',
      'EMP_ALHT'
    ];

    companiesToCheck.forEach(company => {
      const hasCompany = prefixes.has(company);
      console.log(`${company}: ${hasCompany ? '✅' : '❌'}`);
    });

    // Test 3: Check for documents with these prefixes
    console.log('\n📄 Checking for documents with specific prefixes:');
    
    for (const company of companiesToCheck) {
      const { data: companyDocs, error: companyError } = await supabase
        .from('employee_documents')
        .select('file_path')
        .ilike('file_path', `${company}%`)
        .limit(5);

      if (companyError) {
        console.error(`Error checking ${company}:`, companyError);
        continue;
      }

      console.log(`${company}: ${companyDocs.length} documents found`);
      if (companyDocs.length > 0) {
        console.log(`  Sample: ${companyDocs[0].file_path}`);
      }
    }

    // Test 4: Check if there are any documents with "Company" in the path
    console.log('\n🔍 Checking for "Company" documents:');
    const { data: companyDocs, error: companyError } = await supabase
      .from('employee_documents')
      .select('file_path')
      .ilike('file_path', '%Company%')
      .limit(10);

    if (!companyError && companyDocs.length > 0) {
      console.log(`Found ${companyDocs.length} documents with "Company" in path:`);
      companyDocs.forEach(doc => console.log(`  - ${doc.file_path}`));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testAllCompanies();
