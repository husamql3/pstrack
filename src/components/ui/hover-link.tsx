import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import Link from 'next/link'

interface InteractiveHoverLinkProps {
  children: React.ReactNode
  href: string
  className?: string
}

export const InteractiveHoverLink = React.forwardRef<HTMLAnchorElement, InteractiveHoverLinkProps>(
  ({ children, className, href, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        prefetch={true}
        className={cn(
          'group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <div className="bg-primary h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]" />
          <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
            {children}
          </span>
        </div>
        <div className="text-primary-foreground absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
          <span>{children}</span>
          <ArrowRight />
        </div>
      </Link>
    )
  }
)

InteractiveHoverLink.displayName = 'InteractiveHoverLink'

interface StaticLinkProps {
  children: React.ReactNode
  href: string
  className?: string
}

export const StaticLink = React.forwardRef<HTMLAnchorElement, StaticLinkProps>(
  ({ children, className, href, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        prefetch={true}
        className={cn(
          'bg-background hover:bg-primary hover:text-primary-foreground relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold transition-colors',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block">{children}</span>
        </div>
      </Link>
    )
  }
)

StaticLink.displayName = 'StaticLink'
