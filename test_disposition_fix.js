// Test script to verify the disposition fix is working
// Run this in browser console after applying the SQL fix

async function testDispositionFix() {
  console.log('🧪 TESTING DISPOSITION FIX...\n');
  
  try {
    // Check if user is logged in
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.error('❌ Not logged in. Please log in first.');
      return;
    }
    
    console.log(`✅ Logged in as: ${session.user.email}`);
    console.log(`🔑 User ID: ${session.user.id}\n`);

    // Test 1: Check if we can read users table (RLS fix verification)
    console.log('📋 TEST 1: Checking users table access...');
    const { data: users, error: usersError } = await window.supabase
      .from('users')
      .select('id, name, email, project_name')
      .limit(5);

    if (usersError) {
      console.error('❌ FAILED: Cannot read users table:', usersError.message);
      console.log('🔧 ACTION NEEDED: Run the FINAL_FIX.sql script in Supabase Dashboard');
      return;
    } else {
      console.log(`✅ SUCCESS: Can read users table (${users.length} users found)`);
      users.forEach(u => console.log(`   - ${u.name || u.email} (${u.project_name || 'No project'})`));
    }

    // Test 2: Check existing dispositions with JOIN query
    console.log('\n📋 TEST 2: Testing disposition query with user JOIN...');
    const { data: dispositionsWithJoin, error: joinError } = await window.supabase
      .from('dispositions')
      .select(`
        id, user_id, user_name, project_name, created_at,
        users:user_id (
          id, name, email, project_name
        )
      `)
      .limit(5)
      .order('created_at', { ascending: false });

    if (joinError) {
      console.error('❌ FAILED: JOIN query failed:', joinError.message);
      console.log('🔧 This means RLS policies are still blocking the JOIN');
    } else {
      console.log(`✅ SUCCESS: JOIN query works (${dispositionsWithJoin.length} dispositions)`);
      
      let fixedCount = 0;
      let brokenCount = 0;
      
      dispositionsWithJoin.forEach(d => {
        const userName = d.user_name || d.users?.name || 'Unknown';
        const projectName = d.project_name || d.users?.project_name || 'N/A';
        const isFixed = userName !== 'Unknown' && projectName !== 'N/A';
        
        console.log(`   ${isFixed ? '✅' : '❌'} ${userName} (${projectName})`);
        
        if (isFixed) fixedCount++;
        else brokenCount++;
      });
      
      console.log(`\n📊 Results: ${fixedCount} fixed, ${brokenCount} still broken`);
    }

    // Test 3: Check if current user exists in users table
    console.log('\n📋 TEST 3: Checking current user in users table...');
    const { data: currentUserData, error: currentUserError } = await window.supabase
      .from('users')
      .select('id, name, email, project_name')
      .eq('id', session.user.id)
      .single();

    if (currentUserError) {
      console.error('❌ Current user not found in users table:', currentUserError.message);
      console.log('🔧 ACTION NEEDED: Run sync_user_profile() function');
    } else {
      console.log('✅ Current user found in users table:');
      console.log(`   Name: ${currentUserData.name || 'Not set'}`);
      console.log(`   Project: ${currentUserData.project_name || 'Not set'}`);
    }

    // Final summary
    console.log('\n🎯 SUMMARY:');
    console.log('==========');
    
    if (usersError) {
      console.log('❌ RLS POLICIES: Still blocking access');
      console.log('🔧 NEXT STEP: Run FINAL_FIX.sql in Supabase Dashboard');
    } else if (joinError) {
      console.log('❌ JOIN QUERIES: Still failing');
      console.log('🔧 NEXT STEP: Check RLS policies in Supabase Dashboard');
    } else {
      console.log('✅ RLS POLICIES: Working correctly');
      console.log('✅ JOIN QUERIES: Working correctly');
      
      if (brokenCount > 0) {
        console.log(`⚠️ DATA ISSUE: ${brokenCount} dispositions still missing user data`);
        console.log('🔧 NEXT STEP: Run the backfill UPDATE query from FINAL_FIX.sql');
      } else {
        console.log('🎉 ALL TESTS PASSED! Disposition fix is working correctly.');
      }
    }
    
    console.log('\n📝 INSTRUCTIONS:');
    console.log('1. If any tests failed, copy FINAL_FIX.sql into Supabase Dashboard → SQL Editor');
    console.log('2. Run the script');
    console.log('3. Refresh this page and run this test again');
    console.log('4. Check disposition history - should show real names instead of "Unknown Agent"');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Auto-run the test
testDispositionFix();
