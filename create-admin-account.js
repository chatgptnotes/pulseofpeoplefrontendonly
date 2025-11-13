/**
 * Create a new admin account in Supabase Auth
 * This will create both the auth user and users table record
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

// Create Supabase client with service role (admin privileges)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminAccount(email, password, firstName, lastName) {
    console.log('\n🔧 Creating Admin Account');
    console.log('='.repeat(70));
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log('Role: admin');
    console.log();

    // Step 1: Create auth user
    console.log('📝 Step 1: Creating user in Supabase Auth...');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
            first_name: firstName,
            last_name: lastName
        }
    });

    if (authError) {
        console.log('❌ Error creating auth user:', authError);
        return null;
    }

    console.log('✅ Auth user created successfully!');
    console.log(`   Auth ID: ${authData.user.id}`);

    // Step 2: Create users table record
    console.log('\n📝 Step 2: Creating record in users table...');

    const username = email.split('@')[0];
    const userRecord = {
        auth_user_id: authData.user.id,
        email: email,
        username: username,
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        organization_id: '00000000-0000-0000-0000-000000000001', // Default org
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single();

    if (userError) {
        console.log('❌ Error creating users record:', userError);
        console.log('   Cleaning up auth user...');

        // Try to delete the auth user we just created
        await supabase.auth.admin.deleteUser(authData.user.id);

        return null;
    }

    console.log('✅ Users record created successfully!');
    console.log(`   User ID: ${userData.id}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Organization: ${userData.organization_id}`);

    // Step 3: Verify linkage
    console.log('\n📝 Step 3: Verifying linkage...');

    const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();

    if (verifyError || !verifyData) {
        console.log('⚠️  Warning: Could not verify linkage');
    } else {
        console.log('✅ Linkage verified!');
        console.log(`   users.auth_user_id = ${verifyData.auth_user_id}`);
        console.log(`   auth.users.id = ${authData.user.id}`);
        console.log(`   Match: ${verifyData.auth_user_id === authData.user.id ? 'YES ✅' : 'NO ❌'}`);
    }

    return {
        authUser: authData.user,
        userRecord: userData,
        email: email,
        password: password
    };
}

async function main() {
    console.log('\n✨ CREATE NEW ADMIN ACCOUNT\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

    try {
        const email = await askQuestion('Enter email for new admin account: ');

        if (!email || !email.includes('@')) {
            console.log('❌ Invalid email address');
            rl.close();
            return;
        }

        const password = await askQuestion('Enter password (min 6 characters): ');

        if (!password || password.length < 6) {
            console.log('❌ Password must be at least 6 characters');
            rl.close();
            return;
        }

        const firstName = await askQuestion('Enter first name: ');
        const lastName = await askQuestion('Enter last name: ');

        console.log('\n');
        const confirm = await askQuestion('Create this admin account? (yes/no): ');

        if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
            console.log('❌ Cancelled');
            rl.close();
            return;
        }

        const result = await createAdminAccount(email, password, firstName, lastName);

        if (result) {
            console.log('\n' + '='.repeat(70));
            console.log('🎉 SUCCESS! Admin Account Created');
            console.log('='.repeat(70));
            console.log('\n📧 Login Credentials:');
            console.log(`   Email: ${result.email}`);
            console.log(`   Password: ${result.password}`);
            console.log('\n✅ This account can now:');
            console.log('   - Log in to the application');
            console.log('   - Add voters (has admin role)');
            console.log('   - Access all admin features');
            console.log('\n⚠️  Save these credentials securely!');
            console.log('\n🚀 Next steps:');
            console.log('   1. Go to your application login page');
            console.log('   2. Log in with the above credentials');
            console.log('   3. Try adding a voter - it should work now!');
            console.log();
        } else {
            console.log('\n❌ Failed to create admin account');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

main();
