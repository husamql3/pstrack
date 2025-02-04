import Link from 'next/link'
import Image from 'next/image'

const Logo = ({ ...props }) => {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      prefetch
    >
      <Image
        src="/logo-white.png"
        alt="logo"
        width={100}
        height={100}
        className="h-10 w-10 object-contain object-center"
        {...props}
      />
    </Link>
  )
}

export { Logo }
