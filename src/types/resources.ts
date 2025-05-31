import { ResourceType } from '@prisma/client'

export type FileResource = {
  name: string
  href?: string
  type?: ResourceType
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
