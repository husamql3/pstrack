import { VERSION } from '@/data/CONSTANTS'

const Footer = () => {
  return (
    <footer className="mx-auto flex w-full max-w-screen-md justify-between px-3 pb-5 text-sm md:px-3">
      <p className="dark-fit text-sm">
        © {new Date().getFullYear()} PSTrack. | v{VERSION}
      </p>

      <div>
        <span>Crafted by</span>
        <a
          href="https://www.linkedin.com/in/husamahmud/"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="ml-1 text-xs font-semibold transition-all duration-200 hover:underline"
        >
          @Hüsam
        </a>
      </div>
    </footer>
  )
}

export default Footer
