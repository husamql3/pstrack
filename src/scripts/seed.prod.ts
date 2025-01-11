import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const group = await prisma.groups.create({
    data: {
      group_no: 1,
      group_name: 'group A',
    },
  })

  console.log('Group created:', group)
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
