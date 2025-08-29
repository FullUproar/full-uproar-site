import { prisma } from '../lib/prisma';

async function checkMerch() {
  try {
    // Count all merch
    const totalMerch = await prisma.merch.count();
    console.log(`Total merch items: ${totalMerch}`);
    
    // Count Printify merch
    const printifyMerch = await prisma.merch.count({
      where: { isPrintify: true }
    });
    console.log(`Printify items: ${printifyMerch}`);
    
    // Count non-Printify merch
    const regularMerch = await prisma.merch.count({
      where: { isPrintify: false }
    });
    console.log(`Regular items: ${regularMerch}`);
    
    // Show first 5 items
    const items = await prisma.merch.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\nRecent items:');
    items.forEach(item => {
      console.log(`- ${item.name} (${item.category}) - $${item.priceCents/100} - Printify: ${item.isPrintify}`);
    });
    
    // Check Printify settings
    const printifyApiKey = await prisma.settings.findUnique({
      where: { key: 'printify_api_key' }
    });
    const printifyShopId = await prisma.settings.findUnique({
      where: { key: 'printify_shop_id' }
    });
    
    console.log('\nPrintify settings:');
    console.log(`API Key configured: ${!!printifyApiKey?.value}`);
    console.log(`Shop ID configured: ${!!printifyShopId?.value}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMerch();