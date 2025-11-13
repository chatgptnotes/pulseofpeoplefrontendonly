/**
 * Show all auth_user_ids in users table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('\n📋 ALL USERS WITH auth_user_id SET\n');
    console.log('='.repeat(70));

    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, username, role, auth_user_id, organization_id')
        .not('auth_user_id', 'is', null)
        .order('email');

    if (error) {
        console.log('❌ Error:', error.message);
        return;
    }

    console.log(`Found ${users.length} user(s) with auth_user_id:\n`);

    for (const user of users) {
        console.log(`Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Auth User ID: ${user.auth_user_id}`);
        console.log(`   User ID: ${user.id}`);
        console.log();
    }

    console.log('\n📋 CHECKING FOR DUPLICATE auth_user_ids:\n');

    // Group by auth_user_id
    const grouped = {};
    for (const user of users) {
        if (!grouped[user.auth_user_id]) {
            grouped[user.auth_user_id] = [];
        }
        grouped[user.auth_user_id].push(user);
    }

    let foundDuplicates = false;
    for (const [authId, usersWithThisId] of Object.entries(grouped)) {
        if (usersWithThisId.length > 1) {
            foundDuplicates = true;
            console.log(`❌ DUPLICATE: auth_user_id ${authId} used by ${usersWithThisId.length} users:`);
            usersWithThisId.forEach(u => console.log(`   - ${u.email} (${u.role})`));
            console.log();
        }
    }

    if (!foundDuplicates) {
        console.log('✅ No duplicates found\n');
    }
}

main().catch(console.error);
