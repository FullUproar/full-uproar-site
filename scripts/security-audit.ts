#!/usr/bin/env ts-node
/**
 * Security audit script to check for vulnerabilities and compliance
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getEncryptionService } from '../lib/security/encryption';

const prisma = new PrismaClient();

interface AuditResult {
  category: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details?: any;
}

class SecurityAudit {
  private results: AuditResult[] = [];

  async runFullAudit(): Promise<void> {
    console.log('🔒 Starting Security Audit...\n');

    await this.auditEnvironmentVariables();
    await this.auditDatabaseSecurity();
    await this.auditEncryption();
    await this.auditAuthentication();
    await this.auditDataPrivacy();
    await this.auditBackups();
    await this.auditApiSecurity();
    await this.auditDependencies();

    this.printResults();
    await this.saveReport();
  }

  private async auditEnvironmentVariables(): Promise<void> {
    console.log('📋 Auditing Environment Variables...');

    const requiredVars = [
      'DATABASE_URL',
      'CLERK_SECRET_KEY',
      'STRIPE_SECRET_KEY',
      'ENCRYPTION_KEY',
      'BACKUP_ENCRYPTION_KEY'
    ];

    const recommendedVars = [
      'SENTRY_DSN',
      'MONITORING_WEBHOOK',
      'S3_BACKUP_BUCKET',
      'UPSTASH_REDIS_REST_URL'
    ];

    // Check required variables
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.addResult({
          category: 'Environment',
          status: 'FAIL',
          message: `Missing required environment variable: ${varName}`,
          severity: 'CRITICAL'
        });
      } else {
        // Check for default/weak values
        if (varName.includes('KEY') && process.env[varName]?.includes('test')) {
          this.addResult({
            category: 'Environment',
            status: 'WARN',
            message: `Weak value detected for ${varName}`,
            severity: 'HIGH'
          });
        }
      }
    }

    // Check recommended variables
    for (const varName of recommendedVars) {
      if (!process.env[varName]) {
        this.addResult({
          category: 'Environment',
          status: 'WARN',
          message: `Missing recommended variable: ${varName}`,
          severity: 'MEDIUM'
        });
      }
    }

    // Check for exposed secrets
    if (process.env.NODE_ENV === 'production') {
      const publicVars = Object.keys(process.env).filter(key => 
        key.startsWith('NEXT_PUBLIC_') && 
        (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD'))
      );

      for (const varName of publicVars) {
        this.addResult({
          category: 'Environment',
          status: 'FAIL',
          message: `Potential secret exposed in public variable: ${varName}`,
          severity: 'CRITICAL'
        });
      }
    }
  }

  private async auditDatabaseSecurity(): Promise<void> {
    console.log('🗄️  Auditing Database Security...');

    try {
      // Check SSL connection
      const dbUrl = process.env.DATABASE_URL || '';
      if (!dbUrl.includes('sslmode=require')) {
        this.addResult({
          category: 'Database',
          status: 'FAIL',
          message: 'Database connection not using SSL',
          severity: 'HIGH'
        });
      }

      // Check for unencrypted PII
      const users = await prisma.user.findMany({ take: 1 });
      if (users.length > 0) {
        const user = users[0] as any;
        
        // Check if sensitive fields appear to be encrypted
        const sensitiveFields = ['phone', 'ssn', 'dateOfBirth', 'bankAccount'];
        for (const field of sensitiveFields) {
          if (user[field] && !this.looksEncrypted(user[field])) {
            this.addResult({
              category: 'Database',
              status: 'FAIL',
              message: `Unencrypted PII detected: ${field}`,
              severity: 'CRITICAL'
            });
          }
        }
      }

      // Check for proper indexes
      const indexes = await prisma.$queryRaw`
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
      ` as any[];

      const requiredIndexes = ['users_email', 'orders_userId', 'sessions_token'];
      for (const indexName of requiredIndexes) {
        if (!indexes.some(idx => idx.indexname?.includes(indexName))) {
          this.addResult({
            category: 'Database',
            status: 'WARN',
            message: `Missing recommended index: ${indexName}`,
            severity: 'LOW'
          });
        }
      }

      this.addResult({
        category: 'Database',
        status: 'PASS',
        message: 'Database security checks passed',
        severity: 'LOW'
      });

    } catch (error) {
      this.addResult({
        category: 'Database',
        status: 'FAIL',
        message: 'Could not complete database audit',
        severity: 'HIGH',
        details: error
      });
    }
  }

  private async auditEncryption(): Promise<void> {
    console.log('🔐 Auditing Encryption...');

    try {
      const encryptionService = getEncryptionService();
      
      // Test encryption/decryption
      const testData = 'test-sensitive-data';
      const encrypted = encryptionService.encrypt(testData);
      const decrypted = encryptionService.decrypt(encrypted);
      
      if (decrypted !== testData) {
        this.addResult({
          category: 'Encryption',
          status: 'FAIL',
          message: 'Encryption/decryption test failed',
          severity: 'CRITICAL'
        });
      }

      // Check key strength
      const keyLength = (process.env.ENCRYPTION_KEY || '').length;
      if (keyLength < 64) { // 32 bytes in hex
        this.addResult({
          category: 'Encryption',
          status: 'FAIL',
          message: `Encryption key too short (${keyLength}/64 characters)`,
          severity: 'HIGH'
        });
      }

      this.addResult({
        category: 'Encryption',
        status: 'PASS',
        message: 'Encryption service operational',
        severity: 'LOW'
      });

    } catch (error) {
      this.addResult({
        category: 'Encryption',
        status: 'FAIL',
        message: 'Encryption service not available',
        severity: 'CRITICAL',
        details: error
      });
    }
  }

  private async auditAuthentication(): Promise<void> {
    console.log('🔑 Auditing Authentication...');

    // Check for weak passwords in test accounts
    const testUsers = await prisma.user.findMany({
      where: {
        email: { contains: 'test' }
      }
    });

    if (process.env.NODE_ENV === 'production' && testUsers.length > 0) {
      this.addResult({
        category: 'Authentication',
        status: 'WARN',
        message: `Found ${testUsers.length} test accounts in production`,
        severity: 'MEDIUM'
      });
    }

    // Check session configuration
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      this.addResult({
        category: 'Authentication',
        status: 'FAIL',
        message: 'Weak or missing session secret',
        severity: 'HIGH'
      });
    }

    // Check for MFA enforcement
    const adminUsers = await prisma.employee.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }}
    });

    for (const admin of adminUsers) {
      // Check if MFA is enabled (this would need to be implemented)
      // For now, just warn
      this.addResult({
        category: 'Authentication',
        status: 'WARN',
        message: `MFA not enforced for admin: ${admin.email}`,
        severity: 'MEDIUM'
      });
      break; // Only warn once
    }
  }

  private async auditDataPrivacy(): Promise<void> {
    console.log('📊 Auditing Data Privacy...');

    // Check for data retention compliance
    const oldOrders = await prisma.order.count({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000) // 7 years
        }
      }
    });

    if (oldOrders > 0) {
      this.addResult({
        category: 'Privacy',
        status: 'WARN',
        message: `Found ${oldOrders} orders older than 7 years`,
        severity: 'MEDIUM',
        details: 'Consider data retention policy'
      });
    }

    // Check for audit logging
    const auditLogs = await prisma.auditLog.count();
    if (auditLogs === 0) {
      this.addResult({
        category: 'Privacy',
        status: 'FAIL',
        message: 'No audit logs found',
        severity: 'HIGH'
      });
    }

    // Check for GDPR compliance features
    const gdprFeatures = {
      dataExport: await this.checkFeatureExists('data-export'),
      dataDelete: await this.checkFeatureExists('data-delete'),
      consentTracking: await this.checkFeatureExists('consent'),
      privacyPolicy: await this.checkFileExists('app/privacy/page.tsx')
    };

    for (const [feature, exists] of Object.entries(gdprFeatures)) {
      if (!exists) {
        this.addResult({
          category: 'Privacy',
          status: 'WARN',
          message: `GDPR feature not implemented: ${feature}`,
          severity: 'MEDIUM'
        });
      }
    }
  }

  private async auditBackups(): Promise<void> {
    console.log('💾 Auditing Backup Strategy...');

    // Check for backup configuration
    if (!process.env.S3_BACKUP_BUCKET && !process.env.USE_VERCEL_BLOB) {
      this.addResult({
        category: 'Backup',
        status: 'FAIL',
        message: 'No backup storage configured',
        severity: 'CRITICAL'
      });
    }

    // Check for backup logs
    const backupLogPath = path.join(process.cwd(), 'backups', 'backup.log');
    try {
      const logContent = await fs.readFile(backupLogPath, 'utf-8');
      const lines = logContent.split('\n').filter(l => l.trim());
      
      if (lines.length === 0) {
        this.addResult({
          category: 'Backup',
          status: 'WARN',
          message: 'No backup history found',
          severity: 'HIGH'
        });
      } else {
        const lastBackup = lines[lines.length - 1];
        const lastBackupDate = new Date(lastBackup.split(' - ')[0]);
        const hoursSinceBackup = (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceBackup > 24) {
          this.addResult({
            category: 'Backup',
            status: 'WARN',
            message: `Last backup was ${Math.round(hoursSinceBackup)} hours ago`,
            severity: 'HIGH'
          });
        } else {
          this.addResult({
            category: 'Backup',
            status: 'PASS',
            message: 'Recent backup found',
            severity: 'LOW'
          });
        }
      }
    } catch {
      this.addResult({
        category: 'Backup',
        status: 'FAIL',
        message: 'No backup log file found',
        severity: 'HIGH'
      });
    }
  }

  private async auditApiSecurity(): Promise<void> {
    console.log('🌐 Auditing API Security...');

    // Check for rate limiting
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      this.addResult({
        category: 'API',
        status: 'WARN',
        message: 'Rate limiting not configured',
        severity: 'MEDIUM'
      });
    }

    // Check for CORS configuration
    const corsFile = path.join(process.cwd(), 'middleware.ts');
    try {
      const content = await fs.readFile(corsFile, 'utf-8');
      if (!content.includes('Access-Control')) {
        this.addResult({
          category: 'API',
          status: 'WARN',
          message: 'CORS headers not configured',
          severity: 'MEDIUM'
        });
      }
    } catch {
      // Middleware file might not exist
    }

    // Check for API versioning
    const apiRoutes = await this.findFiles('app/api', '.ts');
    const versionedRoutes = apiRoutes.filter(r => r.includes('/v1/') || r.includes('/v2/'));
    
    if (apiRoutes.length > 0 && versionedRoutes.length === 0) {
      this.addResult({
        category: 'API',
        status: 'WARN',
        message: 'API versioning not implemented',
        severity: 'LOW'
      });
    }
  }

  private async auditDependencies(): Promise<void> {
    console.log('📦 Auditing Dependencies...');

    try {
      // Run npm audit
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('npm audit --json');
      const audit = JSON.parse(stdout);
      
      if (audit.metadata.vulnerabilities.critical > 0) {
        this.addResult({
          category: 'Dependencies',
          status: 'FAIL',
          message: `${audit.metadata.vulnerabilities.critical} critical vulnerabilities found`,
          severity: 'CRITICAL'
        });
      }
      
      if (audit.metadata.vulnerabilities.high > 0) {
        this.addResult({
          category: 'Dependencies',
          status: 'WARN',
          message: `${audit.metadata.vulnerabilities.high} high severity vulnerabilities found`,
          severity: 'HIGH'
        });
      }
      
      if (audit.metadata.vulnerabilities.total === 0) {
        this.addResult({
          category: 'Dependencies',
          status: 'PASS',
          message: 'No known vulnerabilities',
          severity: 'LOW'
        });
      }
    } catch (error) {
      this.addResult({
        category: 'Dependencies',
        status: 'WARN',
        message: 'Could not run dependency audit',
        severity: 'MEDIUM',
        details: error
      });
    }
  }

  private looksEncrypted(value: string): boolean {
    // Check if value looks like encrypted data (JSON with encryption metadata)
    try {
      const parsed = JSON.parse(value);
      return parsed.encrypted && parsed.iv && parsed.authTag;
    } catch {
      // Not JSON, check if it's base64 encoded
      return /^[A-Za-z0-9+/]+=*$/.test(value) && value.length > 50;
    }
  }

  private async checkFeatureExists(feature: string): Promise<boolean> {
    const possiblePaths = [
      `app/api/${feature}/route.ts`,
      `app/${feature}/page.tsx`,
      `lib/${feature}.ts`
    ];

    for (const filePath of possiblePaths) {
      try {
        await fs.access(path.join(process.cwd(), filePath));
        return true;
      } catch {
        // File doesn't exist
      }
    }
    return false;
  }

  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(process.cwd(), filePath));
      return true;
    } catch {
      return false;
    }
  }

  private async findFiles(dir: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(path.join(process.cwd(), dir), { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...await this.findFiles(fullPath, extension));
        } else if (entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist
    }
    
    return files;
  }

  private addResult(result: AuditResult): void {
    this.results.push(result);
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('SECURITY AUDIT RESULTS');
    console.log('='.repeat(60) + '\n');

    const grouped = this.results.reduce((acc, result) => {
      if (!acc[result.category]) acc[result.category] = [];
      acc[result.category].push(result);
      return acc;
    }, {} as Record<string, AuditResult[]>);

    for (const [category, results] of Object.entries(grouped)) {
      console.log(`\n📋 ${category}`);
      console.log('-'.repeat(40));
      
      for (const result of results) {
        const icon = result.status === 'PASS' ? '✅' : 
                     result.status === 'FAIL' ? '❌' : '⚠️';
        const color = result.status === 'PASS' ? '\x1b[32m' :
                      result.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
        const reset = '\x1b[0m';
        
        console.log(`${icon} ${color}[${result.severity}]${reset} ${result.message}`);
        
        if (result.details && process.env.VERBOSE) {
          console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
        }
      }
    }

    // Summary
    const stats = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARN').length,
      critical: this.results.filter(r => r.severity === 'CRITICAL').length
    };

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Checks: ${stats.total}`);
    console.log(`✅ Passed: ${stats.passed}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`⚠️  Warnings: ${stats.warnings}`);
    
    if (stats.critical > 0) {
      console.log(`\n🚨 ${stats.critical} CRITICAL issues require immediate attention!`);
    }

    const score = Math.round((stats.passed / stats.total) * 100);
    console.log(`\n🔒 Security Score: ${score}%`);
    
    if (score < 50) {
      console.log('⚠️  Security posture needs significant improvement');
    } else if (score < 80) {
      console.log('📈 Security posture is acceptable but can be improved');
    } else {
      console.log('✅ Security posture is strong');
    }
  }

  private async saveReport(): Promise<void> {
    const reportDir = path.join(process.cwd(), 'security-reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `security-audit-${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        warnings: this.results.filter(r => r.status === 'WARN').length,
        score: Math.round((this.results.filter(r => r.status === 'PASS').length / this.results.length) * 100)
      }
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }
}

// Run audit if executed directly
if (require.main === module) {
  const audit = new SecurityAudit();
  audit.runFullAudit()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Audit failed:', error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

export { SecurityAudit };