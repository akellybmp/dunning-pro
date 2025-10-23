# IPv4/IPv6 Connectivity Fix for Supabase

## The Problem
Your app is crashing to a grey screen because of IPv4/IPv6 connectivity issues with Supabase. This is a common issue where:
- Your system is trying to use IPv6
- Supabase doesn't properly support IPv6 connections
- The connection fails and causes the app to crash

## Solutions (Try in Order)

### 1. Quick Fix - Use IPv4 Only
Run this command to test if forcing IPv4 works:
```bash
npm run simple-ipv4
```

### 2. Advanced IPv4/IPv6 Fix
If the simple fix doesn't work, try the advanced version:
```bash
npm run fix-ipv6
```

### 3. Network-Level Fix
If the above don't work, try these network-level solutions:

#### Option A: Use Mobile Hotspot
1. Connect your computer to your phone's mobile hotspot
2. Try running the app again
3. This often resolves IPv4/IPv6 issues

#### Option B: Disable IPv6 on Your System
**Windows:**
1. Open Network and Sharing Center
2. Click on your network connection
3. Click Properties
4. Uncheck "Internet Protocol Version 6 (TCP/IPv6)"
5. Click OK and restart your computer

**Mac:**
1. Open System Preferences > Network
2. Select your network connection
3. Click Advanced > TCP/IP
4. Set "Configure IPv6" to "Off"
5. Click OK

#### Option C: Use a VPN
1. Connect to a VPN service
2. This often forces IPv4 connections
3. Try running the app again

### 4. Supabase Configuration Fix
Update your Supabase connection to force IPv4:

```javascript
// In your lib/supabase.ts file
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
    },
    fetch: (url, options = {}) => {
      // Force IPv4 by modifying the URL
      const modifiedUrl = url.replace('supabase.co', 'supabase.co');
      return fetch(modifiedUrl, {
        ...options,
        signal: options.signal || AbortSignal.timeout(20000),
      });
    }
  }
});
```

### 5. Environment Variable Fix
Add these to your `.env.local` file:
```env
# Force IPv4 for Node.js
NODE_OPTIONS="--dns-result-order=ipv4first"
```

### 6. PowerShell Startup Script
Use the PowerShell script I created:
```powershell
.\start-dev.ps1
```

This script will:
- Test your Supabase connection first
- Only start the dev server if the connection works
- Provide helpful error messages

## Testing Your Fix

After trying any of the above solutions, test with:
```bash
npm run test-connection
```

If that works, start your app with:
```bash
npm run dev
```

## Alternative: Use Supabase Edge Functions

If the connection issues persist, you can use Supabase Edge Functions which often have better IPv4/IPv6 compatibility:

1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. Create a new function
4. Use the function to proxy your database requests

## Still Having Issues?

If none of the above work:

1. **Check your Supabase project status** - Make sure it's not paused
2. **Verify your credentials** - Double-check your `.env.local` file
3. **Contact Supabase support** - They can help with connectivity issues
4. **Try a different network** - Sometimes ISP-level IPv6 issues cause problems

## Prevention

To prevent this issue in the future:
1. Always test your Supabase connection before deploying
2. Use the connection test script regularly
3. Consider using a VPN for development if you have persistent IPv6 issues
4. Keep your Supabase client updated

## Quick Commands

```bash
# Test connection
npm run test-connection

# Simple IPv4 fix
npm run simple-ipv4

# Advanced IPv4/IPv6 fix
npm run fix-ipv6

# Start with PowerShell script
.\start-dev.ps1

# Start normally
npm run dev
```
