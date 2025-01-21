import { Bug } from 'lucide-react'
import { IoLogoGithub } from 'react-icons/io5'

import { VERSION } from '@/data/CONSTANTS'

import { Button } from '@/components/ui/button'

export const TrackFooter = () => {
  return (
    <footer className="mx-auto flex w-full max-w-screen-lg items-center justify-between gap-2 px-3 pb-2 text-xs md:px-3 md:text-sm">
      <p className="dark-fit text-sm">
        © {new Date().getFullYear()} PSTrack. | v{VERSION}
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
