import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123456', 10);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@khairat.com',
    },

    update: {},

    create: {
      email: 'admin@khairat.com',
      name: 'System Admin',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Admin created:', admin.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
