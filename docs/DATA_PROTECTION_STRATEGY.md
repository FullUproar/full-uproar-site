# Data Protection & Privacy Strategy

## Table of Contents
1. [Data Privacy Compliance](#data-privacy-compliance)
2. [Encryption Strategy](#encryption-strategy)
3. [Backup & Recovery](#backup--recovery)
4. [Security Implementation](#security-implementation)
5. [Monitoring & Auditing](#monitoring--auditing)
6. [Incident Response](#incident-response)

## Data Privacy Compliance

### GDPR Compliance (European Users)

```typescript
// User data rights implementation
interface UserDataRights {
  rightToAccess: boolean;      // Data portability
  rightToErasure: boolean;     // Right to be forgotten
  rightToRectification: boolean; // Correct data
  rightToRestriction: boolean;  // Limit processing
  rightToPortability: boolean;  // Export data
  rightToObject: boolean;      // Opt-out
}
```

### Implementation Checklist

- [ ] Privacy Policy page with clear data usage
- [ ] Cookie consent banner with granular controls
- [ ] Data Processing Agreement (DPA) for third parties
- [ ] User consent tracking and audit logs
- [ ] Data retention policies
- [ ] Right to deletion implementation
- [ ] Data export functionality
- [ ] Breach notification procedures (72-hour rule)

### CCPA Compliance (California Users)

```typescript
// California Consumer Privacy Act requirements
interface CCPACompliance {
  doNotSellMyInfo: boolean;
  optOutLink: string;
  privacyRights: string[];
  dataCategories: DataCategory[];
}
```

## Encryption Strategy

### 1. Data at Rest Encryption

```typescript
// Database field encryption for sensitive data
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor() {
    // Store in environment variable
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }
  
  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}
```

### 2. Personally Identifiable Information (PII) Protection

```prisma
// Update Prisma schema for encrypted fields
model User {
  id            String   @id @default(cuid())
  email         String   @unique // Hashed for lookups
  emailEncrypted String  // Encrypted version
  phone         String?  // Encrypted
  ssn           String?  // Encrypted
  dateOfBirth   String?  // Encrypted
  
  // Financial data - always encrypted
  bankAccount   String?  // Encrypted
  creditCard    String?  // Tokenized via Stripe
  
  @@index([email]) // Index on hashed version for queries
}
```

### 3. Application-Level Encryption

```typescript
// Encrypt sensitive fields before database storage
async function createUser(userData: UserInput) {
  const encryption = new EncryptionService();
  
  return await prisma.user.create({
    data: {
      email: hashEmail(userData.email), // For lookups
      emailEncrypted: JSON.stringify(encryption.encrypt(userData.email)),
      phone: userData.phone ? 
        JSON.stringify(encryption.encrypt(userData.phone)) : null,
      // ... other encrypted fields
    }
  });
}
```

## Backup & Recovery

### 1. Automated Database Backups

```bash
#!/bin/bash
# scripts/backup-database.sh

# Configuration
BACKUP_DIR="/backups/postgres"
S3_BUCKET="fulluproar-backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup with compression
echo "Starting database backup..."
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Encrypt backup
openssl enc -aes-256-cbc -salt -in "$BACKUP_DIR/$BACKUP_FILE" \
  -out "$BACKUP_DIR/$BACKUP_FILE.enc" -k "$BACKUP_ENCRYPTION_KEY"

# Upload to S3 (or other cloud storage)
aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.enc" \
  "s3://$S3_BUCKET/database/$BACKUP_FILE.enc" \
  --storage-class GLACIER_IR

# Clean up local files older than 7 days
find $BACKUP_DIR -name "*.sql.gz*" -mtime +7 -delete

# Verify backup
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
  # Log success to monitoring
  curl -X POST $MONITORING_WEBHOOK -d "{\"status\":\"success\",\"backup\":\"$BACKUP_FILE\"}"
else
  echo "Backup failed!"
  # Alert on failure
  curl -X POST $ALERT_WEBHOOK -d "{\"alert\":\"Database backup failed\",\"severity\":\"critical\"}"
  exit 1
fi
```

### 2. Backup Schedule (Cron Jobs)

```bash
# Add to crontab
# Hourly incremental backups
0 * * * * /scripts/backup-incremental.sh

# Daily full backups at 2 AM
0 2 * * * /scripts/backup-database.sh

# Weekly exports to cold storage
0 3 * * 0 /scripts/backup-to-glacier.sh

# Monthly backup verification
0 4 1 * * /scripts/verify-backups.sh
```

### 3. Point-in-Time Recovery Setup

```typescript
// Enable WAL archiving for PostgreSQL
// postgresql.conf settings
const postgresConfig = {
  wal_level: 'replica',
  archive_mode: 'on',
  archive_command: 'gzip < %p > /archive/%f.gz',
  max_wal_senders: 3,
  wal_keep_segments: 64,
  hot_standby: 'on'
};
```

### 4. Disaster Recovery Plan

```yaml
# disaster-recovery.yml
recovery_objectives:
  rpo: 1h  # Recovery Point Objective - max 1 hour data loss
  rto: 4h  # Recovery Time Objective - max 4 hour downtime

backup_locations:
  primary: AWS S3 (us-west-2)
  secondary: Google Cloud Storage (us-central1)
  tertiary: On-premise NAS

recovery_procedures:
  1_assess:
    - Identify failure scope
    - Activate incident response team
    - Communication to stakeholders
  
  2_restore:
    - Provision new infrastructure
    - Restore from latest backup
    - Apply WAL logs for point-in-time
    - Verify data integrity
  
  3_validate:
    - Run integrity checks
    - Test critical functions
    - Compare with backup metrics
  
  4_cutover:
    - Update DNS records
    - Redirect traffic
    - Monitor for issues
```

## Security Implementation

### 1. Environment Variables Setup

```bash
# .env.production
# Encryption Keys (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-256-bit-key-here
BACKUP_ENCRYPTION_KEY=different-256-bit-key

# Database Security
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
DATABASE_URL_NON_POOLING=postgresql://user:pass@host:5432/db?sslmode=require

# Backup Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BACKUP_BUCKET=fulluproar-backups

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
MONITORING_WEBHOOK=https://hooks.slack.com/xxx
ALERT_WEBHOOK=https://pagerduty.com/xxx

# Security Tokens
SESSION_SECRET=generate-strong-secret
CSRF_SECRET=another-strong-secret
```

### 2. Data Access Layer with Encryption

```typescript
// lib/secure-data-access.ts
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './encryption';

export class SecureDataAccess {
  private prisma: PrismaClient;
  private encryption: EncryptionService;
  
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? 
        ['query', 'error', 'warn'] : ['error']
    });
    this.encryption = new EncryptionService();
  }
  
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) return null;
    
    // Decrypt sensitive fields
    return {
      ...user,
      email: this.encryption.decrypt(JSON.parse(user.emailEncrypted)),
      phone: user.phone ? 
        this.encryption.decrypt(JSON.parse(user.phone)) : null,
      // Mask sensitive data for logs
      creditCard: user.creditCard ? '****' : null
    };
  }
  
  async deleteUser(id: string) {
    // GDPR compliance - complete deletion
    await this.prisma.$transaction([
      // Delete related records first
      this.prisma.order.deleteMany({ where: { userId: id }}),
      this.prisma.cart.deleteMany({ where: { userId: id }}),
      this.prisma.analyticsEvent.deleteMany({ where: { userId: id }}),
      // Delete user
      this.prisma.user.delete({ where: { id }}),
      // Log deletion for compliance
      this.prisma.auditLog.create({
        data: {
          action: 'USER_DELETION',
          targetId: id,
          timestamp: new Date(),
          metadata: { gdprRequest: true }
        }
      })
    ]);
  }
}
```

### 3. Secure File Storage

```typescript
// lib/secure-file-storage.ts
import { put, del, head } from '@vercel/blob';
import crypto from 'crypto';

export class SecureFileStorage {
  async uploadFile(file: File, userId: string) {
    // Generate secure filename
    const fileId = crypto.randomBytes(16).toString('hex');
    const extension = file.name.split('.').pop();
    const secureFilename = `${userId}/${fileId}.${extension}`;
    
    // Scan for malware (integrate with service like ClamAV)
    await this.scanFile(file);
    
    // Encrypt file if sensitive
    const encryptedFile = await this.encryptFile(file);
    
    // Upload with metadata
    const blob = await put(secureFilename, encryptedFile, {
      access: 'private',
      addRandomSuffix: false,
      metadata: {
        userId,
        originalName: file.name,
        uploadDate: new Date().toISOString(),
        encrypted: true
      }
    });
    
    return blob;
  }
  
  private async scanFile(file: File) {
    // Implement virus scanning
    // Could use ClamAV, VirusTotal API, etc.
  }
  
  private async encryptFile(file: File): Promise<Blob> {
    // Implement file encryption
    const arrayBuffer = await file.arrayBuffer();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
      await this.getKey(),
      arrayBuffer
    );
    return new Blob([encrypted], { type: file.type });
  }
}
```

## Monitoring & Auditing

### 1. Security Audit Logging

```typescript
// lib/audit-logger.ts
import { PrismaClient } from '@prisma/client';

export class AuditLogger {
  private prisma: PrismaClient;
  
  async logSecurityEvent(event: SecurityEvent) {
    await this.prisma.securityLog.create({
      data: {
        eventType: event.type,
        userId: event.userId,
        ipAddress: event.ip,
        userAgent: event.userAgent,
        severity: event.severity,
        details: event.details,
        timestamp: new Date()
      }
    });
    
    // Alert on critical events
    if (event.severity === 'CRITICAL') {
      await this.sendAlert(event);
    }
  }
  
  async logDataAccess(access: DataAccessEvent) {
    await this.prisma.dataAccessLog.create({
      data: {
        userId: access.userId,
        resourceType: access.resourceType,
        resourceId: access.resourceId,
        action: access.action,
        timestamp: new Date(),
        metadata: access.metadata
      }
    });
  }
}

interface SecurityEvent {
  type: 'LOGIN_FAILED' | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH' | 'SUSPICIOUS_ACTIVITY';
  userId?: string;
  ip: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: any;
}
```

### 2. Real-time Security Monitoring

```typescript
// lib/security-monitor.ts
export class SecurityMonitor {
  private thresholds = {
    failedLogins: 5,
    requestRate: 100,
    dataExportSize: 1000
  };
  
  async checkForAnomalies(userId: string) {
    // Check failed login attempts
    const failedLogins = await this.getFailedLogins(userId, '1h');
    if (failedLogins > this.thresholds.failedLogins) {
      await this.lockAccount(userId);
      await this.alertSecurityTeam('ACCOUNT_LOCKED', { userId, failedLogins });
    }
    
    // Check unusual data access patterns
    const dataAccess = await this.getDataAccessPattern(userId, '24h');
    if (this.isAnomalous(dataAccess)) {
      await this.flagForReview(userId, 'UNUSUAL_ACCESS_PATTERN');
    }
  }
  
  private async lockAccount(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        locked: true,
        lockedAt: new Date(),
        lockedReason: 'SECURITY_THRESHOLD_EXCEEDED'
      }
    });
  }
}
```

## Incident Response

### 1. Data Breach Response Plan

```typescript
// lib/incident-response.ts
export class IncidentResponse {
  async handleDataBreach(breach: DataBreach) {
    const response = {
      containment: await this.containBreach(breach),
      assessment: await this.assessImpact(breach),
      notification: await this.notifyAffected(breach),
      remediation: await this.remediateBreach(breach),
      report: await this.generateReport(breach)
    };
    
    return response;
  }
  
  private async containBreach(breach: DataBreach) {
    // 1. Isolate affected systems
    await this.isolateSystem(breach.affectedSystem);
    
    // 2. Revoke compromised credentials
    await this.revokeCredentials(breach.compromisedAccounts);
    
    // 3. Block suspicious IPs
    await this.blockIPs(breach.suspiciousIPs);
    
    return { 
      isolated: true, 
      timestamp: new Date() 
    };
  }
  
  private async notifyAffected(breach: DataBreach) {
    // GDPR 72-hour notification requirement
    const affected = await this.getAffectedUsers(breach);
    
    for (const user of affected) {
      await this.sendBreachNotification(user, {
        incidentDate: breach.discoveredAt,
        dataTypes: breach.compromisedDataTypes,
        actions: breach.recommendedActions
      });
    }
    
    // Notify authorities if required
    if (breach.severity === 'HIGH' || affected.length > 100) {
      await this.notifyDataProtectionAuthority(breach);
    }
  }
}
```

### 2. Recovery Testing

```bash
#!/bin/bash
# scripts/test-recovery.sh

echo "Starting disaster recovery test..."

# 1. Create test database
createdb test_recovery

# 2. Restore from backup
echo "Restoring from backup..."
gunzip < /backups/latest.sql.gz | psql test_recovery

# 3. Verify data integrity
echo "Verifying data integrity..."
psql test_recovery -c "SELECT COUNT(*) FROM users;"
psql test_recovery -c "SELECT COUNT(*) FROM orders;"

# 4. Test critical functions
npm run test:recovery

# 5. Clean up
dropdb test_recovery

echo "Recovery test completed successfully"
```

## Implementation Checklist

### Immediate Actions (Week 1)
- [ ] Set up automated database backups
- [ ] Implement encryption for PII fields
- [ ] Configure backup monitoring alerts
- [ ] Create disaster recovery documentation
- [ ] Test backup restoration process

### Short-term (Month 1)
- [ ] Implement GDPR compliance features
- [ ] Set up security monitoring dashboard
- [ ] Create incident response procedures
- [ ] Implement audit logging
- [ ] Configure redundant backup locations

### Medium-term (Quarter 1)
- [ ] Achieve SOC 2 compliance
- [ ] Implement data loss prevention (DLP)
- [ ] Set up penetration testing schedule
- [ ] Create security training program
- [ ] Implement zero-trust architecture

### Long-term (Year 1)
- [ ] ISO 27001 certification
- [ ] Advanced threat detection
- [ ] Machine learning anomaly detection
- [ ] Complete business continuity plan
- [ ] Regular disaster recovery drills

## Testing Your Security

```bash
# Run security audit
npm run security:audit

# Test backup/restore
npm run backup:test

# Check encryption
npm run crypto:verify

# Vulnerability scanning
npm run security:scan
```

## Important Notes

1. **Never store encryption keys in code** - Use environment variables or key management services
2. **Test backups regularly** - A backup that doesn't restore is useless
3. **Document everything** - Procedures save critical time during incidents
4. **Plan for the worst** - Assume breach will happen and plan accordingly
5. **Stay compliant** - Regulations change, stay updated

## Support & Resources

- [GDPR Compliance Guide](https://gdpr.eu/)
- [CCPA Official Resource](https://oag.ca.gov/privacy/ccpa)
- [OWASP Security Guidelines](https://owasp.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)