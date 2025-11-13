/**
 * Run migration to add booth column
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://eepwbydlfecosaqdysho.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('\n🔧 RUNNING MIGRATION: Add booth column\n');
    console.log('='.repeat(70));

    // Read migration file
    const migrationSQL = readFileSync('./supabase/migrations/09_add_booth_column.sql', 'utf-8');

    console.log('📝 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(70));

    console.log('\n📝 Executing migration...\n');

    // Execute each statement
    const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        if (!statement) continue;

        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
            // Try direct query instead
            console.log(`   Trying direct execution...`);

            const { error: directError } = await supabase
                .from('_sql')
                .select('*')
                .limit(0);

            // Since we can't execute raw SQL via the API easily, let's use a workaround
            // We'll just report that manual execution is needed
            console.log(`   ⚠️  Cannot execute SQL via API`);
            console.log(`   The migration needs to be run manually or via Supabase CLI`);
            break;
        } else {
            console.log(`   ✅ Done`);
        }
    }

    console.log('\n📝 Verifying booth column exists...\n');

    // Try to query a voter and see if booth_number field is present
    const { data: sampleVoter, error: queryError } = await supabase
        .from('voters')
        .select('id, voter_id, booth_number')
        .limit(1)
        .single();

    if (queryError && !queryError.message.includes('multiple')) {
        console.log('❌ Error querying voters table:', queryError.message);

        if (queryError.message.includes('booth_number')) {
            console.log('\n⚠️  booth_number column does NOT exist yet');
            console.log('\n📋 MANUAL MIGRATION REQUIRED:');
            console.log('   1. Go to Supabase Dashboard > SQL Editor');
            console.log('   2. Run the following SQL:\n');
            console.log(migrationSQL);
            console.log('\n   3. Then come back and test the form');
        }
    } else {
        console.log('✅ booth_number column exists!');
        console.log(`   Sample query successful: ${sampleVoter ? 'Data found' : 'No data yet'}`);
    }

    console.log('\n');
}

main().catch(console.error);
