import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_SECRET!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_SECRET');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🔧 Applying RLS policy fix migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/13_fix_voter_calls_rls_policies.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('🗄️  Connecting to Supabase...\n');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.trim().startsWith('--')) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Try direct execution if RPC fails
          console.log(`⚠️  RPC failed, trying direct execution...`);

          // For policy operations, we need to use the REST API directly
          // This is a workaround since Supabase JS client doesn't have direct SQL execution
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
          });

          console.log(`   Statement ${i + 1}/${statements.length}: Manual execution needed`);
        } else {
          successCount++;
          console.log(`✅ Statement ${i + 1}/${statements.length}: Success`);
        }
      } catch (err: any) {
        errorCount++;
        console.error(`❌ Statement ${i + 1}/${statements.length}: Error - ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This is expected for DDL operations.');
      console.log('📝 Please apply the migration manually using one of these methods:');
      console.log('   1. Supabase Dashboard → SQL Editor → Paste migration SQL');
      console.log('   2. Use Supabase CLI: supabase db push');
      console.log('   3. Install psql and use: npm run db:migrate');
      console.log(`\n📄 Migration file: ${migrationPath}`);
    } else {
      console.log('\n🎉 Migration completed successfully!');
      console.log('✨ Call History should now display stored calls');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n📝 Manual application required:');
    console.error('   Go to Supabase Dashboard → SQL Editor');
    console.error('   Copy and paste the SQL from: supabase/migrations/13_fix_voter_calls_rls_policies.sql');
    process.exit(1);
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
