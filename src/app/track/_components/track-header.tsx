import Image from 'next/image'

import { UserMenu } from '@/components/auth/user-menu'

const TrackHeader = () => {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 pt-5 pb-2">
      <Image
        src="/logo-white.png"
        alt="PSTrack Logo"
        width={100}
        height={100}
        className="size-9"
      />

      <UserMenu />
    </header>
  )
}

export default TrackHeader
