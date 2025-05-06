import { useMemo } from 'react'
import type { roadmap } from '@prisma/client'

import { cn } from '@/utils/cn'
import type { Difficulty } from '@/types/problems.type'
import { formatTopic, getDifficultyTextColor } from '@/utils/problemsUtils'
import { PROBLEM_BASE_URL } from '@/data/constants'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog'
import { Badge } from '@/ui/badge'

export const TopicProblems = ({ topic, problems }: { topic: string; problems: roadmap[] }) => {
  const formattedTopic = formatTopic(topic)
  const problemItems = useMemo(() => {
    return problems.map((problem) => ({
      ...problem,
      key: `problem-${problem.id}`,
      difficultyClass: cn('', getDifficultyTextColor(problem.difficulty as Difficulty)),
      problemUrl: `${PROBLEM_BASE_URL}/${problem.problem_slug}`,
    }))
  }, [problems])

  return (
    <Dialog>
      <DialogTrigger className="z-[100] cursor-pointer text-lg font-semibold">{formattedTopic}</DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(500px,80vh)] sm:max-w-lg [&>button:last-child]:hidden">
        <div className="overflow-y-auto">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="border-b px-6 py-4 capitalize">{formattedTopic} Problems</DialogTitle>
            <DialogDescription asChild>
              <div className="p-0">
                <ul className="divide-y">
                  {problemItems?.map((problem) => (
                    <li
                      key={problem.key}
                      className="hover:bg-muted/50 p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full text-xs font-medium">
                            {problem.problem_order}
                          </span>
                          <a
                            href={`${PROBLEM_BASE_URL}/${problem.problem_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open problem in a new tab"
                            className="hover:text-primary font-medium transition-colors hover:underline"
                          >
                            {problem.problem_slug}
                          </a>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn('', getDifficultyTextColor(problem.difficulty as Difficulty))}
                        >
                          {problem.difficulty}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  )
}
