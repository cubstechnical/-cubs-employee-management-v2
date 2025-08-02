import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDocumentsLoading() {
  console.log('🔧 Testing Documents Loading with correct Supabase URL...\n');

  try {
    // Test 1: Get document folders (companies)
    console.log('📁 Testing document folders...');
    const { data: folders, error: foldersError } = await supabase
      .from('employee_documents')
      .select('file_path, uploaded_at')
      .not('file_path', 'is', null)
      .limit(10);

    if (foldersError) {
      console.log('❌ Error fetching folders:', foldersError.message);
    } else {
      console.log(`✅ Found ${folders?.length || 0} document records`);
      if (folders && folders.length > 0) {
        console.log('📋 Sample file paths:');
        folders.slice(0, 3).forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.file_path}`);
        });
      }
    }

    // Test 2: Get company documents
    console.log('\n📁 Testing company documents...');
    const { data: companyDocs, error: companyError } = await supabase
      .from('employee_documents')
      .select('*')
      .ilike('file_path', 'EMP_COMPANY_DOCS/%')
      .not('file_path', 'like', 'EMP_COMPANY_DOCS/%/%')
      .limit(5);

    if (companyError) {
      console.log('❌ Error fetching company documents:', companyError.message);
    } else {
      console.log(`✅ Found ${companyDocs?.length || 0} company documents`);
      if (companyDocs && companyDocs.length > 0) {
        console.log('📋 Sample company documents:');
        companyDocs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.file_name} (${doc.file_type})`);
        });
      }
    }

    // Test 3: Get employee documents
    console.log('\n👤 Testing employee documents...');
    const { data: employeeDocs, error: employeeError } = await supabase
      .from('employee_documents')
      .select('*')
      .not('file_path', 'like', 'EMP_COMPANY_DOCS/%')
      .limit(5);

    if (employeeError) {
      console.log('❌ Error fetching employee documents:', employeeError.message);
    } else {
      console.log(`✅ Found ${employeeDocs?.length || 0} employee documents`);
      if (employeeDocs && employeeDocs.length > 0) {
        console.log('📋 Sample employee documents:');
        employeeDocs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.file_name} (${doc.employee_id})`);
        });
      }
    }

    console.log('\n🎉 Documents loading test completed!');

  } catch (error) {
    console.error('❌ Error testing documents loading:', error);
  }
}

testDocumentsLoading(); 