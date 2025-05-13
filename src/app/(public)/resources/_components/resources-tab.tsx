import { FileResource, FolderResource } from '@/types/resources'
import { RESOURCES } from '../resources-data'

import { Files, File, Folder } from '@/ui/files'

export const ProblemSolvingTab = () => {
  return (
    <Files className="w-full border-none bg-transparent">
      {[...RESOURCES].reverse().map((resource) => (
        <Folder
          key={resource.name}
          name={resource.name}
          className="cursor-pointer"
        >
          {resource.children.map((child) =>
            'isFolder' in child ? (
              <Folder
                key={child.name}
                name={child.name}
                className="cursor-pointer"
              >
                {[...(child as FolderResource).children].map((subChild) => (
                  <File
                    key={subChild.name}
                    name={subChild.name}
                    href={'href' in subChild ? subChild.href : undefined}
                    type={'type' in subChild ? subChild.type : undefined}
                  />
                ))}
              </Folder>
            ) : (
              <File
                key={child.name}
                name={child.name}
                href={'href' in child ? child.href : undefined}
                type={'type' in child ? (child as FileResource).type : undefined}
              />
            )
          )}
        </Folder>
      ))}
    </Files>
  )
}
