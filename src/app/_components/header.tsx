import { cn } from '@/utils/cn'

export const Header = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <header
      className={cn('mx-auto flex w-full max-w-4xl flex-row items-center justify-between px-3 pt-8 pb-5', className)}
    >
      {children}
    </header>
  )
}
