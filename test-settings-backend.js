/**
 * Settings Backend Test Script
 * Run this script to test the settings backend functionality
 */

import { testSettingsOperations } from './src/services/settingsService.js';
import { runAllTests } from './src/tests/backendTests.js';

console.log('🚀 Starting Settings Backend Test...');
console.log('='.repeat(50));

// Test settings operations
console.log('\n📋 Testing Settings Operations...');
try {
  const settingsTest = await testSettingsOperations();
  console.log('Settings Test Result:', settingsTest);
  
  if (settingsTest.success) {
    console.log('✅ Settings backend is operational!');
  } else {
    console.log('❌ Settings backend has issues:', settingsTest.error);
  }
} catch (error) {
  console.error('❌ Settings test failed:', error);
}

// Run all backend tests
console.log('\n📋 Running All Backend Tests...');
try {
  const allTestsResult = await runAllTests();
  console.log('All Tests Result:', allTestsResult);
  
  if (allTestsResult) {
    console.log('✅ All backend tests passed!');
  } else {
    console.log('❌ Some backend tests failed');
  }
} catch (error) {
  console.error('❌ All tests failed:', error);
}

console.log('\n' + '='.repeat(50));
console.log('🎯 Settings Backend Test Complete!');
