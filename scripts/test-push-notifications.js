#!/usr/bin/env node

/**
 * Push Notifications Test Script
 * 
 * This script tests the push notification functionality.
 */

const { PushNotificationService } = require('../lib/services/pushNotifications');

async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications...\n');

  try {
    // Test initialization
    console.log('1. Testing initialization...');
    await PushNotificationService.initialize();
    console.log('✅ Initialization successful');

    // Test device token
    console.log('\n2. Testing device token...');
    const token = PushNotificationService.getDeviceToken();
    if (token) {
      console.log('✅ Device token available:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️  No device token available (this is normal in web environment)');
    }

    // Test availability
    console.log('\n3. Testing availability...');
    const available = PushNotificationService.isAvailable();
    console.log(`${available ? '✅' : '⚠️'} Push notifications ${available ? 'available' : 'not available'}`);

    console.log('\n🎉 Push notification tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPushNotifications();
