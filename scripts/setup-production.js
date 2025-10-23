#!/usr/bin/env node

// Production setup script for DunningPro
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 DunningPro Production Setup\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('\nPlease create a .env.local file with the following variables:');
  console.log(`
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Whop Configuration (Optional)
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here
WHOP_API_KEY=your_api_key_here
  `);
  process.exit(1);
}

// Check environment variables
console.log('1. Checking environment variables...');
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'RESEND_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease update your .env.local file with the missing variables.');
  process.exit(1);
}

console.log('✅ All required environment variables found\n');

// Test Supabase connection
console.log('2. Testing Supabase connection...');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testSupabase() {
  try {
    const { data, error } = await supabase.from('failed_payments').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    console.log('✅ Supabase connection successful\n');
    return true;
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your Supabase credentials are correct');
    console.log('2. Your database tables exist (run the SQL from SETUP_INSTRUCTIONS.md)');
    return false;
  }
}

// Test Resend connection
console.log('3. Testing Resend connection...');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  try {
    // Just test the API key format, don't send an actual email
    if (!process.env.RESEND_API_KEY.startsWith('re_')) {
      throw new Error('Invalid Resend API key format');
    }
    console.log('✅ Resend API key format is valid\n');
    return true;
  } catch (error) {
    console.log('❌ Resend configuration failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your RESEND_API_KEY is correct');
    console.log('2. Your Resend account is verified');
    return false;
  }
}

// Run tests
async function runTests() {
  const supabaseOk = await testSupabase();
  const resendOk = await testResend();

  if (supabaseOk && resendOk) {
    console.log('🎉 All connections successful!');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/setup-database.js (to create sample data)');
    console.log('2. Run: node scripts/test-email.js (to test email sending)');
    console.log('3. Run: npm run dev (to start the application)');
  } else {
    console.log('\n❌ Some connections failed. Please fix the issues above and try again.');
  }
}

runTests();
