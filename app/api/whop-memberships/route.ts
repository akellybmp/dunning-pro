import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { sql, isDatabaseConfigured } from '@/lib/neon';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Whop Memberships API endpoint hit');

    // Check if SDK is configured
    if (!whopSdk) {
      console.error('❌ Whop SDK not configured');
      return NextResponse.json(
        { error: 'Whop SDK not configured. Please set up your environment variables.' },
        { status: 500 }
      );
    }

    // Get headers for user token
    const headersList = await headers();

    // Verify user token
    const { userId } = await whopSdk.verifyUserToken(headersList);
    console.log('👤 User ID:', userId);

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const statusFilter = searchParams.get('status') || 'all';
    const search = searchParams.get('search');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching memberships for company:', companyId);

    // Check user access to company
    const accessCheck = await whopSdk.access.checkIfUserHasAccessToCompany({
      userId,
      companyId,
    });

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Fetch memberships from Whop API
    // Filter for past_due memberships (failed payments)
    const membershipFilters: any = {};

    // If status filter is provided, map it to Whop's membership status
    if (statusFilter === 'active') {
      membershipFilters.membershipStatus = 'past_due'; // Failed payments still active
    } else if (statusFilter === 'cancelled') {
      membershipFilters.mostRecentActions = ['churned']; // Cancelled due to failed payments
    }

    console.log('🔍 Fetching memberships with filters:', membershipFilters);

    const result = await whopSdk.companies.listMemberships({
      companyId,
      first: 50,
      order: 'created_at',
      direction: 'desc',
      filters: Object.keys(membershipFilters).length > 0 ? membershipFilters : undefined
    });

    if (!result || !result.memberships) {
      console.error('❌ No memberships data returned from Whop API');
      return NextResponse.json({
        error: 'Failed to fetch memberships from Whop API'
      }, { status: 500 });
    }

    console.log('📊 Fetched', result.memberships.totalCount, 'memberships from Whop');

    // Get all memberships
    const memberships = result.memberships.nodes || [];

    // Filter for memberships with payment issues (past_due status or failed payment count)
    const failedPaymentMemberships = memberships.filter(membership => {
      if (!membership) return false;

      // Check for payment issues
      const hasPaymentIssue =
        membership.status === 'past_due' ||
        (membership.paymentsFailedCount && membership.paymentsFailedCount > 0);

      return hasPaymentIssue;
    });

    console.log('⚠️ Found', failedPaymentMemberships.length, 'memberships with failed payments');

    // Get tracking data from local database (if configured)
    let trackingDataMap = new Map();

    if (isDatabaseConfigured()) {
      try {
        console.log('📊 Fetching tracking data from local database...');
        const trackingData = await sql!`
          SELECT * FROM failed_payments
          WHERE company_id = ${companyId}
        `;

        // Create a map of membership_id -> tracking data
        trackingData.forEach((record: any) => {
          trackingDataMap.set(record.membership_id, record);
        });

        console.log('📊 Loaded tracking data for', trackingData.length, 'memberships');
      } catch (error) {
        console.error('⚠️ Error fetching tracking data:', error);
        // Continue without tracking data
      }
    }

    // Transform Whop memberships to our payment format
    const payments = failedPaymentMemberships.map(membership => {
      if (!membership) return null;

      const trackingData = trackingDataMap.get(membership.id || '');

      // Determine status based on membership state
      let status = 'active';
      if (membership.status === 'canceled' || membership.status === 'cancelled') {
        status = 'cancelled';
      } else if (trackingData?.status === 'recovered') {
        status = 'recovered';
      }

      return {
        id: membership.id || '',
        user_email: membership.user?.email || 'N/A',
        user_id: membership.user?.id || '',
        membership_id: membership.id || '',
        amount: membership.plan?.initialPrice || 0,
        currency: 'usd',
        payments_failed_count: membership.paymentsFailedCount || 0,
        status: status,
        emails_sent: trackingData?.emails_sent || 0,
        last_email_sent: trackingData?.last_email_sent || null,
        auto_email_enabled: trackingData?.auto_email_enabled || false,
        created_at: membership.createdAt ? new Date(membership.createdAt * 1000).toISOString() : new Date().toISOString(),
        updated_at: trackingData?.updated_at || new Date().toISOString(),
        // Additional Whop-specific data
        plan_id: membership.planId || '',
        product_id: membership.productId || '',
        whop_data: {
          status: membership.status,
          valid: membership.valid,
          license_key: membership.licenseKey
        }
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    // Apply search filter if provided
    let filteredPayments = payments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = payments.filter(p =>
        p.user_email.toLowerCase().includes(searchLower) ||
        p.membership_id.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredPayments = filteredPayments.filter(p => p.status === statusFilter);
    }

    console.log('✅ Returning', filteredPayments.length, 'payments');

    return NextResponse.json({
      payments: filteredPayments,
      total: filteredPayments.length,
      page: 1,
      limit: 50,
      totalPages: 1
    });
  } catch (error) {
    console.error('❌ Whop Memberships API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error details:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to fetch memberships',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
