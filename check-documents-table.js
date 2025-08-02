const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDocumentsTable() {
  console.log('🔍 Checking Documents Table...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check if employee_documents table exists
    console.log('📋 Checking employee_documents table...');
    const { data: documents, error } = await supabase
      .from('employee_documents')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`  ❌ Table does not exist or access denied: ${error.message}`);
      console.log('\n📝 You need to create the employee_documents table in your Supabase database.');
      console.log('\n🔧 Here\'s the SQL to create it:');
      console.log(`
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employee_table(employee_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  company_name TEXT,
  employee_name TEXT,
  folder_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_company_name ON employee_documents(company_name);
CREATE INDEX IF NOT EXISTS idx_employee_documents_status ON employee_documents(status);
CREATE INDEX IF NOT EXISTS idx_employee_documents_folder_path ON employee_documents(folder_path);

-- Create trigger for updated_at
CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON employee_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    } else {
      console.log(`  ✅ Table exists and is accessible`);
      console.log(`  📊 Found ${documents.length} documents`);
      
      if (documents && documents.length > 0) {
        console.log('\n📋 Sample document structure:');
        const doc = documents[0];
        Object.keys(doc).forEach(key => {
          const value = doc[key];
          const type = value === null ? 'NULL' : typeof value;
          console.log(`    - ${key}: ${type} (${value})`);
        });
      }

      // Get document count
      const { count } = await supabase
        .from('employee_documents')
        .select('*', { count: 'exact', head: true });

      console.log(`\n📊 Total documents: ${count || 0}`);

      // Get documents by company
      const { data: companyDocs } = await supabase
        .from('employee_documents')
        .select('company_name')
        .not('company_name', 'is', null);

      if (companyDocs && companyDocs.length > 0) {
        const companyCounts = {};
        companyDocs.forEach(doc => {
          companyCounts[doc.company_name] = (companyCounts[doc.company_name] || 0) + 1;
        });

        console.log('\n🏢 Documents by company:');
        Object.entries(companyCounts).forEach(([company, count]) => {
          console.log(`    - ${company}: ${count} documents`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkDocumentsTable().then(() => {
  console.log('\n🔍 Documents table check completed!');
  process.exit(0);
}); 