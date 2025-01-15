import Link from 'next/link'

import { Logo } from '@/components/components/logo'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'

const Header = () => {
  return (
    <header className="mx-auto flex w-full max-w-screen-md justify-between pt-10">
      <Logo />

      <Link
        prefetch
        href="/login"
      >
        <Button
          variant="outline"
          className="h-10 rounded-full border-2 px-5 text-sm font-medium"
        >
          Login
          <LogIn size={7} />
        </Button>
      </Link>
    </header>
  )
}

export default Header
