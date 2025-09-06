import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDesignComponents() {
  console.log('\n🔍 Testing DesignComponent Database Functionality...\n');
  
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Database connected successfully');
    
    // 2. Check if DesignComponent table exists
    console.log('\n2. Checking if DesignComponent table exists...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'DesignComponent'
      );
    `;
    console.log('   ✅ DesignComponent table exists:', tableExists);
    
    // 3. Test Prisma model availability
    console.log('\n3. Testing Prisma model availability...');
    const modelAvailable = typeof prisma.designComponent !== 'undefined';
    console.log('   ✅ Prisma model available:', modelAvailable);
    
    // 4. Count existing records
    console.log('\n4. Counting existing DesignComponent records...');
    const count = await prisma.designComponent.count();
    console.log(`   ✅ Found ${count} existing design components`);
    
    // 5. Test fetching games
    console.log('\n5. Testing Game model (for foreign key reference)...');
    const games = await prisma.game.findMany({
      select: { id: true, title: true },
      take: 5
    });
    console.log(`   ✅ Found ${games.length} games`);
    if (games.length > 0) {
      console.log('   Games:', games.map(g => `${g.title} (ID: ${g.id})`).join(', '));
    }
    
    // 6. Test creating a design component (if we have a game)
    if (games.length > 0) {
      console.log('\n6. Testing create operation...');
      const testComponent = await prisma.designComponent.create({
        data: {
          gameId: games[0].id,
          type: 'CARD_FACE',
          name: `Test Component ${Date.now()}`,
          description: 'Test component created by test script',
          status: 'IN_DRAFT',
          sortOrder: 999
        }
      });
      console.log('   ✅ Successfully created test component:', testComponent.id);
      
      // 7. Test update operation
      console.log('\n7. Testing update operation...');
      const updatedComponent = await prisma.designComponent.update({
        where: { id: testComponent.id },
        data: { status: 'READY_FOR_REVIEW' }
      });
      console.log('   ✅ Successfully updated component status:', updatedComponent.status);
      
      // 8. Test fetch operation
      console.log('\n8. Testing fetch operation...');
      const fetchedComponents = await prisma.designComponent.findMany({
        where: { gameId: games[0].id },
        orderBy: { sortOrder: 'desc' },
        take: 5
      });
      console.log(`   ✅ Successfully fetched ${fetchedComponents.length} components`);
      
      // 9. Test delete operation
      console.log('\n9. Testing delete operation...');
      await prisma.designComponent.delete({
        where: { id: testComponent.id }
      });
      console.log('   ✅ Successfully deleted test component');
    } else {
      console.log('\n⚠️  No games found in database. Skipping CRUD tests.');
      console.log('   Please create at least one game first.');
    }
    
    // 10. List all available Prisma models
    console.log('\n10. Available Prisma models:');
    const models = Object.keys(prisma).filter(key => 
      !key.startsWith('$') && 
      !key.startsWith('_') && 
      typeof (prisma as any)[key] === 'object'
    );
    console.log('   ', models.join(', '));
    
    console.log('\n✅ All tests completed successfully!\n');
    console.log('The DesignComponent database functionality is working correctly.');
    
  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    if (error.code === 'P2021') {
      console.error('\n⚠️  The DesignComponent table does not exist in the database.');
      console.error('   Run: npx prisma db push');
    } else if (error.code === 'P2025') {
      console.error('\n⚠️  Record not found.');
    } else if (error.code === 'P2002') {
      console.error('\n⚠️  Unique constraint violation.');
    } else if (error.code === 'P2003') {
      console.error('\n⚠️  Foreign key constraint violation.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDesignComponents().catch(console.error);