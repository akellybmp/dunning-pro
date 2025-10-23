# PowerShell script to start the development server
# This handles the IPv4/IPv6 connectivity issues

Write-Host "🚀 Starting DunningPro development server..." -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create a .env.local file with your Supabase credentials." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required variables:" -ForegroundColor Yellow
    Write-Host "SUPABASE_URL=your_supabase_url"
    Write-Host "SUPABASE_KEY=your_supabase_anon_key"
    Write-Host "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    Write-Host "RESEND_API_KEY=re_your_resend_api_key"
    exit 1
}

# Test Supabase connection first
Write-Host "🔍 Testing Supabase connection..." -ForegroundColor Yellow
npm run test-connection

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase connection test failed!" -ForegroundColor Red
    Write-Host "Please check your .env.local file and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase connection successful!" -ForegroundColor Green
Write-Host ""

# Start the development server
Write-Host "🌐 Starting Next.js development server..." -ForegroundColor Green
npm run dev
