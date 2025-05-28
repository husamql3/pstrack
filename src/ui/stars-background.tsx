'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface StarLayerProps {
  count: number
  size: number
  duration: number
  starColor: string
  className?: string
}

const StarLayer = ({ count = 500, size = 1, duration = 50, starColor = '#fff', className }: StarLayerProps) => {
  const [boxShadow, setBoxShadow] = useState('')

  useEffect(() => {
    const shadows: string[] = []
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 4000) - 2000
      const y = Math.floor(Math.random() * 4000) - 2000
      shadows.push(`${x}px ${y}px ${starColor}`)
    }
    setBoxShadow(shadows.join(', '))
  }, [count, starColor])

  return (
    <motion.div
      animate={{ y: [0, -1500] }}
      transition={{ repeat: Number.MAX_VALUE, duration, ease: 'linear' }}
      className={cn('absolute top-0 left-0 h-[2000px] w-full', className)}
    >
      <div
        className="absolute rounded-full bg-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow,
        }}
      />
      <div
        className="absolute top-[2000px] rounded-full bg-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow,
        }}
      />
    </motion.div>
  )
}

interface StarsBackgroundProps {
  children?: React.ReactNode
  className?: string
  factor?: number
  speed?: number
}

export function StarsBackground({ children, className, factor = 0.05, speed = 50 }: StarsBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const newOffsetX = -(e.clientX - centerX) * factor
      const newOffsetY = -(e.clientY - centerY) * factor
      setMousePosition({ x: newOffsetX, y: newOffsetY })
    },
    [factor]
  )

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  return (
    <div
      className={cn(
        'relative size-full overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_#1a1a1a_30%,_#000_100%)]',
        className
      )}
    >
      <motion.div
        style={{
          x: mousePosition.x,
          y: mousePosition.y,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <StarLayer
          count={1000}
          size={1}
          duration={speed}
          starColor="rgba(255, 255, 255, 0.5)"
        />
        <StarLayer
          count={400}
          size={2}
          duration={speed * 2}
          starColor="rgba(255, 255, 255, 0.6)"
        />
        <StarLayer
          count={200}
          size={3}
          duration={speed * 3}
          starColor="rgba(255, 255, 255, 0.7)"
        />
      </motion.div>
      {children}
    </div>
  )
}

export type { StarsBackgroundProps }
