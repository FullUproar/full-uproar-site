import { PrismaClient } from '@prisma/client';

// Use the production DATABASE_URL from your .env
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function checkProductionDatabase() {
  console.log('\n🔍 Checking Production Database...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
  
  try {
    // 1. Test connection
    console.log('1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Connected to database');
    
    // 2. Check if DesignComponent table exists
    console.log('\n2. Checking for DesignComponent table...');
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'DesignComponent'
      ) as exists;
    `;
    console.log('   Result:', tableCheck);
    
    // 3. Try alternative check
    console.log('\n3. Listing all tables in database...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('   Tables found:', tables);
    
    // 4. Check if we can query the table
    console.log('\n4. Attempting to query DesignComponent table...');
    try {
      const count = await prisma.designComponent.count();
      console.log('   ✅ DesignComponent table exists with', count, 'records');
    } catch (error: any) {
      console.log('   ❌ Error querying DesignComponent:', error.message);
      
      if (error.code === 'P2021') {
        console.log('\n   ⚠️  The table "DesignComponent" does not exist in the current database.');
        console.log('   📝 You need to run: npx prisma db push');
      }
    }
    
    // 5. Check schema sync status
    console.log('\n5. Checking if schema is in sync...');
    console.log('   Run this command to sync the schema:');
    console.log('   npx prisma db push --accept-data-loss');
    console.log('\n   Or for safer migration:');
    console.log('   npx prisma migrate dev --name add_design_components');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionDatabase().catch(console.error);