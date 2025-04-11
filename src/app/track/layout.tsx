import TrackHeader from '@/app/track/_components/track-header'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full min-h-svh flex-col">
      <TrackHeader />

      <main className="h-full flex-1">{children}</main>
    </div>
  )
}

export default Layout
