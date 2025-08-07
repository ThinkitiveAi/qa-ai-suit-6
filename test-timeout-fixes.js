const { completeHealthcareWorkflowFixed } = require('./complete flow.js');

// Test timeout fixes
async function testTimeoutFixes() {
  console.log('🧪 Testing Timeout Fixes...\n');
  
  try {
    await completeHealthcareWorkflowFixed();
    console.log('\n✅ All timeout fixes working correctly!');
  } catch (error) {
    console.log('\n❌ Timeout test failed:', error.message);
    console.log('📋 This helps identify any remaining timeout issues');
  }
}

// Run the test
testTimeoutFixes(); 