import Link from 'next/link'

import { Logo } from '@/components/components/logo'
import { Button } from '@/components/ui/button'

const Header = () => {
  return (
    <header className="mx-auto flex w-full max-w-screen-md justify-between pt-10">
      <Logo />

      <Link
        prefetch
        href="/login"
      >
        <Button>Login</Button>
      </Link>
    </header>
  )
}

export default Header
