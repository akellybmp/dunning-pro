import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_pRyQ09CGxwSv@ep-purple-mouse-ad51nnku-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

async function clearDemoData() {
  try {
    console.log('🧹 Starting demo data cleanup...');

    // Find all demo/test data
    const demoPayments = await sql`
      SELECT id, user_email, company_id, payment_id
      FROM failed_payments
      WHERE company_id = 'default'
         OR user_email LIKE '%@example.com'
         OR user_id = 'unknown_user'
      ORDER BY created_at DESC
    `;

    console.log(`📊 Found ${demoPayments.length} demo/test payments to delete:`);
    demoPayments.forEach(p => {
      console.log(`  - ${p.user_email} (${p.company_id}) - Payment ID: ${p.payment_id}`);
    });

    if (demoPayments.length === 0) {
      console.log('✅ No demo data found. Database is clean!');
      return;
    }

    // Delete demo data
    const result = await sql`
      DELETE FROM failed_payments
      WHERE company_id = 'default'
         OR user_email LIKE '%@example.com'
         OR user_id = 'unknown_user'
      RETURNING id
    `;

    console.log(`✅ Successfully deleted ${result.length} demo payments`);
    console.log('🎉 Database is now clean and ready for production!');

    // Show remaining payments
    const remainingPayments = await sql`
      SELECT id, user_email, company_id, created_at
      FROM failed_payments
      ORDER BY created_at DESC
      LIMIT 10
    `;

    console.log(`\n📊 Remaining payments in database: ${remainingPayments.length}`);
    if (remainingPayments.length > 0) {
      remainingPayments.forEach(p => {
        console.log(`  - ${p.user_email} (${p.company_id}) - ${new Date(p.created_at).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

clearDemoData();
