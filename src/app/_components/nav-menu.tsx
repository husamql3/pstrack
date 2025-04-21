'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/utils/cn'

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Groups', href: '/groups' },
]

// todo: https://www.serenity-ui.com/components/navbars/tubelightnavbar
// todo: https://21st.dev/ayushmxxn/tubelight-navbar/default

export const NavMenu = () => {
  const pathname = usePathname()

  return (
    <nav>
      <ul className="flex items-center justify-between gap-3">
        {LINKS.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                'bg-background hover:bg-primary hover:text-primary-foreground relative w-auto cursor-pointer overflow-hidden rounded-full border px-4 py-2 text-center font-semibold transition-colors',
                pathname === href ? 'bg-primary text-primary-foreground' : ''
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
