# DunningPro Troubleshooting Guide

## Quick Fix for "Send Email" Button Crash

If your app is crashing to a grey screen when clicking "Send Email", follow these steps:

### 1. Check Environment Variables

Make sure your `.env.local` file has these variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_resend_api_key
```

### 2. Run Quick Setup

```bash
npm run quick-setup
```

This will:
- Test your Supabase connection
- Create a test payment if none exist
- Verify your database is working

### 3. If Quick Setup Fails

Run the full database setup:

```bash
npm run setup-db
```

### 4. Check Your Supabase Tables

Make sure these tables exist in your Supabase database:

- `failed_payments`
- `email_sequences` 
- `sent_emails`
- `email_rules`
- `company_settings`

### 5. Test Email Functionality

```bash
npm run test-email
```

## Common Issues

### Grey Screen Crash
- **Cause**: Database connection failure
- **Fix**: Run `npm run quick-setup` or check your Supabase credentials

### "Database not configured" Error
- **Cause**: Missing or incorrect Supabase credentials
- **Fix**: Check your `.env.local` file and Supabase project settings

### "RESEND_API_KEY not configured" Error
- **Cause**: Missing Resend API key
- **Fix**: Get a Resend API key from https://resend.com and add it to `.env.local`

### No Payments Showing
- **Cause**: No data in the database
- **Fix**: Run `npm run setup-db` to create sample data

## Getting Help

1. Check the browser console for error messages
2. Check your Vercel function logs
3. Verify all environment variables are set correctly
4. Make sure your Supabase project is active and accessible

## Production Setup

For production deployment:

1. Set up your environment variables in Vercel
2. Run the production setup script: `npm run setup`
3. Configure your domain in Resend
4. Test the email functionality

## Database Schema

If you need to create the tables manually, run this SQL in your Supabase SQL editor:

```sql
-- Create failed_payments table
CREATE TABLE IF NOT EXISTS failed_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL,
  membership_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  failure_reason TEXT,
  payments_failed_count INTEGER DEFAULT 1,
  last_payment_attempt BIGINT,
  next_payment_attempt BIGINT,
  status TEXT DEFAULT 'active',
  auto_email_enabled BOOLEAN DEFAULT true,
  emails_sent INTEGER DEFAULT 0,
  last_email_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_sequences table
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  failed_payment_id UUID REFERENCES failed_payments(id),
  email_type TEXT NOT NULL,
  resend_email_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sent_emails table
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  failed_payment_id UUID REFERENCES failed_payments(id),
  email_sequence_id UUID REFERENCES email_sequences(id),
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  resend_email_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_rules table
CREATE TABLE IF NOT EXISTS email_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  days INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  template_name TEXT NOT NULL,
  template_subject TEXT NOT NULL,
  template_body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL UNIQUE,
  whop_company_name TEXT,
  email_enabled BOOLEAN DEFAULT true,
  from_name TEXT DEFAULT 'DunningPro',
  from_email TEXT DEFAULT 'noreply@dunningpro.com',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
