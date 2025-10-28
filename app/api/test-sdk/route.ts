import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET() {
  try {
    // Check if SDK is initialized
    if (!whopSdk) {
      return NextResponse.json({
        success: false,
        error: 'SDK not initialized',
        message: 'Check that NEXT_PUBLIC_WHOP_APP_ID and WHOP_API_KEY are set in your .env.local',
        env_check: {
          NEXT_PUBLIC_WHOP_APP_ID: process.env.NEXT_PUBLIC_WHOP_APP_ID ? '✅ Set' : '❌ Missing',
          WHOP_API_KEY: process.env.WHOP_API_KEY ? '✅ Set' : '❌ Missing',
          NEXT_PUBLIC_WHOP_AGENT_USER_ID: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID ? '✅ Set' : '⚠️ Optional (not set)',
          NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID ? '✅ Set' : '⚠️ Optional (not set)',
        }
      }, { status: 500 });
    }

    // SDK is initialized, try a simple API call to verify it works
    console.log('✅ SDK is initialized, attempting API call...');

    return NextResponse.json({
      success: true,
      message: 'Whop SDK is properly initialized! ✅',
      sdk_status: 'initialized',
      env_check: {
        NEXT_PUBLIC_WHOP_APP_ID: '✅ Set',
        WHOP_API_KEY: '✅ Set',
        NEXT_PUBLIC_WHOP_AGENT_USER_ID: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID ? '✅ Set' : '⚠️ Optional (not set)',
        NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID ? '✅ Set' : '⚠️ Optional (not set)',
      }
    });

  } catch (error: any) {
    console.error('❌ SDK test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      message: 'SDK initialization test failed'
    }, { status: 500 });
  }
}
