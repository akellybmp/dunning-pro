# Supabase to Neon Migration Guide

## ✅ Migration Complete!

Your codebase has been successfully migrated from Supabase to Neon PostgreSQL. Here's what was changed and what you need to do next.

## 🔄 What Was Changed

### 1. Package Changes
- ✅ **Removed**: `@supabase/supabase-js`
- ✅ **Added**: `@neondatabase/serverless`

### 2. Code Changes
- ✅ **Created**: `lib/neon.ts` - New Neon database client
- ✅ **Updated**: All API routes to use Neon SQL queries
- ✅ **Updated**: Email service to use Neon
- ✅ **Updated**: Webhook handlers to use Neon
- ✅ **Created**: `/api/test-db` endpoint for testing

### 3. Files Modified
- `app/api/payments/route.ts`
- `app/api/stats/route.ts`
- `app/api/webhooks/payment-failed/route.ts`
- `app/api/webhooks/membership-invalid/route.ts`
- `lib/email-service.ts`
- `package.json`

## 🔧 Environment Variables

### ❌ Remove These (from Vercel)
```
SUPABASE_URL
SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL
```

### ✅ Add These (to Vercel)
```
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
```

**How to get your Neon DATABASE_URL:**
1. Go to your Neon dashboard
2. Select your project
3. Go to "Connection Details"
4. Copy the "Connection string" and use it as `DATABASE_URL`

## 🗄️ Database Setup

### 1. Create Tables
Run the SQL commands in `neon-schema.sql` in your Neon database:

1. Go to your Neon dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `neon-schema.sql`
4. Execute the script

### 2. Test Connection
Visit `/api/test-db` to verify your Neon connection is working.

## 📊 Database Schema

The following tables will be created:

1. **failed_payments** - Main table for failed payment records
2. **email_sequences** - Tracks email sending sequences
3. **recovery_stats** - Daily recovery statistics
4. **email_rules** - Email templates and rules
5. **sent_emails** - Email sending history
6. **email_settings** - Sender configuration

## 🧪 Testing

### 1. Test Database Connection
```bash
curl https://your-domain.com/api/test-db
```

### 2. Test API Endpoints
- `/api/payments` - Should return empty array initially
- `/api/stats` - Should return stats with zeros
- Webhook endpoints should work with Neon

## 🚀 Deployment Steps

1. **Update Vercel Environment Variables:**
   - Remove all Supabase variables
   - Add `DATABASE_URL` with your Neon connection string

2. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Migrate from Supabase to Neon"
   git push
   ```

3. **Verify Deployment:**
   - Check `/api/test-db` endpoint
   - Test webhook endpoints
   - Verify dashboard loads correctly

## 🔍 Troubleshooting

### Common Issues:

1. **"Database not configured" error:**
   - Check that `DATABASE_URL` is set in Vercel
   - Verify the connection string format

2. **Connection timeout:**
   - Ensure your Neon database is running
   - Check firewall settings

3. **Table not found errors:**
   - Run the `neon-schema.sql` script
   - Check table names match exactly

### Debug Commands:
```bash
# Test local connection
npm run dev
# Visit http://localhost:3000/api/test-db
```

## 📝 Next Steps

1. **Data Migration** (if you have existing data):
   - Export data from Supabase
   - Import to Neon using the same table structure

2. **Update Documentation:**
   - Update any setup guides
   - Update environment variable documentation

3. **Monitor Performance:**
   - Check Neon dashboard for query performance
   - Monitor connection usage

## 🎉 Benefits of Neon

- **Better Performance**: Direct PostgreSQL connection
- **Lower Latency**: No API overhead
- **Cost Effective**: Pay only for what you use
- **Full SQL Support**: Use any PostgreSQL feature
- **Better Debugging**: Direct SQL queries in logs

Your migration is complete! 🚀
