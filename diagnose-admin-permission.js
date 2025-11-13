/**
 * Diagnostic Script: Why is Admin Getting Permission Denied?
 * This script checks auth, user records, and RLS function
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnoseAdminPermission(userEmail) {
    console.log('\n🔍 DIAGNOSTIC REPORT: Admin Permission Error');
    console.log('='.repeat(70));
    console.log(`Target User: ${userEmail}\n`);

    // Step 1: Check users table
    console.log('📋 Step 1: Checking users table...');
    const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, email, username, role, auth_user_id, organization_id, created_at')
        .eq('email', userEmail)
        .single();

    if (userError || !userRecord) {
        console.log('❌ ERROR: User not found in users table!');
        console.log('   This explains the permission error.');
        console.log('   Error:', userError);
        return { issue: 'USER_NOT_FOUND', userRecord: null, authRecord: null };
    }

    console.log('✅ User found in users table:');
    console.log(`   - ID: ${userRecord.id}`);
    console.log(`   - Role: ${userRecord.role}`);
    console.log(`   - Auth User ID: ${userRecord.auth_user_id || 'NULL (PROBLEM!)'}`);
    console.log(`   - Organization: ${userRecord.organization_id || 'NULL'}`);
    console.log(`   - Created: ${userRecord.created_at}`);

    if (!userRecord.auth_user_id) {
        console.log('\n❌ CRITICAL: auth_user_id is NULL!');
        console.log('   This means get_current_user_role() cannot match this user.');
        console.log('   Solution: Update auth_user_id with the Supabase Auth user ID.');
        return { issue: 'AUTH_USER_ID_NULL', userRecord, authRecord: null };
    }

    // Step 2: Check auth.users table
    console.log('\n📋 Step 2: Checking auth.users table...');
    const { data: authRecord, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at, last_sign_in_at')
        .eq('email', userEmail)
        .single();

    if (authError || !authRecord) {
        console.log('❌ ERROR: User not found in auth.users table!');
        console.log('   The user cannot authenticate.');
        console.log('   Error:', authError);
        return { issue: 'AUTH_USER_NOT_FOUND', userRecord, authRecord: null };
    }

    console.log('✅ Auth user found:');
    console.log(`   - Auth ID: ${authRecord.id}`);
    console.log(`   - Email: ${authRecord.email}`);
    console.log(`   - Created: ${authRecord.created_at}`);
    console.log(`   - Last Sign In: ${authRecord.last_sign_in_at || 'Never'}`);

    // Step 3: Compare auth_user_id
    console.log('\n📋 Step 3: Comparing IDs...');
    if (userRecord.auth_user_id === authRecord.id) {
        console.log('✅ auth_user_id matches! IDs are in sync.');
    } else {
        console.log('❌ MISMATCH: auth_user_id does NOT match!');
        console.log(`   users.auth_user_id: ${userRecord.auth_user_id}`);
        console.log(`   auth.users.id:      ${authRecord.id}`);
        console.log('   Solution: Update users.auth_user_id to match auth.users.id');
        return { issue: 'ID_MISMATCH', userRecord, authRecord };
    }

    // Step 4: Test get_current_user_role function
    console.log('\n📋 Step 4: Testing get_current_user_role() function...');
    try {
        const { data: roleTest, error: roleError } = await supabase
            .rpc('get_current_user_role');

        if (roleError) {
            console.log('❌ ERROR calling get_current_user_role():');
            console.log('   ', roleError);
        } else {
            console.log(`✅ Function returned: "${roleTest}"`);
            if (roleTest !== userRecord.role) {
                console.log(`❌ WARNING: Returned role "${roleTest}" doesn't match expected "${userRecord.role}"`);
            }
        }
    } catch (err) {
        console.log('❌ ERROR: Function may not exist or has issues:', err.message);
    }

    // Step 5: Check RLS policies
    console.log('\n📋 Step 5: Checking RLS policies on voters table...');
    const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'voters')
        .ilike('policyname', '%create%');

    if (policyError) {
        console.log('❌ Could not check policies:', policyError.message);
    } else if (!policies || policies.length === 0) {
        console.log('❌ WARNING: No INSERT policies found for voters table!');
    } else {
        console.log(`✅ Found ${policies.length} INSERT policy(ies):`);
        policies.forEach(p => {
            console.log(`   - ${p.policyname} (${p.cmd})`);
        });
    }

    // Step 6: Try to insert as this user
    console.log('\n📋 Step 6: Testing voter INSERT with user\'s auth...');
    console.log('⚠️  This test will use the service role (bypasses RLS).');
    console.log('   Real test must be done from frontend with user session.\n');

    // Summary
    console.log('\n📊 SUMMARY:');
    if (userRecord.role === 'admin' || userRecord.role === 'superadmin') {
        console.log('✅ User has correct role for voter creation');
    } else {
        console.log(`❌ User role is "${userRecord.role}", not admin/superadmin`);
    }

    if (userRecord.auth_user_id === authRecord.id) {
        console.log('✅ Auth IDs match correctly');
    } else {
        console.log('❌ Auth IDs DO NOT match - this is likely the problem!');
    }

    console.log('\n🎯 RECOMMENDATION:');
    if (!userRecord.auth_user_id) {
        console.log('   Fix: Update auth_user_id in users table');
        return { issue: 'AUTH_USER_ID_NULL', userRecord, authRecord, needsFix: true };
    } else if (userRecord.auth_user_id !== authRecord.id) {
        console.log('   Fix: Update auth_user_id to match auth.users.id');
        return { issue: 'ID_MISMATCH', userRecord, authRecord, needsFix: true };
    } else if (userRecord.role !== 'admin' && userRecord.role !== 'superadmin' && userRecord.role !== 'manager') {
        console.log('   Fix: Update user role to admin, superadmin, or manager');
        return { issue: 'WRONG_ROLE', userRecord, authRecord, needsFix: true };
    } else {
        console.log('   User setup looks correct. Issue may be:');
        console.log('   - Session not valid (user needs to log out and back in)');
        console.log('   - RLS function not working correctly');
        console.log('   - Frontend not sending auth token');
        return { issue: 'UNKNOWN', userRecord, authRecord, needsFix: false };
    }
}

async function fixAuthUserId(userId, authUserId) {
    console.log(`\n🔧 Fixing auth_user_id for user ${userId}...`);

    const { data, error } = await supabase
        .from('users')
        .update({ auth_user_id: authUserId })
        .eq('id', userId)
        .select();

    if (error) {
        console.log('❌ Error updating auth_user_id:', error);
        return false;
    }

    console.log('✅ auth_user_id updated successfully!');
    console.log('   User must log out and log back in for changes to take effect.');
    return true;
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n🔧 Admin Permission Diagnostic Tool');
    console.log('='.repeat(70));

    // List admin users
    console.log('\n📋 Admin users in database:');
    const { data: admins } = await supabase
        .from('users')
        .select('email, username, role')
        .in('role', ['admin', 'superadmin'])
        .order('email');

    if (admins) {
        admins.forEach((admin, idx) => {
            console.log(`${idx + 1}. ${admin.email} (${admin.role})`);
        });
    }

    rl.question('\n❓ Enter the admin email experiencing the permission error: ', async (email) => {
        if (!email || !email.includes('@')) {
            console.log('❌ Invalid email');
            rl.close();
            return;
        }

        const result = await diagnoseAdminPermission(email.trim());

        if (result.needsFix && result.issue === 'ID_MISMATCH') {
            rl.question('\n❓ Fix the auth_user_id mismatch? (yes/no): ', async (answer) => {
                if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                    await fixAuthUserId(result.userRecord.id, result.authRecord.id);
                }
                rl.close();
            });
        } else if (result.needsFix && result.issue === 'AUTH_USER_ID_NULL') {
            rl.question('\n❓ Set the auth_user_id? (yes/no): ', async (answer) => {
                if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                    await fixAuthUserId(result.userRecord.id, result.authRecord.id);
                }
                rl.close();
            });
        } else {
            rl.close();
        }
    });
}

main().catch(console.error);
