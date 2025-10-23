#!/usr/bin/env node

/**
 * Test Email Functionality
 * This script tests the email sending functionality with mock data
 */

const fetch = require('node-fetch');

async function testEmailSending() {
  console.log('🧪 Testing email sending functionality...\n');

  try {
    // Test data
    const testData = {
      to: 'test@example.com',
      template: {
        subject: 'Test Payment Recovery Email',
        body: 'This is a test email for payment recovery. Your payment of $29.99 has failed. Please update your payment method.'
      },
      failedPaymentId: 'test-payment-id-123',
      templateName: 'Test Email'
    };

    console.log('📧 Test data:', testData);
    console.log('📡 Making API call to /api/emails/send...\n');

    const response = await fetch('http://localhost:3000/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📧 Response data:', result);

    if (response.ok) {
      console.log('\n✅ Email test successful!');
      console.log('✅ Email ID:', result.emailId);
      console.log('✅ Sequence ID:', result.sequenceId);
    } else {
      console.log('\n❌ Email test failed!');
      console.log('❌ Error:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('❌ Make sure your development server is running on http://localhost:3000');
  }
}

// Run the test
testEmailSending();