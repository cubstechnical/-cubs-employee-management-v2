const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tndfjsjemqjgagtsqudr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGZqc2plbXFqZ2FndHNxdWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODQ1MDMsImV4cCI6MjA2NTQ2MDUwM30.jcPuX4IVgeCIwHuc53RiXhIm9yzMXYepgSzZ8QYu1iA'
);

async function testAshbal() {
  try {
    // Check ASHBAL AL KHALEEJ documents
    const { data: ashbalData, error: ashbalError } = await supabase
      .from('employee_documents')
      .select('file_path, uploaded_at')
      .ilike('file_path', 'ASHBAL AL KHALEEJ%')
      .order('uploaded_at', { ascending: false })
      .limit(5);

    if (ashbalError) {
      console.error('Error:', ashbalError);
      return;
    }

    console.log('ASHBAL AL KHALEEJ documents (latest 5):');
    ashbalData.forEach(doc => {
      console.log(`- ${doc.file_path} (uploaded: ${doc.uploaded_at})`);
    });

    // Check if they appear in the main query
    const { data: mainData, error: mainError } = await supabase
      .from('employee_documents')
      .select('file_path')
      .not('file_path', 'is', null)
      .order('uploaded_at', { ascending: false })
      .limit(2000);

    if (mainError) {
      console.error('Error:', mainError);
      return;
    }

    const ashbalInMain = mainData.filter(doc => 
      doc.file_path && doc.file_path.startsWith('ASHBAL AL KHALEEJ')
    );

    console.log(`\nASHBAL AL KHALEEJ documents found in main query: ${ashbalInMain.length}`);
    if (ashbalInMain.length > 0) {
      console.log('First few:');
      ashbalInMain.slice(0, 3).forEach(doc => console.log(`- ${doc.file_path}`));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testAshbal();
