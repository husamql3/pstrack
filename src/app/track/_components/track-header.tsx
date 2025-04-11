import { UserAuth } from '@/app/_components/user-auth'
import { Logo } from '@/app/_components/logo'

const TrackHeader = () => {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 pt-5 pb-2">
      <Logo />
      <UserAuth />
    </header>
  )
}

export default TrackHeader
