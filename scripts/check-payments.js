#!/usr/bin/env node

/**
 * Check Payments in Database
 * This script checks if there are any payments in the database
 */

const fetch = require('node-fetch');

async function checkPayments() {
  console.log('🔍 Checking payments in database...\n');

  try {
    console.log('📡 Making API call to /api/payments...');
    const response = await fetch('http://localhost:3000/api/payments?companyId=default&status=all&page=1&limit=10');
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📊 Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Payments API working!');
      console.log('📊 Total payments:', data.total || 0);
      console.log('📊 Payments returned:', data.payments?.length || 0);
      
      if (data.payments && data.payments.length > 0) {
        console.log('\n📋 Sample payment:');
        console.log('  - ID:', data.payments[0].id);
        console.log('  - Email:', data.payments[0].user_email);
        console.log('  - Amount:', data.payments[0].amount);
        console.log('  - Status:', data.payments[0].status);
      } else {
        console.log('\n⚠️  No payments found in database');
        console.log('💡 You may need to add test data first');
      }
    } else {
      console.log('\n❌ Payments API failed!');
      console.log('❌ Error:', data.error);
    }

  } catch (error) {
    console.error('\n❌ Check failed with error:', error.message);
    console.error('❌ Make sure your development server is running on http://localhost:3000');
  }
}

// Run the check
checkPayments();
