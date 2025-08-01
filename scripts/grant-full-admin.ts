import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';

async function grantFullAdmin() {
  try {
    const email = 'info@fulluproar.com';
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { permissions: true }
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    // Update role to SUPER_ADMIN
    await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.SUPER_ADMIN }
    });

    console.log(`✅ Updated ${email} to SUPER_ADMIN role`);
    console.log('SUPER_ADMIN has access to all admin features without individual permissions');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

grantFullAdmin();