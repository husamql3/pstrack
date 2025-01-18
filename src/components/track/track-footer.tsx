import { Bug } from 'lucide-react'
import { IoLogoGithub } from 'react-icons/io5'

import { version } from '@/data/CONSTANTS'

import { Button } from '@/components/ui/button'

export const TrackFooter = () => {
  return (
    <footer className="mx-auto flex w-full max-w-screen-lg items-end justify-between px-3 pb-2 text-sm md:px-3">
      <p className="dark-fit text-sm">
        © {new Date().getFullYear()} PSTrack. | v{version}
      </p>

      <div className="space-x-1">
        <a
          href="https://github.com/pstack-org/pstrack/issues/new?template=Blank+issue"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="ghost"
            size="sm"
            className="size-8"
          >
            <Bug />
          </Button>
        </a>

        <a
          href="https://github.com/pstack-org/pstrack"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="ghost"
            size="sm"
            className="size-8"
          >
            <IoLogoGithub />
          </Button>
        </a>
      </div>
    </footer>
  )
}
