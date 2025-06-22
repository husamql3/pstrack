import { env } from '@/config/env.mjs'

export const DevTab = () => {
  if (env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-full bg-gray-800/80 px-4 py-2 text-sm font-medium text-gray-100 shadow-xl ring-1 ring-gray-700/50 backdrop-blur-sm transition-all duration-200">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      development
    </div>
  )
}
