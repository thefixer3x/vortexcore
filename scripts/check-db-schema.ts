#!/usr/bin/env bun
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking current database schema...\n');

  // Query for existing tables in public schema
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (tablesError) {
    console.error('❌ Error querying tables:', tablesError);
    // Try alternative approach using RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('pg_catalog.pg_tables');
    if (rpcError) {
      console.error('❌ RPC Error:', rpcError);
    }
  }

  // Get list of tables directly using SQL query
  const { data: publicTables, error: queryError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `
    });

  if (queryError) {
    // If RPC doesn't work, try direct REST API query
    console.log('📋 Attempting to list tables from existing Supabase types...\n');

    // Check which tables exist by trying to query them
    const tablesToCheck = [
      'profiles',
      'wallets',
      'transactions',
      'conversations',
      'ai_chat_sessions',
      'child_profiles',
      'vortex_settings',
      'stripe_customers'
    ];

    console.log('Tables to be created by migration:');
    console.log('  - wallets');
    console.log('  - transactions');
    console.log('  - conversations');
    console.log('  - ai_chat_sessions');
    console.log('  - child_profiles');
    console.log('  - vortex_settings');
    console.log('  - stripe_customers\n');

    console.log('Checking which tables currently exist:\n');

    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`  ❌ ${table} - NOT FOUND (will be created)`);
        } else {
          console.log(`  ⚠️  ${table} - ERROR: ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${table} - EXISTS`);
      }
    }

    // Check profiles table columns to validate previous migration
    console.log('\n📊 Checking profiles table structure...\n');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (!profilesError && profilesData && profilesData.length > 0) {
      console.log('  ✅ Profiles table exists with columns:');
      console.log('     ', Object.keys(profilesData[0]).join(', '));

      if ('default_currency' in profilesData[0]) {
        console.log('\n  ✅ default_currency column exists (from previous migration)');
      } else {
        console.log('\n  ⚠️  default_currency column NOT found');
      }

      if ('language' in profilesData[0]) {
        console.log('  ✅ language column exists (from previous migration)');
      } else {
        console.log('  ⚠️  language column NOT found');
      }
    }

  } else {
    console.log('📋 Public tables found:', publicTables);
  }
}

checkSchema().catch(console.error);
