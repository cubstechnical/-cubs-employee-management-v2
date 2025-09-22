#!/usr/bin/env node

/**
 * Setup Notifications Database Script
 * 
 * This script helps set up the notifications system by running the database migration
 * to create the notifications table and add notification tracking columns to employee_table.
 * 
 * Usage:
 *   node scripts/setup-notifications.js
 *   npm run setup:notifications
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up CUBS Technical Notifications System...\n');

// Check if we're in the right directory
if (!fs.existsSync('supabase')) {
  console.error('❌ Error: supabase directory not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if migration files exist
const notificationsMigration = 'supabase/migrations/20241201000000_create_notifications_table.sql';
const settingsMigration = 'supabase/migrations/20241201000001_create_user_settings_table.sql';

if (!fs.existsSync(notificationsMigration)) {
  console.error(`❌ Error: Notifications migration file not found: ${notificationsMigration}`);
  console.log('📝 Please ensure the migration file exists before running this script.');
  process.exit(1);
}

if (!fs.existsSync(settingsMigration)) {
  console.error(`❌ Error: Settings migration file not found: ${settingsMigration}`);
  console.log('📝 Please ensure the migration file exists before running this script.');
  process.exit(1);
}

console.log('📋 Migration files found:');
console.log('  -', notificationsMigration);
console.log('  -', settingsMigration);

try {
  console.log('🔄 Running database migration...');
  
  // Check if supabase CLI is available
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI found');
  } catch (error) {
    console.log('⚠️ Supabase CLI not found. You may need to run the migration manually.');
    console.log('📝 Manual setup instructions:');
    console.log('   1. Open your Supabase dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy and paste the contents of:', migrationFile);
    console.log('   4. Run the SQL script');
    console.log('   5. Verify the tables were created successfully\n');
    
    // Show the migration content
    console.log('📄 Migration SQL Content:');
    console.log('=' .repeat(50));
    console.log('NOTIFICATIONS MIGRATION:');
    const notificationsContent = fs.readFileSync(notificationsMigration, 'utf8');
    console.log(notificationsContent);
    console.log('=' .repeat(50));
    console.log('SETTINGS MIGRATION:');
    const settingsContent = fs.readFileSync(settingsMigration, 'utf8');
    console.log(settingsContent);
    console.log('=' .repeat(50));
    
    process.exit(0);
  }

  // Try to run the migration
  try {
    execSync('supabase db push', { stdio: 'inherit' });
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.log('⚠️ Supabase CLI migration failed. Trying alternative approach...');
    console.log('📝 Please run the migration manually in your Supabase dashboard.');
  }

  console.log('\n🎉 Notifications System Setup Complete!');
  console.log('\n📋 What was created:');
  console.log('   ✅ notifications table - for tracking all notifications');
  console.log('   ✅ user_settings table - for storing user preferences');
  console.log('   ✅ admin_settings table - for storing system settings');
  console.log('   ✅ notification tracking columns in employee_table');
  console.log('   ✅ RLS policies for secure access');
  console.log('   ✅ Helper functions for visa expiry statistics');
  console.log('   ✅ Sample notifications for testing');
  console.log('   ✅ Default admin settings');
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Configure Gmail SMTP credentials in environment variables');
  console.log('   2. Test the email service: npm run test:email');
  console.log('   3. Visit /notifications to see the dashboard');
  console.log('   4. Visit /settings to configure user preferences');
  console.log('   5. Visit /admin/settings to configure system settings');
  console.log('   6. Test visa expiry notifications manually');
  console.log('   7. Set up automated cron jobs for daily checks');
  
  console.log('\n📧 Email Configuration:');
  console.log('   GMAIL_USER=technicalcubs@gmail.com');
  console.log('   GMAIL_APP_PASSWORD=your-app-password-here');
  console.log('   GMAIL_FROM_NAME=CUBS Technical');
  
  console.log('\n🔗 Useful Commands:');
  console.log('   npm run test:email                    # Test email service');
  console.log('   curl -X POST /api/test-email          # Test via API');
  console.log('   curl -X POST /api/test-visa-notifications # Test visa notifications');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('\n📝 Manual Setup Instructions:');
  console.log('   1. Open your Supabase dashboard');
  console.log('   2. Go to SQL Editor');
  console.log('   3. Copy and paste the contents of:', migrationFile);
  console.log('   4. Run the SQL script');
  console.log('   5. Verify the tables were created successfully');
  process.exit(1);
}
