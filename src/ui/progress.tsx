'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import { motion, type Transition } from 'motion/react'

import { cn } from '@/utils/cn'

const MotionProgressIndicator = motion.create(ProgressPrimitive.Indicator)

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  transition?: Transition
}

function Progress({
  className,
  value,
  transition = { type: 'spring', stiffness: 100, damping: 30 },
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-black', className)}
      {...props}
    >
      <MotionProgressIndicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-white"
        animate={{
          translateX: `-${100 - (value || 0)}%`,
        }}
        transition={transition}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress, type ProgressProps }
