import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@nutech$1', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'nutech2025@gmail.com' },
    update: {},
    create: {
      email: 'nutech2025@gmail.com',
      password: hashedPassword,
      role: 'Admin',
      profile: {
        create: {
          businessName: 'Nutech Business'
        }
      }
    },
  })

  console.log('User created:', user)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
