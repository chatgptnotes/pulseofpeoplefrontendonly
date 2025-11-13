/**
 * Simple fix: Just verify bhuppendrabalapure@gmail.com is properly set up
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    const email = 'bhuppendrabalapure@gmail.com';

    console.log('\n🔍 CHECKING bhuppendrabalapure@gmail.com\n');
    console.log('='.repeat(70));

    // Check users table
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (!user) {
        console.log('❌ Not found in users table!');
        return;
    }

    console.log('✅ Found in users table:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Auth User ID: ${user.auth_user_id}`);
    console.log(`   Organization: ${user.organization_id}`);

    if (user.role === 'admin' && user.auth_user_id) {
        console.log('\n✅ ACCOUNT IS PROPERLY CONFIGURED!');
        console.log('\n📧 TO USE THIS ACCOUNT:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: (your password)`);
        console.log('\n💡 If you forgot password:');
        console.log(`   1. Logout`);
        console.log(`   2. Click "Forgot Password" on login page`);
        console.log(`   3. Enter: ${email}`);
        console.log(`   4. Check email for reset link`);
    }

    console.log('\n');
}

main().catch(console.error);
