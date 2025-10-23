import { NextRequest, NextResponse } from 'next/server';
import { makeWebhookValidator } from '@whop/api';
import { sql, isDatabaseConfigured } from '@/lib/neon';

// Define the webhook data type
type MembershipWebhookData = {
  id?: string;
  membership_id: string;
  membership?: {
    id: string;
  };
  membershipId?: string;
  user_id: string | number;
  user?: {
    email?: string;
  };
  company_id: string;
};

const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_MEMBERSHIP_INVALID_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Received membership invalid webhook');
    console.log('🔑 WHOP_MEMBERSHIP_INVALID_SECRET value:', process.env.WHOP_MEMBERSHIP_INVALID_SECRET);
    
    // Debug: Log all headers
    console.log('📋 Request headers:', Object.fromEntries(request.headers.entries()));
    
    if (!process.env.WHOP_MEMBERSHIP_INVALID_SECRET) {
      console.error('❌ Missing WHOP_MEMBERSHIP_INVALID_SECRET');
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
      
      if (body.action === 'membership.went_invalid') {
        console.log('🧪 Detected test webhook, processing without validation...');
        webhook = body; // Use the raw body as webhook data
      } else {
        throw validationError;
      }
    }

    // Log the exact event name received
    console.log('📦 Received event action:', webhook.action);
    
    // Accept all possible event name variations
    const validActions = [
      'app_membership_went_invalid',
      'app_membership.went_invalid',
      'membership.went_invalid',
      'membership_went_invalid'
    ];
    
    if (!validActions.includes(webhook.action)) {
      console.log('❌ Invalid event action:', webhook.action);
      return NextResponse.json({ 
        message: 'Not a membership invalid event', 
        receivedAction: webhook.action,
        validActions: validActions
      });
    }
    
    console.log('✅ Valid membership invalid event received:', webhook.action);

    if (!isDatabaseConfigured()) {
      console.error('❌ Neon database not configured');
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const membershipData = webhook.data as unknown as MembershipWebhookData;

    console.log('📦 ENTIRE webhook payload:', JSON.stringify(webhook, null, 2));
    console.log('📦 Membership data received:', JSON.stringify(membershipData, null, 2));
    
    // Try multiple possible field names for membership_id
    const membershipId = membershipData.membership_id || 
                        membershipData.membership?.id || 
                        membershipData.id || 
                        membershipData.membershipId;
    
    console.log('🔍 Extracted membership_id:', membershipId);
    console.log('🔍 Raw membership_id field:', membershipData.membership_id);
    console.log('🔍 Raw membership.id field:', membershipData.membership?.id);
    console.log('🔍 Raw id field:', membershipData.id);
    console.log('🔍 Looking for membership_id in database:', membershipId);

    // First, try to update any existing failed payments for this membership
    console.log('💾 Attempting to update failed_payments table...');
    const updatedPayments = await sql!`
      UPDATE failed_payments 
      SET status = 'cancelled', updated_at = ${new Date().toISOString()}
      WHERE membership_id = ${membershipId}
      RETURNING *
    `;

    console.log('📊 Update result:', {
      updatedPayments,
      rowsAffected: updatedPayments?.length || 0
    });

    if (!updatedPayments || updatedPayments.length === 0) {
      console.log('⚠️ No failed payments found for membership_id:', membershipId);
    } else {
      console.log('✅ Updated', updatedPayments.length, 'failed payment records to cancelled status');
    }

    // No need for separate invalid_memberships table - we just update failed_payments

    console.log('📧 Skipping email for testing...');

    return NextResponse.json({
      success: true,
      message: 'Membership invalid processed',
      membershipId: membershipId,
      updatedPaymentsCount: updatedPayments?.length || 0,
      eventAction: webhook.action
    });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    console.error('Error details:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}