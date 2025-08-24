const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "relationship-l10.firebaseapp.com",
  projectId: "relationship-l10",
  storageBucket: "relationship-l10.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Test the new account notification function
async function testNewAccountFunction() {
  try {
    console.log('Testing new account notification function...');
    
    const sendNewAccountNotification = httpsCallable(functions, 'sendNewAccountNotification');
    
    const testData = {
      userId: 'test-user-' + Date.now(),
      email: 'test@example.com', // Replace with your test email
      displayName: 'Test User',
      signupMethod: 'email',
      testMode: true
    };
    
    console.log('Sending test data:', testData);
    
    const result = await sendNewAccountNotification(testData);
    
    console.log('✅ Function call successful!');
    console.log('Result:', result.data);
  } catch (error) {
    console.error('❌ Function call failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
  }
}

// Test the test email function as a comparison
async function testTestEmailFunction() {
  try {
    console.log('\nTesting test email function for comparison...');
    
    const sendTestEmail = httpsCallable(functions, 'sendTestEmailCallable');
    
    const result = await sendTestEmail({
      to: 'test@example.com' // Replace with your test email
    });
    
    console.log('✅ Test email function successful!');
    console.log('Result:', result.data);
  } catch (error) {
    console.error('❌ Test email function failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
  }
}

// Run both tests
async function runTests() {
  console.log('=== Testing New Account Notification Function ===');
  await testNewAccountFunction();
  
  console.log('\n=== Testing Test Email Function ===');
  await testTestEmailFunction();
}

runTests();
