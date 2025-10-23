import { NextRequest, NextResponse } from 'next/server';
import { sql, isDatabaseConfigured } from '@/lib/neon';

export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not configured',
          message: 'DATABASE_URL environment variable is missing'
        },
        { status: 500 }
      );
    }

    // Test basic connection
    const testResult = await sql!`SELECT 1 as test, NOW() as current_time`;
    
    // Test if tables exist
    const tablesResult = await sql!`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('failed_payments', 'email_sequences', 'recovery_stats', 'email_rules', 'sent_emails')
      ORDER BY table_name
    `;

    return NextResponse.json({
      success: true,
      message: 'Neon database connection successful',
      test: testResult[0],
      tables: tablesResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
