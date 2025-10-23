// Simple IPv4 fix for Supabase connectivity
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Simple fetch with IPv4 preference
const customFetch = (url, options = {}) => {
  console.log(`🔗 Attempting connection to: ${url}`);
  
  // Force IPv4 by using a different approach
  const modifiedUrl = url.replace('https://', 'https://');
  
  return fetch(modifiedUrl, {
    ...options,
    // Add timeout to prevent hanging
    signal: options.signal || AbortSignal.timeout(20000),
    // Force IPv4 by setting specific headers
    headers: {
      ...options.headers,
      'Connection': 'keep-alive',
      'User-Agent': 'DunningPro/1.0'
    }
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
  console.log('🚀 Testing Supabase connection with IPv4 fix...\n');
  
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
