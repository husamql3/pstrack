import { Footer } from '@/app/_components/footer'
import { Hero } from '@/app/_components/hero'
import { Header } from '@/app/_components/header'

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <Hero />
      <Footer />
    </div>
  )
}
