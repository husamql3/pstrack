import type { ReactNode } from 'react'
import { FaHome, FaInfoCircle, FaMap, FaUsers } from 'react-icons/fa'

type Tab = {
  name: string
  url: string
  icon: ReactNode
}

export const TABS: Tab[] = [
  { name: 'Home', url: '/', icon: <FaHome /> },
  { name: 'Roadmap', url: '/roadmap', icon: <FaMap /> },
  { name: 'Groups', url: '/groups', icon: <FaUsers /> },
  { name: 'Resources', url: '/resources', icon: <FaInfoCircle /> },
]
