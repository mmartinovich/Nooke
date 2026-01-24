#!/usr/bin/env node

/**
 * Nūūky Supabase Deployment Script
 *
 * This script deploys the complete database schema to Supabase
 * including tables, RLS policies, triggers, and functions.
 *
 * Usage:
 *   node deploy-supabase.js
 *
 * Requirements:
 *   - Supabase project URL and service role key in .env file
 *   - OR set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'nooke', '.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Error: SUPABASE_URL not found in environment variables');
  console.log('Please add SUPABASE_URL to nooke/.env or set SUPABASE_URL environment variable');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY not found in environment variables');
  console.log('');
  console.log('To get your service role key:');
  console.log('1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/settings/api');
  console.log('2. Copy the "service_role" key (NOT the anon key!)');
  console.log('3. Add to nooke/.env: SUPABASE_SERVICE_KEY=your_service_role_key');
  console.log('');
  console.log('⚠️  WARNING: Keep service_role key secret! Never commit to git!');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, 'nooke', 'supabase', 'migrations', '001_initial_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Nūūky Supabase Deployment');
console.log('================================\n');
console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
console.log(`📄 Migration file: ${migrationPath}`);
console.log(`📊 SQL length: ${migrationSQL.length} characters\n`);

// Execute SQL query via Supabase REST API
async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

    const data = JSON.stringify({ query: sql });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Deploy the migration
async function deploy() {
  console.log('📤 Executing database migration...\n');

  try {
    console.log('⚠️  Note: This script uses Supabase REST API which may not support all SQL features.');
    console.log('If you encounter errors, please run the migration manually via:');
    console.log('https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/sql/new\n');

    // Try to execute the migration
    await executeSql(migrationSQL);

    console.log('✅ Database migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Enable Phone Authentication:');
    console.log('   https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/auth/providers');
    console.log('');
    console.log('2. Enable Realtime for tables:');
    console.log('   https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/database/replication');
    console.log('   - Enable: users, friendships, room_participants, flares');
    console.log('');
    console.log('3. Test the app:');
    console.log('   cd nooke && npx expo start');

  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    console.log('');
    console.log('🔧 Manual deployment required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/sql/new');
    console.log('2. Open: nooke/supabase/migrations/001_initial_schema.sql');
    console.log('3. Copy ALL the SQL code');
    console.log('4. Paste into Supabase SQL Editor');
    console.log('5. Click "Run"');
    process.exit(1);
  }
}

// Run deployment
deploy();
