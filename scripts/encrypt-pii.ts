#!/usr/bin/env ts-node
/**
 * Script to encrypt existing PII data in the database
 * Run this once to migrate unencrypted data to encrypted format
 */

import { PrismaClient } from '@prisma/client';
import { getEncryptionService, encryption } from '../lib/security/encryption';
import { logger } from '../lib/admin/utils/logger';

const prisma = new PrismaClient();
const encryptionService = getEncryptionService();

interface MigrationStats {
  total: number;
  encrypted: number;
  skipped: number;
  failed: number;
}

class PIIEncryption {
  private stats: MigrationStats = {
    total: 0,
    encrypted: 0,
    skipped: 0,
    failed: 0
  };

  async encryptAllPII(): Promise<void> {
    console.log('🔐 Starting PII Encryption Migration...\n');
    
    try {
      await this.encryptUsers();
      // Note: No employee table in current schema
      // await this.encryptEmployees();
      await this.encryptOrders();
      await this.printResults();
      
      console.log('\n✅ PII encryption completed successfully');
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw error;
    }
  }

  private async encryptUsers(): Promise<void> {
    console.log('👤 Encrypting user data...');
    
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      this.stats.total++;
      
      try {
        const updates: any = {};
        let needsUpdate = false;
        
        // Check if email is already encrypted
        if (user.email && !this.isEncrypted(user.email)) {
          // Store original email in encrypted field
          updates.emailEncrypted = encryption.encryptPII(user.email);
          // Hash email for lookups
          updates.emailHash = encryption.hashEmail(user.email);
          needsUpdate = true;
        }
        
        // Encrypt phone if exists and not encrypted
        if ((user as any).phone && !this.isEncrypted((user as any).phone)) {
          updates.phone = encryption.encryptPII((user as any).phone);
          needsUpdate = true;
        }
        
        // Encrypt SSN if exists
        if ((user as any).ssn && !this.isEncrypted((user as any).ssn)) {
          updates.ssn = encryption.encryptPII((user as any).ssn);
          updates.ssnMasked = encryption.maskSSN((user as any).ssn);
          needsUpdate = true;
        }
        
        // Encrypt date of birth if exists
        if ((user as any).dateOfBirth && !this.isEncrypted((user as any).dateOfBirth)) {
          updates.dateOfBirth = encryption.encryptPII((user as any).dateOfBirth);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await prisma.user.update({
            where: { id: user.id },
            data: updates
          });
          this.stats.encrypted++;
          console.log(`  ✓ Encrypted user ${user.id}`);
        } else {
          this.stats.skipped++;
        }
      } catch (error) {
        this.stats.failed++;
        console.error(`  ✗ Failed to encrypt user ${user.id}:`, error);
      }
    }
    
    console.log(`  Processed ${users.length} users`);
  }

  // Note: No employee table in current schema - this method is kept for future use
  private async encryptEmployees(): Promise<void> {
    console.log('\n👔 Employee encryption skipped - no employee table in schema');
    // This method would encrypt employee data if the table existed
    return Promise.resolve();
  }

  private async encryptOrders(): Promise<void> {
    console.log('\n📦 Encrypting order data...');
    
    const orders = await prisma.order.findMany();
    
    for (const order of orders) {
      this.stats.total++;
      
      try {
        const updates: any = {};
        let needsUpdate = false;
        
        // Encrypt customer phone in order
        if ((order as any).customerPhone && !this.isEncrypted((order as any).customerPhone)) {
          updates.customerPhone = encryption.encryptPII((order as any).customerPhone);
          needsUpdate = true;
        }
        
        // Note: shippingAddress is a text field, not a relation
        // If we need to encrypt addresses, we should store them encrypted in the text field
        if (order.shippingAddress && !this.isEncrypted(order.shippingAddress)) {
          updates.shippingAddress = encryption.encryptPII(order.shippingAddress);
          needsUpdate = true;
        }
        
        // Encrypt credit card last 4 (should be tokenized via Stripe)
        if ((order as any).cardLast4 && !this.isEncrypted((order as any).cardLast4)) {
          updates.cardLast4 = encryption.encryptPII((order as any).cardLast4);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await prisma.order.update({
            where: { id: order.id },
            data: updates
          });
          this.stats.encrypted++;
          console.log(`  ✓ Encrypted order ${order.id}`);
        } else {
          this.stats.skipped++;
        }
      } catch (error) {
        this.stats.failed++;
        console.error(`  ✗ Failed to encrypt order ${order.id}:`, error);
      }
    }
    
    console.log(`  Processed ${orders.length} orders`);
  }

  private isEncrypted(value: string): boolean {
    // Check if value is already encrypted (JSON with encryption metadata)
    try {
      const parsed = JSON.parse(value);
      return !!(parsed.encrypted && parsed.iv && parsed.authTag);
    } catch {
      return false;
    }
  }

  private async printResults(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('ENCRYPTION MIGRATION RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Records: ${this.stats.total}`);
    console.log(`✅ Encrypted: ${this.stats.encrypted}`);
    console.log(`⏭️  Skipped (already encrypted): ${this.stats.skipped}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    
    if (this.stats.failed > 0) {
      console.log('\n⚠️  Some records failed to encrypt. Review logs for details.');
    }
    
    // Log to analytics event (no audit log table)
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'PII_ENCRYPTION_MIGRATION',
        properties: {
          action: 'PII_ENCRYPTION_MIGRATION',
          status: this.stats.failed === 0 ? 'SUCCESS' : 'PARTIAL',
          metadata: this.stats
        },
        sessionId: 'system',
        timestamp: new Date(),
        createdAt: new Date()
      }
    });
  }

  async decryptPII(recordType: 'user' | 'employee' | 'order', recordId: string): Promise<any> {
    console.log(`🔓 Decrypting ${recordType} ${recordId}...`);
    
    try {
      let record: any;
      
      switch (recordType) {
        case 'user':
          record = await prisma.user.findUnique({ where: { id: recordId } });
          if (record) {
            return {
              ...record,
              email: record.emailEncrypted ? 
                encryption.decryptPII(record.emailEncrypted) : record.email,
              phone: record.phone ? 
                encryption.decryptPII(record.phone) : null,
              ssn: (record as any).ssn ? 
                encryption.decryptPII((record as any).ssn) : null,
              dateOfBirth: (record as any).dateOfBirth ? 
                encryption.decryptPII((record as any).dateOfBirth) : null
            };
          }
          break;
          
        case 'employee':
          // No employee table in current schema
          console.log('Employee table does not exist in current schema');
          return null;
          break;
          
        case 'order':
          record = await prisma.order.findUnique({ 
            where: { id: recordId }
          });
          if (record) {
            return {
              ...record,
              customerPhone: record.customerPhone ? 
                encryption.decryptPII(record.customerPhone) : null,
              shippingAddress: record.shippingAddress && this.isEncrypted(record.shippingAddress) ? 
                encryption.decryptPII(record.shippingAddress) : record.shippingAddress
            };
          }
          break;
      }
      
      return record;
    } catch (error) {
      console.error(`Failed to decrypt ${recordType} ${recordId}:`, error);
      throw error;
    }
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  const piiEncryption = new PIIEncryption();
  
  if (command === 'decrypt') {
    // Decrypt a specific record for debugging
    const recordType = process.argv[3] as 'user' | 'employee' | 'order';
    const recordId = process.argv[4];
    
    if (!recordType || !recordId) {
      console.error('Usage: npm run security:encrypt decrypt <user|employee|order> <id>');
      process.exit(1);
    }
    
    piiEncryption.decryptPII(recordType, recordId)
      .then(decrypted => {
        console.log('\nDecrypted data:');
        console.log(JSON.stringify(decrypted, null, 2));
      })
      .catch(error => {
        console.error('Decryption failed:', error);
        process.exit(1);
      })
      .finally(() => prisma.$disconnect());
      
  } else {
    // Run encryption migration
    piiEncryption.encryptAllPII()
      .then(() => {
        console.log('\n✨ PII encryption migration completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
      })
      .finally(() => prisma.$disconnect());
  }
}