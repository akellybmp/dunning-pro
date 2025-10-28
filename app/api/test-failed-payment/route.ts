import { NextRequest, NextResponse } from 'next/server';
import { sql, isDatabaseConfigured } from '@/lib/neon';

// This is a TEST ENDPOINT to manually create a failed payment
// Use this to demonstrate your app works with real data structure
// DELETE THIS FILE before final production deployment

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test endpoint: Creating simulated failed payment');

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Use provided data or generate realistic test data
    const testData = {
      payment_id: body.payment_id || `pay_${Date.now()}`,
      membership_id: body.membership_id || `mem_${Date.now()}`,
      user_id: body.user_id || 'user_GLITUbNWmTZEf', // Your actual user ID
      user_email: body.user_email || 'customer@test.com',
      product_id: body.product_id || 'prod_RichCourse', // Your "Get Rich" product
      company_id: body.company_id || 'biz_9YksSI6r8YNn0K', // Your actual company ID
      amount: body.amount || 500, // $5.00 in cents
      currency: body.currency || 'usd',
      payments_failed_count: body.payments_failed_count || 1,
      last_payment_attempt: new Date().toISOString(),
      next_payment_attempt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    };

    console.log('📦 Creating test failed payment:', testData);

    const result = await sql!`
      INSERT INTO failed_payments (
        payment_id, membership_id, user_id, user_email, product_id,
        company_id, amount, currency, payments_failed_count,
        last_payment_attempt, next_payment_attempt, status, created_at, updated_at
      ) VALUES (
        ${testData.payment_id}, ${testData.membership_id}, ${testData.user_id},
        ${testData.user_email}, ${testData.product_id},
        ${testData.company_id}, ${testData.amount},
        ${testData.currency}, ${testData.payments_failed_count},
        ${testData.last_payment_attempt}, ${testData.next_payment_attempt},
        'active', ${new Date().toISOString()}, ${new Date().toISOString()}
      )
      RETURNING *
    `;

    console.log('✅ Test failed payment created:', result[0].id);

    return NextResponse.json({
      success: true,
      message: 'Test failed payment created',
      data: result[0],
      note: 'This is TEST data created via /api/test-failed-payment. Use this to demonstrate your app to Whop reviewers.'
    });

  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to view current test data
export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || 'biz_9YksSI6r8YNn0K';

    const payments = await sql!`
      SELECT * FROM failed_payments
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      count: payments.length,
      payments: payments
    });

  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear test data
export async function DELETE(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || 'biz_9YksSI6r8YNn0K';

    const result = await sql!`
      DELETE FROM failed_payments
      WHERE company_id = ${companyId}
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.length} test payments`,
      deleted: result.length
    });

  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
