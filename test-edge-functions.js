import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tndfjsjemqjgagtsqudr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZGZqc2plbXFqZ2FndHNxdWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4ODQ1MDMsImV4cCI6MjA2NTQ2MDUwM30.NkSiQS7MeUXk0Am5zwMfqi1r-W_TTlqaVCc7idSvd9g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunctions() {
  console.log('🔧 Testing Edge Functions...\n');

  try {
    // Test doc-manager function
    console.log('📁 Testing doc-manager function...');
    const { data: docManagerTest, error: docError } = await supabase.functions.invoke('doc-manager', {
      method: 'GET',
      body: {
        action: 'list',
        path: 'test'
      }
    });

    if (docError) {
      console.log('❌ doc-manager error:', docError.message);
    } else {
      console.log('✅ doc-manager function is working');
    }

    // Test send-visa-notifications function
    console.log('\n📧 Testing send-visa-notifications function...');
    const { data: visaTest, error: visaError } = await supabase.functions.invoke('send-visa-notifications', {
      method: 'POST',
      body: {
        action: 'test'
      }
    });

    if (visaError) {
      console.log('❌ send-visa-notifications error:', visaError.message);
    } else {
      console.log('✅ send-visa-notifications function is working');
    }

    console.log('\n🎉 Edge Functions test completed!');

  } catch (error) {
    console.error('❌ Error testing Edge Functions:', error);
  }
}

testEdgeFunctions(); 