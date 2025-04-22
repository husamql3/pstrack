import { VERSION } from '@/data/constants'

export const Footer = () => {
  return (
    <footer className="hidden w-full py-4 sm:block">
      <div className="mx-auto max-w-5xl px-4 text-center text-white">
        <span>Built by </span>
        <a
          href="https://www.husam.ninja/"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-semibold underline decoration-blue-800 underline-offset-2"
        >
          @Hüsam
        </a>
        <span>. The source code is available on </span>
        <a
          href="https://github.com/pstack-org/pstrack"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-semibold underline decoration-blue-800 underline-offset-2"
        >
          GitHub
        </a>
        <span>. </span>
        <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-sm font-medium text-white/80">
          v{VERSION}
        </span>
      </div>
    </footer>
  )
}
