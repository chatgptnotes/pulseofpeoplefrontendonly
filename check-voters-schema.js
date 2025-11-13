/**
 * Check actual voters table schema
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('\n🔍 CHECKING VOTERS TABLE SCHEMA\n');
    console.log('='.repeat(70));

    // Get a sample voter to see the actual columns
    const { data: sampleVoter, error } = await supabase
        .from('voters')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.log('❌ Error fetching sample voter:', error.message);
        console.log('\nTrying to get just the first row...');

        const { data: voters, error: error2 } = await supabase
            .from('voters')
            .select('*')
            .limit(1);

        if (error2 || !voters || voters.length === 0) {
            console.log('❌ No voters found or error:', error2?.message);
            console.log('\nCannot determine schema without sample data.');
            console.log('Try adding a voter with minimal fields first.');
            return;
        }

        console.log('\n✅ Found sample voter data!');
        console.log('\nActual columns in voters table:\n');

        const columns = Object.keys(voters[0]);
        columns.forEach((col, idx) => {
            const value = voters[0][col];
            const type = typeof value;
            console.log(`${idx + 1}. ${col.padEnd(30)} (${type}) = ${value}`);
        });

        return;
    }

    console.log('✅ Sample voter found!\n');
    console.log('Actual columns in voters table:\n');

    const columns = Object.keys(sampleVoter);
    columns.forEach((col, idx) => {
        const value = sampleVoter[col];
        const type = typeof value;
        console.log(`${idx + 1}. ${col.padEnd(30)} (${type}) = ${value}`);
    });

    console.log('\n\n' + '='.repeat(70));
    console.log('COMPARISON: Form expects vs Database has');
    console.log('='.repeat(70));

    const formFields = {
        'first_name': 'First name (from splitting full name)',
        'last_name': 'Last name (from splitting full name)',
        'age': 'Age',
        'gender': 'Gender',
        'voter_id': 'Voter ID card number',
        'phone': 'Phone number',
        'email': 'Email',
        'address_line1': 'Address',
        'ward': 'Constituency',
        'booth_number': 'Booth number',
        'caste': 'Caste',
        'religion': 'Religion',
        'education': 'Education',
        'occupation': 'Occupation',
        'tags': 'Political interests',
        'sentiment': 'Sentiment',
        'party_affiliation': 'Party affiliation',
        'is_active': 'Active status',
        'is_verified': 'Verified status'
    };

    console.log('\nForm is trying to save these fields:');
    for (const [field, desc] of Object.entries(formFields)) {
        const exists = columns.includes(field);
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${field.padEnd(25)} - ${desc}`);
    }

    console.log('\n\nColumns in database NOT used by form:');
    const unusedColumns = columns.filter(col => !Object.keys(formFields).includes(col));
    unusedColumns.forEach(col => {
        console.log(`   • ${col}`);
    });

    console.log('\n');
}

main().catch(console.error);
