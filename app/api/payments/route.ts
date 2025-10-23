import { NextRequest, NextResponse } from 'next/server';
import { sql, isDatabaseConfigured } from '@/lib/neon';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Payments API endpoint hit');
    
    if (!isDatabaseConfigured()) {
      console.error('❌ Database not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || 'default';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('📊 Request params:', { companyId, status, search, page, limit });

    // Get all payments for the company first, then filter in JavaScript
    console.log('📊 Fetching payments from database...');
    const allPayments = await sql!`
      SELECT * FROM failed_payments 
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC
    `;
    console.log('📊 Raw payments from DB:', allPayments?.length || 0, 'payments');

    // Apply filters in JavaScript
    let filteredPayments = allPayments;

    if (status && status !== 'all') {
      filteredPayments = filteredPayments.filter(p => p.status === status);
      console.log('📊 After status filter:', filteredPayments.length, 'payments');
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = filteredPayments.filter(p => 
        p.user_email?.toLowerCase().includes(searchLower) || 
        p.membership_id?.toLowerCase().includes(searchLower)
      );
      console.log('📊 After search filter:', filteredPayments.length, 'payments');
    }

    const total = filteredPayments.length;
    const offset = (page - 1) * limit;
    const data = filteredPayments.slice(offset, offset + limit);
    
    console.log('📊 Final result:', { total, page, limit, returned: data.length });

    return NextResponse.json({
      payments: data || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { paymentIds, updates } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Payment IDs are required' },
        { status: 400 }
      );
    }

    // Simple approach: update each field individually
    let data: any[] = [];
    
    for (const paymentId of paymentIds) {
      if (updates.status) {
        await sql!`UPDATE failed_payments SET status = ${updates.status}, updated_at = ${new Date().toISOString()} WHERE id = ${paymentId}`;
      }
      if (updates.auto_email_enabled !== undefined) {
        await sql!`UPDATE failed_payments SET auto_email_enabled = ${updates.auto_email_enabled}, updated_at = ${new Date().toISOString()} WHERE id = ${paymentId}`;
      }
      // Add more fields as needed
    }
    
    // Get updated records
    data = await sql!`SELECT * FROM failed_payments WHERE id = ANY(${paymentIds})`;

    return NextResponse.json({ 
      success: true, 
      updated: data?.length || 0 
    });
  } catch (error) {
    console.error('Update payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
