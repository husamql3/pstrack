import { execSync } from 'child_process'

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Run the resources seeding
    console.log('📚 Seeding resources...')
    execSync('pnpm exec tsx ./src/prisma/seed-resources.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    console.log('✅ All seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('🎉 Database seeding finished!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error during seeding:', error)
    process.exit(1)
  })
