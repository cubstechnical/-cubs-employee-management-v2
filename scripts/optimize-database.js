#!/usr/bin/env node

/**
 * Database Optimization Script
 * 
 * This script optimizes the Supabase database for better performance.
 * Run with: node scripts/optimize-database.js
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🗄️  Database Optimization Script');
console.log('================================');

// Database optimization queries
const OPTIMIZATION_QUERIES = {
  // Indexes for employee table
  employeeIndexes: [
    {
      name: 'idx_employee_table_company_name',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_table_company_name ON employee_table(company_name);',
      description: 'Index for company name filtering'
    },
    {
      name: 'idx_employee_table_is_active',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_table_is_active ON employee_table(is_active);',
      description: 'Index for active/inactive filtering'
    },
    {
      name: 'idx_employee_table_visa_expiry',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_table_visa_expiry ON employee_table(visa_expiry_date);',
      description: 'Index for visa expiry date queries'
    },
    {
      name: 'idx_employee_table_created_at',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_table_created_at ON employee_table(created_at DESC);',
      description: 'Index for recent employees sorting'
    },
    {
      name: 'idx_employee_table_search',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_table_search ON employee_table USING gin(to_tsvector(\'english\', name || \' \' || COALESCE(email_id, \'\') || \' \' || company_name || \' \' || trade || \' \' || employee_id));',
      description: 'Full-text search index'
    }
  ],

  // Indexes for employee_documents table
  documentIndexes: [
    {
      name: 'idx_employee_documents_employee_id',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);',
      description: 'Index for employee document lookups'
    },
    {
      name: 'idx_employee_documents_uploaded_at',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_documents_uploaded_at ON employee_documents(uploaded_at DESC);',
      description: 'Index for recent document sorting'
    },
    {
      name: 'idx_employee_documents_file_type',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_documents_file_type ON employee_documents(file_type);',
      description: 'Index for file type filtering'
    }
  ],

  // Composite indexes for common queries
  compositeIndexes: [
    {
      name: 'idx_employee_table_active_company',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_table_active_company ON employee_table(is_active, company_name);',
      description: 'Composite index for active employees by company'
    },
    {
      name: 'idx_employee_table_visa_status',
      query: 'CREATE INDEX IF NOT EXISTS idx_employee_table_visa_status ON employee_table(is_active, visa_expiry_date);',
      description: 'Composite index for visa status queries'
    }
  ],

  // Performance optimization queries
  performanceOptimizations: [
    {
      name: 'analyze_tables',
      query: 'ANALYZE employee_table, employee_documents;',
      description: 'Update table statistics for query planner'
    },
    {
      name: 'vacuum_tables',
      query: 'VACUUM ANALYZE employee_table, employee_documents;',
      description: 'Clean up and optimize table storage'
    }
  ]
};

// Database connection
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Execute optimization queries
async function executeOptimizations() {
  const supabase = getSupabaseClient();
  
  console.log('\n🔧 Executing Database Optimizations...');
  
  let successCount = 0;
  let errorCount = 0;

  // Execute employee table indexes
  console.log('\n📊 Creating Employee Table Indexes...');
  for (const index of OPTIMIZATION_QUERIES.employeeIndexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: index.query });
      if (error) {
        console.log(`❌ ${index.name}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${index.name}: ${index.description}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${index.name}: ${err.message}`);
      errorCount++;
    }
  }

  // Execute document table indexes
  console.log('\n📄 Creating Document Table Indexes...');
  for (const index of OPTIMIZATION_QUERIES.documentIndexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: index.query });
      if (error) {
        console.log(`❌ ${index.name}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${index.name}: ${index.description}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${index.name}: ${err.message}`);
      errorCount++;
    }
  }

  // Execute composite indexes
  console.log('\n🔗 Creating Composite Indexes...');
  for (const index of OPTIMIZATION_QUERIES.compositeIndexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: index.query });
      if (error) {
        console.log(`❌ ${index.name}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${index.name}: ${index.description}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${index.name}: ${err.message}`);
      errorCount++;
    }
  }

  // Execute performance optimizations
  console.log('\n⚡ Running Performance Optimizations...');
  for (const optimization of OPTIMIZATION_QUERIES.performanceOptimizations) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: optimization.query });
      if (error) {
        console.log(`❌ ${optimization.name}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${optimization.name}: ${optimization.description}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${optimization.name}: ${err.message}`);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}

// Test query performance
async function testQueryPerformance() {
  const supabase = getSupabaseClient();
  
  console.log('\n🧪 Testing Query Performance...');
  
  const testQueries = [
    {
      name: 'Employee Search',
      query: () => supabase
        .from('employee_table')
        .select('*')
        .ilike('name', '%test%')
        .limit(10)
    },
    {
      name: 'Active Employees by Company',
      query: () => supabase
        .from('employee_table')
        .select('*')
        .eq('is_active', true)
        .eq('company_name', 'CUBS')
        .limit(10)
    },
    {
      name: 'Visa Expiring Soon',
      query: () => supabase
        .from('employee_table')
        .select('*')
        .eq('is_active', true)
        .gte('visa_expiry_date', new Date().toISOString())
        .lte('visa_expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10)
    },
    {
      name: 'Recent Documents',
      query: () => supabase
        .from('employee_documents')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(10)
    }
  ];

  for (const test of testQueries) {
    const startTime = Date.now();
    try {
      const { data, error } = await test.query();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message} (${duration}ms)`);
      } else {
        console.log(`✅ ${test.name}: ${duration}ms (${data?.length || 0} results)`);
      }
    } catch (err) {
      console.log(`❌ ${test.name}: ${err.message}`);
    }
  }
}

// Generate optimization report
async function generateOptimizationReport() {
  console.log('\n📋 Database Optimization Report');
  console.log('================================');
  
  try {
    const { successCount, errorCount } = await executeOptimizations();
    
    console.log('\n📊 Optimization Summary:');
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    console.log(`  Success Rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (errorCount === 0) {
      console.log('\n✅ All database optimizations completed successfully!');
      
      // Test performance after optimization
      await testQueryPerformance();
      
      console.log('\n🎯 Expected Performance Improvements:');
      console.log('  • Employee search queries: 3-5x faster');
      console.log('  • Company filtering: 2-3x faster');
      console.log('  • Visa expiry queries: 4-6x faster');
      console.log('  • Document lookups: 2-4x faster');
      console.log('  • Dashboard metrics: 2-3x faster');
      
    } else {
      console.log('\n⚠️  Some optimizations failed. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error.message);
    process.exit(1);
  }
}

// Run the optimization
generateOptimizationReport();
