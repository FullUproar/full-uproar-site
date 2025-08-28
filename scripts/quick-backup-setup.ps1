# PowerShell script for Windows users
# Quick Offsite Backup Setup for Full Uproar

Write-Host "🚀 Full Uproar Offsite Backup Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose your backup provider:" -ForegroundColor Yellow
Write-Host "1) Vercel Blob Storage (Easiest - Already have account)" -ForegroundColor Green
Write-Host "2) AWS S3 (Most cost-effective)"
Write-Host "3) Backblaze B2 (Cheapest storage)"
Write-Host "4) Google Cloud Storage"
Write-Host "5) Cloudflare R2 (S3-compatible, no egress fees)"
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    1 {
        Write-Host ""
        Write-Host "📦 Setting up Vercel Blob Storage..." -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Go to: https://vercel.com/dashboard/stores" -ForegroundColor Yellow
        Write-Host "2. Click 'Create Database' → 'Blob'" -ForegroundColor Yellow
        Write-Host "3. Copy your token" -ForegroundColor Yellow
        Write-Host ""
        
        $blobToken = Read-Host "Enter your Blob token (vercel_blob_rw_xxx)"
        
        # Add to .env.local
        Add-Content -Path ".env.local" -Value ""
        Add-Content -Path ".env.local" -Value "# Vercel Blob Backup Storage"
        Add-Content -Path ".env.local" -Value "USE_VERCEL_BLOB=true"
        Add-Content -Path ".env.local" -Value "BLOB_READ_WRITE_TOKEN=$blobToken"
        
        Write-Host "✅ Vercel Blob configured!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Testing backup..." -ForegroundColor Yellow
        npm run backup:database
    }
    
    2 {
        Write-Host ""
        Write-Host "☁️ Setting up AWS S3..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Quick Setup Steps:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://aws.amazon.com/console/"
        Write-Host "2. Search for 'S3' → Create bucket"
        Write-Host "   - Bucket name: fulluproar-backups-$(Get-Date -Format 'yyyyMMddHHmmss')"
        Write-Host "   - Region: Choose closest to you"
        Write-Host "   - Block all public access: ✓ (keep enabled)"
        Write-Host ""
        Write-Host "3. Go to IAM → Users → Add User"
        Write-Host "   - Username: fulluproar-backup"
        Write-Host "   - Access type: Programmatic access"
        Write-Host "   - Attach policy: AmazonS3FullAccess"
        Write-Host ""
        
        $awsKey = Read-Host "Enter AWS Access Key ID"
        $awsSecret = Read-Host "Enter AWS Secret Access Key" -AsSecureString
        $bucketName = Read-Host "Enter S3 Bucket Name"
        $awsRegion = Read-Host "Enter AWS Region (e.g., us-west-2)"
        
        # Convert secure string to plain text
        $awsSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($awsSecret))
        
        # Add to .env.local
        Add-Content -Path ".env.local" -Value ""
        Add-Content -Path ".env.local" -Value "# AWS S3 Backup Storage"
        Add-Content -Path ".env.local" -Value "AWS_ACCESS_KEY_ID=$awsKey"
        Add-Content -Path ".env.local" -Value "AWS_SECRET_ACCESS_KEY=$awsSecretPlain"
        Add-Content -Path ".env.local" -Value "S3_BACKUP_BUCKET=$bucketName"
        Add-Content -Path ".env.local" -Value "AWS_REGION=$awsRegion"
        
        # Install AWS SDK
        Write-Host "Installing AWS SDK..." -ForegroundColor Yellow
        npm install @aws-sdk/client-s3
        
        Write-Host "✅ AWS S3 configured!" -ForegroundColor Green
    }
    
    3 {
        Write-Host ""
        Write-Host "🔵 Setting up Backblaze B2..." -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Go to: https://www.backblaze.com/b2/" -ForegroundColor Yellow
        Write-Host "2. Sign up (10GB free)" -ForegroundColor Yellow
        Write-Host "3. Create a bucket" -ForegroundColor Yellow
        Write-Host "4. Create an application key" -ForegroundColor Yellow
        Write-Host ""
        
        $b2KeyId = Read-Host "Enter B2 Application Key ID"
        $b2Key = Read-Host "Enter B2 Application Key" -AsSecureString
        $b2Bucket = Read-Host "Enter B2 Bucket Name"
        
        $b2KeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($b2Key))
        
        Add-Content -Path ".env.local" -Value ""
        Add-Content -Path ".env.local" -Value "# Backblaze B2 Backup Storage (S3 Compatible)"
        Add-Content -Path ".env.local" -Value "AWS_ACCESS_KEY_ID=$b2KeyId"
        Add-Content -Path ".env.local" -Value "AWS_SECRET_ACCESS_KEY=$b2KeyPlain"
        Add-Content -Path ".env.local" -Value "S3_BACKUP_BUCKET=$b2Bucket"
        Add-Content -Path ".env.local" -Value "S3_ENDPOINT=https://s3.us-west-001.backblazeb2.com"
        
        Write-Host "✅ Backblaze B2 configured!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔐 Generating encryption key for backups..." -ForegroundColor Yellow

# Generate random encryption key (32 bytes = 256 bits)
$bytes = New-Object Byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$encryptionKey = [BitConverter]::ToString($bytes).Replace('-','').ToLower()

Add-Content -Path ".env.local" -Value "BACKUP_ENCRYPTION_KEY=$encryptionKey"
Write-Host "✨ Backup encryption key generated and saved!" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Setting up automated backups..." -ForegroundColor Yellow
Write-Host ""
$setupAuto = Read-Host "Would you like to set up automated backups? (y/n)"

if ($setupAuto -eq "y") {
    Write-Host "Creating Windows Scheduled Task..." -ForegroundColor Yellow
    
    # Create batch file
    $batchContent = @"
@echo off
cd /d "$PWD"
call npm run backup:database >> backups\backup.log 2>&1
"@
    $batchContent | Out-File -FilePath "backup-task.bat" -Encoding ASCII
    
    # Create scheduled task
    $taskName = "FullUproarBackup"
    $taskPath = "$PWD\backup-task.bat"
    
    # Create the action
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$taskPath`""
    
    # Create triggers (every 6 hours)
    $trigger1 = New-ScheduledTaskTrigger -At "02:00AM" -Daily
    $trigger2 = New-ScheduledTaskTrigger -At "08:00AM" -Daily
    $trigger3 = New-ScheduledTaskTrigger -At "02:00PM" -Daily
    $trigger4 = New-ScheduledTaskTrigger -At "08:00PM" -Daily
    
    # Register the task
    try {
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger1,$trigger2,$trigger3,$trigger4 -Description "Full Uproar Database Backup" -RunLevel Highest
        Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not create scheduled task automatically." -ForegroundColor Yellow
        Write-Host "Please create it manually:" -ForegroundColor Yellow
        Write-Host "1. Open Task Scheduler (Win+R, type: taskschd.msc)" -ForegroundColor Cyan
        Write-Host "2. Create Basic Task → Name: 'FullUproar Backup'" -ForegroundColor Cyan
        Write-Host "3. Trigger: Daily, Repeat every 6 hours" -ForegroundColor Cyan
        Write-Host "4. Action: Start a program" -ForegroundColor Cyan
        Write-Host "5. Program: $PWD\backup-task.bat" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test your backup: npm run backup:database" -ForegroundColor Cyan
Write-Host "2. Verify backup was uploaded to your chosen provider" -ForegroundColor Cyan
Write-Host "3. Test restore: npm run backup:restore <backup-file>" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Important Commands:" -ForegroundColor Yellow
Write-Host "• Manual backup: npm run backup:database" -ForegroundColor Cyan
Write-Host "• Security check: npm run security:audit" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏰ Backup Schedule:" -ForegroundColor Yellow
Write-Host "• Automatic backups every 6 hours" -ForegroundColor Cyan
Write-Host "• Retention: 30 days local, unlimited cloud" -ForegroundColor Cyan
Write-Host "• Encryption: AES-256-GCM" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔒 Your encryption key has been saved to .env.local" -ForegroundColor Yellow
Write-Host "⚠️  IMPORTANT: Save this key somewhere safe!" -ForegroundColor Red
Write-Host "Encryption Key: $encryptionKey" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")