#!/bin/bash
# Quick Offsite Backup Setup Script

echo "🚀 Full Uproar Offsite Backup Setup"
echo "===================================="
echo ""
echo "Choose your backup provider:"
echo "1) Vercel Blob Storage (Easiest - Already have account)"
echo "2) AWS S3 (Most cost-effective)"
echo "3) Backblaze B2 (Cheapest storage)"
echo "4) Google Cloud Storage"
echo "5) Cloudflare R2 (S3-compatible, no egress fees)"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
  1)
    echo ""
    echo "📦 Setting up Vercel Blob Storage..."
    echo ""
    echo "1. Go to: https://vercel.com/dashboard/stores"
    echo "2. Click 'Create Database' → 'Blob'"
    echo "3. Copy your token"
    echo ""
    read -p "Enter your Blob token (vercel_blob_rw_xxx): " blob_token
    
    # Add to .env.local
    echo "" >> .env.local
    echo "# Vercel Blob Backup Storage" >> .env.local
    echo "USE_VERCEL_BLOB=true" >> .env.local
    echo "BLOB_READ_WRITE_TOKEN=$blob_token" >> .env.local
    
    echo "✅ Vercel Blob configured!"
    echo ""
    echo "Testing backup..."
    npm run backup:database
    ;;
    
  2)
    echo ""
    echo "☁️ Setting up AWS S3..."
    echo ""
    echo "Quick Setup Steps:"
    echo "1. Go to: https://aws.amazon.com/console/"
    echo "2. Search for 'S3' → Create bucket"
    echo "   - Bucket name: fulluproar-backups-$(date +%s)"
    echo "   - Region: Choose closest to you"
    echo "   - Block all public access: ✓ (keep enabled)"
    echo ""
    echo "3. Go to IAM → Users → Add User"
    echo "   - Username: fulluproar-backup"
    echo "   - Access type: Programmatic access"
    echo "   - Attach policy: AmazonS3FullAccess (or create custom)"
    echo ""
    read -p "Enter AWS Access Key ID: " aws_key
    read -p "Enter AWS Secret Access Key: " aws_secret
    read -p "Enter S3 Bucket Name: " bucket_name
    read -p "Enter AWS Region (e.g., us-west-2): " aws_region
    
    # Add to .env.local
    echo "" >> .env.local
    echo "# AWS S3 Backup Storage" >> .env.local
    echo "AWS_ACCESS_KEY_ID=$aws_key" >> .env.local
    echo "AWS_SECRET_ACCESS_KEY=$aws_secret" >> .env.local
    echo "S3_BACKUP_BUCKET=$bucket_name" >> .env.local
    echo "AWS_REGION=$aws_region" >> .env.local
    
    # Install AWS SDK if not present
    npm install @aws-sdk/client-s3
    
    echo "✅ AWS S3 configured!"
    ;;
    
  3)
    echo ""
    echo "🔵 Setting up Backblaze B2..."
    echo ""
    echo "1. Go to: https://www.backblaze.com/b2/"
    echo "2. Sign up (10GB free)"
    echo "3. Create a bucket"
    echo "4. Create an application key"
    echo ""
    read -p "Enter B2 Application Key ID: " b2_key_id
    read -p "Enter B2 Application Key: " b2_key
    read -p "Enter B2 Bucket Name: " b2_bucket
    
    # Backblaze B2 is S3-compatible
    echo "" >> .env.local
    echo "# Backblaze B2 Backup Storage (S3 Compatible)" >> .env.local
    echo "AWS_ACCESS_KEY_ID=$b2_key_id" >> .env.local
    echo "AWS_SECRET_ACCESS_KEY=$b2_key" >> .env.local
    echo "S3_BACKUP_BUCKET=$b2_bucket" >> .env.local
    echo "S3_ENDPOINT=https://s3.us-west-001.backblazeb2.com" >> .env.local
    
    echo "✅ Backblaze B2 configured!"
    ;;
    
  4)
    echo ""
    echo "☁️ Setting up Google Cloud Storage..."
    echo ""
    echo "1. Go to: https://console.cloud.google.com"
    echo "2. Create a new project or select existing"
    echo "3. Enable Cloud Storage API"
    echo "4. Create a bucket"
    echo "5. Create a service account with Storage Admin role"
    echo "6. Download the JSON key file"
    echo ""
    read -p "Enter path to service account JSON file: " gcs_key_file
    read -p "Enter GCS Bucket Name: " gcs_bucket
    
    # Copy service account file
    cp "$gcs_key_file" ./gcs-key.json
    
    echo "" >> .env.local
    echo "# Google Cloud Storage Backup" >> .env.local
    echo "GCS_KEY_FILE=./gcs-key.json" >> .env.local
    echo "GCS_BUCKET=$gcs_bucket" >> .env.local
    
    # Install GCS SDK
    npm install @google-cloud/storage
    
    echo "✅ Google Cloud Storage configured!"
    ;;
    
  5)
    echo ""
    echo "🔶 Setting up Cloudflare R2..."
    echo ""
    echo "1. Go to: https://dash.cloudflare.com"
    echo "2. Select R2 from sidebar"
    echo "3. Create a bucket"
    echo "4. Go to R2 → Manage R2 API tokens → Create API token"
    echo ""
    read -p "Enter R2 Access Key ID: " r2_key_id
    read -p "Enter R2 Secret Access Key: " r2_secret
    read -p "Enter R2 Bucket Name: " r2_bucket
    read -p "Enter Account ID: " account_id
    
    # R2 is S3-compatible
    echo "" >> .env.local
    echo "# Cloudflare R2 Backup Storage (S3 Compatible)" >> .env.local
    echo "AWS_ACCESS_KEY_ID=$r2_key_id" >> .env.local
    echo "AWS_SECRET_ACCESS_KEY=$r2_secret" >> .env.local
    echo "S3_BACKUP_BUCKET=$r2_bucket" >> .env.local
    echo "S3_ENDPOINT=https://${account_id}.r2.cloudflarestorage.com" >> .env.local
    
    echo "✅ Cloudflare R2 configured!"
    ;;
esac

echo ""
echo "🔐 Generating encryption key for backups..."
encryption_key=$(openssl rand -hex 32)
echo "BACKUP_ENCRYPTION_KEY=$encryption_key" >> .env.local
echo ""
echo "✨ Backup encryption key generated and saved!"

echo ""
echo "📝 Setting up automated backups..."
echo ""
echo "Would you like to set up automated backups? (y/n)"
read -p "> " setup_auto

if [ "$setup_auto" = "y" ]; then
  # Check OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Setting up macOS LaunchAgent..."
    
    cat > ~/Library/LaunchAgents/com.fulluproar.backup.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.fulluproar.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$(pwd)/scripts/backup-database.ts</string>
    </array>
    <key>StartInterval</key>
    <integer>21600</integer> <!-- Every 6 hours -->
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>StandardOutPath</key>
    <string>$(pwd)/backups/backup.log</string>
    <key>StandardErrorPath</key>
    <string>$(pwd)/backups/backup-error.log</string>
</dict>
</plist>
EOF
    
    launchctl load ~/Library/LaunchAgents/com.fulluproar.backup.plist
    echo "✅ Automated backups configured for macOS!"
    
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Setting up cron job..."
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 */6 * * * cd $(pwd) && npm run backup:database >> backups/cron.log 2>&1") | crontab -
    echo "✅ Cron job configured for Linux!"
    
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    echo "Creating Windows Task Scheduler script..."
    
    cat > backup-task.bat << EOF
@echo off
cd /d "$(pwd)"
npm run backup:database >> backups\backup.log 2>&1
EOF
    
    echo ""
    echo "📋 Windows Setup Instructions:"
    echo "1. Open Task Scheduler (taskschd.msc)"
    echo "2. Create Basic Task → Name: 'FullUproar Backup'"
    echo "3. Trigger: Daily, Repeat every 6 hours"
    echo "4. Action: Start a program"
    echo "5. Program: $(pwd)/backup-task.bat"
    echo ""
    echo "Batch file created: backup-task.bat"
  fi
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Test your backup: npm run backup:database"
echo "2. Verify backup was uploaded to your chosen provider"
echo "3. Test restore: npm run backup:restore <backup-file>"
echo ""
echo "💡 Important Commands:"
echo "• Manual backup: npm run backup:database"
echo "• List backups: npm run backup:list"
echo "• Restore: npm run backup:restore <file>"
echo "• Security check: npm run security:audit"
echo ""
echo "⏰ Backup Schedule:"
echo "• Automatic backups every 6 hours"
echo "• Retention: 30 days local, unlimited cloud"
echo "• Encryption: AES-256-GCM"
echo ""
echo "🔒 Your encryption key has been saved to .env.local"
echo "⚠️  IMPORTANT: Save this key somewhere safe!"
echo "Encryption Key: $encryption_key"