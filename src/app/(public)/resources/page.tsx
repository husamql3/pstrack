'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { ResourcesTree } from './_components/resources-tree'
import { PROBLEM_SOLVING_RESOURCES } from './_components/data-ps'
import { TECHNOLOGIES_RESOURCES } from './_components/data-techs'

const Page = () => {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-3 py-5">
      <Tabs
        defaultValue="problem-solving"
        orientation="horizontal"
        className="w-full flex-row"
      >
        <TabsList className="flex-col justify-start gap-1 rounded-none bg-transparent px-1 py-0">
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

        <TabsContent
          value="problem-solving"
          className="relative mx-auto w-full overflow-hidden rounded-lg border border-zinc-700/10 bg-gradient-to-tr from-[#141416] to-[#1C1C1C] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-tr before:from-zinc-900/20 before:to-zinc-800/5 before:opacity-20 after:absolute after:inset-0 after:-z-20 after:[background-size:200px] after:opacity-[0.15] after:mix-blend-overlay"
        >
          <ResourcesTree resources={PROBLEM_SOLVING_RESOURCES} />
        </TabsContent>
        <TabsContent
          value="programming"
          className="relative mx-auto w-full overflow-hidden rounded-lg border border-zinc-700/10 bg-gradient-to-tr from-[#141416] to-[#1C1C1C] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-tr before:from-zinc-900/20 before:to-zinc-800/5 before:opacity-20 after:absolute after:inset-0 after:-z-20 after:[background-size:200px] after:opacity-[0.15] after:mix-blend-overlay"
        >
          <ResourcesTree resources={TECHNOLOGIES_RESOURCES} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Page
