import { resources, ResourceType } from '@prisma/client'
import { GroupedResources, ResourceFolder } from '@/types/resources.type'

/**
 * Group resources by topic, then by type (creating folders)
 * @param resourceList - list of resources
 * @returns grouped resources by topic and type
 */
export const groupByTopic = (resourceList: resources[]): GroupedResources => {
  // First group by topic
  const topicMap = resourceList.reduce(
    (acc, resource) => {
      const topic = resource.topic
      if (!acc[topic]) {
        acc[topic] = []
      }
      acc[topic].push(resource)
      return acc
    },
    {} as Record<string, resources[]>
  )

  // Then group each topic's resources by type (creating folders)
  return Object.entries(topicMap).map(([topic, topicResources]) => {
    const typeMap = topicResources.reduce(
      (acc, resource) => {
        const type = resource.type
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(resource)
        return acc
      },
      {} as Record<string, resources[]>
    )

    const folders: ResourceFolder[] = Object.entries(typeMap).map(([type, resources]) => ({
      type: type as ResourceType,
      resources,
    }))

    return {
      topic,
      folders,
    }
  })
}
