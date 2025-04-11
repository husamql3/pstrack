import type { groups as groupsType } from '@prisma/client'
import type { leetcoders as leetcodersType } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const groupsData: groupsType[] = [
  {
    id: 'aa7b4165-5e1a-4889-bc1f-f3c5d474ca26',
    group_no: 1,
  },
  {
    id: '3113774f-073e-4921-8928-d854927fdbe1',
    group_no: 2,
  },
]

export const leetcodersData: leetcodersType[] = [
  {
    id: '3cf292d2-ae67-441e-af8a-996d66c51bfc',
    name: 'Hüsam',
    email: 'husam@gmail.com',
    lc_username: 'husamql3',
    gh_username: 'husamahmud',
    x_username: 'husamql3',
    li_username: 'husamql3',
    group_no: 1,
    username: 'husam',
    created_at: new Date(),
    is_notified: false,
    status: 'APPROVED',
  },
]

async function main() {
  await prisma.$transaction([
    prisma.groups.deleteMany(),
    prisma.leetcoders.deleteMany(),
    // prisma.submissions.deleteMany(),
    // prisma.group_progress.deleteMany(),
    // prisma.roadmap.deleteMany(),
  ])

  const groups = await prisma.groups.createMany({ data: groupsData })
  console.log('groups', groups)

  const leetcoders = await prisma.leetcoders.createMany({ data: leetcodersData })
  console.log('leetcoders', leetcoders)
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
