import type { GroupedResources, ResourceFolder, ResourceWithRelations } from '@/types/resources.type'

/**
 * Group resources by topic, then by type (creating folders)
 * @param resourceList - list of resources with type and tab relations
 * @returns grouped resources by topic and type
 */
export const groupByTopic = (resourceList: ResourceWithRelations[]): GroupedResources => {
  // group by topic
  const topicMap = resourceList.reduce(
    (acc, resource) => {
      const topic = resource.topic
      if (!acc[topic]) {
        acc[topic] = []
      }
      acc[topic].push(resource)
      return acc
    },
    {} as Record<string, ResourceWithRelations[]>
  )

  // Then group each topic's resources by type (creating folders)
  return Object.entries(topicMap).map(([topic, topicResources]) => {
    const typeMap = topicResources.reduce(
      (acc, resource) => {
        const typeName = resource.type
        if (!acc[typeName]) {
          acc[typeName] = []
        }
        acc[typeName].push(resource)
        return acc
      },
      {} as Record<string, ResourceWithRelations[]>
    )

    const folders: ResourceFolder[] = Object.entries(typeMap).map(([typeName, resources]) => ({
      type: typeName,
      resources: resources,
    }))

    return {
      topic,
      folders,
    }
  })
}

/**
 * Convert resource name to human-readable label
 * @param name - resource name
 * @returns formatted label string
 */
export const formatTabLabel = (name: string): string => {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
