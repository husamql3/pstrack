import { env } from '@/config/env.mjs'

export const DevTab = () => {
  const isDevDb = env.DATABASE_URL.toLowerCase().includes('neon')

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col items-center gap-3">
      {env.NODE_ENV === 'development' && (
        <div className="flex items-center gap-2 rounded-full bg-gray-800/80 px-4 py-2 text-sm font-medium text-gray-100 shadow-xl ring-1 ring-gray-700/50 backdrop-blur-sm transition-all duration-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          dev mood
        </div>
      )}

      {isDevDb && (
        <div className="flex w-fit items-center gap-2 rounded-full bg-gray-800/80 px-4 py-2 text-sm font-medium text-gray-100 shadow-xl ring-1 ring-gray-700/50 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          dev db
        </div>
      )}
    </div>
  )
}
