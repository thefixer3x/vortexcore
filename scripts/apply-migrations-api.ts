#!/usr/bin/env bun
/**
 * Apply migrations using Supabase REST API
 * This script reads migration files and applies them to the database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 APPLYING MIGRATIONS VIA SUPABASE API');
console.log('==========================================\n');

async function applyMigration(filePath: string, description: string) {
  console.log(`📝 ${description}...`);

  try {
    const sql = readFileSync(filePath, 'utf-8');

    // Try to execute via RPC if available, otherwise provide instructions
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // If exec_sql doesn't exist, we need manual application
      if (error.code === 'PGRST202') {
        console.log('⚠️  Direct SQL execution not available via API');
        console.log('');
        console.log('📋 Please apply this migration manually:');
        console.log('━'.repeat(60));
        console.log(sql);
        console.log('━'.repeat(60));
        console.log('');
        console.log('Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/sql');
        console.log('Copy the SQL above and click "Run"');
        console.log('');
        return false;
      }

      console.error(`❌ Error: ${error.message}`);
      return false;
    }

    console.log('✅ Migration applied successfully!\n');
    return true;
  } catch (err) {
    console.error(`❌ Error reading file: ${err}`);
    return false;
  }
}

async function main() {
  // Migration 1: Add currency and language to profiles
  const migration1Success = await applyMigration(
    'supabase/migrations/20251122_add_currency_language_to_profiles.sql',
    'Adding currency and language columns to profiles'
  );

  if (!migration1Success) {
    console.log('\n⚠️  Migration 1 needs manual application. Apply it first, then re-run this script.\n');
    process.exit(1);
  }

  // Migration 2: Create wallets and transactions tables
  const migration2Success = await applyMigration(
    'supabase/migrations/20251122_create_wallets_transactions_tables.sql',
    'Creating wallets and transactions tables'
  );

  if (!migration2Success) {
    console.log('\n⚠️  Migration 2 needs manual application.\n');
    process.exit(1);
  }

  console.log('🎉 ALL MIGRATIONS APPLIED SUCCESSFULLY!\n');
  console.log('📊 Verifying tables...\n');

  // Verify tables exist
  const tables = ['profiles', 'wallets', 'transactions'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`  ❌ ${table} - ERROR: ${error.message}`);
    } else {
      console.log(`  ✅ ${table} - exists`);
    }
  }

  // Check if currency column was added
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('default_currency,language')
    .limit(1);

  if (!profileError && profileData) {
    console.log('\n✅ Currency and language columns added to profiles!');
  }

  console.log('\n✅ Verification complete!\n');
}

main().catch(console.error);
