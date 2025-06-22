import Image from 'next/image'
import Link from 'next/link'
import { LoginCard } from '@/app/(auth)/_components/login-card'
import logo from '../../../../public/logo.png'

const Page = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Link href="/">
        <Image
          src={logo}
          alt="PSTrack Logo"
          width={100}
          height={100}
          className="mb-4 h-16 w-16"
          priority
        />
      </Link>

      <div className="w-full max-w-sm px-3">
        <LoginCard />
      </div>
    </div>
  )
}

export default Page
