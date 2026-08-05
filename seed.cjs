const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash('Admin@nutech$1', 10);
  await prisma.user.upsert({
    where: { email: 'nutech2025@gmail.com' },
    update: {},
    create: {
      email: 'nutech2025@gmail.com',
      password: pass,
      role: 'Admin',
      profile: {
        create: {
          businessName: 'NuTech Admin'
        }
      }
    }
  });
  console.log('Admin created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
