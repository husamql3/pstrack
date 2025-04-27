'use client'

import { motion, type Transition } from 'motion/react'

import { cn } from '@/utils/cn'

type GradientTextProps = React.ComponentProps<'span'> & {
  text: string
  gradient?: string
  neon?: boolean
  transition?: Transition
}

function GradientText({
  text,
  className,
  gradient = 'linear-gradient(90deg, #3b82f6 0%, #a855f7 20%, #ec4899 50%, #a855f7 80%, #3b82f6 100%)',
  neon = false,
  transition = { duration: 50, repeat: Number.MAX_VALUE, ease: 'linear' },
  ...props
}: GradientTextProps) {
  const baseStyle: React.CSSProperties = {
    backgroundImage: gradient,
  }

  return (
    <span
      data-slot="gradient-text"
      className={cn('relative inline-block', className)}
      {...props}
    >
      <motion.span
        className="m-0 bg-[length:700%_100%] bg-clip-text bg-[position:0%_0%] text-transparent"
        style={baseStyle}
        initial={{ backgroundPosition: '0% 0%' }}
        animate={{ backgroundPosition: '500% 100%' }}
        transition={transition}
      >
        {text}
      </motion.span>

      {neon && (
        <motion.span
          className="absolute top-0 left-0 m-0 bg-[length:700%_100%] bg-clip-text bg-[position:0%_0%] text-transparent mix-blend-plus-lighter blur-[8px]"
          style={baseStyle}
          initial={{ backgroundPosition: '0% 0%' }}
          animate={{ backgroundPosition: '500% 100%' }}
          transition={transition}
        >
          {text}
        </motion.span>
      )}
    </span>
  )
}

export { GradientText, type GradientTextProps }
