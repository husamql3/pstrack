'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

import { cn } from '@/utils/cn'
import { TABS } from '@/data/constant-components'

export const NavMenu = () => {
  const [activeTab, setActiveTab] = useState('Home')
  const tabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({})
  const pathname = usePathname()

  const setTabRef = (el: HTMLAnchorElement | null, tabName: string) => {
    tabRefs.current[tabName] = el
  }

  // Set active tab based on current URL
  useEffect(() => {
    const currentTab = TABS.find(
      (tab) => pathname === tab.url || pathname.startsWith(`${tab.url}/`)
    )

    if (currentTab) setActiveTab(currentTab.name)
  }, [pathname])

  return (
    <div className="fixed top-[30px] left-1/2 z-[100] -translate-x-1/2 transform">
      <div className="flex items-center gap-2 rounded-full border border-gray-500/20 bg-white/5 px-1 py-1 shadow-lg shadow-black backdrop-blur-lg">
        {TABS.map((tab) => (
          <Link
            key={tab.name}
            href={tab.url}
            ref={(el) => setTabRef(el, tab.name)}
            onClick={() => setActiveTab(tab.name)}
            className={cn(
              'relative cursor-pointer rounded-full px-5 py-2 text-sm text-white md:px-6',
              activeTab === tab.name ? 'bg-zinc-500' : ''
            )}
            style={{
              backdropFilter: 'blur(10px)',
              backgroundColor: activeTab === tab.name ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            }}
          >
            <span className="hidden font-medium md:inline">{tab.name}</span>
            <span className="md:hidden">{tab.icon}</span>
            {activeTab === tab.name && (
              <motion.div
                layoutId="lamp"
                className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-md bg-white"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {/* Lamp elements */}
                <motion.div className="absolute -top-3 left-1/2 h-12 w-10 -translate-x-1/2 rounded-full bg-white opacity-10 shadow-lg blur" />
                <motion.div className="absolute -top-3 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-white opacity-20 shadow-lg blur" />
                <motion.div className="absolute -top-2 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-white opacity-10 shadow-lg blur" />
                <motion.div className="absolute -top-1 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-white opacity-10 shadow-lg blur" />
              </motion.div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
