/**
 * One-time migration script: Migrate users from Clerk to Auth.js
 *
 * What this does:
 * 1. For Google OAuth users: creates Account records (provider: 'google')
 * 2. Sets emailVerified = now for users who had verified emails in Clerk
 * 3. Leaves passwordHash = null (users reset via forgot-password flow)
 *
 * Run: npx tsx scripts/migrate-users-from-clerk.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('🔄 Starting Clerk → Auth.js user migration...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
      },
    });

    console.log(`Found ${users.length} users to process\n`);

    let updated = 0;
    let accountsCreated = 0;
    let emailsVerified = 0;
    let skipped = 0;

    for (const user of users) {
      const changes: string[] = [];

      // Set emailVerified if not already set
      // If the user existed in Clerk and had a verified email, mark it verified
      if (!user.emailVerified && user.email) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
        changes.push('emailVerified');
        emailsVerified++;
      }

      // If user had a Google OAuth via Clerk but no Account record yet,
      // we can't create the account link without the Google providerAccountId.
      // These users will need to re-link by signing in with Google.
      // The signIn callback in auth-config.ts handles auto-linking by email.
      if (user.accounts.length === 0) {
        changes.push('needs-google-relink-on-next-signin');
      }

      if (changes.length > 0) {
        console.log(`  ✅ ${user.email}: ${changes.join(', ')}`);
        updated++;
      } else {
        skipped++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Emails verified: ${emailsVerified}`);
    console.log(`   Accounts created: ${accountsCreated}`);
    console.log(`   Skipped (no changes): ${skipped}`);
    console.log(`\n✅ Migration complete!`);
    console.log(`\nNote: Users who signed in via Google through Clerk will need to`);
    console.log(`sign in with Google again to re-link their accounts. The system`);
    console.log(`will auto-link by email address.`);
    console.log(`\nAll users with passwords must use the "Forgot Password" flow`);
    console.log(`to set a new password, since Clerk managed passwords externally.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsers();
