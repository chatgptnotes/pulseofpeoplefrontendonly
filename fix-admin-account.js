/**
 * Fix or create admin@tvk.com account
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

    console.log('\n🔍 Checking existing admin@tvk.com setup...\n');

    // Check users table
    const { data: userRecords } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail);

    if (userRecords && userRecords.length > 0) {
        console.log(`✅ Found ${userRecords.length} record(s) in users table:`);
        userRecords.forEach((user, idx) => {
            console.log(`\n${idx + 1}. User ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Auth User ID: ${user.auth_user_id || 'NULL'}`);
            console.log(`   Username: ${user.username}`);
        });

        const userRecord = userRecords[0];

        if (userRecord.auth_user_id) {
            console.log('\n📝 User already has auth_user_id. Checking if it exists in Auth...');

            // Try to get the auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userRecord.auth_user_id);

            if (authError || !authUser) {
                console.log('❌ Auth user does NOT exist. Creating new auth user...');

                // Create new auth user
                const { data: newAuthData, error: newAuthError } = await supabase.auth.admin.createUser({
                    email: targetEmail,
                    password: password,
                    email_confirm: true,
                    user_metadata: {
                        first_name: userRecord.first_name || 'Admin',
                        last_name: userRecord.last_name || 'User'
                    }
                });

                if (newAuthError) {
                    console.log('❌ Error creating auth user:', newAuthError.message);
                    return;
                }

                console.log('✅ New auth user created!');
                console.log(`   Auth ID: ${newAuthData.user.id}`);

                // Update users table with new auth_user_id
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        auth_user_id: newAuthData.user.id,
                        role: 'admin', // Ensure admin role
                        is_active: true
                    })
                    .eq('id', userRecord.id);

                if (updateError) {
                    console.log('❌ Error updating users table:', updateError.message);
                    return;
                }

                console.log('✅ Users table updated with new auth_user_id');

                console.log('\n' + '='.repeat(70));
                console.log('🎉 SUCCESS! Account Fixed');
                console.log('='.repeat(70));
                console.log(`\n📧 Email: ${targetEmail}`);
                console.log(`   Password: ${password}`);
                console.log('\n✅ You can now log in with these credentials!\n');

            } else {
                console.log('✅ Auth user exists!');
                console.log(`   Auth ID: ${authUser.user.id}`);
                console.log(`   Email: ${authUser.user.email}`);

                // Update role to admin if needed
                if (userRecord.role !== 'admin') {
                    console.log('\n📝 Updating role to admin...');

                    const { error: roleError } = await supabase
                        .from('users')
                        .update({ role: 'admin', is_active: true })
                        .eq('id', userRecord.id);

                    if (roleError) {
                        console.log('❌ Error updating role:', roleError.message);
                    } else {
                        console.log('✅ Role updated to admin!');
                    }
                }

                console.log('\n' + '='.repeat(70));
                console.log('✅ Account Already Set Up');
                console.log('='.repeat(70));
                console.log(`\n📧 Email: ${targetEmail}`);
                console.log('   Password: (already set - use existing password)');
                console.log('\n⚠️  If you forgot the password, you can reset it via the forgot password flow');
                console.log('   Or I can update it to: ' + password);
                console.log('\n');
            }
        } else {
            console.log('\n❌ User record has NO auth_user_id. Creating auth user and linking...');

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: targetEmail,
                password: password,
                email_confirm: true,
                user_metadata: {
                    first_name: userRecord.first_name || 'Admin',
                    last_name: userRecord.last_name || 'User'
                }
            });

            if (authError) {
                console.log('❌ Error creating auth user:', authError.message);
                return;
            }

            console.log('✅ Auth user created!');
            console.log(`   Auth ID: ${authData.user.id}`);

            // Update users table
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    auth_user_id: authData.user.id,
                    role: 'admin',
                    is_active: true
                })
                .eq('id', userRecord.id);

            if (updateError) {
                console.log('❌ Error updating users table:', updateError.message);
                return;
            }

            console.log('✅ Users table updated!');

            console.log('\n' + '='.repeat(70));
            console.log('🎉 SUCCESS! Account Created and Linked');
            console.log('='.repeat(70));
            console.log(`\n📧 Email: ${targetEmail}`);
            console.log(`   Password: ${password}`);
            console.log('\n✅ You can now log in with these credentials!\n');
        }

    } else {
        console.log('❌ No user record found for admin@tvk.com');
        console.log('   Creating completely new account...\n');

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
            console.log('❌ Error creating auth user:', authError.message);
            return;
        }

        console.log('✅ Auth user created!');
        console.log(`   Auth ID: ${authData.user.id}`);

        // Create users table record
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

        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert(userRecord)
            .select()
            .single();

        if (userError) {
            console.log('❌ Error creating users record:', userError.message);
            await supabase.auth.admin.deleteUser(authData.user.id);
            return;
        }

        console.log('✅ Users record created!');

        console.log('\n' + '='.repeat(70));
        console.log('🎉 SUCCESS! New Account Created');
        console.log('='.repeat(70));
        console.log(`\n📧 Email: ${targetEmail}`);
        console.log(`   Password: ${password}`);
        console.log('\n✅ You can now log in with these credentials!\n');
    }
}

main().catch(console.error);
