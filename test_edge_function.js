// Test script for the disposition fix
// Run this in browser console after logging in

async function testDispositionFix() {
  try {
    console.log('🧪 Testing disposition user tracking fix...');

    // Get current session
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.error('❌ No active session');
      return;
    }

    console.log('✅ Testing with user:', session.user.email);

    // Test 1: Check if we can read users table
    console.log('\n📋 Test 1: Checking users table access...');
    const { data: users, error: usersError } = await window.supabase
      .from('users')
      .select('id, name, email, project_name')
      .limit(5);

    if (usersError) {
      console.error('❌ Cannot read users table:', usersError);
    } else {
      console.log('✅ Can read users table. Found', users.length, 'users');
      console.log('Sample users:', users);
    }

    // Test 2: Check existing dispositions
    console.log('\n📋 Test 2: Checking existing dispositions...');
    const { data: dispositions, error: dispError } = await window.supabase
      .from('dispositions')
      .select('id, user_id, user_name, project_name, created_at')
      .limit(5)
      .order('created_at', { ascending: false });

    if (dispError) {
      console.error('❌ Cannot read dispositions:', dispError);
    } else {
      console.log('✅ Found', dispositions.length, 'recent dispositions');
      dispositions.forEach(d => {
        const status = (d.user_name && d.project_name) ? '✅' : '❌';
        console.log(`${status} Disposition ${d.id}: ${d.user_name || 'NULL'} (${d.project_name || 'NULL'})`);
      });
    }

    // Test 3: Test edge function (if available)
    console.log('\n📋 Test 3: Testing edge function...');
    const testData = {
      prospect_id: 1, // Replace with actual prospect ID
      disposition_type: 'others',
      custom_reason: 'Test disposition from edge function'
    };

    try {
      const response = await fetch('https://lodpoepylygsryjdkqjg.supabase.co/functions/v1/create-disposition', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Edge function success:', result);
        console.log('✅ User name captured:', result.data.user_name);
        console.log('✅ Project captured:', result.data.project_name);
      } else {
        console.log('⚠️ Edge function error (may not be deployed):', result);
      }
    } catch (edgeError) {
      console.log('⚠️ Edge function not available (may not be deployed):', edgeError.message);
    }

    console.log('\n🎯 Test Summary:');
    console.log('- If users table access works: RLS policies are fixed');
    console.log('- If existing dispositions show names: Database migration worked');
    console.log('- If edge function works: New dispositions will have proper user data');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDispositionFix();
