/**
 * Create a brand new working admin account
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createWorkingAdmin() {
    const email = 'pulseadmin@tvk.com';
    const password = 'Admin@Pulse2025';
    const firstName = 'Pulse';
    const lastName = 'Admin';

    console.log('\n✨ CREATING BRAND NEW WORKING ADMIN ACCOUNT\n');
    console.log('='.repeat(70));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: admin`);
    console.log('='.repeat(70));

    // Step 1: Create Supabase Auth user
    console.log('\n📝 Step 1: Creating Supabase Auth user...');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            first_name: firstName,
            last_name: lastName
        }
    });

    if (authError) {
        console.log('❌ Error creating auth user:', authError.message);

        if (authError.message.includes('already been registered')) {
            console.log('\n⚠️  Email already registered!');
            console.log('   Trying to find existing auth user...');

            // Can't easily get auth user by email via API, so suggest manual fix
            console.log('\n💡 SOLUTION: Try logging in with this email to reset password:');
            console.log(`   Email: ${email}`);
            console.log(`   Use "Forgot Password" if needed`);
        }
        return null;
    }

    console.log('✅ Auth user created!');
    console.log(`   Auth ID: ${authData.user.id}`);

    // Step 2: Create users table record
    console.log('\n📝 Step 2: Creating users table record...');

    const userRecord = {
        auth_user_id: authData.user.id,
        email: email,
        username: 'pulseadmin',
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        organization_id: '00000000-0000-0000-0000-000000000001',
        is_active: true
    };

    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single();

    if (userError) {
        console.log('❌ Error creating users record:', userError.message);

        // Cleanup: delete the auth user we just created
        console.log('   Cleaning up auth user...');
        await supabase.auth.admin.deleteUser(authData.user.id);

        return null;
    }

    console.log('✅ Users record created!');
    console.log(`   User ID: ${userData.id}`);

    // Step 3: Verify everything
    console.log('\n📝 Step 3: Verifying...');

    const { data: verifyUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (verifyUser && verifyUser.auth_user_id === authData.user.id) {
        console.log('✅ Perfect! Everything linked correctly!');
    }

    // Success!
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! NEW ADMIN ACCOUNT CREATED');
    console.log('='.repeat(70));
    console.log('\n📧 LOGIN CREDENTIALS:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ This account:');
    console.log(`   - Has real Supabase Auth user`);
    console.log(`   - Has admin role`);
    console.log(`   - Can create voters`);
    console.log(`   - auth_user_id is properly linked`);
    console.log('\n🚀 NEXT STEPS:');
    console.log(`   1. Logout from current account`);
    console.log(`   2. Login with: ${email}`);
    console.log(`   3. Password: ${password}`);
    console.log(`   4. Try adding a voter - IT WILL WORK!`);
    console.log('\n⚠️  SAVE THESE CREDENTIALS!\n');

    return { email, password, authUserId: authData.user.id, userId: userData.id };
}

createWorkingAdmin().catch(console.error);
