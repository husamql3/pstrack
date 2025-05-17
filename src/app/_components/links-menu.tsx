'use client'

import Link from 'next/link'
import { HiOutlineMenu } from 'react-icons/hi'
import { usePathname } from 'next/navigation'

import { cn } from '@/utils/cn'
import { TABS } from '@/data/constant-components'

import { Button } from '@/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/ui/dropdown-menu'

export const LinksMenu = ({ className }: { className?: string }) => {
  const pathname = usePathname()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className={cn(
            'bg-dark relative z-100 w-auto cursor-pointer overflow-hidden rounded-full border border-white/10 px-4 py-2 text-center font-semibold',
            className
          )}
          aria-label="Open edit menu"
        >
          <HiOutlineMenu
            size={16}
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={10}
        align="start"
      >
        {TABS.map((tab) => (
          <DropdownMenuItem
            key={tab.name}
            className={cn(pathname === tab.url || pathname.startsWith(`${tab.url}/`) ? 'bg-accent' : '')}
          >
            <Link
              href={tab.url}
              className="w-full"
            >
              {tab.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
