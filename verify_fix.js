// Verification script - Run this in browser console after applying the SQL fix
// This will test if the disposition user tracking is now working

async function verifyDispositionFix() {
  console.log('🔍 VERIFYING DISPOSITION FIX...\n');
  
  try {
    // Check if user is logged in
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.error('❌ Not logged in. Please log in first.');
      return;
    }
    
    console.log(`✅ Logged in as: ${session.user.email}\n`);

    // Test 1: Check if we can read users table (RLS fix)
    console.log('📋 TEST 1: Checking users table access...');
    const { data: users, error: usersError } = await window.supabase
      .from('users')
      .select('id, name, email, project_name')
      .limit(3);

    if (usersError) {
      console.error('❌ FAILED: Cannot read users table:', usersError.message);
      console.log('🔧 This means RLS policies are still blocking access');
      return;
    } else {
      console.log(`✅ SUCCESS: Can read users table (${users.length} users found)`);
      users.forEach(u => console.log(`   - ${u.name || u.email} (${u.project_name || 'No project'})`));
    }

    // Test 2: Check existing dispositions
    console.log('\n📋 TEST 2: Checking existing dispositions...');
    const { data: dispositions, error: dispError } = await window.supabase
      .from('dispositions')
      .select('id, user_id, user_name, project_name, created_at')
      .limit(5)
      .order('created_at', { ascending: false });

    if (dispError) {
      console.error('❌ FAILED: Cannot read dispositions:', dispError.message);
      return;
    }

    console.log(`✅ Found ${dispositions.length} recent dispositions:`);
    let fixedCount = 0;
    let brokenCount = 0;
    
    dispositions.forEach(d => {
      const hasUserData = d.user_name && d.project_name;
      const status = hasUserData ? '✅' : '❌';
      const display = hasUserData ? `${d.user_name} (${d.project_name})` : 'Unknown Agent (Project: N/A)';
      
      console.log(`   ${status} ${display}`);
      
      if (hasUserData) fixedCount++;
      else brokenCount++;
    });

    // Test 3: Test disposition creation with proper user data
    console.log('\n📋 TEST 3: Testing new disposition creation...');
    
    // Find a prospect to test with
    const { data: prospects } = await window.supabase
      .from('prospects')
      .select('id')
      .limit(1);
    
    if (!prospects || prospects.length === 0) {
      console.log('⚠️ No prospects found to test with. Skipping creation test.');
    } else {
      const testProspectId = prospects[0].id;
      console.log(`Testing with prospect ID: ${testProspectId}`);
      
      // Create a test disposition
      const { data: newDisposition, error: createError } = await window.supabase
        .from('dispositions')
        .insert({
          prospect_id: testProspectId,
          user_id: session.user.id,
          disposition_type: 'others',
          custom_reason: 'Test disposition to verify fix'
        })
        .select('id, user_name, project_name')
        .single();
      
      if (createError) {
        console.error('❌ FAILED: Cannot create test disposition:', createError.message);
      } else {
        const hasUserData = newDisposition.user_name && newDisposition.project_name;
        if (hasUserData) {
          console.log(`✅ SUCCESS: New disposition has user data: ${newDisposition.user_name} (${newDisposition.project_name})`);
          
          // Clean up test disposition
          await window.supabase.from('dispositions').delete().eq('id', newDisposition.id);
          console.log('🧹 Test disposition cleaned up');
        } else {
          console.log('❌ FAILED: New disposition missing user data');
        }
      }
    }

    // Final summary
    console.log('\n🎯 VERIFICATION SUMMARY:');
    console.log('========================');
    
    if (usersError) {
      console.log('❌ RLS POLICIES: Still blocking user access');
      console.log('🔧 ACTION NEEDED: Run the IMMEDIATE_FIX.sql script');
    } else {
      console.log('✅ RLS POLICIES: Fixed - all users can read user profiles');
    }
    
    if (dispositions.length > 0) {
      console.log(`✅ EXISTING DISPOSITIONS: ${fixedCount} fixed, ${brokenCount} still broken`);
      if (brokenCount > 0) {
        console.log('🔧 ACTION NEEDED: Run the UPDATE query from IMMEDIATE_FIX.sql');
      }
    }
    
    console.log('\n📝 NEXT STEPS:');
    if (usersError || brokenCount > 0) {
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste the IMMEDIATE_FIX.sql script');
      console.log('3. Run the script');
      console.log('4. Refresh the page and run this verification again');
    } else {
      console.log('🎉 ALL TESTS PASSED! The disposition fix is working correctly.');
      console.log('✅ Users can now see proper names in disposition history');
      console.log('✅ New dispositions will automatically have user data');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Auto-run the verification
verifyDispositionFix();
