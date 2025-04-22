import { useMemo } from 'react'
import type { roadmap } from '@prisma/client'

import {
  Timeline,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/ui/timeline'
import { TopicProblems } from '@/app/(public)/roadmap/_components/topic-problems'

export type RoadmapType = {
  topic: string
  problems: roadmap[]
}

export const Roadmap = ({ roadmap }: { roadmap: RoadmapType[] }) => {
  const roadmapItems = useMemo(() => {
    return roadmap.map(({ topic, problems }, index) => ({
      topic,
      problems,
      index,
      key: `${topic}-${index}`, // Stable key for rendering
    }))
  }, [roadmap])

  return (
    <Timeline defaultValue={roadmap.length}>
      {roadmapItems.map(({ topic, problems, index, key }) => (
        <TimelineItem
          key={key}
          step={index}
          className="z-50 w-[calc(50%-1.5rem)] odd:ms-auto even:text-right even:group-data-[orientation=vertical]/timeline:ms-0 even:group-data-[orientation=vertical]/timeline:me-8 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:translate-x-1/2 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:translate-x-1/2"
        >
          <TimelineHeader>
            <TimelineSeparator />
            <TimelineTitle>
              <TopicProblems
                topic={topic}
                problems={problems}
              />
            </TimelineTitle>
            <TimelineDate>{problems.length} problems</TimelineDate>
            <TimelineIndicator />
          </TimelineHeader>
        </TimelineItem>
      ))}
    </Timeline>
  )
}
