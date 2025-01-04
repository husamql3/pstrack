// import Link from 'next/link'
// import { cn } from '@/lib/utils'
import Image from 'next/image'

// type LogoProps = {
//   size?: 'sm' | 'md' | 'lg'
// }

const Logo = ({ ...props }) => {
  return (
    <Image
      src="/logo-white.png"
      alt="logo"
      width={100}
      height={100}
      className="h-10 w-10 object-contain object-center"
      {...props}
    />
  )
}

export { Logo }

// const sizes = {
//   sm: 'text-2xl',
//   md: 'text-3xl',
//   lg: 'text-5xl',
// }
// const Logo = ({ size = 'md' }: LogoProps) => {
//   return (
//     <Link
//       href="/"
//       className="flex items-center justify-center"
//     >
//       <p
//         className={cn(
//           'h-fit font-spartan text-3xl font-bold tracking-[-5px] text-zinc-50',
//           sizes[size]
//         )}
//       >
//         PS
//       </p>
//     </Link>
//   )
// }
//
// export default Logo
