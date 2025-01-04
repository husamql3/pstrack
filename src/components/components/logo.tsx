import Image from 'next/image'

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
