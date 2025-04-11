import { VERSION } from '@/data/constants'

export const Footer = () => {
  return (
    <footer className="mx-auto w-full max-w-3xl py-5">
      <div className="flex items-center justify-between">
        <p className="dark-fit text-sm">© 2025 PSTrack. | v{VERSION}</p>

        <div>
          <span>Crafted by</span>
          <a
            href="https://www.linkedin.com/in/husamahmud/"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="ml-1 font-semibold transition-all duration-200 hover:underline"
          >
            @Hüsam
          </a>
        </div>
      </div>
    </footer>
  )
}
