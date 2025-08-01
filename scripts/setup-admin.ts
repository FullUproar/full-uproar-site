import { prisma } from '../lib/prisma';

async function setupInitialAdmin() {
  const adminEmail = process.argv[2];
  
  if (!adminEmail) {
    console.error('Please provide an email address as an argument');
    console.error('Usage: npm run setup-admin your-email@example.com');
    process.exit(1);
  }

  try {
    console.log(`Setting up admin privileges for: ${adminEmail}`);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!user) {
      console.error(`User with email ${adminEmail} not found.`);
      console.error('Please make sure you have logged in at least once with this email.');
      process.exit(1);
    }

    // Update user role to SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'SUPER_ADMIN' }
    });

    console.log(`✅ Successfully updated ${updatedUser.email} to SUPER_ADMIN role`);
    console.log(`User ID: ${updatedUser.id}`);
    console.log(`Current role: ${updatedUser.role}`);
    
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

    console.log('\n🎉 Setup complete! You can now access the admin panel.');
    
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupInitialAdmin();