import { prisma } from '../lib/prisma';

async function manualAdminSetup() {
  const email = 'info@fulluproar.com';
  
  try {
    console.log(`Manually creating super admin user: ${email}`);
    
    // Create user with SUPER_ADMIN role
    const user = await prisma.user.create({
      data: {
        clerkId: 'manual_' + Date.now(), // Temporary ID until Clerk webhook updates it
        email: email,
        username: 'admin',
        displayName: 'Full Uproar Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        profile: {
          create: {}
        }
      }
    });

    console.log(`✅ Successfully created ${user.email} as SUPER_ADMIN`);
    console.log(`User ID: ${user.id}`);
    console.log(`Clerk ID: ${user.clerkId} (temporary - will update on first login)`);
    
    // Create initial forum boards
    console.log('\nCreating initial forum boards...');
    
    const boards = [
      {
        name: 'General Discussion',
        slug: 'general',
        description: 'General topics about Full Uproar games and community',
        icon: '💬',
        sortOrder: 1
      },
      {
        name: 'Game Feedback',
        slug: 'feedback',
        description: 'Share your thoughts and suggestions about our games',
        icon: '🎮',
        sortOrder: 2
      },
      {
        name: 'Bug Reports',
        slug: 'bugs',
        description: 'Report bugs and technical issues',
        icon: '🐛',
        sortOrder: 3
      },
      {
        name: 'Off Topic',
        slug: 'off-topic',
        description: 'Everything else - memes, random thoughts, and chaos',
        icon: '🎲',
        sortOrder: 4
      }
    ];

    for (const board of boards) {
      const existing = await prisma.messageBoard.findUnique({
        where: { slug: board.slug }
      });
      
      if (!existing) {
        await prisma.messageBoard.create({ data: board });
        console.log(`✅ Created board: ${board.name}`);
      } else {
        console.log(`⏭️  Board already exists: ${board.name}`);
      }
    }

    console.log('\n🎉 Manual setup complete!');
    console.log('\nIMPORTANT: When you sign in with info@fulluproar.com, the Clerk webhook');
    console.log('will update your user record with the correct Clerk ID.');
    console.log('\nYou can now access the admin panel at https://www.fulluproar.com/admin');
    
  } catch (error) {
    console.error('Error in manual setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualAdminSetup();