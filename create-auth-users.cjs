const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iwtgbseaoztjbnvworyq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGdic2Vhb3p0amJudndvcnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjAzOTksImV4cCI6MjA3NjczNjM5OX0.xA4B0XZJE_4MdjFCkw2yVsf4vlHmHfpeV6Bk5tG2T94';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUsers = [
  { email: 'admin@tvk.com', password: 'Admin@123456', name: 'TVK Super Admin', role: 'superadmin' },
  { email: 'user@tvk.com', password: 'User@123456', name: 'Field Worker', role: 'user' },
  { email: 'test@pulseofpeople.com', password: 'TestPassword123!', name: 'Test User', role: 'admin' },
];

async function createAuthUsers() {
  console.log('🔧 Creating Supabase Auth accounts for existing users...\n');

  for (const user of testUsers) {
    console.log(`Creating auth for: ${user.email}`);

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: user.name,
          role: user.role,
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`  ✅ Auth account already exists`);
      } else {
        console.log(`  ❌ Error: ${authError.message}`);
        continue;
      }
    } else {
      console.log(`  ✅ Auth account created`);
    }

    // Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user.email)
      .single();

    if (checkError || !existingUser) {
      console.log(`  ℹ️  No user record in database yet`);
    } else {
      console.log(`  ✅ User record exists in database`);
    }

    console.log('');
  }

  console.log('='.repeat(70));
  console.log('✅ AUTHENTICATION SETUP COMPLETE');
  console.log('='.repeat(70));
  console.log('\nYou can now login with any of these accounts:\n');
  testUsers.forEach(u => {
    console.log(`📧 ${u.email}`);
    console.log(`🔑 ${u.password}`);
    console.log(`👤 Role: ${u.role}\n`);
  });
  console.log('='.repeat(70));
}

createAuthUsers().catch(console.error);
