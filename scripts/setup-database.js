// Script to set up Supabase database with sample data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use Session Pooler URL to avoid IPv4/IPv6 issues
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  console.log('Please set up your .env.local file first');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');

  try {
    // Test connection
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase.from('failed_payments').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      throw error;
    }
    console.log('✅ Supabase connection successful\n');

    // Create sample data
    console.log('2. Creating sample failed payments...');
    const samplePayments = [
      {
        payment_id: 'pay_1234567890',
        membership_id: 'mem_abc123',
        user_id: 'user_001',
        user_email: 'akellybmp@outlook.com',
        product_id: 'prod_premium',
        company_id: 'default',
        amount: 5000, // $50.00 in cents
        currency: 'USD',
        failure_reason: 'Card declined',
        payments_failed_count: 1,
        last_payment_attempt: Date.now(),
        next_payment_attempt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        status: 'active',
        auto_email_enabled: true,
        emails_sent: 0
      },
      {
        payment_id: 'pay_1234567891',
        membership_id: 'mem_def456',
        user_id: 'user_002',
        user_email: 'test@example.com',
        product_id: 'prod_basic',
        company_id: 'default',
        amount: 2500, // $25.00 in cents
        currency: 'USD',
        failure_reason: 'Insufficient funds',
        payments_failed_count: 2,
        last_payment_attempt: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
        next_payment_attempt: Date.now() + (5 * 24 * 60 * 60 * 1000), // 5 days
        status: 'active',
        auto_email_enabled: true,
        emails_sent: 1
      },
      {
        payment_id: 'pay_1234567892',
        membership_id: 'mem_ghi789',
        user_id: 'user_003',
        user_email: 'recovered@example.com',
        product_id: 'prod_premium',
        company_id: 'default',
        amount: 5000,
        currency: 'USD',
        failure_reason: 'Card expired',
        payments_failed_count: 1,
        last_payment_attempt: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
        next_payment_attempt: null,
        status: 'recovered',
        auto_email_enabled: true,
        emails_sent: 3
      }
    ];

    // Insert sample payments
    const { data: payments, error: paymentsError } = await supabase
      .from('failed_payments')
      .insert(samplePayments)
      .select();

    if (paymentsError) {
      console.log('❌ Error creating sample payments:', paymentsError.message);
      return;
    }

    console.log(`✅ Created ${payments.length} sample payments\n`);

    // Create sample email rules
    console.log('3. Creating sample email rules...');
    const sampleRules = [
      {
        company_id: 'default',
        days: 1,
        enabled: true,
        template_name: 'First Reminder',
        template_subject: 'Payment Failed - Action Required',
        template_body: 'Hi {{userName}},\n\nYour payment of ${{amount}} has failed.\n\nPlease update your payment method: {{recoveryLink}}\n\nThanks!'
      },
      {
        company_id: 'default',
        days: 3,
        enabled: true,
        template_name: 'Second Reminder',
        template_subject: 'Final Notice - Payment Failed',
        template_body: 'Hi {{userName}},\n\nThis is your final notice. Your payment of ${{amount}} has failed multiple times.\n\nPlease update your payment method immediately: {{recoveryLink}}\n\nThanks!'
      },
      {
        company_id: 'default',
        days: 7,
        enabled: false,
        template_name: 'Cancellation Notice',
        template_subject: 'Membership Cancelled',
        template_body: 'Hi {{userName}},\n\nYour membership has been cancelled due to failed payments.\n\nYou can reactivate anytime: {{recoveryLink}}\n\nThanks!'
      }
    ];

    const { data: rules, error: rulesError } = await supabase
      .from('email_rules')
      .insert(sampleRules)
      .select();

    if (rulesError) {
      console.log('❌ Error creating email rules:', rulesError.message);
      return;
    }

    console.log(`✅ Created ${rules.length} email rules\n`);

    // Create company settings
    console.log('4. Creating company settings...');
    const companySettings = {
      company_id: 'default',
      whop_company_name: 'DunningPro Demo',
      email_enabled: true,
      from_name: 'DunningPro',
      from_email: 'noreply@dunningpro.com'
    };

    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .upsert(companySettings)
      .select();

    if (settingsError) {
      console.log('❌ Error creating company settings:', settingsError.message);
      return;
    }

    console.log('✅ Created company settings\n');

    console.log('🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Start your app: npm run dev');
    console.log('2. Check the Payments page for sample data');
    console.log('3. Test sending an email to akellybmp@outlook.com');

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your .env.local file is configured correctly');
    console.log('2. Your Supabase tables exist (run the SQL from SETUP_INSTRUCTIONS.md)');
    console.log('3. Your Supabase credentials are correct');
  }
}

setupDatabase();
