import Link from 'next/link'

const Logo = () => {
  return (
    <Link
      href="/"
      className="flex items-center justify-center"
    >
      <p className="font-spartan text-3xl font-bold tracking-[-5px] text-zinc-50">PS</p>
    </Link>
  )
}

export default Logo
