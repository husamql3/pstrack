import { type leetcoders, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const leetcoders: leetcoders[] = [
  {
    id: 'f07e0ca7-4a29-4f7d-9e39-220f95f204b9',
    username: 'husamql3',
    name: 'Hüsam',
    email: 'john.doe@example.com',
    lc_username: 'husamahmud',
    gh_username: 'husamahmud',
    status: 'approved',
    created_at: null,
    group_no: 1,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce01',
    name: 'menna',
    email: 'john.doe2@example.com',
    gh_username: '',
    lc_username: 'Menna',
    group_no: 1,
    status: 'approved',
    username: 'mennasamir',
    created_at: null,
  },
]

const roadmap = [
  {
    problem_no: 2,
    problem_order: 1,
    problem_slug: 'two-sum',
    link: 'https://leetcode.com/problems/two-sum/',
    topic: 'array-hashing',
    difficulty: 'easy',
  },
  {
    problem_no: 217,
    problem_order: 2,
    problem_slug: 'add-two-numbers',
    link: 'https://leetcode.com/problems/contains-duplicate/description/',
    topic: 'array-hashing',
    difficulty: 'easy',
  },
  {
    problem_no: 15,
    problem_order: 3,
    problem_slug: '3sum',
    link: 'https://leetcode.com/problems/3sum/',
    topic: 'two-pointers',
    difficulty: 'medium',
  },
  {
    problem_no: 4,
    problem_order: 4,
    problem_slug: 'median-of-two-sorted-arrays',
    link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
    topic: 'sorting',
    difficulty: 'hard',
  },
]

async function main() {
  // delete all data
  await prisma.$transaction([
    prisma.submissions.deleteMany(),
    prisma.group_progress.deleteMany(),
    prisma.leetcoders.deleteMany(),
    prisma.groups.deleteMany(),
    prisma.roadmap.deleteMany(),
  ])

  // create a group
  await prisma.groups.create({
    data: {
      group_no: 1,
      group_name: 'group A',
    },
  })
  console.log('Created group A')

  // create leetcoders
  for (const leetcoder of leetcoders) {
    await prisma.leetcoders.create({
      data: {
        id: leetcoder.id,
        name: 'Hüsam',
        username: leetcoder.username,
        email: leetcoder.email,
        group_no: 1,
        status: 'approved',
        gh_username: 'johndoe',
        lc_username: 'johndoe',
      },
    })
  }
  console.log('Created leetcoders')

  for (const problem of roadmap) {
    await prisma.roadmap.create({
      data: {
        problem_no: problem.problem_no,
        problem_order: problem.problem_order,
        problem_slug: problem.problem_slug,
        link: problem.link,
        topic: problem.topic,
        difficulty: problem.difficulty,
      },
    })
  }
  console.log('Created roadmap')

  await prisma.group_progress.create({
    data: {
      group_no: 1,
      created_at: new Date(),
      current_problem: 2,
    },
  })
  console.log('Created group progress')

  console.log('Data seeding complete! :)')
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
