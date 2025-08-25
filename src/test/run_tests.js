import { signIn, signOut } from '../services/roleAuthService.js';
import { getUsers, inviteUser } from '../services/userService.js';
import { supabase } from '../config/supabase.js';

async function runTests() {
  console.log('--- Running Integration Tests ---');
  let allTestsPassed = true;

  // Test 1: Admin Login
  console.log('\n--- Test 1: Admin Login ---');
  try {
    const adminLoginResult = await signIn('admin@medcure.com', '123456');
    if (adminLoginResult.success && adminLoginResult.role === 'admin') {
      console.log('✅ PASSED: Admin login successful.');
    } else {
      console.error('❌ FAILED: Admin login failed or role is incorrect.', adminLoginResult);
      allTestsPassed = false;
    }
  } catch (error) {
    console.error('❌ FAILED: Admin login threw an error.', error);
    allTestsPassed = false;
  }

  // Test 2: Fetch Users (as admin)
  console.log('\n--- Test 2: Fetch Users ---');
  try {
    const users = await getUsers();
    if (Array.isArray(users)) {
      console.log(`✅ PASSED: Fetched ${users.length} user(s).`);
      console.log('Users:', users.map(u => ({ email: u.email, role: u.role })));
    } else {
      console.error('❌ FAILED: Did not fetch an array of users.', users);
      allTestsPassed = false;
    }
  } catch (error) {
    console.error('❌ FAILED: Fetching users threw an error.', error);
    allTestsPassed = false;
  }

  // Test 3: Invite a new user (as admin)
  console.log('\n--- Test 3: Invite New User ---');
  const testEmail = `test-employee-${Date.now()}@test.com`;
  try {
    const inviteResult = await inviteUser(testEmail, 'employee');
    if (inviteResult.success) {
      console.log(`✅ PASSED: Successfully invited new user: ${testEmail}`);
    } else {
      console.error('❌ FAILED: Failed to invite new user.', inviteResult.error);
      allTestsPassed = false;
    }
  } catch (error) {
    console.error('❌ FAILED: Inviting user threw an error.', error);
    allTestsPassed = false;
  }

  // Sign out after tests
  await signOut();
  console.log('\n--- Tests Complete ---');

  if (allTestsPassed) {
    console.log('\n🎉 All tests passed!');
    // In a real CI environment, we would exit with a success code
    // process.exit(0);
  } else {
    console.error('\n🔥 Some tests failed. Please review the logs.');
    // In a real CI environment, we would exit with a failure code
    // process.exit(1);
  }

  // We need to manually close the connection for the script to exit
  supabase.auth.signOut();
}

runTests();
