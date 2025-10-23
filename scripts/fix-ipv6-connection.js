// Advanced IPv4/IPv6 connectivity fix for Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Agent } from 'https';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config({ path: '.env.local' });

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Custom fetch with IPv4 preference
const customFetch = async (url, options = {}) => {
  try {
    console.log(`🔗 Attempting connection to: ${url}`);
    
    // Extract hostname from URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Try to resolve to IPv4 first
    try {
      const addresses = await resolve4(hostname);
      console.log(`✅ Resolved to IPv4: ${addresses[0]}`);
      
      // Create a custom agent that prefers IPv4
      const agent = new Agent({
        family: 4, // Force IPv4
        keepAlive: true,
        timeout: 10000,
      });
      
      // Use the resolved IPv4 address
      const ipv4Url = url.replace(hostname, addresses[0]);
      
      return fetch(ipv4Url, {
        ...options,
        agent,
        signal: options.signal || AbortSignal.timeout(15000),
      });
      
    } catch (ipv4Error) {
      console.log('⚠️  IPv4 resolution failed, trying IPv6...');
      
      try {
        const addresses = await resolve6(hostname);
        console.log(`✅ Resolved to IPv6: ${addresses[0]}`);
        
        const agent = new Agent({
          family: 6, // Use IPv6
          keepAlive: true,
          timeout: 10000,
        });
        
        const ipv6Url = url.replace(hostname, addresses[0]);
        
        return fetch(ipv6Url, {
          ...options,
          agent,
          signal: options.signal || AbortSignal.timeout(15000),
        });
        
      } catch (ipv6Error) {
        console.log('❌ Both IPv4 and IPv6 resolution failed');
        throw new Error(`DNS resolution failed: ${ipv4Error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    throw error;
  }
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
  console.log('🚀 Testing Supabase connection with IPv4/IPv6 fix...\n');
  
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
