import { NextRequest, NextResponse } from 'next/server';
import { sql, isDatabaseConfigured } from '@/lib/neon';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Stats API endpoint hit');
    
    if (!isDatabaseConfigured()) {
      console.error('❌ Database not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || 'default';
    console.log('📊 Company ID:', companyId);

    // Get basic stats from failed_payments
    console.log('📊 Fetching payments from database...');
    const payments = await sql!`
      SELECT status, amount, created_at 
      FROM failed_payments 
      WHERE company_id = ${companyId}
    `;
    console.log('📊 Raw payments from DB:', payments?.length || 0, 'payments');

    // Calculate stats
    const totalFailed = payments?.length || 0;
    const recovered = payments?.filter(p => p.status === 'recovered').length || 0;
    const active = payments?.filter(p => p.status === 'active').length || 0;
    const cancelled = payments?.filter(p => p.status === 'cancelled').length || 0;
    
    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const recoveredRevenue = payments
      ?.filter(p => p.status === 'recovered')
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const recoveryRate = totalFailed > 0 ? (recovered / totalFailed) * 100 : 0;

    // Get recent payments
    console.log('📊 Fetching recent payments...');
    const recentPayments = await sql!`
      SELECT * FROM failed_payments 
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    console.log('📊 Recent payments:', recentPayments?.length || 0, 'payments');

    const response = {
      stats: {
        totalFailed,
        recovered,
        active,
        cancelled,
        totalRevenue,
        recoveredRevenue,
        recoveryRate: Math.round(recoveryRate * 100) / 100
      },
      recentPayments: recentPayments || []
    };
    
    console.log('📊 Stats response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Stats API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Error details:', errorMessage);
    console.error('❌ Error stack:', errorStack);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
