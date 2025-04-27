'use client'

import { RESOURCES } from './resources'

import { File, Files, Folder } from '@/ui/files'

const Page = () => {
  return (
    <div className="mx-auto w-full max-w-lg flex-1 py-10">
      <div className="relative mx-auto w-full max-w-[500px] overflow-hidden rounded-lg border border-zinc-700/10 bg-gradient-to-tr from-[#141416] to-[#1C1C1C] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-tr before:from-zinc-900/20 before:to-zinc-800/5 before:opacity-20 after:absolute after:inset-0 after:-z-20 after:[background-size:200px] after:opacity-[0.15] after:mix-blend-overlay">
        <Files className="w-full max-w-[500px] border-none bg-transparent">
          {RESOURCES.map((resource) => (
            <Folder
              key={resource.name}
              name={resource.name}
            >
              {resource.children.map((child) =>
                'isFolder' in child ? (
                  <Folder
                    key={child.name}
                    name={child.name}
                  >
                    {child.children.map((subChild) => (
                      <File
                        key={subChild.name}
                        name={subChild.name}
                        href={'href' in subChild ? subChild.href : undefined}
                      />
                    ))}
                  </Folder>
                ) : (
                  <File
                    key={child.name}
                    name={child.name}
                    href={'href' in child ? child.href : undefined}
                  />
                )
              )}
            </Folder>
          ))}
        </Files>
      </div>
    </div>
  )
}

export default Page
