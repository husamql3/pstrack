'use client'

import { Star } from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useInView,
  type HTMLMotionProps,
  type SpringOptions,
  type UseInViewOptions,
} from 'motion/react'
import {
  useRef,
  useReducer,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useImperativeHandle,
  Fragment,
} from 'react'

import { cn } from '@/utils/cn'
import { SlidingNumber } from '@/ui/sliding-number'

type FormatNumberResult = { number: string[]; unit: string }

function formatNumber(num: number, formatted: boolean): FormatNumberResult {
  if (formatted) {
    if (num < 1000) {
      return { number: [num.toString()], unit: '' }
    }
    const units = ['k', 'M', 'B', 'T']
    let unitIndex = 0
    let n = num
    while (n >= 1000 && unitIndex < units.length) {
      n /= 1000
      unitIndex++
    }
    const finalNumber = Math.floor(n).toString()
    return { number: [finalNumber], unit: units[unitIndex - 1] }
  }

  return { number: num.toLocaleString('en-US').split(','), unit: '' }
}

const animations = {
  pulse: {
    initial: { scale: 1.2, opacity: 0 },
    animate: { scale: [1.2, 1.8, 1.2], opacity: [0, 0.3, 0] },
    transition: { duration: 1.2, ease: 'easeInOut' },
  },
  glow: {
    initial: { scale: 1, opacity: 0 },
    animate: { scale: [1, 1.5], opacity: [0.8, 0] },
    transition: { duration: 0.8, ease: 'easeOut' },
  },
  particle: (index: number) => ({
    initial: { x: '50%', y: '50%', scale: 0, opacity: 0 },
    animate: {
      x: `calc(50% + ${Math.cos((index * Math.PI) / 3) * 30}px)`,
      y: `calc(50% + ${Math.sin((index * Math.PI) / 3) * 30}px)`,
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
    },
    transition: { duration: 0.8, delay: index * 0.05, ease: 'easeOut' },
  }),
}

type GitHubStarsButtonProps = HTMLMotionProps<'a'> & {
  username: string
  repo: string
  transition?: SpringOptions
  formatted?: boolean
  inView?: boolean
  inViewMargin?: UseInViewOptions['margin']
  inViewOnce?: boolean
  initialStars?: number
}

export const GitHubStarsButton = ({
  ref,
  username,
  repo,
  transition = { stiffness: 90, damping: 50 },
  formatted = false,
  inView = false,
  inViewOnce = true,
  inViewMargin = '0px',
  className,
  initialStars = 0, // Default to 0 if not provided
  ...props
}: GitHubStarsButtonProps) => {
  const motionVal = useMotionValue(0)
  const springVal = useSpring(motionVal, transition)
  const motionNumberRef = useRef(0)
  const isCompletedRef = useRef(false)
  const [, forceRender] = useReducer((x) => x + 1, 0)
  const [stars, setStars] = useState(initialStars) // Initialize with server-provided value
  const [isCompleted, setIsCompleted] = useState(false)
  const [displayParticles, setDisplayParticles] = useState(false)

  const repoUrl = useMemo(() => `https://github.com/${username}/${repo}`, [username, repo])

  useEffect(() => {
    fetch(`https://api.github.com/repos/${username}/${repo}`)
      .then((response) => response.json())
      .then((data) => {
        if (data && typeof data.stargazers_count === 'number') setStars(data.stargazers_count)
      })
      .catch(console.error)
  }, [username, repo])

  const handleDisplayParticles = useCallback(() => {
    setDisplayParticles(true)
    setTimeout(() => setDisplayParticles(false), 1500)
  }, [])

  const localRef = useRef<HTMLAnchorElement>(null)
  useImperativeHandle(ref, () => localRef.current as HTMLAnchorElement)

  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  })
  const isComponentInView = !inView || inViewResult

  useEffect(() => {
    const unsubscribe = springVal.on('change', (latest: number) => {
      const newValue = Math.round(latest)
      if (motionNumberRef.current !== newValue) {
        motionNumberRef.current = newValue
        forceRender()
      }
      if (stars !== 0 && newValue >= stars && !isCompletedRef.current) {
        isCompletedRef.current = true
        setIsCompleted(true)
        handleDisplayParticles()
      }
    })
    return () => unsubscribe()
  }, [springVal, stars, handleDisplayParticles])

  useEffect(() => {
    if (stars > 0 && isComponentInView) motionVal.set(stars)
  }, [motionVal, stars, isComponentInView])

  const fillPercentage = Math.min(100, (motionNumberRef.current / stars) * 100)
  const formattedResult = formatNumber(motionNumberRef.current, formatted)
  const ghostFormattedNumber = formatNumber(stars, formatted)

  const renderNumberSegments = (segments: string[], unit: string, isGhost: boolean) => (
    <span className={cn('flex items-center', isGhost ? 'invisible' : 'absolute top-0 left-0')}>
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {Array.from(segment).map((digit, digitIndex) => (
            <SlidingNumber
              key={`${index}-${digitIndex}`}
              number={+digit}
            />
          ))}
          {index < segments.length - 1 && <span>,</span>}
        </Fragment>
      ))}

      {formatted && unit && <span className="leading-[1]">{unit}</span>}
    </span>
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      handleDisplayParticles()
      setTimeout(() => window.open(repoUrl, '_blank'), 500)
    },
    [handleDisplayParticles, repoUrl]
  )

  return (
    <motion.a
      ref={localRef}
      href={repoUrl}
      rel="noopener noreferrer"
      target="_blank"
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={cn(
        "flex h-10 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-0 text-sm font-medium whitespace-nowrap text-zinc-100 shadow-md transition-colors outline-none focus-visible:border-zinc-500 focus-visible:ring-[3px] focus-visible:ring-zinc-500/50 disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-3 aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
        className
      )}
      {...props}
    >
      <span>GitHub Stars</span>
      <div className="relative flex size-[20px] shrink-0 items-center justify-center">
        <Star
          className="fill-zinc-600 text-zinc-600"
          size={16}
          aria-hidden="true"
        />
        <Star
          className="absolute top-0 left-0 fill-yellow-500 text-yellow-500"
          size={16}
          aria-hidden="true"
          style={{
            clipPath: `inset(${100 - (isCompleted ? fillPercentage : fillPercentage - 10)}% 0 0 0)`,
          }}
        />
        <AnimatePresence>
          {displayParticles && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0) 70%)',
                }}
                {...animations.pulse}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: '0 0 10px 2px rgba(255,215,0,0.6)' }}
                {...animations.glow}
              />
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute h-1 w-1 rounded-full bg-yellow-500"
                  initial={animations.particle(i).initial}
                  animate={animations.particle(i).animate}
                  transition={animations.particle(i).transition}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
      <span className="relative inline-flex">
        {renderNumberSegments(ghostFormattedNumber.number, ghostFormattedNumber.unit, true)}
        {renderNumberSegments(formattedResult.number, formattedResult.unit, false)}
      </span>
    </motion.a>
  )
}
