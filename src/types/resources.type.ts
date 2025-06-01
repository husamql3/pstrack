import type { resources } from '@prisma/client'

export type ResourceWithRelations = resources & {
  type: string
  tab: string
}

export type ResourceFolder = {
  type: string
  resources: ResourceWithRelations[]
}

export type GroupedResources = Array<{
  topic: string
  folders: ResourceFolder[]
}>

export type ResourcesResponse = {
  technologies: GroupedResources
  problemSolving: GroupedResources
}

export type ResourceTabOption = {
  value: string
  label: string
}

export type ResourceTypeOption = {
  value: string
  label: string
}
