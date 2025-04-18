'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/utils/cn'

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Groups', href: '/groups' },
]

export const NavMenu = () => {
  const pathname = usePathname()

  return (
    <nav>
      <ul className="flex items-center justify-between gap-6">
        {LINKS.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(pathname === href ? 'text-red-950' : '')}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
