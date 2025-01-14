import { type leetcoders, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const leetcoders: leetcoders[] = [
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce01',
    name: 'menna',
    email: 'bena.yalla@yahoo.com',
    gh_username: '',
    lc_username: 'mennaSamirr',
    group_no: 1,
    status: 'approved',
    username: 'Menna Samir',
    created_at: null,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce02',
    name: 'menna',
    email: 'john.doe432@example.com',
    gh_username: '',
    lc_username: 'Menna',
    group_no: 1,
    status: 'approved',
    username: 'aewqartf',
    created_at: null,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce03',
    name: 'menna',
    email: 'john.123@example.com',
    gh_username: '',
    lc_username: 'Menna',
    group_no: 1,
    status: 'approved',
    username: 'fsdaf',
    created_at: null,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce04',
    name: 'menna',
    email: 'john.doe4@example.com',
    gh_username: '',
    lc_username: 'Menna',
    group_no: 1,
    status: 'approved',
    username: 'fsdafdsaf',
    created_at: null,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce05',
    name: 'menna',
    email: 'john.doe5@example.com',
    gh_username: '',
    lc_username: 'fdsaf',
    group_no: 1,
    status: 'approved',
    username: 'mennasamir',
    created_at: null,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce06',
    name: 'menna',
    email: 'john.doe6@example.com',
    gh_username: '',
    lc_username: 'Menna',
    group_no: 1,
    status: 'approved',
    username: 'feawtsdsa',
    created_at: null,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce07',
    name: 'menna',
    email: 'john.doe7@example.com',
    gh_username: '',
    lc_username: 'Menna',
    group_no: 1,
    status: 'approved',
    username: 'feawtsdsa',
    created_at: null,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce08',
    name: 'menna',
    email: 'john.doe8@example.com',
    gh_username: '',
    lc_username: 'Menna',
    group_no: 1,
    status: 'approved',
    username: 'feawtsdsa',
    created_at: null,
  },
  {
    id: '8236a8bd-8e20-4958-9618-98631584ce09',
    name: 'menna',
    email: 'john.doe9@example.com',
    gh_username: '',
    lc_username: 'Menna',
    group_no: 1,
    status: 'approved',
    username: 'feawtsdsa',
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
