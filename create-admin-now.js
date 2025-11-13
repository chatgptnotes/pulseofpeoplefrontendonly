/**
 * Create admin@tvk.com account immediately
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

async function createAdminAccount() {
    const email = 'admin@tvk.com';
    const password = 'Admin@TVK2025'; // Secure password
    const firstName = 'Admin';
    const lastName = 'User';

    console.log('\n🔧 Creating Admin Account');
    console.log('='.repeat(70));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log('Role: admin');
    console.log();

    // Step 1: Check if auth user already exists
    console.log('📝 Checking if user already exists...');

    const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    if (existingUsers && existingUsers.length > 0) {
        console.log('⚠️  User already exists in users table');
        console.log('   Checking auth status...');

        // Check if we need to create auth user only
        const existingUser = existingUsers[0];
        if (!existingUser.auth_user_id) {
            console.log('   Creating auth user and linking...');

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
                return null;
            }

            // Update users table with auth_user_id
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    auth_user_id: authData.user.id,
                    role: 'admin'
                })
                .eq('id', existingUser.id);

            if (updateError) {
                console.log('❌ Error linking auth user:', updateError.message);
                return null;
            }

            console.log('✅ Auth user created and linked!');
            return { email, password, authUserId: authData.user.id };
        } else {
            console.log('✅ User already fully configured');
            console.log(`   Try logging in with: ${email}`);
            return { email, password: '(already set)', authUserId: existingUser.auth_user_id };
        }
    }

    // Step 1: Create auth user
    console.log('📝 Step 1: Creating user in Supabase Auth...');

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

        if (authError.message.includes('already registered')) {
            console.log('\n⚠️  This email is already registered in Supabase Auth');
            console.log('   Fetching the existing user...');

            // Try to get user by email (this might not work with service role)
            console.log('   You may need to reset the password for this account');
            return null;
        }

        return null;
    }

    console.log('✅ Auth user created successfully!');
    console.log(`   Auth ID: ${authData.user.id}`);

    // Step 2: Create users table record
    console.log('\n📝 Step 2: Creating record in users table...');

    const username = 'admin';
    const userRecord = {
        auth_user_id: authData.user.id,
        email: email,
        username: username,
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
        console.log('   Cleaning up auth user...');
        await supabase.auth.admin.deleteUser(authData.user.id);
        return null;
    }

    console.log('✅ Users record created successfully!');
    console.log(`   User ID: ${userData.id}`);
    console.log(`   Role: ${userData.role}`);

    // Step 3: Verify
    console.log('\n📝 Step 3: Verifying linkage...');

    const { data: verifyData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();

    if (verifyData && verifyData.auth_user_id === authData.user.id) {
        console.log('✅ Linkage verified!');
    } else {
        console.log('⚠️  Could not verify linkage');
    }

    return { email, password, authUserId: authData.user.id, userId: userData.id };
}

async function main() {
    console.log('\n✨ CREATE ADMIN ACCOUNT: admin@tvk.com\n');

    const result = await createAdminAccount();

    if (result) {
        console.log('\n' + '='.repeat(70));
        console.log('🎉 SUCCESS! Admin Account Ready');
        console.log('='.repeat(70));
        console.log('\n📧 Login Credentials:');
        console.log(`   Email: ${result.email}`);
        console.log(`   Password: ${result.password}`);
        console.log('\n✅ This account can now:');
        console.log('   - Log in to the application');
        console.log('   - Add voters (has admin role)');
        console.log('   - Access all admin features');
        console.log('\n🚀 Next Steps:');
        console.log('   1. Go to your application login page');
        console.log('   2. Log in with the credentials above');
        console.log('   3. Try adding a voter - it should work!');
        console.log('\n⚠️  SAVE THESE CREDENTIALS!\n');
    } else {
        console.log('\n❌ Failed to create admin account\n');
        process.exit(1);
    }
}

main().catch(console.error);
