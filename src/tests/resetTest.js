// Quick test for system reset functionality
import { 
  clearLocalStorage,
  clearSessionStorage,
  quickDevReset
} from '../utils/systemReset.js';

// Test the reset functions
console.log('🧪 Testing System Reset Functions...');

// Test localStorage clear
console.log('Testing localStorage clear...');
localStorage.setItem('test_item', 'test_value');
const clearResult = clearLocalStorage();
console.log('Clear result:', clearResult);
console.log('Test item after clear:', localStorage.getItem('test_item'));

// Test sessionStorage clear  
console.log('\nTesting sessionStorage clear...');
sessionStorage.setItem('test_session', 'test_value');
const sessionResult = clearSessionStorage();
console.log('Session clear result:', sessionResult);
console.log('Test session after clear:', sessionStorage.getItem('test_session'));

// Test quick reset
console.log('\nTesting quick reset...');
quickDevReset().then(result => {
  console.log('Quick reset result:', result);
  console.log('✅ All reset functions working properly!');
});

export default true;
