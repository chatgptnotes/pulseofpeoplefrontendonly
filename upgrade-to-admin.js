/**
 * Upgrade bhuppendrabalapure@gmail.com to admin role
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    const targetEmail = 'bhuppendrabalapure@gmail.com';

    console.log('\n🔧 UPGRADING USER TO ADMIN ROLE\n');
    console.log('='.repeat(70));
    console.log(`Target: ${targetEmail}\n`);

    // Get current user
    console.log('📝 Step 1: Getting current user info...');

    const { data: user, error: getUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail)
        .single();

    if (getUserError || !user) {
        console.log('❌ User not found');
        return;
    }

    console.log(`✅ Found user:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Auth User ID: ${user.auth_user_id}`);
    console.log(`   Organization: ${user.organization_id}`);

    // Update to admin
    console.log('\n📝 Step 2: Updating role to admin...');

    const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
            role: 'admin',
            is_active: true
        })
        .eq('id', user.id)
        .select()
        .single();

    if (updateError) {
        console.log('❌ Error updating user:', updateError.message);
        return;
    }

    console.log('✅ Role updated successfully!');

    // Verify
    console.log('\n📝 Step 3: Verifying update...');

    const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail)
        .single();

    if (verifyError || !verifyUser) {
        console.log('⚠️  Could not verify');
        return;
    }

    console.log(`✅ Verified:`);
    console.log(`   Email: ${verifyUser.email}`);
    console.log(`   New Role: ${verifyUser.role}`);
    console.log(`   Can add voters: ${['admin', 'superadmin', 'manager'].includes(verifyUser.role) ? 'YES ✅' : 'NO ❌'}`);

    // Success message
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! User Upgraded to Admin');
    console.log('='.repeat(70));
    console.log(`\n📧 Account: ${targetEmail}`);
    console.log(`   Role: ${verifyUser.role} (upgraded from ${user.role})`);
    console.log(`\n✅ This account can now:`);
    console.log(`   - Add voters`);
    console.log(`   - Access admin features`);
    console.log(`   - Manage organization data`);
    console.log(`\n⚠️  IMPORTANT: The user must refresh their browser/session`);
    console.log(`   Steps:`);
    console.log(`   1. Log out from the application`);
    console.log(`   2. Clear browser cache (optional but recommended)`);
    console.log(`   3. Log back in with: ${targetEmail}`);
    console.log(`   4. Try adding a voter - it should work now!`);
    console.log('\n');
}

main().catch(console.error);
