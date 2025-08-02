import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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