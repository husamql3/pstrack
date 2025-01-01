import Link from 'next/link'
import { cn } from '@/lib/utils'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-5xl',
}

const Logo = ({ size = 'md' }: LogoProps) => {
  return (
    <Link
      href="/"
      className="flex items-center justify-center"
    >
      <p
        className={cn('font-spartan text-3xl font-bold tracking-[-5px] text-zinc-50', sizes[size])}
      >
        PS
      </p>
    </Link>
  )
}

export default Logo
