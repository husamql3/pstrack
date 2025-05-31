import { resources, ResourceType } from '@prisma/client'

export type ResourceFolder = {
  type: ResourceType
  resources: resources[]
}

export type GroupedResources = {
  topic: string
  folders: ResourceFolder[]
}[]

export type ResourcesResponse = {
  technologies: GroupedResources
  problemSolving: GroupedResources
}
