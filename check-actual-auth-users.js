/**
 * Check which accounts actually exist in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('\n🔍 ACTUAL ACCOUNTS IN SUPABASE AUTH\n');
    console.log('='.repeat(70));

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at, last_sign_in_at, confirmed_at');

    if (authError) {
        console.log('❌ Error fetching auth users:', authError);
        return;
    }

    if (!authUsers || authUsers.length === 0) {
        console.log('⚠️  No users found in auth.users table!');
        return;
    }

    console.log(`Found ${authUsers.length} account(s) that can actually log in:\n`);

    for (const authUser of authUsers) {
        console.log(`\n📧 Email: ${authUser.email}`);
        console.log(`   Auth ID: ${authUser.id}`);
        console.log(`   Created: ${authUser.created_at}`);
        console.log(`   Last Login: ${authUser.last_sign_in_at || 'Never'}`);
        console.log(`   Confirmed: ${authUser.confirmed_at ? 'Yes' : 'No'}`);

        // Check if this auth user has a matching users table record
        const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('id, email, role, auth_user_id, organization_id')
            .or(`email.eq.${authUser.email},auth_user_id.eq.${authUser.id}`)
            .single();

        if (userError || !userRecord) {
            console.log('   ❌ NOT FOUND in users table - no role assigned!');
            console.log('   → This user can log in but will default to "user" role');
        } else {
            console.log(`   ✅ Found in users table:`);
            console.log(`      - Role: ${userRecord.role}`);
            console.log(`      - Auth User ID Match: ${userRecord.auth_user_id === authUser.id ? 'YES ✅' : 'NO ❌'}`);
            console.log(`      - Can add voters: ${['admin', 'superadmin', 'manager'].includes(userRecord.role) ? 'YES ✅' : 'NO ❌'}`);

            if (userRecord.auth_user_id !== authUser.id) {
                console.log(`   ⚠️  WARNING: auth_user_id mismatch!`);
                console.log(`      users.auth_user_id: ${userRecord.auth_user_id}`);
                console.log(`      auth.users.id:      ${authUser.id}`);
            }
        }
    }

    console.log('\n\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`\nTotal accounts that can log in: ${authUsers.length}`);

    // Check each auth user
    const results = [];
    for (const authUser of authUsers) {
        const { data: userRecord } = await supabase
            .from('users')
            .select('role, auth_user_id')
            .or(`email.eq.${authUser.email},auth_user_id.eq.${authUser.id}`)
            .single();

        results.push({
            email: authUser.email,
            hasUserRecord: !!userRecord,
            role: userRecord?.role || 'user (default)',
            canAddVoters: userRecord && ['admin', 'superadmin', 'manager'].includes(userRecord.role),
            idMatch: userRecord?.auth_user_id === authUser.id
        });
    }

    const canAddVoters = results.filter(r => r.canAddVoters);
    const cannotAddVoters = results.filter(r => !r.canAddVoters);

    console.log(`\n✅ Can add voters: ${canAddVoters.length}`);
    canAddVoters.forEach(r => console.log(`   - ${r.email} (${r.role})`));

    console.log(`\n❌ Cannot add voters: ${cannotAddVoters.length}`);
    cannotAddVoters.forEach(r => {
        console.log(`   - ${r.email} (${r.role})`);
        if (!r.hasUserRecord) {
            console.log(`     → Missing users table record`);
        } else if (!r.idMatch) {
            console.log(`     → auth_user_id mismatch`);
        }
    });

    console.log('\n');
}

main().catch(console.error);
