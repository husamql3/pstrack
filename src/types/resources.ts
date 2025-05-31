import { resource_types } from '@prisma/client'

export type FileResource = {
  name: string
  href?: string
  type?: resource_types
}

export type FolderResource = {
  name: string
  isFolder: true
  children: (FileResource | FolderResource)[]
}

export type Resource = {
  name: string
  children: (FileResource | FolderResource)[]
}
