# 🚀 Production Setup Guide

## Step 1: Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Whop Configuration (Optional for now)
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here
WHOP_API_KEY=your_api_key_here
```

## Step 2: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Go to Settings → API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Get Your Resend API Key

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Copy it to `RESEND_API_KEY`

## Step 4: Test the Setup

Run this command to test your environment variables:

```bash
npm run dev
```

Then check the browser console for connection logs.

## Step 5: Create Sample Data

Once your environment variables are set up, we'll create sample data in Supabase to test the app.

## Step 6: Test Email Sending

We'll test sending a real email to your address: akellybmp@outlook.com

---

**Next Steps:**
1. Set up your `.env.local` file with the credentials above
2. Let me know when it's done
3. We'll test the connections and create sample data
