export type FileResource = {
  name: string
  href?: string
  type?: 'youtube' | 'article'
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
