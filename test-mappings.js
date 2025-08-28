const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tndfjsjemqjgagtsqudr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGZqc2plbXFqZ2FndHNxdWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODQ1MDMsImV4cCI6MjA2NTQ2MDUwM30.jcPuX4IVgeCIwHuc53RiXhIm9yzMXYepgSzZ8QYu1iA'
);

async function testMappings() {
  try {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('file_path')
      .not('file_path', 'is', null)
      .limit(2000); // Increased limit to match the service

    if (error) {
      console.error('Error:', error);
      return;
    }

    const prefixes = new Set();
    data.forEach(doc => {
      if (doc.file_path) {
        const parts = doc.file_path.split('/');
        if (parts[0]) prefixes.add(parts[0]);
      }
    });

    console.log('All company prefixes found:');
    const sorted = Array.from(prefixes).sort();
    sorted.forEach(p => console.log('- ' + p));
    console.log('Total:', prefixes.size);

    console.log('\nChecking mappings:');
    const displayNameMapping = {
      'AL_ASHBAL_AJMAN': 'AL ASHBAL AJMAN',
      'AL ASHBAL AJMAN': 'AL ASHBAL AJMAN',
      'CUBS': 'CUBS',
      'CUBS_CONTRACTING': 'CUBS CONTRACTING',
      'CUBS CONTRACTING': 'CUBS CONTRACTING',
      'CUBS_TECH': 'CUBS',
      'ASHBAL_AL_KHALEEJ': 'ASHBAL AL KHALEEJ',
      'ASHBAL AL KHALEEJ': 'ASHBAL AL KHALEEJ',
      'FLUID_ENGINEERING': 'FLUID ENGINEERING',
      'RUKIN_AL_ASHBAL': 'RUKIN AL ASHBAL',
      'RUKIN AL ASHBAL': 'RUKIN AL ASHBAL',
      'GOLDEN_CUBS': 'GOLDEN CUBS',
      'GOLDEN CUBS': 'GOLDEN CUBS',
      'AL_MACEN': 'AL MACEN',
      'AL MACEN': 'AL MACEN'
    };

    sorted.forEach(prefix => {
      const mapped = displayNameMapping[prefix];
      console.log(`${prefix} -> ${mapped || 'NO MAPPING'}`);
    });

    // Test the grouping logic
    console.log('\nTesting grouping logic:');
    const groupedFolders = new Map();
    sorted.forEach(prefix => {
      let displayName = displayNameMapping[prefix];
      
      if (!displayName) {
        displayName = prefix.replace(/_/g, ' ').trim();
      }
      
      const normalizedName = displayName.toUpperCase().trim();
      
      if (!groupedFolders.has(normalizedName)) {
        groupedFolders.set(normalizedName, []);
      }
      groupedFolders.get(normalizedName).push(prefix);
    });

    console.log('Final grouped folders:');
    groupedFolders.forEach((prefixes, normalizedName) => {
      console.log(`${normalizedName}: ${prefixes.join(', ')}`);
    });

    console.log(`\nTotal final folders: ${groupedFolders.size}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testMappings();
