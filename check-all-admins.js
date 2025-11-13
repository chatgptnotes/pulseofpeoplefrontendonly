/**
 * Check all admin accounts for permission issues
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUser(userEmail) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Checking: ${userEmail}`);
    console.log('='.repeat(70));

    // Check users table
    const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, email, role, auth_user_id, organization_id')
        .eq('email', userEmail)
        .single();

    if (userError || !userRecord) {
        console.log('❌ NOT FOUND in users table');
        return { email: userEmail, issue: 'NOT_FOUND_IN_USERS', status: 'BROKEN' };
    }

    console.log(`✅ Found in users table:`);
    console.log(`   Role: ${userRecord.role}`);
    console.log(`   Auth User ID: ${userRecord.auth_user_id || 'NULL ❌'}`);
    console.log(`   Organization: ${userRecord.organization_id || 'NULL'}`);

    if (!userRecord.auth_user_id) {
        console.log('\n❌ ISSUE: auth_user_id is NULL - get_current_user_role() will fail!');
        return { email: userEmail, issue: 'AUTH_USER_ID_NULL', userRecord, status: 'BROKEN' };
    }

    // Check auth.users table
    const { data: authRecords, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', userEmail);

    if (authError || !authRecords || authRecords.length === 0) {
        console.log('❌ NOT FOUND in auth.users table');
        return { email: userEmail, issue: 'NOT_FOUND_IN_AUTH', userRecord, status: 'BROKEN' };
    }

    const authRecord = authRecords[0];
    console.log(`✅ Found in auth.users table:`);
    console.log(`   Auth ID: ${authRecord.id}`);

    // Compare IDs
    if (userRecord.auth_user_id === authRecord.id) {
        console.log(`\n✅ STATUS: WORKING - IDs match, role is ${userRecord.role}`);
        return { email: userEmail, issue: 'NONE', userRecord, authRecord, status: 'WORKING' };
    } else {
        console.log(`\n❌ ISSUE: ID MISMATCH!`);
        console.log(`   users.auth_user_id: ${userRecord.auth_user_id}`);
        console.log(`   auth.users.id:      ${authRecord.id}`);
        return { email: userEmail, issue: 'ID_MISMATCH', userRecord, authRecord, status: 'BROKEN' };
    }
}

async function main() {
    console.log('\n🔍 CHECKING ALL ADMIN ACCOUNTS FOR PERMISSION ISSUES\n');

    // Get all admin/superadmin users
    const { data: admins, error } = await supabase
        .from('users')
        .select('email, role')
        .in('role', ['admin', 'superadmin', 'manager'])
        .order('email');

    if (error || !admins) {
        console.log('❌ Error fetching admins:', error);
        return;
    }

    console.log(`Found ${admins.length} admin/manager users to check...\n`);

    const results = [];
    for (const admin of admins) {
        const result = await checkUser(admin.email);
        results.push(result);
    }

    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));

    const broken = results.filter(r => r.status === 'BROKEN');
    const working = results.filter(r => r.status === 'WORKING');

    console.log(`\n✅ WORKING: ${working.length} accounts`);
    working.forEach(r => console.log(`   - ${r.email}`));

    console.log(`\n❌ BROKEN: ${broken.length} accounts`);
    broken.forEach(r => {
        console.log(`   - ${r.email}: ${r.issue}`);
    });

    if (broken.length > 0) {
        console.log('\n\n🔧 RECOMMENDED FIXES:');
        broken.forEach((r, idx) => {
            console.log(`\n${idx + 1}. ${r.email}:`);
            if (r.issue === 'AUTH_USER_ID_NULL' && r.userRecord) {
                console.log(`   UPDATE users SET auth_user_id = (SELECT id FROM auth.users WHERE email = '${r.email}') WHERE id = '${r.userRecord.id}';`);
            } else if (r.issue === 'ID_MISMATCH' && r.userRecord && r.authRecord) {
                console.log(`   UPDATE users SET auth_user_id = '${r.authRecord.id}' WHERE id = '${r.userRecord.id}';`);
            }
        });
    } else {
        console.log('\n✅ All admin accounts look correct!');
        console.log('\nIf you\'re still getting permission denied, the issue may be:');
        console.log('   1. User needs to log out and log back in');
        console.log('   2. Frontend not sending auth token correctly');
        console.log('   3. Session expired');
        console.log('   4. RLS function get_current_user_role() has issues');
    }

    console.log('\n');
}

main().catch(console.error);
