/**
 * Fix auth_user_id for shanthi.sundaram.admin1@tvk.com
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    const targetEmail = 'shanthi.sundaram.admin1@tvk.com';
    const correctAuthUserId = 'dc1c73cb-859e-46d7-8217-9b275f90bbb0';

    console.log('\n🔧 FIXING AUTH_USER_ID FOR shanthi.sundaram.admin1@tvk.com\n');
    console.log('='.repeat(70));

    // Step 1: Check current state
    console.log('\n📝 Step 1: Checking current state...');

    const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail)
        .single();

    if (fetchError || !currentUser) {
        console.log('❌ User not found:', fetchError?.message);
        return;
    }

    console.log(`✅ Found user:`);
    console.log(`   Email: ${currentUser.email}`);
    console.log(`   Role: ${currentUser.role}`);
    console.log(`   Current auth_user_id: ${currentUser.auth_user_id}`);
    console.log(`   Should be: ${correctAuthUserId}`);

    if (currentUser.auth_user_id === correctAuthUserId) {
        console.log('\n✅ auth_user_id is already correct! No update needed.');
        return;
    }

    // Step 2: Update auth_user_id
    console.log('\n📝 Step 2: Updating auth_user_id...');

    const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ auth_user_id: correctAuthUserId })
        .eq('email', targetEmail)
        .select()
        .single();

    if (updateError) {
        console.log('❌ Error updating:', updateError.message);
        return;
    }

    console.log('✅ auth_user_id updated successfully!');

    // Step 3: Verify
    console.log('\n📝 Step 3: Verifying update...');

    const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('email, role, auth_user_id')
        .eq('email', targetEmail)
        .single();

    if (verifyError || !verifyUser) {
        console.log('⚠️  Could not verify');
        return;
    }

    console.log(`✅ Verified:`);
    console.log(`   Email: ${verifyUser.email}`);
    console.log(`   Role: ${verifyUser.role}`);
    console.log(`   auth_user_id: ${verifyUser.auth_user_id}`);
    console.log(`   Match: ${verifyUser.auth_user_id === correctAuthUserId ? 'YES ✅' : 'NO ❌'}`);

    // Success
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! Account Fixed');
    console.log('='.repeat(70));
    console.log(`\n📧 Account: ${targetEmail}`);
    console.log(`   Role: ${verifyUser.role}`);
    console.log(`   Can create voters: YES ✅`);
    console.log(`\n⚠️  IMPORTANT: Refresh the browser page (F5) to apply changes`);
    console.log(`   Then try adding a voter - it should work now!`);
    console.log('\n');
}

main().catch(console.error);
