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

export type RoadmapType = {
  topic: string
  problems: roadmap[]
}

export const Roadmap = ({ roadmap }: { roadmap: RoadmapType[] }) => {
  return (
    <Timeline defaultValue={roadmap.length}>
      {roadmap.map(({ topic, problems }, index) => (
        <TimelineItem
          key={topic}
          step={index}
          className="w-[calc(50%-1.5rem)] odd:ms-auto even:text-right even:group-data-[orientation=vertical]/timeline:ms-0 even:group-data-[orientation=vertical]/timeline:me-8 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:translate-x-1/2 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:translate-x-1/2"
        >
          <TimelineHeader>
            <TimelineSeparator />
            <TimelineTitle>{topic}</TimelineTitle>
            <TimelineDate>{problems.length} problems</TimelineDate>
            <TimelineIndicator />
          </TimelineHeader>
        </TimelineItem>
      ))}
    </Timeline>
  )
}
