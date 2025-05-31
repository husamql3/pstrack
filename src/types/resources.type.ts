import type { resource_types, resource_tabs, resources } from '@prisma/client'

export type ResourceWithRelations = resources & {
  type: resource_types
  tab: resource_tabs
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
