import type { GroupedResources } from '@/types/resources.type'

import { Files, File, Folder } from '@/ui/files'

interface ResourcesTreeProps {
  resources: GroupedResources
}

export const ResourcesTree = ({ resources }: ResourcesTreeProps) => {
  return (
    <Files className="w-full border-none bg-transparent">
      {resources.map((resource) => (
        <Folder
          key={resource.topic}
          name={resource.topic}
          className="cursor-pointer"
        >
          {resource.folders.map((folder) => (
            <Folder
              key={folder.type}
              name={folder.type}
              className="cursor-pointer"
            >
              {folder.resources?.map((item) => (
                <File
                  key={item.id}
                  name={item.title}
                  href={item.url}
                  type={item.type.name}
                />
              ))}
            </Folder>
          ))}
        </Folder>
      ))}
    </Files>
  )
}
