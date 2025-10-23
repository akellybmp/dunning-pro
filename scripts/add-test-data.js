import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function addTestData() {
  try {
    console.log('Adding test data...');
    
    // Add sample failed payments
    await sql`
      INSERT INTO failed_payments (
        payment_id, membership_id, user_id, user_email, product_id, 
        company_id, amount, currency, payments_failed_count, 
        status, created_at, updated_at
      ) VALUES 
      ('pay_test_001', 'mem_001', 'user_001', 'john@example.com', 'prod_001', 'default', 29.99, 'usd', 1, 'active', NOW(), NOW()),
      ('pay_test_002', 'mem_002', 'user_002', 'jane@example.com', 'prod_002', 'default', 49.99, 'usd', 2, 'active', NOW() - INTERVAL '1 day', NOW()),
      ('pay_test_003', 'mem_003', 'user_003', 'bob@example.com', 'prod_001', 'default', 19.99, 'usd', 1, 'recovered', NOW() - INTERVAL '2 days', NOW()),
      ('pay_test_004', 'mem_004', 'user_004', 'alice@example.com', 'prod_003', 'default', 99.99, 'usd', 3, 'cancelled', NOW() - INTERVAL '3 days', NOW())
      ON CONFLICT (payment_id) DO NOTHING
    `;
    
    console.log('✅ Test data added successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addTestData();
