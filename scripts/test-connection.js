// Test Supabase connection with IPv4/IPv6 compatibility
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { setDefaultResultOrder } from 'dns';

dotenv.config({ path: '.env.local' });

// Prefer IPv4 to avoid IPv6-only resolution issues on some networks
try {
  setDefaultResultOrder('ipv4first');
} catch {}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  console.log('Please set up your .env.local file with:');
  console.log('SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_KEY=your_supabase_key');
  process.exit(1);
}

// Custom fetch to handle IPv4/IPv6 issues
const customFetch = (url, options = {}) => {
  console.log(`🔗 Attempting connection to: ${url}`);
  
  return fetch(url, {
    ...options,
    // Add timeout to prevent hanging
    signal: options.signal || AbortSignal.timeout(15000),
  }).catch(error => {
    console.log(`❌ Connection failed: ${error.message}`);
    throw error;
  });
};

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
    },
    fetch: customFetch
  }
});

async function testConnection() {
  console.log('🚀 Testing Supabase connection...\n');
  
  try {
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase
      .from('failed_payments')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      throw error;
    }
    
    console.log('✅ Basic connection successful!');
    
    console.log('\n2. Testing table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('failed_payments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('⚠️  Table access issue:', tableError.message);
      console.log('This might mean the table doesn\'t exist yet.');
    } else {
      console.log('✅ Table access successful!');
    }
    
    console.log('\n🎉 Connection test complete!');
    console.log('Your Supabase connection is working properly.');
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    console.log('\nThis could be due to:');
    console.log('1. IPv4/IPv6 connectivity issues');
    console.log('2. Incorrect Supabase credentials');
    console.log('3. Network firewall blocking the connection');
    console.log('4. Supabase project is paused or inactive');
    
    console.log('\nTry these solutions:');
    console.log('1. Check your Supabase project is active');
    console.log('2. Verify your credentials in .env.local');
    console.log('3. Try using a different network (mobile hotspot)');
    console.log('4. Contact Supabase support if the issue persists');
  }
}

testConnection();
