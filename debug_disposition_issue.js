// Debug script to diagnose disposition creation issues
// Run this in browser console on your app page

async function debugDispositionIssue() {
  console.log('🔍 DEBUGGING DISPOSITION CREATION ISSUE');
  console.log('=====================================');
  
  try {
    // Check if user is authenticated
    const { data: { session }, error: authError } = await window.supabase.auth.getSession();
    
    if (authError || !session) {
      console.error('❌ AUTHENTICATION ISSUE:', authError);
      return;
    }
    
    console.log('✅ User authenticated:', session.user.email);
    
    // Test 1: Check if we can read dispositions table
    console.log('\n📋 TEST 1: Checking dispositions table access...');
    const { data: dispositions, error: readError } = await window.supabase
      .from('dispositions')
      .select('disposition_type')
      .limit(1);
    
    if (readError) {
      console.error('❌ Cannot read dispositions table:', readError);
      return;
    }
    
    console.log('✅ Can read dispositions table');
    
    // Test 2: Check what disposition types exist in database
    console.log('\n📋 TEST 2: Checking available disposition types...');
    const { data: enumData, error: enumError } = await window.supabase
      .rpc('get_enum_values', { enum_name: 'disposition_type' });
    
    if (enumError) {
      console.log('⚠️ Cannot check enum values (function may not exist)');
      
      // Alternative: Try to get unique disposition types from existing data
      const { data: existingTypes } = await window.supabase
        .from('dispositions')
        .select('disposition_type')
        .limit(100);
      
      if (existingTypes) {
        const uniqueTypes = [...new Set(existingTypes.map(d => d.disposition_type))];
        console.log('📊 Existing disposition types in database:', uniqueTypes);
      }
    } else {
      console.log('📊 Available disposition types:', enumData);
    }
    
    // Test 3: Try to create a test disposition directly
    console.log('\n📋 TEST 3: Testing direct disposition creation...');
    
    // Find a prospect to test with
    const { data: prospects } = await window.supabase
      .from('prospects')
      .select('id')
      .limit(1);
    
    if (!prospects || prospects.length === 0) {
      console.log('⚠️ No prospects found to test with');
      return;
    }
    
    const testProspectId = prospects[0].id;
    console.log(`Using prospect ID: ${testProspectId}`);
    
    // Try creating with an old disposition type first
    console.log('\n🧪 Testing with OLD disposition type (not_relevant)...');
    const { data: oldTypeTest, error: oldTypeError } = await window.supabase
      .from('dispositions')
      .insert({
        prospect_id: testProspectId,
        user_id: session.user.id,
        disposition_type: 'not_relevant',
        custom_reason: 'Debug test - old type'
      })
      .select()
      .single();
    
    if (oldTypeError) {
      console.error('❌ OLD type failed:', oldTypeError);
    } else {
      console.log('✅ OLD type works:', oldTypeTest.disposition_type);
      // Clean up
      await window.supabase.from('dispositions').delete().eq('id', oldTypeTest.id);
    }
    
    // Try creating with a new disposition type
    console.log('\n🧪 Testing with NEW disposition type (not_connected)...');
    const { data: newTypeTest, error: newTypeError } = await window.supabase
      .from('dispositions')
      .insert({
        prospect_id: testProspectId,
        user_id: session.user.id,
        disposition_type: 'not_connected',
        custom_reason: 'Debug test - new type'
      })
      .select()
      .single();
    
    if (newTypeError) {
      console.error('❌ NEW type failed:', newTypeError);
      console.log('🔧 This means the database migration has NOT been run yet!');
    } else {
      console.log('✅ NEW type works:', newTypeTest.disposition_type);
      // Clean up
      await window.supabase.from('dispositions').delete().eq('id', newTypeTest.id);
    }
    
    // Test 4: Test the edge function directly
    console.log('\n📋 TEST 4: Testing edge function...');
    
    try {
      const response = await fetch(`${window.supabase.supabaseUrl}/functions/v1/create-disposition`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospect_id: testProspectId,
          disposition_type: 'not_relevant',
          custom_reason: 'Edge function test'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Edge function works:', result);
        // Clean up if successful
        if (result.data?.id) {
          await window.supabase.from('dispositions').delete().eq('id', result.data.id);
        }
      } else {
        console.error('❌ Edge function failed:', result);
      }
    } catch (edgeError) {
      console.error('❌ Edge function error:', edgeError);
    }
    
    // Summary
    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('====================');
    
    if (oldTypeError && newTypeError) {
      console.log('❌ ISSUE: Cannot create ANY dispositions');
      console.log('🔧 SOLUTION: Check RLS policies and user permissions');
    } else if (newTypeError && !oldTypeError) {
      console.log('❌ ISSUE: Database migration has NOT been run');
      console.log('🔧 SOLUTION: Run the SQL migration in Supabase Dashboard');
    } else if (!newTypeError && !oldTypeError) {
      console.log('✅ Database is working correctly');
      console.log('🔧 ISSUE: Likely edge function deployment or frontend code');
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Auto-run the debug
debugDispositionIssue();
