import React from 'react'
import { cn } from '@/utils/cn'
import Link from 'next/link'

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
          'bg-background hover:bg-primary hover:text-primary-foreground relative w-auto cursor-pointer overflow-hidden rounded-full border px-4 py-2 text-center font-semibold transition-colors',
          className
        )}
        {...props}
      >
        {children}
      </Link>
    )
  }
)

StaticLink.displayName = 'StaticLink'
