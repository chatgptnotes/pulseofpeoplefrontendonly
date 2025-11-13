/**
 * Cleanup orphaned auth users and create clean admin account
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

async function main() {
    const targetEmail = 'admin@tvk.com';
    const password = 'Admin@TVK2025';

    console.log('\n🧹 CLEANUP AND CREATE ADMIN ACCOUNT\n');
    console.log('='.repeat(70));

    // Step 1: Check for orphaned auth_user_ids (from failed attempts)
    console.log('\n📝 Step 1: Finding orphaned auth users...');

    const authIds = [
        'eba0ffaa-4ae4-4777-8580-e0e251eab737',
        '5908a96d-7c0f-4dbf-a5a9-53136a04ca3b'
    ];

    for (const authId of authIds) {
        console.log(`\n   Checking ${authId}...`);

        const { data: userWithThisId } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', authId)
            .single();

        if (userWithThisId) {
            console.log(`   ✅ Used by: ${userWithThisId.email}`);
        } else {
            console.log(`   ❌ Orphaned! Cleaning up...`);

            try {
                await supabase.auth.admin.deleteUser(authId);
                console.log(`   🧹 Deleted orphaned auth user`);
            } catch (err) {
                console.log(`   ⚠️  Could not delete: ${err.message}`);
            }
        }
    }

    // Step 2: Check current state of admin@tvk.com
    console.log('\n📝 Step 2: Checking admin@tvk.com state...');

    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail)
        .single();

    if (existingUser) {
        console.log(`   ✅ User exists in users table:`);
        console.log(`      ID: ${existingUser.id}`);
        console.log(`      Role: ${existingUser.role}`);
        console.log(`      Auth User ID: ${existingUser.auth_user_id || 'NULL'}`);

        if (existingUser.auth_user_id) {
            // Check if this auth user exists
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(existingUser.auth_user_id);

            if (authError || !authUser) {
                console.log(`   ❌ Auth user ${existingUser.auth_user_id} does NOT exist!`);
                console.log(`   🧹 Clearing invalid auth_user_id...`);

                await supabase
                    .from('users')
                    .update({ auth_user_id: null })
                    .eq('id', existingUser.id);

                console.log(`   ✅ Cleared`);
            } else {
                console.log(`   ✅ Auth user exists and is linked correctly`);
                console.log(`\n   Account is already set up!`);
                console.log(`   Email: ${targetEmail}`);
                console.log(`   You can log in with your existing password`);
                console.log(`   (or reset password if forgotten)`);
                return;
            }
        }
    }

    // Step 3: Create fresh admin account
    console.log('\n📝 Step 3: Creating fresh admin account...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: targetEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Admin',
            last_name: 'User'
        }
    });

    if (authError) {
        console.log(`   ❌ Error creating auth user: ${authError.message}`);

        if (authError.message.includes('already been registered')) {
            console.log(`\n   ⚠️  Email already registered in Supabase Auth`);
            console.log(`   This means the account exists but may not be linked properly`);
            console.log(`   Try logging in with: ${targetEmail}`);
            console.log(`   Or use password reset if you forgot the password`);
        }

        return;
    }

    console.log(`   ✅ Auth user created!`);
    console.log(`      Auth ID: ${authData.user.id}`);

    // Create or update users table
    if (existingUser) {
        console.log(`\n   📝 Updating existing users table record...`);

        const { error: updateError } = await supabase
            .from('users')
            .update({
                auth_user_id: authData.user.id,
                role: 'admin',
                is_active: true
            })
            .eq('id', existingUser.id);

        if (updateError) {
            console.log(`   ❌ Error: ${updateError.message}`);
            await supabase.auth.admin.deleteUser(authData.user.id);
            return;
        }

        console.log(`   ✅ Users table updated!`);

    } else {
        console.log(`\n   📝 Creating users table record...`);

        const userRecord = {
            auth_user_id: authData.user.id,
            email: targetEmail,
            username: 'admin',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            organization_id: '00000000-0000-0000-0000-000000000001',
            is_active: true
        };

        const { error: insertError } = await supabase
            .from('users')
            .insert(userRecord);

        if (insertError) {
            console.log(`   ❌ Error: ${insertError.message}`);
            await supabase.auth.admin.deleteUser(authData.user.id);
            return;
        }

        console.log(`   ✅ Users table record created!`);
    }

    // Success!
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! Admin Account Ready');
    console.log('='.repeat(70));
    console.log(`\n📧 Login Credentials:`);
    console.log(`   Email: ${targetEmail}`);
    console.log(`   Password: ${password}`);
    console.log(`\n✅ This account:`);
    console.log(`   - Has admin role`);
    console.log(`   - Can add voters`);
    console.log(`   - Can access all admin features`);
    console.log(`\n🚀 Next Steps:`);
    console.log(`   1. Open your application`);
    console.log(`   2. Log in with the credentials above`);
    console.log(`   3. Try adding a voter - it should work now!`);
    console.log(`\n⚠️  SAVE THESE CREDENTIALS!\n`);
}

main().catch(console.error);
