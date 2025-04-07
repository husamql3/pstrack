import Link from 'next/link'
import Image from 'next/image'

import { LoginCard } from '@/components/auth/login-card'
import logo from '../../../../public/logo-white.png'

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

      <LoginCard />
    </div>
  )
}

export default Page
