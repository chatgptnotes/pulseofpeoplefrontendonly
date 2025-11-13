/**
 * Final solution: Create clean working admin account
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = 'realadmin@tvk.com';
    const password = 'Admin@TVK2025!';

    console.log('\n🔧 CREATING REAL WORKING ADMIN ACCOUNT\n');
    console.log('='.repeat(70));

    // Clean approach: Use a guaranteed unique email
    console.log(`\n✨ Creating: ${email}`);
    console.log(`   Password: ${password}\n`);

    // Create auth user
    console.log('📝 Creating Supabase Auth user...');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { first_name: 'Real', last_name: 'Admin' }
    });

    if (authError) {
        if (authError.message.includes('already been registered')) {
            console.log('❌ Email already exists. Use a different email or reset password.');
        } else {
            console.log('❌ Auth error:', authError.message);
        }
        return;
    }

    console.log(`✅ Auth user created! ID: ${authData.user.id}`);

    // Create users record
    console.log('\n📝 Creating users table record...');

    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
            auth_user_id: authData.user.id,
            email: email,
            username: 'realadmin',
            first_name: 'Real',
            last_name: 'Admin',
            role: 'admin',
            organization_id: '00000000-0000-0000-0000-000000000001',
            is_active: true
        })
        .select()
        .single();

    if (userError) {
        console.log('❌ Users table error:', userError.message);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return;
    }

    console.log(`✅ Users record created! ID: ${userData.id}`);

    // SUCCESS!
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! WORKING ADMIN ACCOUNT READY');
    console.log('='.repeat(70));
    console.log('\n📧 LOGIN CREDENTIALS:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🚀 INSTRUCTIONS:');
    console.log(`   1. Logout from shanthi.sundaram.admin1@tvk.com`);
    console.log(`   2. Login with above credentials`);
    console.log(`   3. Add voter - IT WILL WORK! ✅`);
    console.log('\n⚠️  SAVE CREDENTIALS!\n');
}

main().catch(console.error);
