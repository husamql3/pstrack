// import { PrismaClient } from '@prisma/client'
// import { PROBLEM_SOLVING_RESOURCES } from '../app/(public)/resources/_components/data-ps.js'
// import { TECHNOLOGIES_RESOURCES } from '../app/(public)/resources/_components/data-techs.js'
// import type { Resource, FileResource, FolderResource } from '../types/resources.js'

// const db = new PrismaClient()

// // Type mapping from our data types to database enum values
// const mapResourceType = (type: string): string => {
//   switch (type.toLowerCase()) {
//     case 'youtube':
//       return 'YOUTUBE'
//     case 'article':
//       return 'ARTICLE'
//     case 'video':
//       return 'VIDEO'
//     default:
//       return 'ARTICLE' // Default fallback
//   }
// }

// // Function to flatten the hierarchical resource structure
// function flattenResources(
//   resources: Resource[],
//   tab: string,
//   parentTopic: string = ''
// ): Array<{
//   title: string
//   url: string
//   contributor: string
//   topic: string
//   type: string
//   tab: string
//   is_visible: boolean
//   is_approved: boolean
// }> {
//   const flattened: Array<{
//     title: string
//     url: string
//     contributor: string
//     topic: string
//     type: string
//     tab: string
//     is_visible: boolean
//     is_approved: boolean
//   }> = []

//   const processItem = (item: FileResource | FolderResource, currentTopic: string) => {
//     if ('isFolder' in item && item.isFolder) {
//       // Process folder contents
//       item.children.forEach((child) => processItem(child, currentTopic))
//     } else if ('href' in item && item.href && typeof item.href === 'string') {
//       // This is a file resource with a valid URL
//       const fileItem = item as FileResource
//       flattened.push({
//         title: fileItem.name,
//         url: item.href,
//         contributor: '@pstrack',
//         topic: currentTopic,
//         type: mapResourceType(fileItem.type || 'article'),
//         tab,
//         is_visible: true,
//         is_approved: true,
//       })
//     }
//   }

//   resources.forEach((resource) => {
//     const topic = parentTopic ? `${parentTopic} - ${resource.name}` : resource.name
//     resource.children.forEach((child) => processItem(child, topic))
//   })

//   return flattened
// }

// async function main() {
//   console.log('🌱 Starting resources seeding...')

//   try {
//     await db.$connect()

//     // Clear existing resources (optional - remove if you want to preserve existing data)
//     console.log('🗑️ Clearing existing resources...')
//     await db.$executeRaw`DELETE FROM resources`

//     // Flatten and prepare problem-solving resources
//     console.log('📚 Processing problem-solving resources...')
//     const problemSolvingData = flattenResources(PROBLEM_SOLVING_RESOURCES, 'PROBLEM_SOLVING')

//     // Flatten and prepare technologies resources
//     console.log('⚡ Processing technologies resources...')
//     const technologiesData = flattenResources(TECHNOLOGIES_RESOURCES, 'TECHNOLOGIES')

//     // Combine all resources
//     const allResources = [...problemSolvingData, ...technologiesData]

//     console.log(`📝 Found ${allResources.length} resources to seed`)
//     console.log(`   - Problem Solving: ${problemSolvingData.length}`)
//     console.log(`   - Technologies: ${technologiesData.length}`)

//     // Insert resources individually using raw SQL with proper UUID generation
//     console.log(`🚀 Inserting resources...`)
//     let completed = 0
//     for (const resource of allResources) {
//       try {
//         await db.$executeRaw`
//           INSERT INTO resources (id, title, url, contributor, topic, type, tab, is_visible, is_approved)
//           VALUES (gen_random_uuid(), ${resource.title}, ${resource.url}, ${resource.contributor},
//                   ${resource.topic}, ${resource.type}::"ResourceType", ${resource.tab}::"ResourceTab",
//                   ${resource.is_visible}, ${resource.is_approved})
//         `
//         completed++
//         if (completed % 10 === 0) {
//           console.log(`   ✅ Completed ${completed}/${allResources.length} resources`)
//         }
//       } catch (error) {
//         console.error(`Failed to insert resource: ${resource.title}`, error)
//         throw error
//       }
//     }

//     console.log('✨ Resources seeding completed successfully!')

//     // Display summary
//     const totalCountResult = await db.$queryRaw`SELECT COUNT(*) as count FROM resources`
//     const problemSolvingCountResult =
//       await db.$queryRaw`SELECT COUNT(*) as count FROM resources WHERE tab = 'PROBLEM_SOLVING'`
//     const technologiesCountResult =
//       await db.$queryRaw`SELECT COUNT(*) as count FROM resources WHERE tab = 'TECHNOLOGIES'`

//     const totalCount = (totalCountResult as { count: number }[])[0].count
//     const problemSolvingCount = (problemSolvingCountResult as { count: number }[])[0].count
//     const technologiesCount = (technologiesCountResult as { count: number }[])[0].count

//     console.log(`📊 Seeding Summary:`)
//     console.log(`   Total resources: ${totalCount}`)
//     console.log(`   Problem Solving: ${problemSolvingCount}`)
//     console.log(`   Technologies: ${technologiesCount}`)
//   } catch (error) {
//     console.error('❌ Error during seeding:', error)
//     throw error
//   }
// }

// main()
//   .then(async () => {
//     await db.$disconnect()
//     console.log('🔌 Database connection closed')
//   })
//   .catch(async (error) => {
//     console.error('💥 Seeding failed:', error)
//     await db.$disconnect()
//     process.exit(1)
//   })
