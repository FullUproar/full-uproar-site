#!/usr/bin/env ts-node
/**
 * Database backup script with encryption and cloud storage
 * Run: npm run backup:database
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { put } from '@vercel/blob';

const execAsync = promisify(exec);

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  s3Bucket?: string;
  retentionDays: number;
  encryptionKey: string;
  useVercelBlob: boolean;
}

class DatabaseBackup {
  private config: BackupConfig;
  private s3Client?: S3Client;

  constructor() {
    this.config = {
      databaseUrl: process.env.DATABASE_URL!,
      backupDir: path.join(process.cwd(), 'backups'),
      s3Bucket: process.env.S3_BACKUP_BUCKET,
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
      useVercelBlob: process.env.USE_VERCEL_BLOB === 'true'
    };

    if (this.config.s3Bucket && !this.config.useVercelBlob) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-west-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
      });
    }

    this.validateConfig();
  }

  private validateConfig() {
    if (!this.config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    if (!this.config.encryptionKey) {
      console.warn('⚠️  No BACKUP_ENCRYPTION_KEY set, using random key (not recommended for production)');
    }
  }

  async backup(): Promise<string> {
    console.log('🚀 Starting database backup...');
    
    // Create backup directory if it doesn't exist
    await fs.mkdir(this.config.backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup_${timestamp}.sql`;
    const backupPath = path.join(this.config.backupDir, backupFilename);
    
    try {
      // Step 1: Create database dump
      console.log('📦 Creating database dump...');
      await this.createDump(backupPath);
      
      // Step 2: Compress the backup
      console.log('🗜️  Compressing backup...');
      const compressedPath = await this.compressFile(backupPath);
      
      // Step 3: Encrypt the backup
      console.log('🔐 Encrypting backup...');
      const encryptedPath = await this.encryptFile(compressedPath);
      
      // Step 4: Upload to cloud storage
      console.log('☁️  Uploading to cloud storage...');
      const uploadUrl = await this.uploadToCloud(encryptedPath, `${backupFilename}.gz.enc`);
      
      // Step 5: Clean up old local backups
      console.log('🧹 Cleaning up old backups...');
      await this.cleanupOldBackups();
      
      // Step 6: Verify backup
      console.log('✅ Verifying backup...');
      await this.verifyBackup(encryptedPath);
      
      // Log success
      await this.logBackup({
        filename: `${backupFilename}.gz.enc`,
        size: (await fs.stat(encryptedPath)).size,
        location: uploadUrl,
        timestamp: new Date(),
        success: true
      });
      
      console.log(`✨ Backup completed successfully: ${backupFilename}`);
      return uploadUrl;
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      await this.alertOnFailure(error as Error);
      throw error;
    }
  }

  private async createDump(outputPath: string): Promise<void> {
    const connectionUrl = new URL(this.config.databaseUrl);
    
    // Build pg_dump command with proper escaping
    const pgDumpCommand = `pg_dump "${this.config.databaseUrl}" > "${outputPath}"`;
    
    // Alternative using environment variable
    const env = {
      ...process.env,
      PGPASSWORD: connectionUrl.password || ''
    };
    
    try {
      await execAsync(pgDumpCommand, { env });
      
      // Verify dump file was created
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Database dump is empty');
      }
      
      console.log(`  ✓ Database dump created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error: any) {
      // Fallback to Prisma-based export if pg_dump is not available
      console.log('  ⚠️  pg_dump not available, using Prisma export...');
      await this.prismaExport(outputPath);
    }
  }

  private async prismaExport(outputPath: string): Promise<void> {
    // Alternative backup method using Prisma
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const tables = [
        'User', 'Game', 'Merchandise', 'Order', 'OrderItem',
        'Cart', 'CartItem', 'Inventory', 'Employee', 'Invoice'
      ];
      
      let sqlContent = '-- Prisma Database Export\n';
      sqlContent += `-- Generated at ${new Date().toISOString()}\n\n`;
      
      for (const table of tables) {
        console.log(`  Exporting ${table}...`);
        const data = await (prisma as any)[table.toLowerCase()].findMany();
        
        if (data.length > 0) {
          sqlContent += `-- Table: ${table}\n`;
          sqlContent += `DELETE FROM "${table}";\n`;
          
          for (const row of data) {
            const values = Object.values(row).map(v => 
              v === null ? 'NULL' : 
              typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
              v instanceof Date ? `'${v.toISOString()}'` :
              v.toString()
            ).join(', ');
            
            sqlContent += `INSERT INTO "${table}" VALUES (${values});\n`;
          }
          sqlContent += '\n';
        }
      }
      
      await fs.writeFile(outputPath, sqlContent);
      console.log('  ✓ Prisma export completed');
      
    } finally {
      await prisma.$disconnect();
    }
  }

  private async compressFile(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.gz`;
    const { createGzip } = require('zlib');
    const { pipeline } = require('stream/promises');
    const { createReadStream, createWriteStream } = require('fs');
    
    await pipeline(
      createReadStream(inputPath),
      createGzip({ level: 9 }), // Maximum compression
      createWriteStream(outputPath)
    );
    
    // Remove uncompressed file
    await fs.unlink(inputPath);
    
    const stats = await fs.stat(outputPath);
    console.log(`  ✓ Compressed to ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return outputPath;
  }

  private async encryptFile(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.enc`;
    
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.config.encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const input = await fs.readFile(inputPath);
    const encrypted = Buffer.concat([
      cipher.update(input),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Store IV and auth tag with the encrypted data
    const output = Buffer.concat([
      iv,
      authTag,
      encrypted
    ]);
    
    await fs.writeFile(outputPath, output);
    
    // Remove unencrypted file
    await fs.unlink(inputPath);
    
    console.log('  ✓ Backup encrypted');
    return outputPath;
  }

  private async uploadToCloud(filePath: string, filename: string): Promise<string> {
    const fileContent = await fs.readFile(filePath);
    
    if (this.config.useVercelBlob) {
      // Upload to Vercel Blob Storage
      const blob = await put(`backups/database/${filename}`, fileContent, {
        access: 'private',
        addRandomSuffix: false,
      });
      console.log('  ✓ Uploaded to Vercel Blob Storage');
      return blob.url;
      
    } else if (this.s3Client && this.config.s3Bucket) {
      // Upload to AWS S3
      const command = new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: `database/${filename}`,
        Body: fileContent,
        StorageClass: 'GLACIER_IR', // Cost-effective for backups
        ServerSideEncryption: 'AES256',
        Metadata: {
          'backup-date': new Date().toISOString(),
          'encrypted': 'true',
          'compression': 'gzip'
        }
      });
      
      await this.s3Client.send(command);
      console.log('  ✓ Uploaded to AWS S3');
      return `s3://${this.config.s3Bucket}/database/${filename}`;
      
    } else {
      console.log('  ⚠️  No cloud storage configured, keeping local backup only');
      return `file://${filePath}`;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const files = await fs.readdir(this.config.backupDir);
    const now = Date.now();
    const maxAge = this.config.retentionDays * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    for (const file of files) {
      if (file.startsWith('backup_')) {
        const filePath = path.join(this.config.backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }
    
    if (deletedCount > 0) {
      console.log(`  ✓ Deleted ${deletedCount} old backup(s)`);
    }
  }

  private async verifyBackup(backupPath: string): Promise<void> {
    const stats = await fs.stat(backupPath);
    
    if (stats.size < 1000) {
      throw new Error('Backup file is suspiciously small');
    }
    
    // TODO: Implement more thorough verification
    // - Test decryption
    // - Test decompression
    // - Validate SQL syntax
    // - Check for required tables
    
    console.log('  ✓ Backup verification passed');
  }

  private async logBackup(info: any): Promise<void> {
    const logPath = path.join(this.config.backupDir, 'backup.log');
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(info)}\n`;
    await fs.appendFile(logPath, logEntry);
    
    // Also log to database if available
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.auditLog.create({
        data: {
          action: 'DATABASE_BACKUP',
          status: info.success ? 'SUCCESS' : 'FAILED',
          metadata: info,
          timestamp: new Date()
        }
      });
      
      await prisma.$disconnect();
    } catch (error) {
      // Database might not be available during disaster recovery
      console.log('  ⚠️  Could not log to database');
    }
  }

  private async alertOnFailure(error: Error): Promise<void> {
    console.error('🚨 BACKUP FAILED - Sending alerts...');
    
    // Send alerts via multiple channels
    const alerts = [];
    
    // Slack webhook
    if (process.env.SLACK_WEBHOOK) {
      alerts.push(fetch(process.env.SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🚨 Database Backup Failed',
          attachments: [{
            color: 'danger',
            fields: [{
              title: 'Error',
              value: error.message,
              short: false
            }, {
              title: 'Time',
              value: new Date().toISOString(),
              short: true
            }]
          }]
        })
      }));
    }
    
    // Discord webhook
    if (process.env.DISCORD_WEBHOOK) {
      alerts.push(fetch(process.env.DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🚨 **Database Backup Failed**',
          embeds: [{
            color: 0xFF0000,
            fields: [{
              name: 'Error',
              value: error.message
            }],
            timestamp: new Date().toISOString()
          }]
        })
      }));
    }
    
    await Promise.all(alerts);
  }

  async restore(backupFile: string, targetDatabase?: string): Promise<void> {
    console.log('🔄 Starting database restore...');
    
    // Download from cloud if needed
    let localFile = backupFile;
    if (backupFile.startsWith('s3://') || backupFile.startsWith('http')) {
      localFile = await this.downloadBackup(backupFile);
    }
    
    // Decrypt
    const decryptedFile = await this.decryptFile(localFile);
    
    // Decompress
    const sqlFile = await this.decompressFile(decryptedFile);
    
    // Restore
    const dbUrl = targetDatabase || this.config.databaseUrl;
    await execAsync(`psql "${dbUrl}" < "${sqlFile}"`);
    
    console.log('✅ Database restored successfully');
  }

  private async downloadBackup(url: string): Promise<string> {
    // Implementation for downloading from cloud storage
    throw new Error('Download from cloud not yet implemented');
  }

  private async decryptFile(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace('.enc', '');
    
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.config.encryptionKey, 'hex');
    
    const fileContent = await fs.readFile(inputPath);
    const iv = fileContent.slice(0, 16);
    const authTag = fileContent.slice(16, 32);
    const encrypted = fileContent.slice(32);
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    await fs.writeFile(outputPath, decrypted);
    return outputPath;
  }

  private async decompressFile(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace('.gz', '');
    const { createGunzip } = require('zlib');
    const { pipeline } = require('stream/promises');
    const { createReadStream, createWriteStream } = require('fs');
    
    await pipeline(
      createReadStream(inputPath),
      createGunzip(),
      createWriteStream(outputPath)
    );
    
    return outputPath;
  }
}

// Run backup if executed directly
if (require.main === module) {
  const backup = new DatabaseBackup();
  
  const command = process.argv[2];
  
  if (command === 'restore') {
    const backupFile = process.argv[3];
    if (!backupFile) {
      console.error('Usage: npm run backup:restore <backup-file>');
      process.exit(1);
    }
    backup.restore(backupFile)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    backup.backup()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

export { DatabaseBackup };