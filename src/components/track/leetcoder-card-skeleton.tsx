import { Skeleton } from '@/components/ui/skeleton'

const LeetCoderCardSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="aspect-square h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
      <Skeleton className="h-4 w-[200px]" />
      <div className="flex space-x-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="size-5 rounded-full" />
      </div>
    </div>
  )
}

export default LeetCoderCardSkeleton
