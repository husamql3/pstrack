import { env } from '@/config/env.mjs'

export const DevTab = () => {
  const prod = env.NODE_ENV === 'production'
  if (prod) return null

  const isDevDb = env.DATABASE_URL.toLowerCase().includes('pstrack-dev')
  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col items-center gap-3">
      {isDevDb ? (
        <div className="flex w-fit items-center gap-2 rounded-full bg-gray-800/80 px-4 py-2 text-sm font-medium text-gray-100 shadow-xl ring-1 ring-gray-700/50 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          dev db
        </div>
      ) : (
        <div className="flex w-fit items-center gap-2 rounded-full bg-gray-800/80 px-4 py-2 text-sm font-medium text-gray-100 shadow-xl ring-1 ring-gray-700/50 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          prod db
        </div>
      )}
    </div>
  )
}
