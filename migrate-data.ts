import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Starting non-destructive data migration...")
  
  const profiles = await prisma.profile.findMany()
  console.log(`Found ${profiles.length} profiles to migrate.`)

  for (const profile of profiles) {
    console.log(`Migrating Profile ${profile.id} (${profile.businessName})...`)
    
    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: profile.id }
    })

    let companyId = profile.id;

    if (!existingCompany) {
      await prisma.company.create({
        data: {
          id: companyId, 
          name: profile.businessName,
          defaultCurrency: profile.currency,
          createdAt: profile.createdAt,
        }
      })
      console.log(`Created Company ${companyId}`)
    }

    // Check if company user already exists
    const existingCompanyUser = await prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId: profile.id,
          companyId: companyId
        }
      }
    })

    if (!existingCompanyUser) {
      await prisma.companyUser.create({
        data: {
          userId: profile.id,
          companyId: companyId,
          role: "OWNER",
          status: "ACTIVE"
        }
      })
      console.log(`Created CompanyUser mapping`)
    }

    // Update related records
    const txns = await prisma.transaction.updateMany({
      where: { userId: profile.id },
      data: { companyId: companyId }
    })
    
    const items = await prisma.balanceItem.updateMany({
      where: { userId: profile.id },
      data: { companyId: companyId }
    })

    const logs = await prisma.activityLog.updateMany({
      where: { userId: profile.id },
      data: { companyId: companyId }
    })

    console.log(`Updated ${txns.count} transactions, ${items.count} balance items, ${logs.count} logs.`)
  }

  console.log("Migration complete!")
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
