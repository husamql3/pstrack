import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-zinc-950">
      <h1 className="text-4xl font-bold text-zinc-50">404 - Not Found</h1>
      <p className="mt-2 text-zinc-50">The page you’re looking for doesn’t exist.</p>
      <Link
        href="/"
        className="mt-4 text-blue-600 hover:underline"
        prefetch
      >
        Go back home
      </Link>
    </div>
  )
}
