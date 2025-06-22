import { AddNewResourceBtn } from '@/app/(public)/resources/_components/add-new-resource-btn'

import { ResourcesTree } from '@/app/(public)/resources/_components/resources-tree'
import type { ResourcesResponse } from '@/types/resources.type'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'

export const ResourcesTabs = ({ resources }: { resources: ResourcesResponse }) => {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-3 py-5">
      <Tabs
        defaultValue="problem-solving"
        orientation="horizontal"
        className="w-full flex-col gap-5 sm:flex-row sm:gap-0"
      >
        <div className="flex flex-col items-start justify-between gap-2">
          <TabsList className="flex-row justify-start gap-1.5 rounded-none bg-transparent px-1 py-0 sm:flex-col">
            <TabsTrigger
              value="problem-solving"
              className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative w-full justify-start after:absolute after:inset-y-0 after:start-0 after:-ms-1 after:w-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Problem Solving
            </TabsTrigger>

            <TabsTrigger
              value="programming"
              className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative w-full justify-start after:absolute after:inset-y-0 after:start-0 after:-ms-1 after:w-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Technologies
            </TabsTrigger>
          </TabsList>

          <AddNewResourceBtn />
        </div>

        <TabsContent
          value="problem-solving"
          className="relative mx-auto w-full overflow-hidden rounded-lg border border-zinc-700/10 bg-gradient-to-tr from-[#141416] to-[#1C1C1C] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-tr before:from-zinc-900/20 before:to-zinc-800/5 before:opacity-20 after:absolute after:inset-0 after:-z-20 after:[background-size:200px] after:opacity-[0.15] after:mix-blend-overlay"
        >
          <ResourcesTree resources={resources.problemSolving} />
        </TabsContent>

        <TabsContent
          value="programming"
          className="relative mx-auto w-full overflow-hidden rounded-lg border border-zinc-700/10 bg-gradient-to-tr from-[#141416] to-[#1C1C1C] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-tr before:from-zinc-900/20 before:to-zinc-800/5 before:opacity-20 after:absolute after:inset-0 after:-z-20 after:[background-size:200px] after:opacity-[0.15] after:mix-blend-overlay"
        >
          <ResourcesTree resources={resources.technologies} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
