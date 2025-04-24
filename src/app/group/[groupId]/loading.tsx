import { cn } from '@/utils/cn'

const Loading = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1
        className={cn(
          'bg-[linear-gradient(110deg,#bfbfbf,35%,#000,50%,#bfbfbf,75%,#bfbfbf)] dark:bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)]',
          'bg-[length:200%_100%] bg-clip-text text-lg font-medium text-transparent',
          'animate-text-gradient'
        )}
      >
        Loading...
      </h1>
    </div>
  )
}

export default Loading
