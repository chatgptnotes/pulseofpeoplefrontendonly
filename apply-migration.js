import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials from .env
const supabaseUrl = 'https://eepwbydlfecosaqdysho.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHdieWRsZmVjb3NhcWR5c2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0MDc4NCwiZXhwIjoyMDc4NDE2Nzg0fQ.bPLDbHaKvgZxgWAtViJLOrPFSyS5PkbKjK2csCkyPSg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('========================================');
    console.log('Sentiment Reports Migration');
    console.log('========================================\n');

    console.log('Reading combined migration file...');
    const migrationPath = join(__dirname, 'apply_all_migrations.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('\n⚠️  SQL migrations must be run in Supabase Dashboard for security.');
    console.log('\nFOLLOW THESE STEPS:\n');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/eepwbydlfecosaqdysho/sql\n');
    console.log('2. Copy the entire SQL below:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n3. Paste into SQL Editor and click RUN\n');
    console.log('4. Verify success: You should see "10 sentiment reports" in results\n');
    console.log('5. Refresh your Reports page at http://localhost:5173/reports\n');
    console.log('✓ The "Failed to load preview data" error should be fixed!\n');

    // Check if we can verify the current state
    console.log('Checking current database state...');
    const { data: reports, error } = await supabase
      .from('tvk_sentiment_reports')
      .select('id, report_date, overall_sentiment_score')
      .order('report_date', { ascending: false })
      .limit(5);

    if (error) {
      console.log('⚠️  Unable to query sentiment reports:', error.message);
      console.log('   This confirms migration is needed.\n');
    } else if (reports && reports.length > 0) {
      console.log(`✓ Found ${reports.length} existing sentiment reports.`);
      console.log('   Migration may already be applied. Check Reports page.\n');
    } else {
      console.log('⚠️  No sentiment reports found.');
      console.log('   Please apply the migration above.\n');
    }

  } catch (err) {
    console.error('Error:', err.message);
    console.log('\nMANUAL MIGRATION REQUIRED:');
    console.log('URL: https://supabase.com/dashboard/project/eepwbydlfecosaqdysho/sql');
    console.log('File: apply_all_migrations.sql\n');
  }
}

applyMigration();
