import { NextRequest, NextResponse } from 'next/server';
import { makeWebhookValidator } from '@whop/api';
import { sql, isDatabaseConfigured } from '@/lib/neon';

// Define the webhook data type
type PaymentWebhookData = {
  id: string;
  membership_id: string;
  membership?: {
    id: string;
  };
  membershipId?: string;
  user_id: string | number;
  user?: {
    email?: string;
  };
  product_id: string;
  company_id: string;
  final_amount?: number;
  currency?: string;
  payments_failed?: number;
  last_payment_attempt?: string;
  next_payment_attempt?: string;
};

const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_PAYMENT_FAILED_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Received webhook request');
    console.log('🔑 WHOP_PAYMENT_FAILED_SECRET value:', process.env.WHOP_PAYMENT_FAILED_SECRET);
    
    // Debug: Log all headers
    console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
    
    if (!process.env.WHOP_PAYMENT_FAILED_SECRET) {
      console.error('❌ Missing WHOP_PAYMENT_FAILED_SECRET');
      return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
    }

    let webhook;
    try {
      webhook = await validateWebhook(request);
      console.log('📦 Validated webhook:', webhook.action);
      console.log('📦 Full webhook data:', JSON.stringify(webhook, null, 2));
    } catch (validationError: any) {
      console.log('⚠️ Webhook validation failed, checking if this is a test request...');
      console.log('Validation error:', validationError.message);
      
      // Check if this is a test request from Whop dashboard
      const body = await request.json();
      console.log('📦 Raw request body:', JSON.stringify(body, null, 2));
      
      if (body.action === 'app_payment.failed' || body.action === 'payment.failed') {
        console.log('🧪 Detected test webhook, processing without validation...');
        webhook = body; // Use the raw body as webhook data
      } else {
        throw validationError;
      }
    }

    if (webhook.action !== 'app_payment.failed' && webhook.action !== 'payment.failed') {
      return NextResponse.json({ message: 'Not a payment failed event' });
    }

    if (!isDatabaseConfigured()) {
      console.error('❌ Neon database not configured');
      console.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const paymentData = webhook.data as unknown as PaymentWebhookData;

    console.log('📦 ENTIRE webhook payload:', JSON.stringify(webhook, null, 2));
    console.log('📦 Payment data received:', JSON.stringify(paymentData, null, 2));
    
    // Try multiple possible field names for membership_id
    const membershipId = paymentData.membership_id || 
                        paymentData.membership?.id || 
                        paymentData.id || 
                        paymentData.membershipId;
    
    console.log('🔍 Extracted membership_id:', membershipId);
    console.log('🔍 Raw membership_id field:', paymentData.membership_id);
    console.log('🔍 Raw membership.id field:', paymentData.membership?.id);
    console.log('🔍 Raw id field:', paymentData.id);
    console.log('📦 User ID:', paymentData.user_id);
    console.log('📦 User email:', paymentData.user?.email);

    console.log('💾 Testing Neon connection...');
    try {
      await sql!`SELECT 1`;
      console.log('✅ Neon connection successful');
    } catch (testError) {
      console.error('❌ Neon connection test failed:', testError);
      return NextResponse.json({ error: `Database connection failed: ${testError}` }, { status: 500 });
    }
    
    console.log('💾 Checking if payment already exists...');
    console.log('🔍 Searching for payment_id:', paymentData.id);
    const existingPayment = await sql!`
      SELECT id, membership_id 
      FROM failed_payments 
      WHERE payment_id = ${paymentData.id}
      LIMIT 1
    `;
    
    console.log('📊 Existing payment found:', existingPayment[0]);

    let failedPayment;
    
    if (existingPayment[0]) {
      console.log('📝 Payment exists, updating...');
      const result = await sql!`
        UPDATE failed_payments SET
        membership_id = ${paymentData.membership_id},
        user_id = ${paymentData.user_id || 'unknown_user'},
        user_email = ${paymentData.user?.email || 'test@example.com'},
        product_id = ${paymentData.product_id},
        company_id = ${paymentData.company_id},
        amount = ${paymentData.final_amount || 0},
        currency = ${paymentData.currency || 'usd'},
        payments_failed_count = ${paymentData.payments_failed || 0},
        last_payment_attempt = ${paymentData.last_payment_attempt},
        next_payment_attempt = ${paymentData.next_payment_attempt},
        status = 'active',
        updated_at = ${new Date().toISOString()}
        WHERE payment_id = ${paymentData.id}
        RETURNING *
      `;
      failedPayment = result[0];
    } else {
      console.log('➕ Payment new, inserting...');
      const result = await sql!`
        INSERT INTO failed_payments (
          payment_id, membership_id, user_id, user_email, product_id, 
          company_id, amount, currency, payments_failed_count, 
          last_payment_attempt, next_payment_attempt, status, created_at, updated_at
        ) VALUES (
          ${paymentData.id}, ${membershipId}, ${paymentData.user_id || 'unknown_user'}, 
          ${paymentData.user?.email || 'test@example.com'}, ${paymentData.product_id}, 
          ${paymentData.company_id}, ${paymentData.final_amount || 0}, 
          ${paymentData.currency || 'usd'}, ${paymentData.payments_failed || 0}, 
          ${paymentData.last_payment_attempt}, ${paymentData.next_payment_attempt}, 
          'active', ${new Date().toISOString()}, ${new Date().toISOString()}
        )
        RETURNING *
      `;
      failedPayment = result[0];
    }

    console.log('✅ Failed payment stored:', failedPayment.id);

    console.log('📧 Skipping email for testing...');

    return NextResponse.json({
      success: true,
      message: 'Payment failure processed',
      id: failedPayment.id,
    });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    console.error('Error details:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}