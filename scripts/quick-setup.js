// Quick setup script to fix database issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  console.log('Please set up your .env.local file with:');
  console.log('SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_KEY=your_supabase_key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickSetup() {
  console.log('🚀 Quick database setup...\n');

  try {
    // Test connection
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase.from('failed_payments').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      throw error;
    }
    console.log('✅ Supabase connection successful\n');

    // Create a single test payment if none exist
    console.log('2. Creating test payment...');
    const { data: existingPayments } = await supabase
      .from('failed_payments')
      .select('id')
      .limit(1);

    if (!existingPayments || existingPayments.length === 0) {
      const testPayment = {
        payment_id: 'pay_test_123',
        membership_id: 'mem_test_123',
        user_id: 'user_test_123',
        user_email: 'test@example.com',
        product_id: 'prod_test',
        company_id: 'default',
        amount: 5000, // $50.00 in cents
        currency: 'USD',
        failure_reason: 'Card declined',
        payments_failed_count: 1,
        last_payment_attempt: Date.now(),
        next_payment_attempt: Date.now() + (24 * 60 * 60 * 1000),
        status: 'active',
        auto_email_enabled: true,
        emails_sent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: payment, error: paymentError } = await supabase
        .from('failed_payments')
        .insert(testPayment)
        .select()
        .single();

      if (paymentError) {
        console.log('❌ Error creating test payment:', paymentError.message);
        return;
      }

      console.log('✅ Created test payment');
    } else {
      console.log('✅ Test payment already exists');
    }

    console.log('\n🎉 Quick setup complete!');
    console.log('\nYour app should now work. Try refreshing the page.');

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    console.log('\nThis usually means:');
    console.log('1. Your Supabase tables don\'t exist yet');
    console.log('2. Your credentials are incorrect');
    console.log('3. You need to run the full database setup first');
    console.log('\nTry running: npm run setup-db');
  }
}

quickSetup();
