import { Plus } from 'lucide-react'
import { roadmap } from '@prisma/client'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'

export default function RoadmapAccordion({ roadmaps }: { roadmaps: roadmap[] }) {
  // Group roadmaps by topic
  const groupedRoadmaps = roadmaps.reduce(
    (acc, roadmap) => {
      if (!acc[roadmap.topic]) {
        acc[roadmap.topic] = []
      }
      acc[roadmap.topic].push(roadmap)
      return acc
    },
    {} as Record<string, roadmap[]>
  )

  // Sort topics by the problem_order of the first problem in each topic
  const sortedTopics = Object.entries(groupedRoadmaps).sort(
    ([, roadmapsA], [, roadmapsB]) => {
      const firstProblemOrderA = roadmapsA[0].problem_order
      const firstProblemOrderB = roadmapsB[0].problem_order
      return firstProblemOrderA - firstProblemOrderB
    }
  )

  return (
    <div className="w-full space-y-4">
      <h2 className="text-xl font-bold">Roadmap</h2>

      <Accordion
        type="single"
        collapsible
        className="w-full -space-y-px"
      >
        {sortedTopics.map(([topic, roadmaps]) => (
          <AccordionItem
            value={topic}
            key={topic}
            className="border bg-zinc-950 px-4 py-1 first:rounded-t-lg last:rounded-b-lg"
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 text-left text-[15px] font-semibold leading-6 transition-all [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 [&[data-state=open]>svg]:rotate-180">
                {topic}
                <Plus
                  size={16}
                  strokeWidth={2}
                  className="shrink-0 opacity-60 transition-transform duration-200"
                  aria-hidden="true"
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionContent className="text-muted-foreground pb-2">
              <ul className="space-y-2">
                {roadmaps
                  .sort((a, b) => a.problem_order - b.problem_order)
                  .map((roadmap) => (
                    <li
                      key={roadmap.id}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {roadmap.problem_no}. {roadmap.problem_slug}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          roadmap.difficulty === 'easy'
                            ? 'text-green-500'
                            : roadmap.difficulty === 'medium'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                        }`}
                      >
                        {roadmap.difficulty}
                      </span>
                    </li>
                  ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
