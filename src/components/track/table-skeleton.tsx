import { Skeleton } from '@/components/ui/skeleton'

export const TableSkeleton = () => {
  return (
    <div className="mx-auto max-w-5xl flex-1 py-5">
      <div className="mx-auto w-fit">
        {/* Table Header */}
        <div className="flex border-b border-zinc-700">
          {[...Array(7)].map((_, index) => (
            <div
              key={index}
              className="px-4 py-2"
            >
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Table Rows */}
        {[...Array(7)].map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex border-b border-zinc-700 py-2"
          >
            {[...Array(7)].map((_, cellIndex) => (
              <div
                key={cellIndex}
                className="px-4 py-2"
              >
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
