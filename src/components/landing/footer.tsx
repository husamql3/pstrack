import Link from 'next/link'

import { version } from '@/data/CONSTANTS'

const Footer = () => {
  return (
    <footer className="mx-auto flex w-full max-w-screen-md justify-between pb-5 text-sm">
      <p className="dark-fit text-sm">
        © {new Date().getFullYear()} PSTrack. | v{version}
      </p>

      <div>
        <span>Crafted by</span>
        <Link
          href="https://www.linkedin.com/in/husamahmud/"
          className="ml-1 text-xs font-semibold"
        >
          @Hüsam
        </Link>
      </div>
    </footer>
  )
}

export default Footer
