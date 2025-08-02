const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function getDatabaseInfo() {
  console.log('🔍 Getting Database Information...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Get unique companies
    console.log('🏢 Unique Companies:');
    const { data: companies, error: companiesError } = await supabase
      .from('employee_table')
      .select('company_name')
      .not('company_name', 'is', null);

    if (companiesError) {
      console.log(`  ❌ Error: ${companiesError.message}`);
    } else {
      const uniqueCompanies = [...new Set(companies.map(c => c.company_name))].sort();
      console.log(`  📊 Found ${uniqueCompanies.length} unique companies:`);
      uniqueCompanies.forEach(company => {
        console.log(`    - ${company}`);
      });
    }

    console.log('');

    // Get unique trades
    console.log('🔧 Unique Trades:');
    const { data: trades, error: tradesError } = await supabase
      .from('employee_table')
      .select('trade')
      .not('trade', 'is', null);

    if (tradesError) {
      console.log(`  ❌ Error: ${tradesError.message}`);
    } else {
      const uniqueTrades = [...new Set(trades.map(t => t.trade))].sort();
      console.log(`  📊 Found ${uniqueTrades.length} unique trades:`);
      uniqueTrades.forEach(trade => {
        console.log(`    - ${trade}`);
      });
    }

    console.log('');

    // Get unique nationalities
    console.log('🌍 Unique Nationalities:');
    const { data: nationalities, error: nationalitiesError } = await supabase
      .from('employee_table')
      .select('nationality')
      .not('nationality', 'is', null);

    if (nationalitiesError) {
      console.log(`  ❌ Error: ${nationalitiesError.message}`);
    } else {
      const uniqueNationalities = [...new Set(nationalities.map(n => n.nationality))].sort();
      console.log(`  📊 Found ${uniqueNationalities.length} unique nationalities:`);
      uniqueNationalities.forEach(nationality => {
        console.log(`    - ${nationality}`);
      });
    }

    console.log('');

    // Get unique statuses
    console.log('📊 Unique Statuses:');
    const { data: statuses, error: statusesError } = await supabase
      .from('employee_table')
      .select('status')
      .not('status', 'is', null);

    if (statusesError) {
      console.log(`  ❌ Error: ${statusesError.message}`);
    } else {
      const uniqueStatuses = [...new Set(statuses.map(s => s.status))].sort();
      console.log(`  📊 Found ${uniqueStatuses.length} unique statuses:`);
      uniqueStatuses.forEach(status => {
        console.log(`    - ${status}`);
      });
    }

    console.log('');

    // Get unique visa statuses
    console.log('🛂 Unique Visa Statuses:');
    const { data: visaStatuses, error: visaStatusesError } = await supabase
      .from('employee_table')
      .select('visa_status')
      .not('visa_status', 'is', null);

    if (visaStatusesError) {
      console.log(`  ❌ Error: ${visaStatusesError.message}`);
    } else {
      const uniqueVisaStatuses = [...new Set(visaStatuses.map(v => v.visa_status))].sort();
      console.log(`  📊 Found ${uniqueVisaStatuses.length} unique visa statuses:`);
      uniqueVisaStatuses.forEach(visaStatus => {
        console.log(`    - ${visaStatus}`);
      });
    }

    console.log('');

    // Check for temporary workers (look for patterns in employee_id or other fields)
    console.log('🔍 Temporary Worker Analysis:');
    const { data: tempWorkers, error: tempWorkersError } = await supabase
      .from('employee_table')
      .select('employee_id, name, company_name, status')
      .or('employee_id.ilike.%TEMP%,employee_id.ilike.%TEMP%,status.ilike.%temp%,status.ilike.%TEMP%');

    if (tempWorkersError) {
      console.log(`  ❌ Error: ${tempWorkersError.message}`);
    } else {
      console.log(`  📊 Found ${tempWorkers.length} potential temporary workers:`);
      tempWorkers.forEach(worker => {
        console.log(`    - ${worker.employee_id}: ${worker.name} (${worker.company_name}) - ${worker.status}`);
      });
    }

    // Get sample data for better understanding
    console.log('\n📋 Sample Employee Records:');
    const { data: sampleEmployees, error: sampleError } = await supabase
      .from('employee_table')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.log(`  ❌ Error: ${sampleError.message}`);
    } else {
      sampleEmployees.forEach((emp, index) => {
        console.log(`\n  Employee ${index + 1}:`);
        console.log(`    ID: ${emp.employee_id}`);
        console.log(`    Name: ${emp.name}`);
        console.log(`    Company: ${emp.company_name}`);
        console.log(`    Trade: ${emp.trade}`);
        console.log(`    Status: ${emp.status}`);
        console.log(`    Visa Status: ${emp.visa_status}`);
        console.log(`    Is Active: ${emp.is_active}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

getDatabaseInfo().then(() => {
  console.log('\n🔍 Database information gathering completed!');
  process.exit(0);
}); 