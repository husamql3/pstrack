import type { GroupedResources } from '@/types/resources.type'

import { File, Files, Folder } from '@/ui/files'

export const ResourcesTree = ({ resources }: { resources: GroupedResources }) => {
  return (
    <Files className="w-full border-none bg-transparent">
      {resources
        .sort((a, b) => a.topic.localeCompare(b.topic))
        .map((resource) => (
          <Folder
            key={resource.topic}
            name={resource.topic}
            className="cursor-pointer"
          >
            {resource.folders
              .sort((a, b) => a.type.localeCompare(b.type))
              .map((folder) => (
                <Folder
                  key={folder.type}
                  name={folder.type}
                  className="cursor-pointer"
                >
                  {folder.resources.map((item) => (
                    <File
                      key={item.id}
                      name={item.title}
                      href={item.url}
                      type={item.type}
                      contributor={item.contributor}
                    />
                  ))}
                </Folder>
              ))}
          </Folder>
        ))}
    </Files>
  )
}
