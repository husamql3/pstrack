'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaHome, FaMap, FaUsers } from 'react-icons/fa'
import { usePathname } from 'next/navigation'

import { cn } from '@/utils/cn'

export const NavMenu = () => {
  const [activeTab, setActiveTab] = useState('Home')
  const tabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({})
  const pathname = usePathname()

  const tabs = [
    { name: 'Home', url: '/', icon: <FaHome /> },
    { name: 'Roadmap', url: '/roadmap', icon: <FaMap /> },
    { name: 'Groups', url: '/groups', icon: <FaUsers /> },
  ]

  const setTabRef = (el: HTMLAnchorElement | null, tabName: string) => {
    tabRefs.current[tabName] = el
  }

  // Set active tab based on current URL
  useEffect(() => {
    const currentTab = tabs.find(
      (tab) => pathname === tab.url || pathname.startsWith(`${tab.url}/`)
    )

    if (currentTab) setActiveTab(currentTab.name)
  }, [pathname])

  return (
    <div className="fixed bottom-0 left-1/2 z-10 mb-6 -translate-x-1/2 transform sm:top-7 sm:mb-0">
      <div className="flex items-center gap-2 rounded-full border border-gray-500/20 bg-white/5 px-1 py-1 shadow-lg shadow-black backdrop-blur-lg">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.url}
            ref={(el) => setTabRef(el, tab.name)}
            onClick={() => setActiveTab(tab.name)}
            className={cn(
              'relative cursor-pointer rounded-full px-6 py-2 text-sm text-white',
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
