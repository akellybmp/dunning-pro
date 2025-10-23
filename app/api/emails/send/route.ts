import { NextRequest, NextResponse } from 'next/server';
import { sendRecoveryEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email API endpoint hit');
    const { to, template, failedPaymentId, templateName } = await request.json();
    console.log('📧 Request data:', { to, template, failedPaymentId, templateName });

    if (!to || !template || !failedPaymentId || !templateName) {
      console.error('❌ Missing required fields:', { to: !!to, template: !!template, failedPaymentId: !!failedPaymentId, templateName: !!templateName });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📧 Calling sendRecoveryEmail function...');
    const result = await sendRecoveryEmail({
      to,
      template,
      failedPaymentId,
      templateName
    });
    console.log('📧 sendRecoveryEmail result:', result);

    if (result.success) {
      console.log('✅ Email sent successfully, returning success response');
      return NextResponse.json({
        success: true,
        emailId: result.emailId,
        sequenceId: result.sequenceId
      });
    } else {
      console.error('❌ Email sending failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Email API error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
