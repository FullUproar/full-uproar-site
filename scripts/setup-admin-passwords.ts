/**
 * One-time script: Set passwords for admin users
 *
 * Run interactively to set initial passwords for GOD and ADMIN users
 * so they don't need to use the forgot-password flow.
 *
 * Run: npx tsx scripts/setup-admin-passwords.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const ADMIN_EMAILS = [
  'info@fulluproar.com',     // GOD
  'annika@fulluproar.com',   // ADMIN
];

function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
}

async function setupPasswords() {
  console.log('🔐 Admin Password Setup\n');
  console.log('This script sets initial passwords for admin accounts.');
  console.log('Password requirements: 8+ chars, uppercase, lowercase, number\n');

  const rl = createPrompt();

  try {
    for (const email of ADMIN_EMAILS) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, passwordHash: true },
      });

      if (!user) {
        console.log(`⏭️  ${email}: User not found in database, skipping`);
        continue;
      }

      if (user.passwordHash) {
        const overwrite = await askQuestion(rl, `${email} already has a password. Overwrite? (y/N): `);
        if (overwrite.toLowerCase() !== 'y') {
          console.log(`⏭️  ${email}: Keeping existing password\n`);
          continue;
        }
      }

      console.log(`\nSetting password for: ${email} (${user.role})`);

      let password = '';
      let valid = false;

      while (!valid) {
        password = await askQuestion(rl, `  Enter new password: `);
        const validation = validatePassword(password);

        if (!validation.valid) {
          console.log(`  ❌ ${validation.error}`);
          continue;
        }

        const confirm = await askQuestion(rl, `  Confirm password: `);
        if (password !== confirm) {
          console.log(`  ❌ Passwords don't match`);
          continue;
        }

        valid = true;
      }

      const hash = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      });

      console.log(`  ✅ Password set for ${email}\n`);
    }

    console.log('\n🎉 Admin password setup complete!');
    console.log('Admin users can now sign in with email/password at /sign-in');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

setupPasswords();
